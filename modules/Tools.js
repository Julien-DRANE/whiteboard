// Outils de base pour le whiteboard
import { ShapeRect, ShapeEllipse, ShapeText, ShapePath, ShapeArrow, ShapeImage } from "./Shapes.js";

export class BaseTool {
  constructor(whiteboard) {
    this.wb = whiteboard;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
  }
  onMouseDown(pos, e) {}
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {}
}

export class SelectTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.wb.selectedShape = this.wb.findShapeAt(pos.x, pos.y);
  }
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {
    this.isDrawing = false;
  }
}

export class PencilTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.wb.ctx.beginPath();
    this.wb.ctx.moveTo(pos.x, pos.y);
  }
  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    this.wb.ctx.lineWidth = 2;
    this.wb.ctx.strokeStyle = this.wb.color;
    this.wb.ctx.lineTo(pos.x, pos.y);
    this.wb.ctx.stroke();
  }
  onMouseUp(pos, e) {
    this.isDrawing = false;
    this.wb.ctx.closePath();
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
  }
}

export class RectTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.startX = pos.x;
    this.startY = pos.y;
    this.tempRect = { x: this.startX, y: this.startY, w: 0, h: 0, color: this.wb.color };
  }
  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    this.tempRect.w = pos.x - this.startX;
    this.tempRect.h = pos.y - this.startY;
    this.wb.drawAll();
    this.wb.ctx.strokeStyle = this.wb.color;
    this.wb.ctx.strokeRect(this.startX, this.startY, this.tempRect.w, this.tempRect.h);
  }
  onMouseUp(pos, e) {
    this.isDrawing = false;
    this.wb.shapes.push(this.tempRect);
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
  }
}

export class EllipseTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.startX = pos.x;
    this.startY = pos.y;
  }
  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    let rx = (pos.x - this.startX) / 2;
    let ry = (pos.y - this.startY) / 2;
    this.wb.drawAll();
    this.wb.ctx.strokeStyle = this.wb.color;
    this.wb.ctx.beginPath();
    this.wb.ctx.ellipse(this.startX + rx, this.startY + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
    this.wb.ctx.stroke();
  }
  onMouseUp(pos, e) {
    this.isDrawing = false;
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
  }
}

export class ArrowTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.startX = pos.x;
    this.startY = pos.y;
  }
  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    this.wb.drawAll();
    const previewArrow = ShapeArrow.fromPoints(
      this.startX,
      this.startY,
      pos.x,
      pos.y,
      this.wb.color,
      2
    );
    previewArrow.draw(this.wb.ctx);
  }
  onMouseUp(pos, e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const finalArrow = ShapeArrow.fromPoints(
      this.startX,
      this.startY,
      pos.x,
      pos.y,
      this.wb.color,
      2
    );
    this.wb.shapes.push(finalArrow);
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
    this.wb.drawAll();
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
  }
}

export class TextTool extends BaseTool {
  onMouseDown(pos, e) {
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
  }
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {}
}

/* ===============================
   Outil Gomme (EraserTool)
   Supprime une forme si le curseur est "proche" de ses coins
=============================== */
export class EraserTool extends BaseTool {
  constructor(whiteboard) {
    super(whiteboard);
    this.eraserRadius = 20; // Rayon d'effacement
    this.isErasing = false;
  }

  onMouseDown(pos, e) {
    this.isErasing = true;
    this.erase(pos);
  }

  onMouseMove(pos, e) {
    if (this.isErasing) {
      this.erase(pos);
    }
  }

  onMouseUp(pos, e) {
    this.isErasing = false;
  }

  // Calcule les coins "rotatifs" de la forme
  getRotatedCorners(shape) {
    const hw = shape.w / 2;
    const hh = shape.h / 2;
    const localCorners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];
    const angle = shape.angle || 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return localCorners.map(pt => ({
      x: shape.x + pt.x * cos - pt.y * sin,
      y: shape.y + pt.x * sin + pt.y * cos
    }));
  }

  erase(pos) {
    const shapesToErase = [];
    for (let shape of this.wb.shapes) {
      // Si le curseur est à l'intérieur de la forme, on l'efface directement
      if (shape.contains(pos.x, pos.y)) {
        shapesToErase.push(shape);
        continue;
      }
      // Sinon, on vérifie si le curseur est proche d'un des coins
      const corners = this.getRotatedCorners(shape);
      let close = corners.some(corner => {
        const dx = pos.x - corner.x;
        const dy = pos.y - corner.y;
        return Math.sqrt(dx * dx + dy * dy) < this.eraserRadius;
      });
      if (close) {
        shapesToErase.push(shape);
      }
    }
    shapesToErase.forEach(shape => {
      const index = this.wb.shapes.indexOf(shape);
      if (index !== -1) {
        this.wb.shapes.splice(index, 1);
      }
    });
    this.wb.drawAll();
  }
}

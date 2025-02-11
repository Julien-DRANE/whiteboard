// Exemple d'implémentation basique de différents outils.
// À adapter ou compléter selon la logique de votre Whiteboard.

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
    //setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10); // Retour à l'outil sélection
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
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10); // Retour à l'outil sélection
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
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10); // Retour à l'outil sélection
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
    const previewArrow = ShapeArrow.fromPoints(this.startX, this.startY, pos.x, pos.y, this.wb.color, 2);
    previewArrow.draw(this.wb.ctx);
  }
  onMouseUp(pos, e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const finalArrow = ShapeArrow.fromPoints(this.startX, this.startY, pos.x, pos.y, this.wb.color, 2);
    this.wb.shapes.push(this.tempRect);
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10);
    this.wb.drawAll();
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10); // Retour à l'outil sélection
  }
}

export class TextTool extends BaseTool {
  onMouseDown(pos, e) {
    setTimeout(() => this.wb.setTool(new SelectTool(this.wb)), 10); // Retour à l'outil sélection après ajout
  }
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {}
}

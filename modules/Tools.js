// Exemple d'implémentation basique de différents outils.
// À adapter ou compléter selon la logique de votre Whiteboard.

import { ShapeArrow } from "./Shapes.js";

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
  onMouseMove(pos, e) {
    // éventuellement : si on veut déplacer la forme sélectionnée en temps réel
  }
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
    // On pourrait stocker la trace comme une forme (ShapePath) si on veut la rejouer
  }
}

export class RectTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.startX = pos.x;
    this.startY = pos.y;
    // Crée un rectangle et l'ajoute
    this.tempRect = {
      x: this.startX, y: this.startY, w: 0, h: 0, color: this.wb.color
    };
    // Si tu gères des classes (ShapeRect), fais comme :
    // this.tempShape = new ShapeRect(pos.x, pos.y, 0, 0, this.wb.color);
    // this.wb.addShape(this.tempShape);
  }
  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    let w = pos.x - this.startX;
    let h = pos.y - this.startY;
    this.tempRect.w = w;
    this.tempRect.h = h;
    // Si ShapeRect : this.tempShape.w = w; this.tempShape.h = h;
    this.wb.drawAll();
    // Dessin "temporaire" direct :
    this.wb.ctx.save();
    this.wb.ctx.strokeStyle = this.wb.color;
    this.wb.ctx.strokeRect(this.startX, this.startY, w, h);
    this.wb.ctx.restore();
  }
  onMouseUp(pos, e) {
    this.isDrawing = false;
    // Ajouter la forme finale à wb.shapes, ou la compléter si c'est déjà fait
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
    this.wb.ctx.save();
    this.wb.ctx.beginPath();
    this.wb.ctx.strokeStyle = this.wb.color;
    this.wb.ctx.ellipse(
      this.startX + rx,
      this.startY + ry,
      Math.abs(rx),
      Math.abs(ry),
      0, 0, 2 * Math.PI
    );
    this.wb.ctx.stroke();
    this.wb.ctx.restore();
  }
  onMouseUp(pos, e) {
    this.isDrawing = false;
  }
}

export class TextTool extends BaseTool {
  onMouseDown(pos, e) {
    // On pourrait directement créer un ShapeText
    // ou afficher un input pour saisir le texte
  }
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {}
}

export class ImageTool extends BaseTool {
  onMouseDown(pos, e) {
    // Soit on charge une image, soit on attend un drop, etc.
  }
  onMouseMove(pos, e) {}
  onMouseUp(pos, e) {}
}

/* -----------------------------------------------------------
   Outil flèche (ArrowTool)
   Cet outil remplace l'ancienne version et permet de tracer
   une flèche par clic-glisser en définissant directement sa
   direction et sa longueur.
------------------------------------------------------------- */
export class ArrowTool extends BaseTool {
  onMouseDown(pos, e) {
    this.isDrawing = true;
    this.startX = pos.x;
    this.startY = pos.y;
  }

  onMouseMove(pos, e) {
    if (!this.isDrawing) return;
    // Redessiner toutes les formes existantes
    this.wb.drawAll();
    // Afficher un aperçu de la flèche en cours (utilisation de fromPoints)
    const previewArrow = ShapeArrow.fromPoints(
      this.startX,
      this.startY,
      pos.x,
      pos.y,
      this.wb.color,
      2 // ou utilisez this.wb.lineWidth si défini
    );
    previewArrow.draw(this.wb.ctx);
  }

  onMouseUp(pos, e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    // Créer la flèche finale et l'ajouter aux formes du whiteboard
    const finalArrow = ShapeArrow.fromPoints(
      this.startX,
      this.startY,
      pos.x,
      pos.y,
      this.wb.color,
      2
    );
    this.wb.shapes.push(finalArrow);
    this.wb.drawAll();
  }
}

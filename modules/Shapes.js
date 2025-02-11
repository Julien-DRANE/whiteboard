/*******************************************************
 * Modules/Shapes.js
 * Classes de formes avec texte multiligne
 *******************************************************/

// ShapeRect
export class ShapeRect {
  constructor(x, y, w, h, angle = 0, fillColor = "#ffffcc", strokeColor = "#000", strokeWidth = 2) {
    this.type = "rect";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
  
  contains(mx, my) {
    const { lx, ly } = this.globalToLocal(mx, my);
    return (lx >= -this.w / 2 && lx <= this.w / 2 && ly >= -this.h / 2 && ly <= this.h / 2);
  }
  
  getCenter() {
    return { cx: this.x, cy: this.y };
  }
  
  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }
  
  // Retourne la boîte englobante de la forme
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

// ShapeEllipse
export class ShapeEllipse {
  constructor(x, y, w, h, angle = 0, fillColor = "#ccffff", strokeColor = "#000", strokeWidth = 2) {
    this.type = "ellipse";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.stroke();
    ctx.restore();
  }
  
  contains(mx, my) {
    const { lx, ly } = this.globalToLocal(mx, my);
    const rx = this.w / 2, ry = this.h / 2;
    return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
  }
  
  getCenter() {
    return { cx: this.x, cy: this.y };
  }
  
  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }
  
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

// ShapeArrow
export class ShapeArrow {
  /**
   * Constructeur de ShapeArrow.
   * @param {number} x - Coordonnée x du centre de la flèche.
   * @param {number} y - Coordonnée y du centre de la flèche.
   * @param {number} length - Longueur de la flèche (distance entre le début et la fin).
   * @param {number} angle - Angle (en radians) définissant la direction.
   * @param {string} strokeColor - Couleur de la flèche.
   * @param {number} strokeWidth - Épaisseur de la flèche.
   */
  constructor(x, y, length, angle, strokeColor = "#000", strokeWidth = 2) {
    this.type = "arrow";
    this.x = x;
    this.y = y;
    this.length = length;
    this.angle = angle;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.headLength = 15;
    this.headAngle = Math.PI / 6;
  }

  /**
   * Crée une flèche à partir de deux points.
   * @param {number} x1 - Coordonnée x du point de départ.
   * @param {number} y1 - Coordonnée y du point de départ.
   * @param {number} x2 - Coordonnée x du point d'arrivée.
   * @param {number} y2 - Coordonnée y du point d'arrivée.
   * @param {string} strokeColor - Couleur de la flèche.
   * @param {number} strokeWidth - Épaisseur de la flèche.
   * @returns {ShapeArrow} Une nouvelle instance de ShapeArrow.
   */
  static fromPoints(x1, y1, x2, y2, strokeColor = "#000", strokeWidth = 2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    return new ShapeArrow(centerX, centerY, length, angle, strokeColor, strokeWidth);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(-this.length / 2, 0);
    ctx.lineTo(this.length / 2, 0);
    ctx.stroke();

    const adaptedHeadLength = this.headLength * (this.strokeWidth / 2);

    ctx.beginPath();
    ctx.moveTo(this.length / 2, 0);
    ctx.lineTo(
      this.length / 2 - adaptedHeadLength * Math.cos(this.headAngle),
      -adaptedHeadLength * Math.sin(this.headAngle)
    );
    ctx.moveTo(this.length / 2, 0);
    ctx.lineTo(
      this.length / 2 - adaptedHeadLength * Math.cos(this.headAngle),
      adaptedHeadLength * Math.sin(this.headAngle)
    );
    ctx.stroke();

    ctx.restore();
  }

  contains(mx, my) {
    const { lx, ly } = this.globalToLocal(mx, my);
    const tolerance = 5;
    return lx >= -this.length / 2 && lx <= this.length / 2 && Math.abs(ly) <= tolerance;
  }

  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }

  getCenter() {
    return { cx: this.x, cy: this.y };
  }

  getBoundingBox() {
    return {
      x: this.x - this.length / 2,
      y: this.y - this.strokeWidth - this.headLength,
      w: this.length + this.headLength,
      h: 2 * (this.strokeWidth + this.headLength)
    };
  }
}

// ShapePath
export class ShapePath {
  constructor(x, y, w, h, angle = 0, strokeColor = "#000", points = [], strokeWidth = 2) {
    this.type = "path";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.strokeColor = strokeColor;
    this.points = points;
    this.strokeWidth = strokeWidth;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  
  contains(mx, my) {
    const { lx, ly } = this.globalToLocal(mx, my);
    const hw = this.w / 2, hh = this.h / 2;
    return (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh);
  }
  
  scalePoints(rx, ry) {
    for (let p of this.points) {
      p.x *= rx;
      p.y *= ry;
    }
  }
  
  getCenter() {
    return { cx: this.x, cy: this.y };
  }
  
  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }
  
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

// ShapeImage
export class ShapeImage {
  constructor(x, y, w, h, angle = 0, src = "") {
    this.type = "image";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.src = src;
    this.img = new Image();
    this.img.src = src;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (this.img) {
      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
  
  contains(mx, my) {
    const { lx, ly } = this.globalToLocal(mx, my);
    return (lx >= -this.w / 2 && lx <= this.w / 2 && ly >= -this.h / 2 && ly <= this.h / 2);
  }
  
  getCenter() {
    return { cx: this.x, cy: this.y };
  }
  
  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }
  
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

/*******************************************************
 * ShapeText pour texte multi-ligne
 *******************************************************/
export class ShapeText {
  constructor(x, y, w, h, angle = 0, color = "#000", text = "", fontSize = 24) {
    this.type = "text";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.color = color;
    this.text = text; // Texte initial (vide par défaut)
    this.fontSize = fontSize;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Dessiner un cadre autour du texte
    ctx.strokeStyle = "#000000";  // Couleur du cadre
    ctx.lineWidth = 1;
    ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Préparer le texte
    let displayText = this.text.trim() !== "" ? this.text : "Tapez votre texte...";
    ctx.fillStyle = this.text.trim() !== "" ? this.color : "#888888";
    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    // Séparer le texte en lignes pour gérer les retours à la ligne
    let lines = displayText.split("\n");
    let lineHeight = this.fontSize * 1.2;
    let startX = -this.w / 2 + 5; // marge de 5px
    let startY = -this.h / 2 + 5; // marge de 5px
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], startX, startY + i * lineHeight, this.w - 10);
    }
    ctx.restore();
  }

  contains(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return (lx >= -this.w / 2 && lx <= this.w / 2 && ly >= -this.h / 2 && ly <= this.h / 2);
  }

  getCenter() {
    return { cx: this.x, cy: this.y };
  }
  
  globalToLocal(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { lx, ly };
  }

  /**
   * Met à jour le texte et recalcule les dimensions de la zone de texte.
   * Cette méthode tient compte des retours à la ligne.
   * @param {string} newText - Le nouveau texte.
   * @param {CanvasRenderingContext2D} ctx - Le contexte utilisé pour mesurer le texte.
   */
  setText(newText, ctx) {
    this.text = newText;
    ctx.save();
    ctx.font = `${this.fontSize}px Arial`;
    const lines = newText.split("\n");
    let maxWidth = 0;
    for (let line of lines) {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    }
    this.w = maxWidth + 10;
    const lineHeight = this.fontSize * 1.2;
    this.h = lines.length * lineHeight + 10;
    if (this.w < 50) this.w = 50;
    if (this.h < 30) this.h = 30;
    ctx.restore();
  }
  
  /**
   * Lance l'édition du texte pour cette forme.
   * @param {CanvasRenderingContext2D} ctx - Le contexte de dessin pour recalculer la taille.
   * @param {string} newText - Le texte édité.
   */
  edit(ctx, newText) {
    this.setText(newText, ctx);
  }
  
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

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

  constructor(x, y, w, h, angle = 0, strokeColor = "#000", strokeWidth = 2) {
  this.type = "arrow"; 
  this.x = x; 
  this.y = y; 
  this.w = w; 
  this.h = h; 
  this.angle = angle; 
  this.strokeColor = strokeColor;
  this.strokeWidth = strokeWidth;
  
  }
  
  
  draw(ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(this.angle);
  ctx.strokeStyle = this.strokeColor;
  ctx.lineWidth = this.strokeWidth;
  ctx.beginPath();
  const halfW = this.w / 2;
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(halfW, 0);
  ctx.lineTo(halfW - 15, -10);
  ctx.moveTo(halfW, 0);
  ctx.lineTo(halfW - 15, 10);
  ctx.stroke();
  ctx.restore();
  
  }
  
  
  contains(mx, my) {
  
  const { lx, ly } = this.globalToLocal(mx, my);
  
  const hw = this.w / 2, hh = this.h / 2 || 20;
  
  return (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh);
  
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
    // Afficher un placeholder si le texte est vide
    let displayText = this.text.trim() !== "" ? this.text : "Tapez votre texte...";
    ctx.fillStyle = this.text.trim() !== "" ? this.color : "#888888";
    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let lines = displayText.split("\n");
    let lineHeight = this.fontSize * 1.2;
    let startX = -this.w / 2 + 5;
    let startY = -this.h / 2 + 5;
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
  
  // Méthode ajoutée pour retourner la boîte englobante du texte
  getBoundingBox() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h
    };
  }
}

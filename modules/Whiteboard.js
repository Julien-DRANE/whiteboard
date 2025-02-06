import {
  ShapeRect,
  ShapeEllipse,
  ShapeText,
  ShapePath,
  ShapeArrow,
  ShapeImage
} from "./Shapes.js";

// Fonction qui recrée une instance de forme en fonction de son type
function reconstructShape(shapeData) {
  let shape;
  switch(shapeData.type) {
    case "rect":
      shape = new ShapeRect(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.fillColor,
        shapeData.strokeColor,
        shapeData.strokeWidth
      );
      break;
    case "ellipse":
      shape = new ShapeEllipse(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.fillColor,
        shapeData.strokeColor,
        shapeData.strokeWidth
      );
      break;
    case "arrow":
      // Pour reconstruire une flèche, on utilise ici ShapeArrow.fromPoints
      // En supposant que dans les données sauvegardées, on avait conservé x,y, w, h, angle, etc.
      // Si vous sauvegardez la flèche avec x et y correspondant au centre, vous pouvez recréer
      // directement une nouvelle instance. Ici, nous utilisons l'ancien constructeur pour la compatibilité.
      shape = new ShapeArrow(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.strokeColor,
        shapeData.strokeWidth
      );
      break;
    case "path":
      shape = new ShapePath(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.strokeColor,
        shapeData.points,  // Assurez-vous que la structure de points est conservée
        shapeData.strokeWidth
      );
      break;
    case "image":
      shape = new ShapeImage(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.src
      );
      break;
    case "text":
      shape = new ShapeText(
        shapeData.x,
        shapeData.y,
        shapeData.w,
        shapeData.h,
        shapeData.angle,
        shapeData.color || shapeData.strokeColor,  // selon ce que vous utilisez
        shapeData.text,
        shapeData.fontSize
      );
      break;
    default:
      // Si le type n'est pas reconnu, on retourne l'objet tel quel
      shape = shapeData;
  }
  return shape;
}

// Fonction qui recrée les pages en reconstruisant chaque forme
function reconstructPages(pagesData) {
  return pagesData.map(pageData => ({
    bgColor: pageData.bgColor,
    shapes: pageData.shapes.map(shapeData => reconstructShape(shapeData))
  }));
}

export default class Whiteboard {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Propriété de zoom (1 = 100%)
    this.zoomLevel = 1;

    // Propriétés de pan (translation globale)
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.initialPanOffsetX = 0;
    this.initialPanOffsetY = 0;

    // Multi-pages avec fond personnalisé
    this.pages = [{ shapes: [], bgColor: "#FFECD1" }];
    this.currentPageIndex = 0;
    this.shapes = this.pages[this.currentPageIndex].shapes;

    // Propriétés de base
    this.selectedShape = null;       // Sélection unique
    this.multiSelectedShapes = [];   // Sélection multiple
    // Outils possibles : "select", "hand", "pencil", "rect", "ellipse", "arrow", "text", "image"
    this.currentTool = "select";
    this.strokeColor = "#3D52D5";
    this.strokeWidth = 2;
    this.fillColor = "#70d6ff";

    // États de dessin et transformation
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.tempPoints = [];
    this.isMoving = false;
    this.isResizing = false;
    this.isRotating = false;
    this.resizeHandleIndex = -1;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // États pour la sélection multiple
    this.isSelectingMultiple = false;
    this.selectRectStart = null;
    this.selectRectCurrent = null;

    // États pour le déplacement groupé
    this.isGroupMoving = false;
    this.groupDragOffsets = [];

    window.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") &&
          (this.selectedShape || this.multiSelectedShapes.length)) {
        this.deleteSelected();
      }
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 40;
    this.drawAll();
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.panOffsetX) / this.zoomLevel,
      y: (e.clientY - rect.top - this.panOffsetY) / this.zoomLevel
    };
  }

  // --- Gestion du clic : sélection, rotation, redimensionnement, création, pan ---
  handleMouseDown(pos, snapping) {
    if (this.currentTool === "hand") {
      // Démarrer le panning
      this.isPanning = true;
      this.panStartX = pos.x;
      this.panStartY = pos.y;
      this.initialPanOffsetX = this.panOffsetX;
      this.initialPanOffsetY = this.panOffsetY;
      return;
    }
    if (this.currentTool === "select") {
      if (this.selectedShape) {
        let idx = this.getHandleIndexAtPos(pos.x, pos.y, this.selectedShape);
        if (idx >= 0) {
          if (idx === 4) {
            this.isRotating = true;
          } else {
            this.isResizing = true;
            this.resizeHandleIndex = idx;
          }
          return;
        }
      }
      if (this.multiSelectedShapes.length) {
        const clickedShape = this.findTopShapeAt(pos.x, pos.y);
        if (clickedShape && this.multiSelectedShapes.includes(clickedShape)) {
          this.isGroupMoving = true;
          this.groupDragOffsets = this.multiSelectedShapes.map(shape => ({
            offsetX: pos.x - shape.x,
            offsetY: pos.y - shape.y
          }));
          return;
        }
      }
      let shp = this.findTopShapeAt(pos.x, pos.y);
      if (shp) {
        this.multiSelectedShapes = [];
        this.isGroupMoving = false;
        this.selectedShape = shp;
        let { cx, cy } = shp.getCenter();
        this.dragOffsetX = pos.x - cx;
        this.dragOffsetY = pos.y - cy;
        this.isMoving = true;
        this.drawAll();
      } else {
        this.selectedShape = null;
        this.multiSelectedShapes = [];
        this.isGroupMoving = false;
        this.isSelectingMultiple = true;
        this.selectRectStart = pos;
        this.selectRectCurrent = pos;
        this.drawAll();
      }
    }
    else if (this.currentTool === "pencil") {
      this.isDrawing = true;
      this.tempPoints = [{ x: pos.x, y: pos.y }];
    }
    else if (this.currentTool === "rect") {
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      let r = new ShapeRect(pos.x, pos.y, 0, 0, 0, this.fillColor, this.strokeColor, this.strokeWidth);
      this.shapes.push(r);
      this.selectedShape = r;
      this.multiSelectedShapes = [];
      this.drawAll();
    }
    else if (this.currentTool === "ellipse") {
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      let e = new ShapeEllipse(pos.x, pos.y, 0, 0, 0, this.fillColor, this.strokeColor, this.strokeWidth);
      this.shapes.push(e);
      this.selectedShape = e;
      this.multiSelectedShapes = [];
      this.drawAll();
    }
    else if (this.currentTool === "arrow") {
      // Pour l'outil flèche, on stocke le point de départ et on attend le mousemove/mouseup
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      // On n'ajoute pas encore de flèche à this.shapes
    }
    else if (this.currentTool === "text") {
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      let t = new ShapeText(pos.x, pos.y, 0, 0, 0, this.strokeColor, "", 24);
      this.shapes.push(t);
      this.selectedShape = t;
      this.multiSelectedShapes = [];
      this.drawAll();
    }
  }

  // --- Mise à jour pendant le glissement ---
  handleMouseMove(pos, snapping) {
    if (this.isPanning) {
      const dx = pos.x - this.panStartX;
      const dy = pos.y - this.panStartY;
      this.panOffsetX = this.initialPanOffsetX + dx;
      this.panOffsetY = this.initialPanOffsetY + dy;
      this.drawAll();
      return;
    }
    if (this.isSelectingMultiple) {
      this.selectRectCurrent = pos;
      this.drawAll();
      return;
    }
    if (this.isGroupMoving) {
      this.multiSelectedShapes.forEach((shape, index) => {
        const offset = this.groupDragOffsets[index];
        shape.x = pos.x - offset.offsetX;
        shape.y = pos.y - offset.offsetY;
      });
      this.drawAll();
      return;
    }
    if (this.isResizing && this.selectedShape) {
      this.resizeShape(this.selectedShape, pos.x, pos.y);
      this.drawAll();
      return;
    }
    if (this.isRotating && this.selectedShape) {
      let { cx, cy } = this.selectedShape.getCenter();
      let angle = Math.atan2(pos.y - cy, pos.x - cx);
      this.selectedShape.angle = angle;
      this.drawAll();
      return;
    }
    if (this.isMoving && this.selectedShape) {
      let { cx, cy } = this.selectedShape.getCenter();
      let newCx = pos.x - this.dragOffsetX;
      let newCy = pos.y - this.dragOffsetY;
      if (snapping) {
        newCx = this.snapToGrid(newCx, 20);
        newCy = this.snapToGrid(newCy, 20);
      }
      let dx = newCx - cx;
      let dy = newCy - cy;
      this.selectedShape.x += dx;
      this.selectedShape.y += dy;
      this.drawAll();
      return;
    }
    if (this.isDrawing && this.currentTool === "pencil") {
      this.tempPoints.push({ x: pos.x, y: pos.y });
      this.drawAll();
      this.ctx.save();
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.lineWidth = this.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(this.tempPoints[0].x, this.tempPoints[0].y);
      for (let i = 1; i < this.tempPoints.length; i++) {
        this.ctx.lineTo(this.tempPoints[i].x, this.tempPoints[i].y);
      }
      this.ctx.stroke();
      this.ctx.restore();
    }
    // Outils de création : rect, ellipse, arrow
    if (this.isDrawing && this.currentTool === "rect" && this.selectedShape) {
      let dx = pos.x - this.startX;
      let dy = pos.y - this.startY;
      let cx = (this.startX + pos.x) / 2;
      let cy = (this.startY + pos.y) / 2;
      if (snapping) {
        cx = this.snapToGrid(cx, 20);
        cy = this.snapToGrid(cy, 20);
      }
      let r = this.selectedShape;
      r.x = cx;
      r.y = cy;
      r.w = Math.abs(dx);
      r.h = Math.abs(dy);
      this.drawAll();
    }
    if (this.isDrawing && this.currentTool === "ellipse" && this.selectedShape) {
      let dx = pos.x - this.startX;
      let dy = pos.y - this.startY;
      let cx = (this.startX + pos.x) / 2;
      let cy = (this.startY + pos.y) / 2;
      if (snapping) {
        cx = this.snapToGrid(cx, 20);
        cy = this.snapToGrid(cy, 20);
      }
      let e = this.selectedShape;
      e.x = cx;
      e.y = cy;
      e.w = Math.abs(dx);
      e.h = Math.abs(dy);
      this.drawAll();
    }
    if (this.isDrawing && this.currentTool === "arrow") {
      // Afficher un aperçu dynamique de la flèche
      this.drawAll();
      let previewArrow = ShapeArrow.fromPoints(
        this.startX,
        this.startY,
        pos.x,
        pos.y,
        this.strokeColor,
        this.strokeWidth
      );
      previewArrow.draw(this.ctx);
    }
  }

  // --- Finalisation du dessin ---
  handleMouseUp(pos, snapping) {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }
    if (this.isSelectingMultiple) {
      this.isSelectingMultiple = false;
      const x1 = Math.min(this.selectRectStart.x, this.selectRectCurrent.x);
      const y1 = Math.min(this.selectRectStart.y, this.selectRectCurrent.y);
      const x2 = Math.max(this.selectRectStart.x, this.selectRectCurrent.x);
      const y2 = Math.max(this.selectRectStart.y, this.selectRectCurrent.y);
      
      this.multiSelectedShapes = [];
      for (let shape of this.shapes) {
        let bbox = shape.getBoundingBox();
        if (bbox.x >= x1 && bbox.y >= y1 &&
            bbox.x + bbox.w <= x2 && bbox.y + bbox.h <= y2) {
          this.multiSelectedShapes.push(shape);
        }
      }
      this.selectedShape = null;
      this.selectRectStart = null;
      this.selectRectCurrent = null;
      this.drawAll();
      return;
    }
    if (this.isGroupMoving) {
      this.isGroupMoving = false;
      this.groupDragOffsets = [];
      this.drawAll();
      return;
    }
    if (this.isDrawing && this.currentTool === "pencil" && this.tempPoints.length > 1) {
      let minX = this.tempPoints[0].x, maxX = minX;
      let minY = this.tempPoints[0].y, maxY = minY;
      for (let p of this.tempPoints) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      let w = maxX - minX;
      let h = maxY - minY;
      let cx = minX + w / 2;
      let cy = minY + h / 2;
      if (snapping) {
        cx = this.snapToGrid(cx, 20);
        cy = this.snapToGrid(cy, 20);
      }
      let localPoints = this.tempPoints.map(pt => ({ x: pt.x - cx, y: pt.y - cy }));
      let path = new ShapePath(cx, cy, w, h, 0, this.strokeColor, localPoints, this.strokeWidth);
      this.shapes.push(path);
      this.selectedShape = path;
    }
    if (this.isDrawing && this.currentTool === "text") {
      this.isDrawing = false;
      let t = this.selectedShape;
      if (t.w < 50) t.w = 50;
      if (t.h < 30) t.h = 30;
      this.drawAll();
      let textEditor = document.getElementById("textEditor");
      if (textEditor) {
        textEditor.style.display = "block";
        textEditor.style.left = (t.x - this.canvas.offsetLeft - t.w / 2) + "px";
        textEditor.style.top = (t.y - this.canvas.offsetTop - t.h / 2) + "px";
        textEditor.style.width = (t.w + 20) + "px";
        textEditor.style.height = (t.h + 20) + "px";
        textEditor.innerText = t.text || "Tapez votre texte...";
        textEditor.style.fontSize = t.fontSize + "px";
        textEditor.focus();
        setTimeout(() => { document.execCommand("selectAll", false, null); }, 0);
      }
    }
    // Finalisation pour l'outil flèche
    if (this.isDrawing && this.currentTool === "arrow") {
      let finalArrow = ShapeArrow.fromPoints(
        this.startX,
        this.startY,
        pos.x,
        pos.y,
        this.strokeColor,
        this.strokeWidth
      );
      this.shapes.push(finalArrow);
      this.selectedShape = finalArrow;
      this.drawAll();
    }
    this.isDrawing = false;
    this.isMoving = false;
    this.isResizing = false;
    this.isRotating = false;
    this.resizeHandleIndex = -1;
    this.tempPoints = [];
  }

  // --- Edition du texte par double-clic ---
  handleDoubleClick(pos, textEditor) {
    const shp = this.findTopShapeAt(pos.x, pos.y);
    if (!shp) return;
    
    if (shp.type === "text") {
      this.selectedShape = shp;
      let { cx, cy } = shp.getCenter();
      this.showTextEditor(shp, textEditor, cx, cy);
      return;
    }
    
    if (this.currentTool === "text") {
      let defaultTxt = "Texte...";
      let fontSize = 24;
      let t = new ShapeText(pos.x, pos.y, 100, 50, 0, this.strokeColor, defaultTxt, fontSize);
      this.ctx.save();
      this.ctx.font = `${fontSize}px Arial`;
      let met = this.ctx.measureText(defaultTxt);
      t.w = met.width + 10;
      t.h = fontSize + 10;
      this.ctx.restore();
      this.shapes.push(t);
      this.selectedShape = t;
      this.drawAll();
      textEditor.style.display = "block";
      textEditor.style.left = (pos.x - this.canvas.offsetLeft) + "px";
      textEditor.style.top = (pos.y - this.canvas.offsetTop - fontSize / 2) + "px";
      textEditor.style.width = (t.w + 20) + "px";
      textEditor.style.height = (t.h + 20) + "px";
      textEditor.innerText = defaultTxt;
      textEditor.style.fontSize = fontSize + "px";
      textEditor.focus();
      setTimeout(() => { document.execCommand("selectAll", false, null); }, 0);
    }
  }

  showTextEditor(shape, textEditor, x, y) {
    let fs = shape.fontSize || 24;
    textEditor.style.display = "block";
    textEditor.style.left = (x - this.canvas.offsetLeft) + "px";
    textEditor.style.top = (y - this.canvas.offsetTop - fs / 2) + "px";
    textEditor.style.width = (shape.w ? shape.w + 20 : 200) + "px";
    textEditor.style.height = (shape.h ? shape.h + 20 : 60) + "px";
    textEditor.innerText = shape.text;
    textEditor.style.fontSize = fs + "px";
    textEditor.focus();
  }

  applyTextEditor(textEditor) {
    textEditor.style.display = "none";
    if (!this.selectedShape) return;
    if (this.selectedShape.type !== "text") return;
    this.selectedShape.text = textEditor.innerText;
    this.ctx.save();
    this.ctx.font = `${this.selectedShape.fontSize}px Arial`;
    let m = this.ctx.measureText(this.selectedShape.text);
    this.selectedShape.w = m.width + 10;
    this.selectedShape.h = this.selectedShape.fontSize + 10;
    this.ctx.restore();
    this.drawAll();
    this.currentTool = "select";
  }

  // --- Snapping ---
  snapToGrid(value, gridSize = 20) {
    return Math.round(value / gridSize) * gridSize;
  }

  // --- Recherche de la forme au-dessus ---
  findTopShapeAt(mx, my) {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (this.shapes[i].contains(mx, my)) {
        return this.shapes[i];
      }
    }
    return null;
  }

  // --- Redessin complet avec Zoom et Pan ---
  drawAll() {
    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner le fond en tenant compte du pan et du zoom
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Appliquer d'abord le pan, puis le zoom
    this.ctx.translate(this.panOffsetX, this.panOffsetY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    let currentPage = this.pages[this.currentPageIndex];
    let bg = currentPage.bgColor || "#ffffff";
    this.ctx.fillStyle = bg;
    // On dessine le fond en dimensions logiques
    this.ctx.fillRect(0, 0, this.canvas.width / this.zoomLevel, this.canvas.height / this.zoomLevel);
    this.ctx.restore();

    // Dessiner le contenu (formes, sélections, etc.)
    this.ctx.save();
    this.ctx.translate(this.panOffsetX, this.panOffsetY);
    this.ctx.scale(this.zoomLevel, this.zoomLevel);
    
    // Dessiner chaque forme avec ombre
    for (let s of this.pages[this.currentPageIndex].shapes) {
      this.ctx.save();
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
      s.draw(this.ctx);
      this.ctx.restore();
    }
    
    // Sélection unique
    if (this.selectedShape) {
      this.drawSelectionOutline(this.selectedShape);
    }
    // Sélection multiple
    if (this.multiSelectedShapes.length) {
      for (let s of this.multiSelectedShapes) {
        this.drawSelectionOutline(s, "#00ff00");
      }
    }
    // Rectangle de sélection multiple
    if (this.isSelectingMultiple && this.selectRectStart && this.selectRectCurrent) {
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(0,200,200,0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 3]);
      const x = Math.min(this.selectRectStart.x, this.selectRectCurrent.x);
      const y = Math.min(this.selectRectStart.y, this.selectRectCurrent.y);
      const w = Math.abs(this.selectRectStart.x - this.selectRectCurrent.x);
      const h = Math.abs(this.selectRectStart.y - this.selectRectCurrent.y);
      this.ctx.strokeRect(x, y, w, h);
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  // --- Affichage du cadre de sélection et des poignées ---
  drawSelectionOutline(shape, outlineColor = "#ff0000") {
    this.ctx.save();
    this.ctx.translate(shape.x, shape.y);
    this.ctx.rotate(shape.angle || 0);
    this.ctx.setLineDash([4, 2]);
    this.ctx.strokeStyle = outlineColor;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(-shape.w / 2, -shape.h / 2, shape.w, shape.h);
    
    // Poignées aux coins
    const handleSize = 8;
    const halfW = shape.w / 2;
    const halfH = shape.h / 2;
    const handles = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: -halfW, y: halfH },
      { x: halfW, y: halfH }
    ];
    this.ctx.fillStyle = "#ffffff";
    for (let h of handles) {
      this.ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    }
    
    // Poignée de rotation (cercle au-dessus du centre)
    const rotationHandleY = -halfH - 20;
    this.ctx.beginPath();
    this.ctx.arc(0, rotationHandleY, 6, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  // --- Détection des poignées (coins et rotation) ---
  getHandleIndexAtPos(mx, my, shape) {
    let { lx, ly } = shape.globalToLocal(mx, my);
    const toleranceCorner = 10;
    const toleranceRotation = 12;
    let hw = shape.w / 2, hh = shape.h / 2;
    let corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: -hw, y: hh },
      { x: hw, y: hh }
    ];
    let rotationHandle = { x: 0, y: -hh - 20 };
    for (let i = 0; i < corners.length; i++) {
      if (Math.abs(lx - corners[i].x) < toleranceCorner &&
          Math.abs(ly - corners[i].y) < toleranceCorner) {
        return i;
      }
    }
    let dx = lx - rotationHandle.x, dy = ly - rotationHandle.y;
    if (Math.sqrt(dx * dx + dy * dy) < toleranceRotation) return 4;
    return -1;
  }

  // --- Redimensionnement ---
  resizeShape(shape, mx, my) {
    let { lx, ly } = shape.globalToLocal(mx, my);
    let hw = shape.w / 2, hh = shape.h / 2;
    let left = -hw, right = hw, top = -hh, bottom = hh;
    switch (this.resizeHandleIndex) {
      case 0: left = lx; top = ly; break;
      case 1: right = lx; top = ly; break;
      case 2: left = lx; bottom = ly; break;
      case 3: right = lx; bottom = ly; break;
    }
    if (left > right) [left, right] = [right, left];
    if (top > bottom) [top, bottom] = [bottom, top];
    let newW = right - left, newH = bottom - top;
    let oldW = shape.w, oldH = shape.h;
    let rx = newW / oldW, ry = newH / oldH;
    shape.w = newW;
    shape.h = newH;
    if (shape.type === "text") {
      let ratio = Math.min(rx, ry);
      if (!isFinite(ratio) || ratio <= 0) ratio = 1;
      shape.fontSize *= ratio;
      this.ctx.save();
      this.ctx.font = `${shape.fontSize}px Arial`;
      let m = this.ctx.measureText(shape.text);
      shape.w = m.width + 10;
      shape.h = shape.fontSize + 10;
      this.ctx.restore();
    }
    if (shape.type === "path") {
      shape.scalePoints(rx, ry);
    }
    let cx = left + newW / 2, cy = top + newH / 2;
    let cos = Math.cos(shape.angle), sin = Math.sin(shape.angle);
    let gx = shape.x + (cx * cos - cy * sin);
    let gy = shape.y + (cx * sin + cy * cos);
    shape.x = gx;
    shape.y = gy;
  }

  // --- Suppression de la forme sélectionnée ---
  deleteSelected() {
    if (this.selectedShape) {
      let i = this.shapes.indexOf(this.selectedShape);
      if (i >= 0) {
        this.shapes.splice(i, 1);
      }
      this.selectedShape = null;
    }
    if (this.multiSelectedShapes.length) {
      for (let shape of this.multiSelectedShapes) {
        let index = this.shapes.indexOf(shape);
        if (index >= 0) {
          this.shapes.splice(index, 1);
        }
      }
      this.multiSelectedShapes = [];
    }
    this.drawAll();
  }

  exportPNG() {
    let data = this.canvas.toDataURL("image/png");
    let a = document.createElement("a");
    a.href = data;
    a.download = "whiteboard.png";
    a.click();
  }

  exportJSON() {
    let data = JSON.stringify(this.pages);
    let blob = new Blob([data], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(file) {
    let reader = new FileReader();
    reader.onload = (e) => {
      let arr = JSON.parse(e.target.result);
      // Reconstruction des pages et des formes à partir des données JSON
      this.pages = reconstructPages(arr);
      if (!Array.isArray(this.pages) || !this.pages.length) {
        this.pages = [{ shapes: [], bgColor: "#ffffff" }];
      }
      this.currentPageIndex = 0;
      this.shapes = this.pages[this.currentPageIndex].shapes;
      this.selectedShape = null;
      this.multiSelectedShapes = [];
      this.drawAll();
    };
    reader.readAsText(file);
  }

  addImageAt(dataURL, x, y) {
    let img = new ShapeImage(x, y, 200, 150, 0, dataURL);
    this.shapes.push(img);
    this.selectedShape = img;
    this.multiSelectedShapes = [];
    this.drawAll();
  }

  nextPage() {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.currentPageIndex++;
    } else {
      this.pages.push({ shapes: [], bgColor: "#ffffff" });
      this.currentPageIndex = this.pages.length - 1;
    }
    this.shapes = this.pages[this.currentPageIndex].shapes;
    this.selectedShape = null;
    this.multiSelectedShapes = [];
    this.drawAll();
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.shapes = this.pages[this.currentPageIndex].shapes;
      this.selectedShape = null;
      this.multiSelectedShapes = [];
      this.drawAll();
    }
  }

  // --- Fonctions de réorganisation des couches ---
  bringToFront(shape) {
    let index = this.shapes.indexOf(shape);
    if (index > -1) {
      this.shapes.splice(index, 1);
      this.shapes.push(shape);
      this.drawAll();
    }
  }

  sendToBack(shape) {
    let index = this.shapes.indexOf(shape);
    if (index > -1) {
      this.shapes.splice(index, 1);
      this.shapes.unshift(shape);
      this.drawAll();
    }
  }

  moveUp(shape) {
    let index = this.shapes.indexOf(shape);
    if (index > -1 && index < this.shapes.length - 1) {
      [this.shapes[index], this.shapes[index + 1]] = [this.shapes[index + 1], this.shapes[index]];
      this.drawAll();
    }
  }

  moveDown(shape) {
    let index = this.shapes.indexOf(shape);
    if (index > 0) {
      [this.shapes[index], this.shapes[index - 1]] = [this.shapes[index - 1], this.shapes[index]];
      this.drawAll();
    }
  }
}

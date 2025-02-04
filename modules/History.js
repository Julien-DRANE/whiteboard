import {
  ShapeRect,
  ShapeEllipse,
  ShapeText,
  ShapePath,
  ShapeArrow,
  ShapeImage
} from "./Shapes.js";

/**
 * Recrée une instance de forme en fonction du type.
 * On utilise Object.assign pour copier les propriétés depuis l'objet sauvegardé.
 */
function reconstructShape(shapeData) {
  switch (shapeData.type) {
    case "rect":
      return Object.assign(new ShapeRect(), shapeData);
    case "ellipse":
      return Object.assign(new ShapeEllipse(), shapeData);
    case "text":
      return Object.assign(new ShapeText(), shapeData);
    case "path":
      return Object.assign(new ShapePath(), shapeData);
    case "arrow":
      return Object.assign(new ShapeArrow(), shapeData);
    case "image":
      return Object.assign(new ShapeImage(), shapeData);
    default:
      return shapeData;
  }
}

/**
 * Recrée l'ensemble des pages en reconstituant chacune des formes.
 */
function reconstructPages(pagesData) {
  return pagesData.map(page => ({
    bgColor: page.bgColor,
    shapes: page.shapes.map(shapeData => reconstructShape(shapeData))
  }));
}

export class HistoryManager {
  constructor(whiteboard) {
    this.wb = whiteboard;
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Sauvegarde l'état courant des pages en utilisant JSON.
   * On stocke la représentation JSON pour éviter les références.
   */
  saveState() {
    const clone = JSON.parse(JSON.stringify(this.wb.pages));
    this.undoStack.push(clone);
    this.redoStack = [];
  }

  /**
   * Restaure l'état précédent.
   */
  undo() {
    if (!this.undoStack.length) return;
    const current = JSON.parse(JSON.stringify(this.wb.pages));
    this.redoStack.push(current);
    const prev = this.undoStack.pop();
    // Reconstruire les pages et leurs formes
    this.wb.pages = reconstructPages(prev);
    if (this.wb.currentPageIndex >= this.wb.pages.length) {
      this.wb.currentPageIndex = this.wb.pages.length - 1;
    }
    this.wb.shapes = this.wb.pages[this.wb.currentPageIndex].shapes;
    this.wb.selectedShape = null;
    this.wb.drawAll();
  }

  /**
   * Restaure l'état suivant.
   */
  redo() {
    if (!this.redoStack.length) return;
    const current = JSON.parse(JSON.stringify(this.wb.pages));
    this.undoStack.push(current);
    const next = this.redoStack.pop();
    // Reconstruire les pages et leurs formes
    this.wb.pages = reconstructPages(next);
    if (this.wb.currentPageIndex >= this.wb.pages.length) {
      this.wb.currentPageIndex = this.wb.pages.length - 1;
    }
    this.wb.shapes = this.wb.pages[this.wb.currentPageIndex].shapes;
    this.wb.selectedShape = null;
    this.wb.drawAll();
  }
}

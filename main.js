import Whiteboard from "./modules/Whiteboard.js";
import { HistoryManager } from "./modules/History.js";
import TextEditor from "./modules/TextEditor.js";

const wb = new Whiteboard("whiteboard");
const history = new HistoryManager(wb);

// Crée une instance de TextEditor sur l'élément avec l'ID "textEditor"
const textEditor = new TextEditor("textEditor");

const toolbar = document.getElementById("toolbar");
const strokeColorPicker = document.getElementById("strokeColorPicker");
const strokeWidthPicker = document.getElementById("strokeWidthPicker");
const fillColorPicker   = document.getElementById("fillColorPicker");
const bgColorPicker     = document.getElementById("bgColorPicker");
const fileImportJson    = document.getElementById("fileImportJson");
const zoomSlider        = document.getElementById("zoomSlider");
const zoomValue         = document.getElementById("zoomValue");

let snapping = true;

// On met à jour le zoom du whiteboard via sa propriété zoomLevel
wb.zoomLevel = parseFloat(zoomSlider.value);
zoomValue.textContent = Math.round(wb.zoomLevel * 100) + "%";

// Lorsque l'utilisateur ajuste le slider de zoom,
zoomSlider.addEventListener("input", (e) => {
  const newZoom = parseFloat(e.target.value);
  wb.zoomLevel = newZoom;
  zoomValue.textContent = Math.round(newZoom * 100) + "%";
  wb.drawAll();
});

// Redéfinir getMousePos pour tenir compte du zoom et du pan
wb.getMousePos = function(e) {
  const rect = this.canvas.getBoundingClientRect();
  return { 
    x: (e.clientX - rect.left - this.panOffsetX) / this.zoomLevel, 
    y: (e.clientY - rect.top - this.panOffsetY) / this.zoomLevel 
  };
};

document.getElementById("pageInfo").textContent =
  `Page ${wb.currentPageIndex + 1}/${wb.pages.length}`;

toolbar.addEventListener("click", (e) => {
  // Si un bouton outil est cliqué, on met à jour l'outil courant.
  if (e.target.dataset.tool) {
    wb.currentTool = e.target.dataset.tool;
    // Pour l'outil "hand", on change le curseur en "move"
    if (wb.currentTool === "hand") {
      wb.canvas.style.cursor = "move";
    } else {
      wb.canvas.style.cursor = (wb.currentTool === "select") ? "default" : "crosshair";
      if (wb.currentTool === "image") wb.canvas.style.cursor = "copy";
    }
  }

  // Undo / Redo
  if (e.target.id === "btnUndo") history.undo();
  if (e.target.id === "btnRedo") history.redo();

  // Activation/désactivation du snapping
  if (e.target.id === "btnSnap") {
    snapping = !snapping;
    e.target.textContent = snapping ? "Snapping ON" : "Snapping OFF";
  }

  // Export / Import
  if (e.target.id === "btnExportPng") wb.exportPNG();
  if (e.target.id === "btnExportJson") wb.exportJSON();
  if (e.target.id === "btnImportJson") fileImportJson.click();

  // Navigation entre les pages
  if (e.target.id === "btnPagePrev") {
    wb.prevPage();
    document.getElementById("pageInfo").textContent =
      `Page ${wb.currentPageIndex + 1}/${wb.pages.length}`;
  }
  if (e.target.id === "btnPageNext") {
    wb.nextPage();
    document.getElementById("pageInfo").textContent =
      `Page ${wb.currentPageIndex + 1}/${wb.pages.length}`;
  }

  // Réorganisation des couches
  if (e.target.id === "btnBringToFront") {
    if (wb.selectedShape) {
      wb.bringToFront(wb.selectedShape);
    }
  }
  if (e.target.id === "btnSendToBack") {
    if (wb.selectedShape) {
      wb.sendToBack(wb.selectedShape);
    }
  }
  if (e.target.id === "btnMoveUp") {
    if (wb.selectedShape) {
      wb.moveUp(wb.selectedShape);
    }
  }
  if (e.target.id === "btnMoveDown") {
    if (wb.selectedShape) {
      wb.moveDown(wb.selectedShape);
    }
  }
});

strokeColorPicker.addEventListener("input", (e) => {
  wb.strokeColor = e.target.value;
});
strokeWidthPicker.addEventListener("input", (e) => {
  wb.strokeWidth = parseInt(e.target.value, 10);
});
fillColorPicker.addEventListener("input", (e) => {
  wb.fillColor = e.target.value;
});
bgColorPicker.addEventListener("input", (e) => {
  wb.pages[wb.currentPageIndex].bgColor = e.target.value;
  wb.drawAll();
});

fileImportJson.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    history.saveState();
    wb.importJSON(e.target.files[0]);
  }
});

// Événements souris
wb.canvas.addEventListener("mousedown", (e) => {
  history.saveState();
  wb.handleMouseDown(wb.getMousePos(e), snapping);
});
wb.canvas.addEventListener("mousemove", (e) => {
  wb.handleMouseMove(wb.getMousePos(e), snapping);
});
wb.canvas.addEventListener("mouseup", (e) => {
  wb.handleMouseUp(wb.getMousePos(e), snapping);
  history.saveState();
});

// Événements tactiles
wb.canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = wb.canvas.getBoundingClientRect();
  const pos = { 
    x: (touch.clientX - rect.left - wb.panOffsetX) / wb.zoomLevel, 
    y: (touch.clientY - rect.top - wb.panOffsetY) / wb.zoomLevel 
  };
  history.saveState();
  wb.handleMouseDown(pos, snapping);
});
wb.canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = wb.canvas.getBoundingClientRect();
  const pos = { 
    x: (touch.clientX - rect.left - wb.panOffsetX) / wb.zoomLevel, 
    y: (touch.clientY - rect.top - wb.panOffsetY) / wb.zoomLevel 
  };
  wb.handleMouseMove(pos, snapping);
});
wb.canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  let pos = wb.selectRectCurrent || { x: 0, y: 0 };
  wb.handleMouseUp(pos, snapping);
  history.saveState();
});

// Gestion du drag & drop pour les images
wb.canvas.addEventListener("dragover", (e) => e.preventDefault());
wb.canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  let file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    let reader = new FileReader();
    reader.onload = (evt) => {
      history.saveState();
      wb.addImageAt(evt.target.result, 200, 200);
      history.saveState();
    };
    reader.readAsDataURL(file);
  }
});

// Redimensionnement
window.addEventListener("resize", () => wb.resize());
wb.resize();

// Double-clic pour éditer le texte multi-ligne
wb.canvas.addEventListener("dblclick", (e) => {
  wb.handleDoubleClick(wb.getMousePos(e), textEditor.editor);
});

// Lorsqu'on clique en dehors de l'éditeur, appliquer le texte et masquer l'éditeur
document.addEventListener("mousedown", (ev) => {
  if (ev.target !== textEditor.editor) {
    if (textEditor.editor.style.display !== "none") {
      wb.applyTextEditor(textEditor.editor);
    }
  }
});

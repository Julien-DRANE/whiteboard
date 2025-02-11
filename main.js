import Whiteboard from "./modules/Whiteboard.js";
import { HistoryManager } from "./modules/History.js";
import TextEditor from "./modules/TextEditor.js";
import { ShapeText } from "./modules/Shapes.js";

// Initialisation des modules principaux
const wb = new Whiteboard("whiteboard");
const history = new HistoryManager(wb);
const textEditor = new TextEditor("textEditor");

// Références aux barres d'outils et aux éléments UI
const toolbarHorizontal = document.getElementById("toolbarHorizontal");
const toolbarVertical = document.getElementById("toolbarVertical");

const strokeColorPicker = document.getElementById("strokeColorPicker");
const strokeWidthPicker = document.getElementById("strokeWidthPicker");
const fillColorPicker = document.getElementById("fillColorPicker");
const bgColorPicker = document.getElementById("bgColorPicker");
const fileImportJson = document.getElementById("fileImportJson");
const zoomSlider = document.getElementById("zoomSlider");
const zoomValue = document.getElementById("zoomValue");

// Élément pour gérer la sélection d'image via le bouton "Image (Drop)"
const fileImage = document.getElementById("fileImage");

let snapping = true;

// Initialisation du zoom
wb.zoomLevel = parseFloat(zoomSlider.value);
zoomValue.textContent = Math.round(wb.zoomLevel * 100) + "%";

// Mise à jour du zoom lors du changement du slider
zoomSlider.addEventListener("input", (e) => {
  const newZoom = parseFloat(e.target.value);
  wb.zoomLevel = newZoom;
  zoomValue.textContent = Math.round(newZoom * 100) + "%";
  wb.drawAll();
});

// Redéfinition de getMousePos pour tenir compte du zoom et du pan
wb.getMousePos = function(e) {
  const rect = this.canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - this.panOffsetX) / this.zoomLevel,
    y: (e.clientY - rect.top - this.panOffsetY) / this.zoomLevel
  };
};

// Affichage de l'information de page
document.getElementById("pageInfo").textContent =
  `Page ${wb.currentPageIndex + 1}/${wb.pages.length}`;

/* ============================================
   Gestion des clics sur la barre horizontale
   (Outils de dessin, zoom, navigation)
   ============================================ */
toolbarHorizontal.addEventListener("click", (e) => {
  if (e.target.dataset.tool) {
    wb.currentTool = e.target.dataset.tool;
    if (wb.currentTool === "text") {
      // Affiche le TextEditor quand l'outil texte est sélectionné.
      // Les valeurs (x, y, width, height, fontSize) sont par défaut et peuvent être ajustées.
      textEditor.show({
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        fontSize: 18,
        text: "",
        onValidate: (validatedText) => {
          console.log("Texte validé :", validatedText);
          // Crée une nouvelle forme texte à partir des paramètres du TextEditor.
          // Ici, on calcule le centre du nouveau cadre à partir de la position et des dimensions utilisées.
          const shapeX = 100 + 400 / 2; // par exemple
          const shapeY = 100 + 200 / 2; // par exemple
          // Créer l'instance de ShapeText avec le texte validé et la couleur sélectionnée (ou par défaut)
          let newTextShape = new ShapeText(shapeX, shapeY, 0, 0, 0, strokeColorPicker.value, validatedText, 18);
          // Utiliser la méthode setText pour recalculer la largeur et la hauteur en fonction du texte
          newTextShape.setText(validatedText, wb.ctx);
          // Ajouter la nouvelle forme au whiteboard
          wb.shapes.push(newTextShape);
          // Redessiner le whiteboard
          wb.drawAll();
        }
      });
      wb.canvas.style.cursor = "text";
    } else if (wb.currentTool === "image") {
      wb.canvas.style.cursor = "copy";
      if (fileImage) {
        fileImage.click();
      }
    } else {
      wb.canvas.style.cursor =
        (wb.currentTool === "hand") ? "move" :
        (wb.currentTool === "select") ? "default" : "crosshair";
    }
  }
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
});

/* ============================================
   Gestion des clics sur la barre verticale
   (Actions : Undo/Redo, snapping, réorganisation des couches, export/import)
   ============================================ */
toolbarVertical.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  switch (btn.id) {
    case "btnUndo":
      history.undo();
      break;
    case "btnRedo":
      history.redo();
      break;
    case "btnSnap":
      snapping = !snapping;
      btn.textContent = snapping ? "🧲" : "🧲 Off";
      break;
    case "btnBringToFront":
      if (wb.selectedShape) wb.bringToFront(wb.selectedShape);
      break;
    case "btnSendToBack":
      if (wb.selectedShape) wb.sendToBack(wb.selectedShape);
      break;
    case "btnMoveUp":
      if (wb.selectedShape) wb.moveUp(wb.selectedShape);
      break;
    case "btnMoveDown":
      if (wb.selectedShape) wb.moveDown(wb.selectedShape);
      break;
    case "btnExportPng":
      wb.exportPNG();
      break;
    case "btnExportJson":
      wb.exportJSON();
      break;
    case "btnImportJson":
      fileImportJson.click();
      break;
    default:
      break;
  }
});

/* ============================================
   Gestion des changements des options graphiques
   ============================================ */
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

/* ============================================
   Import JSON
   ============================================ */
fileImportJson.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    history.saveState();
    wb.importJSON(e.target.files[0]);
  }
});

/* ============================================
   Gestion de la sélection d'image via le fichier caché
   ============================================ */
if (fileImage) {
  fileImage.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        history.saveState();
        wb.addImageAt(evt.target.result, 200, 200);
        history.saveState();
      };
      reader.readAsDataURL(file);
    }
  });
}

/* ============================================
   Événements souris sur le canvas
   (Ignorés si le TextEditor est affiché)
   ============================================ */
wb.canvas.addEventListener("mousedown", (e) => {
  if (textEditor.container.style.display !== "none") return;
  history.saveState();
  wb.handleMouseDown(wb.getMousePos(e), snapping);
});
wb.canvas.addEventListener("mousemove", (e) => {
  if (textEditor.container.style.display !== "none") return;
  wb.handleMouseMove(wb.getMousePos(e), snapping);
});
wb.canvas.addEventListener("mouseup", (e) => {
  if (textEditor.container.style.display !== "none") return;
  wb.handleMouseUp(wb.getMousePos(e), snapping);
  history.saveState();
});

/* ============================================
   Événements tactiles sur le canvas
   ============================================ */
wb.canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (textEditor.container.style.display !== "none") return;
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
  if (textEditor.container.style.display !== "none") return;
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
  if (textEditor.container.style.display !== "none") return;
  let pos = wb.selectRectCurrent || { x: 0, y: 0 };
  wb.handleMouseUp(pos, snapping);
  history.saveState();
});

/* ============================================
   Gestion du drag & drop pour les images sur le canvas
   ============================================ */
wb.canvas.addEventListener("dragover", (e) => e.preventDefault());
wb.canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      history.saveState();
      wb.addImageAt(evt.target.result, 200, 200);
      history.saveState();
    };
    reader.readAsDataURL(file);
  }
});

/* ============================================
   Redimensionnement du canvas
   ============================================ */
window.addEventListener("resize", () => wb.resize());
wb.resize();

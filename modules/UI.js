export class UIManager {
  /**
   * @param {Object} whiteboard - L'instance de Whiteboard
   * @param {Object} history - L'instance de HistoryManager
   * @param {Object} textEditor - L'instance du TextEditor (optionnel mais recommandé)
   */
  constructor(whiteboard, history, textEditor) {
    this.wb = whiteboard;
    this.history = history;
    this.textEditor = textEditor; // référence au module TextEditor
    this.currentTool = "pencil";
    this.snapOn = false;
    // Récupération des deux barres d'outils
    this.toolbarHorizontal = document.getElementById("toolbarHorizontal");
    this.toolbarVertical = document.getElementById("toolbarVertical");
    // Autres éléments UI
    this.colorPicker = document.getElementById("strokeColorPicker");
    this.fillColorPicker = document.getElementById("fillColorPicker");
    this.fileImportJson = document.getElementById("fileImportJson");
  }

  init() {
    // ----- Gestion des clics sur la barre horizontale -----
    // (Outils de dessin, zoom, navigation, propriétés, etc.)
    this.toolbarHorizontal.addEventListener("click", (e) => {
      if (e.target.dataset.tool) {
        // Retirer la classe active de tous les boutons outils
        const toolButtons = this.toolbarHorizontal.querySelectorAll("button[data-tool]");
        toolButtons.forEach(btn => btn.classList.remove("active"));
        // Ajouter la classe active au bouton cliqué
        e.target.classList.add("active");

        this.currentTool = e.target.dataset.tool;
        if (this.currentTool === "eraser") {
          // Instancier l'outil gomme
          this.wb.setTool(new EraserTool(this.wb));
          this.wb.canvas.style.cursor = "pointer"; // Choix d'un curseur adapté
        } else {
          // Pour les autres outils, on affecte la valeur directement
          this.wb.currentTool = this.currentTool;
          if (this.currentTool === "image") {
            this.wb.canvas.style.cursor = "copy";
          } else if (this.currentTool === "text") {
            if (this.textEditor) {
              this.textEditor.show({
                x: 100,
                y: 100,
                width: 400,
                height: 200,
                fontSize: 18,
                text: "",
                onValidate: (validatedText) => {
                  console.log("Texte validé :", validatedText);
                  // Ici, vous pouvez ajouter le texte comme une nouvelle forme sur le whiteboard
                }
              });
              this.wb.canvas.style.cursor = "text";
            }
          } else {
            this.wb.canvas.style.cursor =
              (this.currentTool === "hand") ? "move" :
              (this.currentTool === "select") ? "default" : "crosshair";
          }
        }
      }
      // Navigation entre les pages
      if (e.target.id === "btnPagePrev") {
        this.wb.prevPage();
      }
      if (e.target.id === "btnPageNext") {
        this.wb.nextPage();
      }
    });

    // ----- Gestion des clics sur la barre verticale -----
    // (Actions (Undo/Redo), snapping, réorganisation des couches, export/import)
    this.toolbarVertical.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      switch (btn.id) {
        case "btnUndo":
          this.history.undo();
          break;
        case "btnRedo":
          this.history.redo();
          break;
        case "btnSnap":
          this.snapOn = !this.snapOn;
          btn.textContent = this.snapOn ? "🧲" : "🧲 Off";
          break;
        case "btnBringToFront":
          if (this.wb.selectedShape) {
            this.wb.bringToFront(this.wb.selectedShape);
          }
          break;
        case "btnSendToBack":
          if (this.wb.selectedShape) {
            this.wb.sendToBack(this.wb.selectedShape);
          }
          break;
        case "btnMoveUp":
          if (this.wb.selectedShape) {
            this.wb.moveUp(this.wb.selectedShape);
          }
          break;
        case "btnMoveDown":
          if (this.wb.selectedShape) {
            this.wb.moveDown(this.wb.selectedShape);
          }
          break;
        case "btnExportPng":
          this.wb.exportPNG();
          break;
        case "btnExportJson":
          this.wb.exportJSON();
          break;
        case "btnImportJson":
          this.fileImportJson.click();
          break;
        default:
          break;
      }
    });

    // ----- Gestion des événements sur le sélecteur de couleur -----
    this.colorPicker.addEventListener("input", (e) => {
      this.wb.strokeColor = e.target.value;
    });

    // ----- Import JSON -----
    this.fileImportJson.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.wb.importJSON(e.target.files[0]);
      }
    });

    // ----- Événements sur le canvas -----
    this.wb.canvas.addEventListener("mousedown", (e) => {
      if (this.textEditor && this.textEditor.editor.style.display !== "none") {
        return;
      }
      const pos = this.wb.getMousePos(e);
      const isDraw = this.wb.handleMouseDown(pos, this.snapOn);
      if (!isDraw) {
        this.history.saveState();
      }
    });
    this.wb.canvas.addEventListener("mousemove", (e) => {
      if (this.textEditor && this.textEditor.editor.style.display !== "none") {
        return;
      }
      const pos = this.wb.getMousePos(e);
      this.wb.handleMouseMove(pos, this.snapOn);
    });
    this.wb.canvas.addEventListener("mouseup", (e) => {
      if (this.textEditor && this.textEditor.editor.style.display !== "none") {
        return;
      }
      const pos = this.wb.getMousePos(e);
      this.wb.handleMouseUp(pos, this.snapOn);
      this.history.saveState();
    });

    // ----- Gestion du drag & drop pour les images -----
    this.wb.canvas.addEventListener("dragover", (e) => e.preventDefault());
    this.wb.canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            this.wb.addImageAt(img, 100, 100);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // ----- Redimensionnement -----
    window.addEventListener("resize", () => {
      this.wb.resize();
    });
    this.wb.resize();
  }
}

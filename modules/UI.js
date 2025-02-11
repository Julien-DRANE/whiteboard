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
      // Si un bouton outil est cliqué, on met à jour l'outil courant
      if (e.target.dataset.tool) {
        this.currentTool = e.target.dataset.tool;
        this.wb.currentTool = this.currentTool;
        // Gestion du curseur selon l'outil sélectionné
        if (this.currentTool === "image") {
          this.wb.canvas.style.cursor = "copy";
        } else if (this.currentTool === "text") {
          // Lorsqu'on sélectionne l'outil texte, on affiche le TextEditor
          // (Les valeurs ici sont par défaut et peuvent être adaptées.)
          if (this.textEditor) {
            this.textEditor.show({
              x: 100,         // Position horizontale par défaut
              y: 100,         // Position verticale par défaut
              width: 400,     // Largeur de l'éditeur
              height: 200,    // Hauteur de l'éditeur
              fontSize: 18,   // Taille de la police
              text: "",       // Texte initial vide
              onValidate: (validatedText) => {
                console.log("Texte validé :", validatedText);
                // Ici, vous pouvez ajouter le texte comme une nouvelle forme sur le whiteboard
                // ou effectuer une autre action appropriée.
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
      // Undo / Redo
      if (e.target.id === "btnUndo") {
        this.history.undo();
      }
      if (e.target.id === "btnRedo") {
        this.history.redo();
      }
      // Activation/désactivation du snapping avec symbole d'aimant
      if (e.target.id === "btnSnap") {
        this.snapOn = !this.snapOn;
        e.target.textContent = this.snapOn ? "🧲" : "🧲 Off";
      }
      // Réorganisation des couches
      if (e.target.id === "btnBringToFront") {
        if (this.wb.selectedShape) {
          this.wb.bringToFront(this.wb.selectedShape);
        }
      }
      if (e.target.id === "btnSendToBack") {
        if (this.wb.selectedShape) {
          this.wb.sendToBack(this.wb.selectedShape);
        }
      }
      if (e.target.id === "btnMoveUp") {
        if (this.wb.selectedShape) {
          this.wb.moveUp(this.wb.selectedShape);
        }
      }
      if (e.target.id === "btnMoveDown") {
        if (this.wb.selectedShape) {
          this.wb.moveDown(this.wb.selectedShape);
        }
      }
      // Export PNG / JSON
      if (e.target.id === "btnExportPng") {
        this.wb.exportPNG();
      }
      if (e.target.id === "btnExportJson") {
        this.wb.exportJSON();
      }
      // Import JSON
      if (e.target.id === "btnImportJson") {
        this.fileImportJson.click();
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
    // Avant de traiter l'événement, on vérifie si l'éditeur de texte est visible.
    this.wb.canvas.addEventListener("mousedown", (e) => {
      if (this.textEditor && this.textEditor.editor.style.display !== "none") {
        // Si l'éditeur est ouvert, on ignore cet événement sur le canvas.
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

export class UIManager {
  constructor(whiteboard, history) {
    this.wb = whiteboard;
    this.history = history;
    this.currentTool = "pencil";
    this.snapOn = false;
    this.toolbar = document.getElementById("toolbar");
    // Correction : utilisation de l'ID "strokeColorPicker" pour correspondre à index.html
    this.colorPicker = document.getElementById("strokeColorPicker");
    this.fillColorPicker = document.getElementById("fillColorPicker");
    this.fileImportJson = document.getElementById("fileImportJson");
  }

  init() {
    // Événements sur la barre d'outils
    this.toolbar.addEventListener("click", (e) => {
      if (e.target.dataset.tool) {
        this.currentTool = e.target.dataset.tool;
        this.wb.currentTool = this.currentTool;
      }
      if (e.target.id === "btnLock") this.wb.lockUnlockSelected();
      if (e.target.id === "btnFront") this.wb.bringSelectedToFront();
      if (e.target.id === "btnBack") this.wb.sendSelectedToBack();
      if (e.target.id === "btnGroup") this.wb.groupSelection();
      if (e.target.id === "btnUngroup") this.wb.ungroupSelection();
      if (e.target.id === "btnUndo") this.history.undo();
      if (e.target.id === "btnRedo") this.history.redo();
      if (e.target.id === "btnSnap") this.snapOn = !this.snapOn;
      if (e.target.id === "btnExportPng") this.wb.exportPNG();
      if (e.target.id === "btnExportJson") this.wb.exportJSON();
      if (e.target.id === "btnPresentation") this.wb.togglePresentation();

      // Remplir toutes
      if (e.target.id === "btnFillAll") {
        let c = this.fillColorPicker.value;
        this.wb.setFillColorAll(c);
      }
    });

    // Pickeur de couleur (trait)
    this.colorPicker.addEventListener("input", (e) => {
      // Utilisation de strokeColor (ou adapter en fonction de la propriété attendue par Whiteboard)
      this.wb.strokeColor = e.target.value;
    });

    // Fichier import JSON
    this.fileImportJson.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.wb.importJSON(e.target.files[0]);
      }
    });

    // Événements sur le canvas (en utilisant getMousePos)
    this.wb.canvas.addEventListener("mousedown", (e) => {
      let pos = this.wb.getMousePos(e);
      let isDraw = this.wb.handleMouseDown(pos, this.snapOn);
      if (!isDraw) this.history.saveState();
    });
    this.wb.canvas.addEventListener("mousemove", (e) => {
      let pos = this.wb.getMousePos(e);
      this.wb.handleMouseMove(pos, this.snapOn);
    });
    this.wb.canvas.addEventListener("mouseup", (e) => {
      let pos = this.wb.getMousePos(e);
      this.wb.handleMouseUp(pos, this.snapOn);
      this.history.saveState();
    });

    // Drag & drop d'images
    this.wb.canvas.addEventListener("dragover", (e) => e.preventDefault());
    this.wb.canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      let file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        let reader = new FileReader();
        reader.onload = (evt) => {
          let img = new Image();
          img.onload = () => {
            this.wb.addImageAt(img, 100, 100);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Redimensionnement
    window.addEventListener("resize", () => {
      this.wb.resize();
    });
    this.wb.resize();
  }
}

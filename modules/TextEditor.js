// TextEditor.js
export default class TextEditor {
  constructor(editorId) {
    this.editor = document.getElementById(editorId);
    if (!this.editor) {
      throw new Error(`Element with id "${editorId}" not found`);
    }
    // S'assurer que l'éditeur est contenteditable
    this.editor.contentEditable = "true";
    // Initialisation des styles (peut être surchargé via le CSS)
    this.editor.style.position = "absolute";
    this.editor.style.display = "none";
    this.editor.style.zIndex = "1000";
    this.editor.style.outline = "none";
    this.editor.style.border = "1px solid #00bcd4";
    this.editor.style.borderRadius = "5px";
    this.editor.style.background = "rgba(255,255,255,0.9)";
    this.editor.style.padding = "8px";
    this.editor.style.boxSizing = "border-box";
    this.editor.style.fontSize = "16px";
    this.editor.style.color = "#000";
    this.editor.style.resize = "none";
    this.editor.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
    
    // Autoriser les sauts de ligne
    this.editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // Laisser le comportement par défaut pour insérer un saut de ligne.
        return;
      }
    });
  }

  /**
   * Affiche l'éditeur à la position (x, y) avec la largeur, la hauteur et la taille de police spécifiées.
   * Si aucune dimension n'est fournie, utilise 600px de largeur et 300px de hauteur par défaut.
   * Le contenu initial (text) est inséré et tout le texte est automatiquement sélectionné.
   *
   * @param {Object} options - Options d'affichage
   * @param {number} options.x - Position x (en pixels)
   * @param {number} options.y - Position y (en pixels)
   * @param {number} [options.width=600] - Largeur de l'éditeur (en pixels)
   * @param {number} [options.height=300] - Hauteur de l'éditeur (en pixels)
   * @param {number} options.fontSize - Taille de police (en pixels)
   * @param {string} options.text - Texte initial à afficher
   */
  show({ x, y, width = 600, height = 300, fontSize, text }) {
    this.editor.style.left = `${x}px`;
    this.editor.style.top = `${y}px`;
    this.editor.style.width = `${width}px`;
    this.editor.style.height = `${height}px`;
    this.editor.style.fontSize = `${fontSize}px`;
    // Insérer le texte (innerText pour le texte brut)
    this.editor.innerText = text;
    this.editor.style.display = "block";
    this.editor.focus();
    // Sélectionner automatiquement tout le contenu
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(this.editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }, 0);
  }

  /**
   * Masque l'éditeur.
   */
  hide() {
    this.editor.style.display = "none";
  }

  /**
   * Retourne le texte contenu dans l'éditeur.
   */
  getText() {
    return this.editor.innerText;
  }

  /**
   * Applique un format gras au texte sélectionné.
   */
  applyBold() {
    document.execCommand("bold", false, null);
  }

  /**
   * Applique un format italique au texte sélectionné.
   */
  applyItalic() {
    document.execCommand("italic", false, null);
  }

  /**
   * Réinitialise l'éditeur en vidant son contenu et en le masquant.
   */
  reset() {
    this.editor.innerText = "";
    this.hide();
  }
}

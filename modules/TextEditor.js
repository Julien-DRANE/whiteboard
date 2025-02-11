// TextEditor.js
export default class TextEditor {
  constructor(editorId) {
    // Le conteneur principal
    this.container = document.getElementById(editorId);
    if (!this.container) {
      throw new Error(`Element with id "${editorId}" not found`);
    }
    
    // On s'assure que le conteneur n'est pas contentEditable lui-même
    this.container.contentEditable = "false";

    // Création du champ éditable (zone de texte)
    this.textArea = document.createElement("div");
    this.textArea.contentEditable = "true";
    // Styles pour la zone éditable
    Object.assign(this.textArea.style, {
      width: "100%",
      height: "100%",
      outline: "none",
      whiteSpace: "pre-wrap",
      overflow: "auto"
    });
    // Ajouter la zone éditable dans le conteneur
    this.container.appendChild(this.textArea);

    // Appliquer les styles sur le conteneur (l'éditeur global)
    Object.assign(this.container.style, {
      position: "absolute",
      display: "none",
      zIndex: "1000",
      border: "1px solid #00bcd4",
      borderRadius: "5px",
      background: "rgba(255,255,255,0.9)",
      padding: "8px",
      boxSizing: "border-box",
      fontSize: "16px",
      color: "#000",
      resize: "both",
      boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
    });

    // Création du bouton de validation
    this.validateButton = document.createElement("button");
    this.validateButton.innerText = "Valider";
    Object.assign(this.validateButton.style, {
      position: "absolute",
      bottom: "5px",
      right: "5px",
      zIndex: "1001"
    });
    // Empêcher la propagation du clic sur le bouton pour éviter toute interférence
    this.validateButton.addEventListener("mousedown", (e) => e.stopPropagation());
    this.validateButton.addEventListener("click", () => {
      if (this.onValidateCallback && typeof this.onValidateCallback === "function") {
        this.onValidateCallback(this.getText());
      }
      // Masquer et réinitialiser l'éditeur après validation
      this.hide();
      this.reset();
    });
    this.container.appendChild(this.validateButton);

    // Empêcher la propagation d'événements dans le conteneur
    this.container.addEventListener("mousedown", (e) => e.stopPropagation());
    this.container.addEventListener("keydown", (e) => e.stopPropagation());

    // Callback de validation à définir lors de l'appel à show()
    this.onValidateCallback = null;
  }

  /**
   * Affiche l'éditeur avec les options données.
   * @param {Object} options - Options d'affichage
   * @param {number} options.x - Position horizontale (en pixels)
   * @param {number} options.y - Position verticale (en pixels)
   * @param {number} [options.width=600] - Largeur de l'éditeur (en pixels)
   * @param {number} [options.height=300] - Hauteur de l'éditeur (en pixels)
   * @param {number} [options.fontSize=16] - Taille de la police (en pixels)
   * @param {string} [options.text=""] - Texte initial
   * @param {function} [options.onValidate] - Callback appelée lors de la validation (recevant le texte)
   */
  show({ x, y, width = 600, height = 300, fontSize = 16, text = "", onValidate }) {
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    this.container.style.fontSize = `${fontSize}px`;

    // Placer le texte initial dans la zone éditable
    this.textArea.innerText = text;

    // S'assurer que le bouton de validation est présent
    if (!this.container.contains(this.validateButton)) {
      this.container.appendChild(this.validateButton);
    }

    this.container.style.display = "block";
    this.onValidateCallback = onValidate;

    // Donner le focus à la zone éditable et sélectionner tout le contenu
    this.textArea.focus();
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(this.textArea);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }, 0);
  }

  /**
   * Masque l'éditeur.
   */
  hide() {
    this.container.style.display = "none";
  }

  /**
   * Retourne le texte saisi dans la zone éditable.
   * @returns {string}
   */
  getText() {
    return this.textArea.innerText;
  }

  /**
   * Réinitialise l'éditeur en vidant la zone éditable et en le masquant.
   */
  reset() {
    this.textArea.innerText = "";
    if (!this.container.contains(this.validateButton)) {
      this.container.appendChild(this.validateButton);
    }
    this.hide();
  }
}

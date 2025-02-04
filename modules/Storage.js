// modules/Storage.js

import {
  ShapeRect,
  ShapeEllipse,
  ShapeArrow,
  ShapePath,
  ShapeImage,
  ShapeText
} from './Shapes.js';

/**
 * Exporte toutes les formes du whiteboard sous forme de JSON.
 * @param {Object} whiteboard - L'instance du whiteboard contenant la liste des formes.
 */
export function exportToJSON(whiteboard) {
  const data = JSON.stringify(whiteboard.shapes);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whiteboard.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importe les formes depuis un fichier JSON et reconstruit les instances correspondantes.
 * @param {Object} whiteboard - L'instance du whiteboard dans laquelle les formes seront importées.
 * @param {File} file - Le fichier JSON à importer.
 */
export function importFromJSON(whiteboard, file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const shapesData = JSON.parse(e.target.result);
      
      whiteboard.shapes = shapesData.map((obj, index) => {
        // Vérification de la présence de la propriété "type"
        if (!obj.type) {
          console.error(`L'objet à l'index ${index} n'a pas de propriété "type":`, obj);
          return null;
        }
        switch (obj.type) {
          case 'rect':
            return new ShapeRect(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.fillColor,
              obj.strokeColor,
              obj.strokeWidth
            );
          case 'ellipse':
            return new ShapeEllipse(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.fillColor,
              obj.strokeColor,
              obj.strokeWidth
            );
          case 'arrow':
            return new ShapeArrow(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.strokeColor,
              obj.strokeWidth
            );
          case 'path':
            return new ShapePath(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.strokeColor,
              obj.points,
              obj.strokeWidth
            );
          case 'image':
            return new ShapeImage(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.src
            );
          case 'text':
            return new ShapeText(
              obj.x,
              obj.y,
              obj.w,
              obj.h,
              obj.angle,
              obj.color,
              obj.text,
              obj.fontSize
            );
          default:
            console.error(`Type de forme inconnu à l'index ${index}:`, obj.type);
            return null;
        }
      }).filter(shape => shape !== null);
      
      // Affiche dans la console les formes reconstruites pour vérification
      console.log("Formes reconstruites après import:", whiteboard.shapes);
      
      // Redessine toutes les formes sur le canevas.
      whiteboard.drawAll();
    } catch (error) {
      console.error("Erreur lors de l'import JSON:", error);
    }
  };
  reader.readAsText(file);
}

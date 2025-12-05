# Time Guard

## Installation

```bash
git clone https://github.com/sws-corp/Time-guard
```

Ensuite, dans Google Chrome :

1. Ouvrir Gérer les extensions (`chrome://extensions`)
2. Activer le Mode développeur(en haut à droite)
3. Cliquer sur Charger l’extension non empaquetée
4. Sélectionner le dossier cloné précédemment
5. L’extension est prête à être utilisée

---

## Objectif

Time Guard est une extension simple qui affiche le temps que vous passez sur vos sites web préférés.  
Vous pouvez également définir une limite : une fois dépassée, une popup avec notre mascotte SWS apparaît pour vous avertir, afin de vous aider à reprendre le contrôle de votre temps d’écran.

---

## Permissions utilisées

- storage : sauvegarde des statistiques de temps et des limites définies.
- tabs : accès aux informations de l’onglet actif pour suivre le temps passé.
- content_scripts (`<all_urls>`) : nécessaire pour détecter l’activité sur tous les sites afin de mesurer le temps réel passé.

---

## Structure du projet

- `manifest.json`
- `background.js`
- `content.js`
- `index.html`
- `style.css`
- `assets/`

---


## Captures d’écran

Extension
<img width="1470" height="955" alt="Capture d’écran 2025-12-05 à 03 29 52" src="https://github.com/user-attachments/assets/be98ec04-cfab-4fcf-a386-4c5233f4d615" />
Paramètres (ajout de limite)
<img width="1470" height="956" alt="Capture d’écran 2025-12-05 à 03 30 20" src="https://github.com/user-attachments/assets/1a5b8be7-dba3-41dd-91b9-7f77c44b95a1" />
Popup d'avertissement de dépassement de la limite
<img width="1470" height="956" alt="Capture d’écran 2025-12-05 à 03 14 37" src="https://github.com/user-attachments/assets/2e503f1a-9ad3-4719-a5dd-1c66033f7554" />

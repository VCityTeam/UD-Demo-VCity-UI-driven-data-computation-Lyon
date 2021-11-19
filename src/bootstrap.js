/** @format */

import * as udviz from 'ud-viz';
import { raycastOnPoint, setObjectsToRaycast } from './raycast';

var layers = null;
const app = new udviz.Templates.AllWidget();

var body = document.body;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  setObjectsToRaycast(layers, ['3d-tiles-layer-relief','3d-tiles-layer-bridges']);
  let dt = e.dataTransfer;
  for (let file of dt.files) readFile(file);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  body.addEventListener(eventName, preventDefaults, false);
});

body.addEventListener('drop', handleDrop, false);

function updateValues(fileData, fileName) {
  var jsonData = JSON.parse(fileData);
  for (let feature of jsonData.features) {
    if (feature.geometry.type === 'MultiLineString') {
      for (let point of feature.geometry.coordinates[0]) {
        var positionOnGround = raycastOnPoint(point);
        if (positionOnGround !== undefined && positionOnGround.z > point[2])
          point[2] = positionOnGround.z;
      }
    } else if (feature.geometry.type === 'LineString') {
      for (let point of feature.geometry.coordinates) {
        var positionOnGround = raycastOnPoint(point);
        if (positionOnGround !== undefined && positionOnGround.z > point[2])
          point[2] = positionOnGround[2];
      }
    }
  }
  var newJsonData = JSON.stringify(jsonData);
  var bb = new Blob([newJsonData], { type: 'text/plain' });
  var a = document.createElement('a');
  a.download = 'new_' + fileName;
  a.href = window.URL.createObjectURL(bb);
  a.click();
}

function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    var data = event.target.result;
    updateValues(data, file.name);
  });
  reader.readAsText(file);
}

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  layers = app.setupAndAdd3DTilesLayers();

  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Extensions.Debug3DTilesWindow(
    app.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.layerManager);
  app.addModuleView('layerChoice', layerChoice);
});

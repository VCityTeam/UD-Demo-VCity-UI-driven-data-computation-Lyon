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
  setObjectsToRaycast(layers, [
    '3d-tiles-layer-relief',
    '3d-tiles-layer-bridges',
  ]);
  let dt = e.dataTransfer;
  for (let file of dt.files) readFile(file);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  body.addEventListener(eventName, preventDefaults, false);
});

body.addEventListener('drop', handleDrop, false);

function lerp(pointA, pointB, t) {
  var a = pointA.map(function (x) {
    return x * t;
  });
  var b = pointB.map(function (x) {
    return x * (1 - t);
  });
  return a.map(function (x, idx) {
    return x + b[idx];
  });
}

function updateZValue(point) {
  var positionOnGround = raycastOnPoint(point);
  if (positionOnGround !== undefined) point[2] = positionOnGround.z;
  return point;
}

function updateValues(fileData, fileName) {
  var jsonData = JSON.parse(fileData);
  for (let feature of jsonData.features) {
    var newPoints = [];
    var points = [];
    if (feature.geometry.type === 'LineString')
      points = feature.geometry.coordinates;
    if (feature.geometry.type === 'MultiLineString')
      points = feature.geometry.coordinates[0];
    for (let i = 0; i < points.length - 1; i++) {
      for (let t = 10; t > 0; t -= 10) {
        var point = lerp(points[i], points[i + 1], t / 10);
        newPoints.push(updateZValue(point));
      }
    }
    newPoints.push(updateZValue(points[points.length - 1]));
    if (feature.geometry.type === 'LineString')
      feature.geometry.coordinates = newPoints;
    if (feature.geometry.type === 'MultiLineString')
      feature.geometry.coordinates[0] = newPoints;
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

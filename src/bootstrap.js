/** @format */

import * as udviz from 'ud-viz';
import { raycastOnPoint, setObjectsToRaycast } from './raycast';
import { MeshLine, MeshLineMaterial } from 'meshline';

var layers = null;
const app = new udviz.Templates.AllWidget();
var scene = null;
var camera = null;
var body = document.body;
var renderer = null;
var material = null;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  setObjectsToRaycast(layers);
  let dt = e.dataTransfer;
  for (let file of dt.files) readFile(file);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  body.addEventListener(eventName, preventDefaults, false);
});

body.addEventListener('drop', handleDrop, false);

async function drawLine(coords) {
  const points = [];
  for (let coord of coords) {
    points.push(coord[0], coord[1], coord[2] + 0.5);
  }
  const line = new MeshLine();
  line.setPoints(points);

  const mesh = new udviz.THREE.Mesh( line, material );
  scene.add(mesh);
  renderer.render(scene, camera);
}

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

async function updateValues(fileData, fileName) {
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
    drawLine(newPoints);
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

app.start('../assets/config/config.json').then(() => {
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

  scene = app.view.scene;
  camera = app.view.camera.camera3D;

  renderer = new udviz.THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const options = {color: new udviz.THREE.Color(0, 0, 0), lineWidth: 3};
  material = new MeshLineMaterial(options);
});

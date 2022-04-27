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
var jsonData = null;
var fileName = null;

// Buttons CSS style
var styles = `
button {
  line-height: 20px;
  font-weight: bold;
  border: none;
  width: 60px;
  font-size: 11px;
}
#readFile {
  background: salmon;
}
#readFile:hover {
  background: lightsalmon;
}
}`;

var styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Create a button which switch the processing of the 3DTiles
let readFileButton = document.createElement('button');
readFileButton.id = 'readFile';
readFileButton.innerHTML = 'Click Me';
readFileButton.onclick = function () {
  var blob = null;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '../assets/road_sample.geojson');
  xhr.responseType = 'blob';
  xhr.onload = function () {
    blob = xhr.response;
    readFile(blob);
  };
  xhr.send();
};

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

function drawLine(coords) {
  const points = [];
  for (let coord of coords) {
    points.push(coord[0], coord[1], coord[2] + 0.5);
  }
  const line = new MeshLine();
  line.setPoints(points);

  const mesh = new udviz.THREE.Mesh(line, material);
  scene.add(mesh);
  renderer.render(scene, camera);
  app.view.notifyChange(camera.camera3D);
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
  if (point.length < 3) point.push(0); 
  if (positionOnGround !== undefined) point[2] = positionOnGround.z;
  return point;
}

function updateFeature(feature) {
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

function updateData(features, callback) {
  (function loop(i) {
    updateFeature(features[i]);
    if (i < features.length - 1) {
      setTimeout(function () {
        loop(++i);
      }, 1);
    } else {
      callback();
    }
  })(0);
}

function downloadData() {
  var newJsonData = JSON.stringify(jsonData);
  var bb = new Blob([newJsonData], { type: 'text/plain' });
  var a = document.createElement('a');
  a.download = 'new_' + fileName;
  a.href = window.URL.createObjectURL(bb);
  a.click();
}

function readFile(file) {
  console.log(file);
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    fileName = file.name;
    var data = event.target.result;
    jsonData = JSON.parse(data);
    updateData(jsonData.features, downloadData);
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

  // Add the buttons in the page
  let div = document.getElementById('_all_widget_menu');
  if (div == null) {
    document.body.appendChild(readFileButton);
  } else {
    div.appendChild(readFileButton);
  }

  renderer = new udviz.THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const options = { color: new udviz.THREE.Color(0, 0, 0), lineWidth: 3 };
  material = new MeshLineMaterial(options);
});

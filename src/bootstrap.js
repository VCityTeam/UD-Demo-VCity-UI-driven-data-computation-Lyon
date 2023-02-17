/** @format */

import * as udviz from 'ud-viz';
import { raycastOnPoint, setObjectsToRaycast } from './raycast';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

let tilesManagers = null;
const app = new udviz.Templates.AllWidget();
let scene = null;
let camera = null;
let body = document.body;
let renderer = null;
let material = null;
let jsonData = null;
let fileName = null;

// Buttons CSS style
let styles = `
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

let styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Create a button which switch the processing of the 3DTiles
let readFileButton = document.createElement('button');
readFileButton.id = 'readFile';
readFileButton.innerHTML = 'Click Me';
readFileButton.onclick = function () {
  let blob = null;
  let xhr = new XMLHttpRequest();
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
  setObjectsToRaycast(tilesManagers);
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
  const line = new MeshLineGeometry();
  line.setPoints(points);

  const mesh = new udviz.THREE.Mesh(line, material);
  scene.add(mesh);
  app.view3D.getItownsView().notifyChange(camera.camera3D);
}

function lerp(pointA, pointB, t) {
  let a = pointA.map(function (x) {
    return x * t;
  });
  let b = pointB.map(function (x) {
    return x * (1 - t);
  });
  return a.map(function (x, idx) {
    return x + b[idx];
  });
}

function updateZValue(point) {
  let positionOnGround = raycastOnPoint(point);
  if (point.length < 3) point.push(0);
  if (positionOnGround !== undefined) point[2] = positionOnGround.z;
  return point;
}

function updateFeature(feature) {
  let newPoints = [];
  let points = [];
  if (feature.geometry.type === 'LineString')
    points = feature.geometry.coordinates;
  if (feature.geometry.type === 'MultiLineString')
    points = feature.geometry.coordinates[0];
  for (let i = 0; i < points.length - 1; i++) {
    for (let t = 10; t > 0; t -= 10) {
      let point = lerp(points[i], points[i + 1], t / 10);
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
  let newJsonData = JSON.stringify(jsonData);
  let bb = new Blob([newJsonData], { type: 'text/plain' });
  let a = document.createElement('a');
  a.download = 'new_' + fileName;
  a.href = window.URL.createObjectURL(bb);
  a.click();
}

function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    fileName = file.name;
    let data = event.target.result;
    jsonData = JSON.parse(data);
    updateData(jsonData.features, downloadData);
  });
  reader.readAsText(file);
}

app.start('../assets/config/config.json').then(() => {
  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Debug3DTilesWindow(
    app.view3D.getLayerManager()
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.view3D.getLayerManager());
  app.addModuleView('layerChoice', layerChoice);

  scene = app.view3D.scene;
  camera = app.view3D.getItownsView().camera;
  tilesManagers = app.view3D.getLayerManager().tilesManagers;

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
  const options = { color: new udviz.THREE.Color(0, 0, 0), lineWidth: 4 };
  material = new MeshLineMaterial(options);
});

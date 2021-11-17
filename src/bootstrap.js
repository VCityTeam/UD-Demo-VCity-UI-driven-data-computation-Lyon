/** @format */

import * as udviz from 'ud-viz';
import { raycastOnPoint, setObjectsToRaycast } from './raycast';

var layers = null;
const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  // app.addElevationLayer();

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

  console.log(layers);
});

document.addEventListener(
  'keydown',
  (event) => {
    var name = event.key;
    if (name === 'r') {
      setObjectsToRaycast(layers, '3d-tiles-layer-relief');

      udviz.Components.SystemUtils.File.loadJSON('../assets/road.geojson').then(
        (json) => {
          for (let feature of json.features) {
            if (feature.geometry.type === 'MultiLineString') {
              for (let point of feature.geometry.coordinates[0]) {
                var positionOnGround = raycastOnPoint(point);
                if (
                  positionOnGround !== undefined &&
                  positionOnGround[2] > point[2]
                ) {
                  point[2] = positionOnGround[2];
                }
              }
            } else if (feature.geometry.type === 'LineString') {
              for (let point of feature.geometry.coordinates) {
                var positionOnGround = raycastOnPoint(point);
                if (
                  positionOnGround !== undefined &&
                  positionOnGround[2] > point[2]
                ) {
                  point[2] = positionOnGround[2];
                }
              }
            }
          }
        }
      );
    }
  },
  false
);

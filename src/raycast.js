import { THREE } from 'ud-viz';

const raycaster = new THREE.Raycaster();
var objectsToRaycast = [];

function setObjects3D(tiles) {
  var objectsToRaycast = [];

  for (let tile of tiles) {
    if (tile) {
      var obj3D = tile.getObject3D();
      if (obj3D) objectsToRaycast.push(obj3D);
    }
  }
  return objectsToRaycast;
}
export function setObjectsToRaycast(layers, targetLayerId) {
  objectsToRaycast = [];

  for (let [id, value] of Object.entries(layers)) {
    if (id === targetLayerId) {
      objectsToRaycast = setObjects3D(value[1].tiles);
      break;
    }
  }
}

function raycastObjects3D(rayOrigin, rayDirection) {
  raycaster.set(rayOrigin, rayDirection);

  const intersects = raycaster.intersectObjects(objectsToRaycast, true);

  if (intersects.length > 0) return intersects[0].point;
}

export function raycastOnPoint(point) {
  var origin = new THREE.Vector3(
    point[0],
    point[1],
    point[2] + 9999
  );
  var direction = new THREE.Vector3(
    0,
    0,
    -1
  );
  var positionOnGround = raycastObjects3D(origin, direction);
  return positionOnGround;
}

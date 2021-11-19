import { THREE } from 'ud-viz';

const raycaster = new THREE.Raycaster();
var objectsToRaycast = [];

function setObjects3D(tiles) {
  for (let tile of tiles) {
    if (tile) {
      var obj3D = tile.getObject3D();
      if (obj3D) objectsToRaycast.push(obj3D);
    }
  }
}
export function setObjectsToRaycast(layers, targetLayerIds) {
  objectsToRaycast = [];

  for (let [id, value] of Object.entries(layers)) {
    if (targetLayerIds.includes(id)) {
      setObjects3D(value[1].tiles);
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

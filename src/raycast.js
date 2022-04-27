import { THREE } from 'ud-viz';

const raycaster = new THREE.Raycaster();
let objectsToRaycast = [];

function setObjects3D(tiles) {
  for (let tile of tiles) {
    if (tile) {
      let obj3D = tile.getObject3D();
      if (obj3D) objectsToRaycast.push(obj3D);
    }
  }
}

export function setObjectsToRaycast(layers) {
  objectsToRaycast = [];
  for (let [id, value] of Object.entries(layers)) {
    if (id !== undefined && value[0].visible) setObjects3D(value[1].tiles);
  }
}

function raycastObjects3D(rayOrigin, rayDirection) {
  raycaster.set(rayOrigin, rayDirection);

  const intersects = raycaster.intersectObjects(objectsToRaycast, true);

  if (intersects.length > 0) return intersects[0].point;
}

export function raycastOnPoint(point) {
  let z = point[2] || 0;
  let origin = new THREE.Vector3(point[0], point[1], z + 9999);
  let direction = new THREE.Vector3(0, 0, -1);
  let positionOnGround = raycastObjects3D(origin, direction);
  return positionOnGround;
}

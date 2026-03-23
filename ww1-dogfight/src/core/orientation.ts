// @ts-nocheck
export function forwardOf(THREE, obj) {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(obj.quaternion);
}

export function upOf(THREE, obj) {
    return new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
}

export function rightOf(THREE, obj) {
    return new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion);
}

export function syncPlaneOrientation(plane) {
    if (plane.userData.mesh) {
        plane.userData.mesh.rotation.set(0, 0, 0, "XYZ");
    }
    if (plane.userData.art) {
        plane.userData.art.rotation.set(0, -Math.PI / 2, 0, "XYZ");
    }
}

export function createLocalAxes(THREE) {
    return {
        LOCAL_RIGHT: new THREE.Vector3(1, 0, 0),
        LOCAL_UP: new THREE.Vector3(0, 1, 0),
        LOCAL_FORWARD: new THREE.Vector3(0, 0, 1),
    };
}

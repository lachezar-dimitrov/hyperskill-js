import type { PlaneEntity, ThreeModule } from "./game-types.js";

export function forwardOf(THREE: ThreeModule, obj: PlaneEntity): import("three").Vector3 {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(obj.quaternion);
}

export function upOf(THREE: ThreeModule, obj: PlaneEntity): import("three").Vector3 {
    return new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
}

export function rightOf(THREE: ThreeModule, obj: PlaneEntity): import("three").Vector3 {
    return new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion);
}

export function syncPlaneOrientation(plane: PlaneEntity): void {
    if (plane.userData.mesh) {
        plane.userData.mesh.rotation.set(0, 0, 0, "XYZ");
    }
    if (plane.userData.art) {
        plane.userData.art.rotation.set(0, -Math.PI / 2, 0, "XYZ");
    }
}

export function createLocalAxes(THREE: ThreeModule): {
    LOCAL_RIGHT: import("three").Vector3;
    LOCAL_UP: import("three").Vector3;
    LOCAL_FORWARD: import("three").Vector3;
} {
    return {
        LOCAL_RIGHT: new THREE.Vector3(1, 0, 0),
        LOCAL_UP: new THREE.Vector3(0, 1, 0),
        LOCAL_FORWARD: new THREE.Vector3(0, 0, 1),
    };
}

// @ts-nocheck
export function createInputController({ window, document, canvas, onInput, shouldStartDrag }) {
    const keys = {};
    const mouse = { dx: 0, dy: 0, locked: false, dragging: false, lastX: 0, lastY: 0, sens: 0.0015 };
    const hasPointerLock = "pointerLockElement" in document;

    window.addEventListener("keydown", (e) => {
        onInput?.();
        keys[e.code] = true;
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    });

    window.addEventListener("keyup", (e) => {
        keys[e.code] = false;
    });

    canvas.addEventListener("click", () => {
        onInput?.();
        if (!hasPointerLock) return;
        canvas.requestPointerLock();
    });

    canvas.addEventListener("mousedown", (e) => {
        onInput?.();
        if (mouse.locked) return;
        if (shouldStartDrag && !shouldStartDrag(e)) return;
        mouse.dragging = true;
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
    });

    window.addEventListener("mouseup", () => {
        mouse.dragging = false;
    });

    document.addEventListener("pointerlockchange", () => {
        mouse.locked = document.pointerLockElement === canvas;
    });

    document.addEventListener("mousemove", (e) => {
        if (mouse.locked) {
            mouse.dx += e.movementX;
            mouse.dy += e.movementY;
            return;
        }
        if (!mouse.dragging) return;
        const dx = e.clientX - mouse.lastX;
        const dy = e.clientY - mouse.lastY;
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
        mouse.dx += dx;
        mouse.dy += dy;
    });

    return {
        keys,
        mouse,
    };
}

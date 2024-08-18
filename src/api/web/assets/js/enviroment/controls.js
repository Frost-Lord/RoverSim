const dividerHorizontal = document.getElementById('divider-horizontal');
let isResizingHorizontal = false;
let isResizing = false;

dividerHorizontal.addEventListener('mousedown', (e) => {
    isResizingHorizontal = true;
    document.addEventListener('mousemove', resizeHorizontalPanels);
    document.addEventListener('mouseup', stopHorizontalResizing);
});

divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', resizePanels);
    document.addEventListener('mouseup', stopResizing);
});

window.addEventListener('resize', () => {
    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
    camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
    camera.updateProjectionMatrix();
});

function setupControls(controls) {
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.mouseButtons = {
        RIGHT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        LEFT: THREE.MOUSE.PAN
    };
}

function resizeHorizontalPanels(e) {
    if (!isResizingHorizontal) return;
    const containerRect = document.getElementById('threejs-wrapper').getBoundingClientRect();
    const newThreejsHeight = e.clientY - containerRect.top;
    const newConsoleHeight = containerRect.height - newThreejsHeight - dividerHorizontal.clientHeight;

    if (newThreejsHeight > 0 && newConsoleHeight > 0) {
        threejsContainer.style.height = `${newThreejsHeight}px`;
        roverConsole.style.height = `${newConsoleHeight}px`;

        renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
        camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
        camera.updateProjectionMatrix();
    }
}

function stopHorizontalResizing() {
    isResizingHorizontal = false;
    document.removeEventListener('mousemove', resizeHorizontalPanels);
    document.removeEventListener('mouseup', stopHorizontalResizing);
}

function resizePanels(e) {
    if (!isResizing) return;
    const containerWidth = document.getElementById('container').clientWidth;
    const codeboxWidth = e.clientX / containerWidth * 100;
    const threejsWidth = 100 - codeboxWidth;

    if (codeboxWidth > 0 && threejsWidth > 0) {
        codeboxContainer.style.width = `${codeboxWidth}%`;
        document.getElementById('threejs-wrapper').style.width = `${threejsWidth}%`;

        renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
        camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
        camera.updateProjectionMatrix();
    }
}

function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resizePanels);
    document.removeEventListener('mouseup', stopResizing);
}

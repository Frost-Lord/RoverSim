const codeboxContainer = document.getElementById('codebox-container');
const divider = document.getElementById('divider');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, threejsContainer.clientWidth / threejsContainer.clientHeight, 0.1, 1000);
camera.layers.enable(1);
const renderer = new THREE.WebGLRenderer();

camera.position.z = 10;
camera.position.y = 8;

renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
threejsContainer.appendChild(renderer.domElement);

setupScene(scene);

let rover;
const loader = new THREE.GLTFLoader();
loader.load('/static/assets/rover.glb', (gltf) => {
    rover = gltf.scene;
    rover.layers.set(1);
    scene.add(rover);
    animate();
});

const controls = new THREE.OrbitControls(camera, renderer.domElement);
setupControls(controls);

const miniMapCanvas = document.getElementById('mini-map');
const mapDisplay = document.createElement('div');
mapDisplay.id = 'mapDisplay';
threejsContainer.appendChild(mapDisplay);

mapDisplay.style.position = 'absolute';
mapDisplay.style.bottom = '10px';
mapDisplay.style.right = '10px';
mapDisplay.style.boxShadow = '0px 11px 30px 0px rgba(0, 0, 0.5)';
mapDisplay.style.width = '220px';
mapDisplay.style.height = '220px';
mapDisplay.style.zIndex = '1000';

mapDisplay.appendChild(miniMapCanvas);

miniMapCanvas.style.width = '80%';
miniMapCanvas.style.height = '80%';
miniMapCanvas.style.transform = 'rotate(180deg)';

const miniMapRenderer = new THREE.WebGLRenderer({ canvas: miniMapCanvas, alpha: true });

function resizeMiniMapRenderer() {
    const width = mapDisplay.clientWidth;
    const height = mapDisplay.clientHeight;
    miniMapRenderer.setSize(width, height);
    topDownCamera.aspect = width / height;
    topDownCamera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeMiniMapRenderer);
resizeMiniMapRenderer();

function animate() {
    requestAnimationFrame(animate);
    if (rover) {
        updateCameraPosition(camera, rover);

        topDownCamera.position.x = rover.position.x;
        topDownCamera.position.z = rover.position.z;
        topDownCamera.lookAt(rover.position);
    }
    renderer.render(scene, camera);
    resizeMiniMapRenderer();
    miniMapRenderer.render(scene, topDownCamera);
}

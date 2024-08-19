const codeboxContainer = document.getElementById('codebox-container');
const divider = document.getElementById('divider');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, threejsContainer.clientWidth / threejsContainer.clientHeight, 0.1, 1000);
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
    scene.add(rover);
    animate();
});

const controls = new THREE.OrbitControls(camera, renderer.domElement);
setupControls(controls);

function animate() {
    requestAnimationFrame(animate);
    if (rover) {
        updateCameraPosition(camera, rover);
    }
    renderer.render(scene, camera);
}
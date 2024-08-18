const threejsContainer = document.getElementById('threejs-container');
const divider = document.getElementById('divider');

function runCode() {
    const code = codebox.value;
    const lines = code.split('\n');

    const parsedCode = parseCode(lines);
    executeCommands(parsedCode);
}

function parseCode(lines) {
    const commands = [];
    const registers = { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0, R8: 0, R9: 0 };
    const labels = {};

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.endsWith(":")) {
            labels[trimmedLine.slice(0, -1)] = commands.length;
        }
    });

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("SET")) {
            const match = trimmedLine.match(/SET\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                commands.push(() => {
                    registers[reg] = value;
                    console.log(`SET ${reg} to ${value}`);
                });
            }
        } else if (trimmedLine.startsWith("FWD")) {
            const match = trimmedLine.match(/FWD\s+(R\d+)/);
            if (match) {
                const reg = match[1];
                commands.push(() => {
                    moveForward(registers[reg]);
                    console.log(`FWD ${registers[reg]}`);
                });
            }
        } else if (trimmedLine.startsWith("ADD")) {
            const match = trimmedLine.match(/ADD\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                commands.push(() => {
                    registers[reg] += value;
                    console.log(`ADD ${value} to ${reg}, now ${registers[reg]}`);
                });
            }
        } else if (trimmedLine.startsWith("JEQ")) {
            const match = trimmedLine.match(/JEQ\s+(\w+),\s*(R\d+),\s*(\d+)/);
            if (match) {
                const label = match[1];
                const reg = match[2];
                const value = parseInt(match[3], 10);
                commands.push(() => {
                    if (registers[reg] === value) {
                        index = labels[label] - 1; // Adjust index since it will increment after command execution
                        console.log(`JEQ to ${label}`);
                    }
                });
            }
        } else if (trimmedLine === "STOP") {
            commands.push(() => {
                stopMovement();
                endLoop = true;
                console.log("STOP");
            });
        } else if (trimmedLine.startsWith("JMP")) {
            const label = trimmedLine.split(' ')[1];
            commands.push(() => {
                index = labels[label] - 1; // Adjust index since it will increment after command execution
                console.log(`JMP to ${label}`);
            });
        } else if (trimmedLine === "END") {
            commands.push(() => {
                endLoop = true;
                console.log("END");
            });
        }
    });

    return { commands, labels, registers };
}

function executeCommands(parsedCode) {
    const { commands } = parsedCode;
    let index = 0;
    let endLoop = false;

    function executeNextCommand() {
        if (index >= commands.length || endLoop) {
            return;
        }

        const currentCommand = commands[index];
        currentCommand();

        if (!endLoop) {
            index++;
            setTimeout(executeNextCommand, 500);
        }
    }

    executeNextCommand();
}

let speed = 1;

function setSpeed(value) {
    speed = value;
    console.log(`Speed set to ${speed}`);
}

function moveForward(steps) {
    if (rover && steps > 0) {
        const moveDistance = steps * speed;
        rover.position.z -= moveDistance;
        console.log(`Rover moved forward ${moveDistance}`);
    } else {
        console.log("Rover cannot move. Speed or steps is 0.");
    }
}

function stopMovement() {
    speed = 0;
    console.log("Rover stopped");
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, threejsContainer.clientWidth / threejsContainer.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
threejsContainer.appendChild(renderer.domElement);

camera.position.z = 10;
camera.position.y = 8;

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5).normalize();
scene.add(directionalLight);

const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xa64324 }),
    new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
    new THREE.MeshBasicMaterial({ color: 0x7a5230 }),
];
const groundMaterial = groundMaterials[Math.floor(Math.random() * groundMaterials.length)];
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const rockGeometry = new THREE.SphereGeometry(1, 5, 5);
const rockMaterials = [
    new THREE.MeshLambertMaterial({ color: 0x7f8b8a }),
    new THREE.MeshLambertMaterial({ color: 0x4e5d5b }),
    new THREE.MeshLambertMaterial({ color: 0x3b4c4a }),
];

for (let i = 0; i < 100; i++) {
    const rock = new THREE.Mesh(rockGeometry, rockMaterials[Math.floor(Math.random() * rockMaterials.length)]);
    rock.position.set(
        Math.random() * 500 - 250,
        Math.random() * 2,
        Math.random() * 500 - 250
    );
    rock.scale.set(
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5
    );
    scene.add(rock);
}

const starGeometry = new THREE.BufferGeometry();
const starCount = 10000;
const starVertices = [];

for (let i = 0; i < starCount; i++) {
    const x = THREE.Math.randFloatSpread(500);
    const y = THREE.Math.randFloatSpread(500);
    const z = THREE.Math.randFloatSpread(500);
    starVertices.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const loader = new THREE.GLTFLoader();
let rover;

loader.load('/static/rover.glb', (gltf) => {
    rover = gltf.scene;

    rover.position.y = 1;
    rover.scale.set(1.0, 1.0, 1.0);
    rover.rotation.y = Math.PI;
    rover.position.set(0, 0.5, 0);
    scene.add(rover);

    function animate() {
        requestAnimationFrame(animate);

        if (rover) {
            const offset = new THREE.Vector3(0, 5, -10);
            const relativeCameraOffset = offset.applyMatrix4(rover.matrixWorld);
            camera.position.copy(relativeCameraOffset);
            camera.lookAt(rover.position);
        }

        renderer.render(scene, camera);
    }

    animate();
});

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = false;
controls.mouseButtons = {
    RIGHT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    LEFT: THREE.MOUSE.PAN
};

let isResizing = false;

divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', resizePanels);
    document.addEventListener('mouseup', stopResizing);
});

function resizePanels(e) {
    if (!isResizing) return;
    const containerWidth = container.clientWidth;
    const codeboxWidth = e.clientX / containerWidth * 100;
    const threejsWidth = 100 - codeboxWidth;

    codeboxContainer.style.width = `${codeboxWidth}%`;
    threejsContainer.style.width = `${threejsWidth}%`;

    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
    camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
    camera.updateProjectionMatrix();
}

function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resizePanels);
    document.removeEventListener('mouseup', stopResizing);
}

window.addEventListener('resize', () => {
    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
    camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
    camera.updateProjectionMatrix();
});

const threejsContainer = document.getElementById('threejs-container');

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
            labels[trimmedLine.slice(0, -1)] = index;
        }
    });

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("SET")) {
            const match = trimmedLine.match(/SET\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                registers[reg] = value;
                commands.push(`setSpeed(${registers[reg]});`);
            }
        } else if (trimmedLine.startsWith("FWD")) {
            const match = trimmedLine.match(/FWD\s+(R\d+)/);
            if (match) {
                const reg = match[1];
                commands.push(`moveForward(${registers[reg]});`);
            } else {
                commands.push("moveForward();");
            }
        } else if (trimmedLine.startsWith("TURN R")) {
            commands.push("turnRight();");
        } else if (trimmedLine.startsWith("TURN L")) {
            commands.push("turnLeft();");
        } else if (trimmedLine.startsWith("ADD")) {
            const match = trimmedLine.match(/ADD\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                if (registers[reg] !== undefined) {
                    registers[reg] += value;
                    commands.push(`setSpeed(${registers[reg]});`);
                } else {
                    console.error(`Register ${reg} not initialized.`);
                }
            }
        } else if (trimmedLine.startsWith("REM")) {
            const match = trimmedLine.match(/REM\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                if (registers[reg] !== undefined) {
                    registers[reg] -= value;
                    commands.push(`setSpeed(${registers[reg]});`);
                } else {
                    console.error(`Register ${reg} not initialized.`);
                }
            }
        } else if (trimmedLine.startsWith("CMP")) {
            const match = trimmedLine.match(/CMP\s+(R\d+),\s*(\d+)/);
            if (match) {
                const reg = match[1];
                const value = parseInt(match[2], 10);
                commands.push(`compareSpeed(${registers[reg]}, ${value});`);
            }
        } else if (trimmedLine.startsWith("JEQ")) {
            const label = trimmedLine.split(' ')[1];
            commands.push(`if (compareSpeed(${registers["R0"]}, 5)) { jumpToLabel('${label}', labels); return; }`);
        } else if (trimmedLine === "STOP") {
            commands.push("stopMovement();");
        } else if (trimmedLine.startsWith("JMP")) {
            const label = trimmedLine.split(' ')[1];
            commands.push(`jumpToLabel('${label}', labels);`);
        }
    });

    return { commands, labels };
}

function executeCommands(parsedCode) {
    const { commands, labels } = parsedCode;
    let index = 0;

    function jumpToLabel(label) {
        if (labels[label] !== undefined) {
            index = labels[label];
            return true;
        }
        return false;
    }

    function executeNextCommand() {
        if (index >= commands.length) {
            return;
        }

        const cmd = commands[index];

        if (cmd.includes('jumpToLabel')) {
            const label = cmd.match(/'(.+)'/)[1];
            if (jumpToLabel(label)) {
                return setTimeout(executeNextCommand, 500); 
            }
        } else {
            eval(cmd);
            index++;
        }

        setTimeout(executeNextCommand, 500);
    }

    executeNextCommand();
}

let speed = 0;

function setSpeed(value) {
    speed = value;
    console.log(`Speed set to ${speed}`);
}

function moveForward(speed) {
    if (rover && speed > 0) {
        rover.position.z -= speed * 0.1;
        console.log("Rover moved forward");
    } else {
        console.log("Rover cannot move. Speed is 0.");
    }
}

function turnRight() {
    if (rover) {
        rover.rotation.y -= Math.PI / 2;
        console.log("Rover turned right");
    }
}

function turnLeft() {
    if (rover) {
        rover.rotation.y += Math.PI / 2;
        console.log("Rover turned left");
    }
}

function compareSpeed(registerValue, cmpValue) {
    return registerValue === cmpValue;
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

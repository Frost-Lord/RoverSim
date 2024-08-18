const threejsContainer = document.getElementById('threejs-container');
const roverConsole = document.getElementById('rover-console');
const dividerHorizontal = document.getElementById('divider-horizontal');
const divider = document.getElementById('divider');
const codeboxContainer = document.getElementById('codebox-container');

function logToConsole(message) {
    const logEntry = document.createElement('div');
    
    logEntry.innerHTML = message
        .replace(/(SET|TURN|FWD|ADD|REM|MUL|JEQ|STOP|JMP|END)/g, '<span style="color: cyan; font-weight: bold;">$1</span>')
        .replace(/(\bR[0-9]+\b)/g, '<span style="color: orange; font-weight: bold;">$1</span>')
        .replace(/([0-9]+)/g, '<span style="color: yellow; font-weight: bold;">$1</span>')
        .replace(/(Invalid|Unknown)/g, '<span style="color: red; font-weight: bold;">$1</span>');
    
    roverConsole.appendChild(logEntry);
    roverConsole.scrollTop = roverConsole.scrollHeight;
}

function runCode() {
    const code = codebox.value;
    const lines = code.split('\n');
    executeCode(lines);
}

function executeCode(lines) {
    const registers = { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0, R8: 0, R9: 0 };
    const labels = {};
    const commands = [];

    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.endsWith(":")) {
            labels[trimmedLine.slice(0, -1)] = commands.length;
        } else if (trimmedLine) {
            commands.push(trimmedLine);
        }
    });

    let index = 0;
    let endLoop = false;

    function executeNextCommand() {
        if (index >= commands.length || endLoop) {
            return;
        }

        const command = commands[index];
        const [instruction, ...args] = command.split(/[\s,]+/);
        //logToConsole(`Executing: ${instruction} ${args.join(' ')}`);

        switch (instruction) {
            case 'SET':
                const reg = args[0];
                const value = parseInt(args[1], 10);
                registers[reg] = value;
                logToConsole(`SET ${reg} to ${value}`);
                index++;
                break;

            case 'TURN':
                const direction = args[0];
                if (isNaN(direction)) {
                    logToConsole(`Invalid direction: ${direction}`);
                } else if (direction < -360 || direction > 360) {
                    logToConsole(`Invalid direction: ${direction}`);
                } else {
                    turnRover(direction);
                    logToConsole(`TURN ${direction}`);
                }
                index++;
                break;

            case 'FWD':
                moveForward(registers[args[0]]);
                logToConsole(`FWD ${registers[args[0]]}`);
                index++;
                break;

            case 'ADD':
                const regAdd = args[0];
                const valueAdd = parseInt(args[1], 10);
                registers[regAdd] += valueAdd;
                logToConsole(`ADD ${valueAdd} to ${regAdd}, now ${registers[regAdd]}`);
                index++;
                break;

            case 'REM':
                const regRem = args[0];
                const valueRem = parseInt(args[1], 10);
                registers[regRem] -= valueRem;
                logToConsole(`REM ${valueRem} from ${regRem}, now ${registers[regRem]}`);
                index++;
                break;

            case 'MUL':
                const regMul = args[0];
                const valueMul = parseInt(args[1], 10);
                registers[regMul] *= valueMul;
                logToConsole(`MUL ${valueMul} to ${regMul}, now ${registers[regMul]}`);
                index++;
                break;

            case 'JEQ':
                const label = args[0];
                const regJEQ = args[1];
                const valueJEQ = parseInt(args[2], 10);
                if (registers[regJEQ] === valueJEQ) {
                    logToConsole(`JEQ to ${label} : ${registers[regJEQ]} === ${valueJEQ}`);
                    index = labels[label];
                } else {
                    logToConsole(`JEQ not met: ${registers[regJEQ]} !== ${valueJEQ}`);
                    index++;
                }
                break;

            case 'STOP':
                stopMovement();
                endLoop = true;
                logToConsole("STOP");
                return;

            case 'JMP':
                const jumpLabel = args[0];
                logToConsole(`JMP to ${jumpLabel}`);
                index = labels[jumpLabel];
                break;

            case 'END':
                endLoop = true;
                logToConsole("END");
                return;

            default:
                logToConsole(`Unknown instruction: ${instruction}`);
                index++;
                break;
        }

        if (!endLoop) {
            setTimeout(executeNextCommand, 500);
        }
    }

    executeNextCommand();
}

let speed = 1;

function moveForward(steps) {
    if (rover && steps > 0) {
        const moveDistance = steps * speed;
        const initialPosition = rover.position.clone();
        const moveDuration = 1000;
        const moveStartTime = performance.now();

        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(rover.quaternion);

        function animateMove(time) {
            const elapsedTime = time - moveStartTime;
            const progress = Math.min(elapsedTime / moveDuration, 1);

            const delta = direction.clone().multiplyScalar(moveDistance * progress);
            rover.position.copy(initialPosition.clone().add(delta));

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            }
        }

        requestAnimationFrame(animateMove);
    } else {
        logToConsole("Rover cannot move. Speed or steps is 0.");
    }
}

function turnRover(degrees) {
    if (rover) {
        const initialRotation = rover.rotation.y;
        const targetRotation = initialRotation - THREE.Math.degToRad(degrees);
        const turnDuration = 1000;
        const turnStartTime = performance.now();

        function animateTurn(time) {
            const elapsedTime = time - turnStartTime;
            const progress = Math.min(elapsedTime / turnDuration, 1);
            rover.rotation.y = initialRotation + (targetRotation - initialRotation) * progress;

            if (progress < 1) {
                requestAnimationFrame(animateTurn);
            }
        }

        requestAnimationFrame(animateTurn);
    } else {
        logToConsole("Rover cannot turn. Rover is not defined.");
    }
}

function stopMovement() {
    speed = 0;
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

const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xa64324 }),
    new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
    new THREE.MeshBasicMaterial({ color: 0x7a5230 }),
];
const groundMaterial = groundMaterials[Math.floor(Math.random() * groundMaterials.length)];
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const rockGeometry = new THREE.SphereGeometry(1, 10, 10);
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
    const x = THREE.Math.randFloatSpread(1000);
    const y = THREE.Math.randFloatSpread(1000);
    const z = THREE.Math.randFloatSpread(1000);
    starVertices.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

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

window.addEventListener('resize', () => {
    renderer.setSize(threejsContainer.clientWidth, threejsContainer.clientHeight);
    camera.aspect = threejsContainer.clientWidth / threejsContainer.clientHeight;
    camera.updateProjectionMatrix();
});
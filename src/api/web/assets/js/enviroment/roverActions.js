const threejsContainer = document.getElementById('threejs-container');
let speed = 0;
let batteryLevel = 100;
const batteryDrainRate = 0.0002;
const batteryRechargeRate = 0.11;

const batteryDisplay = document.createElement('div');
batteryDisplay.id = 'battery-display';
threejsContainer.appendChild(batteryDisplay);

batteryDisplay.style.position = 'absolute';
batteryDisplay.style.bottom = '10px';
batteryDisplay.style.left = '10px';
batteryDisplay.style.padding = '5px 10px';
batteryDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
batteryDisplay.style.color = '#ffffff';
batteryDisplay.style.fontFamily = 'monospace';
batteryDisplay.style.fontSize = '14px';
batteryDisplay.style.zIndex = '1000';

updateBatteryDisplay(batteryLevel);

function updateBatteryDisplay(level) {
    const totalBars = 20;
    const filledBars = Math.round((level / 100) * totalBars);
    const batteryBar = `[${'='.repeat(filledBars)}${' '.repeat(totalBars - filledBars)}] (${level.toFixed(2)}%)`;
    batteryDisplay.textContent = `Battery: ${batteryBar}`;
}

function drainBattery(duration) {
    const drainAmount = batteryDrainRate * duration;
    batteryLevel = Math.max(batteryLevel - drainAmount, 0);
    updateBatteryDisplay(batteryLevel);
}

function rechargeBattery() {
    if (speed === 0 && batteryLevel < 100) {
        batteryLevel = Math.min(batteryLevel + batteryRechargeRate, 100);
        updateBatteryDisplay(batteryLevel);
    }
}

function moveForward(steps) {
    if (rover && steps > 0 && batteryLevel > 0) {
        speed = 1;
        const moveDistance = steps * speed;
        const initialPosition = rover.position.clone();
        const moveDuration = 1000;
        const moveStartTime = performance.now();
        
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(rover.quaternion).normalize();

        function animateMove(time) {
            const elapsedTime = time - moveStartTime;
            const progress = Math.min(elapsedTime / moveDuration, 1);

            const delta = direction.clone().multiplyScalar(moveDistance * progress);
            rover.position.copy(initialPosition.clone().add(delta));

            drainBattery(elapsedTime);

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            } else {
                stopMovement();
            }
        }

        requestAnimationFrame(animateMove);
    } else {
        console.log("Rover cannot move. Speed or steps is 0, or battery is depleted.");
    }
}


function turnRover(degrees) {
    if (rover && batteryLevel > 0) {
        speed = 1;
        const initialRotation = rover.rotation.y;
        const targetRotation = initialRotation - THREE.Math.degToRad(degrees);
        const turnDuration = 1000;
        const turnStartTime = performance.now();

        function animateTurn(time) {
            const elapsedTime = time - turnStartTime;
            const progress = Math.min(elapsedTime / turnDuration, 1);
            rover.rotation.y = initialRotation + (targetRotation - initialRotation) * progress;

            drainBattery(elapsedTime);

            if (progress < 1) {
                requestAnimationFrame(animateTurn);
            } else {
                stopMovement();
            }
        }

        requestAnimationFrame(animateTurn);
    } else {
        console.log("Rover cannot turn. Rover is not defined or battery is depleted.");
    }
}

function stopMovement() {
    speed = 0;
}

function startBatteryRecharge() {
    function recharge() {
        rechargeBattery();
        requestAnimationFrame(recharge);
    }
    requestAnimationFrame(recharge);
}

startBatteryRecharge();

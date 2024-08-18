const roverConsole = document.getElementById('rover-console');

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

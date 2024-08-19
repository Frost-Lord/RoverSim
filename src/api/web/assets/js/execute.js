const roverConsole = document.getElementById("rover-console");
let runningInterval = null;
let endLoop = false;

function logToConsole(message) {
  const logEntry = document.createElement("div");

  logEntry.innerHTML = message
    .replace(
      /(SET|TURN|FWD|ADD|REM|MUL|BATT|EQU|LTE|GTE|STOP|JMP|END|START)/g,
      '<span style="color: cyan; font-weight: bold;">$1</span>'
    )
    .replace(
      /(\bR[0-9]+\b)/g,
      '<span style="color: orange; font-weight: bold;">$1</span>'
    )
    .replace(
      /([0-9]+)/g,
      '<span style="color: yellow; font-weight: bold;">$1</span>'
    )
    .replace(
      /(Invalid|Unknown)/g,
      '<span style="color: red; font-weight: bold;">$1</span>'
    );

  roverConsole.appendChild(logEntry);
  roverConsole.scrollTop = roverConsole.scrollHeight;
}

function LoadingBar(totalBytes) {
  let loadedBytes = 0;
  const intervalTime = 1;

  return new Promise((resolve) => {
    if (runningInterval) clearInterval(runningInterval);
    runningInterval = setInterval(() => {
      if (loadedBytes >= totalBytes) {
        clearInterval(runningInterval);
        logToConsole(
          `Uploaded [=========================] ${loadedBytes.toLocaleString()} bytes/ ${totalBytes.toLocaleString()} bytes (100.00%)`
        );
        logToConsole("Running program!");
        resolve();
        return;
      }

      loadedBytes += 1;

      const percentage = (loadedBytes / totalBytes) * 100;
      const progressBar = `[${"=".repeat(
        Math.floor(percentage / 4)
      )}${" ".repeat(25 - Math.floor(percentage / 4))}]`;
      const message = `Uploading ${progressBar} ${loadedBytes.toLocaleString()} bytes/ ${totalBytes.toLocaleString()} bytes (${percentage.toFixed(
        2
      )}%)`;

      logToConsole(message);
    }, intervalTime);
  });
}

async function runCode() {
  if (runningInterval) clearInterval(runningInterval);
  endLoop = true;

  const code = codebox.value;
  const totalBytes = new TextEncoder().encode(code).length;
  roverConsole.innerHTML = "";
  await LoadingBar(totalBytes);

  endLoop = false;
  executeCode(code.split("\n"));
}

function executeCode(lines) {
  const registers = {
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
    R6: 0,
    R7: 0,
    R8: 0,
    R9: 0,
  };
  const labels = {};
  const commands = [];

  let hasStart = false;
  let hasStop = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine === "START:") {
      hasStart = true;
    }
    if (trimmedLine.includes("STOP")) {
      hasStop = true;
    }
    if (trimmedLine.endsWith(":")) {
      labels[trimmedLine.slice(0, -1)] = commands.length;
    } else if (trimmedLine) {
      commands.push(trimmedLine);
    }
  });

  if (!hasStart || !hasStop) {
    logToConsole(`Error: Missing ${!hasStart ? "START:" : "STOP"} command`);
    return;
  }

  let index = 0;

  function executeNextCommand() {
    if (index >= commands.length || endLoop) {
      return;
    }

    const command = commands[index];
    const [instruction, ...args] = command.split(/[\s,]+/);

    switch (instruction) {
      case "START":
        logToConsole("START");
        index++;
        break;

      case "SET":
        const reg = args[0];
        const value = parseInt(args[1], 10);
        registers[reg] = value;
        logToConsole(`SET ${reg} to ${value}`);
        index++;
        break;

      case "BATT":
        const regBatt = args[0];
        registers[regBatt] = batteryLevel;
        logToConsole(`BATT ${regBatt} (${batteryLevel.toFixed(2)})`);
        index++;
        break;

      case "FWD":
        const regFwd = registers[args[0]] == undefined ? args[0] : registers[args[0]];
        moveForward(regFwd);
        logToConsole(`FWD ${regFwd}`);
        index++;
        break;

      case "ADD":
        const regAdd = args[0];
        const valueAdd = parseInt(args[1], 10);
        registers[regAdd] += valueAdd;
        logToConsole(`ADD ${valueAdd} to ${regAdd}, now ${registers[regAdd]}`);
        index++;
        break;

      case "REM":
        const regRem = args[0];
        const valueRem = parseInt(args[1], 10);
        registers[regRem] -= valueRem;
        logToConsole(`REM ${valueRem} from ${regRem}, now ${registers[regRem]}`);
        index++;
        break;

      case "LTE":
        const labelLTE = args[0];
        const regLTE = args[1];
        const valueLTE = parseInt(args[2], 10);
        if (registers[regLTE] <= valueLTE) {
          logToConsole(
            `LTE to ${labelLTE} : ${registers[regLTE]} <= ${valueLTE}`
          );
          index = labels[labelLTE];
        } else {
          logToConsole(`LTE not met: ${registers[regLTE]} > ${valueLTE}`);
          index++;
        }
        break;

      case "GTE":
        const labelGTE = args[0];
        const regGTE = args[1];
        const valueGTE = parseInt(args[2], 10);
        if (registers[regGTE] >= valueGTE) {
          logToConsole(
            `GTE to ${labelGTE} : ${registers[regGTE]} >= ${valueGTE}`
          );
          index = labels[labelGTE];
        } else {
          logToConsole(`GTE not met: ${registers[regGTE]} < ${valueGTE}`);
          index++;
        }
        break;

      case "EQU":
        const labelEQU = args[0];
        const regEQU = args[1];
        const valueEQU = parseInt(args[2], 10);
        if (registers[regEQU] == valueEQU) {
          logToConsole(
            `EQU to ${labelEQU} : ${registers[regEQU]} == ${valueEQU}`
          );
          index = labels[labelEQU];
        } else {
          logToConsole(`EQU not met: ${registers[regEQU]} != ${valueEQU}`);
          index++;
        }
        break;

      case "STOP":
        stopMovement();
        endLoop = true;
        logToConsole("STOP");
        return;

      case "JMP":
        const jumpLabel = args[0];
        logToConsole(`JMP to ${jumpLabel}`);
        index = labels[jumpLabel];
        break;

      case "TURN":
        const regTurn = registers[args[0]] == undefined ? args[0] : registers[args[0]];
        turnRover(regTurn);
        logToConsole(`TURN ${regTurn}`);
        index++;
        break;

      case "END":
        endLoop = true;
        logToConsole("END");
        return;

      default:
        logToConsole(`Unknown instruction: ${instruction}`);
        index++;
        break;
    }

    if (!endLoop) {
      runningInterval = setTimeout(executeNextCommand, 500);
    }
  }

  executeNextCommand();
}

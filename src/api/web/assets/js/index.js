const codebox = document.getElementById('codebox');
const lineNumbers = document.getElementById('line-numbers');
const highlightedCode = document.getElementById('highlighted-code');
let timeoutId;

function updateLineNumbers() {
    const lines = codebox.value.split('\n').length;
    lineNumbers.innerHTML = '';
    for (let i = 1; i <= lines; i++) {
        const line = document.createElement('span');
        line.textContent = i;
        lineNumbers.appendChild(line);
    }
}

function highlightCode() {
    const code = codebox.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\b\d+\b/g, '<span class="number">$&</span>')
        .replace(/(FWD|TURN|ADD|MUL|EQU|LTE|GTE|JMP|SET|REM|BATT)/g, '<span class="command" title="$1 command">$1</span>')
        .replace(/(START|END|STOP|LOOP|STOP_MOVE)/g, '<span class="keyword">$1</span>')
        .replace(/(\b[A-Z_]+)(:)/g, '<span class="keyword">$1</span>$2')
        .replace(/(R\d+)/g, '<span class="register">$1</span>')
        .replace(/(;.*NOTE.*)/g, '<span class="note">$1</span>')
        .replace(/(;.*FIXME.*)/g, '<span class="fixme">$1</span>')
        .replace(/(;.*IMPORTANT.*)/g, '<span class="important">$1</span>')
        .replace(/(;.*)/g, '<span class="comment">$1</span>');

    highlightedCode.innerHTML = code;
}

function setDefaultCode() {
    const defaultCode = 
`START:
    SET R0, 1               ; Set the R0 to 1
    SET R1, 1               ; Set the R1 to 1
    JMP LOOP                ; Jump to loop

LOOP:
    FWD R0                  ; Move forward by R0 value
    ADD R1, 1               ; Add 1 to R1
    BATT R2                 ; Check battery level and store in R2
    LTE CHARGE, R2, 60      ; If R2 <= 60, jump to CHARGE else continue
    JMP LOOP                ; If LTE not met, jump back to LOOP

CHARGE:
    BATT R2                 ; Check battery level and store in R2
    GTE LOOP, R2, 100       ; If R2 >= 100, jump back to LOOP
    JMP CHARGE              ; Continue charging until battery is full

END:
    STOP                    ; End of program`;

    codebox.value = defaultCode;
    updateLineNumbers();
    highlightCode();
}

window.onload = setDefaultCode;

codebox.addEventListener('input', () => {
    updateLineNumbers();
    highlightCode();

    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
        runCode();
    }, 2000);
});


codebox.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codebox.scrollTop;
    highlightedCode.scrollTop = codebox.scrollTop;
});

updateLineNumbers();
highlightCode();

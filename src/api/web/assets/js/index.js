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
        .replace(/(FWD|TURN|ADD|MUL|JEQ|JMP|SET|REM)/g, '<span class="command">$1</span>')
        .replace(/(START|END|STOP|LOOP|STOP_MOVE)/g, '<span class="keyword">$1</span>')
        .replace(/(R\d+)/g, '<span class="register">$1</span>')
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
    JEQ END, R1, 10         ; If R1 == 10 jump to STOP_MOVE else loop
    JMP LOOP                ; If JEQ not met, jump back to LOOP

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

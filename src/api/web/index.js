const codebox = document.getElementById('codebox');
const lineNumbers = document.getElementById('line-numbers');
const highlightedCode = document.getElementById('highlighted-code');

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

codebox.addEventListener('input', () => {
    updateLineNumbers();
    highlightCode();
    runCode();
});

codebox.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codebox.scrollTop;
    highlightedCode.scrollTop = codebox.scrollTop;
});

updateLineNumbers();
highlightCode();

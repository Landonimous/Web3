// game.js — классическая версия: одно нажатие = один ход.
// Все DOM-операции через createElement/appendChild/removeChild

const SIZE = 4;
const gameEl = document.getElementById("game");
const scoreEl = document.getElementById("score");

let board = [];
let score = 0;
let undoStack = [];

// -------------------------- утилиты ----------------------------
function cloneBoard(b) {
    return b.map(row => row.slice());
}
function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// -------------------------- рендер ----------------------------
function render() {
    clearEl(gameEl);
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const tile = document.createElement("div");
            const v = board[r][c];
            tile.className = "tile v" + (v === 0 ? "0" : v);
            tile.textContent = v === 0 ? "" : String(v);
            gameEl.appendChild(tile);
        }
    }
    scoreEl.textContent = score;
}

// -------------------------- логика поля ----------------------------
function freshBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function emptyCells() {
    const list = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) list.push([r, c]);
        }
    }
    return list;
}

function spawn() {
    const empty = emptyCells();
    if (!empty.length) return false;
    const [r, c] = empty[(Math.random() * empty.length) | 0];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
}

function compressLine(arr) {
    const seq = arr.filter(v => v !== 0);
    const res = [];
    let gain = 0;
    for (let i = 0; i < seq.length; i++) {
        if (seq[i] === seq[i + 1]) {
            const m = seq[i] * 2;
            res.push(m);
            gain += m;
            i++;
        } else {
            res.push(seq[i]);
        }
    }
    while (res.length < SIZE) res.push(0);
    return { line: res, gain };
}

function rotateCW(b) {
    const n = SIZE;
    const nb = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            nb[c][n - 1 - r] = b[r][c];
        }
    }
    return nb;
}

function moveLeftOnce() {
    let changed = false;
    for (let r = 0; r < SIZE; r++) {
        const old = board[r];
        const { line, gain } = compressLine(old);
        if (String(line) !== String(old)) changed = true;
        board[r] = line;
        score += gain;
    }
    return changed;
}

// -------------------------- движение (с undo) ----------------------------
function saveUndo() {
    undoStack.push({ board: cloneBoard(board), score });
    if (undoStack.length > 20) undoStack.shift();
}

function move(dir) {
    // сохраняем в историю перед попыткой хода
    saveUndo();

    let moved = false;
    if (dir === "left") {
        moved = moveLeftOnce();
    } else if (dir === "right") {
        board = rotateCW(rotateCW(board));
        moved = moveLeftOnce();
        board = rotateCW(rotateCW(board));
    } else if (dir === "up") {
        board = rotateCW(rotateCW(rotateCW(board))); // rotate CCW
        moved = moveLeftOnce();
        board = rotateCW(board);
    } else if (dir === "down") {
        board = rotateCW(board);
        moved = moveLeftOnce();
        board = rotateCW(rotateCW(rotateCW(board)));
    }

    if (!moved) {
        // откат истории, если реально ничего не изменилось
        undoStack.pop();
        return;
    }

    // успешный ход — спавним плитку, отрисовываем и проверяем конец игры
    spawn();
    render();

    if (!canMove()) {
        setTimeout(() => {
            alert("Игра окончена — нет возможных ходов.");
        }, 20);
    }
}

// -------------------------- проверка доступности хода ----------------------------
function canMove() {
    // есть пустые клетки?
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) return true;

    // проверка слияний по горизонтали
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE - 1; c++) if (board[r][c] === board[r][c + 1]) return true;

    // проверка слияний по вертикали
    for (let c = 0; c < SIZE; c++) for (let r = 0; r < SIZE - 1; r++) if (board[r][c] === board[r + 1][c]) return true;

    return false;
}

// -------------------------- кнопки и клавиши ----------------------------
document.getElementById("restart").addEventListener("click", startNewGame);

document.getElementById("undo").addEventListener("click", () => {
    if (!undoStack.length) return;
    const prev = undoStack.pop();
    board = cloneBoard(prev.board);
    score = prev.score;
    render();
});

document.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("click", () => move(btn.dataset.dir));
});

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
});

// -------------------------- старт/сохранение ----------------------------
function startNewGame() {
    undoStack = [];
    score = 0;
    freshBoard();
    spawn();
    spawn();
    render();
}

// Попытка загрузить состояние из localStorage (если нужно)
function loadState() {
    try {
        const raw = localStorage.getItem('2048_state');
        if (!raw) return false;
        const obj = JSON.parse(raw);
        if (obj && obj.board) { board = obj.board; score = obj.score || 0; undoStack = obj.undo || []; return true; }
    } catch (e) { }
    return false;
}

function saveState() {
    try {
        localStorage.setItem('2048_state', JSON.stringify({ board, score, undo: undoStack }));
    } catch (e) { }
}

window.addEventListener('beforeunload', saveState);

// Инициализация при загрузке
if (!loadState()) {
    startNewGame();
} else {
    render();
}

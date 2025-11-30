const size = 4;
let board = [];
let score = 0;

const game = document.getElementById("game");
const scoreEl = document.getElementById("score");

function init() {
    board = Array(size).fill(null).map(() => Array(size).fill(0));
    score = 0;
    scoreEl.textContent = score;

    addTile();
    addTile();
    draw();
}

function addTile() {
    let empty = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) empty.push([r, c]);
        }
    }
    if (empty.length === 0) return;

    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function draw() {
    game.innerHTML = "";
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const div = document.createElement("div");
            div.className = "tile";
            if (board[r][c] !== 0) div.textContent = board[r][c];
            game.appendChild(div);
        }
    }
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < size; r++) {
        let row = board[r].filter(v => v !== 0);

        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                score += row[i];
                row.splice(i + 1, 1);
            }
        }
        while (row.length < 4) row.push(0);

        if (board[r].toString() !== row.toString()) moved = true;

        board[r] = row;
    }
    if (moved) {
        addTile();
        draw();
        scoreEl.textContent = score;
    }
}

function rotate() {
    const newBoard = Array(size)
        .fill(null)
        .map(() => Array(size).fill(0));

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            newBoard[c][size - r - 1] = board[r][c];
        }
    }

    board = newBoard;
}

function moveUp() { rotate(); moveLeft(); rotate(); rotate(); rotate(); }
function moveRight() { rotate(); rotate(); moveLeft(); rotate(); rotate(); }
function moveDown() { rotate(); rotate(); rotate(); moveLeft(); rotate(); }

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowUp") moveUp();
    if (e.key === "ArrowRight") moveRight();
    if (e.key === "ArrowDown") moveDown();
});

document.getElementById("left").onclick = moveLeft;
document.getElementById("up").onclick = moveUp;
document.getElementById("right").onclick = moveRight;
document.getElementById("down").onclick = moveDown;

init();

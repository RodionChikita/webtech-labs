"use strict";
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** @type {("X"|"O"|null)[]} */
let cells = Array(9).fill(null);
/** @type {"X"|"O"} */
let current = "X";
let finished = false;

function render() {
  boardEl.innerHTML = "";
  cells.forEach((value, idx) => {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.type = "button";
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-rowindex", String(Math.floor(idx / 3) + 1));
    btn.setAttribute("aria-colindex", String((idx % 3) + 1));
    btn.textContent = value ? value : "";
    btn.disabled = Boolean(value) || finished;
    btn.addEventListener("click", () => onCellClick(idx));
    boardEl.appendChild(btn);
  });
  statusEl.textContent = finished ? getResultText() : `Ходит ${current}`;
}

function onCellClick(index) {
  if (cells[index] || finished) return;
  cells[index] = current;
  const winner = getWinner();
  if (winner) {
    finished = true;
  } else if (cells.every(Boolean)) {
    finished = true; // ничья
  } else {
    current = current === "X" ? "O" : "X";
  }
  render();
}

function getWinner() {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
}

function getResultText() {
  const w = getWinner();
  if (w) return `Победил ${w}`;
  return "Ничья";
}

function reset() {
  cells = Array(9).fill(null);
  current = "X";
  finished = false;
  render();
}

resetBtn.addEventListener("click", reset);
render(); 
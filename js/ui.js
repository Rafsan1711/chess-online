// ui.js

const boardContainer = document.getElementById("board-container");
const capturedWhiteDiv = document.getElementById("captured-white");
const capturedBlackDiv = document.getElementById("captured-black");
const whiteClockDiv = document.getElementById("white-clock");
const blackClockDiv = document.getElementById("black-clock");

const modal = document.getElementById("winner-modal");
const winnerText = document.getElementById("winner-text");
const modalRestartBtn = document.getElementById("modal-restart-btn");

const toastContainer = document.getElementById("toast-container");

const pieceImages = {
  wP: "pieces/wP.svg",
  wR: "pieces/wR.svg",
  wN: "pieces/wN.svg",
  wB: "pieces/wB.svg",
  wQ: "pieces/wQ.svg",
  wK: "pieces/wK.svg",
  bP: "pieces/bP.svg",
  bR: "pieces/bR.svg",
  bN: "pieces/bN.svg",
  bB: "pieces/bB.svg",
  bQ: "pieces/bQ.svg",
  bK: "pieces/bK.svg",
};

let selectedSquare = null;
let validMoves = [];

// Create the 8x8 squares dynamically
export function createBoardDOM() {
  if (!boardContainer) return;
  boardContainer.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = document.createElement("div");
      sq.classList.add("square");
      sq.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      sq.dataset.row = row;
      sq.dataset.col = col;
      boardContainer.appendChild(sq);
    }
  }
}

// Get a square div by row and col
export function getSquareDiv(row, col) {
  return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

// Render pieces on the board based on boardState
export function renderPieces(boardState) {
  if (!boardState) return;

  // Remove all existing piece images first
  document.querySelectorAll("img.piece").forEach(el => el.remove());

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const code = boardState[r][c];
      if (code && pieceImages[code]) {
        const img = document.createElement("img");
        img.classList.add("piece");
        img.src = pieceImages[code];
        img.draggable = false;

        const squareDiv = getSquareDiv(r, c);
        if (squareDiv) squareDiv.appendChild(img);
      }
    }
  }
}

// Highlight selected square and valid moves
export function updateHighlights(selected, moves) {
  // Clear old highlights
  document.querySelectorAll(".selected, .highlight").forEach(el => {
    el.classList.remove("selected", "highlight");
  });

  if (!selected || !moves) return;

  getSquareDiv(selected.row, selected.col)?.classList.add("selected");

  moves.forEach(mv => {
    getSquareDiv(mv.row, mv.col)?.classList.add("highlight");
  });
}

// Clear captured pieces UI
export function clearCaptured() {
  if (capturedWhiteDiv) capturedWhiteDiv.innerHTML = "";
  if (capturedBlackDiv) capturedBlackDiv.innerHTML = "";
}

// Add captured piece image to captured area
export function addCapturedPiece(code) {
  if (!code) return;
  const img = document.createElement("img");
  img.classList.add("piece", "captured");
  img.src = pieceImages[code];

  if (code.startsWith("w")) {
    if (capturedWhiteDiv) capturedWhiteDiv.appendChild(img);
  } else {
    if (capturedBlackDiv) capturedBlackDiv.appendChild(img);
  }
}

// Format seconds to mm:ss string
export function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Update clocks and highlight active player
export function updateClocksDisplay(whiteTime, blackTime, turn) {
  if (!whiteClockDiv || !blackClockDiv) return;

  whiteClockDiv.textContent = formatTime(whiteTime);
  blackClockDiv.textContent = formatTime(blackTime);

  if (turn === "white") {
    whiteClockDiv.classList.add("active-clock");
    whiteClockDiv.classList.remove("inactive-clock");
    blackClockDiv.classList.add("inactive-clock");
    blackClockDiv.classList.remove("active-clock");
  } else {
    blackClockDiv.classList.add("active-clock");
    blackClockDiv.classList.remove("inactive-clock");
    whiteClockDiv.classList.add("inactive-clock");
    whiteClockDiv.classList.remove("active-clock");
  }
}

// Open winner modal with message
export function openModal(winnerMessage) {
  if (!modal || !winnerText) return;
  winnerText.textContent = winnerMessage;
  modal.style.display = "flex";
}

// Close winner modal
export function closeModal() {
  if (!modal) return;
  modal.style.display = "none";
}

// Setup restart button in modal
export function setupModalRestart(onRestart) {
  if (!modalRestartBtn) return;
  modalRestartBtn.onclick = () => {
    closeModal();
    if (typeof onRestart === "function") onRestart();
  };
}

/**
 * Toast Notifications
 * Requires CSS class .toast and optional .hide with transition opacity
 */
export function showToast(message, duration = 3000) {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Remove after duration with fade-out
  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}

// Selection tracking helpers
export function setSelectedSquare(square) {
  selectedSquare = square;
}
export function setValidMoves(moves) {
  validMoves = moves;
}
export function getSelectedSquare() {
  return selectedSquare;
}
export function getValidMoves() {
  return validMoves;
}
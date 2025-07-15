// ===== game.js =====
// Core game mechanics: move logic, clocks, promotion, castling, en passant, check/checkmate

export let boardState;
export let turn;
export let castlingRights;
export let enPassantTarget;
export let halfmoveClock;
export let fullmoveNumber;
export let whiteTime;
export let blackTime;
export let clockInterval;

export function initGame() {
  boardState = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR'],
  ];
  turn = 'white';
  castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
  enPassantTarget = null;
  halfmoveClock = 0;
  fullmoveNumber = 1;
  whiteTime = 600;
  blackTime = 600;
  clearInterval(clockInterval);
}

export function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function startClock(updateDisplay, onTimeout) {
  clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    if (turn === 'white') {
      whiteTime = Math.max(0, whiteTime - 1);
      if (whiteTime === 0) onTimeout('Black');
    } else {
      blackTime = Math.max(0, blackTime - 1);
      if (blackTime === 0) onTimeout('White');
    }
    updateDisplay();
  }, 1000);
}

export function stopClock() {
  clearInterval(clockInterval);
}

export function opponent(side) {
  return side === 'white' ? 'black' : 'white';
}

export function isWhitePiece(code) {
  return code && code.startsWith('w');
}
export function isBlackPiece(code) {
  return code && code.startsWith('b');
}

export function pieceColor(code) {
  return isWhitePiece(code) ? 'white' : isBlackPiece(code) ? 'black' : null;
}
// ===== CONTINUATION =====

// Direction vectors for pieces
const knightMoves = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];
const bishopDirs = [
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];
const rookDirs = [
  [-1, 0], [1, 0], [0, -1], [0, 1]
];
const queenDirs = bishopDirs.concat(rookDirs);
const kingDirs = queenDirs;

function insideBoard(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Check if a square is attacked by the opponent of `side`
export function isSquareAttacked(side, row, col) {
  const opp = side === 'white' ? 'b' : 'w';

  // Pawn attacks
  const pawnDir = side === 'white' ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc;
    if (insideBoard(r,c) && boardState[r][c] === opp + 'P') return true;
  }

  // Knight attacks
  for (const [dr, dc] of knightMoves) {
    const r = row + dr, c = col + dc;
    if (insideBoard(r,c) && boardState[r][c] === opp + 'N') return true;
  }

  // Bishop / Queen diagonal attacks
  for (const [dr, dc] of bishopDirs) {
    let r = row + dr, c = col + dc;
    while (insideBoard(r,c)) {
      const sq = boardState[r][c];
      if (sq) {
        if (sq.startsWith(opp) && (sq[1] === 'B' || sq[1] === 'Q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // Rook / Queen straight attacks
  for (const [dr, dc] of rookDirs) {
    let r = row + dr, c = col + dc;
    while (insideBoard(r,c)) {
      const sq = boardState[r][c];
      if (sq) {
        if (sq.startsWith(opp) && (sq[1] === 'R' || sq[1] === 'Q')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  // King attacks (one step around)
  for (const [dr, dc] of kingDirs) {
    const r = row + dr, c = col + dc;
    if (insideBoard(r,c) && boardState[r][c] === opp + 'K') return true;
  }

  return false;
}

export function findKing(side) {
  const target = side === 'white' ? 'wK' : 'bK';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (boardState[r][c] === target) return { row: r, col: c };
    }
  }
  return null;
}

export function isInCheck(side) {
  const kingPos = findKing(side);
  if (!kingPos) return false;
  return isSquareAttacked(side, kingPos.row, kingPos.col);
}

// Generate legal moves for piece at (r, c) - includes move validation (no self-check)
export function getLegalMoves(r, c) {
  const piece = boardState[r][c];
  if (!piece) return [];

  const color = pieceColor(piece);
  if (color !== turn) return [];

  const type = piece[1];
  let moves = [];

  function addMove(rr, cc) {
    if (!insideBoard(rr, cc)) return;
    const target = boardState[rr][cc];
    if (!target || pieceColor(target) !== color) moves.push({ from: [r,c], to: [rr, cc] });
  }

  if (type === 'P') {
    // Pawn moves
    const dir = color === 'white' ? -1 : 1;
    // forward 1
    let r1 = r + dir;
    if (insideBoard(r1, c) && !boardState[r1][c]) {
      moves.push({ from: [r,c], to: [r1, c] });
      // forward 2 from start
      if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
        let r2 = r + 2*dir;
        if (!boardState[r2][c]) moves.push({ from: [r,c], to: [r2, c] });
      }
    }
    // captures
    for (const dc of [-1, 1]) {
      let cc = c + dc;
      if (insideBoard(r1, cc)) {
        const target = boardState[r1][cc];
        if (target && pieceColor(target) !== color) moves.push({ from: [r,c], to: [r1, cc] });
        // en passant
        if (enPassantTarget && enPassantTarget[0] === r1 && enPassantTarget[1] === cc) {
          moves.push({ from: [r,c], to: [r1, cc], enPassant: true });
        }
      }
    }
  } else if (type === 'N') {
    for (const [dr, dc] of knightMoves) {
      const rr = r + dr, cc = c + dc;
      if (!insideBoard(rr, cc)) continue;
      const target = boardState[rr][cc];
      if (!target || pieceColor(target) !== color) moves.push({ from: [r,c], to: [rr, cc] });
    }
  } else if (type === 'B' || type === 'R' || type === 'Q') {
    const directions = type === 'B' ? bishopDirs : type === 'R' ? rookDirs : queenDirs;
    for (const [dr, dc] of directions) {
      let rr = r + dr, cc = c + dc;
      while (insideBoard(rr, cc)) {
        const target = boardState[rr][cc];
        if (!target) {
          moves.push({ from: [r,c], to: [rr, cc] });
        } else {
          if (pieceColor(target) !== color) moves.push({ from: [r,c], to: [rr, cc] });
          break;
        }
        rr += dr; cc += dc;
      }
    }
  } else if (type === 'K') {
    for (const [dr, dc] of kingDirs) {
      const rr = r + dr, cc = c + dc;
      if (!insideBoard(rr, cc)) continue;
      const target = boardState[rr][cc];
      if (!target || pieceColor(target) !== color) moves.push({ from: [r,c], to: [rr, cc] });
    }
    // Castling moves
    if (!isInCheck(color)) {
      const rank = color === 'white' ? 7 : 0;
      // King-side
      if ((color === 'white' && castlingRights.wK) || (color === 'black' && castlingRights.bK)) {
        if (!boardState[rank][5] && !boardState[rank][6]) {
          if (!isSquareAttacked(color, rank, 5) && !isSquareAttacked(color, rank, 6)) {
            moves.push({ from: [r,c], to: [rank, 6], castle: 'K' });
          }
        }
      }
      // Queen-side
      if ((color === 'white' && castlingRights.wQ) || (color === 'black' && castlingRights.bQ)) {
        if (!boardState[rank][1] && !boardState[rank][2] && !boardState[rank][3]) {
          if (!isSquareAttacked(color, rank, 2) && !isSquareAttacked(color, rank, 3)) {
            moves.push({ from: [r,c], to: [rank, 2], castle: 'Q' });
          }
        }
      }
    }
  }

  // Filter out moves that leave own king in check
  const legalMoves = [];
  for (const move of moves) {
    const { from, to } = move;
    const backupFrom = boardState[from[0]][from[1]];
    const backupTo = boardState[to[0]][to[1]];
    const backupEnPassant = enPassantTarget;
    const backupCastling = { ...castlingRights };

    // Make the move temporarily
    boardState[to[0]][to[1]] = boardState[from[0]][from[1]];
    boardState[from[0]][from[1]] = '';

    // Handle en passant capture temporarily
    let capturedEnPassantPawn = null;
    if (move.enPassant) {
      const epRow = from[0];
      const epCol = to[1];
      capturedEnPassantPawn = boardState[epRow][epCol];
      boardState[epRow][epCol] = '';
    }

    // Handle castling rook move temporarily
    if (move.castle === 'K') {
      const rank = from[0];
      boardState[rank][5] = boardState[rank][7];
      boardState[rank][7] = '';
    } else if (move.castle === 'Q') {
      const rank = from[0];
      boardState[rank][3] = boardState[rank][0];
      boardState[rank][0] = '';
    }

    const inCheck = isInCheck(color);

    // Undo move
    boardState[from[0]][from[1]] = backupFrom;
    boardState[to[0]][to[1]] = backupTo;
    if (move.enPassant) {
      const epRow = from[0];
      const epCol = to[1];
      boardState[epRow][epCol] = capturedEnPassantPawn;
    }
    if (move.castle === 'K') {
      const rank = from[0];
      boardState[rank][7] = boardState[rank][5];
      boardState[rank][5] = '';
    } else if (move.castle === 'Q') {
      const rank = from[0];
      boardState[rank][0] = boardState[rank][3];
      boardState[rank][3] = '';
    }

    if (!inCheck) legalMoves.push(move);
  }

  return legalMoves;
}

// Make a move and update game state
// move: { from: [r1,c1], to: [r2,c2], promotion?, castle?, enPassant? }
export function makeMove(move) {
  const from = move.from;
  const to = move.to;
  const piece = boardState[from[0]][from[1]];
  const color = pieceColor(piece);
  const opponentColor = opponent(color);

  // Move piece
  boardState[to[0]][to[1]] = piece;
  boardState[from[0]][from[1]] = '';

  // Handle en passant capture
  if (move.enPassant) {
    const epRow = from[0];
    const epCol = to[1];
    boardState[epRow][epCol] = '';
  }

  // Handle castling rook move
  if (move.castle === 'K') {
    const rank = from[0];
    boardState[rank][5] = boardState[rank][7];
    boardState[rank][7] = '';
  } else if (move.castle === 'Q') {
    const rank = from[0];
    boardState[rank][3] = boardState[rank][0];
    boardState[rank][0] = '';
  }

  // Handle promotion
  if (move.promotion) {
    boardState[to[0]][to[1]] = color[0] + move.promotion; // e.g. 'wQ'
  }

  // Update castling rights
  if (piece[1] === 'K') {
    if (color === 'white') {
      castlingRights.wK = false;
      castlingRights.wQ = false;
    } else {
      castlingRights.bK = false;
      castlingRights.bQ = false;
    }
  }
  if (piece[1] === 'R') {
    const rank = from[0], file = from[1];
    if (color === 'white') {
      if (rank === 7 && file === 0) castlingRights.wQ = false;
      if (rank === 7 && file === 7) castlingRights.wK = false;
    } else {
      if (rank === 0 && file === 0) castlingRights.bQ = false;
      if (rank === 0 && file === 7) castlingRights.bK = false;
    }
  }

  // Update en passant target
  enPassantTarget = null;
  if (piece[1] === 'P') {
    if (Math.abs(to[0] - from[0]) === 2) {
      enPassantTarget = [(from[0] + to[0]) / 2, from[1]];
    }
  }

  // Update halfmove clock (reset on pawn move or capture)
  if (piece[1] === 'P' || boardState[to[0]][to[1]] !== '') {
    halfmoveClock = 0;
  } else {
    halfmoveClock++;
  }

  // Increment fullmove number after Black's move
  if (color === 'black') fullmoveNumber++;

  // Switch turn
  turn = opponentColor;
}
// Check if the side to move has any legal moves
function hasAnyLegalMove(side) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (boardState[r][c] && pieceColor(boardState[r][c]) === side) {
        if (getLegalMoves(r, c).length > 0) return true;
      }
    }
  }
  return false;
}

// Check for threefold repetition - requires move history (not implemented here, placeholder)
function isThreefoldRepetition() {
  // TODO: implement repetition tracking outside this scope
  return false;
}

// Check for 50-move rule
function isFiftyMoveRule() {
  return halfmoveClock >= 100; // 50 moves = 100 halfmoves
}

// Determine if game is over and why
export function isGameOver() {
  const side = turn;
  const inCheck = isInCheck(side);
  const legalMovesExist = hasAnyLegalMove(side);

  if (inCheck && !legalMovesExist) {
    return { over: true, result: 'checkmate', winner: opponent(side) };
  }

  if (!inCheck && !legalMovesExist) {
    return { over: true, result: 'stalemate', winner: null };
  }

  if (isFiftyMoveRule()) {
    return { over: true, result: 'draw_50move', winner: null };
  }

  if (isThreefoldRepetition()) {
    return { over: true, result: 'draw_repetition', winner: null };
  }

  // Other draw conditions like insufficient material can be added here

  return { over: false };
}

// Helper: get piece color ('white' or 'black')
export function pieceColor(piece) {
  return piece.startsWith('w') ? 'white' : 'black';
}
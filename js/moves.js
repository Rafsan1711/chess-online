export default class MoveManager {
  constructor(boardState, isWhitePiece, isBlackPiece, isInCheck) {
    this.boardState = boardState;
    this.isWhitePiece = isWhitePiece;
    this.isBlackPiece = isBlackPiece;
    this.isInCheck = isInCheck;

    this.history = [];
    this.redoStack = [];
  }

  addMove(move, moveSAN, fen) {
    this.history.push({ ...move, moveSAN, fen });
    this.redoStack = [];
  }

  undo() {
    if (this.history.length === 0) return null;
    const lastMove = this.history.pop();
    this.redoStack.push(lastMove);
    return lastMove;
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const move = this.redoStack.pop();
    this.history.push(move);
    return move;
  }

  getPGN() {
    let pgn = '';
    for (let i = 0; i < this.history.length; i++) {
      if (i % 2 === 0) pgn += `${Math.floor(i / 2) + 1}. `;
      pgn += this.history[i].moveSAN + ' ';
    }
    return pgn.trim();
  }

  generateSAN(move, pieceCode) {
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['8','7','6','5','4','3','2','1'];

    if (move.moveMeta?.castling) {
      return move.moveMeta.castling === 'king' ? 'O-O' : 'O-O-O';
    }

    let san = '';
    const piece = pieceCode[1];
    const fromFile = files[move.from.col];
    const fromRank = ranks[move.from.row];
    const toFile = files[move.to.col];
    const toRank = ranks[move.to.row];

    if (piece === 'P') {
      if (move.moveMeta?.capture) {
        san += fromFile + 'x' + toFile + toRank;
      } else {
        san += toFile + toRank;
      }
      if (move.moveMeta?.promotion) {
        san += '=' + move.moveMeta.promotion.toUpperCase();
      }
    } else {
      san += piece;

      // TODO: Disambiguation support (if needed)
      if (move.moveMeta?.capture) san += 'x';

      san += toFile + toRank;

      if (move.moveMeta?.promotion) {
        san += '=' + move.moveMeta.promotion.toUpperCase();
      }
    }

    // Add check/checkmate symbol
    if (move.moveMeta?.checkmate) {
      san += '#';
    } else if (move.moveMeta?.check) {
      san += '+';
    }

    return san;
  }
}
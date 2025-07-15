document.addEventListener('DOMContentLoaded', () => {

    /**
     * ===== STATE & INITIAL SETUP =====
     */
    const boardContainer = document.getElementById("board-container");
    
    const modal = document.getElementById("winner-modal");
    const winnerText = document.getElementById("winner-text");
    const modalRestartBtn = document.getElementById("modal-restart-btn");
    const capturedWhiteDiv = document.getElementById("captured-white");
    const capturedBlackDiv = document.getElementById("captured-black");
    const whiteClockDiv = document.getElementById("white-clock");
    const blackClockDiv = document.getElementById("black-clock");

    let boardState = [];
    let selectedSquare = null;
    let validMoves = [];
    let turn = "white"; // "white" or "black"
    let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    let enPassantTarget = null;
    let halfmoveClock = 0;
    let fullmoveNumber = 1;

    // Clocks: in seconds (10 minutes = 600 seconds)
    let whiteTime = 600;
    let blackTime = 600;
    let clockInterval = null;

    // Piece images mapping
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

    /**
     * ===== HELPER FUNCTIONS =====
     */
    function formatTime(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, "0");
      const s = (sec % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function updateClocksDisplay() {
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

    function startClock() {
      clearInterval(clockInterval);
      clockInterval = setInterval(() => {
        if (turn === "white") {
          whiteTime--;
          if (whiteTime <= 0) {
            whiteTime = 0;
            endGameByTimeout("Black");
          }
        } else {
          blackTime--;
          if (blackTime <= 0) {
            blackTime = 0;
            endGameByTimeout("White");
          }
        }
        updateClocksDisplay();
      }, 1000);
    }

    function stopClock() {
      clearInterval(clockInterval);
    }

    function openModal(winner) {
      winnerText.textContent = `Winner: ${winner}`;
      modal.style.display = "flex";
      stopClock();
    }

    function endGameByTimeout(winner) {
      openModal(winner + " (by timeout)");
    }

    function endGameByCheckmate(winner) {
      openModal(winner + " (checkmate)");
    }

    function endGameByStalemate() {
      openModal("Stalemate");
    }

    function resetGameAll() {
      modal.style.display = "none";
      clearInterval(clockInterval);
      initGame();
    }

    function isWhitePiece(code) {
      return code && code.startsWith("w");
    }
    function isBlackPiece(code) {
      return code && code.startsWith("b");
    }
    function opponent(side) {
      return side === "white" ? "black" : "white";
    }
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function findKing(side) {
      const target = (side === "white" ? "wK" : "bK");
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (boardState[r][c] === target) return { row: r, col: c };
        }
      }
      return null;
    }
    function isSquareAttacked(side, row, col) {
      const opp = side === "white" ? "b" : "w";
      const directions = [
        { dr: -1, dc:  0 }, { dr: 1, dc:  0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
      ];
      for (const d of directions) {
        let r = row + d.dr, c = col + d.dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const code = boardState[r][c];
          if (code) {
            if (code.startsWith(opp)) {
              const p = code[1];
              if (
                (d.dr === 0 || d.dc === 0) && (p === "R" || p === "Q") ||
                (d.dr !== 0 && d.dc !== 0) && (p === "B" || p === "Q")
              ) return true;
              break;
            } else { break; }
          }
          r += d.dr; c += d.dc;
        }
      }
      const knightDeltas = [
        { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
        { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
      ];
      for (const d of knightDeltas) {
        const r2 = row + d.dr, c2 = col + d.dc;
        if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
          if (boardState[r2][c2] === opp + "N") return true;
        }
      }
      const pawnDir = side === "white" ? -1 : 1;
      for (const dc of [-1, 1]) {
        const r2 = row + pawnDir, c2 = col + dc;
        if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
          if (boardState[r2][c2] === opp + "P") return true;
        }
      }
      for (const d of directions) {
        const r2 = row + d.dr, c2 = col + d.dc;
        if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
          if (boardState[r2][c2] === opp + "K") return true;
        }
      }
      return false;
    }
    function isInCheck(side) {
      const kingPos = findKing(side);
      if (!kingPos) return false;
      return isSquareAttacked(side, kingPos.row, kingPos.col);
    }

    function getSquareDiv(row, col) {
      return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * ===== DOM CREATION =====
     */
    function createBoardDOM() {
      boardContainer.innerHTML = "";
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const sq = document.createElement("div");
          sq.classList.add(
            "square",
            ((row + col) % 2 === 0) ? "light" : "dark"
          );
          sq.dataset.row = row;
          sq.dataset.col = col;
          sq.addEventListener("click", () => onSquareClick(row, col));
          boardContainer.appendChild(sq);
        }
      }
    }

    function renderPieces() {
      document.querySelectorAll("img.piece").forEach(el => el.remove());
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const code = boardState[row][col];
          if (code) {
            const img = document.createElement("img");
            img.classList.add("piece");
            img.src = pieceImages[code];
            img.draggable = false;
            const squareDiv = getSquareDiv(row, col);
            squareDiv.appendChild(img);
          }
        }
      }
    }

    function updateHighlights() {
      document.querySelectorAll(".selected, .highlight").forEach(el => {
        el.classList.remove("selected", "highlight");
      });
      if (selectedSquare) {
        const { row, col } = selectedSquare;
        getSquareDiv(row, col).classList.add("selected");
        for (const mv of validMoves) {
          getSquareDiv(mv.row, mv.col).classList.add("highlight");
        }
      }
    }

    /**
     * ===== GENERATE LEGAL MOVES =====
     */
    function getLegalMoves(r, c) {
      const code = boardState[r][c];
      if (!code) return [];
      const side = isWhitePiece(code) ? "white" : "black";
      if (side !== turn) return [];
      const p = code[1];
      let moves = [];

      switch (p) {
        case "P": {
          const dir = side === "white" ? -1 : 1;
          const startRow = side === "white" ? 6 : 1;
          let r2 = r + dir;
          if (r2 >= 0 && r2 < 8 && !boardState[r2][c]) {
            moves.push({ row: r2, col: c });
            if (r === startRow && !boardState[r + 2 * dir][c]) {
              moves.push({ row: r + 2 * dir, col: c, doubleStep: true });
            }
          }
          for (const dc of [-1, 1]) {
            const c2 = c + dc;
            if (c2 >= 0 && c2 < 8) {
              if (r2 >= 0 && r2 < 8 && boardState[r2][c2] && boardState[r2][c2][0] !== code[0]) {
                moves.push({ row: r2, col: c2, capture: true });
              }
              if (enPassantTarget && enPassantTarget.row === r && enPassantTarget.col === c2) {
                moves.push({ row: r2, col: c2, enPassant: true });
              }
            }
          }
          break;
        }
        case "N": {
          const knightDeltas = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
          ];
          for (const d of knightDeltas) {
            const r2 = r + d.dr, c2 = c + d.dc;
            if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
              if (!boardState[r2][c2] || boardState[r2][c2][0] !== code[0]) {
                moves.push({ row: r2, col: c2 });
              }
            }
          }
          break;
        }
        case "B":
        case "R":
        case "Q": {
          const directions = [];
          if (p === "B" || p === "Q") {
            directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 });
          }
          if (p === "R" || p === "Q") {
            directions.push({ dr: -1, dc:  0 }, { dr: 1, dc:  0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 });
          }
          for (const d of directions) {
            let r2 = r + d.dr, c2 = c + d.dc;
            while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
              if (!boardState[r2][c2]) {
                moves.push({ row: r2, col: c2 });
              } else {
                if (boardState[r2][c2][0] !== code[0]) {
                  moves.push({ row: r2, col: c2, capture: true });
                }
                break;
              }
              r2 += d.dr;
              c2 += d.dc;
            }
          }
          break;
        }
        case "K": {
          const kingDeltas = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 },                 { dr: 0, dc: 1 },
            { dr: 1, dc: -1 },  { dr: 1, dc: 0 },  { dr: 1, dc: 1 }
          ];
          for (const d of kingDeltas) {
            const r2 = r + d.dr, c2 = c + d.dc;
            if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
              if (!boardState[r2][c2] || boardState[r2][c2][0] !== code[0]) {
                moves.push({ row: r2, col: c2 });
              }
            }
          }
          const rank = code[0] === "w" ? 7 : 0;
          if (r === rank && c === 4) {
            // King side castling
            if ((code[0] === "w" ? castlingRights.wK : castlingRights.bK)) {
              if (
                boardState[rank][5] === "" &&
                boardState[rank][6] === "" &&
                !isSquareAttacked(turn, rank, 4) &&
                !isSquareAttacked(turn, rank, 5) &&
                !isSquareAttacked(turn, rank, 6)
              ) {
                const rookCode = boardState[rank][7];
                if (rookCode === code[0] + "R" && (code[0] === "w" ? castlingRights.wQ : castlingRights.bQ)) {
                  moves.push({ row: rank, col: 6, castling: "king" });
                }
              }
            }
            // Queen side castling
            if ((code[0] === "w" ? castlingRights.wQ : castlingRights.bQ)) {
              if (
                boardState[rank][3] === "" &&
                boardState[rank][2] === "" &&
                boardState[rank][1] === "" &&
                !isSquareAttacked(turn, rank, 4) &&
                !isSquareAttacked(turn, rank, 3) &&
                !isSquareAttacked(turn, rank, 2)
              ) {
                const rookCode = boardState[rank][0];
                if (rookCode === code[0] + "R") {
                  moves.push({ row: rank, col: 2, castling: "queen" });
                }
              }
            }
          }
          break;
        }
      }

      // Filter moves that leave king in check
      const legal = [];
      for (const mv of moves) {
        const backupFrom = boardState[r][c];
        const backupTo = boardState[mv.row][mv.col];
        const enPassantBackup = enPassantTarget;

        boardState[r][c] = "";
        if (mv.enPassant) {
          const capRow = r;
          boardState[capRow][mv.col] = "";
        }
        boardState[mv.row][mv.col] = backupFrom;

        let rookBackup = null;
        if (mv.castling === "king") {
          const rookCol = 7;
          rookBackup = boardState[r][rookCol];
          boardState[r][rookCol] = "";
          boardState[r][5] = backupFrom[0] + "R";
        } else if (mv.castling === "queen") {
          const rookCol = 0;
          rookBackup = boardState[r][rookCol];
          boardState[r][rookCol] = "";
          boardState[r][3] = backupFrom[0] + "R";
        }

        const inCheck = isInCheck(side);

        boardState[r][c] = backupFrom;
        boardState[mv.row][mv.col] = backupTo;
        if (mv.enPassant) {
          const capRow = r;
          boardState[capRow][mv.col] = backupTo;
        }
        if (mv.castling === "king") {
          boardState[r][7] = rookBackup;
          boardState[r][5] = "";
        } else if (mv.castling === "queen") {
          boardState[r][0] = rookBackup;
          boardState[r][3] = "";
        }
        enPassantTarget = enPassantBackup;

        if (!inCheck) {
          legal.push(mv);
        }
      }
      return legal;
    }

    /**
     * ===== MAKE MOVE =====
     */
    function makeMove(from, to, moveMeta) {
      const origFrom = boardState[from.row][from.col];
      const origTo = boardState[to.row][to.col];

      boardState[from.row][from.col] = "";
      if (moveMeta && moveMeta.enPassant) {
        const capRow = from.row;
        boardState[capRow][to.col] = "";
      }
      boardState[to.row][to.col] = origFrom;

      if (moveMeta && moveMeta.castling) {
        const rank = origFrom[0] === "w" ? 7 : 0;
        if (moveMeta.castling === "king") {
          boardState[rank][7] = "";
          boardState[rank][5] = origFrom[0] + "R";
        } else {
          boardState[rank][0] = "";
          boardState[rank][3] = origFrom[0] + "R";
        }
      }

      if (moveMeta && moveMeta.promotion) {
        boardState[to.row][to.col] = origFrom[0] + "Q";
      }

      if (origFrom === "wK") {
        castlingRights.wK = castlingRights.wQ = false;
      }
      if (origFrom === "bK") {
        castlingRights.bK = castlingRights.bQ = false;
      }
      if (origFrom === "wR") {
        if (from.row === 7 && from.col === 0) castlingRights.wQ = false;
        if (from.row === 7 && from.col === 7) castlingRights.wK = false;
      }
      if (origFrom === "bR") {
        if (from.row === 0 && from.col === 0) castlingRights.bQ = false;
        if (from.row === 0 && from.col === 7) castlingRights.bK = false;
      }

      if (origFrom[1] === "P" && Math.abs(to.row - from.row) === 2) {
        enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
      } else {
        enPassantTarget = null;
      }

      // Captured piece handling (show in captured div)
      if (origTo) {
        const img = document.createElement("img");
        img.classList.add("piece");
        img.src = pieceImages[origTo];
        if (origTo.startsWith("w")) {
          capturedWhiteDiv.appendChild(img);
        } else {
          capturedBlackDiv.appendChild(img);
        }
      }

      if (origTo || origFrom[1] === "P") {
        halfmoveClock = 0;
      } else {
        halfmoveClock++;
      }
      if (turn === "black") {
        fullmoveNumber++;
      }

      // Switch turn and clocks
      turn = opponent(turn);
      updateClocksDisplay();

      renderPieces();
      updateHighlights();

      // Check for check/checkmate/stalemate
      const ownSide = turn;
      if (isInCheck(ownSide)) {
        let legalExists = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const code = boardState[r][c];
            if (!code) continue;
            if ((ownSide === "white" && isWhitePiece(code)) || (ownSide === "black" && isBlackPiece(code))) {
              const moves = getLegalMoves(r, c);
              if (moves.length > 0) {
                legalExists = true;
                break;
              }
            }
          }
          if (legalExists) break;
        }
        if (!legalExists) {
          // Checkmate
          const winner = capitalize(opponent(ownSide));
          endGameByCheckmate(winner);
          return true;
        } else {
          // Remain in game; continue clocks
          return false;
        }
      } else {
        // Stalemate?
        let legalExists = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const code = boardState[r][c];
            if (!code) continue;
            if ((ownSide === "white" && isWhitePiece(code)) || (ownSide === "black" && isBlackPiece(code))) {
              const moves = getLegalMoves(r, c);
              if (moves.length > 0) {
                legalExists = true;
                break;
              }
            }
          }
          if (legalExists) break;
        }
        if (!legalExists) {
          // Stalemate
          endGameByStalemate();
          return true;
        } else {
          // Continue game
          return false;
        }
      }
    }

    /**
     * ===== CLICK HANDLER =====
     */
    function onSquareClick(r, c) {
      const code = boardState[r][c];
      if (selectedSquare) {
        const isSame = selectedSquare.row === r && selectedSquare.col === c;
        if (isSame) {
          selectedSquare = null;
          validMoves = [];
          updateHighlights();
          return;
        }
        const move = validMoves.find(m => m.row === r && m.col === c);
        if (move) {
          makeMove(selectedSquare, { row: r, col: c }, move);
          selectedSquare = null;
          validMoves = [];
          return;
        } else {
          if ((turn === "white" && isWhitePiece(code)) || (turn === "black" && isBlackPiece(code))) {
            selectedSquare = { row: r, col: c };
            validMoves = getLegalMoves(r, c);
            updateHighlights();
            return;
          }
        }
      } else {
        if ((turn === "white" && isWhitePiece(code)) || (turn === "black" && isBlackPiece(code))) {
          selectedSquare = { row: r, col: c };
          validMoves = getLegalMoves(r, c);
          updateHighlights();
          return;
        }
      }
    }

    /**
     * ===== INITIALIZATION =====
     */
    function initGame() {
      // Clear captured areas
      capturedWhiteDiv.innerHTML = "";
      capturedBlackDiv.innerHTML = "";

      // Reset clock times
      whiteTime = 600;
      blackTime = 600;
      turn = "white";
      updateClocksDisplay();
      startClock();

      // Reset game state
      boardState = [
        ["bR","bN","bB","bQ","bK","bB","bN","bR"],
        ["bP","bP","bP","bP","bP","bP","bP","bP"],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["wP","wP","wP","wP","wP","wP","wP","wP"],
        ["wR","wN","wB","wQ","wK","wB","wN","wR"]
      ];
      selectedSquare = null;
      validMoves = [];
      castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
      enPassantTarget = null;
      halfmoveClock = 0;
      fullmoveNumber = 1;

      renderPieces();
      updateHighlights();
    }

    // Attach event listeners
    

    // Build board and start
    createBoardDOM();
    initGame();
  
});

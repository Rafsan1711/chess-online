/**
 * clock.js
 * Manages chess clocks for both players, including countdown, switching turns,
 * pausing, resuming, resetting, and handling timeouts.
 */

export default class ChessClock {
  /**
   * @param {number} initialSeconds - Initial time in seconds for each player.
   * @param {(w: number, b: number, turn: 'white' | 'black') => void} onTick - Called every second.
   * @param {(loser: 'white' | 'black') => void} onTimeout - Called when a player runs out of time.
   */
  constructor(initialSeconds, onTick, onTimeout) {
    this.initialTime = initialSeconds;
    this.whiteTime = initialSeconds;
    this.blackTime = initialSeconds;

    this.onTick = onTick;
    this.onTimeout = onTimeout;

    this.turn = 'white';
    this.intervalId = null;
    this.running = false;
  }

  /**
   * Starts the clock for the current player's turn.
   */
  start() {
    if (this.running) return;
    this.running = true;

    this.intervalId = setInterval(() => {
      if (this.turn === 'white') {
        this.whiteTime = Math.max(0, this.whiteTime - 1);
        if (this.whiteTime === 0) {
          this.stop();
          this.onTimeout('white');
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - 1);
        if (this.blackTime === 0) {
          this.stop();
          this.onTimeout('black');
        }
      }

      this.onTick(this.whiteTime, this.blackTime, this.turn);
    }, 1000);
  }

  /**
   * Pauses the clock.
   */
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.running = false;
    }
  }

  /**
   * Switches the turn and restarts the clock.
   */
  switchTurn() {
    this.stop();
    this.turn = this.turn === 'white' ? 'black' : 'white';
    this.start();
  }

  /**
   * Resets the clocks to initial or given time and stops them.
   * @param {number|null} newInitialSeconds - Optional new initial time.
   */
  reset(newInitialSeconds = null) {
    this.stop();
    this.initialTime = newInitialSeconds ?? this.initialTime;

    this.whiteTime = this.initialTime;
    this.blackTime = this.initialTime;
    this.turn = 'white';

    this.onTick(this.whiteTime, this.blackTime, this.turn);
  }

  /**
   * Returns the current times for both players.
   */
  getTimes() {
    return {
      white: this.whiteTime,
      black: this.blackTime
    };
  }

  /**
   * Manually sets the turn to a specific player.
   * @param {'white' | 'black'} turn
   */
  setTurn(turn) {
    if (turn !== 'white' && turn !== 'black') return;
    this.stop();
    this.turn = turn;
    this.start();
  }
}
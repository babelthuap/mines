import MinesweeperBoard from '/js/MinesweeperBoard.js';
import {createDiv, getLocation} from '/js/util.js';

(() => {

const BOARD_EL = document.getElementById('board');
const BOOM = createDiv('boom'); BOOM.innerText = 'BOOM';
const DENSITY_INPUT = document.getElementById('density');
const FLAGS_EL = document.getElementById('numFlags');
const HEIGHT_INPUT = document.getElementById('height');
const MINES_EL = document.getElementById('numMines');
const RESTART_BUTTON = document.getElementById('restart');
const WIDTH_INPUT = document.getElementById('width');
const WINNER = createDiv('winner'); WINNER.innerText = 'WINNER';


/* SET UP GAME */

let board, isFirstMove, gameInProgress;

function start() {
  let height = parseInt(HEIGHT_INPUT.value);
  let width = parseInt(WIDTH_INPUT.value);
  let density = parseInt(DENSITY_INPUT.value) / 100;
  board = new MinesweeperBoard(height, width, density, BOARD_EL, FLAGS_EL, MINES_EL);
  isFirstMove = true;
  gameInProgress = true;
}

function handleInputKeypress(event) {
  if (event.keyCode === 13) {
    start();
  }
}

RESTART_BUTTON.addEventListener('click', start);
DENSITY_INPUT.addEventListener('keypress', handleInputKeypress);
HEIGHT_INPUT.addEventListener('keypress', handleInputKeypress);
WIDTH_INPUT.addEventListener('keypress', handleInputKeypress);

start();


/* HANDLE PLAYER ACTIONS */

// Player toggles the flag on a tile
function handleFlag(event) {
  let location = getLocation(event.target);
  board.flag(location);
}

// Player reveals a tile
function handleReveal(event) {
  let location = getLocation(event.target);
  let {gameOver, win} = board.reveal(location, isFirstMove);
  isFirstMove = false;
  if (gameOver) {
    gameInProgress = false;
    window.requestAnimationFrame(() => {
      BOARD_EL.appendChild(win ? WINNER : BOOM);
    });
  }
}

// Disable context menu (so we can intercept right click)
BOARD_EL.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (gameInProgress) {
    handleFlag(event);
  }
  return false;
});

// Handle other kinds of click
BOARD_EL.addEventListener('mousedown', event => {
  if (!gameInProgress) {
    window.requestAnimationFrame(() => {
      BOOM.remove();
      WINNER.remove();
    });
    return;
  }
  if (event.button === 0) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      handleFlag(event);
    } else {
      handleReveal(event);
    }
  }
});

})();

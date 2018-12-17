import MinesweeperBoard from './js/MinesweeperBoard.js';
import {createDiv, getLocation, modifyDom} from './js/util.js';

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
  let density = parseInt(DENSITY_INPUT.value);
  localStorage.minesweeperParams = JSON.stringify({height, width, density});
  board = new MinesweeperBoard(height, width, {BOARD_EL, FLAGS_EL, MINES_EL});
  board.init(density / 100);
  delete localStorage.minesweeperBoard;
  isFirstMove = true;
  gameInProgress = true;
  handleResize();
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

if (localStorage.minesweeperParams) {
  let {height, width, density} = JSON.parse(localStorage.minesweeperParams);
  HEIGHT_INPUT.value = height;
  WIDTH_INPUT.value = width;
  DENSITY_INPUT.value = density;
}

if (localStorage.minesweeperBoard) {
  board = MinesweeperBoard.deserialize(
      localStorage.minesweeperBoard, {BOARD_EL, FLAGS_EL, MINES_EL});
  isFirstMove = false;
  gameInProgress = true;
  handleResize();
} else {
  start();
}


/* HANDLE WINDOW RESIZE */

const H_MARGIN = 16;
const V_MARGIN = 44;
const SM_TILE = 19;
const MD_TILE = 25;
const LG_TILE = 37;
const XL_TILE = 49;

function handleResize() {
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let boardWidth = board.getWidth();
  let boardHeight = board.getHeight();
  modifyDom(() => {
    BOARD_EL.classList.remove('xs', 'sm', 'md', 'lg', 'xl');
    if (windowWidth < SM_TILE * boardWidth + H_MARGIN
        || windowHeight < SM_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.add('xs');
    } else if (windowWidth < MD_TILE * boardWidth + H_MARGIN
        || windowHeight < MD_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.add('sm');
    } else if (windowWidth < LG_TILE * boardWidth + H_MARGIN
        || windowHeight < LG_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.add('md');
    } else if (windowWidth < XL_TILE * boardWidth + H_MARGIN
        || windowHeight < XL_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.add('lg');
    } else {
      BOARD_EL.classList.add('xl');
    }
  });
}

window.addEventListener('resize', handleResize);
handleResize();


/* HANDLE PLAYER ACTIONS */

// Player toggles the flag on a tile
function handleFlag(event) {
  let location = getLocation(event.target);
  board.flag(location);
  if (!isFirstMove) {
    localStorage.minesweeperBoard = board.serialize();
  }
}

// Player reveals a tile
function handleReveal(event) {
  let location = getLocation(event.target);
  let {gameOver, win} = board.reveal(location, isFirstMove);
  isFirstMove = false;
  if (gameOver) {
    gameInProgress = false;
    modifyDom(() => {
      BOARD_EL.appendChild(win ? WINNER : BOOM);
    });
    delete localStorage.minesweeperBoard;
  } else {
    localStorage.minesweeperBoard = board.serialize();
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
    modifyDom(() => {
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

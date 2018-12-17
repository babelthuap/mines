import MinesweeperBoard from './js/MinesweeperBoard.js';
import resize from './js/resize.js';
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

function handleResize() {
  resize(board, BOARD_EL);
}
window.addEventListener('resize', handleResize);


/* SPOOKY AI SHIT */

let aiRevealMode = true;

function ai(recurse = true) {
  aiRevealMode = !aiRevealMode;
  if (aiRevealMode) {
    let saturatedLocations = board.aiFindSaturatedLocations();
    for (let location of saturatedLocations) {
      let gameOver = handleReveal(location);
      if (gameOver) {
        return;
      }
    }
    if (saturatedLocations.length === 0 && recurse) {
      ai(/* recurse= */ false);
    }
  } else {
    let numFlagged = board.aiFlagLocations();
    if (numFlagged.length === 0 && recurse) {
      ai(/* recurse= */ false);
    }
  }
}

window.addEventListener('keydown', event => {
  if (gameInProgress) {
    if (event.keyCode === 65 /* 'a' */) {
      ai();
    } else if (event.keyCode === 82 /* 'r' */) {
      start();
    }
  }
});


/* HANDLE PLAYER ACTIONS */

// Player toggles the flag on a tile
function handleFlag(location) {
  board.flag(location);
  if (!isFirstMove) {
    localStorage.minesweeperBoard = board.serialize();
  }
}

// Player reveals a tile
function handleReveal(location) {
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
  return gameOver;
}

// Disable context menu (so we can intercept right click)
BOARD_EL.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (gameInProgress) {
    let location = getLocation(event.target);
    handleFlag(location);
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
    let location = getLocation(event.target);
    if (event.altKey || event.ctrlKey || event.metaKey) {
      handleFlag(location);
    } else {
      handleReveal(location);
    }
  }
});

})();

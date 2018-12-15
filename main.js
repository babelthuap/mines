(() => {
'use strict';

const BOARD_EL = document.getElementById('board');
const BOOM = createDiv('boom'); BOOM.innerText = 'BOOM';
const DENSITY_INPUT = document.getElementById('density');
const FLAGS_EL = document.getElementById('numFlags');
const HEIGHT_INPUT = document.getElementById('height');
const MINES_EL = document.getElementById('numMines');
const RESTART_BUTTON = document.getElementById('restart');
const WIDTH_INPUT = document.getElementById('width');
const WINNER = createDiv('winner'); WINNER.innerText = 'WINNER';


/* CLASSES */

// A single tile
class Tile {
  constructor() {
    this.adjacentMines = 0;
    this.domNode = null;
    this.hasMine = false;
    this.isFlagged = false;
    this.isRevealed = false;
  }

  // Updates the associated DOM node
  render(revealMines = false) {
    this.domNode.classList = 'tile';
    if (this.isRevealed) {
      if (this.adjacentMines > 0 && !this.hasMine) {
        this.domNode.classList.add(`m${this.adjacentMines}`);
        this.domNode.innerText = this.adjacentMines;
      } else {
        this.domNode.innerText = '';
      }
    } else {
      this.domNode.classList.add('concealed');
      this.domNode.innerText = this.isFlagged ? 'F' : '';
    }
    if (revealMines) {
      if (this.hasMine) {
        this.domNode.innerText = '*';
      } else if (this.isFlagged) {
        this.domNode.innerText = '_';
      }
    }
  }
}

// The board
class Board {
  constructor(height, width, density) {
    if (height < 1 || width < 1 || density < 0 || density > 0.9) {
      throw 'Bad height, width, or density';
    }
    this.tilesLeftToReveal_ = null;
    this.numMines_ = 0;
    this.numFlags_ = 0;
    window.requestAnimationFrame(() => {
      FLAGS_EL.innerText = this.numFlags_;
    });
    this.grid_ = new Array(height);
    for (let y = 0; y < height; y++) {
      this.grid_[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.grid_[y][x] = new Tile();
      }
    }
    this.mapGridToDom_();
    this.placeMines_(density);
    this.labelTiles_();
  }

  // Associates each tile in the grid with a DOM node
  mapGridToDom_() {
    window.requestAnimationFrame(() => {
      [...BOARD_EL.children].forEach(child => child.remove());
      for (let row of this.grid_) {
        let rowDiv = createDiv('row');
        for (let tile of row) {
          let tileDiv = createDiv('tile', 'concealed');
          tile.domNode = tileDiv;
          rowDiv.appendChild(tileDiv);
        }
        BOARD_EL.appendChild(rowDiv);
      }
    });
  }

  // Randomly places mines on the board
  placeMines_(density) {
    let height = this.grid_.length;
    let width = this.grid_[0].length;
    let numTiles = height * width;
    this.numMines_ = Math.floor(density * numTiles);
    window.requestAnimationFrame(() => {
      MINES_EL.innerText = this.numMines_;
    });
    this.tilesLeftToReveal_ = numTiles - this.numMines_;
    // Shuffle 1D array to determine mine positions
    let minePositions = new Array(numTiles).fill(false);
    for (let i = 0; i < this.numMines_; i++) {
      minePositions[i] = true;
    }
    shuffle(minePositions);
    // Map onto tile grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.grid_[y][x].hasMine = minePositions[y * width + x];
      }
    }
  }

  // Calculates the number of adjacent mines for each tile
  labelTiles_() {
    let height = this.grid_.length;
    let width = this.grid_[0].length;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.grid_[y][x].hasMine) {
          this.forEachNeighbor_(y, x, (nbrY, nbrX) => {
            this.grid_[nbrY][nbrX].adjacentMines++;
          });
        }
      }
    }
  }

  // Executes a function for each neighboring tile
  forEachNeighbor_(y, x, fn) {
    let upExists = this.grid_[y - 1] !== undefined;
    let downExists = this.grid_[y + 1] !== undefined;
    let leftExists = this.grid_[y][x - 1] !== undefined;
    let rightExists = this.grid_[y][x + 1] !== undefined;
    // Row above
    if (upExists) {
      leftExists && fn(y - 1, x - 1);
      fn(y - 1, x);
      rightExists && fn(y - 1, x + 1);
    }
    // Current row
    leftExists && fn(y, x - 1);
    rightExists && fn(y, x + 1);
    // Row below
    if (downExists) {
      leftExists && fn(y + 1, x - 1);
      fn(y + 1, x);
      rightExists && fn(y + 1, x + 1);
    }
  }

  // Re-renders the board with all mines revealed
  revealMines_() {
    window.requestAnimationFrame(() => {
      for (let row of this.grid_) {
        for (let tile of row) {
          tile.render(/* revealMines= */ true);
        }
      }
      FLAGS_EL.innerText = this.numFlags_;
    });
  }

  // Re-renders only the specified locations
  update_(locations) {
    window.requestAnimationFrame(() => {
      for (let [y, x] of locations) {
        this.grid_[y][x].render();
      }
      FLAGS_EL.innerText = this.numFlags_;
    });
  }

  // Recursively descubrido
  aNewCavernHasBeenDiscovered_(y, x, updatedLocations = []) {
    let tile = this.grid_[y][x];
    if (tile.isRevealed) {
      return;
    }
    if (tile.isFlagged) {
      tile.isFlagged = false;
      this.numFlags_--;
    }

    tile.isRevealed = true;
    this.tilesLeftToReveal_--;
    updatedLocations.push([y, x]);
    
    if (tile.adjacentMines === 0 && !tile.hasMine) {
      this.forEachNeighbor_(y, x, (nbrY, nbrX) => {
        this.aNewCavernHasBeenDiscovered_(nbrY, nbrX, updatedLocations);
      });
    }

    return updatedLocations;
  }

  // Swaps the mine in the given tile with a randomly selected open tile and
  // updates the tile labels accordingly.
  swapMine_(originalY, originalX) {
    let numOpenTiles =
        (this.grid_.length * this.grid_[0].length) - this.numMines_;
    let indexToSwap = rand(numOpenTiles - 1);
    for (let y = 0; y < this.grid_.length; y++) {
      for (let x = 0; x < this.grid_[y].length; x++) {
        let tile = this.grid_[y][x];
        if (!tile.hasMine) {
          indexToSwap--;
          if (indexToSwap < 0) {
            tile.hasMine = true;
            this.forEachNeighbor_(y, x, (nbrY, nbrX) => {
              this.grid_[nbrY][nbrX].adjacentMines++;
            });
            this.grid_[originalY][originalX].hasMine = false;
            this.forEachNeighbor_(originalY, originalX, (nbrY, nbrX) => {
              this.grid_[nbrY][nbrX].adjacentMines--;
            });
            return;
          }
        }
      }
    }
  }

  // Toggles the flagged state of a tile
  flag([y, x]) {
    let tile = this.grid_[y][x];
    if (!tile.isRevealed) {
      tile.isFlagged = !tile.isFlagged;
      this.numFlags_ = this.numFlags_ + (tile.isFlagged ? 1 : -1);
      this.update_([[y, x]]);
    }
  }

  // Handles all logic for revealing a tile
  reveal([y, x], isFirstMove) {
    let tile = this.grid_[y][x];
    if (tile.isRevealed || tile.isFlagged) {
      return {gameOver: false};
    }
    if (tile.hasMine) {
      if (isFirstMove) {
        // Don't allow player to lose on the first move
        this.swapMine_(y, x);
      } else {
        // BOOM
        tile.isRevealed = true;
        this.revealMines_();
        return {gameOver: true, win: false};
      }
    }
    let updatedLocations = [];
    this.aNewCavernHasBeenDiscovered_(y, x, updatedLocations);
    this.update_(updatedLocations);
    let isWinner = this.tilesLeftToReveal_ === 0;
    return {gameOver: isWinner, win: isWinner};
  }
}


/* HELPER FUNCTIONS */

// Gets random int in [0, n]
function rand(n) {
  return Math.floor((n + 1) * Math.random());
}

// Shuffles an array in place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = rand(i);
    let temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
  return arr;
}

// Creates a div with the given classes
function createDiv(...classNames) {
  const div = document.createElement('div');
  div.classList.add(...classNames);
  return div;
}

// Gets the 2D location of a given tile div
function getLocation(tileDiv) {
  let x = getElementIndex(tileDiv);
  let y = getElementIndex(tileDiv.parentNode);
  return [y, x];
}

// Gets the index of an element among its siblings
function getElementIndex(element) {
  return [...element.parentNode.children].indexOf(element);
}


/* SET UP GAME */

let board, isFirstMove, gameInProgress;

function start() {
  let height = parseInt(HEIGHT_INPUT.value);
  let width = parseInt(WIDTH_INPUT.value);
  let density = parseInt(DENSITY_INPUT.value) / 100;
  board = new Board(height, width, density);
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

// Handle right click
BOARD_EL.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (gameInProgress) {
    handleFlag(event);
  }
  return false;
});

// Handle other kinds of click
BOARD_EL.addEventListener('click', event => {
  if (!gameInProgress) {
    window.requestAnimationFrame(() => {
      BOOM.remove();
      WINNER.remove();
    });
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    handleFlag(event);
  } else {
    handleReveal(event);
  }
});

})();

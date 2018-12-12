(() => {
'use strict';

const BOARD_DIV = document.getElementById('board');
const BOOM = createDiv('boom'); BOOM.innerText = 'BOOM';
const DENSITY_INPUT = document.getElementById('density');
const HEIGHT_INPUT = document.getElementById('height');
const RESTART_BUTTON = document.getElementById('restart');
const WIDTH_INPUT = document.getElementById('width');
const WINNER = createDiv('winner'); WINNER.innerText = 'WINNER';


/** CLASSES WOOO */

class Tile {
  constructor() {
    this.adjacentMines = 0;
    this.hasMine = false;
    this.isFlagged = false;
    this.isRevealed = false;
  }

  equals(other) {
    return this.adjacentMines === other.adjacentMines &&
        this.hasMine === other.hasMine &&
        this.isFlagged === other.isFlagged &&
        this.isRevealed === other.isRevealed;
  }
}

class Board {
  constructor(height, width, density) {
    if (height < 1 || width < 1) {
      throw 'Bad height or width';
    }
    this.height_ = height;
    this.width_ = width;
    this.density_ = density;
    this.randomize();
  }

  getTile(y, x) {
    return this.grid_[y][x];
  }

  randomize(safeY = null, safeX = null) {
    this.grid_ = [];
    for (let y = 0; y < this.height_; y++) {
      this.grid_.push(new Array(this.width_).fill().map(() => new Tile()));
    }
    let numTiles = this.height_ * this.width_;
    let numMines = Math.ceil(this.density_ * numTiles);
    this.numLeftToReveal_ = numTiles - numMines;
    let numPlaced = 0;
    while (numPlaced < numMines) {
      let y = rand(this.height_);
      let x = rand(this.width_);
      if (y === safeY && x === safeX) {
        // Don't place a mine in the safe tile.
        continue;
      }
      let tile = this.grid_[y][x];
      if (!tile.hasMine) {
        tile.hasMine = true;
        numPlaced++;
      }
    }
    this.labelTiles_();
  }

  render(revealMines = false) {
    [...BOARD_DIV.children].forEach(child => child.remove());
    for (let row of this.grid_) {
      let rowDiv = createDiv('row');
      for (let tile of row) {
        let tileDiv;
        if (tile.isRevealed) {
          tileDiv = createDiv('tile');
          tileDiv.innerText = tile.adjacentMines || '';
        } else {
          tileDiv = createDiv('tile', 'concealed');
          tileDiv.innerText = tile.isFlagged ? 'F' : '';
        }
        if (revealMines) {
          if (tile.hasMine) {
            tileDiv.innerText = '*';
          } else if (tile.isFlagged) {
            tileDiv.innerText = '_';
          }
        }
        rowDiv.appendChild(tileDiv);
      }
      BOARD_DIV.appendChild(rowDiv);
    }
  }

  aNewCavernHasBeenDiscovered(y, x) {
    let tile = this.grid_[y][x];
    if (tile.isRevealed) return;
    tile.isRevealed = true;
    this.numLeftToReveal_--;

    if (!tile.hasMine && tile.adjacentMines === 0) {
      this.forEachNeighbor_(y, x, (nbrY, nbrX) => {
        this.aNewCavernHasBeenDiscovered(nbrY, nbrX);
      });
    }
  }

  isWinner() {
    return this.numLeftToReveal_ === 0;
  }

  labelTiles_() {
    for (let y = 0; y < this.height_; y++) {
      for (let x = 0; x < this.width_; x++) {
        if (this.grid_[y][x].hasMine) {
          this.forEachNeighbor_(y, x, (nbrY, nbrX) => {
            this.grid_[nbrY][nbrX].adjacentMines++;
          });
        }
      }
    }
  }

  forEachNeighbor_(y, x, fn) {
    let upExists = this.grid_[y - 1] != null;
    let downExists = this.grid_[y + 1] != null;
    let leftExists = this.grid_[y][x - 1] != null;
    let rightExists = this.grid_[y][x + 1] != null;
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
}

// Returns a random int in [0, n)
function rand(n) {
  return Math.floor(Math.random() * n);
}

function createDiv(...classNames) {
  const div = document.createElement('div');
  for (let className of classNames) {
    div.classList.add(className);
  }
  return div;
}


/** GAME LOOP STUFF */

let board;
let firstMove = true;
let gameInProgress = false;

function restart() {
  let height = parseInt(HEIGHT_INPUT.value);
  let width = parseInt(WIDTH_INPUT.value);
  let density = parseInt(DENSITY_INPUT.value) / 100;
  board = new Board(height, width, density);
  board.render();
  firstMove = true;
  gameInProgress = true;
}

function reveal(event) {
  if (!gameInProgress) {
    BOOM.remove();
    return;
  }
  let [y, x] = getCoordinates(event.target);
  let tile = board.getTile(y, x);
  if (tile.isRevealed || tile.isFlagged) {
    return;
  }
  if (tile.hasMine) {
    if (firstMove) {
      // Re-randomize so player never loses on first turn.
      board.randomize(y, x);
    } else {
      // Oops, you lose.
      tile.isRevealed = true;
      gameInProgress = false;
      board.render(/* revealMines= */ true);
      BOARD_DIV.appendChild(BOOM);
      return;
    }
  }
  board.aNewCavernHasBeenDiscovered(y, x);
  firstMove = false;
  board.render();
  if (board.isWinner()) {
    BOARD_DIV.appendChild(WINNER);
  }
}

function flag(event) {
  event.preventDefault();
  if (!gameInProgress) return;
  let [y, x] = getCoordinates(event.target);
  let tile = board.getTile(y, x);
  if (tile.isRevealed) return;
  tile.isFlagged = !tile.isFlagged;
  event.target.innerText = tile.isFlagged ? 'F' : '';
  return false;
}

function getCoordinates(clickedTileDiv) {
  let x = getElementIndex(clickedTileDiv);
  let y = getElementIndex(clickedTileDiv.parentNode);
  return [y, x];
}

function getElementIndex(element) {
  return [...element.parentNode.children].indexOf(element);
}


/** LET'S GET THIS STARTED ALREADY */

RESTART_BUTTON.addEventListener('click', restart);
BOARD_DIV.addEventListener('contextmenu', flag); // right click
BOARD_DIV.addEventListener('click', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    flag(event);
  } else {
    reveal(event);
  }
});

restart();

})();

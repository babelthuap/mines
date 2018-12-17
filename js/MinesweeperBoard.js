import {createDiv, modifyDom, rand, shuffle} from './util.js';

// Bit flags
const HAS_MINE = 0b1;
const IS_FLAGGED = 0b10;
const IS_REVEALED = 0b100;

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

  serialize() {
    return (this.hasMine * HAS_MINE) +
        (this.isFlagged * IS_FLAGGED) +
        (this.isRevealed * IS_REVEALED);
  }

  static deserialize(bits) {
    let tile = new Tile();
    tile.hasMine = Boolean(bits & HAS_MINE);
    tile.isFlagged = Boolean(bits & IS_FLAGGED);
    tile.isRevealed = Boolean(bits & IS_REVEALED);
    return tile;
  }
}

// The board
export default class MinesweeperBoard {
  constructor(height, width, {BOARD_EL, FLAGS_EL, MINES_EL}) {
    if (height < 1 || width < 1) {
      throw 'Bad height or width';
    }

    this.BOARD_EL = BOARD_EL;
    this.FLAGS_EL = FLAGS_EL;
    this.MINES_EL = MINES_EL;

    this.tilesLeftToReveal_ = null;
    this.numMines_ = 0;
    this.numFlags_ = 0;
    this.updateCounters();

    this.grid_ = new Array(height);
    for (let y = 0; y < height; y++) {
      this.grid_[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.grid_[y][x] = new Tile();
      }
    }
  }

  init(density) {
    this.mapGridToDom_();
    this.placeMines_(density);
    this.labelTiles_();
  }

  getHeight() {
    return this.grid_.length;
  }

  getWidth() {
    return this.grid_[0].length;
  }

  updateCounters() {
    return modifyDom(() => {
      this.FLAGS_EL.innerText = this.numFlags_;
      this.MINES_EL.innerText = this.numMines_;
    });
  }

  // Associates each tile in the grid with a DOM node
  mapGridToDom_() {
    return modifyDom(() => {
      [...this.BOARD_EL.children].forEach(child => child.remove());
      for (let row of this.grid_) {
        let rowDiv = createDiv('row');
        for (let tile of row) {
          let tileDiv = createDiv('tile', 'concealed');
          tile.domNode = tileDiv;
          rowDiv.appendChild(tileDiv);
        }
        this.BOARD_EL.appendChild(rowDiv);
      }
    });
  }

  // Randomly places mines on the board
  placeMines_(density) {
    let height = this.getHeight();
    let width = this.getWidth();
    let numTiles = height * width;
    this.numMines_ = Math.floor(density * numTiles);
    this.updateCounters();
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
    let height = this.getHeight();
    let width = this.getWidth();
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

  // Re-renders the entire board
  render_(revealMines) {
    return modifyDom(() => {
      for (let row of this.grid_) {
        for (let tile of row) {
          tile.render(revealMines);
        }
      }
      this.updateCounters();
    });
  }

  // Re-renders only the specified locations
  update_(locations) {
    return modifyDom(() => {
      for (let [y, x] of locations) {
        this.grid_[y][x].render();
      }
      this.updateCounters();
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

  // Swaps the mine in the given tile with a randomly selected open tile and updates the tile labels accordingly.
  swapMine_(originalY, originalX) {
    let numOpenTiles = (this.getHeight() * this.getWidth()) - this.numMines_;
    let indexToSwap = rand(numOpenTiles - 1);
    for (let y = 0; y < this.getHeight(); y++) {
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
        this.render_(/* revealMines= */ true);
        return {gameOver: true, win: false};
      }
    }
    let updatedLocations = [];
    this.aNewCavernHasBeenDiscovered_(y, x, updatedLocations);
    this.update_(updatedLocations);
    let isWinner = this.tilesLeftToReveal_ === 0;
    return {gameOver: isWinner, win: isWinner};
  }

  serialize() {
    let arr = [
      this.tilesLeftToReveal_,
      this.numMines_,
      this.numFlags_,
      this.grid_.map(row => row.map(tile => tile.serialize()).join('')),
    ];
    return JSON.stringify(arr);
  }

  static deserialize(json, elementRefs) {
    let [tilesLeftToReveal, numMines, numFlags, grid] = JSON.parse(json);
    let height = grid.length;
    let width = grid[0].length;
    let board = new MinesweeperBoard(height, width, elementRefs);
    board.tilesLeftToReveal_ = tilesLeftToReveal;
    board.numMines_ = numMines;
    board.numFlags_ = numFlags;
    board.grid_ = grid.map(row => row.split('').map(tile => Tile.deserialize(tile)));
    board.labelTiles_();
    board.mapGridToDom_().then(() => board.render_());
    return board;
  }
}

import {createDiv, rand, shuffle} from './util.js';

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
export default class MinesweeperBoard {
  constructor(height, width, density, BOARD_EL, FLAGS_EL, MINES_EL) {
    if (height < 1 || width < 1 || density < 0 || density > 0.9) {
      throw 'Bad height, width, or density';
    }

    this.BOARD_EL = BOARD_EL;
    this.FLAGS_EL = FLAGS_EL;
    this.MINES_EL = MINES_EL;

    this.tilesLeftToReveal_ = null;
    this.numMines_ = 0;
    this.numFlags_ = 0;
    window.requestAnimationFrame(() => {
      this.FLAGS_EL.innerText = this.numFlags_;
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
    let height = this.grid_.length;
    let width = this.grid_[0].length;
    let numTiles = height * width;
    this.numMines_ = Math.floor(density * numTiles);
    window.requestAnimationFrame(() => {
      this.MINES_EL.innerText = this.numMines_;
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
      this.FLAGS_EL.innerText = this.numFlags_;
    });
  }

  // Re-renders only the specified locations
  update_(locations) {
    window.requestAnimationFrame(() => {
      for (let [y, x] of locations) {
        this.grid_[y][x].render();
      }
      this.FLAGS_EL.innerText = this.numFlags_;
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
    let numOpenTiles = (this.grid_.length * this.grid_[0].length) - this.numMines_;
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

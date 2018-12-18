import {MinesweeperBoard, Tile} from './MinesweeperBoard.js';

// Lowest 15 bits
const MASK_15 = 2 ** 15 - 1;

// Turns a coordinate pair into a "Location"
// a and b must be in [0, 2^15 - 1)
export function asLocation(a, b) {
  return (a << 15) | b;
}

// Turns a "Location" back into a coordinate pair
export function asCoordinates(n) {
  return [n >> 15, n & MASK_15];
}

// Creates a div with the given classes
export function createDiv(...classNames) {
  const div = document.createElement('div');
  div.classList.add(...classNames);
  return div;
}

// Gets the 2D location of a given tile div
export function getLocation(tileDiv) {
  let x = getElementIndex(tileDiv);
  let y = getElementIndex(tileDiv.parentNode);
  return [y, x];
}

// Gets the index of an element among its siblings
function getElementIndex(element) {
  return [...element.parentNode.children].indexOf(element);
}

// Executes a function in sync with browser repaints, then resolves
export function modifyDom(fn) {
  return new Promise(resolve => {
    window.requestAnimationFrame(timestamp => {
      Promise.resolve(fn(timestamp)).then(resolve);
    });
  });
}

// Gets random int in [0, n]
export function rand(n) {
  return Math.floor((n + 1) * Math.random());
}

// Shuffles an array in place
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = rand(i);
    let temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
  return arr;
}

// Bit flags for Tile serialization
const HAS_MINE    = 0b001;
const IS_FLAGGED  = 0b010;
const IS_REVEALED = 0b100;

function serializeTile(tile) {
  return (tile.hasMine && HAS_MINE) |
      (tile.isFlagged && IS_FLAGGED) |
      (tile.isRevealed && IS_REVEALED);
}

function deserializeTile(bits) {
  let tile = new Tile();
  tile.hasMine = Boolean(bits & HAS_MINE);
  tile.isFlagged = Boolean(bits & IS_FLAGGED);
  tile.isRevealed = Boolean(bits & IS_REVEALED);
  return tile;
}

export function serializeBoard(board) {
  let arr = [
    board.tilesLeftToReveal_,
    board.numMines_,
    board.numFlags_,
    board.grid_.map(row => row.map(serializeTile).join('')),
  ];
  return JSON.stringify(arr);
}

export function deserializeBoard(json, elementRefs) {
  let [tilesLeftToReveal, numMines, numFlags, grid] = JSON.parse(json);
  let height = grid.length;
  let width = grid[0].length;
  let board = new MinesweeperBoard(height, width, elementRefs);
  board.tilesLeftToReveal_ = tilesLeftToReveal;
  board.numMines_ = numMines;
  board.numFlags_ = numFlags;
  board.grid_ = grid.map(row => row.split('').map(deserializeTile));
  board.labelTiles_();
  board.mapGridToDom_().then(() => board.render_());
  return board;
}

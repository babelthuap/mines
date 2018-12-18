import {modifyDom} from './util.js';

const H_MARGIN = 16;
const V_MARGIN = 44;
const SM_TILE  = 19;
const MD_TILE  = 25;
const LG_TILE  = 37;
const XL_TILE  = 49;

export default function resize(board, BOARD_EL) {
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let boardWidth = board.getWidth();
  let boardHeight = board.getHeight();
  modifyDom(() => {
    if (windowWidth < SM_TILE * boardWidth + H_MARGIN
        || windowHeight < SM_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.remove('sm', 'md', 'lg', 'xl');
      BOARD_EL.classList.add('xs');
    } else if (windowWidth < MD_TILE * boardWidth + H_MARGIN
        || windowHeight < MD_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.remove('xs', 'md', 'lg', 'xl');
      BOARD_EL.classList.add('sm');
    } else if (windowWidth < LG_TILE * boardWidth + H_MARGIN
        || windowHeight < LG_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.remove('xs', 'sm', 'lg', 'xl');
      BOARD_EL.classList.add('md');
    } else if (windowWidth < XL_TILE * boardWidth + H_MARGIN
        || windowHeight < XL_TILE * boardHeight + V_MARGIN) {
      BOARD_EL.classList.remove('xs', 'sm', 'md', 'xl');
      BOARD_EL.classList.add('lg');
    } else {
      BOARD_EL.classList.remove('xs', 'sm', 'md', 'lg');
      BOARD_EL.classList.add('xl');
    }
  });
}

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

// Onload function.
$(function() {
  console.log('Loaded, bro.');

  // Create a grid.
  $('body').append($('<div id="grid">'));
  (function grid() {
    for(var rows = 1; rows <= App.rows; rows++) {
      // Create a div container for each row.
      var row = $('<div class="row row-container' + rows + '"">').appendTo($('#grid'));

      for(var columns = 1; columns <= App.columns; columns++) {
        var box = $('<div class="box column' + columns + ' row' + rows + '" column="' + columns + '">');
        box.attr('column', columns);
        box.attr('row', rows);

        // Append all boxes in each row to row div container.
        $('.row-container' + rows).append(box);
      }
    }
  })();

  // Press the space bar to shoot.
  window.onkeyup = function(e) {
    e.which === 32 ? shoot() : false;
  }

  // Offset value (needed for `shootAnimate` only).
  App.offset = $('.column1.row1').position().top;

  // Shooter row.
  App.shooterRow = $('.row' + App.rows);

  // Create snake.
  startingSnake(25);

  // Create blocks & food.
  randomBlocks(100);
  randomFood(30);

  // Move snake.
  App.move = setInterval(function() {
    moveSnakes();
  }, 40);
});

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

var move;
App = {
  boxsize: 10,
  bulletSpeed: 0,
  columns: 80,
  rows: 80,
  shots: [],
  snakes: 0,
  eaten: 0
};

// Remove class the vanilla JS way.
function removeClass(el, rmClass) {
  if(!el) { return };
  var array = el.className.split(' ');

  // The `array.filter` callback.
  function filterMe(name) {
    return name !== rmClass;
  }

  el.className = array.filter(filterMe).join(' ');
}

// Mouse is over a box.
window.onmouseover = function(e) {
  if(e.target.attributes.column) {
    var box = e.target.attributes.column.value;
    App.shooterRow[box - 1]['className'] += ' shooter';
    App.lastShooter = box;
  }
}

// Mouse leaves a box.
window.onmouseout = function(e) {
  // if(e.target.attributes.column)
  if(e.target.attributes.column) {
    var box = e.target.attributes.column.value;
    removeClass(App.shooterRow[box - 1], 'shooter');
  }
}

// Keep track if the mouse is on the board.
window.onmousemove = function(e) {
  App.mouseLocation = e.target;
  var box = e.target.attributes.column;
  box ? App.offBoard = false : App.offBoard = true;
}

function hitSnake(snake, piece) {

  // Function to turn the hit part into a block.
  function toBlock(el) {
    if(el.attributes['snake-head']) {
      el.removeAttribute('snake-head');
      el.removeAttribute('snake-num');
      el.removeAttribute('snake');
      el.setAttribute('block', 'true');
      el.className += ' block';
      removeClass(el, 'snake-head');
    } else {
      el.removeAttribute('snake-num');
      el.removeAttribute('snake');
      el.removeAttribute('part');
      el.setAttribute('block', 'true');
      el.className += ' block';
      removeClass(el, 'snake-body');
    }
  }


  if(piece === 'head') {
    var snakeNum = snake['snake-num'];

    // Turn the head into a block.
    var head = document.querySelector('[snake-num="' + snakeNum + '"][snake-head]');
    toBlock(head);

    // Process body parts if we have 2 or more.
    if(snake.body.length) {
      var partCol = snake.body[0]['column'];
      var partRow = snake.body[0]['row'];

      // Turn the first body part into a head.
      var part = document.getElementsByClassName('row' + partRow + ' column' + partCol)[0];

      part.removeAttribute('snake');
      part.removeAttribute('part');
      removeClass(part, 'snake-body');

      part.setAttribute('snake-head', 'true');
      part.setAttribute('snake', 'true');
      part.className += ' snake-head';

      // Set the head's object coordinates to the first body piece.
      snake.head.column = partCol;
      snake.head.row = partRow;

      if(snake.body.length >= 2) {
        // Remove the first body piece in the body array.
        snake.body.splice(0,1);

        // Reset all the body-part numbers.
        var bodyParts = document.querySelectorAll('[snake-num="' + snakeNum + '"][part]');
        for(var i = 0; i < snake.body.length; i++) {
          snake.body[i]['part'] = i;
          bodyParts[i].setAttribute('part', i);
        }
      } else {
        snake.body.length = 0;
      }
    } else {
      // For snakes that are only a head, remove that snake from the array.
      Snakes.splice(snakeNum, 1);

      // Now adjust all other snakes accordingly.
      for(var i = 0; i < Snakes.length; i++) {
        var snake = Snakes[i];
        oldNum = snake['snake-num'];
        snake['snake-num'] = i;
        var snakeList = document.querySelectorAll('[snake-num="' + oldNum + '"]');

        for(var j = 0; j < snakeList.length; j++) {
          snakeList[j].setAttribute('snake-num', i);
        }
      }
    }
  } else {
    var snakeNum = snake['snake-num'];

    // Turn the hit body part into a block.
    var part = document.querySelector('[snake-num="' + snakeNum + '"][part="' + piece + '"]');
    toBlock(part);

    if(snake.body.length === 1) {
      // Snake reduced to a head.
      snake.body.length = 0;
    } else if(snake.body.length - 1 === piece) {
      // If we hit the last part, remove it from the body array.
      snake.body.pop();
    } else {
      ///////////////////////
      // Create two snakes //
      ///////////////////////

      // Adjust all snake numbers on the board and objects.
      for(var i = 0; i < Snakes.length; i++) {
        var theSnake = Snakes[i];

        // Change the board.
        var boardSnake = document.querySelectorAll('[snake-num="' + theSnake['snake-num'] + '"]');
        for(var j = 0; j < boardSnake.length; j++) {
          var bSnake = boardSnake[j];
          bSnake.setAttribute('snake-num', i);
        }

        // Change the object.
        theSnake['snake-num'] = i;
      }

      // Initialize new head on the board.
      var snakeNum = snake['snake-num'];
      newHead = document.querySelectorAll('[snake-num="' + snakeNum + '"][part="' + (piece + 1) + '"]')[0];
      newHead.removeAttribute('part');
      newHead.setAttribute('snake-head', 'true');
      newHead.setAttribute('snake-num', Snakes.length)
      removeClass(newHead, 'snake-body');
      newHead.className += ' snake-head';

      // Create the new snake object.
      var newSnake = {
        direction: snake.direction,
        lastDirection: snake.lastDirection,
        head: {
          column: Number(newHead.attributes.column.value),
          row: Number(newHead.attributes.row.value)
        },
        'snake-num': Snakes.length,
        body: snake.body.slice(piece + 2, snake.body.length)
      };

      // Adjust new snake body part numbers on the board and in the object.
      for(var k = 0; k < newSnake.body.length; k++) {
        var partNum = newSnake.body[k].part;
        var newPart = document.querySelectorAll('[snake-num="' + snakeNum + '"][part="' + partNum + '"]')[0];
        newSnake.body[k].part = k;
        newPart.setAttribute('snake-num', Snakes.length)
        newPart.setAttribute('part', k);
      }

      Snakes.push(newSnake);

      // Old snake revision.
      snake.body.splice(piece, snake.body.length);
    }
  }
}

function shoot() {
  // Do nothing if the mouse is not on the board
  // or if the blocks haven't been generated.
  // if(!App.offBoard || !App.generated) { return };
  if(App.offBoard) { return };

  // Column shot was fired in.
  var column = App.mouseLocation.attributes.column.value;
  var wholeColumn = document.getElementsByClassName('column' + column);
  var length = wholeColumn.length;
  var counter = App.rows - 2; // The block above the shooter.

  // Movement of the shot.
  var count = setInterval(function() {
    var test = wholeColumn[counter];
    var bullet = wholeColumn[counter + 1];

    // Bullet-at-the-end-of-the-board logic.
    if(counter === -1) {
      removeClass(bullet, 'bullet');
      clearInterval(count);
    } else if(test.attributes.block) {
      App.shooting = true;
      removeClass(bullet, 'bullet');
      removeClass(test, 'block');
      test.className += ' hitOnce';
      test.removeAttribute('block');
      test.setAttribute('hitOnce', 'true');
      clearInterval(count);
      App.shooting = false;
    } else if(test.attributes.hitOnce) {
      App.shooting = true;
      removeClass(bullet, 'bullet');
      removeClass(test, 'hitOnce');
      test.className += ' hitTwice';
      test.removeAttribute('hitOnce');
      test.setAttribute('hitTwice', 'true');
      clearInterval(count);
      App.shooting = false;
    } else if(test.attributes.hitTwice) {
      App.shooting = true;
      removeClass(bullet, 'bullet');
      removeClass(test, 'hitTwice');
      test.removeAttribute('hitTwice');
      clearInterval(count);
      App.shooting = false;
    } else if(test.attributes['snake-head']) {
      App.shooting = true;
      var snakeNum = Number(test.attributes['snake-num'].value);
      hitSnake(Snakes[snakeNum], 'head');
      removeClass(bullet, 'bullet');
      clearInterval(count);
      App.shooting = false;
    } else if(test.attributes['snake']) {
      App.shooting = true;
      var snakeNum = Number(test.attributes['snake-num'].value);
      var part = Number(test.attributes['part'].value);
      hitSnake(Snakes[snakeNum], part);
      removeClass(bullet, 'bullet');
      clearInterval(count);
      App.shooting = false;
    } else {
      wholeColumn[counter]['className'] += ' bullet';
      removeClass(bullet, 'bullet');
    }

    counter--;
  }, App.bulletSpeed);
}

// Random number generator with min & max options.
function randomNum(min, max) { // https://goo.gl/xIe4k
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random blocks on the board.
function randomBlocks(blocks) {
  for(blocks; blocks > 0; blocks--) {
    var row = randomNum(2, App.rows - 5); // Nothing on the top row or bottom 5.
    var col = randomNum(1, App.columns);

    var box = $('.row' + row + '.column' + col);

    // Ensure unique spawns.
    if(box.attr('block') || box.attr('snake')) {
      blocks += 1;
      continue;
    } else {
      box
        .addClass('block')
        .attr('block', 'true');
    }
  }

  App.generated = true;
}

function randomFood(foods) {
  for(foods; foods > 0; foods--) {
    var row = randomNum(2, App.rows - 5); // Nothing on the top row or bottom 5.
    var col = randomNum(1, App.columns);

    var box = $('.row' + row + '.column' + col);

    // Ensure unique spawns.
    if(box.attr('food') || box.attr('block') || box.attr('snake')) {
      foods += 1;
      continue
    } else {
      box
        .addClass('food')
        .attr('food', 'true');
    }
  }
}

// Function to dubplicate an object.
function objectCopy(original) {
  var copy = {};
  for(i in original) {
    copy[i] = original[i];
  }

  return copy;
}

/////////////////////
// SNAKE FUNCTIONS //
/////////////////////

Snakes = [];
Snakes.directionKey = {
  left: {column: -1, row: 0},
  right: {column: 1, row: 0},
  down: {column: 0, row: 1}
};

function startingSnake(length) {
  var snake = {
    direction: 'left',
    lastDirection: '',
    head: {},
    body: [],
    'snake-num': 0
  };

  // Create snake @ top right moving left.
  var start = App.columns - (length - 1);
  var row = document.getElementsByClassName('row1');
  var stop = row.length - length;
  var counter = 0;

  for(var i = start; i <= App.columns; i++) {
    if(i === start) {
      // Head coordinates.
      snake.head.column = i;
      snake.head.row = 1;
    } else {
      // Body coordinates.
      snake.body.push({column: i, row: 1, part: counter});
      counter++; // Used to track body parts.
    }
  }

  Snakes.push(snake);
  colorSnakes(true);
  App.snakes++; // Keep track of how many snakes we have.
}

function colorSnakes(on) {
  for(var i = 0; i < Snakes.length; i++) {
    var snake = Snakes[i];

    if(on) {
      // Process the head.
      var hCol = snake.head.column;
      var hRow = snake.head.row;
      var head = document.getElementsByClassName('column' + hCol + ' row' + hRow)[0];
      head.setAttribute('snake-head', 'true');
      head.setAttribute('snake', 'true');
      head.setAttribute('snake-num', i);
      head.className += ' snake-head';

      // Process the body.
      if(snake.body.length) {
        for(var j = 0; j < snake.body.length; j++) {
          var bCol = snake.body[j]['column'];
          var bRow = snake.body[j]['row'];
          var part = document.getElementsByClassName('column' + bCol + ' row' + bRow)[0];
          part.setAttribute('snake', 'true');
          part.setAttribute('snake-num', i);
          part.setAttribute('part', j);
          part.className += ' snake-body';
        }
      }
    } else {
      // Process the head.
      var head = document.querySelectorAll('[snake-head][snake-num="' + i + '"]')[0];
      if(!head) { debugger };
      head.removeAttribute('snake');
      head.removeAttribute('snake-head');
      head.removeAttribute('snake-num');
      removeClass(head, 'snake-head');

      // Process the body.
      if(snake.body.length) {
        for(var j = 0; j < snake.body.length; j++) {
          var part = document.querySelectorAll('[snake-num="' + i + '"][part="' + j + '"]')[0];
          if(!part) { debugger };
          part.removeAttribute('snake');
          part.removeAttribute('snake-num');
          part.removeAttribute('part');
          removeClass(part, 'snake-body');
        }
      }
    }
  }
}

// This will change the snake's direction if needed.
function wallCheck() {
  for(var i = 0; i < Snakes.length; i++) {
    snake = Snakes[i];

    // Coordinates for wall check.
    var wallCol = snake.head.column + Snakes.directionKey[snake.direction]['column'];

    // Take actions for walls.
    if(wallCol > App.columns || wallCol < 1) {
      snake.lastDirection = snake.direction;
      snake.direction = 'down';
    }
  }
}

// This will change the snake's direction if needed.
function blockSnakeFoodCheck() {
  for(var i = 0; i < Snakes.length; i++) {
    var snake = Snakes[i];

    // Coordinates for element check.
    var elCol = snake.head.column + Snakes.directionKey[snake.direction]['column'];
    var elRow = snake.head.row + Snakes.directionKey[snake.direction]['row'];

    // Coordinates for element-below check.
    var belowCol = snake.head.column + Snakes.directionKey.down.column;
    var belowRow = snake.head.row + Snakes.directionKey.down.row;

    // Grab the elements to check.
    var checkEl = document.getElementsByClassName('column' + elCol + ' row' + elRow)[0];
    var below = document.getElementsByClassName('column' + belowCol + ' row' + belowRow)[0];

    // Take actions for anything found.
    if(checkEl.attributes.block || checkEl.attributes.snake) {
      snake.lastDirection = snake.direction;
      snake.direction = 'down';

      if(below.attributes.block) {
        // If a block is below, grow snake & determine growth coordinates.
        // var last = snake.body[snake.body.length - 1];
        // var num;

        // snake.lastDirection === 'left' ? num = 1 : num = -1;
        // snake.body.push({column: last.column + num, row: last.row});
        growSnake(snake);

        // Clear & track eaten blocks.
        below.removeAttribute('block');
        below.removeAttribute('hitOnce');
        below.removeAttribute('hitTwice');
        removeClass(below, 'block');
        removeClass(below, 'hitOnce');
        removeClass(below, 'howTwice');
        App.eaten++;
      }
    } else if(checkEl.attributes.food) {
      growSnake(snake);
      checkEl.removeAttribute('food');
      removeClass(checkEl, 'food');
    }
  }
}

function growSnake(snake) {
  var num;
  snake.lastDirection === 'left' ? num = 1 : num = -1;

  if(!snake.body.length) {
    var last = snake.head;
  } else {
    var last = snake.body[snake.body.length -1];
    var part = last.part + 1;
  }

  snake.body.push({column: last.column + num, row: last.row, part: part});
}

function moveSnakes() {
  // Do nothing if the shoot function is processing a hit object.
  if(App.shooting) { return };

  // De-color and check for blocks & walls.
  // These functions will set appropriate properties on
  // each snake object, determining its direction & behavior.
  // var head = document.querySelectorAll('[snake-head][snake-num="0"]')[0];
  // if(!head) { debugger };
  colorSnakes();
  wallCheck();
  blockSnakeFoodCheck();

  // Move all snakes accordingly.
  for(var i = 0; i < Snakes.length; i++) {
    snake = Snakes[i];
    var referenceLoc = objectCopy(snake.head);

    // Adjust the head to the new location.
    snake.head.column += Snakes.directionKey[snake.direction]['column'];
    snake.head.row += Snakes.directionKey[snake.direction]['row'];

    // Adjust the body.
    var length = snake.body.length
    for(var j = 0; j < length; j++) {
      var part = snake.body[j];
      var newRef = objectCopy(part);

      part.column = referenceLoc.column;
      part.row = referenceLoc.row;

      referenceLoc = objectCopy(newRef);
    }

    // Change-direction logic.
    if(snake.direction === 'down') {
      snake.lastDirection === 'left' ? snake.direction = 'right' : snake.direction = 'left';
    }
  }

  colorSnakes(true);
}
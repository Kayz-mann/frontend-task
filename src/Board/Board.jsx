import React, {useEffect, useState} from 'react';
import {
  randomIntFromInterval,
  reverseLinkedList,
  useInterval,
} from '../lib/utils.js';

import './Board.css';

/**
  marker - represents the figure picking the food
 */

class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor(value) {
    const node = new LinkedListNode(value);
    this.head = node;
    this.tail = node;
  }
}

const Direction = {
  UP: 'UP',
  RIGHT: 'RIGHT',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
};

const BOARD_SIZE = prompt("enter row number");
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.3;

const getStartingMarkerLLValue = board => {
  const rowSize = board.length;
  const colSize = board[0].length;
  const startingRow = Math.round(rowSize / 3);
  const startingCol = Math.round(colSize / 3);
  const startingCell = board[startingRow][startingCol];
  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  };
};

const Board = () => {
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState(createBoard(BOARD_SIZE));
  const [marker, setMarker] = useState(
    new LinkedList(getStartingMarkerLLValue(board)),
  );
  const [markerCells, setMarkerCells] = useState(
    new Set([marker.head.value.cell]),
  );
  // Naively set the starting food cell 5 cells away from the starting marker cell.
  const [foodCell, setFoodCell] = useState(marker.head.value.cell + 5);
  const [direction, setDirection] = useState(Direction.RIGHT);
  const [foodShouldReverseDirection, setFoodShouldReverseDirection] = useState(
    false,
  );

  useEffect(() => {
    window.addEventListener('keydown', e => {
      handleKeydown(e);
    });
  },);

  // `useInterval` is needed; you can't naively do `setInterval` in the
  // `useEffect` above. See the article linked above the `useInterval`
  // definition for details.
  useInterval(() => {
    movemarker();
  }, 550);

  const handleKeydown = e => {
    const newDirection = getDirectionFromKey(e.key);
    const isValidDirection = newDirection !== '';
    if (!isValidDirection) return;
    const markerWillRunIntoItself =
      getOppositeDirection(newDirection) === direction && markerCells.size > 1;
    if (markerWillRunIntoItself) return;
    setDirection(newDirection);
  };

  const movemarker = () => {
    const currentHeadCoords = {
      row: marker.head.value.row,
      col: marker.head.value.col,
    };

    const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction);
    if (isOutOfBounds(nextHeadCoords, board)) {
      handleGameOver();
      return;
    }
    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col];
    if (markerCells.has(nextHeadCell)) {
      handleGameOver();
      return;
    }

    const newHead = new LinkedListNode({
      row: nextHeadCoords.row,
      col: nextHeadCoords.col,
      cell: nextHeadCell,
    });
    const currentHead = marker.head;
    marker.head = newHead;
    currentHead.next = newHead;

    const newMarkerCells = new Set(markerCells);
    newMarkerCells.delete(marker.tail.value.cell);
    newMarkerCells.add(nextHeadCell);

    marker.tail = marker.tail.next;
    if (marker.tail === null) marker.tail = marker.head;

    const foodConsumed = nextHeadCell === foodCell;
    if (foodConsumed) {
      // This function mutates newmarkerCells.
      // growmarker(newmarkerCells);
      if (foodShouldReverseDirection) reversemarker();
      handleFoodConsumption(newMarkerCells);
    }

    setMarkerCells(newMarkerCells);
  };

    const reversemarker = () => {
    const tailNextNodeDirection = getNextNodeDirection(marker.tail, direction);
    const newDirection = getOppositeDirection(tailNextNodeDirection);
    setDirection(newDirection);

    // The tail of the marker is really the head of the linked list, which
    // is why we have to pass the marker's tail to `reverseLinkedList`.
    reverseLinkedList(marker.tail);
    const markerHead = marker.head;
    marker.head = marker.tail;
    marker.tail = markerHead;
  };

  const handleFoodConsumption = newmarkerCells => {
    const maxPossibleCellValue = BOARD_SIZE * BOARD_SIZE;
    let nextFoodCell;
    // In practice, this will never be a time-consuming operation. Even
    // in the extreme scenario where a marker is so big that it takes up 90%
    // of the board (nearly impossible), there would be a 10% chance of generating
    // a valid new food cell--so an average of 10 operations: trivial.
    while (true) {
      nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue);
      if (newmarkerCells.has(nextFoodCell) || foodCell === nextFoodCell)
        continue;
      break;
    }

    const nextFoodShouldReverseDirection =
      Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD;

    setFoodCell(nextFoodCell);
    setFoodShouldReverseDirection(nextFoodShouldReverseDirection);
    setScore(score + 1);
  };

  const handleGameOver = () => {
    setScore(0);
    const markerLLStartingValue = getStartingMarkerLLValue(board);
    setMarker(new LinkedList(markerLLStartingValue));
    setFoodCell(markerLLStartingValue.cell + 5);
    setMarkerCells(new Set([markerLLStartingValue.cell]));
    setDirection(Direction.RIGHT);
  };

  return (
    <>
      <h1>Score: {score}</h1>
      <div className="board">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="row">
            {row.map((cellValue, cellIdx) => {
              const className = getCellClassName(
                cellValue,
                foodCell,
                foodShouldReverseDirection,
                markerCells,
              );
              return <div key={cellIdx} className={className}></div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
};

const createBoard = BOARD_SIZE => {
  let counter = 1;
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const currentRow = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      currentRow.push(counter++);
    }
    board.push(currentRow);
  }
  return board;
};

const getCoordsInDirection = (coords, direction) => {
  if (direction === Direction.UP) {
    return {
      row: coords.row - 1,
      col: coords.col,
    };
  }
  if (direction === Direction.RIGHT) {
    return {
      row: coords.row,
      col: coords.col + 1,
    };
  }
  if (direction === Direction.DOWN) {
    return {
      row: coords.row + 1,
      col: coords.col,
    };
  }
  if (direction === Direction.LEFT) {
    return {
      row: coords.row,
      col: coords.col - 1,
    };
  }
};

const isOutOfBounds = (coords, board) => {
  const {row, col} = coords;
  if (row < 0 || col < 0) return true;
  if (row >= board.length || col >= board[0].length) return true;
  return false;
};

const getDirectionFromKey = key => {
  if (key === 'ArrowUp') return Direction.UP;
  if (key === 'ArrowRight') return Direction.RIGHT;
  if (key === 'ArrowDown') return Direction.DOWN;
  if (key === 'ArrowLeft') return Direction.LEFT;
  return '';
};

const getNextNodeDirection = (node, currentDirection) => {
  if (node.next === null) return currentDirection;
  const {row: currentRow, col: currentCol} = node.value;
  const {row: nextRow, col: nextCol} = node.next.value;
  if (nextRow === currentRow && nextCol === currentCol + 1) {
    return Direction.RIGHT;
  }
  if (nextRow === currentRow && nextCol === currentCol - 1) {
    return Direction.LEFT;
  }
  if (nextCol === currentCol && nextRow === currentRow + 1) {
    return Direction.DOWN;
  }
  if (nextCol === currentCol && nextRow === currentRow - 1) {
    return Direction.UP;
  }
  return '';
};

const getGrowthNodeCoords = (markerTail, currentDirection) => {
  const tailNextNodeDirection = getNextNodeDirection(
    markerTail,
    currentDirection,
  );
  const growthDirection = getOppositeDirection(tailNextNodeDirection);
  const currentTailCoords = {
    row: markerTail.value.row,
    col: markerTail.value.col,
  };
  const growthNodeCoords = getCoordsInDirection(
    currentTailCoords,
    growthDirection,
  );
  return growthNodeCoords;
};

const getOppositeDirection = direction => {
  if (direction === Direction.UP) return Direction.DOWN;
  if (direction === Direction.RIGHT) return Direction.LEFT;
  if (direction === Direction.DOWN) return Direction.UP;
  if (direction === Direction.LEFT) return Direction.RIGHT;
};

const getCellClassName = (
  cellValue,
  foodCell,
  foodShouldReverseDirection,
  markerCells,
) => {
  let className = 'cell';
  if (cellValue === foodCell) {
    if (foodShouldReverseDirection) {
      className = 'cell cell-purple';
    } else {
      className = 'cell cell-red';
    }
  }
  if (markerCells.has(cellValue)) className = 'cell cell-green';

  return className;
};

export default Board;

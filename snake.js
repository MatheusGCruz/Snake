const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestElement = document.querySelector("#bestScore");
const speedElement = document.querySelector("#speed");
const messageElement = document.querySelector("#message");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");

const cells = 24;
const initialSnake = [
  { x: 10, y: 12 },
  { x: 9, y: 12 },
  { x: 8, y: 12 }
];

let snake = [];
let food = { x: 16, y: 12 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let bestScore = Number(localStorage.getItem("nebulaSnakeBest") || 0);
let running = false;
let paused = false;
let lastTick = 0;
let tickDelay = 150;

bestElement.textContent = bestScore;

function resetGame() {
  snake = initialSnake.map((segment) => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  tickDelay = 150;
  running = false;
  paused = false;
  placeFood();
  updateStats();
  setMessage("Press Start or Space");
  draw();
}

function startGame() {
  if (!running) {
    running = true;
    paused = false;
    lastTick = performance.now();
    setMessage("");
    window.requestAnimationFrame(gameLoop);
    return;
  }

  if (paused) {
    paused = false;
    lastTick = performance.now();
    setMessage("");
    window.requestAnimationFrame(gameLoop);
  }
}

function togglePause() {
  if (!running) {
    return;
  }

  paused = !paused;
  setMessage(paused ? "Paused" : "");
  if (!paused) {
    lastTick = performance.now();
    window.requestAnimationFrame(gameLoop);
  }
}

function gameLoop(time) {
  if (!running || paused) {
    return;
  }

  if (time - lastTick >= tickDelay) {
    moveSnake();
    lastTick = time;
  }

  draw();
  window.requestAnimationFrame(gameLoop);
}

function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  if (hitWall(nextHead) || hitSnake(nextHead)) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 10;
    tickDelay = Math.max(72, tickDelay - 4);
    placeFood();
    updateStats();
  } else {
    snake.pop();
  }
}

function endGame() {
  running = false;
  paused = false;
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("nebulaSnakeBest", bestScore);
  updateStats();
  setMessage("Game over - press Start");
}

function hitWall(position) {
  return position.x < 0 || position.y < 0 || position.x >= cells || position.y >= cells;
}

function hitSnake(position) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells)
    };
  } while (hitSnake(food));
}

function setDirection(newDirection) {
  const reversing = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;
  if (!reversing) {
    nextDirection = newDirection;
  }
}

function updateStats() {
  scoreElement.textContent = score;
  bestElement.textContent = bestScore;
  speedElement.textContent = `${Math.round(150 / tickDelay * 10) / 10}x`;
}

function setMessage(text) {
  messageElement.textContent = text;
  messageElement.classList.toggle("hidden", !text);
}

function draw() {
  const size = canvas.width;
  const cellSize = size / cells;

  context.fillStyle = "#071014";
  context.fillRect(0, 0, size, size);
  drawGrid(cellSize, size);
  drawFood(cellSize);
  drawSnake(cellSize);
}

function drawGrid(cellSize, size) {
  context.strokeStyle = "rgba(255, 255, 255, 0.055)";
  context.lineWidth = 1;

  for (let index = 1; index < cells; index += 1) {
    const position = index * cellSize;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, size);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(size, position);
    context.stroke();
  }
}

function drawFood(cellSize) {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;
  const radius = cellSize * 0.34;

  const glow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, cellSize);
  glow.addColorStop(0, "#fff1af");
  glow.addColorStop(0.28, "#f6b44b");
  glow.addColorStop(1, "rgba(217, 88, 42, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.72, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f6b44b";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
}

function drawSnake(cellSize) {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 3 : 4;
    const x = segment.x * cellSize + inset;
    const y = segment.y * cellSize + inset;
    const size = cellSize - inset * 2;
    const shade = index === 0 ? "#8ff78c" : "#4fb9c7";

    context.fillStyle = shade;
    roundRect(context, x, y, size, size, 7);
    context.fill();

    if (index === 0) {
      context.fillStyle = "#071014";
      context.beginPath();
      context.arc(x + size * 0.66, y + size * 0.34, 2.4, 0, Math.PI * 2);
      context.fill();
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

document.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyD: { x: 1, y: 0 }
  };

  if (directions[event.code]) {
    event.preventDefault();
    setDirection(directions[event.code]);
  }

  if (event.code === "Space") {
    event.preventDefault();
    running && !paused ? togglePause() : startGame();
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    const directionName = button.dataset.direction;
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    setDirection(directions[directionName]);
    startGame();
  });
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
resetButton.addEventListener("click", resetGame);

resetGame();

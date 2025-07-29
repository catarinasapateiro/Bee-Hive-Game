//board
let board;
let boardWidth = 1100;
let boardHeight = 900;
let context;
let inputLocked = false;
let gameBoard = document.getElementById("game-canvas");

function resizeBoard() {
  const aspectRatio = 4 / 3;
  let width = window.innerWidth;
  let height = window.innerHeight;

  if (width / height > aspectRatio) {
    width = height * aspectRatio;
  } else {
    height = width / aspectRatio;
  }

  boardWidth = width;
  boardHeight = height;
}

window.addEventListener("resize", resizeBoard);

//sounds
const catchSound = new Audio("./sounds/short-success-sound.mp3");
const gameOverSound = new Audio("./sounds/game-over.mp3");
let isMuted = false;

const muteButton = document.getElementById("mute-button");

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  muteButton.innerText = isMuted ? "🔇" : "🔈";
});

//set game state

let GAME_STATE = {
  MENU: "menu",
  PLAYING: "playing",
  LEVELPASSED: "levelPassed",
  GAME_OVER: "gameOver",
};

let currentState = GAME_STATE.MENU;
let levelPassedShown = false;
let currentLevel = 1;
let gameOverShown = false;

//score count
let score = 0;
let scoreCount = document.getElementById("score-count");
let level = document.getElementById("level");

//instructions

const instructions = document.getElementById("instructions");

// level passed message

const levelPassed = document.getElementById("level-passed");
const levelPassedText = document.getElementById("level-passed-text-one");
const levelPassedTextSecondary = document.getElementById(
  "level-passed-text-two"
);
const levelPassedSpan = document.getElementById("level-span");

//bee
let beeImg;

const bee = {
  x: boardWidth / 2.1,
  y: boardHeight / 1.2,
  width: 80,
  height: 80,
};

//physics
let velocityY = 2;
let beeY = boardHeight / 1.2;

// flowers
let flowersArray = [];
let flowerWidth = 190;
let flowerHeight = 200;
let flowerRight;
let flowerLeft;
let leftFlowerInterval;
let rightFlowerInterval;

let flowerY = 0;
const flowerImages = [
  "./images/flowers/flower-pink.png",
  "./images/flowers/flower-yellow.png",
  "./images/flowers/flower-purple.png",
];

// create random numbers
function getRandomInt(max) {
  let num = Math.floor(Math.random() * max);

  return num;
}

//move the bee

document.addEventListener("keydown", handleKeyDown);

let moveAmount = 75;

function handleKeyDown(e) {
  if (inputLocked) return;

  switch (e.key) {
    case "ArrowLeft":
      bee.x -= moveAmount;

      if (bee.x < 0) bee.x = 0;
      break;

    case "ArrowRight":
      bee.x += moveAmount;

      if (bee.x + bee.width > boardWidth) bee.x = boardWidth - bee.width;
      break;

    case "ArrowUp":
      bee.y -= moveAmount;
      if (bee.y < 0) bee.y = 0;
      break;

    case "ArrowDown":
      bee.y += moveAmount;
      if (bee.y + bee.height > boardHeight) bee.y = boardHeight - bee.height;
      break;

    default:
      break;
  }
}

//place flowers

function placeFlowers() {
  createFlowers();
}

function createFlowers() {
  const MAX_ATTEMPTS = 10;
  const NUM_FLOWERS = 2;
  const BUFFER = 20;

  for (let i = 0; i < NUM_FLOWERS; i++) {
    let attempts = 0;
    let placed = false;

    while (attempts < MAX_ATTEMPTS && !placed) {
      const flowerIndex = Math.floor(Math.random() * flowerImages.length);
      const img = new Image();
      img.src = flowerImages[flowerIndex];

      const x = Math.random() * (boardWidth - flowerWidth);
      const y = -flowerHeight;

      const newFlower = {
        imgObj: img,
        x: x,
        y: y,
        width: flowerWidth,
        height: flowerHeight,
        isCatched: false,
      };

      const overlapping = flowersArray.some((existing) => {
        return (
          newFlower.x < existing.x + existing.width + BUFFER &&
          newFlower.x + newFlower.width + BUFFER > existing.x &&
          newFlower.y < existing.y + existing.height + BUFFER &&
          newFlower.y + newFlower.height + BUFFER > existing.y
        );
      });

      if (!overlapping) {
        flowersArray.push(newFlower);
        placed = true;
      }

      attempts++;
    }
  }
}

//place wasps

//wasp
let waspImg;
let waspsArray = [];
let waspInterval;

// flowers
let waspWidth = 100;
let waspHeight = 100;

function createWasp() {
  const img = new Image();
  img.src = "./images/characters/wasp.png";

  const x = Math.random() * (boardWidth - waspWidth);
  const y = -waspHeight;

  const newWasp = {
    imgObj: img,
    x: x,
    y: y,
    width: waspWidth,
    height: waspHeight,
    isCatched: false,
    speed: 2 + currentLevel * 0.5 + Math.random(),
  };

  waspsArray.push(newWasp);
}

window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  //Set up start button
  const startButton = document.querySelector(".button-start");
  const pauseButton = document.querySelector(".button-end");
  pauseButton.addEventListener("click", pauseGame);
  startButton.addEventListener("click", startGame);

  //create bee
  beeImg = new Image();
  beeImg.src = "./images/characters/bee.png";

  //create flowers
  flowerRight = new Image();
  flowerRight.src = flowerImages[0];
  flowerLeft = new Image();
  flowerLeft.src = flowerImages[1];

  //create wasp
  waspImg = new Image();
  waspImg.src = "./images/characters/wasp.png";

  requestAnimationFrame(update);
};

function renderGame() {
  for (let i = 0; i < flowersArray.length; i++) {
    let f = flowersArray[i];
    if (!isPaused) {
      f.y += velocityY;
    }

    if (!f.isCatched) {
      context.drawImage(f.imgObj, f.x, f.y, f.width, f.height);

      if (detectCollision(bee, f)) {
        f.isCatched = true;
        score += 1;
        scoreCount.innerText = score;

        if (!isMuted) {
          catchSound.currentTime = 0;
          catchSound.play();
        }

        bee.isGlowing = true;
        setTimeout(() => {
          bee.isGlowing = false;
        }, 300);
      }
    }
  }

  // remove flowers that moved off the screen
  while (flowersArray.length > 0 && flowersArray[0].y > boardHeight) {
    flowersArray.shift();
  }

  if (bee.isGlowing) {
    context.save();
    context.shadowColor = "yellow";
    context.shadowBlur = 75;
    context.drawImage(beeImg, bee.x, bee.y, bee.width, bee.height);
    context.restore();
  } else {
    context.drawImage(beeImg, bee.x, bee.y, bee.width, bee.height);
  }

  if (bee.y > board.height) {
    currentState = GAME_STATE.GAME_OVER;
  }

  for (let i = 0; i < waspsArray.length; i++) {
    let w = waspsArray[i];
    if (!isPaused) {
      w.y += w.speed;
    }

    if (!w.isCatched) {
      context.drawImage(w.imgObj, w.x, w.y, w.width, w.height);

      if (detectCollision(bee, w)) {
        w.isCatched = true;
        currentState = GAME_STATE.GAME_OVER;
        console.log("Bee got stung!");
      }
    }
  }

  waspsArray = waspsArray.filter((w) => w.y <= boardHeight);
}

function renderLevelPassed() {
  levelPassed.classList.replace("hide-level", "level-passed");
  levelPassedText.classList.replace("hide-level-text", "level-passed-text");
  levelPassedTextSecondary.classList.replace(
    "hide-level-text",
    "level-passed-text"
  );
  levelPassedSpan.innerText = currentLevel + 1;
}

function undisplayLevelPassed() {
  levelPassed.classList.replace("level-passed", "hide-level");
  levelPassedText.classList.replace("level-passed-text", "hide-level-text");
  levelPassedTextSecondary.classList.replace(
    "level-passed-text",
    "hide-level-text"
  );
  resetGame();
}

function update() {
  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  console.log(score, "score");

  if (score === 12 && !levelPassedShown) {
    currentState = GAME_STATE.LEVELPASSED;
    levelPassedShown = true;

    setTimeout(() => {
      renderLevelPassed();
      currentLevel++;
      level.innerText = currentLevel;
      resetGame();
    }, 1000);

    return;
  }

  if (currentState === GAME_STATE.PLAYING) {
    renderGame();
  }

  if (currentState === GAME_STATE.GAME_OVER) {
    gameOver();
  }
}

//pause game

function pauseGame() {
  console.log("Pause game");
  moveAmount = 0;
  isPaused = true;
}

function startGame() {
  isPaused = false;
  velocityY = 2;
  moveAmount = 75;
  currentState = GAME_STATE.PLAYING;
  console.log(currentState);

  setTimeout(() => {
    instructions.classList.remove("instructions-container");
    instructions.classList.add("instructions-hide");
  }, 3000);

  undisplayLevelPassed();

  if (waspInterval) clearInterval(waspInterval);
  waspInterval = setInterval(createWasp, 5000 + Math.random() * 3000);

  if (leftFlowerInterval) clearInterval(leftFlowerInterval);
  if (rightFlowerInterval) clearInterval(rightFlowerInterval);

  leftFlowerInterval = setInterval(placeFlowers, 6000 + Math.random() * 2000);
  rightFlowerInterval = setInterval(placeFlowers, 12000 + Math.random() * 2000);
}

function resetGame() {
  bee.y = beeY;
  flowersArray = [];
  waspsArray = [];
  score = 0;
  scoreCount.innerText = score;
  levelPassedShown = false;
  gameOverShown = false;
}

function gameOver() {
  if (gameOverShown) return;
  gameOverShown = true;

  isPaused = true;

  const gameOver = document.createElement("h2");
  gameOver.className = "game-over";
  gameOver.innerText = "GAME OVER!";
  document.body.appendChild(gameOver);
  if (!isMuted) {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
  }

  setTimeout(() => {
    gameOver.remove();
    resetGame();
    gameOverShown = false;
    level.innerText = currentLevel;
    currentState = GAME_STATE.PLAYING;
    startGame();
  }, 4000);
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

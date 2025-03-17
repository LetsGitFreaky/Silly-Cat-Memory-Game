const gameContainer = document.getElementById("game-container");
const difficultySelect = document.getElementById("difficulty");
const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status");
const winScreen = document.getElementById("win-screen");
const loseScreen = document.getElementById("lose-screen");
const loseMessage = document.getElementById("lose-message");
const streakDisplay = document.getElementById("streak");
const highscoreDisplay = document.getElementById("highscore");
const modeToggle = document.getElementById("mode-toggle");
const hintBtn = document.getElementById("hint-btn");

const catImages = [
  "https://tinyurl.com/2n4mjfwt",
  "https://tinyurl.com/28u3vtxm",
  "https://tinyurl.com/4zkhyn9c",
  "https://tinyurl.com/bdhcyvmf"
];

let flipped = [], matched = 0, totalMoves = 0, timeLeft = 0;
let timer, lockBoard = false;
let streak = 0, highscore = 0, hintLimit = 0;

const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
let confetti = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function makeConfetti() {
  confetti = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    r: Math.random() * 6 + 4,
    c: `hsl(${Math.random() * 360}, 100%, 60%)`,
    d: Math.random() * 5 + 1,
  }));
}

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confetti.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
    ctx.fillStyle = p.c;
    ctx.fill();
    p.y += p.d;
    if (p.y > canvas.height) p.y = 0;
  });
}

let confettiInterval = null;
function startConfetti() {
  makeConfetti();
  if (confettiInterval) clearInterval(confettiInterval);
  confettiInterval = setInterval(drawConfetti, 20);
}

function stopConfetti() {
  clearInterval(confettiInterval);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const difficultySettings = {
  easy: { rows: 2, cols: 4, moves: 12, time: 30, hints: 1 },
  medium: { rows: 4, cols: 4, moves: 24, time: 40, hints: 2 },
  hard: { rows: 4, cols: 6, moves: 40, time: 60, hints: 3 }
};

function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function createBoard(rows, cols) {
  gameContainer.innerHTML = "";
  gameContainer.style.gridTemplateColumns = `repeat(${cols}, 100px)`;

  const neededPairs = (rows * cols) / 2;
  let imagePool = [];
  while (imagePool.length < neededPairs) imagePool = imagePool.concat(catImages);

  const selected = shuffleArray(imagePool).slice(0, neededPairs);
  const cards = shuffleArray([...selected, ...selected]);

  cards.forEach(src => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `<img src="${src}" alt="cat" />`;
    card.addEventListener("click", () => flipCard(card));
    gameContainer.appendChild(card);
  });
}

function flipCard(card) {
  if (lockBoard || card.classList.contains("flipped") || timeLeft <= 0 || totalMoves <= 0) return;

  card.classList.add("flipped");
  flipped.push(card);

  if (flipped.length === 2) {
    totalMoves--;
    updateStatus();
    const [first, second] = flipped;
    const isMatch = first.innerHTML === second.innerHTML;

    if (isMatch) {
      first.classList.add("matched");
      second.classList.add("matched");
      matched++;
      streak++;
      streakDisplay.textContent = streak;

      if (matched === gameContainer.children.length / 2) {
        highscore = Math.max(highscore, streak);
        highscoreDisplay.textContent = highscore;
        endGame("win");
      }
      flipped = [];
    } else {
      lockBoard = true;
      setTimeout(() => {
        first.classList.remove("flipped");
        second.classList.remove("flipped");
        flipped = [];
        lockBoard = false;
      }, 800);
    }

    if (totalMoves <= 0 && matched < gameContainer.children.length / 2) {
      endGame("moves");
    }
  }
}

function showHint() {
  if (hintLimit <= 0) {
    alert("No More Hints Left");
    return;
  }

  const unmatched = Array.from(document.querySelectorAll(".card:not(.matched):not(.flipped)"));
  if (unmatched.length < 2) return;

  const first = unmatched[0];
  const match = unmatched.find(card => card.innerHTML === first.innerHTML && card !== first);

  if (match) {
    first.classList.add("flipped");
    match.classList.add("flipped");
    setTimeout(() => {
      first.classList.remove("flipped");
      match.classList.remove("flipped");
    }, 1000);
    hintLimit--;
  }
}

function updateStatus() {
  statusText.textContent = `Moves Left: ${totalMoves} | Time Left: ${timeLeft}s`;
}

function endGame(reason) {
  clearInterval(timer);
  lockBoard = true;
  stopConfetti();

  if (reason === "win") {
    winScreen.classList.remove("hidden");
    loseScreen.classList.add("hidden");
    startConfetti();
  } else {
    loseMessage.textContent = reason === "time" ? "⏰ Time's up! You lost!" : "😵 Out of Moves! You lost!";
    loseScreen.classList.remove("hidden");
    winScreen.classList.add("hidden");
    streak = 0;
    streakDisplay.textContent = streak;
  }
}

function startGame() {
  const { rows, cols, moves, time, hints } = difficultySettings[difficultySelect.value];
  flipped = [];
  matched = 0;
  totalMoves = moves;
  timeLeft = time;
  hintLimit = hints;
  lockBoard = false;
  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
  stopConfetti();
  createBoard(rows, cols);
  updateStatus();

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0 && matched < gameContainer.children.length / 2) {
      endGame("time");
    }
  }, 1000);
}

startBtn.addEventListener("click", startGame);
hintBtn.addEventListener("click", showHint);

modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  modeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "🌞 Toggle Light Mode"
    : "🌙 Toggle Dark Mode";
});

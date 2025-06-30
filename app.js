const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const moles = document.querySelectorAll('.mole');
const timerDisplay = document.querySelector('.time-left');
const gameOverText = document.querySelector('.game-over');
const restartDiv = document.querySelector('.restart');
const highScoreDisplay = document.querySelector('.high-score');
let highScore = 0;
let countdown;
let lastHole;
let timeUp = false;
let score = 0;
let difficulty = 'medium';
//mUSIC
const bgMusic = document.getElementById('bgMusic');

function startGame() {
  scoreBoard.textContent = 0;
  timeUp = false;
  score = 0;
  peep();
  bgMusic.play(); // Play music when game starts
  setTimeout(() => {
    timeUp = true;
    bgMusic.pause(); // Optional: stop music after 10 seconds
    bgMusic.currentTime = 0;
  }, 10000);
}

const difficultySpeeds = {
  easy: [700, 1200],
  medium: [400, 1000],
  hard: [200, 800]
};

function updateDifficulty() {
  const selected = document.getElementById('difficulty').value;
  difficulty = selected;
  console.log(`Difficulty set to: ${difficulty}`);
}

function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}


function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        console.log('Ah nah thats the same one bud');
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
  const [min, max] = difficultySpeeds[difficulty];
  const time = randomTime(min, max);
  const hole = randomHole(holes);
  hole.classList.add('up');
  setTimeout(() => {
    hole.classList.remove('up');
    if (!timeUp) peep();
  }, time);
}

function startGame() {
    scoreBoard.textContent = 0;
    timerDisplay.textContent = 10;
    gameOverText.style.display = 'none';
    

    timeUp = false;
    score = 0;
    peep();
    countDown();

    setTimeout(() => {
        timeUp = true;
        gameOverText.style.display = 'block';
        
    }, 10000);
}


function countDown() {
    let timeLeft = 10;
    clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
        }
    }, 1000);
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!
    score++;
    this.parentNode.classList.remove('up');
    scoreBoard.textContent = score;

    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
    }
}

moles.forEach(mole => mole.addEventListener('click', bonk));
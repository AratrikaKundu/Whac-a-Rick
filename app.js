
// ==========================================
// GAME ELEMENTS
// ==========================================

const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const moles = document.querySelectorAll('.mole');
const gameBoard = document.querySelector('.game');
const timerDisplay = document.querySelector('.time-left');
const gameOverText = document.querySelector('.game-over');
const highScoreDisplay = document.querySelector('.high-score');
const bgMusic = document.getElementById('bgMusic');

// Backend URL
const API_URL = "http://localhost:3000";

// Authentication state
let token = sessionStorage.getItem("token");

// Game variables
let highScore = 0;
let countdown;
let gameTimeout;
let moleTimeout;
let lastHole;
let timeUp = true;
let score = 0;
let difficulty = 'medium';


// ==========================================
// AUTHENTICATION
// ==========================================

// REGISTER USER
async function registerUser() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const message = document.getElementById("authMessage");

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Registration failed";
            return;
        }

        message.textContent = "Registration successful! Please log in.";

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

    } catch (error) {
        console.error("Registration error:", error);
        message.textContent = "Cannot connect to the backend.";
    }
}


// LOGIN USER
async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("authMessage");

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Login failed";
            return;
        }

        token = data.token;
        sessionStorage.setItem("token", token);

        document.getElementById("loginPassword").value = "";

        message.textContent = "Login successful!";

        await fetchProfile();

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = "Cannot connect to the backend.";
    }
}


// FETCH PLAYER PROFILE
async function fetchProfile() {
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/game/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not fetch profile");
        }

        const user = data.user;

        document.getElementById("playerName").textContent = user.name;

        highScore = Number(user.high_score) || 0;
        highScoreDisplay.textContent = highScore;

        document.getElementById("loggedInUser").textContent =
            `Logged in as ${user.name}`;

        document.getElementById("logoutButton").style.display = "inline-block";

    } catch (error) {
        console.error("Profile error:", error);
        logoutUser();
    }
}


// LOGOUT USER
function logoutUser() {
    token = null;
    sessionStorage.removeItem("token");

    highScore = 0;
    highScoreDisplay.textContent = 0;

    document.getElementById("playerName").textContent = "Guest";
    document.getElementById("loggedInUser").textContent = "";
    document.getElementById("logoutButton").style.display = "none";
    document.getElementById("authMessage").textContent = "Logged out successfully.";
}


// ==========================================
// GAME SETTINGS
// ==========================================

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


// ==========================================
// MUSIC
// ==========================================

function toggleMusic() {
    if (!bgMusic) return;

    if (bgMusic.paused) {
        bgMusic.play().catch(error =>
            console.log("Music playback blocked:", error)
        );
    } else {
        bgMusic.pause();
    }
}


// ==========================================
// GAME LOGIC
// ==========================================

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}


function randomHole(holes) {
    let hole;

    do {
        const idx = Math.floor(Math.random() * holes.length);
        hole = holes[idx];
    } while (hole === lastHole && holes.length > 1);

    lastHole = hole;

    return hole;
}


function peep() {
    if (timeUp) return;

    const [min, max] = difficultySpeeds[difficulty];

    const time = randomTime(min, max);
    const hole = randomHole(holes);

    hole.classList.add('up');

    moleTimeout = setTimeout(() => {
        hole.classList.remove('up');

        if (!timeUp) {
            peep();
        }
    }, time);
}


// ==========================================
// START GAME
// ==========================================
function startGame() {
    // Stop previous timers
    clearInterval(countdown);
    clearTimeout(gameTimeout);
    clearTimeout(moleTimeout);

    // Remove currently visible moles
    holes.forEach(hole => hole.classList.remove('up'));

    // Reset score and timer
    score = 0;
    scoreBoard.textContent = 0;

    timerDisplay.textContent = 10;
    gameOverText.style.display = 'none';

    lastHole = null;
    timeUp = false;

    // Start mole appearances
    peep();

    // Start countdown
    countDown();

    // End game after 10 seconds
    gameTimeout = setTimeout(() => {
        endGame();
    }, 10000);
}

// ==========================================
// COUNTDOWN
// ==========================================

function countDown() {
    let timeLeft = 10;

    countdown = setInterval(() => {
        timeLeft--;

        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdown);
        }
    }, 1000);
}


// ==========================================
// END GAME
// ==========================================

async function endGame() {
    if (timeUp) return;

    timeUp = true;

    clearInterval(countdown);
    clearTimeout(moleTimeout);

    holes.forEach(hole => hole.classList.remove('up'));

    timerDisplay.textContent = 0;
    gameOverText.style.display = 'block';

    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }

    // Submit score only if logged in
    if (token) {
        await submitScore();
    } else {
        document.getElementById("authMessage").textContent =
            "Log in to save your high score!";
    }
}


// ==========================================
// BONK — MULTIPLE CLICKS ALLOWED
// ==========================================


// ==========================================
// BONK — EVERY CLICK COUNTS
// ==========================================

if (gameBoard) {
    gameBoard.addEventListener('click', function (e) {

        // Only accept genuine user clicks
        if (!e.isTrusted) return;

        // Game must be running
        if (timeUp) return;

        // Identify the clicked element
        const target = e.target instanceof Element
            ? e.target
            : e.target.parentElement;

        if (!target) return;

        // Check whether the click happened on Rick
        const clickedMole = target.closest('.mole');

        if (!clickedMole) return;

        // Find the corresponding hole
        const hole = clickedMole.closest('.hole');

        // Rick must be visible
        if (!hole || !hole.classList.contains('up')) return;

        // INCREASE SCORE ON EVERY CLICK
        score++;

        // Update score display
        scoreBoard.textContent = score;

        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
        }

        console.log("BONK! Score:", score);
    });
}


// ==========================================
// SUBMIT HIGH SCORE TO BACKEND
// ==========================================

async function submitScore() {
    try {
        const response = await fetch(`${API_URL}/api/game/score`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                score: score
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Score submission failed");
        }

        highScore = data.high_score;
        highScoreDisplay.textContent = highScore;

        document.getElementById("authMessage").textContent =
            "Your score has been saved!";

    } catch (error) {
        console.error("Score submission error:", error);

        document.getElementById("authMessage").textContent =
            "Could not save your score. Please log in again if needed.";
    }
}


// ==========================================
// CHECK EXISTING LOGIN ON PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        fetchProfile();
    }
});

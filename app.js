
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

const API_URL = "https://whac-a-rick-backend.onrender.com";

// Authentication state
let token = sessionStorage.getItem("token");
let guestMode = !token;

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
// SCREEN NAVIGATION
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const selectedScreen = document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.classList.add('active');
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// ==========================================
// AUTHENTICATION SCREEN SWITCHING
// ==========================================

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const message = document.getElementById('authMessage');

    if (mode === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';

        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';

        registerTab.classList.remove('active');
        loginTab.classList.add('active');
    }

    message.textContent = '';
}


// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================

function togglePassword(inputId, button) {
    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        button.textContent = "🙈";
        button.setAttribute("aria-label", "Hide password");
    } else {
        passwordInput.type = "password";
        button.textContent = "👁";
        button.setAttribute("aria-label", "Show password");
    }
}

// ==========================================
// GUEST MODE
// ==========================================

function playAsGuest() {
    guestMode = true;

    document.getElementById('playerName').textContent = 'Guest';

    const guestMessage = document.getElementById('guestMessage');

    if (guestMessage) {
        guestMessage.textContent = 'Playing as Guest — your score will not be saved.';
    }

    showScreen('gameScreen');
}


// ==========================================
// UPDATE NAVIGATION / PLAYER UI
// ==========================================

function updatePlayerUI(name) {
    const playerName = document.getElementById('playerName');
    const navPlayerName = document.getElementById('navPlayerName');
    const logoutButton = document.getElementById('logoutButton');
    const navAuthButton = document.getElementById('navAuthButton');

    if (playerName) {
        playerName.textContent = name;
    }

    if (navPlayerName) {
        navPlayerName.textContent = name;
    }

    if (logoutButton) {
        logoutButton.style.display = token ? 'inline-block' : 'none';
    }

    if (navAuthButton) {
        navAuthButton.style.display = token ? 'none' : 'inline-block';
    }
}


// ==========================================
// REGISTER USER
// ==========================================

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

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

        switchAuthMode('login');
        message.textContent = "Registration successful! Please log in.";

    } catch (error) {
        console.error("Registration error:", error);
        message.textContent = "Cannot connect to the backend.";
    }
}


// ==========================================
// LOGIN USER
// ==========================================

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
        guestMode = false;

        sessionStorage.setItem("token", token);

        document.getElementById("loginPassword").value = "";

        await fetchProfile();

        message.textContent = "Login successful!";
        showScreen('gameScreen');

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = "Cannot connect to the backend.";
    }
}


// ==========================================
// FETCH PLAYER PROFILE
// ==========================================

async function fetchProfile() {
    if (!token) return false;

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

        guestMode = false;

        highScore = Number(user.high_score) || 0;

        highScoreDisplay.textContent = highScore;

        document.getElementById("loggedInUser").textContent =
            `Logged in as ${user.name}`;

        updatePlayerUI(user.name);

        return true;

    } catch (error) {
        console.error("Profile error:", error);

        logoutUser(false);
        return false;
    }
}


// ==========================================
// LOGOUT USER
// ==========================================

function logoutUser(showMessage = true) {
    token = null;
    guestMode = true;

    sessionStorage.removeItem("token");

    highScore = 0;
    highScoreDisplay.textContent = 0;

    document.getElementById("loggedInUser").textContent = "";

    updatePlayerUI("Guest");

    if (showMessage) {
        document.getElementById("authMessage").textContent =
            "Logged out successfully.";

        showScreen('homeScreen');
    }
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

    // Rick disappears naturally when this timer expires.
    // Clicking Rick does not affect this timer.

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
    clearInterval(countdown);
    clearTimeout(gameTimeout);
    clearTimeout(moleTimeout);

    holes.forEach(hole => hole.classList.remove('up'));

    score = 0;
    scoreBoard.textContent = 0;

    timerDisplay.textContent = 10;
    gameOverText.style.display = 'none';

    lastHole = null;
    timeUp = false;

    // Start Rick appearances
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

    // Stop music at the end of the game
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }

    // Save score only for logged-in players
    if (token && !guestMode) {
        await submitScore();
    } else {
        document.getElementById("authMessage").textContent =
            "Log in to save your high score!";
    }
}


// ==========================================
// BONK — EVERY GENUINE CLICK COUNTS
// ==========================================

if (gameBoard) {
    gameBoard.addEventListener('click', function (e) {

        if (!e.isTrusted) return;
        if (timeUp) return;

        const target = e.target instanceof Element
            ? e.target
            : e.target.parentElement;

        if (!target) return;

        const clickedMole = target.closest('.mole');

        if (!clickedMole) return;

        const hole = clickedMole.closest('.hole');

        if (!hole || !hole.classList.contains('up')) return;

        // Every click on a visible Rick adds one point.
        score++;

        scoreBoard.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
        }

        // IMPORTANT:
        // Do not hide Rick here.
        // Do not clear moleTimeout here.
        // Do not call peep() here.

        console.log("BONK! Score:", score);
    });
}


// ==========================================
// SUBMIT HIGH SCORE
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

        highScore = Number(data.high_score) || 0;
        highScoreDisplay.textContent = highScore;

        document.getElementById("authMessage").textContent =
            "Your score has been saved!";

    } catch (error) {
        console.error("Score submission error:", error);

        document.getElementById("authMessage").textContent =
            "Could not save your score. Please try again.";
    }
}


// ==========================================
// PUBLIC LEADERBOARD
// ==========================================

async function showLeaderboard() {
    showScreen('leaderboardScreen');

    const leaderboardBody = document.getElementById('leaderboardBody');
    const podium = document.getElementById('podium');

    if (!leaderboardBody || !podium) {
        console.error("Leaderboard HTML elements not found.");
        return;
    }

    leaderboardBody.innerHTML =
        '<tr><td colspan="3" class="leaderboard-empty">Loading leaderboard...</td></tr>';

    podium.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/api/game/leaderboard`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load leaderboard");
        }

        const players = data.leaderboard || [];

        leaderboardBody.innerHTML = '';
        podium.innerHTML = '';

        if (players.length === 0) {
            leaderboardBody.innerHTML =
                '<tr><td colspan="3" class="leaderboard-empty">No scores yet. Be the first!</td></tr>';

            podium.innerHTML =
                '<p class="leaderboard-empty">No champions yet. Play a game to claim the podium!</p>';

            return;
        }

        // Create podium for the top three players
        const topThree = players.slice(0, 3);

        const rankClasses = ['first', 'second', 'third'];
        const medals = ['🏆', '🥈', '🥉'];

        topThree.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = `podium-card ${rankClasses[index]}`;

            const rank = document.createElement('span');
            rank.className = 'podium-rank';
            rank.textContent = `#${index + 1}`;

            const avatar = document.createElement('div');
            avatar.className = 'podium-avatar';
            avatar.textContent = medals[index];

            const name = document.createElement('h3');
            name.textContent = player.name;

            const points = document.createElement('p');
            points.textContent = `${Number(player.high_score) || 0} POINTS`;

            card.append(rank, avatar, name, points);
            podium.appendChild(card);
        });

        // Full leaderboard table
        players.forEach((player, index) => {
            const row = document.createElement('tr');

            const rankCell = document.createElement('td');
            rankCell.textContent = `#${index + 1}`;

            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;

            const scoreCell = document.createElement('td');
            scoreCell.textContent = Number(player.high_score) || 0;

            row.append(rankCell, nameCell, scoreCell);
            leaderboardBody.appendChild(row);
        });

    } catch (error) {
        console.error("Leaderboard error:", error);

        leaderboardBody.innerHTML =
            '<tr><td colspan="3" class="leaderboard-empty">Could not load leaderboard. Please try again.</td></tr>';

        podium.innerHTML =
            '<p class="leaderboard-empty">Could not load the podium.</p>';
    }
}


// ==========================================
// CHECK LOGIN ON PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    // Home screen is the default screen
    showScreen('homeScreen');

    // Hide logout button until a player is logged in
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.style.display = 'none';
    }

    // Restore existing login session
    if (token) {
        const loggedIn = await fetchProfile();

        if (loggedIn) {
            console.log("Existing login restored.");
        }
    } else {
        updatePlayerUI("Guest");
    }

    // Default authentication tab
    switchAuthMode('login');
});

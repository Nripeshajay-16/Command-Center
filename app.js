// ==================== COMMAND CENTER — APP LOGIC ====================
// Day 3: May 5, 2026 — Adding localStorage persistence

console.log('Command Center loaded 🚀');

// ==================== STATE MANAGEMENT ====================

// Default state structure
const defaultState = {
    currentDay: 1,
    currentWeek: 1,
    currentPhase: 1,
    habits: {
        'Gym': [false, false, false, false, false, false, false],
        'Code': [false, false, false, false, false, false, false],
        'Read': [false, false, false, false, false, false, false],
        'Chess': [false, false, false, false, false, false, false],
        'Valorant': [false, false, false, false, false, false, false],
        'Invest': [false, false, false, false, false, false, false],
        'Tuition': [false, false, false, false, false, false, false]
    },
    money: {
        tuition: 0,
        sip: 0,
        freelance: 0,
        pcGoal: 80000
    },
    focusMinutes: 0
};

// Load state from localStorage or use default
function loadState() {
    const saved = localStorage.getItem('commandCenterState');
    if (saved) {
        console.log('📂 Loaded saved state from localStorage');
        return JSON.parse(saved);
    }
    console.log('🆕 No saved state, using defaults');
    return defaultState;
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('commandCenterState', JSON.stringify(state));
    console.log('💾 State saved to localStorage');
}

// Initialize state
let state = loadState();

// ==================== HABIT TRACKER ====================

function renderHabits() {
    const habitGrid = document.getElementById('habit-grid');
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    let html = '';
    
    for (let habitName in state.habits) {
        html += `
            <div class="habit-row">
                <div class="habit-name">${habitName}</div>
                <div class="habit-days">
        `;
        
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const isDone = state.habits[habitName][dayIndex];
            const doneClass = isDone ? 'done' : '';
            
            html += `
                <div class="habit-cell ${doneClass}" 
                     onclick="toggleHabit('${habitName}', ${dayIndex})">
                    ${days[dayIndex]}
                </div>
            `;
        }
        
        html += `</div></div>`;
    }
    
    habitGrid.innerHTML = html;
}

function toggleHabit(habitName, dayIndex) {
    state.habits[habitName][dayIndex] = !state.habits[habitName][dayIndex];
    saveState(); // SAVE after every change
    renderHabits();
    updateStreak();
}

function updateStreak() {
    // Count consecutive days from the RIGHT (most recent)
    // A "streak day" = at least 3 habits done that day
    const minHabitsPerDay = 3; // Change this if you want stricter/looser
    let streak = 0;
    
    // Loop through days from right to left (newest to oldest)
    for (let dayIndex = 6; dayIndex >= 0; dayIndex--) {
        let habitsThisDay = 0;
        
        // Count how many habits were done on this day
        for (let habitName in state.habits) {
            if (state.habits[habitName][dayIndex]) {
                habitsThisDay++;
            }
        }
        
        // If this day meets the minimum, continue streak
        if (habitsThisDay >= minHabitsPerDay) {
            streak++;
        } else {
            // Streak broken, stop counting
            break;
        }
    }
    
    document.getElementById('streak-count').textContent = streak;
}

// ==================== NEXT DAY BUTTON ====================

function nextDay() {
    state.currentDay++;
    
    // Calculate week number (every 7 days = new week)
    state.currentWeek = Math.ceil(state.currentDay / 7);
    
    document.getElementById('day-count').textContent = state.currentDay;
    document.getElementById('week-number').textContent = state.currentWeek;
    
    // Shift habits (remove oldest day, add new empty day)
    for (let habitName in state.habits) {
        state.habits[habitName].shift();
        state.habits[habitName].push(false);
    }
    
    saveState();
    renderHabits();
    updateStreak();
    
    console.log(`📅 Advanced to Day ${state.currentDay}, Week ${state.currentWeek}`);
}

// ==================== MONEY BOARD ====================

function renderMoney() {
    document.getElementById('tuition-amount').textContent = state.money.tuition;
    document.getElementById('sip-amount').textContent = state.money.sip;
    document.getElementById('freelance-amount').textContent = state.money.freelance;
    
    const total = state.money.tuition + state.money.sip + state.money.freelance;
    document.getElementById('total-saved').textContent = total;
    
    // Update progress bar
    const percentage = Math.min((total / state.money.pcGoal) * 100, 100);
    document.getElementById('pc-progress').style.width = percentage + '%';
}

function addIncome(type) {
    const amount = prompt(`How much ₹ to add to ${type}?`);
    if (amount && !isNaN(amount)) {
        state.money[type] += parseInt(amount);
        saveState();
        renderMoney();
        console.log(`💰 Added ₹${amount} to ${type}`);
    }
}

// ==================== POMODORO TIMER ====================

let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            stopTimer();
            alert('🎉 Pomodoro complete! Take a 5 min break.');
            // Log the session
            state.focusMinutes += 25;
            document.getElementById('today-focus').textContent = state.focusMinutes;
            saveState();
            resetTimer();
        }
    }, 1000);
    
    console.log('⏱️ Timer started');
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        console.log('⏸️ Timer paused');
    }
}

function stopTimer() {
    pauseTimer();
}

function resetTimer() {
    stopTimer();
    timeLeft = 25 * 60;
    updateTimerDisplay();
    console.log('🔄 Timer reset');
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Command Center...');
    
    // Render everything
    document.getElementById('day-count').textContent = state.currentDay;
    document.getElementById('week-number').textContent = state.currentWeek;
    renderHabits();
    updateStreak();
    renderMoney();
    updateTimerDisplay();
    document.getElementById('today-focus').textContent = state.focusMinutes;
    
    // Wire up buttons
    document.getElementById('next-day-btn').addEventListener('click', nextDay);
    document.getElementById('start-btn').addEventListener('click', startTimer);
    document.getElementById('pause-btn').addEventListener('click', pauseTimer);
    document.getElementById('reset-btn').addEventListener('click', resetTimer);
    
    console.log('✅ Command Center ready!');
    console.log('Current state:', state);
});

// Make functions available globally for onclick handlers in HTML
window.toggleHabit = toggleHabit;
window.addIncome = addIncome;
// ==================== COMMAND CENTER — APP LOGIC ====================
// Day 1 Restart: May 5, 2026
// Session 4: Fixed streak bug + added monthly history view

console.log('Command Center loaded 🚀');

// ==================== STATE MANAGEMENT ====================

const defaultState = {
    currentDay: 1,
    currentWeek: 1,
    currentPhase: 1,
    // NEW: habits now stored as { habitName: { "YYYY-MM-DD": true/false } }
    // This lets us look at ANY past day, not just the rolling 7
    habitHistory: {
        'Gym': {},
        'Code': {},
        'Read': {},
        'Chess': {},
        'Valorant': {},
        'Invest': {},
        'Tuition': {}
    },
    money: {
        tuition: 0,
        sip: 0,
        freelance: 0,
        pcGoal: 80000
    },
    focusMinutes: 0,
    startDate: new Date().toISOString().split('T')[0] // "2026-05-05"
};

function loadState() {
    const saved = localStorage.getItem('commandCenterState_v2'); // v2 = new schema
    if (saved) {
        console.log('📂 Loaded saved state');
        return JSON.parse(saved);
    }
    console.log('🆕 No saved state, using defaults');
    return defaultState;
}

function saveState() {
    localStorage.setItem('commandCenterState_v2', JSON.stringify(state));
    console.log('💾 State saved');
}

let state = loadState();

// ==================== DATE HELPERS ====================

// Returns "2026-05-05" for today
function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// Returns "2026-05-04" for yesterday, etc.
function getDateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

// Returns array of last N date strings, oldest first
// e.g. getLast7Days() = ["2026-04-29", "2026-04-30", ..., "2026-05-05"]
function getLastNDays(n) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
        dates.push(getDateStr(i));
    }
    return dates;
}

// Format "2026-05-05" → "May 5"
function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00'); // force local time
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Get day letter S/M/T/W/T/F/S from date string
function getDayLetter(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
}

// ==================== HABIT TRACKER (THIS WEEK VIEW) ====================

function renderHabits() {
    const habitGrid = document.getElementById('habit-grid');
    const last7 = getLastNDays(7);
    
    let html = '';
    
    for (let habitName in state.habitHistory) {
        html += `
            <div class="habit-row">
                <div class="habit-name">${habitName}</div>
                <div class="habit-days">
        `;
        
        for (let i = 0; i < 7; i++) {
            const dateStr = last7[i];
            const isDone = state.habitHistory[habitName][dateStr] === true;
            const isToday = dateStr === getTodayStr();
            const doneClass = isDone ? 'done' : '';
            const todayClass = isToday ? 'today' : '';
            
            html += `
                <div class="habit-cell ${doneClass} ${todayClass}" 
                     onclick="toggleHabit('${habitName}', '${dateStr}')"
                     title="${formatDateShort(dateStr)}">
                    ${getDayLetter(dateStr)}
                </div>
            `;
        }
        
        html += `</div></div>`;
    }
    
    habitGrid.innerHTML = html;
}

function toggleHabit(habitName, dateStr) {
    // Toggle the boolean for that specific date
    const current = state.habitHistory[habitName][dateStr] === true;
    state.habitHistory[habitName][dateStr] = !current;
    saveState();
    renderHabits();
    updateStreak();
}

// ==================== STREAK — FIXED ====================
// OLD BUG: it was looping from index 6 down to 0 of a 7-item array
// and checking >= 3, but a day with 0 habits done would break the streak
// if ALL 7 days had 3+ habits it'd show 7, which is wrong if today has fewer.
//
// NEW LOGIC: loop backwards from TODAY using real dates.
// A "streak day" = at least 3 habits done that day.
// We stop the moment we hit a day where fewer than 3 habits were done.

function updateStreak() {
    const minHabitsPerDay = 3;
    let streak = 0;
    
    // Go backwards from today: today, yesterday, day before, ...
    // Stop after 90 days to avoid infinite loops
    for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
        const dateStr = getDateStr(daysAgo);
        let habitsThisDay = 0;
        
        for (let habitName in state.habitHistory) {
            if (state.habitHistory[habitName][dateStr] === true) {
                habitsThisDay++;
            }
        }
        
        if (habitsThisDay >= minHabitsPerDay) {
            streak++;
        } else {
            break; // Streak broken, stop counting
        }
    }
    
    document.getElementById('streak-count').textContent = streak;
}

// ==================== MONTHLY HISTORY VIEW ====================

let historyViewOpen = false;

function renderMonthHistory() {
    const container = document.getElementById('month-history');
    const today = getTodayStr();
    
    // Get last 30 days
    const last30 = getLastNDays(30);
    
    let html = `<div class="month-grid">`;
    
    // Header row: habit names
    html += `<div class="month-header-cell"></div>`;
    for (let habitName in state.habitHistory) {
        html += `<div class="month-header-cell">${habitName.substring(0,3)}</div>`;
    }
    
    // One row per day
    for (let i = 0; i < last30.length; i++) {
        const dateStr = last30[i];
        const isToday = dateStr === today;
        
        html += `<div class="month-date-cell ${isToday ? 'today-label' : ''}">${formatDateShort(dateStr)}</div>`;
        
        for (let habitName in state.habitHistory) {
            const isDone = state.habitHistory[habitName][dateStr] === true;
            html += `<div class="month-cell ${isDone ? 'done' : ''}" 
                         onclick="toggleHabit('${habitName}', '${dateStr}')"
                         title="${habitName} on ${formatDateShort(dateStr)}">
                     </div>`;
        }
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

function toggleHistoryView() {
    historyViewOpen = !historyViewOpen;
    const panel = document.getElementById('history-panel');
    const btn = document.getElementById('history-btn');
    
    if (historyViewOpen) {
        panel.style.display = 'block';
        btn.textContent = '📅 Hide History';
        renderMonthHistory();
    } else {
        panel.style.display = 'none';
        btn.textContent = '📅 View Month';
    }
}

// ==================== NEXT DAY BUTTON ====================

function nextDay() {
    state.currentDay++;
    state.currentWeek = Math.ceil(state.currentDay / 7);
    
    document.getElementById('day-count').textContent = state.currentDay;
    document.getElementById('week-number').textContent = state.currentWeek;
    
    saveState();
    renderHabits(); // Will auto-show new day since we use real dates now
    updateStreak();
    
    console.log(`📅 Advanced to Day ${state.currentDay}, Week ${state.currentWeek}`);
}

// ==================== MONEY BOARD ====================

function renderMoney() {
    document.getElementById('tuition-amount').textContent = state.money.tuition.toLocaleString('en-IN');
    document.getElementById('sip-amount').textContent = state.money.sip.toLocaleString('en-IN');
    document.getElementById('freelance-amount').textContent = state.money.freelance.toLocaleString('en-IN');
    
    const total = state.money.tuition + state.money.sip + state.money.freelance;
    document.getElementById('total-saved').textContent = total.toLocaleString('en-IN');
    
    const percentage = Math.min((total / state.money.pcGoal) * 100, 100);
    document.getElementById('pc-progress').style.width = percentage + '%';
    document.getElementById('pc-percent').textContent = Math.round(percentage) + '%';
}

function addIncome(type) {
    const amount = prompt(`How much ₹ to add to ${type}?`);
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        state.money[type] += parseInt(amount);
        saveState();
        renderMoney();
        console.log(`💰 Added ₹${amount} to ${type}`);
    }
}

// ==================== POMODORO TIMER ====================

let timerInterval = null;
let timeLeft = 25 * 60;
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
    }
}

function stopTimer() { pauseTimer(); }

function resetTimer() {
    stopTimer();
    timeLeft = 25 * 60;
    updateTimerDisplay();
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initializing Command Center...');

    document.getElementById('day-count').textContent = state.currentDay;
    document.getElementById('week-number').textContent = state.currentWeek;
    renderHabits();
    updateStreak();
    renderMoney();
    updateTimerDisplay();
    document.getElementById('today-focus').textContent = state.focusMinutes;

    document.getElementById('next-day-btn').addEventListener('click', nextDay);
    document.getElementById('start-btn').addEventListener('click', startTimer);
    document.getElementById('pause-btn').addEventListener('click', pauseTimer);
    document.getElementById('reset-btn').addEventListener('click', resetTimer);
    document.getElementById('history-btn').addEventListener('click', toggleHistoryView);

    console.log('✅ Command Center ready!');
});

// Global for inline onclick handlers
window.toggleHabit = toggleHabit;
window.addIncome = addIncome;
window.toggleHistoryView = toggleHistoryView;

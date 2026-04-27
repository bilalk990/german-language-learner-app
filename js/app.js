document.addEventListener('DOMContentLoaded', () => {
    appNavigate('dashboard-view');
    setupEventListeners();
});

// App State
const AppState = {
    currentQueue: [], // Session array
    initialCount: 0,
    reviewedCount: 0,
    correctCount: 0,
    wrongCount: 0,
    isFlipped: false
};

// Global navigate function
window.appNavigate = function (viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    if (viewId === 'dashboard-view') updateDashboard();
    if (viewId === 'manage-words-view') updateManageList();
};

function setupEventListeners() {
    // Navigations
    document.getElementById('btn-nav-add').addEventListener('click', () => appNavigate('add-word-view'));
    document.getElementById('btn-nav-bulk').addEventListener('click', () => appNavigate('bulk-add-view'));
    document.getElementById('btn-nav-manage').addEventListener('click', () => appNavigate('manage-words-view'));

    // Forms
    document.getElementById('add-word-form').addEventListener('submit', handleAddWord);

    // Sessions
    document.getElementById('btn-start-session').addEventListener('click', () => startSession(false));
    document.getElementById('btn-study-weak').addEventListener('click', () => startSession(true));
    document.getElementById('btn-end-session').addEventListener('click', () => {
        if (confirm('Are you sure you want to exit the session early?')) {
            appNavigate('dashboard-view');
        }
    });

    // Flashcard Interactions
    const fc = document.getElementById('flashcard');
    fc.addEventListener('click', (e) => {
        // Prevent flip if clicking actions
        if (e.target.closest('.btn-action')) return;
        flipCard();
    });

    document.getElementById('btn-mark-correct').addEventListener('click', (e) => {
        e.stopPropagation();
        processAnswer(true);
    });

    document.getElementById('btn-mark-wrong').addEventListener('click', (e) => {
        e.stopPropagation();
        processAnswer(false);
    });

    // Swipe Listeners
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    fc.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    fc.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 60; // min px to be considered a swipe
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Ensure horizontal wipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
            if (!AppState.isFlipped) return; // Cannot evaluate before flipping

            if (diffX > 0) {
                // Swiped Right -> Correct
                processAnswer(true);
            } else {
                // Swiped Left -> Wrong
                processAnswer(false);
            }
        }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        const activeView = document.querySelector('.view.active').id;
        if (activeView !== 'session-view') return;

        if (e.code === 'Space') {
            e.preventDefault();
            flipCard();
        } else if (e.key === '1') {
            processAnswer(false); // Wrong
        } else if (e.key === '2') {
            processAnswer(true); // Correct
        }
    });

    // Import Trigger
    document.getElementById('import-input').addEventListener('change', handleImport);
}

function updateDashboard() {
    const words = window.Store.getWords();
    const stats = window.Store.getStats();
    const today = window.Logic.getStartOfToday();

    let dueCount = 0;
    let weakCount = 0;

    words.forEach(w => {
        if (w.state === window.Logic.STATES.WEAK) weakCount++;
        if (w.nextReviewDate <= today || !w.nextReviewDate) dueCount++;
    });

    document.getElementById('stat-due').textContent = dueCount;
    document.getElementById('stat-weak').textContent = weakCount;

    document.getElementById('stat-streak').textContent = stats.streak;
    const accuracy = stats.totalReviews > 0 ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;
    document.getElementById('stat-accuracy').textContent = accuracy + '%';

    // Nemesis Words (Top 10 Hardest)
    const nemesisList = document.getElementById('nemesis-list');
    const nemesisContainer = document.getElementById('nemesis-container');
    const hardWords = words
        .filter(w => w.errorCount > 1)
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 10);

    if (hardWords.length > 0) {
        nemesisContainer.classList.remove('hidden');
        nemesisList.innerHTML = hardWords.map(w => `
            <div class="nemesis-item">
                <div class="nemesis-germ">${w.german}</div>
                <div class="nemesis-err">${w.errorCount} mistakes</div>
            </div>
        `).join('');
    } else {
        nemesisContainer.classList.add('hidden');
    }
}

function handleAddWord(e) {
    e.preventDefault();
    const german = document.getElementById('add-german').value;
    const meaning = document.getElementById('add-meaning').value;
    const example = document.getElementById('add-example').value;

    const success = window.Store.addWord(german, meaning, example);

    if (!success) {
        alert(`The word "${german}" is already in your list!`);
        return;
    }

    document.getElementById('add-word-form').reset();

    const msg = document.getElementById('add-success-msg');
    msg.textContent = 'Word added successfully!';
    msg.classList.remove('hidden');
    setTimeout(() => {
        msg.classList.add('hidden');
    }, 2000);
}

function updateManageList() {
    const list = document.getElementById('word-list');
    const query = document.getElementById('manage-search').value.toLowerCase().trim();

    let words = window.Store.getWords().reverse(); // newest first

    if (query) {
        words = words.filter(w =>
            w.german.toLowerCase().includes(query) ||
            w.meaning.toLowerCase().includes(query)
        );
    }

    document.getElementById('manage-total-count').textContent = words.length;

    if (words.length === 0) {
        list.innerHTML = `<p class="text-center text-muted mt-6">${query ? 'No matches found.' : 'No words added yet.'}</p>`;
        return;
    }

    list.innerHTML = words.map(w => `
        <div class="word-item">
            <div class="word-meta">
                <div class="word-row" style="justify-content: flex-start; gap: 8px;">
                    <h3>${w.german}</h3>
                    <button class="btn-voice" style="width: 28px; height: 28px; font-size: 14px;" onclick="window.speakText('${w.german.replace(/'/g, "\\'")}'); event.stopPropagation();">🔊</button>
                </div>
                <p>${w.meaning}</p>
                <div style="margin-top: 6px;">
                    <span class="status-badge status-${w.state.toLowerCase()}">${w.state}</span>
                    <span style="margin-left:8px; font-size:12px; color:var(--text-secondary);">Errors: ${w.errorCount}</span>
                </div>
            </div>
            <div class="word-controls flex-column" style="gap: 8px;">
                <select onchange="window.handleManualAction('${w.id}', this.value); this.value='';" style="background: var(--bg-surface-elevated); color: white; padding: 6px; border-radius: 4px; border: 1px solid var(--bg-surface-elevated); outline: none;">
                    <option value="">Actions...</option>
                    <option value="edit">✏️ Edit Text</option>
                    <option value="markEasy">🌟 Mark Easy</option>
                    <option value="markHard">⚠️ Mark Hard</option>
                    <option value="forceWeak">🔥 Force Weak</option>
                    <option value="reset">🔄 Reset</option>
                    <option value="delete">🗑️ Delete</option>
                </select>
            </div>
        </div>
    `).join('');
}

window.handleManualAction = function (id, action) {
    if (!action) return;
    if (action === 'delete') {
        if (confirm('Are you sure you want to delete this word forever?')) {
            window.Store.deleteWord(id);
        }
    } else if (action === 'edit') {
        const words = window.Store.getWords();
        const word = words.find(w => w.id === id);
        if (word) {
            const newGerman = prompt("Edit German Word:", word.german);
            if (newGerman === null) return;
            const newMeaning = prompt("Edit Meaning (Urdu/English):", word.meaning);
            if (newMeaning === null) return;
            const newExample = prompt("Edit Example Sentence:", word.example || "");
            if (newExample === null) return;

            word.german = newGerman.trim() || word.german;
            word.meaning = newMeaning.trim() || word.meaning;
            word.example = newExample.trim();
            window.Store.updateWord(word);
        }
    } else if (action === 'markEasy') {
        window.Store.markEasy(id);
    } else if (action === 'markHard') {
        window.Store.markHard(id);
    } else if (action === 'forceWeak') {
        window.Store.forceWeak(id);
    } else if (action === 'reset') {
        window.Store.resetWord(id);
    }
    updateManageList();
};

function startSession(weakOnly) {
    const words = window.Store.getWords();
    AppState.currentQueue = window.Logic.buildSessionQueue(words, weakOnly, 25);

    if (AppState.currentQueue.length === 0) {
        alert(weakOnly ? "You have no weak words to study right now!" : "You have no words due for review today!");
        return;
    }

    // Unique session cards initially
    AppState.initialCount = AppState.currentQueue.length;
    AppState.reviewedCount = 0;
    AppState.correctCount = 0;
    AppState.wrongCount = 0;

    appNavigate('session-view');
    loadNextCard();
}

function updateSessionUI() {
    const totalCount = document.getElementById('session-count');
    totalCount.textContent = `${AppState.reviewedCount} / ${AppState.initialCount} completed`;

    const progress = Math.min((AppState.reviewedCount / AppState.initialCount) * 100, 100);
    document.getElementById('session-progress').style.width = `${progress}%`;
}

function loadNextCard() {
    if (AppState.currentQueue.length === 0) {
        endSession();
        return;
    }

    updateSessionUI();
    const currentWord = AppState.currentQueue[0];

    document.getElementById('card-german').textContent = currentWord.german;
    document.getElementById('card-meaning-display').textContent = currentWord.meaning;

    const exElem = document.getElementById('card-example-display');
    if (currentWord.example && currentWord.example.trim() !== '') {
        exElem.textContent = `"${currentWord.example}"`;
        exElem.classList.remove('hidden');
    } else {
        exElem.textContent = '';
        exElem.classList.add('hidden');
    }

    // Reset state and class
    const fc = document.getElementById('flashcard');
    fc.classList.remove('flipped', 'swipe-left', 'swipe-right');
    AppState.isFlipped = false;
}

function flipCard() {
    if (AppState.isFlipped) return;
    document.getElementById('flashcard').classList.add('flipped');
    AppState.isFlipped = true;
}

function processAnswer(isCorrect) {
    if (!AppState.isFlipped) return;
    if (AppState.currentQueue.length === 0) return;

    window.Store.recordReview(isCorrect);
    playFeedback(isCorrect);

    let currentWord = AppState.currentQueue.shift(); // Dequeue

    // Pass logic evaluating and saving state
    currentWord = window.Logic.evaluateAnswer(currentWord, isCorrect);
    window.Store.updateWord(currentWord);

    if (isCorrect) {
        AppState.correctCount++;
        // It's removed from queue effectively!
        AppState.reviewedCount++;
        animateCardOut('swipe-right');
    } else {
        AppState.wrongCount++;
        // Put back in queue after 5 items or at the end
        const insertPos = Math.min(AppState.currentQueue.length, 5);
        AppState.currentQueue.splice(insertPos, 0, currentWord);

        animateCardOut('swipe-left');
    }
}

function animateCardOut(swipeClass) {
    const fc = document.getElementById('flashcard');
    fc.classList.add(swipeClass);

    const isLeft = swipeClass === 'swipe-left';
    const hint = document.getElementById(isLeft ? 'hint-left' : 'hint-right');

    hint.classList.remove('hidden');
    hint.style.opacity = '1';

    setTimeout(() => {
        hint.style.opacity = '0';
        hint.classList.add('hidden');
        loadNextCard();
    }, 150); // Massive speedup per explicit user requirements
}

function endSession() {
    // Force final 100%
    document.getElementById('session-count').textContent = `${AppState.initialCount} / ${AppState.initialCount} completed`;
    document.getElementById('session-progress').style.width = `100%`;

    setTimeout(() => {
        document.getElementById('summary-total').textContent = AppState.initialCount;
        document.getElementById('summary-correct').textContent = AppState.correctCount;
        document.getElementById('summary-wrong').textContent = AppState.wrongCount;

        appNavigate('summary-view');
    }, 300);
}

// --- Pro Features ---

window.speakWord = function () {
    if (AppState.currentQueue.length === 0) return;
    window.speakText(AppState.currentQueue[0].german);
};

window.speakText = function (text) {
    try {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current speech
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'de-DE';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
    } catch (e) {
        console.error("Speech playback failed", e);
    }
};

window.exportData = function () {
    const data = {
        words: window.Store.getWords(),
        stats: window.Store.getStats(),
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.triggerImport = function () {
    document.getElementById('import-input').click();
};

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.words && Array.isArray(data.words)) {
                if (confirm(`Import ${data.words.length} words? This will override your current collection.`)) {
                    window.Store.saveWords(data.words);
                    if (data.stats) window.Store.saveStats(data.stats);
                    updateDashboard();
                    alert("Data imported successfully!");
                }
            } else {
                alert("Invalid backup format.");
            }
        } catch (err) {
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

window.handleBulkAdd = function () {
    const input = document.getElementById('bulk-input').value.trim();
    if (!input) return;

    const lines = input.split('\n');
    let added = 0;
    let skipped = 0;

    lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 2) {
            const success = window.Store.addWord(parts[0], parts[1], parts[2] || '');
            if (success) added++; else skipped++;
        }
    });

    if (added > 0 || skipped > 0) {
        document.getElementById('bulk-input').value = '';
        const msg = document.getElementById('bulk-success-msg');
        msg.textContent = `Imported: ${added} words. Skipped: ${skipped} duplicates.`;
        msg.classList.remove('hidden');
        setTimeout(() => {
            msg.classList.add('hidden');
            appNavigate('dashboard-view');
        }, 2000);
    } else {
        alert("No valid lines found. Format: German | Meaning");
    }
};

function playFeedback(isCorrect) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (isCorrect) {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.1);
    } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
    }

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}


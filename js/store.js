window.Store = (function () {
    const DB_KEY = 'german_vocab_db';
    const STATS_KEY = 'german_vocab_stats';

    function getWords() {
        return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    }

    function saveWords(words) {
        localStorage.setItem(DB_KEY, JSON.stringify(words));
    }

    function addWord(german, meaning, example) {
        const words = getWords();
        const germ = german.trim();

        // Audit: Prevent Duplicates
        const exists = words.some(w => w.german.toLowerCase() === germ.toLowerCase());
        if (exists) {
            console.warn(`Word "${germ}" already exists in your collection.`);
            return false;
        }

        const newWord = {
            id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
            german: germ,
            meaning: meaning.trim(),
            example: example ? example.trim() : '',
            state: window.Logic.STATES.NEW,
            lastReviewDate: null,
            nextReviewDate: null,
            errorCount: 0,
            createdAt: Date.now()
        };
        words.push(newWord);
        saveWords(words);
        return true;
    }

    function updateWord(updatedWord) {
        const words = getWords();
        const index = words.findIndex(w => w.id === updatedWord.id);
        if (index !== -1) {
            words[index] = updatedWord;
            saveWords(words);
        }
    }

    function deleteWord(id) {
        const words = getWords();
        saveWords(words.filter(w => w.id !== id));
    }

    function resetWord(id) {
        const words = getWords();
        const word = words.find(w => w.id === id);
        if (word) {
            word.state = window.Logic.STATES.NEW;
            word.nextReviewDate = null;
            word.lastReviewDate = null;
            word.errorCount = 0;
            saveWords(words);
        }
    }

    function forceWeak(id) {
        const words = getWords();
        const word = words.find(w => w.id === id);
        if (word) {
            word.state = window.Logic.STATES.WEAK;
            word.nextReviewDate = window.Logic.getStartOfToday();
            saveWords(words);
        }
    }

    function markEasy(id) {
        const words = getWords();
        const word = words.find(w => w.id === id);
        if (word) {
            word.state = window.Logic.STATES.MASTERED;
            const d = new Date(); d.setHours(0, 0, 0, 0);
            word.nextReviewDate = d.getTime() + (14 * 24 * 60 * 60 * 1000);
            saveWords(words);
        }
    }

    function markHard(id) {
        const words = getWords();
        const word = words.find(w => w.id === id);
        if (word) {
            word.state = window.Logic.STATES.WEAK;
            word.nextReviewDate = window.Logic.getStartOfToday();
            saveWords(words);
        }
    }

    function getStats() {
        return JSON.parse(localStorage.getItem(STATS_KEY) || '{"totalReviews": 0, "correctReviews": 0, "streak": 0, "lastActiveDate": null}');
    }

    function saveStats(stats) {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    function recordReview(isCorrect) {
        const stats = getStats();
        const todayStr = new Date().toDateString();

        if (stats.lastActiveDate !== todayStr) {
            // New day
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (stats.lastActiveDate === yesterday.toDateString()) {
                stats.streak += 1;
            } else if (stats.lastActiveDate) {
                stats.streak = 1; // broken streak
            } else {
                stats.streak = 1; // first day
            }
            stats.lastActiveDate = todayStr;
        }

        stats.totalReviews += 1;
        if (isCorrect) stats.correctReviews += 1;

        saveStats(stats);
    }

    return {
        getWords,
        saveWords,
        addWord,
        updateWord,
        deleteWord,
        resetWord,
        forceWeak,
        markEasy,
        markHard,
        getStats,
        recordReview
    };
})();

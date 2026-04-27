window.Logic = (function () {
    const STATES = {
        NEW: 'New',
        LEARNING: 'Learning',
        WEAK: 'Weak',
        STRONG: 'Strong',
        MASTERED: 'Mastered'
    };

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    function getStartOfToday() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    function evaluateAnswer(word, isCorrect) {
        const today = getStartOfToday();

        if (!isCorrect) {
            word.state = STATES.WEAK;
            word.errorCount = (word.errorCount || 0) + 1;
            word.lastReviewDate = today;
            word.nextReviewDate = today;
            return word;
        }

        // Correct answer logic
        word.lastReviewDate = today;

        switch (word.state) {
            case STATES.NEW:
            case STATES.WEAK:
                word.state = STATES.LEARNING;
                word.nextReviewDate = today + (1 * MS_PER_DAY);
                break;
            case STATES.LEARNING:
                word.state = STATES.STRONG;
                word.nextReviewDate = today + (3 * MS_PER_DAY);
                break;
            case STATES.STRONG:
                word.state = STATES.MASTERED;
                word.nextReviewDate = today + (10 * MS_PER_DAY); // Around 7-14 days
                break;
            case STATES.MASTERED:
                word.nextReviewDate = today + (14 * MS_PER_DAY);
                break;
        }

        return word;
    }

    function buildSessionQueue(words, weakOnly = false, maxNewPerDay = 25) {
        const today = getStartOfToday();

        // 1. Calculate how many NEW words have already been studied today
        const introducedTodayCount = words.filter(word =>
            word.lastReviewDate === today &&
            word.createdAt < today // Ensure it's not a word created and reviewed in same day (optional check)
            // But actually simpler check: 
            // if word was NEW but now its lastReviewDate is TODAY and its state is not NEW anymore
            && word.state !== STATES.NEW
        ).length;

        const remainingNewQuota = Math.max(0, maxNewPerDay - introducedTodayCount);

        let weakWords = [];
        let learningWords = [];
        let strongWords = [];
        let newWords = [];
        let currentNewCount = 0;

        words.forEach(word => {
            const isDue = word.nextReviewDate <= today || !word.nextReviewDate;

            if (weakOnly) {
                if (word.state === STATES.WEAK) {
                    weakWords.push(word);
                }
            } else if (isDue) {
                if (word.state === STATES.WEAK) {
                    weakWords.push(word);
                } else if (word.state === STATES.LEARNING) {
                    learningWords.push(word);
                } else if (word.state === STATES.STRONG || word.state === STATES.MASTERED) {
                    strongWords.push(word);
                } else if (word.state === STATES.NEW) {
                    if (currentNewCount < remainingNewQuota) {
                        currentNewCount++;
                        newWords.push(word);
                    }
                }
            }
        });

        if (weakOnly) {
            // Randomize weak words a bit for variety
            return weakWords.sort(() => Math.random() - 0.5);
        }

        // Combined queue: Weak -> Learning -> Strong -> New
        return [...weakWords, ...learningWords, ...strongWords, ...newWords];
    }

    return { STATES, evaluateAnswer, buildSessionQueue, getStartOfToday };
})();

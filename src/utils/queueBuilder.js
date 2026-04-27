import { STAGES } from './scheduler';

/**
 * Build session queue with proper prioritization and limits
 * Priority: Weak → Learning → Strong → New
 * Max 25 new words per day
 */
export const buildSessionQueue = (words, mode = 'normal', wordsAddedToday = 0) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let filtered = [];
  
  if (mode === 'weak') {
    // Weak only mode - show all weak words
    filtered = words.filter(w => w.isWeak || w.stage === STAGES.WEAK);
  } else {
    // Normal mode - show due words only
    const dueWords = words.filter(w => {
      if (!w.nextReview) return true; // No date set = due
      const nextReview = new Date(w.nextReview);
      return nextReview <= today;
    });
    
    // Calculate remaining new word quota
    // wordsAddedToday already tracks how many NEW words were added today
    // So we just need to limit NEW stage words to (25 - wordsAddedToday)
    const remainingNewQuota = Math.max(0, 25 - wordsAddedToday);
    
    // Separate by stage
    const weakWords = [];
    const learningWords = [];
    const strongWords = [];
    const masteredWords = [];
    const newWords = [];
    let newCount = 0;
    
    dueWords.forEach(word => {
      switch (word.stage) {
        case STAGES.WEAK:
          weakWords.push(word);
          break;
        case STAGES.LEARNING:
          learningWords.push(word);
          break;
        case STAGES.STRONG:
          strongWords.push(word);
          break;
        case STAGES.MASTERED:
          masteredWords.push(word);
          break;
        case STAGES.NEW:
          if (newCount < remainingNewQuota) {
            newWords.push(word);
            newCount++;
          }
          break;
        default:
          break;
      }
    });
    
    // Priority order: Weak → Learning → Strong → Mastered → New
    filtered = [
      ...weakWords.sort(() => Math.random() - 0.5),
      ...learningWords.sort(() => Math.random() - 0.5),
      ...strongWords.sort(() => Math.random() - 0.5),
      ...masteredWords.sort(() => Math.random() - 0.5),
      ...newWords.sort(() => Math.random() - 0.5),
    ];
  }
  
  return filtered;
};

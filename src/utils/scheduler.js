export const STAGES = {
  NEW: 'New',
  LEARNING: 'Learning',
  WEAK: 'Weak',
  STRONG: 'Strong',
  MASTERED: 'Mastered',
};

/**
 * Logic:
 * If Wrong: -> Weak, Review today
 * New -> Learning (+1 day)
 * Learning -> Strong (+3 days)
 * Strong -> Mastered (+7 to 14 days)
 * Mastered -> Mastered (Maintain +14 days)
 */
export const getNextReviewDate = (currentStage, isCorrect) => {
  const now = new Date();
  
  if (!isCorrect) {
    return {
      stage: STAGES.WEAK,
      // Set to now so it's immediately available for re-queue in same session
      nextDate: new Date().toISOString(),
    };
  }

  let nextDate = new Date();
  let nextStage = currentStage;

  switch (currentStage) {
    case STAGES.NEW:
    case STAGES.WEAK:
      nextStage = STAGES.LEARNING;
      nextDate.setDate(now.getDate() + 1);
      break;
    case STAGES.LEARNING:
      nextStage = STAGES.STRONG;
      nextDate.setDate(now.getDate() + 3);
      break;
    case STAGES.STRONG:
      nextStage = STAGES.MASTERED;
      nextDate.setDate(now.getDate() + 7);
      break;
    case STAGES.MASTERED:
      nextStage = STAGES.MASTERED;
      nextDate.setDate(now.getDate() + 14);
      break;
    default:
      nextStage = STAGES.LEARNING;
      nextDate.setDate(now.getDate() + 1);
  }

  // Normalize to 4 AM next review to ensure it shows up in "Today" accurately
  nextDate.setHours(4, 0, 0, 0);

  return {
    stage: nextStage,
    nextDate: nextDate.toISOString(),
  };
};

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextReviewDate, STAGES } from '../utils/scheduler';

export const useVocabularyStore = create()(
  persist(
    (set, get) => ({
      words: [],
      streak: 0,
      lastActiveDate: null,
      wordsAddedToday: 0,

      addWord: (word, meaning, example = '') => {
        const { words, wordsAddedToday, lastActiveDate } = get();
        const today = new Date().toDateString();
        
        // Reset daily count if new day
        const currentDailyCount = lastActiveDate === today ? wordsAddedToday : 0;

        if (currentDailyCount >= 25) {
          throw new Error('Daily limit of 25 new words reached.');
        }

        // Check for duplicate words
        const wordExists = words.some(
          w => w.word.toLowerCase() === word.trim().toLowerCase()
        );
        
        if (wordExists) {
          throw new Error(`"${word.trim()}" is already in your vocabulary list.`);
        }

        const newWord = {
          id: Date.now().toString(),
          word: word.trim(),
          meaning: meaning.trim(),
          example: example ? example.trim() : '',
          stage: STAGES.NEW,
          lastReviewed: null,
          nextReview: new Date().toISOString(), // Available immediately
          errorCount: 0,
          correctCount: 0,
          isWeak: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          words: [...state.words, newWord],
          wordsAddedToday: currentDailyCount + 1,
          lastActiveDate: today,
        }));
      },

      // Helper to get current wordsAddedToday (auto-resets if new day)
      getWordsAddedToday: () => {
        const { wordsAddedToday, lastActiveDate } = get();
        const today = new Date().toDateString();
        return lastActiveDate === today ? wordsAddedToday : 0;
      },

      updateReview: (wordId, isCorrect) => {
        set((state) => {
          const updatedWords = state.words.map((w) => {
            if (w.id === wordId) {
              const nextStageInfo = getNextReviewDate(w.stage, isCorrect);
              return {
                ...w,
                stage: nextStageInfo.stage,
                nextReview: nextStageInfo.nextDate,
                lastReviewed: new Date().toISOString(),
                errorCount: isCorrect ? w.errorCount : w.errorCount + 1,
                correctCount: isCorrect ? w.correctCount + 1 : w.correctCount,
                // Clear weak status when word progresses correctly
                isWeak: isCorrect ? false : true,
              };
            }
            return w;
          });

          // Update Streak logic
          const today = new Date().toDateString();
          let newStreak = state.streak;
          if (state.lastActiveDate !== today) {
            newStreak = (state.lastActiveDate === new Date(Date.now() - 86400000).toDateString()) 
              ? state.streak + 1 
              : 1;
          }

          return { 
            words: updatedWords, 
            streak: newStreak,
            lastActiveDate: today 
          };
        });
      },

      markAsWeak: (wordId) => {
        set((state) => ({
          words: state.words.map(w => w.id === wordId ? { ...w, isWeak: true, stage: STAGES.WEAK } : w)
        }));
      },

      promoteWord: (wordId) => {
        set((state) => ({
          words: state.words.map(w => {
            if (w.id === wordId) {
              const currentIdx = Object.values(STAGES).indexOf(w.stage);
              const stagesArr = Object.values(STAGES);
              const nextStage = currentIdx < stagesArr.length - 1 ? stagesArr[currentIdx + 1] : w.stage;
              return { ...w, stage: nextStage, isWeak: false };
            }
            return w;
          })
        }));
      },

      resetProgress: (wordId) => {
        set((state) => ({
          words: state.words.map(w => w.id === wordId ? { 
            ...w, 
            stage: STAGES.NEW, 
            errorCount: 0, 
            correctCount: 0,
            isWeak: false,
            nextReview: new Date().toISOString() 
          } : w)
        }));
      },

      deleteWord: (wordId) => {
        set((state) => ({
          words: state.words.filter(w => w.id !== wordId)
        }));
      },

      // Mark word as easy - promote to mastered
      markAsEasy: (wordId) => {
        set((state) => ({
          words: state.words.map(w => {
            if (w.id === wordId) {
              const nextDate = new Date();
              nextDate.setDate(nextDate.getDate() + 14);
              nextDate.setHours(4, 0, 0, 0);
              return { 
                ...w, 
                stage: STAGES.MASTERED,
                isWeak: false,
                nextReview: nextDate.toISOString()
              };
            }
            return w;
          })
        }));
      },

      // Mark word as hard - force to weak
      markAsHard: (wordId) => {
        set((state) => ({
          words: state.words.map(w => {
            if (w.id === wordId) {
              const today = new Date();
              return { 
                ...w, 
                stage: STAGES.WEAK,
                isWeak: true,
                nextReview: today.toISOString()
              };
            }
            return w;
          })
        }));
      }
    }),
    {
      name: 'vocabulary-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

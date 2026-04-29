import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useVocabularyStore } from '../store/vocabularyStore';
import Flashcard from '../components/Flashcard';
import { X, Check, RefreshCw, Home } from 'lucide-react-native';
import { buildSessionQueue } from '../utils/queueBuilder';

export default function ReviewScreen({ route, navigation }) {
  const { mode = 'normal' } = route.params || {};
  const words = useVocabularyStore(state => state.words);
  const updateReview = useVocabularyStore(state => state.updateReview);
  const wordsAddedToday = useVocabularyStore(state => state.wordsAddedToday);

  const [queue, setQueue] = useState([]);
  const [initialCount, setInitialCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Use the optimized queue builder
    const sessionQueue = buildSessionQueue(words, mode, wordsAddedToday);
    
    if (sessionQueue.length === 0) {
      setSessionFinished(true);
    }
    
    setQueue(sessionQueue);
    setInitialCount(sessionQueue.length);
  }, []);

  // Safety check - if queue is empty, show finished screen
  if (queue.length === 0 && !sessionFinished) {
    setSessionFinished(true);
  }

  const currentWord = queue[0];
  
  // Prevent crash if currentWord is undefined
  if (!currentWord && !sessionFinished) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Loading...</Text>
      </View>
    );
  }

  const handleResponse = (isCorrect) => {
    if (!currentWord) return; // Safety check
    
    updateReview(currentWord.id, isCorrect);
    
    setStats(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      wrong: !isCorrect ? prev.wrong + 1 : prev.wrong
    }));

    setQueue(prevQueue => {
      const remainingQueue = prevQueue.slice(1);
      
      if (!isCorrect) {
        if (remainingQueue.length > 0) {
          const reQueuePosition = Math.min(
            5 + Math.floor(Math.random() * 6), 
            remainingQueue.length
          );
          const newQueue = [...remainingQueue];
          newQueue.splice(reQueuePosition, 0, currentWord);
          return newQueue;
        } else {
          setReviewedCount(prev => prev + 1);
          setSessionFinished(true);
          setIsFlipped(false);
          return [];
        }
      }
      
      setReviewedCount(prev => prev + 1);
      setIsFlipped(false);
      
      if (remainingQueue.length === 0) {
        setSessionFinished(true);
      }
      return remainingQueue;
    });
  };

  if (queue.length === 0 && !sessionFinished) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No words to review!</Text>
        <Text style={styles.emptyDesc}>
          {mode === 'weak' ? "You have no weak words. Great job!" : "You're all caught up for today."}
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.actionBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessionFinished) {
    const totalAttempts = stats.correct + stats.wrong;
    const accuracy = totalAttempts > 0 
      ? Math.round((stats.correct / totalAttempts) * 100) 
      : 0;
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finishContent}>
          <Text style={styles.finishTitle}>Session Complete!</Text>
          
          <View style={styles.accuracyBadge}>
            <Text style={styles.accuracyValue}>{accuracy}%</Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.finishStatBox}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.finishStatBox}>
              <Text style={[styles.statValue, { color: '#f43f5e' }]}>{stats.wrong}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
          </View>
          
          <View style={styles.totalStudied}>
            <Text style={styles.totalStudiedText}>
              Unique Words: {initialCount}
            </Text>
            <Text style={styles.totalStudiedText}>
              Total Attempts: {totalAttempts}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#6366f1', marginTop: 40 }]} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Home size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          {reviewedCount} / {initialCount} completed
        </Text>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${initialCount > 0 ? (reviewedCount / initialCount) * 100 : 0}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Flashcard 
          word={currentWord} 
          onSwipeLeft={() => isFlipped && handleResponse(false)} 
          onSwipeRight={() => isFlipped && handleResponse(true)}
          onFlip={() => setIsFlipped(true)}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.roundBtn, 
            { backgroundColor: isFlipped ? '#f43f5e' : '#3f3f46' },
            !isFlipped && styles.disabledButton
          ]}
          disabled={!isFlipped}
          onPress={() => handleResponse(false)}
        >
          <X size={32} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roundBtn, 
            { backgroundColor: isFlipped ? '#10b981' : '#3f3f46' },
            !isFlipped && styles.disabledButton
          ]}
          disabled={!isFlipped}
          onPress={() => handleResponse(true)}
        >
          <Check size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  progressText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#18181b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 40,
    paddingTop: 20,
  },
  roundBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.3,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#71717a',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  actionBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  finishContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  finishTitle: {
    color: '#fafafa',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 40,
  },
  accuracyBadge: {
    backgroundColor: '#18181b',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    width: 120,
    height: 120,
    justifyContent: 'center',
  },
  accuracyValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#6366f1',
    marginBottom: 4,
  },
  accuracyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
  },
  totalStudied: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    width: '100%',
  },
  totalStudiedText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  finishStatBox: {
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 24,
    borderRadius: 24,
    width: '40%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '700',
  },
});

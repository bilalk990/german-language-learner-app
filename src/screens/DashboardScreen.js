import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useVocabularyStore } from '../store/vocabularyStore';
import { Plus, Play, Brain, List, Trophy, Zap } from 'lucide-react-native';

const StatBox = ({ title, value, icon: Icon, color }) => (
  <View style={styles.statBox}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const words = useVocabularyStore(state => state.words);
  const streak = useVocabularyStore(state => state.streak);
  const getWordsAddedToday = useVocabularyStore(state => state.getWordsAddedToday);
  
  // Get accurate daily count (auto-resets if new day)
  const wordsAddedToday = getWordsAddedToday();

  // Get today at midnight for proper date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reviewsToday = useMemo(() => {
    return words.filter(w => {
      if (!w.nextReview) return true; // No date = due
      const nextReview = new Date(w.nextReview);
      return nextReview <= today;
    }).length;
  }, [words, today]);

  const weakCount = useMemo(() => {
    return words.filter(w => w.isWeak).length;
  }, [words]);

  const masteredCount = words.filter(w => w.stage === 'Mastered').length;
  
  // Calculate overall accuracy
  const totalCorrect = words.reduce((sum, w) => sum + (w.correctCount || 0), 0);
  const totalErrors = words.reduce((sum, w) => sum + (w.errorCount || 0), 0);
  const totalReviews = totalCorrect + totalErrors;
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Guten Tag!</Text>
          <View style={styles.streakBadge}>
            <Zap size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.streakText}>{streak} Day Streak</Text>
          </View>
        </View>

        {/* Action Card */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>{reviewsToday}</Text>
            <Text style={styles.heroSubtitle}>Words to review today</Text>
          </View>
          <TouchableOpacity 
            style={[styles.playButton, reviewsToday === 0 && styles.disabledButton]}
            disabled={reviewsToday === 0}
            onPress={() => navigation.navigate('Review', { mode: 'normal' })}
          >
            <Play size={24} color="#000" fill="#000" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox title="Total Words" value={words.length} icon={List} color="#6366f1" />
          <StatBox title="Accuracy" value={`${accuracy}%`} icon={Trophy} color="#10b981" />
          <StatBox title="Weak Points" value={weakCount} icon={Brain} color="#f43f5e" />
          <StatBox title="Added Today" value={wordsAddedToday} icon={Plus} color="#8b5cf6" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Main Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => navigation.navigate('AddWord')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#4f46e5' }]}>
            <Plus size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Add New Word</Text>
            <Text style={styles.actionDesc}>Build your personal vocabulary</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => navigation.navigate('Review', { mode: 'weak' })}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#f43f5e' }]}>
            <Brain size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Study Weak Words Only</Text>
            <Text style={styles.actionDesc}>Focus on your struggle points</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => navigation.navigate('WordList')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#3f3f46' }]}>
            <List size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.actionTitle}>View All Vocabulary</Text>
            <Text style={styles.actionDesc}>Manage and reset progress</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fafafa',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  streakText: {
    color: '#fbbf24',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
  },
  actionDesc: {
    color: '#71717a',
    fontSize: 13,
    marginTop: 2,
  },
});

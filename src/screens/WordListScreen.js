import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useVocabularyStore } from '../store/vocabularyStore';
import { Search, Trash2, RotateCcw, Brain, ChevronUp, Star, AlertTriangle } from 'lucide-react-native';

const WordItem = ({ item, onReset, onMarkWeak, onDelete, onPromote, onMarkEasy, onMarkHard }) => {
  const getStageColor = (stage) => {
    switch (stage) {
      case 'Mastered': return '#10b981';
      case 'Strong': return '#3b82f6';
      case 'Learning': return '#fbbf24';
      case 'Weak': return '#f43f5e';
      default: return '#71717a';
    }
  };

  return (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordMain}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.itemMeaning}>{item.meaning}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStageColor(item.stage) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStageColor(item.stage) }]}>{item.stage}</Text>
        </View>
      </View>

      <View style={styles.wordFooter}>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Errors: {item.errorCount}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.statText}>
            Review: {item.nextReview ? new Date(item.nextReview).toLocaleDateString() : 'Today'}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onPromote(item.id)}>
            <ChevronUp size={18} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onMarkEasy(item.id)}>
            <Star size={18} color="#fbbf24" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onMarkHard(item.id)}>
            <AlertTriangle size={18} color="#f43f5e" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onMarkWeak(item.id)}>
            <Brain size={18} color={item.isWeak ? '#f43f5e' : '#71717a'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onReset(item.id)}>
            <RotateCcw size={18} color="#71717a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(item.id)}>
            <Trash2 size={18} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function WordListScreen() {
  const words = useVocabularyStore(state => state.words);
  const resetProgress = useVocabularyStore(state => state.resetProgress);
  const markAsWeak = useVocabularyStore(state => state.markAsWeak);
  const deleteWord = useVocabularyStore(state => state.deleteWord);
  const promoteWord = useVocabularyStore(state => state.promoteWord);
  const markAsEasy = useVocabularyStore(state => state.markAsEasy);
  const markAsHard = useVocabularyStore(state => state.markAsHard);

  const [search, setSearch] = useState('');

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(search.toLowerCase()) || 
    w.meaning.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleReset = (id) => {
    Alert.alert('Reset Progress', 'Start learning this word from scratch?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => resetProgress(id), style: 'destructive' }
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Word', 'Are you sure you want to remove this word from your list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteWord(id), style: 'destructive' }
    ]);
  };

  const handleMarkEasy = (id) => {
    Alert.alert('Mark as Easy', 'This word will be marked as mastered and reviewed in 14 days.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Easy', onPress: () => markAsEasy(id) }
    ]);
  };

  const handleMarkHard = (id) => {
    Alert.alert('Mark as Hard', 'This word will be marked as weak and reviewed today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Hard', onPress: () => markAsHard(id), style: 'destructive' }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={20} color="#71717a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your words..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredWords}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WordItem 
            item={item} 
            onReset={handleReset} 
            onMarkWeak={markAsWeak}
            onDelete={handleDelete}
            onPromote={promoteWord}
            onMarkEasy={handleMarkEasy}
            onMarkHard={handleMarkHard}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No words found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    margin: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fafafa',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  wordCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wordMain: {
    flex: 1,
  },
  wordText: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemMeaning: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    color: '#3f3f46',
    marginHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 16,
    padding: 4,
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 16,
    fontWeight: '600',
  },
});

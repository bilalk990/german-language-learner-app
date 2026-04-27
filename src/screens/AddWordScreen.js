import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { useVocabularyStore } from '../store/vocabularyStore';
import { Save, AlertCircle } from 'lucide-react-native';

export default function AddWordScreen({ navigation }) {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  
  const addWord = useVocabularyStore(state => state.addWord);
  const getWordsAddedToday = useVocabularyStore(state => state.getWordsAddedToday);
  
  // Get accurate daily count (auto-resets if new day)
  const wordsAddedToday = getWordsAddedToday();

  const handleSave = () => {
    if (!word.trim() || !meaning.trim()) {
      Alert.alert('Missing Info', 'Please provide both the German word and its meaning.');
      return;
    }

    try {
      addWord(word.trim(), meaning.trim(), example.trim());
      Alert.alert('Success', 'Word added successfully!', [
        { text: 'Add More', onPress: () => {
          setWord('');
          setMeaning('');
          setExample('');
        }},
        { text: 'Go to Dashboard', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Limit Reached', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Daily Progress Indicator */}
        <View style={styles.limitInfo}>
          <Text style={styles.limitText}>Today's Limit: {wordsAddedToday} / 25</Text>
          <View style={styles.limitBarBg}>
            <View style={[styles.limitBarFill, { width: `${(wordsAddedToday / 25) * 100}%` }]} />
          </View>
          {wordsAddedToday >= 20 && (
            <View style={styles.warningBox}>
              <AlertCircle size={16} color="#fbbf24" />
              <Text style={styles.warningText}>You're almost at the daily learning limit.</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>German Word</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Gemütlichkeit"
            placeholderTextColor="#3f3f46"
            value={word}
            onChangeText={setWord}
            autoFocus
          />

          <Text style={styles.label}>Meaning (Urdu/English)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coziness / آرام دہ"
            placeholderTextColor="#3f3f46"
            value={meaning}
            onChangeText={setMeaning}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Example Sentence (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Das Zimmer hat viel Gemütlichkeit."
            placeholderTextColor="#3f3f46"
            value={example}
            onChangeText={setExample}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Save size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save Word</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.philosophy}>
          Remember: Quality over quantity. Manually adding words helps you process them better.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    padding: 24,
  },
  limitInfo: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  limitText: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  limitBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#09090b',
    borderRadius: 3,
  },
  limitBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 18,
    color: '#fafafa',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  philosophy: {
    color: '#3f3f46',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

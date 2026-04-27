import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

export default function Flashcard({ word, onSwipeLeft, onSwipeRight, onFlip }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const translateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  // Reset card state when word changes - optimized for speed
  useEffect(() => {
    setIsFlipped(false);
    rotateY.value = 0;
    translateX.value = 0;
  }, [word]);

  const flipCard = () => {
    rotateY.value = withTiming(isFlipped ? 0 : 180, { duration: 150 });
    setIsFlipped(!isFlipped);
    
    // Notify parent when card is flipped to show answer
    if (!isFlipped && onFlip) {
      onFlip();
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.velocityX) > 400 || Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const exitX = direction === 'right' ? width : -width;
        translateX.value = withTiming(exitX, { duration: 200 }, () => {
          runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)();
        });
      } else {
        translateX.value = withTiming(0, { duration: 150 });
      }
    });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [0, 180]);
    return {
      transform: [
        { translateX: translateX.value },
        { rotateY: `${rotate}deg` }
      ],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [180, 360]);
    return {
      transform: [
        { translateX: translateX.value },
        { rotateY: `${rotate}deg` }
      ],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      width: '100%',
      height: '100%',
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const opacityRight = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.4]);
    const opacityLeft = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.4, 0]);
    return {
      backgroundColor: translateX.value > 0 ? '#10b981' : '#f43f5e',
      opacity: Math.max(opacityRight, opacityLeft),
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <TouchableOpacity activeOpacity={1} onPress={flipCard} style={styles.cardWrapper}>
          
          <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
            <View style={styles.content}>
              <Text style={styles.label}>German</Text>
              <Text style={styles.wordText}>{word.word}</Text>
              <Text style={styles.hint}>Tap to Flip</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
            <View style={styles.content}>
              <Text style={styles.label}>Meaning</Text>
              <Text style={styles.meaningText}>{word.meaning}</Text>
              {word.example ? (
                <View style={styles.exampleContainer}>
                  <Text style={styles.label}>Example</Text>
                  <Text style={styles.exampleText}>{word.example}</Text>
                </View>
              ) : null}
              <Text style={styles.hintSwipe}>Swipe Right for Correct | Left for Wrong</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
          
        </TouchableOpacity>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#18181b',
    borderRadius: 32,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: '#18181b',
  },
  backCard: {
    backgroundColor: '#18181b',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  wordText: {
    color: '#fafafa',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
  },
  meaningText: {
    color: '#6366f1',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  exampleContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#09090b',
    borderRadius: 16,
    width: '100%',
  },
  exampleText: {
    color: '#d4d4d8',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  hint: {
    color: '#3f3f46',
    fontSize: 14,
    marginTop: 60,
    fontWeight: '600',
  },
  hintSwipe: {
    color: '#3f3f46',
    fontSize: 12,
    marginTop: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
});

// eslint-disable-next-line import/namespace
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';

export default function RoundResultScreen() {
  const router = useRouter();

  // Animation States
  const [step, setStep] = useState(0); // 0: Init, 1: Criteria, 2: Winner, 3: Comment, 4: Done
  const opacityAnim = useRef(new Animated.Value(0)).current; // For Comment Card
  const hasRun = useRef(false); // Ref to prevent double execution

  // Mock Data
  const criteria = "The Weakest";
  const winnerName = "Alice";
  const winnerText = "{winner} would use this when in a fight with crocodiles";
  const comment = "“Even my grandma can beat your ass with you holding that.”";

  const player = useAudioPlayer(require('@/assets/audios/drum_roll.mp3'));

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runSequence = async () => {
      // Step 0: Initial State (Just "Criteria:" label logic handled in render)

      // Step 1: Reveal Criteria Content
      player.play(); // Play Drum Roll

      // Wait 2s for drum roll to finish/reach peak
      setTimeout(() => {
        setStep(1); // Show Criteria Text

        // GAP 1: 1s sleep after criteria content shown
        setTimeout(() => {
          // Step 2: Winner Reveal
          player.seekTo(0); // Reset audio
          player.play(); // Play again

          // Wait 2s
          setTimeout(() => {
            setStep(2); // Show Winner Info

            // GAP 2: 1s pause before Judge's Comment
            setTimeout(() => {
              setStep(3);
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 3000, // Longer ease-in (3s)
                useNativeDriver: true,
              }).start(() => {
                // Step 4: Final Actions
                setStep(4);
              });
            }, 1000); // Increased delay to ensure 1s+ gap
          }, 2000);
        }, 1000); // 1s gap between criteria and next drum roll
      }, 2000);
    };

    runSequence();
  }, [opacityAnim, player]); // Depend on player availability

  const handleNextRound = () => {
    // Go to next round or home
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.criteriaLabel}>Criteria: {step >= 1 ? criteria : ''}</Text>
        </View>

        {/* Winner Section */}
        {step >= 2 && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerText}>
              {winnerText.replace('{winner}', winnerName)}
            </Text>
            {/* Image Placeholder - Replicating the Cup Image style */}
            <View style={styles.imageContainer}>
              {/* Using a placeholder view for now as I don't have the specific cup image asset */}
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=3454&auto=format&fit=crop' }}
                style={styles.winnerImage}
                resizeMode="cover"
              />
            </View>
          </View>
        )}

        {/* Judge's Comment */}
        <Animated.View style={[styles.commentCard, { opacity: opacityAnim }]}>
          {step >= 3 && (
            <>
              <Text style={styles.commentLabel}>Judge’s Comment:</Text>
              <Text style={styles.commentText}>{comment}</Text>
            </>
          )}
        </Animated.View>

        {/* Reactions & Footer */}
        {step >= 4 && (
          <View style={styles.footerContainer}>
            <View style={styles.reactionsRow}>
              <ReactionIcon icon="thumbs-up" color="#E8C547" />
              <ReactionIcon icon="thumbs-down" color="#E8C547" />
              <ReactionIcon icon="egg" color="#E8C547" />
              <ReactionIcon icon="rose" color="#FF6B6B" />
            </View>

            <NeoButton
              title="Next Round (1/3)"
              onPress={handleNextRound}
              variant="primary"
              style={styles.nextButton}
            />
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

// Helper for Reaction Icons
function ReactionIcon({ icon, color }: { icon: any, color: string }) {
  return (
    <View style={styles.reactionButton}>
      <Ionicons name={icon} size={32} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neo.background, // Beige
  },
  content: {
    flex: 1, // Ensure content takes fill height if needed for centering
    paddingHorizontal: 24,
    width: '100%',
    paddingBottom: 20,
    paddingTop: 20,
    // paddingTop removed to avoid double padding with safe area
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
  },
  criteriaLabel: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'left',
  },
  winnerContainer: {
    width: '100%',
    alignItems: 'flex-start', // Left align text per standard
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold', // Mono-ish look in design but trying to stick to Nunito
    marginBottom: 5,
    color: '#000',
    lineHeight: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Square-ish
    backgroundColor: '#ddd',
    borderWidth: 0,
    // Design image has no border? "User sample" seems raw. 
    // But our Neo style usually has borders. 
    // I'll leave it clean/raw for now as per sample.
    overflow: 'hidden',
    marginBottom: 5,
  },
  winnerImage: {
    width: '100%',
    height: '100%',
  },
  commentCard: {
    width: '100%',
    backgroundColor: '#FFF5EB', // Light peach/white mix
    borderWidth: 1,
    borderColor: '#C89B7B', // Brownish border
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  commentLabel: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#C89B7B', // Match border/theme
    marginBottom: 4,
  },
  commentText: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#C89B7B',
    lineHeight: 24,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  reactionButton: {
    width: 60,
    height: 60,
    backgroundColor: '#D4B498', // Muted brown/peach
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#C17F59', // Darker brown for primary button in this context? 
    // Or reusing Neo layout. user said "Next Round button"
    // Keep standard NeoButton style but maybe override color?
    // User sample has a Brown button. 
    // I will use standard NeoButton style for consistency unless user wants exact match.
    // The sample image button is BROWN. I should try to match the sample if possible, or stick to app theme.
    // I'll stick to app theme (Lavender) for now to keep consistency, 
    // but the sample is very Brown/Earth toned.
    // Let's use the standard variant="primary" first.
  }
});

import { useState } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

  const handleCreateGame = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    // Navigate to create game flow
    console.log('Create Game with nickname:', nickname);
    router.push({ pathname: '/waiting-room', params: { nickname } });
  };

  const handleJoinGame = () => {
    // Navigate to join game flow
    console.log('Join Game');
    router.push('/join');
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/snapplot_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Please enter your nickname</Text>
                <NeoInput
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.buttonContainer}>
                <NeoButton
                  title="➕Create a Game"
                  onPress={handleCreateGame}
                  variant="primary"
                  style={styles.button}
                />
                <NeoButton
                  title="👥 Join a Game"
                  onPress={handleJoinGame}
                  variant="outline"
                  style={styles.button}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.neo.background,
  },
  titleContainer: {
    marginBottom: 50, // Space between title and input
  },
  title: {
    fontSize: 48,
    fontFamily: 'Nunito_700Bold',
    color: '#000', // Black text
    textAlign: 'center',
    lineHeight: 56, // Adjust for tighter stacking if needed
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30, // Space between input and buttons
    height: 50,
  },
  buttonContainer: {
    width: '100%',
    gap: 15, // Space between buttons
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
    marginTop: -150,
    alignItems: 'center',
  },
  logo: {
    width: 370,
    height: 150,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neo.text,
    marginBottom: 12,
    opacity: 0.9,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});

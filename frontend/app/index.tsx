import { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

  const handleCreateGame = () => {
    // Navigate to create game flow
    console.log('Create Game with nickname:', nickname);
    router.push('/explore'); // Temporary navigation
  };

  const handleJoinGame = () => {
    // Navigate to join game flow
    console.log('Join Game');
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
              <Text style={styles.title}>Welcome!</Text>

              <View style={styles.inputContainer}>
                <NeoInput
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.buttonContainer}>
                <NeoButton
                  title="+ Create a Game"
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
  background: {
    flex: 1,
    backgroundColor: Colors.neo.background,
  },
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 48,
    color: Colors.neo.text,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});

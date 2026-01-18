import { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoPinInput } from '@/components/ui/NeoPinInput';

export default function JoinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleJoinRoom = () => {
    console.log('Joining room with PIN:', pin);
    // Add logic to join room
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
              <Text style={styles.title}>Enter the 4 digit room PIN:</Text>

              <View style={styles.inputContainer}>
                <NeoPinInput
                  length={4}
                  onComplete={(code) => setPin(code)}
                />
              </View>

              <View style={styles.buttonContainer}>
                <NeoButton
                  title="Join Room"
                  onPress={handleJoinRoom}
                  variant="primary"
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 48,
    color: Colors.neo.text,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 48,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    width: '100%',
  },
});

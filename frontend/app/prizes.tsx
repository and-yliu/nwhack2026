import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { useSocket } from '@/hooks/useSocket';

export default function PrizesScreen() {
    const router = useRouter();
    const { lobbyState, socket } = useSocket();

    const handleReturnToRoom = () => {
        if (!lobbyState || !lobbyState.code) {
            // Fallback if state is lost
            router.replace('/');
            return;
        }

        const isHost = socket?.id === lobbyState.hostId;
        const currentPlayer = lobbyState.players.find(p => p.id === socket?.id);
        const nickname = currentPlayer?.name || 'Player';

        if (isHost) {
            router.push({
                pathname: '/host-waiting-room',
                params: {
                    nickname,
                    roomPin: lobbyState.code
                }
            });
        } else {
            router.push({
                pathname: '/player-waiting-room',
                params: {
                    nickname,
                    roomPin: lobbyState.code
                }
            });
        }
    };

    const handleQuitRoom = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neo.background }}>
            <View className="flex-1 px-6 pt-10">
                {/* Title */}
                <Text
                    className="text-2xl text-neo-text mb-12 text-center"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                >
                    Game Summary
                </Text>

                {/* Summary Items */}
                <View className="flex-1 gap-8">
                    <View>
                        <Text
                            className="text-xl text-neo-text mb-2"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                            Judge's Fav Target: <Text style={{ fontFamily: 'Nunito_400Regular' }}>Kvn</Text>
                        </Text>
                    </View>

                    <View>
                        <Text
                            className="text-xl text-neo-text mb-2"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                            The Most Clueless: <Text style={{ fontFamily: 'Nunito_400Regular' }}>Mob</Text>
                        </Text>
                    </View>

                    <View>
                        <Text
                            className="text-xl text-neo-text mb-2"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                            Chaos Generator: <Text style={{ fontFamily: 'Nunito_400Regular' }}>SlayerXX</Text>
                        </Text>
                    </View>
                </View>

                {/* Footer Buttons */}
                <View className="gap-5 pb-20">
                    <NeoButton
                        title="Return to Room"
                        onPress={handleReturnToRoom}
                        variant="primary"
                    // style={{ backgroundColor: '#C88A58' }} // Custom brownish color from image
                    />
                    <NeoButton
                        title="Quit Room"
                        onPress={handleQuitRoom}
                        variant="outline"
                        style={{ borderColor: '#C88A58' }}
                        textColor='#000000ff'
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

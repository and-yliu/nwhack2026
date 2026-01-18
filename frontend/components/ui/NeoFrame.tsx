import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NeoFrameProps {
    children: React.ReactNode;
}

export const NeoFrame: React.FC<NeoFrameProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            {/* Outer Border Frame */}
            <View style={styles.frameBorder} pointerEvents="none" />

            {/* Corner Decorations */}
            <View style={[styles.corner, styles.cornerTL]} pointerEvents="none">
                <View style={styles.cornerInner} />
            </View>
            <View style={[styles.corner, styles.cornerTR]} pointerEvents="none">
                <View style={styles.cornerInner} />
            </View>
            <View style={[styles.corner, styles.cornerBL]} pointerEvents="none">
                <View style={styles.cornerInner} />
            </View>
            <View style={[styles.corner, styles.cornerBR]} pointerEvents="none">
                <View style={styles.cornerInner} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
    frameBorder: {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        bottom: 10,
        borderWidth: 4,
        borderColor: '#000000',
        zIndex: 2,
        pointerEvents: 'none',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#000000',
        zIndex: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cornerInner: {
        width: 8,
        height: 8,
        backgroundColor: '#FFFFFF',
    },
    cornerTL: {
        top: -4,
        left: 4,
    },
    cornerTR: {
        top: -4,
        right: 4,
    },
    cornerBL: {
        bottom: -4,
        left: 4,
    },
    cornerBR: {
        bottom: -4,
        right: 4,
    },
});

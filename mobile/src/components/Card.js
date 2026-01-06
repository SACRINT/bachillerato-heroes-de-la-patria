import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme, spacing, borderRadius } from '../utils/theme';

const Card = ({ children, style, elevation = 2 }) => {
    const colors = useTheme();

    return (
        <View style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.text },
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
});

export default Card;

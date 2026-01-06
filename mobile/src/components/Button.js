import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, spacing, borderRadius, typography } from '../utils/theme';

const Button = ({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) => {
    const colors = useTheme();

    const getBackgroundColor = () => {
        if (disabled) return colors.border;
        if (variant === 'outline') return 'transparent';
        if (variant === 'secondary') return colors.secondary;
        return colors.primary;
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        if (variant === 'outline') return colors.primary;
        return colors.white;
    };

    const containerStyle = [
        styles.container,
        {
            backgroundColor: getBackgroundColor(),
            borderColor: variant === 'outline' ? colors.primary : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
    ];

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48,
    },
    text: {
        ...typography.button,
    },
});

export default Button;

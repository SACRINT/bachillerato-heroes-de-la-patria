import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, borderRadius, typography } from '../utils/theme';

const Input = ({ label, value, onChangeText, placeholder, secureTextEntry, error, ...props }) => {
    const colors = useTheme();

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.card,
                        borderColor: error ? colors.error : colors.border,
                        color: colors.text
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={secureTextEntry}
                {...props}
            />
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 16,
    },
    errorText: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
});

export default Input;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import { useTheme, spacing, typography } from '../utils/theme';

const HomeScreen = ({ navigation }) => {
    const colors = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Hola, Estudiante</Text>

            <Card>
                <Text style={[styles.cardTitle, { color: colors.primary }]}>Tu Progreso</Text>
                <Text style={{ color: colors.textSecondary }}>Has completado 3 lecciones hoy.</Text>
            </Card>

            <View style={styles.actions}>
                <Button
                    title="Ver Cursos"
                    onPress={() => console.log('Cursos')}
                    style={{ marginBottom: spacing.md }}
                />
                <Button
                    title="Cerrar Sesión"
                    variant="secondary"
                    onPress={() => navigation.replace('Login')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    actions: {
        marginTop: spacing.xl,
    }
});

export default HomeScreen;

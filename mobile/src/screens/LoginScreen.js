import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { useTheme, spacing, typography } from '../utils/theme';
import api from '../services/api';

const LoginScreen = () => {
    const colors = useTheme();
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Lógica de login normal (usuario y contraseña)
            // const response = await api.post('/auth/login', { email, password });
            // await saveToken(response.data.token);
            Alert.alert('Éxito', 'Login simulado exitoso');
            navigation.replace('Home');
        } catch (error) {
            Alert.alert('Error', 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        const rnBiometrics = new ReactNativeBiometrics();

        try {
            const { available, biometryType } = await rnBiometrics.isSensorAvailable();

            if (available && biometryType) {
                const { success, error } = await rnBiometrics.simplePrompt({ promptMessage: 'Confirma tu identidad' });

                if (success) {
                    // Aquí iría la lógica de crear firma criptográfica
                    Alert.alert('Biometría', 'Huella verificada correctamente');
                    navigation.replace('Home');
                } else {
                    Alert.alert('Cancelado', 'Autenticación biométrica cancelada');
                }
            } else {
                Alert.alert('No disponible', 'Tu dispositivo no soporta biometría');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Fallo en biometría');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.primary }]}>BGE Héroes</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bienvenido de nuevo</Text>
            </View>

            <Card style={styles.formCard}>
                <Input
                    label="Correo Electrónico"
                    placeholder="estudiante@heroes.edu.mx"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <Input
                    label="Contraseña"
                    placeholder="********"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button
                    title="Iniciar Sesión"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.loginBtn}
                />

                <Button
                    title="Usar Biometría"
                    onPress={handleBiometricLogin}
                    variant="outline"
                    icon="fingerprint"
                />
            </Card>

            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Versión 3.0.0 (Mobile Alpha)
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    header: {
        marginBottom: spacing.xxl,
        alignItems: 'center',
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
    },
    formCard: {
        padding: spacing.xl,
    },
    loginBtn: {
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    footerText: {
        textAlign: 'center',
        marginTop: spacing.xxl,
        ...typography.caption,
    },
});

export default LoginScreen;

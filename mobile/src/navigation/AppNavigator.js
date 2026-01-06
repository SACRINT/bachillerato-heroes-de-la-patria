import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MicroLearningScreen from '../screens/MicroLearningScreen';
import { useTheme } from '../utils/theme';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const theme = useTheme();

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerStyle: { backgroundColor: theme.primary },
                    headerTintColor: theme.white,
                    contentStyle: { backgroundColor: theme.background },
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'Inicio' }}
                />
                <Stack.Screen
                    name="MicroLearning"
                    component={MicroLearningScreen}
                    options={{ title: 'Micro Lecciones', headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

export const colors = {
    light: {
        primary: '#1976D2',
        secondary: '#004BA0',
        background: '#F5F7FA',
        card: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#D32F2F',
        success: '#388E3C',
        white: '#FFFFFF',
    },
    dark: {
        primary: '#63A4FF',
        secondary: '#1976D2',
        background: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: '#333333',
        error: '#EF5350',
        success: '#66BB6A',
        white: '#FFFFFF',
    }
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 12, fontWeight: 'normal', color: '#666' },
    button: { fontSize: 16, fontWeight: '600', textTransform: 'uppercase' },
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 16,
    round: 9999,
};

// Hook simple para tema (Placeholder hasta integrar hook real de sistema)
export const useTheme = () => {
    // Aquí podriamos usar useColorScheme() de react-native
    const isDarkMode = false;
    return isDarkMode ? colors.dark : colors.light;
};

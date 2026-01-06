import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme, typography, spacing } from '../utils/theme';
import Button from '../components/Button';
import api from '../services/api';

const { height, width } = Dimensions.get('window');

const LessonCard = ({ lesson, isActive }) => {
    const colors = useTheme();

    if (!lesson) return null;

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
            {/* Header / Top */}
            <View style={styles.headerOverlay}>
                <Text style={styles.topicBadge}>Topic #{lesson.topic_id || 'General'}</Text>
            </View>

            {/* Main Content Area */}
            <View style={styles.contentArea}>
                <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>

                {lesson.content_type === 'video' ? (
                    <View style={styles.videoPlaceholder}>
                        <Text style={{ color: colors.textSecondary }}>▶ Video Player Placeholder</Text>
                    </View>
                ) : (
                    <Text style={[styles.bodyText, { color: colors.text }]}>
                        {lesson.content_body || 'Contenido breve de la lección...'}
                    </Text>
                )}

                <View style={styles.statsRow}>
                    <Text style={{ color: colors.textSecondary }}>⏱ {Math.round(lesson.duration_seconds / 60)} min</Text>
                    <Text style={{ color: colors.textSecondary }}>📊 {lesson.complexity_level}</Text>
                </View>
            </View>

            {/* Actions Bottom */}
            <View style={styles.actionButtons}>
                <Button title="Marcar como Completo" onPress={() => console.log('Completed', lesson.id)} />
            </View>
        </View>
    );
};

const MicroLearningScreen = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const colors = useTheme();

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            // MOCK DATA hasta que el backend responda real
            // const res = await api.get('/microlearning/feed');
            // setLessons(res.data.data);

            setLessons([
                { id: 1, title: 'Introducción al Álgebra', content_type: 'video', duration_seconds: 180, complexity_level: 'beginner' },
                { id: 2, title: 'Historia de México: Independencia', content_type: 'text', content_body: 'La independencia de México inició en 1810...', duration_seconds: 120, complexity_level: 'intermediate' },
                { id: 3, title: 'Física: Leyes de Newton', content_type: 'video', duration_seconds: 300, complexity_level: 'advanced' },
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <FlatList
                data={lessons}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <LessonCard lesson={item} />}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                vertical
            />
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        height: height,
        width: width,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    headerOverlay: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
    },
    topicBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: 5,
        borderRadius: 5,
        overflow: 'hidden',
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    bodyText: {
        ...typography.body,
        textAlign: 'center',
        lineHeight: 24,
    },
    videoPlaceholder: {
        height: 200,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 30,
    },
    actionButtons: {
        paddingBottom: 80,
    }
});

export default MicroLearningScreen;

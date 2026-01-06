
// Mock database FIRST
const mockExecuteQuery = jest.fn();
jest.mock('../../backend/config/database', () => ({
    executeQuery: mockExecuteQuery
}));

const emotionalService = require('../../backend/services/emotional-analytics.service');
const { executeQuery } = require('../../backend/config/database');

describe('EmotionalAnalyticsService', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackEmotion', () => {
        it('should register an emotion successfully', async () => {
            // Mock get emotion ID
            executeQuery.mockResolvedValueOnce([{ id: 1, valence: 0.8 }]);
            // Mock insert log
            executeQuery.mockResolvedValueOnce([{ id: 100 }]);
            // Mock update context (get current)
            executeQuery.mockResolvedValueOnce([{ momentum_score: 50 }]);
            // Mock update context (upsert)
            executeQuery.mockResolvedValueOnce([]);

            const result = await emotionalService.trackEmotion(1, 'Flow', 'TEST');
            expect(result.success).toBe(true);
            expect(executeQuery).toHaveBeenCalledTimes(4);
        });

        it('should handle unknown emotions by defaulting to Neutral', async () => {
            // First query empty (unknown)
            executeQuery.mockResolvedValueOnce([]);
            // Second query (Neutral)
            executeQuery.mockResolvedValueOnce([{ id: 99, valence: 0 }]);

            // Rest of mocks
            executeQuery.mockResolvedValueOnce([{ id: 101 }]);
            executeQuery.mockResolvedValueOnce([{ momentum_score: 50 }]);
            executeQuery.mockResolvedValueOnce([]);

            await emotionalService.trackEmotion(1, 'UnknownEmotion');

            // Should verify fallback logic was called
            expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining("WHERE name = 'Neutral'"));
        });
    });

    describe('checkInterventionNeeded', () => {
        it('should recommend basic break if momentum is low (<20)', async () => {
            // Mock checking current state
            executeQuery.mockResolvedValueOnce([{ momentum_score: 15, current_mood: 'Stressed' }]);

            // Mock history (irrelevant for this case but called)
            executeQuery.mockResolvedValueOnce([]);

            const check = await emotionalService.checkInterventionNeeded(1);

            expect(check.shouldIntervene).toBe(true);
            expect(check.interventionType).toBe('DE_STRESS_BREAK');
        });

        it('should recommend switching topic if last 3 emotions were negative', async () => {
            // Mock state (momentum ok)
            executeQuery.mockResolvedValueOnce([{ momentum_score: 50 }]);

            // Mock history (3 negatives)
            executeQuery.mockResolvedValueOnce([
                { valence: -0.5, name: 'Frustrated' },
                { valence: -0.8, name: 'Angry' },
                { valence: -0.4, name: 'Bored' }
            ]);

            const check = await emotionalService.checkInterventionNeeded(1);

            expect(check.shouldIntervene).toBe(true);
            expect(check.interventionType).toBe('SWITCH_TOPIC');
        });

        it('should NOT recommend intervention if state is fine', async () => {
            // Mock state (momentum ok)
            executeQuery.mockResolvedValueOnce([{ momentum_score: 80 }]);

            // Mock history (mixed)
            executeQuery.mockResolvedValueOnce([
                { valence: 0.5, name: 'Happy' },
                { valence: -0.2, name: 'Bored' },
                { valence: 0.8, name: 'Flow' }
            ]);

            const check = await emotionalService.checkInterventionNeeded(1);

            expect(check.shouldIntervene).toBe(false);
        });
    });
});

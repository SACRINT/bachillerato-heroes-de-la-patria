const personalizedPlanService = require('../../backend/services/personalized-plan.service');
const { executeQuery } = require('../../backend/config/database');

// Mock database config - Note: require path adjusts if run from root vs test folder
jest.mock('../../backend/config/database', () => ({
    executeQuery: jest.fn(),
}));

// Mock debug logger
jest.mock('../../backend/utils/debug-logger', () => ({
    log: jest.fn(),
    error: jest.fn(),
}));

describe('PersonalizedPlanService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createGoal', () => {
        it('should create a study goal', async () => {
            const mockInsert = [{ id: 1, title: 'Learn Jest', student_id: 101 }];
            executeQuery.mockResolvedValue(mockInsert);

            const result = await personalizedPlanService.createGoal(101, 'Learn Jest', '2026-02-01');

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO study_goals'),
                [101, 'Learn Jest', '2026-02-01', 'MEDIUM']
            );
            expect(result).toEqual(mockInsert[0]);
        });
    });

    describe('getActiveGoals', () => {
        it('should return active goals for student', async () => {
            const mockGoals = [{ id: 1, title: 'Math' }];
            executeQuery.mockResolvedValue(mockGoals);

            const goals = await personalizedPlanService.getActiveGoals(101);

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM study_goals'),
                [101]
            );
            expect(goals).toHaveLength(1);
        });
    });

    describe('generateWeeklyPlan', () => {
        it('should generate a plan and items', async () => {
            // Mock sequence of DB calls:
            // 1. Create Plan INSERT -> returns [{ id: 500 }]
            // 2. Insert Items (Loop) -> returns []
            // 3. Get Goals -> returns []
            // 4. Get Plan Details (SELECT Plan) -> returns [{ id: 500, status: 'mock' }]
            // 5. Get Plan Items (SELECT Items) -> returns [{ id: 10, subject: 'Math' }]

            executeQuery
                .mockResolvedValueOnce([{ id: 500 }]) // Insert Plan
                .mockResolvedValueOnce([]) // Insert Item 1
                .mockResolvedValueOnce([]) // Insert Item 2
                .mockResolvedValueOnce([]) // Insert Item 3
                .mockResolvedValueOnce([]) // Insert Item 4
                .mockResolvedValueOnce([]) // Insert Item 5
                .mockResolvedValueOnce([]) // Get Goals (Empty for simplicity)
                .mockResolvedValueOnce([{ id: 500, start_date: '2026-01-01' }]) // Get Plan Details
                .mockResolvedValueOnce([{ id: 10, subject: 'Math' }, { id: 11, subject: 'Physics' }]); // Get Plan Items

            const plan = await personalizedPlanService.generateWeeklyPlan(101, '2026-01-01');

            expect(plan.id).toBe(500);
            expect(plan.items).toHaveLength(2);
            expect(executeQuery).toHaveBeenCalledTimes(9); // 1 plan + 5 items + 1 goals + 1 fetch plan + 1 fetch items
        });
    });

    describe('adjustPlan', () => {
        it('should update plan status', async () => {
            const mockUpdate = [{ id: 500, status: 'PAUSED' }];
            executeQuery.mockResolvedValue(mockUpdate);

            const result = await personalizedPlanService.adjustPlan(500, { status: 'PAUSED' });

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE study_plans'),
                [500, 'PAUSED']
            );
            expect(result.status).toBe('PAUSED');
        });
    });

});

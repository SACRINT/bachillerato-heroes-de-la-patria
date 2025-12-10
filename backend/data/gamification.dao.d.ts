/**
 * 🎮 GAMIFICATION DAO - TypeScript
 * Data Access Object para sistema de gamificación
 * Abstrae todo el SQL de niveles, XP, badges y monedas
 *
 * Migración TypeScript: 07 Diciembre 2025
 * Usa tabla iacoins_balance para XP, niveles y monedas
 */
export interface LevelDefinition {
    level: number;
    xp_required: number;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    description?: string;
}
export interface UserBalance {
    user_id?: number;
    experience_points: number;
    level: number;
    balance: number;
    total_earned: number;
    total_spent?: number;
    updated_at?: Date;
    title?: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    description?: string;
}
export interface LevelHistory {
    id: number;
    user_id: number;
    level: number;
    previous_level: number;
    xp_at_levelup: number;
    coins_earned: number;
    unlocks_gained: any;
    achieved_at: Date;
}
export interface Badge {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon_url: string;
    category: string;
    rarity: string;
    xp_reward: number;
    coins_reward: number;
    requirement_type: string;
    requirement_value: number;
    is_active: boolean;
    is_hidden: boolean;
    sort_order: number;
    earned_at?: Date;
    is_featured?: boolean;
    earn_details?: any;
    earned?: boolean;
}
export interface UserBadge {
    id: number;
    user_id: number;
    badge_id: number;
    earned_at: Date;
    is_featured: boolean;
    earn_details?: any;
}
export interface Transaction {
    id: number;
    user_id: number;
    amount: number;
    type: string;
    description: string;
    reference_id?: string;
    reference_type?: string;
    created_at: Date;
}
export interface LevelUnlock {
    id: number;
    level: number;
    feature_slug: string;
    description: string;
    is_active: boolean;
}
export interface UserStreak {
    id: number;
    user_id: number;
    streak_type: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: Date;
    updated_at: Date;
}
export interface XPLeaderboardEntry {
    user_id: number;
    level: number;
    experience_points: number;
    balance: number;
    nombre: string;
    apellido_paterno: string;
    avatar_url?: string;
    level_title?: string;
    level_icon?: string;
    rank: number;
}
export interface BadgesLeaderboardEntry {
    user_id: number;
    badge_count: number;
    nombre: string;
    apellido_paterno: string;
    rank: number;
}
export interface Challenge {
    id: number;
    title: string;
    description: string;
    icon: string;
    category: string;
    difficulty: string;
    is_active: boolean;
    start_date?: Date;
    end_date?: Date;
    priority: number;
    status?: string;
    progress?: number;
    started_at?: Date;
    claimed_at?: Date;
    coins_earned?: number;
    xp_earned?: number;
}
declare class GamificationDAO {
    /**
     * Obtiene todas las definiciones de niveles
     */
    static getLevelDefinitions(): Promise<LevelDefinition[]>;
    /**
     * Obtiene balance de usuario (XP, nivel, monedas)
     */
    static getUserBalance(userId: number): Promise<UserBalance>;
    /**
     * Actualiza XP del usuario
     */
    static updateXP(userId: number, newXP: number): Promise<void>;
    /**
     * Actualiza nivel del usuario
     */
    static updateLevel(userId: number, newLevel: number): Promise<void>;
    /**
     * Obtiene el nivel actual del usuario con detalles
     */
    static getUserLevelWithDetails(userId: number): Promise<UserBalance>;
    /**
     * Registra subida de nivel en historial
     */
    static recordLevelUp(userId: number, level: number, previousLevel: number, xp: number, coinsEarned: number, unlocks: any): Promise<void>;
    /**
     * Obtiene historial de niveles del usuario
     */
    static getLevelHistory(userId: number, limit?: number): Promise<LevelHistory[]>;
    /**
     * Obtiene todos los badges activos
     */
    static getAllBadges(): Promise<Badge[]>;
    /**
     * Obtiene badges de un usuario
     */
    static getUserBadges(userId: number): Promise<Badge[]>;
    /**
     * Obtiene badges con estado (ganados y no ganados)
     */
    static getBadgesWithStatus(userId: number): Promise<Badge[]>;
    /**
     * Verifica si usuario ya tiene un badge
     */
    static hasBadge(userId: number, badgeId: number): Promise<boolean>;
    /**
     * Obtiene información de un badge
     */
    static getBadgeById(badgeId: number): Promise<Badge>;
    /**
     * Otorga un badge a un usuario
     */
    static grantBadge(userId: number, badgeId: number, details?: any): Promise<UserBadge>;
    /**
     * Obtiene badges por tipo de requerimiento
     */
    static getBadgesByRequirement(requirementType: string, value: number): Promise<Badge[]>;
    /**
     * Obtiene badges por nivel
     */
    static getBadgesByLevel(level: number): Promise<Badge[]>;
    /**
     * Establece un badge como destacado
     */
    static setFeaturedBadge(userId: number, badgeId: number): Promise<UserBadge>;
    /**
     * Obtiene balance de monedas
     */
    static getCoinBalance(userId: number): Promise<UserBalance>;
    /**
     * Agrega monedas al usuario
     */
    static addCoins(userId: number, amount: number): Promise<void>;
    /**
     * Resta monedas del usuario
     */
    static spendCoins(userId: number, amount: number): Promise<boolean>;
    /**
     * Crea transacción de monedas
     */
    static createTransaction(userId: number, amount: number, type: string, description: string, reference?: string | null): Promise<Transaction>;
    /**
     * Obtiene historial de transacciones
     */
    static getTransactionHistory(userId: number, limit?: number, offset?: number): Promise<Transaction[]>;
    /**
     * Obtiene desbloqueos para un nivel
     */
    static getUnlocksForLevel(level: number): Promise<LevelUnlock[]>;
    /**
     * Verifica acceso a feature
     */
    static hasFeatureAccess(featureSlug: string, userLevel: number): Promise<boolean>;
    /**
     * Obtiene streak del usuario
     */
    static getUserStreak(userId: number, streakType?: string): Promise<UserStreak | undefined>;
    /**
     * Actualiza streak del usuario
     */
    static updateStreak(userId: number, streakType: string, currentStreak: number, lastDate: Date): Promise<UserStreak>;
    /**
     * Obtiene leaderboard por XP
     */
    static getXPLeaderboard(limit?: number): Promise<XPLeaderboardEntry[]>;
    /**
     * Obtiene posición del usuario en leaderboard
     */
    static getUserRank(userId: number): Promise<number | undefined>;
    /**
     * Obtiene leaderboard por badges
     */
    static getBadgesLeaderboard(limit?: number): Promise<BadgesLeaderboardEntry[]>;
    /**
     * Obtiene retos activos
     */
    static getActiveChallenges(): Promise<Challenge[]>;
    /**
     * Obtiene progreso de retos del usuario
     */
    static getUserChallengeProgress(userId: number): Promise<Challenge[]>;
    /**
     * Actualiza progreso de reto
     */
    static updateChallengeProgress(userId: number, challengeId: number, progress: number, status?: string): Promise<{
        id: number;
    }>;
    /**
     * Reclama recompensa de reto
     */
    static claimChallengeReward(userId: number, challengeId: number, coinsEarned: number, xpEarned: number): Promise<{
        id: number;
    }>;
}
export default GamificationDAO;
//# sourceMappingURL=gamification.dao.d.ts.map
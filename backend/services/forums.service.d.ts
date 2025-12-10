/**
 * 💬 FORUMS SERVICE - TypeScript Version
 * Gestión de foros de discusión
 * Refactorizado: 07 Diciembre 2025
 */
export interface ReputationLevel {
    min: number;
    max: number;
    name: string;
}
export interface ReputationPoints {
    [key: string]: number;
}
export interface TopicData {
    categoryId: number;
    title: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
}
export interface PostData {
    topicId: number;
    content: string;
    parentId?: number;
    quotedPostId?: number;
}
export interface Topic {
    id: number;
    title: string;
    content: string;
    authorId: number;
    categoryId: number;
    views: number;
    likes: number;
    replyCount: number;
    createdAt: Date;
}
export interface Post {
    id: number;
    topicId: number;
    content: string;
    authorId: number;
    likes: number;
    createdAt: Date;
}
declare class ForumsService {
    private reputationLevels;
    private reputationPoints;
    constructor();
    getCategories(userRole?: string): Promise<any[]>;
    getCategoryBySlug(slug: string): Promise<any>;
    getTopics(options?: {
        categoryId?: number;
        page?: number;
        limit?: number;
    }): Promise<any>;
    getTopicById(topicId: number, userId?: number | null): Promise<Topic | null>;
    createTopic(userId: number, topicData: TopicData): Promise<Topic>;
    updateTopic(topicId: number, userId: number, topicData: Partial<TopicData>): Promise<Topic | null>;
    incrementViewCount(topicId: number): Promise<void>;
    getTopicPosts(topicId: number, options?: {
        page?: number;
        limit?: number;
    }): Promise<any>;
    createPost(userId: number, postData: PostData): Promise<Post>;
    updatePost(postId: number, userId: number, content: string): Promise<Post | null>;
    deletePost(postId: number, userId: number, reason?: string | null): Promise<boolean>;
    markAsSolution(topicId: number, postId: number, userId: number): Promise<boolean>;
    reactToTopic(userId: number, topicId: number, reactionType: string): Promise<any>;
    reactToPost(userId: number, postId: number, reactionType: string): Promise<any>;
    private updateLikeCount;
    subscribeTopic(userId: number, topicId: number): Promise<void>;
    unsubscribeTopic(userId: number, topicId: number): Promise<void>;
    getUserSubscriptions(userId: number, limit?: number): Promise<any[]>;
    private processMentions;
    getUnreadMentions(userId: number): Promise<any[]>;
    markMentionsAsRead(userId: number, mentionIds?: number[] | null): Promise<void>;
    reportContent(userId: number, reportData: {
        type: string;
        id: number;
        reason: string;
    }): Promise<any>;
    getPendingReports(limit?: number): Promise<any[]>;
    private updateUserStats;
    grantReputation(userId: number, action: string): Promise<void>;
    getReputationLevel(score: number): ReputationLevel;
    getUserStats(userId: number): Promise<any>;
    getReputationLeaderboard(limit?: number): Promise<any[]>;
    searchTopics(searchTerm: string, options?: {
        categoryId?: number;
        limit?: number;
    }): Promise<any[]>;
    getTrendingTopics(limit?: number): Promise<any[]>;
}
declare const forumsService: ForumsService;
export { ForumsService };
export default forumsService;
//# sourceMappingURL=forums.service.d.ts.map
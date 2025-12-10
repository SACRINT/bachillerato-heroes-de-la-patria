/**
 * 💬 FORUM DAO - TypeScript
 * Data Access Object para sistema de foros
 * Abstrae todas las queries SQL de ForumsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface ForumCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    parent_id?: number;
    sort_order: number;
    is_active: boolean;
    allowed_roles: string[];
    topic_count: number;
    post_count: number;
    last_post_at?: Date;
    last_post_user_id?: number;
    last_post_topic_id?: number;
    created_at: Date;
    updated_at: Date;
    last_post_user_name?: string;
    last_topic_title?: string;
}
export interface ForumTopic {
    id: number;
    category_id: number;
    title: string;
    slug: string;
    content: string;
    author_id: number;
    topic_type: string;
    status: string;
    is_pinned: boolean;
    is_locked: boolean;
    is_hidden: boolean;
    is_approved: boolean;
    view_count: number;
    reply_count: number;
    like_count: number;
    last_reply_at?: Date;
    last_reply_user_id?: number;
    solution_post_id?: number;
    solved_at?: Date;
    tags?: any;
    xp_reward: number;
    coins_reward: number;
    search_vector?: any;
    created_at: Date;
    updated_at: Date;
    category_name?: string;
    category_slug?: string;
    author_name?: string;
    last_reply_user_name?: string;
    is_subscribed?: boolean;
    user_reaction?: string;
    relevance?: number;
    trending_score?: number;
}
export interface ForumPost {
    id: number;
    topic_id: number;
    parent_post_id?: number;
    content: string;
    author_id: number;
    is_solution: boolean;
    is_hidden: boolean;
    hidden_by?: number;
    hidden_at?: Date;
    hidden_reason?: string;
    is_edited: boolean;
    edited_by?: number;
    edited_at?: Date;
    edit_count: number;
    like_count: number;
    is_approved: boolean;
    created_at: Date;
    updated_at: Date;
    author_name?: string;
    edited_by_name?: string;
    user_reaction?: string;
    topic_title?: string;
    topic_slug?: string;
}
export interface ForumReaction {
    id: number;
    user_id: number;
    topic_id?: number;
    post_id?: number;
    reaction_type: string;
    created_at: Date;
}
export interface ForumSubscription {
    id: number;
    user_id: number;
    topic_id: number;
    is_muted: boolean;
    created_at: Date;
    title?: string;
    slug?: string;
    reply_count?: number;
    last_reply_at?: Date;
}
export interface ForumMention {
    id: number;
    post_id: number;
    mentioned_user_id: number;
    is_read: boolean;
    read_at?: Date;
    created_at: Date;
    content?: string;
    post_created_at?: Date;
    topic_title?: string;
    topic_slug?: string;
    author_name?: string;
}
export interface ForumReport {
    id: number;
    reporter_id: number;
    topic_id?: number;
    post_id?: number;
    reason: string;
    description?: string;
    status: string;
    resolution?: string;
    resolved_by?: number;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
    reporter_name?: string;
    topic_title?: string;
    post_content?: string;
}
export interface ForumPoll {
    id: number;
    topic_id: number;
    question: string;
    options: any;
    allows_multiple: boolean;
    starts_at?: Date;
    ends_at?: Date;
    total_votes: number;
    voter_count: number;
    created_at: Date;
}
export interface ForumUserStats {
    user_id: number;
    topic_count: number;
    post_count: number;
    solution_count: number;
    reputation_score: number;
    reputation_level: string;
    last_activity_at: Date;
    created_at: Date;
    updated_at: Date;
    nombre?: string;
    email?: string;
    rank?: number;
}
export interface CreateTopicInput {
    categoryId: number;
    title: string;
    slug: string;
    content: string;
    authorId: number;
    topicType: string;
    tags?: string[];
    xpReward?: number;
    coinsReward?: number;
}
export interface GetTopicsOptions {
    categoryId?: number;
    authorId?: number;
    status?: string;
    topicType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    userId?: number;
}
declare class ForumDAO {
    static getCategories(userRole?: string): Promise<ForumCategory[]>;
    static getCategoryBySlug(slug: string): Promise<ForumCategory | null>;
    static getTopics(options?: GetTopicsOptions): Promise<ForumTopic[]>;
    static getTopicById(topicId: number | string, userId?: number | null): Promise<ForumTopic | null>;
    static createTopic(data: CreateTopicInput): Promise<ForumTopic>;
    static updateTopic(topicId: number | string, authorId: number, fields: string[], values: any[]): Promise<ForumTopic>;
    static incrementViewCount(topicId: number | string): Promise<void>;
    static getTopicAuthor(topicId: number | string): Promise<number | undefined>;
    static getTopicPosts(topicId: number | string, options?: {
        limit?: number;
        offset?: number;
        userId?: number | null;
    }): Promise<ForumPost[]>;
    static createPost(topicId: number | string, parentPostId: number | null, content: string, authorId: number): Promise<ForumPost>;
    static updatePost(postId: number | string, authorId: number, content: string): Promise<ForumPost>;
    static deletePost(postId: number | string, userId: number, reason: string): Promise<boolean>;
    static getPostAuthor(postId: number | string): Promise<number | undefined>;
    static clearTopicSolutions(topicId: number | string): Promise<void>;
    static markPostAsSolution(postId: number | string): Promise<{
        author_id: number;
    }>;
    static updateTopicSolution(topicId: number | string, postId: number | string): Promise<void>;
    static getTopicReaction(userId: number, topicId: number | string): Promise<ForumReaction | undefined>;
    static getPostReaction(userId: number, postId: number | string): Promise<ForumReaction | undefined>;
    static deleteReaction(reactionId: number): Promise<void>;
    static updateReaction(reactionId: number, reactionType: string): Promise<void>;
    static createTopicReaction(userId: number, topicId: number | string, reactionType: string): Promise<void>;
    static createPostReaction(userId: number, postId: number | string, reactionType: string): Promise<void>;
    static updateLikeCount(type: 'topic' | 'post', id: number | string, delta: number): Promise<void>;
    static subscribeTopic(userId: number, topicId: number | string): Promise<ForumSubscription>;
    static unsubscribeTopic(userId: number, topicId: number | string): Promise<void>;
    static getUserSubscriptions(userId: number, limit?: number): Promise<ForumSubscription[]>;
    static findUserByUsername(username: string): Promise<{
        id: number;
    } | undefined>;
    static createMention(postId: number | string, mentionedUserId: number): Promise<void>;
    static getUnreadMentions(userId: number): Promise<ForumMention[]>;
    static markMentionsAsRead(userId: number, mentionIds?: number[] | null): Promise<void>;
    static createReport(userId: number, topicId: number | null, postId: number | null, reason: string, description?: string): Promise<ForumReport>;
    static getPendingReports(limit?: number): Promise<ForumReport[]>;
    static createPoll(topicId: number | string, question: string, options: any, allowsMultiple: boolean, endsAt?: Date): Promise<ForumPoll>;
    static updateTopicType(topicId: number | string, type: string): Promise<void>;
    static getPollVote(pollId: number, userId: number): Promise<{
        id: number;
    } | undefined>;
    static createPollVote(pollId: number, userId: number, optionIds: number[]): Promise<void>;
    static getPollOptions(pollId: number): Promise<any>;
    static updatePollOptions(pollId: number, options: any, voteCount: number): Promise<void>;
    static ensureUserStats(userId: number): Promise<void>;
    static updateUserStats(userId: number, field: string, increment?: number): Promise<void>;
    static getUserStats(userId: number): Promise<ForumUserStats | undefined>;
    static updateReputationLevel(userId: number, level: string): Promise<void>;
    static getReputationLeaderboard(limit?: number): Promise<ForumUserStats[]>;
    static searchTopics(searchTerm: string, options?: {
        categoryId?: number;
        limit?: number;
        offset?: number;
    }): Promise<ForumTopic[]>;
    static getTrendingTopics(limit?: number): Promise<ForumTopic[]>;
}
export default ForumDAO;
//# sourceMappingURL=forum.dao.d.ts.map
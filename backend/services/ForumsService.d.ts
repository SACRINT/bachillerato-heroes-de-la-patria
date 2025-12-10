declare const _exports: ForumsService;
export = _exports;
declare class ForumsService {
    reputationLevels: {
        min: number;
        max: number;
        name: string;
    }[];
    reputationPoints: {
        create_topic: number;
        create_post: number;
        receive_like: number;
        solution_accepted: number;
        best_answer: number;
    };
    getCategories(userRole?: string): Promise<any>;
    getCategoryBySlug(slug: any): Promise<any>;
    getTopics(options?: {}): Promise<any>;
    getTopicById(topicId: any, userId?: any): Promise<any>;
    createTopic(userId: any, topicData: any): Promise<any>;
    updateTopic(topicId: any, userId: any, topicData: any): Promise<any>;
    incrementViewCount(topicId: any): Promise<any>;
    getTopicPosts(topicId: any, options?: {}): Promise<any>;
    createPost(userId: any, postData: any): Promise<any>;
    updatePost(postId: any, userId: any, content: any): Promise<any>;
    deletePost(postId: any, userId: any, reason?: any): Promise<any>;
    markAsSolution(topicId: any, postId: any, userId: any): Promise<boolean>;
    reactToTopic(userId: any, topicId: any, reactionType: any): Promise<{
        action: string;
        type?: undefined;
    } | {
        action: string;
        type: any;
    }>;
    reactToPost(userId: any, postId: any, reactionType: any): Promise<{
        action: string;
        type?: undefined;
    } | {
        action: string;
        type: any;
    }>;
    updateLikeCount(type: any, id: any, delta: any): Promise<any>;
    subscribeTopic(userId: any, topicId: any): Promise<any>;
    unsubscribeTopic(userId: any, topicId: any): Promise<boolean>;
    getUserSubscriptions(userId: any, limit?: number): Promise<any>;
    processMentions(postId: any, content: any): Promise<void>;
    getUnreadMentions(userId: any): Promise<any>;
    markMentionsAsRead(userId: any, mentionIds?: any): Promise<boolean>;
    reportContent(userId: any, reportData: any): Promise<any>;
    getPendingReports(limit?: number): Promise<any>;
    createPoll(topicId: any, pollData: any): Promise<any>;
    votePoll(userId: any, pollId: any, optionIds: any): Promise<boolean>;
    updateUserStats(userId: any, field: any, increment?: number): Promise<void>;
    grantReputation(userId: any, action: any): Promise<void>;
    getReputationLevel(score: any): string;
    getUserStats(userId: any): Promise<any>;
    getReputationLeaderboard(limit?: number): Promise<any>;
    searchTopics(searchTerm: any, options?: {}): Promise<any>;
    getTrendingTopics(limit?: number): Promise<any>;
}
//# sourceMappingURL=ForumsService.d.ts.map
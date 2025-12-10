export function getPushNotificationService(): any;
export class PushNotificationService {
    subscribers: Map<any, any>;
    subscriptionsFile: string;
    notificationQueue: any[];
    isInitialized: boolean;
    config: {
        vapidKeys: {
            publicKey: any;
            privateKey: any;
        };
        subject: string;
        ttl: number;
        urgency: string;
        batchSize: number;
        retryAttempts: number;
    };
    notificationTypes: {
        ANNOUNCEMENT: string;
        GRADE: string;
        ASSIGNMENT: string;
        EVENT: string;
        REMINDER: string;
        EMERGENCY: string;
        SYSTEM: string;
    };
    init(): Promise<void>;
    generateVAPIDKeys(): any;
    loadSubscriptions(): Promise<void>;
    saveSubscriptions(): Promise<void>;
    subscribe(userId: any, subscription: any, metadata?: {}): Promise<string>;
    unsubscribe(subscriptionId: any): Promise<boolean>;
    sendNotification(notification: any): Promise<string | {
        sent: number;
        failed: number;
        errors: any[];
    }>;
    sendImmediateNotification(payload: any, userIds: any, priority?: string): Promise<{
        sent: number;
        failed: number;
        errors: any[];
    }>;
    sendToSubscription(subscriptionData: any, payload: any, priority: any): Promise<void>;
    getSubscriptionsForUsers(userIds: any): any[];
    scheduleNotification(payload: any, userIds: any, scheduledAt: any): Promise<string>;
    startQueueProcessor(): void;
    processNotificationQueue(): Promise<void>;
    scheduleAutomaticNotifications(): void;
    sendDailyReminders(): Promise<void>;
    sendWeeklyEvents(): Promise<void>;
    sendEmergencyNotification(title: any, body: any, userIds?: any[]): Promise<string | {
        sent: number;
        failed: number;
        errors: any[];
    }>;
    sendGradeNotification(userId: any, subject: any, grade: any): Promise<string | {
        sent: number;
        failed: number;
        errors: any[];
    }>;
    getSubscriptionStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        platforms: {};
        queueSize: number;
        pendingScheduled: number;
    }>;
    chunkArray(array: any, size: any): any[];
    getVAPIDPublicKey(): any;
    cleanupInactiveSubscriptions(daysInactive?: number): Promise<number>;
}
//# sourceMappingURL=pushNotificationService.d.ts.map
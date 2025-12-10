export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export namespace SMS_TEMPLATES {
    namespace GRADE_ALERT {
        let es: string;
        let en: string;
    }
    namespace ATTENDANCE_ALERT {
        let es_1: string;
        export { es_1 as es };
        let en_1: string;
        export { en_1 as en };
    }
    namespace APPOINTMENT_REMINDER {
        let es_2: string;
        export { es_2 as es };
        let en_2: string;
        export { en_2 as en };
    }
    namespace APPOINTMENT_CONFIRMED {
        let es_3: string;
        export { es_3 as es };
        let en_3: string;
        export { en_3 as en };
    }
    namespace PAYMENT_DUE {
        let es_4: string;
        export { es_4 as es };
        let en_4: string;
        export { en_4 as en };
    }
    namespace EMERGENCY {
        let es_5: string;
        export { es_5 as es };
        let en_5: string;
        export { en_5 as en };
    }
    namespace VERIFICATION {
        let es_6: string;
        export { es_6 as es };
        let en_6: string;
        export { en_6 as en };
    }
    namespace CUSTOM {
        let es_7: string;
        export { es_7 as es };
        let en_7: string;
        export { en_7 as en };
    }
}
export declare let provider: string;
export declare let client: any;
export declare let initialized: boolean;
export declare let rateLimitPerMinute: number;
export declare let sentThisMinute: number;
export declare let lastReset: number;
export declare function initialize(): Promise<void>;
export declare function send(options: any): Promise<{
    success: boolean;
    smsId: any;
    to: any;
    messageLength: any;
    provider: string;
    providerId: any;
}>;
export declare function sendBulk(recipients: any, template: any, params?: {}): Promise<{
    success: any[];
    failed: any[];
    total: any;
}>;
export declare function sendGradeAlert(studentId: any, gradeData: any): Promise<void>;
export declare function sendAppointmentReminder(appointmentId: any): Promise<void>;
export declare function sendVerificationCode(phone: any): Promise<string>;
export declare function verifyCode(phone: any, code: any): Promise<boolean>;
export declare function getHistory(options?: {}): Promise<{
    data: any;
    pagination: {
        page: any;
        limit: any;
        total: any;
        totalPages: number;
    };
}>;
export declare function getStats(): Promise<{
    daily: any;
    summary: {
        total: any;
        sent: any;
        failed: any;
    };
}>;
export declare function _initTwilio(): Promise<void>;
export declare function _initVonage(): Promise<void>;
export declare function _initAWSSNS(): Promise<void>;
export declare function _sendViaProvider(to: any, message: any): Promise<{
    sid: string;
    status: string;
    to: any;
    body: any;
}>;
export declare function _simulateSend(to: any, message: any): Promise<{
    sid: string;
    status: string;
    to: any;
    body: any;
}>;
export declare function _buildMessage(template: any, params: any, language: any): any;
export declare function _cleanPhoneNumber(phone: any): any;
export declare function _isValidPhone(phone: any): boolean;
export declare function _checkRateLimit(): Promise<void>;
export declare function _generateCode(length: any): string;
export declare function _formatDate(date: any): string;
export declare function _delay(ms: any): Promise<any>;
//# sourceMappingURL=SMSNotificationService.d.ts.map
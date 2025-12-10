import nodemailer = require("nodemailer");
export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export namespace EMAIL_TEMPLATES {
    namespace WELCOME {
        namespace subject {
            let es: string;
            let en: string;
        }
        let body: string;
    }
    namespace GRADE_ALERT {
        export namespace subject_1 {
            let es_1: string;
            export { es_1 as es };
            let en_1: string;
            export { en_1 as en };
        }
        export { subject_1 as subject };
        let body_1: string;
        export { body_1 as body };
    }
    namespace APPOINTMENT_REMINDER {
        export namespace subject_2 {
            let es_2: string;
            export { es_2 as es };
            let en_2: string;
            export { en_2 as en };
        }
        export { subject_2 as subject };
        let body_2: string;
        export { body_2 as body };
    }
    namespace PASSWORD_RESET {
        export namespace subject_3 {
            let es_3: string;
            export { es_3 as es };
            let en_3: string;
            export { en_3 as en };
        }
        export { subject_3 as subject };
        let body_3: string;
        export { body_3 as body };
    }
    namespace ATTENDANCE_ALERT {
        export namespace subject_4 {
            let es_4: string;
            export { es_4 as es };
            let en_4: string;
            export { en_4 as en };
        }
        export { subject_4 as subject };
        let body_4: string;
        export { body_4 as body };
    }
    namespace NEWSLETTER {
        export namespace subject_5 {
            let es_5: string;
            export { es_5 as es };
            let en_5: string;
            export { en_5 as en };
        }
        export { subject_5 as subject };
        let body_5: string;
        export { body_5 as body };
    }
    namespace EMAIL_VERIFICATION {
        export namespace subject_6 {
            let es_6: string;
            export { es_6 as es };
            let en_6: string;
            export { en_6 as en };
        }
        export { subject_6 as subject };
        let body_6: string;
        export { body_6 as body };
    }
}
export declare let transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-pool").SentMessageInfo, import("nodemailer/lib/smtp-pool").Options>;
export declare let defaultFrom: string;
export declare let schoolName: string;
export declare let baseUrl: string;
export declare function initialize(): Promise<void>;
export declare function send(options: any): Promise<{
    success: boolean;
    messageId: string;
    to: any;
    template: any;
}>;
export declare function sendBulk(recipients: any, template: any, commonVariables?: {}): Promise<{
    sent: any[];
    failed: any[];
    total: any;
}>;
export declare function preview(template: any, variables?: {}, language?: string): {
    subject: any;
    html: any;
};
export declare function getAvailableTemplates(): {
    id: string;
    name: string;
    subjects: any;
}[];
export declare function getHistory(options?: {}): Promise<{
    data: any;
    pagination: {
        page: any;
        limit: any;
    };
}>;
export declare function getStats(days?: number): Promise<{
    period: string;
    total: number;
    byTemplate: {};
    byStatus: {
        sent: number;
        failed: number;
    };
}>;
export declare function _compileTemplate(template: any, variables: any): any;
export declare function _delay(ms: any): Promise<any>;
//# sourceMappingURL=EmailTemplateService.d.ts.map
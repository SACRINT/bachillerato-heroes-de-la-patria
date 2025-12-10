/**
 * 📱 SMS NOTIFICATION DAO - TypeScript
 * Data Access Object para notificaciones SMS
 * Abstrae todas las queries SQL de SMSNotificationService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface StudentParentInfo {
    student_name: string;
    apellido_paterno: string;
    parent_phone: string;
    idioma_preferido: string;
}
export interface AppointmentInfo {
    id: number;
    phone: string;
    telefono: string;
    idioma_preferido: string;
    [key: string]: any;
}
export interface VerificationCode {
    id: number;
    phone: string;
    code: string;
    expires_at: Date;
    created_at: Date;
}
export interface SMSLogEntry {
    id: number;
    phone_to: string;
    message: string;
    template: string;
    status: string;
    priority: string;
    provider_id?: string;
    created_at: Date;
    updated_at?: Date;
}
export interface SMSInput {
    to: string;
    message: string;
    template: string;
    status: string;
    priority: string;
}
export interface SMSStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    day: Date;
}
declare class SMSNotificationDAO {
    static getStudentParents(studentId: number): Promise<StudentParentInfo[]>;
    static getAppointment(appointmentId: number): Promise<AppointmentInfo | null>;
    static saveVerificationCode(phone: string, code: string): Promise<void>;
    static getValidCode(phone: string, code: string): Promise<VerificationCode | null>;
    static deleteCode(phone: string): Promise<void>;
    static logSMS(data: SMSInput): Promise<number>;
    static updateSMSStatus(id: number, status: string, providerId: string): Promise<void>;
    static getHistory(whereClause: string, params: any[], limit: number, offset: number): Promise<SMSLogEntry[]>;
    static getHistoryCount(whereClause: string, params: any[]): Promise<number>;
    static getStats(): Promise<SMSStats[]>;
}
export default SMSNotificationDAO;
//# sourceMappingURL=sms-notification.dao.d.ts.map
export interface ParentCredential {
    id: number;
    student_id: number;
    username: string;
    password_hash: string;
    status: 'active' | 'claimed' | 'expired';
    created_at: Date;
    expires_at: Date | null;
}
export declare class ParentCredentialsDAO {
    static initTable(): Promise<void>;
    /**
     * Genera credenciales para una lista de estudiantes
     * @param studentIds Lista de IDs de estudiantes
     * @returns Lista de credenciales generadas (incluyendo password temporal en texto plano SOLO AQUI)
     */
    static generateBatch(studentIds: number[]): Promise<Array<{
        student_id: number;
        username: string;
        temp_pass: string;
    }>>;
    static verifyCredential(username: string, password: string): Promise<ParentCredential | null>;
    static markAsClaimed(id: number): Promise<void>;
    static getAllActive(): Promise<any[]>;
}
export default ParentCredentialsDAO;
//# sourceMappingURL=parent-credentials.dao.d.ts.map
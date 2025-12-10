/**
 * 🎯 CMS SERVICE - TypeScript Version
 * Gestión de contenido para BGE
 * Soporte MySQL y fallback JSON
 * Refactorizado: 07 Diciembre 2025
 */
export type ContentType = 'aviso' | 'noticia' | 'evento' | 'comunicado';
export type ContentPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type ContentStatus = 'borrador' | 'publicado' | 'archivado';
export interface CMSContent {
    id: number | string;
    type: ContentType;
    title: string;
    content: string;
    image_url?: string;
    priority: ContentPriority;
    status: ContentStatus;
    author_id?: number;
    updated_by?: number;
    publish_date?: Date | string;
    expire_date?: Date | string;
    metadata?: Record<string, any>;
    created_at: Date | string;
    updated_at?: Date | string;
}
export interface CMSFilters {
    type?: ContentType;
    status?: ContentStatus | 'all';
    priority?: ContentPriority;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface CMSStats {
    detailed: any[];
    summary: {
        total: number;
        published: number;
        draft: number;
        urgent: number;
    };
    last_updated: string;
}
declare class CMSService {
    private dbAvailable;
    private db;
    private jsonPath;
    constructor();
    private initialize;
    private ensureTablesExist;
    private ensureJsonStructure;
    getContent(filters?: CMSFilters): Promise<{
        content: CMSContent[];
        total: number;
    }>;
    private getContentFromDB;
    private getContentFromJSON;
    getContentById(id: number | string): Promise<CMSContent | null>;
    createContent(contentData: Partial<CMSContent>): Promise<CMSContent>;
    updateContent(id: number | string, updateData: Partial<CMSContent>): Promise<CMSContent | null>;
    deleteContent(id: number | string): Promise<boolean>;
    publishContent(id: number | string, userId: number): Promise<CMSContent | null>;
    archiveContent(id: number | string, userId: number): Promise<CMSContent | null>;
    getRecentContent(options?: {
        limit?: number;
        type?: ContentType;
    }): Promise<CMSContent[]>;
    getUrgentContent(): Promise<CMSContent[]>;
    getCMSStats(): Promise<CMSStats>;
}
declare const cmsService: CMSService;
export { CMSService };
export default cmsService;
//# sourceMappingURL=cms.service.d.ts.map
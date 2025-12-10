/**
 * 📰 NOTICIAS DAO - TypeScript
 * Capa de acceso a datos para noticias.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface NoticiaRow {
    id: number;
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria: string;
    etiquetas?: string[];
    estado: 'borrador' | 'publicada' | 'archivada';
    autor: string;
    autor_id?: number;
    slug: string;
    meta_descripcion?: string;
    destacada: boolean;
    ip_address?: string;
    user_agent?: string;
    vistas: number;
    fecha_publicacion?: Date;
    fecha_creacion: Date;
    fecha_modificacion?: Date;
}
export interface NoticiaCreateData {
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria?: string;
    etiquetas?: string[];
    estado?: string;
    autor: string;
    autor_id?: number;
    slug: string;
    meta_descripcion?: string;
    destacada?: boolean;
    ip_address?: string;
    user_agent?: string;
}
export interface NoticiaFilters {
    estado?: string;
    categoria?: string;
    destacada?: boolean | string;
    limit?: number;
    offset?: number;
}
export interface NoticiaStats {
    total: number;
    publicadas: number;
    borradores: number;
    destacadas: number;
    vistas_totales: number;
}
declare class NoticiasDAO {
    static slugExists(slug: string): Promise<boolean>;
    static create(noticiaData: NoticiaCreateData): Promise<NoticiaRow>;
    static getAll(filters: NoticiaFilters): Promise<{
        noticias: NoticiaRow[];
        total: number;
    }>;
    static getStats(): Promise<NoticiaStats>;
    static getById(id: number): Promise<NoticiaRow | null>;
    static getBySlug(slug: string): Promise<NoticiaRow | null>;
    static incrementViews(identifier: number | string, type?: 'id' | 'slug'): Promise<void>;
    static update(id: number, updateData: Partial<NoticiaCreateData>): Promise<NoticiaRow | null>;
}
export default NoticiasDAO;
//# sourceMappingURL=noticias.dao.d.ts.map
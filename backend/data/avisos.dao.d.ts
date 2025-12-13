/**
 * 📰 AVISOS DAO - TypeScript
 * Capa de acceso a datos para avisos (usa tabla 'noticias').
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface AvisoRow {
    id: number;
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria: string;
    autor_id: number;
    publico: boolean;
    destacada: boolean;
    fecha_publicacion: Date;
    fecha_actualizacion?: Date;
    activa: boolean;
    visualizaciones: number;
    slug?: string;
}
export interface AvisoCreateData {
    titulo: string;
    contenido: string;
    resumen?: string;
    imagen_url?: string;
    categoria?: string;
    etiquetas?: string[];
    estado?: string;
    autor?: string;
    autor_id?: number;
    meta_descripcion?: string;
    destacada?: boolean;
    slug?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface AvisoUpdateData {
    titulo?: string;
    contenido?: string;
    resumen?: string;
    imagen_url?: string;
    categoria?: string;
    etiquetas?: string[];
    estado?: string;
    destacada?: boolean;
}
export interface AvisoFilters {
    estado?: string;
    categoria?: string;
    destacada?: boolean | string;
    limit?: number;
    offset?: number;
}
export interface AvisoStats {
    total: number;
    publicadas: number;
    borradores: number;
    destacadas: number;
    vistas_totales: number;
}
declare class AvisosDAO {
    static slugExists(slug: string): Promise<boolean>;
    static create(avisoData: AvisoCreateData): Promise<AvisoRow>;
    static getAll(filters: AvisoFilters): Promise<{
        avisos: AvisoRow[];
        total: number;
    }>;
    static getStats(): Promise<AvisoStats>;
    static getById(id: number): Promise<AvisoRow | null>;
    static getBySlug(slug: string): Promise<AvisoRow | null>;
    static incrementViews(identifier: number | string, type?: 'id' | 'slug'): Promise<void>;
    static update(id: number, updateData: AvisoUpdateData): Promise<AvisoRow | null>;
}
export default AvisosDAO;
//# sourceMappingURL=avisos.dao.d.ts.map
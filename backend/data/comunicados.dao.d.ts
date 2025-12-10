/**
 * 📢 COMUNICADOS DAO - TypeScript
 * Capa de acceso a datos para comunicados.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface ComunicadoRow {
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
export interface ComunicadoCreateData {
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
export interface ComunicadoFilters {
    estado?: string;
    categoria?: string;
    destacada?: boolean | string;
    limit?: number;
    offset?: number;
}
declare class ComunicadosDAO {
    static slugExists(slug: string): Promise<boolean>;
    static create(data: ComunicadoCreateData): Promise<ComunicadoRow>;
    static getAll(filters: ComunicadoFilters): Promise<{
        comunicados: ComunicadoRow[];
        total: number;
    }>;
    static getStats(): Promise<{
        total: number;
        publicadas: number;
        borradores: number;
        destacadas: number;
        vistas_totales: number;
    }>;
    static getById(id: number): Promise<ComunicadoRow | null>;
    static getBySlug(slug: string): Promise<ComunicadoRow | null>;
    static incrementViews(identifier: number | string, type?: 'id' | 'slug'): Promise<void>;
    static update(id: number, data: Partial<ComunicadoCreateData>): Promise<ComunicadoRow | null>;
    static archive(id: number): Promise<{
        id: number;
        titulo: string;
    } | null>;
}
export default ComunicadosDAO;
//# sourceMappingURL=comunicados.dao.d.ts.map
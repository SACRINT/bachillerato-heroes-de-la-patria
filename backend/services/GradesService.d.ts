export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export declare function getAll(options?: {}): Promise<{
    success: boolean;
    data: any;
    total: any;
    pagination: {
        limit: any;
        offset: any;
    };
}>;
export declare function getById(id: any): Promise<{
    success: boolean;
    data: {
        id: any;
        estudianteId: any;
        estudianteNombre: string;
        materiaId: any;
        materiaNombre: any;
        calificacion: number;
        tipoEvaluacion: any;
        periodoAcademico: any;
        observaciones: any;
        docenteId: any;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function getByStudent(estudianteId: any): Promise<{
    success: boolean;
    data: {
        calificaciones: any;
        porMateria: {};
        promedio: string;
        total: any;
    };
}>;
export declare function create(data: any): Promise<{
    success: boolean;
    data: {
        id: any;
        estudianteId: any;
        estudianteNombre: string;
        materiaId: any;
        materiaNombre: any;
        calificacion: number;
        tipoEvaluacion: any;
        periodoAcademico: any;
        observaciones: any;
        docenteId: any;
        createdAt: any;
        updatedAt: any;
    };
    message: string;
}>;
export declare function update(id: any, data: any): Promise<{
    success: boolean;
    data: {
        id: any;
        estudianteId: any;
        estudianteNombre: string;
        materiaId: any;
        materiaNombre: any;
        calificacion: number;
        tipoEvaluacion: any;
        periodoAcademico: any;
        observaciones: any;
        docenteId: any;
        createdAt: any;
        updatedAt: any;
    };
    message: string;
}>;
declare function _delete(id: any): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getStats(options?: {}): Promise<{
    success: boolean;
    data: {
        total: number;
        promedio: string;
        minimo: number;
        maximo: number;
        desviacion: string;
    };
}>;
export declare function bulkCreate(grades: any): Promise<{
    success: boolean;
    data: any;
    count: any;
    message: string;
}>;
export declare function _transformGrade(grade: any): {
    id: any;
    estudianteId: any;
    estudianteNombre: string;
    materiaId: any;
    materiaNombre: any;
    calificacion: number;
    tipoEvaluacion: any;
    periodoAcademico: any;
    observaciones: any;
    docenteId: any;
    createdAt: any;
    updatedAt: any;
};
export { _delete as delete };
//# sourceMappingURL=GradesService.d.ts.map
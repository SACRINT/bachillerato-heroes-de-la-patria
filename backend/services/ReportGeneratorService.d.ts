export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export declare function studentGradesReport(estudianteId: any, options?: {}): Promise<{
    success: boolean;
    data: {
        tipo: string;
        generadoEn: string;
        estudiante: {
            id: any;
            matricula: any;
            nombre: string;
            semestre: any;
            especialidad: any;
        };
        ciclo: any;
        materias: {
            nombre: string;
            parciales: any;
            promedio: any;
        }[];
        promedioGeneral: string;
        totalMaterias: number;
        totalCalificaciones: any;
    };
}>;
export declare function groupReport(options?: {}): Promise<{
    success: boolean;
    data: {
        tipo: string;
        generadoEn: string;
        filtros: {
            semestre: any;
            grado: any;
            ciclo: any;
        };
        estadisticas: {
            totalEstudiantes: number;
            promedioGeneral: string;
            totalCalificaciones: number;
            aprobadas: number;
            reprobadas: number;
            tasaAprobacion: string;
        };
        topEstudiantes: any;
        porMateria: any;
    };
}>;
export declare function trendsReport(options?: {}): Promise<{
    success: boolean;
    data: {
        tipo: string;
        generadoEn: string;
        periodos: any;
        promediosMensuales: any;
        inscripcionesMensuales: any;
        distribucionCalificaciones: any;
    };
}>;
export declare function teacherReport(docenteId: any): Promise<{
    success: boolean;
    data: {
        tipo: string;
        generadoEn: string;
        docente: {
            id: any;
            nombre: string;
            especialidad: any;
            email: any;
        };
        estadisticas: {
            totalCalificaciones: number;
            totalEstudiantes: number;
            promedioGeneral: string;
            aprobados: number;
            reprobados: number;
        };
        porMateria: any;
    };
}>;
export declare function executiveReport(): Promise<{
    success: boolean;
    data: {
        tipo: string;
        generadoEn: string;
        kpis: {
            estudiantesActivos: number;
            totalDocentes: number;
            promedioMes: string;
            tasaAprobacion: string;
        };
        comparativa: {
            promedioActual: string;
            promedioAnterior: string;
            variacion: string;
        };
        alertas: {
            tipo: string;
            mensaje: string;
        }[];
    };
}>;
//# sourceMappingURL=ReportGeneratorService.d.ts.map
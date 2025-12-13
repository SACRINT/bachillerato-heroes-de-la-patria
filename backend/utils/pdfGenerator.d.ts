import { Response } from 'express';
interface SubjectGrade {
    materia: string;
    profesor: string;
    parcial1?: number | string;
    parcial2?: number | string;
    parcial3?: number | string;
    promedioFinal: number | string;
    faltas: number;
}
interface ReportCardData {
    studentName: string;
    matricula: string;
    grupo: string;
    cicloEscolar: string;
    promedioGeneral: number | string;
    grades: SubjectGrade[];
}
export declare const generateReportCardPDF: (data: ReportCardData, res: Response) => void;
export {};
//# sourceMappingURL=pdfGenerator.d.ts.map
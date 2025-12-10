declare const _exports: ExamsService;
export = _exports;
/**
 * EXAMS SERVICE - SEMANA 7-8
 * Sistema de Exámenes completo (0% → 100%)
 */
declare class ExamsService {
    create(exam: any): Promise<void>;
    takeExam(examId: any, studentId: any): Promise<void>;
    submitExam(examId: any, answers: any): Promise<void>;
    autoGrade(examId: any): Promise<void>;
}
//# sourceMappingURL=exams.service.d.ts.map
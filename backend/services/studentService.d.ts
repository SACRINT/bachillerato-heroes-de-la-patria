declare const _exports: {
    getStudents(filters?: {}): any;
    getStudentById(id: any): any;
    createStudent(data: any): Promise<any>;
    updateStudent(id: any, data: any): Promise<any>;
    deleteStudent(id: any): Promise<boolean>;
    getStudentGrades(studentId: any): Promise<any>;
    getStudentAttendance(studentId: any): Promise<any>;
    getStats(filters?: {}): Promise<{
        total_students: any;
        active_students: any;
    }>;
    getAll(filters?: {}, pagination?: {
        page: number;
        limit: number;
    }): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    _validateStudentData(data: any): void;
    readonly __esModule: boolean;
    default: {
        getStudents(filters?: {}): any;
        getStudentById(id: any): any;
        createStudent(data: any): Promise<any>;
        updateStudent(id: any, data: any): Promise<any>;
        deleteStudent(id: any): Promise<boolean>;
        getStudentGrades(studentId: any): Promise<any>;
        getStudentAttendance(studentId: any): Promise<any>;
        getStats(filters?: {}): Promise<{
            total_students: any;
            active_students: any;
        }>;
        getAll(filters?: {}, pagination?: {
            page: number;
            limit: number;
        }): Promise<{
            data: any;
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        }>;
        _validateStudentData(data: any): void;
    };
};
export = _exports;
//# sourceMappingURL=studentService.d.ts.map
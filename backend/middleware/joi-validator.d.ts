/**
 * Middleware de validación
 */
export function validate(schema: any, source?: string): (req: any, res: any, next: any) => any;
declare namespace commonSchemas {
    let id: any;
    let pagination: any;
    let email: any;
    let password: any;
    let phone: any;
    let matricula: any;
    let curp: any;
    let date: any;
    let uuid: any;
}
declare const studentSchema: any;
declare const gradeSchema: any;
declare const userSchema: any;
declare const loginSchema: any;
declare const contactSchema: any;
declare const notificationSchema: any;
declare const searchQuerySchema: any;
declare const dateRangeSchema: any;
export declare namespace schemas {
    export { commonSchemas as common };
    export { studentSchema as student };
    export { gradeSchema as grade };
    export { userSchema as user };
    export { loginSchema as login };
    export { contactSchema as contact };
    export { notificationSchema as notification };
    export { searchQuerySchema as searchQuery };
    export { dateRangeSchema as dateRange };
}
export { Joi };
//# sourceMappingURL=joi-validator.d.ts.map
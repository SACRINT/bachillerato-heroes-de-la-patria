export = JSONToMySQLMigrator;
declare class JSONToMySQLMigrator {
    connection: mysql.Connection;
    migrationStats: {
        totalFiles: number;
        migratedFiles: number;
        totalRecords: number;
        migratedRecords: number;
        errors: any[];
    };
    initialize(): Promise<void>;
    createDatabase(): Promise<void>;
    createTables(): Promise<void>;
    readJSONFile(filename: any): Promise<any>;
    migrateUsers(): Promise<void>;
    migrateEstudiantes(): Promise<void>;
    migrateDocentes(): Promise<void>;
    migrateNoticias(): Promise<void>;
    migrateEventos(): Promise<void>;
    migrateDashboardStats(): Promise<void>;
    runMigration(): Promise<void>;
}
import mysql = require("mysql2/promise");
//# sourceMappingURL=migrate-json-to-mysql.d.ts.map
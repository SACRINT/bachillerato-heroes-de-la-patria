"use strict";
/**
 * 🎫 SISTEMA DE TICKETS DE SOPORTE - API REST
 * Sistema completo de tickets con SLA tracking, asignación y resolución
 * Migrado: 08 Diciembre 2025
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var multer_1 = __importDefault(require("multer"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var debug_logger_1 = require("../utils/debug-logger");
var sanitized_errors_1 = require("../utils/sanitized-errors");
var database_1 = require("../config/database");
var auth_1 = require("../middleware/auth");
var router = express_1.default.Router();
// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        var uploadDir = path_1.default.join(__dirname, '../../uploads/tickets');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        var sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, "ticket-".concat(uniqueSuffix, "-").concat(sanitizedName));
    }
});
var upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        var allowedTypes = [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg', 'image/png', 'image/gif',
            'text/plain', 'application/zip'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Tipo de archivo no permitido: ".concat(file.mimetype)));
        }
    }
});
// ============================================
// DEPARTAMENTOS
// ============================================
router.get('/departments', auth_1.authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, viewCheck, result, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, database_1.pool.connect()];
            case 1:
                client = _c.sent();
                _c.label = 2;
            case 2:
                _c.trys.push([2, 5, 6, 7]);
                return [4 /*yield*/, client.query("\n            SELECT EXISTS (\n                SELECT 1 FROM information_schema.views \n                WHERE table_name = 'v_support_department_stats'\n            ) as exists\n        ")];
            case 3:
                viewCheck = _c.sent();
                if (!((_a = viewCheck.rows[0]) === null || _a === void 0 ? void 0 : _a.exists)) {
                    // Return empty array with setup_required flag
                    res.json({
                        success: true,
                        departments: [],
                        setup_required: true,
                        message: 'Sistema de tickets no inicializado. Ejecutar script de creación de tablas.'
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, client.query('SELECT * FROM v_support_department_stats ORDER BY name')];
            case 4:
                result = _c.sent();
                res.json({ success: true, departments: result.rows });
                return [3 /*break*/, 7];
            case 5:
                error_1 = _c.sent();
                // Check if error is "does not exist"
                if ((_b = error_1.message) === null || _b === void 0 ? void 0 : _b.includes('does not exist')) {
                    res.json({
                        success: true,
                        departments: [],
                        setup_required: true,
                        message: 'Sistema de tickets no inicializado'
                    });
                    return [2 /*return*/];
                }
                debug_logger_1.debugLog.error('support-tickets', 'Error al obtener departamentos', (0, sanitized_errors_1.sanitizeError)(error_1, 'support-tickets'));
                res.status(500).json({ error: 'Error al obtener departamentos' });
                return [3 /*break*/, 7];
            case 6:
                client.release();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); });
// ============================================
// CATEGORÍAS
// ============================================
router.get('/categories', auth_1.authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, tableCheck, department_id, query, params, result, error_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, database_1.pool.connect()];
            case 1:
                client = _c.sent();
                _c.label = 2;
            case 2:
                _c.trys.push([2, 5, 6, 7]);
                return [4 /*yield*/, client.query("\n            SELECT EXISTS (\n                SELECT 1 FROM information_schema.tables \n                WHERE table_name = 'support_ticket_categories'\n            ) as exists\n        ")];
            case 3:
                tableCheck = _c.sent();
                if (!((_a = tableCheck.rows[0]) === null || _a === void 0 ? void 0 : _a.exists)) {
                    res.json({
                        success: true,
                        categories: [],
                        setup_required: true,
                        message: 'Sistema de tickets no inicializado'
                    });
                    return [2 /*return*/];
                }
                department_id = req.query.department_id;
                query = 'SELECT * FROM support_ticket_categories WHERE is_active = TRUE';
                params = [];
                if (department_id) {
                    params.push(department_id);
                    query += " AND department_id = $".concat(params.length);
                }
                query += ' ORDER BY name';
                return [4 /*yield*/, client.query(query, params)];
            case 4:
                result = _c.sent();
                res.json({ success: true, categories: result.rows });
                return [3 /*break*/, 7];
            case 5:
                error_2 = _c.sent();
                if ((_b = error_2.message) === null || _b === void 0 ? void 0 : _b.includes('does not exist')) {
                    res.json({
                        success: true,
                        categories: [],
                        setup_required: true,
                        message: 'Sistema de tickets no inicializado'
                    });
                    return [2 /*return*/];
                }
                debug_logger_1.debugLog.error('support-tickets', 'Error al obtener categorías', (0, sanitized_errors_1.sanitizeError)(error_2, 'support-tickets'));
                res.status(500).json({ error: 'Error al obtener categorías' });
                return [3 /*break*/, 7];
            case 6:
                client.release();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); });
// ============================================
// TICKETS - CRUD
// ============================================
router.get('/tickets', auth_1.authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, viewCheck, authReq, _a, status_1, priority, category_id, department_id, assigned_to_me, created_by_me, watching, _b, page, _c, limit, _d, sort_by, _e, sort_order, userId, userRole, pageNum, limitNum, offset, query, params, paramCount, statuses, priorities, allowedSortFields, sortField, sortDirection, result, total, error_3;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, database_1.pool.connect()];
            case 1:
                client = _g.sent();
                _g.label = 2;
            case 2:
                _g.trys.push([2, 5, 6, 7]);
                return [4 /*yield*/, client.query("\n            SELECT EXISTS (\n                SELECT 1 FROM information_schema.views \n                WHERE table_name = 'v_support_tickets_full'\n            ) as exists\n        ")];
            case 3:
                viewCheck = _g.sent();
                if (!((_f = viewCheck.rows[0]) === null || _f === void 0 ? void 0 : _f.exists)) {
                    res.json({
                        success: true,
                        tickets: [],
                        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
                        setup_required: true,
                        message: 'Sistema de tickets no inicializado. Ejecutar script de creación de tablas.'
                    });
                    return [2 /*return*/];
                }
                authReq = req;
                _a = req.query, status_1 = _a.status, priority = _a.priority, category_id = _a.category_id, department_id = _a.department_id, assigned_to_me = _a.assigned_to_me, created_by_me = _a.created_by_me, watching = _a.watching, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? '20' : _c, _d = _a.sort_by, sort_by = _d === void 0 ? 'created_at' : _d, _e = _a.sort_order, sort_order = _e === void 0 ? 'DESC' : _e;
                userId = authReq.user.id;
                userRole = authReq.user.role;
                pageNum = parseInt(page);
                limitNum = parseInt(limit);
                offset = (pageNum - 1) * limitNum;
                query = 'SELECT * FROM v_support_tickets_full WHERE 1=1';
                params = [];
                paramCount = 0;
                if (created_by_me === 'true') {
                    paramCount++;
                    query += " AND requester_id = $".concat(paramCount, " AND requester_role = $").concat(paramCount + 1);
                    params.push(userId, userRole);
                    paramCount++;
                }
                if (assigned_to_me === 'true') {
                    paramCount++;
                    query += " AND assigned_to_id = $".concat(paramCount, " AND assigned_to_role = $").concat(paramCount + 1);
                    params.push(userId, userRole);
                    paramCount++;
                }
                if (status_1) {
                    statuses = status_1.split(',');
                    paramCount++;
                    query += " AND status = ANY($".concat(paramCount, ")");
                    params.push(statuses);
                }
                if (priority) {
                    priorities = priority.split(',');
                    paramCount++;
                    query += " AND priority = ANY($".concat(paramCount, ")");
                    params.push(priorities);
                }
                if (category_id) {
                    paramCount++;
                    query += " AND category_id = $".concat(paramCount);
                    params.push(category_id);
                }
                if (department_id) {
                    paramCount++;
                    query += " AND department_id = $".concat(paramCount);
                    params.push(department_id);
                }
                if (watching === 'true') {
                    paramCount++;
                    query += " AND id IN (\n                SELECT ticket_id FROM support_ticket_watchers\n                WHERE user_id = $".concat(paramCount, " AND user_role = $").concat(paramCount + 1, "\n            )");
                    params.push(userId, userRole);
                    paramCount++;
                }
                allowedSortFields = ['created_at', 'updated_at', 'priority', 'status', 'ticket_number'];
                sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
                sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
                if (sortField === 'priority') {
                    query += " ORDER BY CASE priority\n                    WHEN 'urgent' THEN 1 WHEN 'high' THEN 2\n                    WHEN 'medium' THEN 3 WHEN 'low' THEN 4\n                END ".concat(sortDirection);
                }
                else {
                    query += " ORDER BY ".concat(sortField, " ").concat(sortDirection);
                }
                paramCount++;
                query += " LIMIT $".concat(paramCount, " OFFSET $").concat(paramCount + 1);
                params.push(limitNum, offset);
                return [4 /*yield*/, client.query(query, params)];
            case 4:
                result = _g.sent();
                total = 100;
                res.json({
                    success: true,
                    tickets: result.rows,
                    pagination: { page: pageNum, limit: limitNum, total: total, totalPages: Math.ceil(total / limitNum) }
                });
                return [3 /*break*/, 7];
            case 5:
                error_3 = _g.sent();
                debug_logger_1.debugLog.error('support-tickets', 'Error al obtener tickets', (0, sanitized_errors_1.sanitizeError)(error_3, 'support-tickets'));
                res.status(500).json({ error: 'Error al obtener tickets' });
                return [3 /*break*/, 7];
            case 6:
                client.release();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); });
router.post('/tickets', auth_1.authenticateToken, upload.array('attachments', 5), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, authReq, _a, subject, description, category_id, department_id, _b, priority, ticketResult, ticket, _i, _c, file, error_4;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4 /*yield*/, database_1.pool.connect()];
            case 1:
                client = _d.sent();
                _d.label = 2;
            case 2:
                _d.trys.push([2, 10, 12, 13]);
                authReq = req;
                _a = req.body, subject = _a.subject, description = _a.description, category_id = _a.category_id, department_id = _a.department_id, _b = _a.priority, priority = _b === void 0 ? 'medium' : _b;
                if (!subject || !description) {
                    res.status(400).json({ error: 'Asunto y descripción son requeridos' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, client.query('BEGIN')];
            case 3:
                _d.sent();
                return [4 /*yield*/, client.query("\n            INSERT INTO support_tickets (\n                requester_id, requester_role, requester_name, requester_email,\n                subject, description, category_id, department_id, priority\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\n            RETURNING *\n        ", [
                        authReq.user.id, authReq.user.role, authReq.user.name || authReq.user.email, authReq.user.email,
                        subject, description, category_id, department_id, priority
                    ])];
            case 4:
                ticketResult = _d.sent();
                ticket = ticketResult.rows[0];
                if (!(req.files && Array.isArray(req.files))) return [3 /*break*/, 8];
                _i = 0, _c = req.files;
                _d.label = 5;
            case 5:
                if (!(_i < _c.length)) return [3 /*break*/, 8];
                file = _c[_i];
                return [4 /*yield*/, client.query("\n                    INSERT INTO support_ticket_attachments (\n                        ticket_id, uploaded_by_id, uploaded_by_role, uploaded_by_name,\n                        file_name, file_path, file_size, mime_type\n                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n                ", [
                        ticket.id, authReq.user.id, authReq.user.role, authReq.user.name,
                        file.originalname, file.path, file.size, file.mimetype
                    ])];
            case 6:
                _d.sent();
                _d.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 5];
            case 8: return [4 /*yield*/, client.query('COMMIT')];
            case 9:
                _d.sent();
                res.status(201).json({ success: true, ticket: ticket, message: "Ticket ".concat(ticket.ticket_number, " creado exitosamente") });
                return [3 /*break*/, 13];
            case 10:
                error_4 = _d.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 11:
                _d.sent();
                debug_logger_1.debugLog.error('support-tickets', 'Error al crear ticket', (0, sanitized_errors_1.sanitizeError)(error_4, 'support-tickets'));
                res.status(500).json({ error: 'Error al crear ticket' });
                return [3 /*break*/, 13];
            case 12:
                client.release();
                return [7 /*endfinally*/];
            case 13: return [2 /*return*/];
        }
    });
}); });
exports.default = router;

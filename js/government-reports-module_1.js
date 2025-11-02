/**
 * 📊 GOVERNMENT REPORTS MODULE - FASE 6.3
 * Módulo especializado para generación de reportes gubernamentales
 * Cumplimiento con formatos oficiales SEP, SIGED, PLANEA y COSDAC
 */

class GovernmentReportsModule {
    constructor() {
        this.reportTemplates = {
            sep_monthly: {
                name: 'Reporte Mensual SEP',
                format: 'JSON',
                frequency: 'monthly',
                sections: ['enrollment', 'attendance', 'academic_progress', 'infrastructure'],
                deadline: 'last_business_day'
            },
            sep_semester: {
                name: 'Reporte Semestral SEP',
                format: 'XML',
                frequency: 'semester',
                sections: ['academic_results', 'graduation_rates', 'teacher_evaluation', 'facilities'],
                deadline: '30_days_after_semester'
            },
            planea_results: {
                name: 'Resultados PLANEA',
                format: 'JSON',
                frequency: 'annual',
                sections: ['student_scores', 'comparative_analysis', 'improvement_plans'],
                deadline: '60_days_after_application'
            },
            cosdac_statistics: {
                name: 'Estadísticas COSDAC',
                format: 'XML',
                frequency: 'semester',
                sections: ['program_enrollment', 'completion_rates', 'employment_outcomes'],
                deadline: '45_days_after_semester'
            },
            siged_certificates: {
                name: 'Certificados SIGED',
                format: 'XML',
                frequency: 'on_demand',
                sections: ['student_transcripts', 'graduation_certificates', 'partial_certificates'],
                deadline: 'immediate'
            },
            financial_transparency: {
                name: 'Transparencia Financiera',
                format: 'PDF',
                frequency: 'quarterly',
                sections: ['budget_execution', 'resource_allocation', 'audit_results'],
                deadline: '15_days_after_quarter'
            }
        };

        this.reportQueue = [];
        this.scheduledReports = [];
        this.reportHistory = [];
        this.complianceStatus = {};

        this.config = {
            enableAutoGeneration: false, // Deshabilitado en desarrollo para evitar bucles infinitos
            enableComplianceChecking: true,
            enableDigitalSignature: true,
            retentionPeriod: 5, // años
            maxRetries: 3,
            outputDirectory: '/reports/government/'
        };

        this.deadlineMonitor = new Map();

        this.init();
    }

    async init() {
        this.loadReportHistory();
        this.setupDeadlineMonitor();
        this.scheduleAutomaticReports();
        this.initializeComplianceChecker();

        console.log('📊 Government Reports Module inicializado');
        console.log(`📋 Plantillas disponibles: ${Object.keys(this.reportTemplates).length}`);
    }

    // === GENERACIÓN DE REPORTES ===

    async generateReport(reportType, period = null, customData = null) {
        if (!this.reportTemplates[reportType]) {
            throw new Error(`Tipo de reporte no reconocido: ${reportType}`);
        }

        const template = this.reportTemplates[reportType];
        const reportId = this.generateReportId(reportType, period);

        console.log(`📄 Generando reporte: ${template.name}`);

        try {
            // Preparar datos del reporte
            const reportData = await this.prepareReportData(reportType, period, customData);

            // Generar contenido según el formato
            let reportContent;
            switch (template.format) {
                case 'JSON':
                    reportContent = await this.generateJSONReport(reportData, template);
                    break;
                case 'XML':
                    reportContent = await this.generateXMLReport(reportData, template);
                    break;
                case 'PDF':
                    reportContent = await this.generatePDFReport(reportData, template);
                    break;
                default:
                    throw new Error(`Formato no soportado: ${template.format}`);
            }

            // Aplicar firma digital si está habilitada
            if (this.config.enableDigitalSignature) {
                reportContent = await this.applyDigitalSignature(reportContent, reportId);
            }

            // Validar cumplimiento
            const complianceCheck = await this.validateCompliance(reportContent, template);

            // Crear reporte final
            const finalReport = {
                id: reportId,
                type: reportType,
                template: template.name,
                format: template.format,
                period: period,
                generatedAt: new Date().toISOString(),
                content: reportContent,
                compliance: complianceCheck,
                status: complianceCheck.valid ? 'ready' : 'needs_review',
                metadata: {
                    generator: 'BGE Héroes de la Patria - Government Reports Module',
                    version: '1.0',
                    school: {
                        cct: '21EBH0200X',
                        name: 'Bachillerato General Estatal "Héroes de la Patria"',
                        director: 'Ing. Samuel Cruz Interial'
                    }
                }
            };

            // Guardar reporte
            await this.saveReport(finalReport);

            // Registrar en historial
            this.addToHistory(finalReport);

            console.log(`✅ Reporte generado exitosamente: ${reportId}`);
            return finalReport;

        } catch (error) {
            console.error(`❌ Error generando reporte ${reportType}:`, error);
            throw error;
        }
    }

    async prepareReportData(reportType, period, customData) {
        const dataCollectors = {
            sep_monthly: () => this.collectSEPMonthlyData(period),
            sep_semester: () => this.collectSEPSemesterData(period),
            planea_results: () => this.collectPLANEAData(period),
            cosdac_statistics: () => this.collectCOSDACData(period),
            siged_certificates: () => this.collectSIGEDData(period),
            financial_transparency: () => this.collectFinancialData(period)
        };

        const collector = dataCollectors[reportType];
        if (!collector) {
            throw new Error(`Colector de datos no disponible para: ${reportType}`);
        }

        let baseData = await collector();

        // Combinar con datos personalizados si se proporcionan
        if (customData) {
            baseData = { ...baseData, ...customData };
        }

        return baseData;
    }

    // === COLECTORES DE DATOS ===

    async collectSEPMonthlyData(period) {
        const currentDate = new Date();
        const reportMonth = period || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        return {
            reportPeriod: reportMonth,
            school: {
                cct: '21EBH0200X',
                name: 'Bachillerato General Estatal "Héroes de la Patria"',
                level: 'Educación Media Superior',
                modality: 'Presencial',
                address: 'C. Manuel Ávila Camacho #7, Col. Centro, Coronel Tito Hernández',
                municipality: 'Venustiano Carranza',
                state: 'Puebla'
            },
            enrollment: {
                totalStudents: 120,
                newEnrollments: 8,
                dropouts: 2,
                transfers: { in: 1, out: 1 },
                demographics: {
                    male: 58,
                    female: 62,
                    ageDistribution: {
                        '15-16': 35,
                        '17-18': 70,
                        '19+': 15
                    }
                }
            },
            attendance: {
                averageAttendance: 95.2,
                absenceReasons: {
                    health: 45,
                    family: 20,
                    transportation: 15,
                    other: 20
                },
                punctuality: 97.8
            },
            academicProgress: {
                overallGPA: 8.3,
                approvalRate: 87.5,
                subjectPerformance: {
                    mathematics: { average: 7.8, approval: 85 },
                    spanish: { average: 8.5, approval: 92 },
                    sciences: { average: 8.1, approval: 89 },
                    history: { average: 8.7, approval: 94 }
                }
            },
            infrastructure: {
                classrooms: { total: 8, functional: 8, needsMaintenance: 0 },
                laboratories: { total: 3, functional: 3, needsMaintenance: 0 },
                library: { available: true, functional: true, volumes: 1200 },
                workshops: { total: 4, functional: 4, needsMaintenance: 1 },
                technology: {
                    computers: 25,
                    internetConnection: true,
                    digitalBoards: 3
                }
            },
            staff: {
                teachers: {
                    total: 12,
                    certified: 12,
                    averageExperience: 23,
                    professionalDevelopment: 15
                },
                administrative: {
                    total: 3,
                    positions: ['Director', 'Secretario Académico', 'Contador']
                }
            }
        };
    }

    async collectSEPSemesterData(period) {
        const currentYear = new Date().getFullYear();
        const semester = period || `${currentYear}-1`;

        return {
            reportPeriod: semester,
            academicResults: {
                semesterGPA: 8.3,
                graduationRate: 92.1,
                promotionRate: 87.5,
                specialtyResults: {
                    'Comunicación Gráfica': { completion: 96, certification: 89 },
                    'Preparación de Alimentos': { completion: 94, certification: 91 },
                    'Instalaciones Residenciales': { completion: 92, certification: 87 }
                }
            },
            teacherEvaluation: {
                averageRating: 8.7,
                professionalDevelopment: {
                    coursesCompleted: 25,
                    certifications: 8,
                    workshops: 12
                },
                studentSatisfaction: 89.3
            },
            facilities: {
                maintenanceCompleted: 95,
                safetyCompliance: 100,
                upgrades: ['Laboratorio de Ciencias', 'Taller de Instalaciones'],
                futureNeeds: ['Ampliación de biblioteca', 'Equipamiento deportivo']
            },
            projects: {
                ctimProjects: 8,
                communityService: 15,
                extracurricular: 12,
                achievements: ['Primer lugar en Feria de Ciencias Regional']
            }
        };
    }

    async collectPLANEAData(period) {
        const testYear = period || new Date().getFullYear();

        return {
            testCycle: testYear,
            participation: {
                totalEligible: 45,
                totalParticipants: 44,
                participationRate: 97.8
            },
            results: {
                mathematics: {
                    schoolAverage: 485,
                    nationalAverage: 500,
                    stateAverage: 478,
                    performanceLevels: {
                        level1: 15, // Insuficiente
                        level2: 18, // Básico
                        level3: 8,  // Satisfactorio
                        level4: 3   // Sobresaliente
                    }
                },
                reading: {
                    schoolAverage: 512,
                    nationalAverage: 495,
                    stateAverage: 488,
                    performanceLevels: {
                        level1: 8,
                        level2: 15,
                        level3: 15,
                        level4: 6
                    }
                }
            },
            analysis: {
                strengths: ['Comprensión lectora', 'Análisis de textos'],
                areasForImprovement: ['Resolución de problemas matemáticos', 'Geometría'],
                recommendedActions: [
                    'Reforzar enseñanza de matemáticas aplicadas',
                    'Implementar talleres de razonamiento lógico',
                    'Aumentar práctica con problemas contextualizados'
                ]
            }
        };
    }

    async collectCOSDACData(period) {
        const reportSemester = period || `${new Date().getFullYear()}-1`;

        return {
            reportPeriod: reportSemester,
            programEnrollment: {
                totalPrograms: 3,
                totalEnrolled: 120,
                programDistribution: {
                    'Comunicación Gráfica': 35,
                    'Preparación de Alimentos Artesanales': 42,
                    'Instalaciones Residenciales': 43
                }
            },
            completionRates: {
                overall: 92.1,
                byProgram: {
                    'Comunicación Gráfica': 94.3,
                    'Preparación de Alimentos Artesanales': 91.7,
                    'Instalaciones Residenciales': 90.5
                }
            },
            employmentOutcomes: {
                graduatesTracked: 25,
                employed: 18,
                continuingEducation: 5,
                seeking: 2,
                employmentSectors: {
                    'Diseño y Comunicación': 8,
                    'Gastronomía': 6,
                    'Construcción y Mantenimiento': 4
                }
            },
            competencyDevelopment: {
                technicalSkills: 88.5,
                socialSkills: 92.3,
                entrepreneurship: 76.8,
                digitalLiteracy: 89.7
            }
        };
    }

    async collectSIGEDData(period) {
        return {
            reportPeriod: period || 'current',
            certificateRequests: {
                total: 15,
                processed: 13,
                pending: 2,
                types: {
                    graduation: 8,
                    partial: 5,
                    transcript: 2
                }
            },
            documentValidation: {
                verified: 98,
                pending: 2,
                rejected: 0
            },
            digitalSignatures: {
                applied: 13,
                verified: 13,
                pending: 0
            }
        };
    }

    async collectFinancialData(period) {
        const currentYear = new Date().getFullYear();
        const quarter = period || `${currentYear}-Q1`;

        return {
            reportPeriod: quarter,
            budget: {
                allocated: 2850000,
                executed: 2156000,
                executionRate: 75.6,
                remaining: 694000
            },
            resourceAllocation: {
                personnel: { allocated: 1800000, executed: 1800000 },
                infrastructure: { allocated: 500000, executed: 256000 },
                materials: { allocated: 350000, executed: 100000 },
                services: { allocated: 200000, executed: 0 }
            },
            transparency: {
                contractsPublished: 5,
                procurementProcesses: 3,
                auditCompliance: 100
            }
        };
    }

    // === GENERADORES DE FORMATO ===

    async generateJSONReport(data, template) {
        const jsonReport = {
            header: {
                reportType: template.name,
                format: 'JSON',
                version: '1.0',
                generatedAt: new Date().toISOString(),
                validUntil: this.calculateValidityPeriod(template),
                school: data.school || {
                    cct: '21EBH0200X',
                    name: 'Bachillerato General Estatal "Héroes de la Patria"'
                }
            },
            body: {
                ...data
            },
            footer: {
                digitalSignature: null, // Se aplicará después
                submissionDate: new Date().toISOString(),
                responsiblePerson: 'Ing. Samuel Cruz Interial',
                position: 'Director'
            }
        };

        return JSON.stringify(jsonReport, null, 2);
    }

    async generateXMLReport(data, template) {
        const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
        const xmlReport = `
        <governmentReport>
            <header>
                <reportType>${template.name}</reportType>
                <format>XML</format>
                <version>1.0</version>
                <generatedAt>${new Date().toISOString()}</generatedAt>
                <validUntil>${this.calculateValidityPeriod(template)}</validUntil>
                <school>
                    <cct>21EBH0200X</cct>
                    <name>Bachillerato General Estatal "Héroes de la Patria"</name>
                </school>
            </header>
            <body>
                ${this.objectToXML(data)}
            </body>
            <footer>
                <digitalSignature></digitalSignature>
                <submissionDate>${new Date().toISOString()}</submissionDate>
                <responsiblePerson>Ing. Samuel Cruz Interial</responsiblePerson>
                <position>Director</position>
            </footer>
        </governmentReport>
        `;

        return xmlHeader + xmlReport;
    }

    async generatePDFReport(data, template) {
        // Simulación de generación PDF
        // En producción, se usaría una librería como jsPDF o puppeteer
        const pdfContent = {
            metadata: {
                title: template.name,
                author: 'BGE Héroes de la Patria',
                subject: 'Reporte Gubernamental',
                creator: 'Government Reports Module'
            },
            content: data,
            format: 'PDF_SIMULATION',
            pages: Math.ceil(JSON.stringify(data).length / 3000),
            generatedAt: new Date().toISOString()
        };

        return JSON.stringify(pdfContent, null, 2);
    }

    // === VALIDACIÓN Y CUMPLIMIENTO ===

    async validateCompliance(reportContent, template) {
        const validationResults = {
            valid: true,
            errors: [],
            warnings: [],
            validatedAt: new Date().toISOString()
        };

        // Validaciones específicas por tipo de reporte
        try {
            const parsedContent = typeof reportContent === 'string' ?
                JSON.parse(reportContent) : reportContent;

            // Validar estructura requerida
            if (!parsedContent.header) {
                validationResults.errors.push('Falta encabezado del reporte');
                validationResults.valid = false;
            }

            if (!parsedContent.body) {
                validationResults.errors.push('Falta cuerpo del reporte');
                validationResults.valid = false;
            }

            // Validar secciones requeridas
            for (const section of template.sections) {
                if (!this.validateSection(parsedContent.body, section)) {
                    validationResults.warnings.push(`Sección incompleta: ${section}`);
                }
            }

            // Validar datos específicos del reporte
            const specificValidation = await this.validateSpecificRequirements(
                parsedContent,
                template
            );

            validationResults.errors.push(...specificValidation.errors);
            validationResults.warnings.push(...specificValidation.warnings);

            if (specificValidation.errors.length > 0) {
                validationResults.valid = false;
            }

        } catch (error) {
            validationResults.errors.push(`Error de validación: ${error.message}`);
            validationResults.valid = false;
        }

        return validationResults;
    }

    validateSection(body, sectionName) {
        const sectionValidators = {
            enrollment: body => body.enrollment && body.enrollment.totalStudents > 0,
            attendance: body => body.attendance && body.attendance.averageAttendance >= 0,
            academic_progress: body => body.academicProgress && body.academicProgress.overallGPA,
            infrastructure: body => body.infrastructure && Object.keys(body.infrastructure).length > 0,
            academic_results: body => body.academicResults && body.academicResults.semesterGPA,
            graduation_rates: body => body.academicResults && body.academicResults.graduationRate,
            teacher_evaluation: body => body.teacherEvaluation && body.teacherEvaluation.averageRating,
            facilities: body => body.facilities && body.facilities.safetyCompliance,
            student_scores: body => body.results && body.results.mathematics,
            comparative_analysis: body => body.analysis && body.analysis.strengths,
            improvement_plans: body => body.analysis && body.analysis.recommendedActions,
            program_enrollment: body => body.programEnrollment && body.programEnrollment.totalPrograms,
            completion_rates: body => body.completionRates && body.completionRates.overall,
            employment_outcomes: body => body.employmentOutcomes && body.employmentOutcomes.graduatesTracked,
            student_transcripts: body => body.certificateRequests && body.certificateRequests.types,
            graduation_certificates: body => body.certificateRequests && body.certificateRequests.types,
            partial_certificates: body => body.certificateRequests && body.certificateRequests.types,
            budget_execution: body => body.budget && body.budget.executionRate,
            resource_allocation: body => body.resourceAllocation && Object.keys(body.resourceAllocation).length > 0,
            audit_results: body => body.transparency && body.transparency.auditCompliance
        };

        const validator = sectionValidators[sectionName];
        return validator ? validator(body) : true;
    }

    async validateSpecificRequirements(content, template) {
        const errors = [];
        const warnings = [];

        // Validaciones específicas por tipo de reporte
        switch (template.name) {
            case 'Reporte Mensual SEP':
                if (!content.body.school || !content.body.school.cct) {
                    errors.push('CCT de la escuela es obligatorio');
                }
                if (!content.body.enrollment || content.body.enrollment.totalStudents < 0) {
                    errors.push('Datos de matrícula inválidos');
                }
                break;

            case 'Resultados PLANEA':
                if (!content.body.results || !content.body.results.mathematics) {
                    errors.push('Resultados de matemáticas son obligatorios');
                }
                if (!content.body.results || !content.body.results.reading) {
                    errors.push('Resultados de lectura son obligatorios');
                }
                break;

            case 'Estadísticas COSDAC':
                if (!content.body.programEnrollment || content.body.programEnrollment.totalPrograms === 0) {
                    errors.push('Debe haber al menos un programa registrado');
                }
                break;
        }

        return { errors, warnings };
    }

    // === FIRMA DIGITAL ===

    async applyDigitalSignature(content, reportId) {
        if (!this.config.enableDigitalSignature) return content;

        // Simulación de firma digital
        const timestamp = Date.now();
        const contentHash = btoa(content).substring(0, 32);
        const signature = btoa(`${reportId}_${timestamp}_${contentHash}_21EBH0200X`);

        let signedContent;

        try {
            const parsedContent = JSON.parse(content);
            parsedContent.footer = parsedContent.footer || {};
            parsedContent.footer.digitalSignature = signature;
            parsedContent.footer.signatureTimestamp = new Date(timestamp).toISOString();
            signedContent = JSON.stringify(parsedContent, null, 2);
        } catch (error) {
            // Si no es JSON, agregar firma al final
            signedContent = content + `\n<!-- Digital Signature: ${signature} -->`;
        }

        console.log(`🔐 Firma digital aplicada: ${signature.substring(0, 16)}...`);
        return signedContent;
    }

    // === PROGRAMACIÓN Y MONITOREO ===

    setupDeadlineMonitor() {
        // Configurar alertas de fechas límite
        for (const [reportType, template] of Object.entries(this.reportTemplates)) {
            if (template.frequency !== 'on_demand') {
                this.scheduleDeadlineAlert(reportType, template);
            }
        }

        // Verificar alertas cada día
        setInterval(() => {
            this.checkUpcomingDeadlines();
        }, 86400000); // 24 horas
    }

    scheduleDeadlineAlert(reportType, template) {
        const nextDeadline = this.calculateNextDeadline(template);
        const alertDate = new Date(nextDeadline.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 días antes

        this.deadlineMonitor.set(reportType, {
            nextDeadline: nextDeadline,
            alertDate: alertDate,
            template: template
        });
    }

    calculateNextDeadline(template) {
        const now = new Date();
        let deadline = new Date();

        switch (template.frequency) {
            case 'monthly':
                deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes
                break;
            case 'semester':
                // Semestre termina en enero y julio
                if (now.getMonth() < 7) {
                    deadline = new Date(now.getFullYear(), 7, 30); // 30 de julio
                } else {
                    deadline = new Date(now.getFullYear() + 1, 1, 30); // 30 de enero
                }
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                deadline = new Date(now.getFullYear(), (quarter + 1) * 3, 15);
                break;
            case 'annual':
                deadline = new Date(now.getFullYear() + 1, 2, 31); // 31 de marzo
                break;
        }

        return deadline;
    }

    scheduleAutomaticReports() {
        if (!this.config.enableAutoGeneration) return;

        // Programar reportes automáticos
        for (const [reportType, template] of Object.entries(this.reportTemplates)) {
            if (template.frequency !== 'on_demand') {
                this.scheduleReportGeneration(reportType, template);
            }
        }
    }

    scheduleReportGeneration(reportType, template) {
        const interval = this.getIntervalMilliseconds(template.frequency);

        setInterval(async () => {
            try {
                console.log(`🤖 Generando reporte automático: ${template.name}`);
                await this.generateReport(reportType);
            } catch (error) {
                console.error(`Error en generación automática de ${reportType}:`, error);
            }
        }, interval);
    }

    getIntervalMilliseconds(frequency) {
        const intervals = {
            monthly: 30 * 24 * 60 * 60 * 1000,    // 30 días
            semester: 180 * 24 * 60 * 60 * 1000,  // 180 días
            quarterly: 90 * 24 * 60 * 60 * 1000,  // 90 días
            annual: 365 * 24 * 60 * 60 * 1000     // 365 días
        };

        return intervals[frequency] || 24 * 60 * 60 * 1000; // Default: diario
    }

    checkUpcomingDeadlines() {
        const now = new Date();
        const alerts = [];

        for (const [reportType, monitor] of this.deadlineMonitor.entries()) {
            if (now >= monitor.alertDate && now <= monitor.nextDeadline) {
                const daysUntilDeadline = Math.ceil(
                    (monitor.nextDeadline - now) / (24 * 60 * 60 * 1000)
                );

                alerts.push({
                    reportType: reportType,
                    template: monitor.template.name,
                    deadline: monitor.nextDeadline,
                    daysRemaining: daysUntilDeadline
                });
            }
        }

        if (alerts.length > 0) {
            this.notifyUpcomingDeadlines(alerts);
        }
    }

    notifyUpcomingDeadlines(alerts) {
        console.log('⏰ Alertas de fechas límite:');
        alerts.forEach(alert => {
            console.log(`📋 ${alert.template}: ${alert.daysRemaining} días restantes`);
        });

        // En producción, enviar notificaciones por email o sistema de alertas
    }

    // === UTILIDADES ===

    generateReportId(reportType, period) {
        const timestamp = Date.now();
        const periodStr = period || 'current';
        return `RPT_${reportType.toUpperCase()}_${periodStr}_${timestamp}`;
    }

    calculateValidityPeriod(template) {
        const now = new Date();
        const validity = new Date();

        switch (template.frequency) {
            case 'monthly':
                validity.setMonth(now.getMonth() + 1);
                break;
            case 'semester':
                validity.setMonth(now.getMonth() + 6);
                break;
            case 'quarterly':
                validity.setMonth(now.getMonth() + 3);
                break;
            case 'annual':
                validity.setFullYear(now.getFullYear() + 1);
                break;
            default:
                validity.setFullYear(now.getFullYear() + 1);
        }

        return validity.toISOString();
    }

    objectToXML(obj, level = 0) {
        let xml = '';
        const indent = '  '.repeat(level);

        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                value.forEach(item => {
                    xml += `${indent}<${key}>\n`;
                    if (typeof item === 'object') {
                        xml += this.objectToXML(item, level + 1);
                    } else {
                        xml += `${indent}  ${item}\n`;
                    }
                    xml += `${indent}</${key}>\n`;
                });
            } else if (typeof value === 'object' && value !== null) {
                xml += `${indent}<${key}>\n`;
                xml += this.objectToXML(value, level + 1);
                xml += `${indent}</${key}>\n`;
            } else {
                xml += `${indent}<${key}>${value}</${key}>\n`;
            }
        }

        return xml;
    }

    // === PERSISTENCIA ===

    async saveReport(report) {
        const reportKey = `gov_report_${report.id}`;

        try {
            // Limpiar reportes antiguos si el storage está lleno
            this.cleanupOldReports();

            // Intentar guardar el reporte
            localStorage.setItem(reportKey, JSON.stringify(report));

            // Simular guardado en sistema de archivos
            console.log(`💾 Reporte guardado: ${this.config.outputDirectory}${report.id}.${report.format.toLowerCase()}`);

        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage lleno, limpiando reportes antiguos...');
                this.cleanupOldReports(true);

                // Intentar guardar nuevamente después de la limpieza
                try {
                    localStorage.setItem(reportKey, JSON.stringify({
                        id: report.id,
                        type: report.type,
                        generatedAt: report.generatedAt,
                        status: 'Generado (Storage optimizado)',
                        summary: 'Reporte generado exitosamente'
                    }));
                    console.log(`💾 Reporte guardado (versión optimizada): ${report.id}`);
                } catch (secondError) {
                    console.warn(`⚠️ No se pudo guardar el reporte ${report.id} en localStorage`);
                }
            } else {
                console.error('❌ Error guardando reporte:', error);
            }
        }
    }

    loadReportHistory() {
        const stored = localStorage.getItem('gov_reports_history');
        if (stored) {
            try {
                this.reportHistory = JSON.parse(stored);
            } catch (error) {
                console.warn('Error loading report history:', error);
                this.reportHistory = [];
            }
        }
    }

    addToHistory(report) {
        const historyEntry = {
            id: report.id,
            type: report.type,
            template: report.template,
            period: report.period,
            generatedAt: report.generatedAt,
            status: report.status,
            complianceValid: report.compliance.valid
        };

        this.reportHistory.unshift(historyEntry);

        // Mantener solo los últimos 200 reportes
        if (this.reportHistory.length > 200) {
            this.reportHistory = this.reportHistory.slice(0, 200);
        }

        localStorage.setItem('gov_reports_history', JSON.stringify(this.reportHistory));
    }

    initializeComplianceChecker() {
        // Verificación de cumplimiento
        this.complianceStatus = {
            lastCheck: null,
            pendingReports: [],
            overdueReports: [],
            complianceRate: 100
        };

        // Verificar cumplimiento cada 24 horas
        setInterval(() => {
            this.checkComplianceStatus();
        }, 86400000);

        // Verificación inicial
        setTimeout(() => this.checkComplianceStatus(), 5000);
    }

    async checkComplianceStatus() {
        const now = new Date();
        const pending = [];
        const overdue = [];

        for (const [reportType, monitor] of this.deadlineMonitor.entries()) {
            const lastReport = this.reportHistory.find(r => r.type === reportType);

            if (!lastReport || new Date(lastReport.generatedAt) < monitor.alertDate) {
                if (now > monitor.nextDeadline) {
                    overdue.push({
                        type: reportType,
                        name: monitor.template.name,
                        deadline: monitor.nextDeadline,
                        daysOverdue: Math.floor((now - monitor.nextDeadline) / (24 * 60 * 60 * 1000))
                    });
                } else {
                    pending.push({
                        type: reportType,
                        name: monitor.template.name,
                        deadline: monitor.nextDeadline,
                        daysRemaining: Math.ceil((monitor.nextDeadline - now) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        }

        this.complianceStatus = {
            lastCheck: now.toISOString(),
            pendingReports: pending,
            overdueReports: overdue,
            complianceRate: Math.round(((Object.keys(this.reportTemplates).length - overdue.length) / Object.keys(this.reportTemplates).length) * 100)
        };

        if (overdue.length > 0) {
            console.warn(`⚠️ Reportes vencidos: ${overdue.length}`);
            overdue.forEach(report => {
                console.warn(`📋 ${report.name}: ${report.daysOverdue} días de retraso`);
            });
        }
    }

    // === API PÚBLICA ===

    async getAvailableReports() {
        return Object.keys(this.reportTemplates).map(key => ({
            type: key,
            name: this.reportTemplates[key].name,
            format: this.reportTemplates[key].format,
            frequency: this.reportTemplates[key].frequency
        }));
    }

    async getReportHistory(reportType = null, limit = 20) {
        let history = this.reportHistory;

        if (reportType) {
            history = history.filter(r => r.type === reportType);
        }

        return history.slice(0, limit);
    }

    async getComplianceStatus() {
        return this.complianceStatus;
    }

    async exportReport(reportId, format = 'download') {
        const reportKey = `gov_report_${reportId}`;
        const stored = localStorage.getItem(reportKey);

        if (!stored) {
            throw new Error(`Reporte no encontrado: ${reportId}`);
        }

        const report = JSON.parse(stored);

        if (format === 'download') {
            this.downloadReport(report);
        }

        return report;
    }

    downloadReport(report) {
        const blob = new Blob([report.content], {
            type: report.format === 'JSON' ? 'application/json' :
                  report.format === 'XML' ? 'application/xml' :
                  'application/pdf'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.id}.${report.format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Reporte descargado: ${report.id}`);
    }

    cleanupOldReports(aggressive = false) {
        try {
            const allKeys = Object.keys(localStorage);
            const reportKeys = allKeys.filter(key => key.startsWith('gov_report_'));

            if (reportKeys.length === 0) return;

            // Ordenar por fecha de creación (más antiguos primero)
            const reportsWithDates = reportKeys.map(key => {
                try {
                    const report = JSON.parse(localStorage.getItem(key));
                    return {
                        key,
                        date: new Date(report.timestamp || 0)
                    };
                } catch {
                    return { key, date: new Date(0) };
                }
            }).sort((a, b) => a.date - b.date);

            // Determinar cuántos reportes eliminar
            const maxReports = aggressive ? 10 : 50;
            const toDelete = reportsWithDates.length > maxReports ?
                           reportsWithDates.length - maxReports :
                           Math.min(5, reportsWithDates.length);

            // Eliminar reportes más antiguos
            for (let i = 0; i < toDelete; i++) {
                localStorage.removeItem(reportsWithDates[i].key);
            }

            console.log(`🧹 Limpieza de reportes: ${toDelete} reportes antiguos eliminados`);

        } catch (error) {
            console.warn('⚠️ Error durante limpieza de reportes:', error);
        }
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.governmentReportsModule = new GovernmentReportsModule();
});

// Exponer globalmente
window.GovernmentReportsModule = GovernmentReportsModule;
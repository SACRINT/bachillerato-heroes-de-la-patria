/**
 * 👨‍🏫 TEACHER TOOLS MODULE - Index
 * Semana 19: Integración de IA en Herramientas Docentes
 */

const teacherToolsService = require('./teacher_tools_service');
const routes = require('./routes');

module.exports = {
    teacherToolsService,
    routes,

    // Convenience exports
    generateSyllabus: (params) => teacherToolsService.generateSyllabus(params),
    generateRubric: (params) => teacherToolsService.generateRubric(params),
    generateQuiz: (params) => teacherToolsService.generateQuiz(params),
    analyzeText: (text, opts) => teacherToolsService.analyzeText(text, opts),
    checkPlagiarism: (text) => teacherToolsService.checkPlagiarism(text),
    getGroupHealth: (groupId) => teacherToolsService.getGroupHealth(groupId),
    suggestActivities: (params) => teacherToolsService.suggestActivities(params),
    generateMaterial: (params) => teacherToolsService.generateMaterial(params)
};

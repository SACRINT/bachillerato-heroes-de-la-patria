# 🎓 BACHILLERATO GENERAL C.C.T. 21EBH0XXX - PLATAFORMA INTEGRAL (v3.0)

¡Bienvenido al repositorio oficial de la plataforma educativa BGE!

## 🚀 Estado del Proyecto: AÑO 3 COMPLETADO

**Versión Actual:** v3.0.0 (Release Candidate)
**Última Actualización:** Enero 2026 (Fase 7 Finalizada)

---

## 🌟 Características Principales (Years 1-3)

### 📚 Académico & Gestión

* **Inscripciones Online:** Flujo completo con carga de documentos y validación.
* **Calificaciones:** Sistema de captura docente y visualización estudiantil (Service Layer + DAO).
* **Asistencias y Reportes:** Generación de boletas PDF y métricas de desempeño.

### 🎮 Gamificación & Engagement

* **IACoins & Wallet:** Economía virtual, tienda de recompensas y avatares.
* **Misiones Diarias:** Desafíos automáticos para fomentar hábitos de estudio.
* **Social:** Muro de noticias, perfiles públicos y sistema de "Clanes".

### 🤖 Inteligencia Artificial (Advanced Analytics)

* **Tutor IA v2:** Asistente conversacional con memoria contextual del progreso del alumno.
* **Early Warning System:** Detección predictiva de riesgo de deserción escolar.
* **Automated Grading:** Evaluación NLP de preguntas abiertas.
* **Sentiment Analysis:** Monitoreo de clima emocional en foros.
* **Adaptive Learning:** Rutas de aprendizaje que se ajustan dinámicamente.

### ⚡ Infraestructura

* **Multi-Tenancy:** Soporte para múltiples planteles en una sola instancia.
* **Micro-Frontend:** Widgets modulares para dashboard unificado.
* **Seguridad:** Rate limiting, WAF basic (Helmet), Auditoría de accesos sensibles.

---

## 🛠️ Instalación y Despliegue

### Requisitos Previos

* Node.js v18+
* PostgreSQL 14+ (con extensión `pgvector` recomendada)
* Redis (Opcional, para caché avanzado)

### Setup Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de DB

# 3. Ejecutar migraciones (Estructura base + Features Año 3)
node migrations/run_migrations.js

# 4. Iniciar servidor
npm run dev
```

## 🛡️ Seguridad

Reporte de auditoría final disponible en: `doc/SECURITY_AUDIT_YEAR3.md`.
El sistema cumple con lineamientos básicos de protección de datos (GDPR-lite) y separación de roles.

---
**Desarrollado por:** Equipo de Tecnología BGE & Google DeepMind Assistant.

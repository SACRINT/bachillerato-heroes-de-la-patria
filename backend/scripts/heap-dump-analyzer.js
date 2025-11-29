/**
 * 💾 HEAP DUMP ANALYZER - FASE 30.5 TAREA 2
 *
 * Propósito:
 * - Detectar memory leaks en tiempo real
 * - Generar heap dumps cuando memoria >85%
 * - Analizar y reportar memory usage por tipo de objeto
 * - Exportar resultados para análisis en Chrome DevTools
 *
 * Uso:
 * node backend/scripts/heap-dump-analyzer.js
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class HeapDumpAnalyzer {
  constructor(options = {}) {
    this.thresholdPercent = options.thresholdPercent || 85;
    this.outputDir = options.outputDir || path.join(__dirname, '../heap-dumps');
    this.maxDumps = options.maxDumps || 5; // Guardar solo últimos 5
    this.monitoringInterval = options.monitoringInterval || 10000; // 10 segundos
    this.enabled = options.enabled !== false;

    // Crear directorio de dumps si no existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`[HEAP-ANALYZER] 📁 Directorio creado: ${this.outputDir}`);
    }

    this.dumpHistory = [];
    this.started = false;
  }

  /**
   * Obtener información de memoria actual
   */
  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      timestamp: new Date().toISOString(),
      timestamp_ms: Date.now(),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      arrayBuffers: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024), // MB
      heapUsedPercent: heapUsedPercent.toFixed(1),
      isCritical: heapUsedPercent > this.thresholdPercent
    };
  }

  /**
   * Generar heap dump (snapshot)
   */
  generateHeapDump(reason = 'manual') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `heap-dump-${timestamp}-${reason}.heapsnapshot`;
      const filepath = path.join(this.outputDir, filename);

      console.log(`[HEAP-ANALYZER] 💾 Generando heap dump: ${filename}...`);
      const startTime = performance.now();

      // Generar snapshot de V8
      const snapshot = v8.writeHeapSnapshot(filepath);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      const fileSize = fs.statSync(filepath).size / 1024 / 1024;

      console.log(`[HEAP-ANALYZER] ✅ Heap dump generado en ${duration}s (${fileSize.toFixed(1)}MB)`);
      console.log(`[HEAP-ANALYZER] 📍 Ubicación: ${filepath}`);
      console.log(`[HEAP-ANALYZER] 💡 Abre en Chrome DevTools → Memory → Load`);

      // Guardar en historial
      this.dumpHistory.push({
        filename,
        filepath,
        timestamp: new Date().toISOString(),
        reason,
        fileSize: fileSize.toFixed(1),
        memoryAtTime: this.getMemoryUsage()
      });

      // Limpiar dumps antiguos (mantener solo últimos N)
      this.cleanupOldDumps();

      return {
        success: true,
        filename,
        filepath,
        fileSize: fileSize.toFixed(1),
        duration: duration
      };
    } catch (error) {
      console.error(`[HEAP-ANALYZER] ❌ Error generando heap dump:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Limpiar dumps antiguos (mantener solo últimos N)
   */
  cleanupOldDumps() {
    if (this.dumpHistory.length > this.maxDumps) {
      const oldDump = this.dumpHistory.shift();
      try {
        if (fs.existsSync(oldDump.filepath)) {
          fs.unlinkSync(oldDump.filepath);
          console.log(`[HEAP-ANALYZER] 🗑️  Eliminado dump antiguo: ${oldDump.filename}`);
        }
      } catch (error) {
        console.error(`[HEAP-ANALYZER] ⚠️  Error eliminando dump antiguo:`, error.message);
      }
    }
  }

  /**
   * Analizar garbage collection statistics
   */
  getGCStats() {
    try {
      const gc = v8.getHeapStatistics();

      return {
        totalHeapSize: Math.round(gc.total_heap_size / 1024 / 1024),
        totalHeapExecutableSize: Math.round(gc.total_heap_executable_size / 1024 / 1024),
        totalPhysicalSize: Math.round(gc.total_physical_size / 1024 / 1024),
        totalAvailableSize: Math.round(gc.total_available_size / 1024 / 1024),
        heapSizeLimit: Math.round(gc.heap_size_limit / 1024 / 1024),
        mallocedMemory: Math.round(gc.malloced_memory / 1024 / 1024),
        peakMallocedMemory: Math.round(gc.peak_malloced_memory / 1024 / 1024)
      };
    } catch (error) {
      console.error(`[HEAP-ANALYZER] ⚠️  Error obteniendo GC stats:`, error.message);
      return null;
    }
  }

  /**
   * Obtener estadísticas de espacio de heap
   */
  getHeapSpaceStats() {
    try {
      const spaces = v8.getHeapSpaceStatistics();

      return spaces.map(space => ({
        spaceName: space.space_name,
        spaceSize: Math.round(space.space_size / 1024 / 1024),
        spaceUsedSize: Math.round(space.space_used_size / 1024 / 1024),
        spaceAvailableSize: Math.round(space.space_available_size / 1024 / 1024),
        physicalSize: Math.round(space.physical_size / 1024 / 1024),
        usedPercent: ((space.space_used_size / space.space_size) * 100).toFixed(1)
      }));
    } catch (error) {
      console.error(`[HEAP-ANALYZER] ⚠️  Error obteniendo heap space stats:`, error.message);
      return [];
    }
  }

  /**
   * Iniciar monitoreo continuo
   */
  startMonitoring() {
    if (this.started) {
      console.log(`[HEAP-ANALYZER] ⚠️  Monitoreo ya iniciado`);
      return;
    }

    this.started = true;
    console.log(`[HEAP-ANALYZER] 🔍 Iniciando monitoreo de memoria...`);

    this.monitorInterval = setInterval(() => {
      if (!this.enabled) return;

      const memUsage = this.getMemoryUsage();

      // Log cada 30 segundos (3 ciclos de 10s)
      if (this.getCycleCount() % 3 === 0) {
        console.log(
          `[HEAP-ANALYZER] 📊 Memoria: ${memUsage.heapUsed}/${memUsage.heapTotal}MB (${memUsage.heapUsedPercent}%)`
        );
      }

      // Si memoria crítica, generar dump
      if (memUsage.isCritical) {
        console.log(`[HEAP-ANALYZER] 🚨 MEMORIA CRÍTICA (${memUsage.heapUsedPercent}%) - Generando dump...`);
        this.generateHeapDump('critical');
      }
    }, this.monitoringInterval);
  }

  /**
   * Obtener contador de ciclos
   */
  getCycleCount() {
    if (!this.cycleCount) this.cycleCount = 0;
    this.cycleCount++;
    return this.cycleCount;
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.started = false;
      console.log(`[HEAP-ANALYZER] ⏹️  Monitoreo detenido`);
    }
  }

  /**
   * Obtener reporte completo de memoria
   */
  getFullReport() {
    return {
      timestamp: new Date().toISOString(),
      currentMemory: this.getMemoryUsage(),
      gcStats: this.getGCStats(),
      heapSpaces: this.getHeapSpaceStats(),
      dumpHistory: this.dumpHistory.slice(-5) // Últimos 5 dumps
    };
  }

  /**
   * Log detallado en archivo
   */
  logToFile() {
    try {
      const report = this.getFullReport();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `heap-report-${timestamp}.json`;
      const filepath = path.join(this.outputDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`[HEAP-ANALYZER] 📝 Reporte guardado: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error(`[HEAP-ANALYZER] ❌ Error guardando reporte:`, error.message);
      return null;
    }
  }
}

/**
 * EXPORTAR SINGLETON PARA USO GLOBAL
 */
let analyzerInstance = null;

function getAnalyzer(options = {}) {
  if (!analyzerInstance) {
    analyzerInstance = new HeapDumpAnalyzer(options);
  }
  return analyzerInstance;
}

/**
 * INICIAR DESDE LÍNEA DE COMANDOS
 */
if (require.main === module) {
  const analyzer = getAnalyzer({
    thresholdPercent: 85,
    maxDumps: 5
  });

  // Mostrar estado actual
  console.log('\n📊 ESTADO ACTUAL DE MEMORIA:');
  console.log('============================');
  const current = analyzer.getMemoryUsage();
  console.log(`Heap Usado: ${current.heapUsed}MB / ${current.heapTotal}MB (${current.heapUsedPercent}%)`);
  console.log(`RSS Total: ${current.rss}MB`);
  console.log(`External: ${current.external}MB`);
  console.log(`Array Buffers: ${current.arrayBuffers}MB`);

  // Mostrar GC stats
  console.log('\n🧹 ESTADÍSTICAS DE GARBAGE COLLECTION:');
  console.log('====================================');
  const gcStats = analyzer.getGCStats();
  if (gcStats) {
    console.log(`Total Heap Size: ${gcStats.totalHeapSize}MB`);
    console.log(`Heap Size Limit: ${gcStats.heapSizeLimit}MB`);
    console.log(`Malloced Memory: ${gcStats.mallocedMemory}MB`);
    console.log(`Peak Malloced Memory: ${gcStats.peakMallocedMemory}MB`);
  }

  // Mostrar heap spaces
  console.log('\n🗂️  ESPACIOS DE HEAP:');
  console.log('====================');
  const spaces = analyzer.getHeapSpaceStats();
  spaces.forEach(space => {
    console.log(`${space.spaceName.padEnd(20)} ${space.spaceUsedSize}/${space.spaceSize}MB (${space.usedPercent}%)`);
  });

  // Generar dump si se especifica argumento
  if (process.argv[2] === '--dump') {
    console.log('\n💾 Generando heap dump...');
    const result = analyzer.generateHeapDump('manual');
    if (result.success) {
      console.log('✅ Heap dump generado exitosamente');
      console.log(`📍 Ubicación: ${result.filepath}`);
      console.log('💡 Próximos pasos:');
      console.log('   1. Abre Chrome DevTools → Memory tab');
      console.log('   2. Click en "Load" y selecciona el archivo .heapsnapshot');
      console.log('   3. Analiza los objetos más grandes');
      console.log('   4. Busca referencias circulares o listeners sin desuscribirse');
    }
  }

  // Iniciar monitoreo si se especifica
  if (process.argv[2] === '--monitor') {
    console.log('\n🔍 Iniciando monitoreo continuo (Ctrl+C para detener)...');
    analyzer.startMonitoring();

    // Generar reportes cada 5 minutos
    setInterval(() => {
      analyzer.logToFile();
    }, 5 * 60 * 1000);
  }
}

module.exports = {
  HeapDumpAnalyzer,
  getAnalyzer
};

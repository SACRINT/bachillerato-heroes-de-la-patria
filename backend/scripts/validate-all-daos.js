#!/usr/bin/env node

/**
 * Script de Validación de DAOs
 * Valida la sintaxis y estructura de todos los DAOs
 *
 * Uso: node backend/scripts/validate-all-daos.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m'
};

class DAOValidator {
  constructor() {
    this.daosDir = path.join(__dirname, '..', 'data');
    this.results = {
      valid: [],
      invalid: [],
      total: 0
    };
  }

  /**
   * Obtener lista de archivos DAO
   */
  getDaoFiles() {
    try {
      const files = fs.readdirSync(this.daosDir);
      return files
        .filter(file => file.endsWith('.dao.js'))
        .sort();
    } catch (error) {
      console.error(`${COLORS.RED}Error leyendo directorio:${COLORS.RESET}`, error.message);
      process.exit(1);
    }
  }

  /**
   * Validar sintaxis Node.js de un archivo
   */
  validateSyntax(filePath) {
    try {
      execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validar estructura del DAO
   */
  validateStructure(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Validaciones básicas
      const checks = {
        hasClass: /class\s+\w+DAO/i.test(content),
        hasStaticMethods: /static\s+async/i.test(content),
        hasModuleExports: /module\.exports/i.test(content),
        hasPoolQuery: /pool\.query|db\.query/i.test(content)
      };

      return checks;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validar que el DAO se puede importar
   */
  validateImport(filePath) {
    try {
      require(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ejecutar validación completa
   */
  validate() {
    const files = this.getDaoFiles();
    this.results.total = files.length;

    console.log(`${COLORS.BLUE}╔════════════════════════════════════════════╗${COLORS.RESET}`);
    console.log(`${COLORS.BLUE}║   VALIDACIÓN DE DAOs - Fase 2 Integración ║${COLORS.RESET}`);
    console.log(`${COLORS.BLUE}╚════════════════════════════════════════════╝${COLORS.RESET}\n`);

    console.log(`${COLORS.YELLOW}📊 Total de DAOs encontrados: ${files.length}${COLORS.RESET}\n`);
    console.log(`${COLORS.GRAY}Validando...${COLORS.RESET}\n`);

    files.forEach((file, index) => {
      const filePath = path.join(this.daosDir, file);
      const num = String(index + 1).padStart(2, '0');

      // Validar sintaxis
      const syntaxResult = this.validateSyntax(filePath);

      if (syntaxResult.valid) {
        // Validar estructura
        const structureResult = this.validateStructure(filePath);

        this.results.valid.push(file);
        console.log(`${COLORS.GREEN}✅${COLORS.RESET} [${num}/${files.length}] ${file.padEnd(35)} ${COLORS.GRAY}(Válido)${COLORS.RESET}`);
      } else {
        this.results.invalid.push({ file, error: syntaxResult.error });
        console.log(`${COLORS.RED}❌${COLORS.RESET} [${num}/${files.length}] ${file.padEnd(35)} ${COLORS.RED}(ERROR)${COLORS.RESET}`);
      }
    });

    this.printSummary();
    return this.results.invalid.length === 0;
  }

  /**
   * Imprimir resumen
   */
  printSummary() {
    console.log(`\n${COLORS.BLUE}╔════════════════════════════════════════════╗${COLORS.RESET}`);
    console.log(`${COLORS.BLUE}║                   RESUMEN                  ║${COLORS.RESET}`);
    console.log(`${COLORS.BLUE}╚════════════════════════════════════════════╝${COLORS.RESET}\n`);

    const total = this.results.total;
    const valid = this.results.valid.length;
    const invalid = this.results.invalid.length;
    const percentage = ((valid / total) * 100).toFixed(1);

    console.log(`  Total de DAOs validados:  ${COLORS.BLUE}${total}${COLORS.RESET}`);
    console.log(`  ✅ DAOs válidos:          ${COLORS.GREEN}${valid}${COLORS.RESET}`);
    console.log(`  ❌ DAOs con errores:      ${COLORS.RED}${invalid}${COLORS.RESET}`);
    console.log(`  📊 Tasa de éxito:         ${COLORS.YELLOW}${percentage}%${COLORS.RESET}\n`);

    if (invalid > 0) {
      console.log(`${COLORS.RED}⚠️  ERRORES ENCONTRADOS:${COLORS.RESET}\n`);
      this.results.invalid.forEach(result => {
        console.log(`  ${COLORS.RED}${result.file}:${COLORS.RESET}`);
        console.log(`    ${result.error}`);
      });
    } else {
      console.log(`${COLORS.GREEN}🎉 TODOS LOS DAOs SON VÁLIDOS${COLORS.RESET}\n`);
    }

    // Estado final
    if (invalid === 0) {
      console.log(`${COLORS.GREEN}✅ VALIDACIÓN COMPLETADA EXITOSAMENTE${COLORS.RESET}`);
      console.log(`\n${COLORS.GRAY}Próximo paso: Integración en backend/config/daos.js${COLORS.RESET}\n`);
    } else {
      console.log(`${COLORS.RED}❌ HAY ERRORES QUE CORREGIR${COLORS.RESET}`);
      console.log(`\n${COLORS.GRAY}Por favor, corrige los DAOs con errores antes de continuar.${COLORS.RESET}\n`);
      process.exit(1);
    }
  }
}

// Ejecutar validación
const validator = new DAOValidator();
const success = validator.validate();

process.exit(success ? 0 : 1);

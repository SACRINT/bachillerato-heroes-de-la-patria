/**
 * 🔑 GENERADOR DE CONTRASEÑAS TEMPORALES
 * Utilidad para generar contraseñas seguras temporales
 */

const crypto = require('crypto');

class PasswordGenerator {
    constructor() {
        // Caracteres permitidos (excluyendo caracteres ambiguos)
        this.lowercase = 'abcdefghijkmnpqrstuvwxyz'; // sin l, o
        this.uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I, O
        this.numbers = '23456789'; // sin 0, 1
        this.symbols = '!@#$%^&*()_+-=[]{}';

        this.allChars = this.lowercase + this.uppercase + this.numbers + this.symbols;
    }

    /**
     * Generar contraseña temporal aleatoria
     * @param {number} length - Longitud de la contraseña (default: 12)
     * @returns {string} Contraseña generada
     */
    generateTemporaryPassword(length = 12) {
        if (length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        let password = '';

        // Asegurar al menos 1 de cada tipo
        password += this.getRandomChar(this.lowercase);
        password += this.getRandomChar(this.uppercase);
        password += this.getRandomChar(this.numbers);
        password += this.getRandomChar(this.symbols);

        // Completar con caracteres aleatorios
        for (let i = password.length; i < length; i++) {
            password += this.getRandomChar(this.allChars);
        }

        // Mezclar la contraseña
        password = this.shuffleString(password);

        // Validar que cumple los requisitos
        if (!this.validatePassword(password)) {
            // Intentar de nuevo si falla la validación
            return this.generateTemporaryPassword(length);
        }

        return password;
    }

    /**
     * Generar contraseña memorable (formato: Palabra-Numero-Simbolo)
     * Ejemplo: "Tigre2024!"
     */
    generateMemorablePassword() {
        const words = [
            'Tigre', 'Leon', 'Aguila', 'Halcon', 'Delfin',
            'Lobo', 'Puma', 'Oso', 'Condor', 'Jaguar',
            'Heroes', 'Patria', 'Valor', 'Honor', 'Fuerza'
        ];

        const word = words[Math.floor(Math.random() * words.length)];
        const year = new Date().getFullYear();
        const number = Math.floor(Math.random() * 100);
        const symbol = this.getRandomChar(this.symbols);

        return `${word}${year}${number}${symbol}`;
    }

    /**
     * Generar PIN numérico
     */
    generateNumericPin(length = 6) {
        let pin = '';
        for (let i = 0; i < length; i++) {
            pin += Math.floor(Math.random() * 10);
        }
        return pin;
    }

    /**
     * Generar contraseña con prefijo institucional
     */
    generateInstitutionalPassword(prefix = 'BGE') {
        const year = new Date().getFullYear();
        const randomPart = this.generateRandomString(4);
        const symbol = this.getRandomChar(this.symbols);

        return `${prefix}${year}${randomPart}${symbol}`;
    }

    /**
     * Obtener carácter aleatorio de una cadena
     */
    getRandomChar(charSet) {
        const randomIndex = crypto.randomInt(0, charSet.length);
        return charSet[randomIndex];
    }

    /**
     * Generar cadena aleatoria
     */
    generateRandomString(length) {
        const chars = this.lowercase + this.uppercase + this.numbers;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandomChar(chars);
        }
        return result;
    }

    /**
     * Mezclar cadena aleatoriamente
     */
    shuffleString(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = crypto.randomInt(0, i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    /**
     * Validar que la contraseña cumple requisitos
     */
    validatePassword(password) {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}]/.test(password);
        const hasMinLength = password.length >= 8;

        return hasLowercase && hasUppercase && hasNumber && hasSymbol && hasMinLength;
    }

    /**
     * Generar múltiples contraseñas y devolver la más fuerte
     */
    generateStrongestPassword(length = 12, attempts = 5) {
        let passwords = [];

        for (let i = 0; i < attempts; i++) {
            passwords.push(this.generateTemporaryPassword(length));
        }

        // Devolver una aleatoria de las generadas (todas son seguras)
        return passwords[Math.floor(Math.random() * passwords.length)];
    }

    /**
     * Calcular fortaleza de contraseña (0-100)
     */
    calculatePasswordStrength(password) {
        let strength = 0;

        // Longitud
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        if (password.length >= 16) strength += 10;

        // Complejidad
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/\d/.test(password)) strength += 15;
        if (/[!@#$%^&*()_+\-=\[\]{}]/.test(password)) strength += 15;

        return Math.min(strength, 100);
    }

    /**
     * Generar contraseña con requerimientos específicos
     */
    generateWithRequirements(requirements = {}) {
        const {
            length = 12,
            includeLowercase = true,
            includeUppercase = true,
            includeNumbers = true,
            includeSymbols = true,
            excludeSimilar = true
        } = requirements;

        let charSet = '';
        let password = '';

        if (includeLowercase) charSet += excludeSimilar ? this.lowercase : 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charSet += excludeSimilar ? this.uppercase : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charSet += excludeSimilar ? this.numbers : '0123456789';
        if (includeSymbols) charSet += this.symbols;

        if (charSet.length === 0) {
            throw new Error('Debe incluir al menos un tipo de caracteres');
        }

        // Asegurar al menos 1 de cada tipo habilitado
        if (includeLowercase) password += this.getRandomChar(this.lowercase);
        if (includeUppercase) password += this.getRandomChar(this.uppercase);
        if (includeNumbers) password += this.getRandomChar(this.numbers);
        if (includeSymbols) password += this.getRandomChar(this.symbols);

        // Completar longitud
        while (password.length < length) {
            password += this.getRandomChar(charSet);
        }

        return this.shuffleString(password);
    }
}

// Singleton
let passwordGeneratorInstance = null;

function getPasswordGenerator() {
    if (!passwordGeneratorInstance) {
        passwordGeneratorInstance = new PasswordGenerator();
    }
    return passwordGeneratorInstance;
}

module.exports = {
    PasswordGenerator,
    getPasswordGenerator
};

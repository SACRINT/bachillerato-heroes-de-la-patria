const express = require('express');
const path = require('path');

console.log('--- DEBUGGING EXPORTS ---');

try {
    const gradesPath = './backend/routes/grades';
    const grades = require(gradesPath);
    console.log(`[GRADES] Type: ${typeof grades}`);
    console.log(`[GRADES] Keys: ${Object.keys(grades)}`);
    console.log(`[GRADES] Is Router? ${Object.getPrototypeOf(grades) === express.Router}`);
    console.log(`[GRADES] .default: ${grades.default ? typeof grades.default : 'undefined'}`);
} catch (e) {
    console.error(`[GRADES] Error: ${e.message}`);
}

try {
    const btPath = './backend/routes/bolsa-trabajo';
    const bt = require(btPath);
    console.log(`[BOLSA] Type: ${typeof bt}`);
    console.log(`[BOLSA] Keys: ${Object.keys(bt)}`);
    console.log(`[BOLSA] .default: ${bt.default ? typeof bt.default : 'undefined'}`);
} catch (e) {
    console.error(`[BOLSA] Error: ${e.message}`);
}

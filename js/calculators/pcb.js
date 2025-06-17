'use strict';

/**
 * PCB Calculator (v1.0.0)
 *
 * Provides functionality to calculate PCB-related parameters such as:
 * - Copper trace resistance: based on length, width, and thickness
 * - Via resistance: based on outer diameter, wall thickness, and height
 * 
 * This module handles all the mathematical calculations for PCB designs,
 * which are important in power circuits where resistance can affect performance.
 * 
 * Usage:
 * - Each function calculates resistance based on the provided parameters
 * - Input values are obtained from HTML form elements
 * - Results are displayed in the corresponding HTML form elements
 * - All functions use common utilities from utils.js for consistency
 */

// Resistivity constants
const COPPER_RESISTIVITY_20C = 1.68e-8;  // Resistivity of copper at 20°C in ohm-meters
const COPPER_TEMP_COEFFICIENT = 0.00393; // Temperature coefficient of resistivity for copper (per °C)
const REFERENCE_TEMP = 20;               // Reference temperature in °C

/**
 * Helper function to manage calculation flow for PCB calculator.
 * It reads, validates, and then passes values to a specified calculation function.
 * @param {Array<string>} inputIds - Array of input IDs required for the calculation.
 * @param {string} outputId - The ID of the element to display the result in.
 * @param {Function} calculationFn - The function that performs the core calculation.
 * @param {number} outputDecimals - Number of decimal places for the output.
 * @returns {void}
 */
function calculateAndUpdatePCB(inputIds, outputId, calculationFn, outputDecimals = 2) {
    const valueMap = new Map();
    const valueNames = [];

    for (const id of inputIds) {
        valueMap.set(id, utils.getValue(id));
        if (!id.includes('-temperature')) {
            // Create a user-friendly name for validation messages
            valueNames.push(id.replace('pcb-', '').replace(/-/g, ' '));
        }
    }

    const temperatureId = inputIds.find(id => id.includes('-temperature'));
    const temperature = temperatureId ? valueMap.get(temperatureId) : REFERENCE_TEMP;

    const nonTempValues = inputIds.filter(id => !id.includes('-temperature')).map(id => valueMap.get(id));

    if (!utils.validateInputs(nonTempValues, valueNames, false)) {
        return; // Validation failed, message shown by util
    }
    
    if (temperatureId && !validateTemperature(temperature)) {
        return; // Validation failed, message shown by util
    }

    const calculationArgs = inputIds.map(id => valueMap.get(id));
    const result = calculationFn(...calculationArgs);

    if (result !== null && isFinite(result)) {
        utils.setValue(outputId, result, outputDecimals);
    } else {
        utils.setValue(outputId, '', outputDecimals); // Clear output on invalid calc
    }
}

/**
 * Calculates copper resistivity at a given temperature
 * @param {number} temperature - Temperature in °C
 * @returns {number} - Resistivity in ohm-meters
 */
function calculateCopperResistivity(temperature) {
    return COPPER_RESISTIVITY_20C * (1 + COPPER_TEMP_COEFFICIENT * (temperature - REFERENCE_TEMP));
}

/**
 * Validates if temperature is within a reasonable range
 * @param {number} temperature - Temperature in °C
 * @returns {boolean} - True if valid, false otherwise
 */
function validateTemperature(temperature) {
    const MIN_TEMP = -50;
    const MAX_TEMP = 200;
    
    if (temperature < MIN_TEMP || temperature > MAX_TEMP) {
        alert(`Temperature must be between ${MIN_TEMP}°C and ${MAX_TEMP}°C`);
        return false;
    }
    return true;
}

/**
 * Calculates trace resistance based on dimensions
 * @returns {void}
 */
function calculateTraceResistance() {
    const MM_TO_M = 0.001;
    const MICRON_TO_M = 1e-6;
    const OHM_TO_MILLIOHM = 1000;

    calculateAndUpdatePCB(
        ['pcb-trace-length', 'pcb-trace-width', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-resistance',
        (length, width, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const lengthM = length * MM_TO_M;
            const widthM = width * MM_TO_M;
            const thicknessM = thickness * MICRON_TO_M;
            const area = widthM * thicknessM;
            if (Math.abs(area) < 1e-18) return null;
            const resistance = resistivity * lengthM / area;
            return resistance * OHM_TO_MILLIOHM;
        },
        3
    );
}

/**
 * Calculates trace length based on resistance and other dimensions
 * @returns {void}
 */
function calculateTraceLength() {
    const MM_TO_M = 0.001;
    const MICRON_TO_M = 1e-6;
    const MILLIOHM_TO_OHM = 0.001;

    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-width', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-length',
        (resistance, width, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            const widthM = width * MM_TO_M;
            const thicknessM = thickness * MICRON_TO_M;
            const area = widthM * thicknessM;
            if (Math.abs(resistivity) < 1e-18) return null;
            const lengthM = resistanceOhm * area / resistivity;
            return lengthM / MM_TO_M;
        },
        2
    );
}

/**
 * Calculates trace width based on resistance and other dimensions
 * @returns {void}
 */
function calculateTraceWidth() {
    const MM_TO_M = 0.001;
    const MICRON_TO_M = 1e-6;
    const MILLIOHM_TO_OHM = 0.001;

    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-length', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-width',
        (resistance, length, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            const lengthM = length * MM_TO_M;
            const thicknessM = thickness * MICRON_TO_M;
            const denominator = resistanceOhm * thicknessM;
            if (Math.abs(denominator) < 1e-18) return null;
            const widthM = resistivity * lengthM / denominator;
            return widthM / MM_TO_M;
        },
        3
    );
}

/**
 * Calculates trace thickness based on resistance and other dimensions
 * @returns {void}
 */
function calculateTraceThickness() {
    const MM_TO_M = 0.001;
    const MICRON_TO_M = 1e-6;
    const MILLIOHM_TO_OHM = 0.001;

    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-length', 'pcb-trace-width', 'pcb-trace-temperature'],
        'pcb-trace-thickness',
        (resistance, length, width, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            const lengthM = length * MM_TO_M;
            const widthM = width * MM_TO_M;
            const denominator = resistanceOhm * widthM;
            if (Math.abs(denominator) < 1e-18) return null;
            const thicknessM = resistivity * lengthM / denominator;
            return thicknessM / MICRON_TO_M;
        },
        2
    );
}


// --- Via Resistance Calculations ---

/**
 * Calculates via resistance based on dimensions
 * @returns {void}
 */
function calculateViaResistance() {
    const MM_TO_M = 0.001;
    const OHM_TO_MILLIOHM = 1000;

    calculateAndUpdatePCB(
        ['pcb-via-diameter', 'pcb-via-wall', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-resistance',
        (outerDiameter, wall, height, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const heightM = height * MM_TO_M;

            const outerR = (outerDiameter / 2) * MM_TO_M;
            const innerR = ((outerDiameter / 2) - wall) * MM_TO_M;
            
            if (innerR < 0) {
                 alert("Via wall thickness cannot be greater than half the outer diameter.");
                 return null;
            }

            const area = Math.PI * (Math.pow(outerR, 2) - Math.pow(innerR, 2));
            if (Math.abs(area) < 1e-18) return null;
            const resistance = resistivity * heightM / area;
            return resistance * OHM_TO_MILLIOHM;
        },
        3
    );
}

/**
 * Calculates via outer diameter based on resistance and other dimensions
 * @returns {void}
 */
function calculateViaOuterDiameter() {
    const MM_TO_M = 0.001;
    const MILLIOHM_TO_OHM = 0.001;

    calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-wall', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-diameter',
        (resistance, wall, height, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            const heightM = height * MM_TO_M;
            const wallM = wall * MM_TO_M;
            
            const term = (resistivity * heightM) / (Math.PI * resistanceOhm) + Math.pow(wallM, 2);
            if (term < 0) return null;

            const outerR = Math.sqrt(term) + wallM;
            return (outerR / MM_TO_M) * 2;
        },
        3
    );
}


/**
 * Calculates via wall thickness based on resistance and other dimensions
 * @returns {void}
 */
function calculateViaWallThickness() {
    const MM_TO_M = 0.001;
    const MILLIOHM_TO_OHM = 0.001;

    calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-diameter', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-wall',
        (resistance, outerDiameter, height, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            const heightM = height * MM_TO_M;
            const outerR = (outerDiameter / 2) * MM_TO_M;

            const term = Math.pow(outerR, 2) - (resistivity * heightM) / (Math.PI * resistanceOhm);
            if (term < 0) return null;

            const innerR = Math.sqrt(term);
            const wallM = outerR - innerR;
            return wallM / MM_TO_M;
        },
        3
    );
}

/**
 * Calculates via height based on resistance and other dimensions
 * @returns {void}
 */
function calculateViaHeight() {
    const MM_TO_M = 0.001;
    const MILLIOHM_TO_OHM = 0.001;
    
    calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-diameter', 'pcb-via-wall', 'pcb-via-temperature'],
        'pcb-via-height',
        (resistance, outerDiameter, wall, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = resistance * MILLIOHM_TO_OHM;
            
            const outerR = (outerDiameter / 2) * MM_TO_M;
            const innerR = ((outerDiameter / 2) - wall) * MM_TO_M;

            if (innerR < 0) {
                 alert("Via wall thickness cannot be greater than half the outer diameter.");
                 return null;
            }

            const area = Math.PI * (Math.pow(outerR, 2) - Math.pow(innerR, 2));
            if (Math.abs(resistivity) < 1e-18) return null;

            const heightM = (resistanceOhm * area) / resistivity;
            return heightM / MM_TO_M;
        },
        2
    );
}

// --- Global Export ---
// Expose functions to the global window object so they can be called from HTML
window.calculateTraceResistance = calculateTraceResistance;
window.calculateTraceLength = calculateTraceLength;
window.calculateTraceWidth = calculateTraceWidth;
window.calculateTraceThickness = calculateTraceThickness;
window.calculateViaResistance = calculateViaResistance;
window.calculateViaOuterDiameter = calculateViaOuterDiameter;
window.calculateViaWallThickness = calculateViaWallThickness;
window.calculateViaHeight = calculateViaHeight; 
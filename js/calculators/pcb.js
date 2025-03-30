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

// PCB Calculator Functions

// Resistivity constants
const COPPER_RESISTIVITY_20C = 1.68e-8;  // Resistivity of copper at 20°C in ohm-meters
const COPPER_TEMP_COEFFICIENT = 0.00393; // Temperature coefficient of resistivity for copper (per °C)
const REFERENCE_TEMP = 20;               // Reference temperature in °C

/**
 * Unit conversion constants and helper functions
 */
const MM_TO_M = 1/1000;               // Convert mm to meters
const MICRON_TO_M = 1/1000000;        // Convert µm to meters
const OHM_TO_MILLIOHM = 1000;         // Convert Ω to mΩ
const MILLIOHM_TO_OHM = 1/1000;       // Convert mΩ to Ω

/**
 * Helper function to manage calculation flow for PCB calculator
 * @param {Array<string>} inputIds - Array of input IDs
 * @param {string} outputId - Output ID
 * @param {Function} calculationFn - Calculation function
 * @param {number} outputDecimals - Number of decimals for output
 * @returns {void}
 */
function calculateAndUpdatePCB(inputIds, outputId, calculationFn, outputDecimals = 2) {
    // --- Read values ONCE ---
    const valueMap = new Map();
    inputIds.forEach(id => valueMap.set(id, utils.getValue(id)));

    const inputNames = inputIds.map(id => id.replace('pcb-', '').replace(/-/g, ' ').toUpperCase());

    // Fetch temperature, providing default
    const temperature = valueMap.get('pcb-trace-temperature') ?? valueMap.get('pcb-via-temperature') ?? REFERENCE_TEMP;

    // --- Perform Validations ---
    let isValid = true;
    const errors = [];

    // 1. Check for non-null/NaN on non-temperature fields
    const nonTempIds = inputIds.filter(id => !id.includes('-temperature'));
    const nonTempValues = nonTempIds.map(id => valueMap.get(id));
    const nonTempNames = nonTempIds.map(id => id.replace('pcb-', '').replace(/-/g, ' ').toUpperCase());
    
    if (!utils.validateInputs(nonTempValues, nonTempNames)) {
        // utils.validateInputs already shows an alert, so just mark as invalid
        isValid = false; 
    }

    // 2. Check for positivity on non-temperature fields (only if previous check passed)
    if (isValid) {
        for (let i = 0; i < nonTempValues.length; i++) {
            if (!utils.validatePositive(nonTempValues[i], nonTempNames[i])) {
                // utils.validatePositive shows an alert
                isValid = false;
                break;
            }
        }
    }

    // 3. Check temperature range (only if previous checks passed)
    if (isValid && !validateTemperature(temperature)) {
        // validateTemperature shows an alert
        isValid = false;
    }

    // --- Exit or Calculate ---
    if (!isValid) {
        return null; // Exit if any validation failed
    }

    // Prepare arguments for calculationFn (using the initially read values)
    const calculationArgs = inputIds.map(id => valueMap.get(id));

    // Execute calculation
    const result = calculationFn(...calculationArgs, temperature); // Pass temp as extra arg if needed (it might already be in calculationArgs)

    // Set output if result is valid
    if (result !== null && result !== undefined && !isNaN(result)) {
        utils.setValue(outputId, result, outputDecimals);
        return result;
    }
    
    return null;
}

/**
 * Calculates copper resistivity at a given temperature
 * 
 * @param {number} temperature - Temperature in °C
 * @returns {number} - Resistivity in ohm-meters
 */
function calculateCopperResistivity(temperature) {
    // Using the formula: ρ(T) = ρ₀[1 + α(T - T₀)]
    return COPPER_RESISTIVITY_20C * (1 + COPPER_TEMP_COEFFICIENT * (temperature - REFERENCE_TEMP));
}

/**
 * Validates if temperature is within a reasonable range
 * 
 * @param {number} temperature - Temperature in °C
 * @returns {boolean} - True if valid, false otherwise
 */
function validateTemperature(temperature) {
    const MIN_TEMP = -50;  // Minimum reasonable temperature in °C
    const MAX_TEMP = 200;  // Maximum reasonable temperature in °C
    
    if (temperature < MIN_TEMP || temperature > MAX_TEMP) {
        alert(`Temperature must be between ${MIN_TEMP}°C and ${MAX_TEMP}°C`);
        return false;
    }
    return true;
}

/**
 * Converts millimeters to meters
 * @param {number} mm - Value in millimeters
 * @returns {number} - Value in meters
 */
function mmToMeters(mm) {
    return mm * MM_TO_M;
}

/**
 * Converts microns to meters
 * @param {number} microns - Value in microns
 * @returns {number} - Value in meters
 */
function micronsToMeters(microns) {
    return microns * MICRON_TO_M;
}

/**
 * Converts ohms to milliohms
 * @param {number} ohms - Value in ohms
 * @returns {number} - Value in milliohms
 */
function ohmsToMilliohms(ohms) {
    return ohms * OHM_TO_MILLIOHM;
}

/**
 * Converts milliohms to ohms
 * @param {number} milliohms - Value in milliohms
 * @returns {number} - Value in ohms
 */
function milliohmsToOhms(milliohms) {
    return milliohms * MILLIOHM_TO_OHM;
}

/**
 * Calculates trace resistance based on dimensions
 * 
 * @returns {void}
 */
function calculateTraceResistance() {
    calculateAndUpdatePCB(
        ['pcb-trace-length', 'pcb-trace-width', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-resistance',
        (length, width, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const lengthM = mmToMeters(length);
            const widthM = mmToMeters(width);
            const thicknessM = micronsToMeters(thickness);
            const area = widthM * thicknessM;
            if (Math.abs(area) < 1e-18) return null; // Avoid division by zero
            const resistance = resistivity * lengthM / area;
            return ohmsToMilliohms(resistance);
        },
        3 // Output decimals
    );
}

/**
 * Calculates trace length based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceLength() {
    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-width', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-length',
        (resistance, width, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const widthM = mmToMeters(width);
            const thicknessM = micronsToMeters(thickness);
            const area = widthM * thicknessM;
            if (Math.abs(resistivity) < 1e-18) return null; // Avoid division by zero
            const lengthM = resistanceOhm * area / resistivity;
            return lengthM / MM_TO_M;
        },
        2 // Output decimals
    );
}

/**
 * Calculates trace width based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceWidth() {
    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-length', 'pcb-trace-thickness', 'pcb-trace-temperature'],
        'pcb-trace-width',
        (resistance, length, thickness, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const lengthM = mmToMeters(length);
            const thicknessM = micronsToMeters(thickness);
            const denominator = resistanceOhm * thicknessM;
            if (Math.abs(denominator) < 1e-18) return null; // Avoid division by zero
            const widthM = resistivity * lengthM / denominator;
            return widthM / MM_TO_M;
        },
        3 // Output decimals
    );
}

/**
 * Calculates trace thickness based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceThickness() {
    calculateAndUpdatePCB(
        ['pcb-trace-resistance', 'pcb-trace-length', 'pcb-trace-width', 'pcb-trace-temperature'],
        'pcb-trace-thickness',
        (resistance, length, width, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const lengthM = mmToMeters(length);
            const widthM = mmToMeters(width);
            const denominator = resistanceOhm * widthM;
            if (Math.abs(denominator) < 1e-18) return null; // Avoid division by zero
            const thicknessM = resistivity * lengthM / denominator;
            return thicknessM / MICRON_TO_M;
        },
        1 // Output decimals
    );
}

/**
 * Calculates via resistance based on dimensions
 * 
 * @returns {void}
 */
function calculateViaResistance() {
    calculateAndUpdatePCB(
        ['pcb-via-diameter', 'pcb-via-wall', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-resistance',
        (outerDiameter, wallThickness, height, temperature) => {
            if (wallThickness * 2 >= outerDiameter) {
                alert('Wall thickness cannot be more than half the outer diameter.');
                return null;
            }
            const resistivity = calculateCopperResistivity(temperature);
            const heightM = mmToMeters(height);
            const outerRadiusM = mmToMeters(outerDiameter / 2);
            const innerRadiusM = mmToMeters((outerDiameter / 2) - wallThickness);
            const area = Math.PI * (Math.pow(outerRadiusM, 2) - Math.pow(innerRadiusM, 2));
             if (Math.abs(area) < 1e-18) return null; // Avoid division by zero
            const resistance = resistivity * heightM / area;
            return ohmsToMilliohms(resistance);
        },
        3 // Output decimals
    );
}

/**
 * Calculates via outer diameter based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaOuterDiameter() {
     calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-wall', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-diameter',
        (resistance, wallThickness, height, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const heightM = mmToMeters(height);
            const wallThicknessM = mmToMeters(wallThickness);
            if (Math.abs(resistivity * heightM) < 1e-18) return null; // Avoid potential division by zero later
            
            // R = rho * H / (pi * (r_outer^2 - r_inner^2))
            // R = rho * H / (pi * (r_outer^2 - (r_outer - wall)^2))
            // R = rho * H / (pi * (r_outer^2 - (r_outer^2 - 2*r_outer*wall + wall^2)))
            // R = rho * H / (pi * (2*r_outer*wall - wall^2))
            // pi * R * (2*r_outer*wall - wall^2) = rho * H
            // 2*r_outer*wall - wall^2 = (rho * H) / (pi * R)
            // 2*r_outer*wall = (rho * H) / (pi * R) + wall^2
            // r_outer = [(rho * H) / (pi * R) + wall^2] / (2*wall)
            const term1 = (resistivity * heightM) / (Math.PI * resistanceOhm);
            const numerator = term1 + Math.pow(wallThicknessM, 2);
            const denominator = 2 * wallThicknessM;
            if (Math.abs(denominator) < 1e-18) return null; // Avoid division by zero
            const outerRadiusM = numerator / denominator;
            const outerDiameterMm = (outerRadiusM / MM_TO_M) * 2;
            return outerDiameterMm;
        },
        3 // Output decimals
    );
}

/**
 * Calculates via wall thickness based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaWallThickness() {
    calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-diameter', 'pcb-via-height', 'pcb-via-temperature'],
        'pcb-via-wall',
        (resistance, outerDiameter, height, temperature) => {
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const heightM = mmToMeters(height);
            const outerRadiusM = mmToMeters(outerDiameter / 2);
             if (Math.abs(resistivity * heightM) < 1e-18 || Math.abs(Math.PI * resistanceOhm) < 1e-18) return null; 
             
            // R = rho * H / (pi * (r_outer^2 - r_inner^2))
            // pi * R * (r_outer^2 - r_inner^2) = rho * H
            // r_outer^2 - r_inner^2 = (rho * H) / (pi * R)
            // r_inner^2 = r_outer^2 - (rho * H) / (pi * R)
            const term1 = (resistivity * heightM) / (Math.PI * resistanceOhm);
            const innerRadiusSquared = Math.pow(outerRadiusM, 2) - term1;
            if (innerRadiusSquared < 0) return null; // Cannot have negative inner radius squared
            const innerRadiusM = Math.sqrt(innerRadiusSquared);
            const wallThicknessM = outerRadiusM - innerRadiusM;
            const wallThicknessMm = wallThicknessM / MM_TO_M;
            return wallThicknessMm;
        },
        3 // Output decimals
    );
}

/**
 * Calculates via height based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaHeight() {
    calculateAndUpdatePCB(
        ['pcb-via-resistance', 'pcb-via-diameter', 'pcb-via-wall', 'pcb-via-temperature'],
        'pcb-via-height',
        (resistance, outerDiameter, wallThickness, temperature) => {
             if (wallThickness * 2 >= outerDiameter) {
                 // Already handled by alert in calculateViaResistance, but good to prevent calculation
                return null;
            }
            const resistivity = calculateCopperResistivity(temperature);
            const resistanceOhm = milliohmsToOhms(resistance);
            const outerRadiusM = mmToMeters(outerDiameter / 2);
            const innerRadiusM = mmToMeters((outerDiameter / 2) - wallThickness);
            const area = Math.PI * (Math.pow(outerRadiusM, 2) - Math.pow(innerRadiusM, 2));
            if (Math.abs(resistivity) < 1e-18) return null; // Avoid division by zero
            // R = rho * H / A => H = R * A / rho
            const heightM = resistanceOhm * area / resistivity;
            const heightMm = heightM / MM_TO_M;
            return heightMm;
        },
        2 // Output decimals
    );
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'pcb',                // ID
        'PCB',                // Name
        'PCB trace and via resistance calculator', // Description
        {
            calculateTraceResistance,
            calculateTraceLength,
            calculateTraceWidth,
            calculateTraceThickness,
            calculateViaResistance,
            calculateViaOuterDiameter,
            calculateViaWallThickness,
            calculateViaHeight
        }
    );
}

// Make functions globally accessible
window.calculateTraceResistance = calculateTraceResistance;
window.calculateTraceLength = calculateTraceLength;
window.calculateTraceWidth = calculateTraceWidth;
window.calculateTraceThickness = calculateTraceThickness;
window.calculateViaResistance = calculateViaResistance;
window.calculateViaOuterDiameter = calculateViaOuterDiameter;
window.calculateViaWallThickness = calculateViaWallThickness;
window.calculateViaHeight = calculateViaHeight; 
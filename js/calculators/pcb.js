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
    const length = utils.getValue('pcb-trace-length');
    const width = utils.getValue('pcb-trace-width');
    const thickness = utils.getValue('pcb-trace-thickness');
    const temperature = utils.getValue('pcb-trace-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [length, width, thickness], 
        ['Trace Length', 'Trace Width', 'Trace Thickness']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(length, 'Trace Length') ||
        !utils.validatePositive(width, 'Trace Width') ||
        !utils.validatePositive(thickness, 'Trace Thickness')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert from mm and µm to meters
    const lengthM = mmToMeters(length);
    const widthM = mmToMeters(width);
    const thicknessM = micronsToMeters(thickness);
    
    // Calculate cross-sectional area in square meters
    const area = widthM * thicknessM;
    
    // Calculate resistance using R = ρ * L / A
    const resistance = resistivity * lengthM / area;
    
    // Convert to milliohms for display
    const resistanceMOhm = ohmsToMilliohms(resistance);
    
    // Display with 3 decimal places for better precision
    utils.setValue('pcb-trace-resistance', resistanceMOhm, 3);
}

/**
 * Calculates trace length based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceLength() {
    const resistance = utils.getValue('pcb-trace-resistance');
    const width = utils.getValue('pcb-trace-width');
    const thickness = utils.getValue('pcb-trace-thickness');
    const temperature = utils.getValue('pcb-trace-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, width, thickness], 
        ['Trace Resistance', 'Trace Width', 'Trace Thickness']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Trace Resistance') ||
        !utils.validatePositive(width, 'Trace Width') ||
        !utils.validatePositive(thickness, 'Trace Thickness')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const widthM = mmToMeters(width);
    const thicknessM = micronsToMeters(thickness);
    
    // Calculate cross-sectional area in square meters
    const area = widthM * thicknessM;
    
    // Calculate length using L = R * A / ρ
    const lengthM = resistanceOhm * area / resistivity;
    
    // Convert to mm for display
    const lengthMm = lengthM / MM_TO_M;
    
    utils.setValue('pcb-trace-length', lengthMm, 2);
}

/**
 * Calculates trace width based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceWidth() {
    const resistance = utils.getValue('pcb-trace-resistance');
    const length = utils.getValue('pcb-trace-length');
    const thickness = utils.getValue('pcb-trace-thickness');
    const temperature = utils.getValue('pcb-trace-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, length, thickness], 
        ['Trace Resistance', 'Trace Length', 'Trace Thickness']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Trace Resistance') ||
        !utils.validatePositive(length, 'Trace Length') ||
        !utils.validatePositive(thickness, 'Trace Thickness')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const lengthM = mmToMeters(length);
    const thicknessM = micronsToMeters(thickness);
    
    // Calculate width using W = ρ * L / (R * t)
    const widthM = resistivity * lengthM / (resistanceOhm * thicknessM);
    
    // Convert to mm for display
    const widthMm = widthM / MM_TO_M;
    
    utils.setValue('pcb-trace-width', widthMm, 3);
}

/**
 * Calculates trace thickness based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateTraceThickness() {
    const resistance = utils.getValue('pcb-trace-resistance');
    const length = utils.getValue('pcb-trace-length');
    const width = utils.getValue('pcb-trace-width');
    const temperature = utils.getValue('pcb-trace-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, length, width], 
        ['Trace Resistance', 'Trace Length', 'Trace Width']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Trace Resistance') ||
        !utils.validatePositive(length, 'Trace Length') ||
        !utils.validatePositive(width, 'Trace Width')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const lengthM = mmToMeters(length);
    const widthM = mmToMeters(width);
    
    // Calculate thickness using t = ρ * L / (R * W)
    const thicknessM = resistivity * lengthM / (resistanceOhm * widthM);
    
    // Convert to µm for display
    const thicknessMicrons = thicknessM / MICRON_TO_M;
    
    utils.setValue('pcb-trace-thickness', thicknessMicrons, 1);
}

/**
 * Calculates via resistance based on dimensions
 * 
 * @returns {void}
 */
function calculateViaResistance() {
    const outerDiameter = utils.getValue('pcb-via-diameter');
    const wallThickness = utils.getValue('pcb-via-wall');
    const height = utils.getValue('pcb-via-height');
    const temperature = utils.getValue('pcb-via-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [outerDiameter, wallThickness, height], 
        ['Via Outer Diameter', 'Via Wall Thickness', 'Via Height']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(outerDiameter, 'Via Outer Diameter') ||
        !utils.validatePositive(wallThickness, 'Via Wall Thickness') ||
        !utils.validatePositive(height, 'Via Height')) {
        return;
    }
    
    // Additional validation to ensure wall thickness is less than radius
    if (wallThickness >= outerDiameter / 2) {
        alert("Via wall thickness must be less than half the outer diameter");
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert from mm to meters
    const outerDiameterM = mmToMeters(outerDiameter);
    const wallThicknessM = mmToMeters(wallThickness);
    const heightM = mmToMeters(height);
    
    // Calculate inner diameter
    const innerDiameterM = outerDiameterM - 2 * wallThicknessM;
    
    // Calculate via resistance using cylindrical shell formula
    // R = ρ * h / (π * (ro^2 - ri^2))
    const outerRadius = outerDiameterM / 2;
    const innerRadius = innerDiameterM / 2;
    const resistance = resistivity * heightM / (Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)));
    
    // Convert to milliohms for display
    const resistanceMOhm = ohmsToMilliohms(resistance);
    
    utils.setValue('pcb-via-resistance', resistanceMOhm, 3);
}

/**
 * Calculates via outer diameter based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaOuterDiameter() {
    const resistance = utils.getValue('pcb-via-resistance');
    const wallThickness = utils.getValue('pcb-via-wall');
    const height = utils.getValue('pcb-via-height');
    const temperature = utils.getValue('pcb-via-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, wallThickness, height], 
        ['Via Resistance', 'Via Wall Thickness', 'Via Height']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Via Resistance') ||
        !utils.validatePositive(wallThickness, 'Via Wall Thickness') ||
        !utils.validatePositive(height, 'Via Height')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const wallThicknessM = mmToMeters(wallThickness);
    const heightM = mmToMeters(height);
    
    // Calculate required area based on resistance
    // A = π * (ro^2 - ri^2) = ρ * h / R
    const area = resistivity * heightM / resistanceOhm;
    
    // Define inner radius based on wall thickness (ri = ro - wallThickness)
    // Solving quadratic equation: π * (ro^2 - (ro - wallThickness)^2) = area
    // This simplifies to: π * (2*ro*wallThickness - wallThickness^2) = area
    // ro = (area/π + wallThickness^2) / (2*wallThickness)
    const outerRadiusM = (area/Math.PI + Math.pow(wallThicknessM, 2)) / (2 * wallThicknessM);
    
    // Convert to mm for display
    const outerDiameterMm = outerRadiusM * 2 / MM_TO_M;
    
    utils.setValue('pcb-via-diameter', outerDiameterMm, 3);
}

/**
 * Calculates via wall thickness based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaWallThickness() {
    const resistance = utils.getValue('pcb-via-resistance');
    const outerDiameter = utils.getValue('pcb-via-diameter');
    const height = utils.getValue('pcb-via-height');
    const temperature = utils.getValue('pcb-via-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, outerDiameter, height], 
        ['Via Resistance', 'Via Outer Diameter', 'Via Height']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Via Resistance') ||
        !utils.validatePositive(outerDiameter, 'Via Outer Diameter') ||
        !utils.validatePositive(height, 'Via Height')) {
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const outerDiameterM = mmToMeters(outerDiameter);
    const heightM = mmToMeters(height);
    const outerRadiusM = outerDiameterM / 2;
    
    // Calculate required area based on resistance
    // A = π * (ro^2 - ri^2) = ρ * h / R
    const area = resistivity * heightM / resistanceOhm;
    
    // Inner radius squared = outer radius squared - area/π
    const innerRadiusSquared = Math.pow(outerRadiusM, 2) - area/Math.PI;
    
    if (innerRadiusSquared < 0) {
        alert("No valid solution exists with these parameters. Try a larger outer diameter or higher resistance.");
        return;
    }
    
    const innerRadiusM = Math.sqrt(innerRadiusSquared);
    const wallThicknessM = outerRadiusM - innerRadiusM;
    
    // Convert to mm for display
    const wallThicknessMm = wallThicknessM / MM_TO_M;
    
    utils.setValue('pcb-via-wall', wallThicknessMm, 3);
}

/**
 * Calculates via height based on resistance and other dimensions
 * 
 * @returns {void}
 */
function calculateViaHeight() {
    const resistance = utils.getValue('pcb-via-resistance');
    const outerDiameter = utils.getValue('pcb-via-diameter');
    const wallThickness = utils.getValue('pcb-via-wall');
    const temperature = utils.getValue('pcb-via-temperature') || REFERENCE_TEMP;
    
    // Validate inputs
    if (!utils.validateInputs(
        [resistance, outerDiameter, wallThickness], 
        ['Via Resistance', 'Via Outer Diameter', 'Via Wall Thickness']
    )) {
        return;
    }
    
    // Validate positive values
    if (!utils.validatePositive(resistance, 'Via Resistance') ||
        !utils.validatePositive(outerDiameter, 'Via Outer Diameter') ||
        !utils.validatePositive(wallThickness, 'Via Wall Thickness')) {
        return;
    }
    
    // Additional validation to ensure wall thickness is less than radius
    if (wallThickness >= outerDiameter / 2) {
        alert("Via wall thickness must be less than half the outer diameter");
        return;
    }
    
    // Validate temperature
    if (!validateTemperature(temperature)) {
        return;
    }
    
    // Get temperature-corrected resistivity
    const resistivity = calculateCopperResistivity(temperature);
    
    // Convert resistance from mΩ to Ω
    const resistanceOhm = milliohmsToOhms(resistance);
    
    // Convert from mm to meters
    const outerDiameterM = mmToMeters(outerDiameter);
    const wallThicknessM = mmToMeters(wallThickness);
    
    // Calculate dimensions
    const outerRadiusM = outerDiameterM / 2;
    const innerRadiusM = outerRadiusM - wallThicknessM;
    
    // Calculate height using h = R * π * (ro^2 - ri^2) / ρ
    const heightM = resistanceOhm * Math.PI * (Math.pow(outerRadiusM, 2) - Math.pow(innerRadiusM, 2)) / resistivity;
    
    // Convert to mm for display
    const heightMm = heightM / MM_TO_M;
    
    utils.setValue('pcb-via-height', heightMm, 2);
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
/**
 * Utility functions for DC-DC Converter Calculators
 * 
 * This module provides common functions used by all calculators in the project.
 * All new calculators should use these utilities for consistency and maintainability.
 */

// --- Constants ---

// Conversion Factors
const MICRO_CONVERSION_FACTOR = 1000000; // For µH, µs, etc.
const MILLI_CONVERSION_FACTOR = 1000;    // For mΩ, mA, etc.

// Common Solver Parameters (if applicable)
const ITERATION_LIMIT = 10;          // Default max iterations for solvers
const CONVERGENCE_THRESHOLD = 0.001; // Default tolerance for solvers

// --- E-Series Resistor Values (for standard resistor calculations) ---
const E24_VALUES = [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];

const E96_VALUES = [
    1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30, 1.33, 1.37, 1.40, 1.43,
    1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10,
    2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
    3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12, 4.22, 4.32, 4.42, 4.53,
    4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
    6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76
];

const E192_VALUES = [
    1.00, 1.01, 1.02, 1.04, 1.05, 1.06, 1.07, 1.09, 1.10, 1.11, 1.13, 1.14, 1.15, 1.17, 1.18, 1.20,
    1.21, 1.23, 1.24, 1.26, 1.27, 1.29, 1.30, 1.32, 1.33, 1.35, 1.37, 1.38, 1.40, 1.42, 1.43,
    1.45, 1.47, 1.49, 1.50, 1.52, 1.54, 1.56, 1.58, 1.60, 1.62, 1.64, 1.65, 1.67, 1.69, 1.72,
    1.74, 1.76, 1.78, 1.80, 1.82, 1.84, 1.87, 1.89, 1.91, 1.93, 1.96, 1.98, 2.00, 2.03, 2.05,
    2.08, 2.10, 2.13, 2.15, 2.18, 2.20, 2.23, 2.26, 2.29, 2.32, 2.34, 2.37, 2.40, 2.43, 2.46,
    2.49, 2.52, 2.55, 2.58, 2.61, 2.64, 2.67, 2.71, 2.74, 2.77, 2.80, 2.84, 2.87, 2.91, 2.94,
    2.98, 3.01, 3.05, 3.08, 3.12, 3.16, 3.20, 3.24, 3.28, 3.32, 3.36, 3.40, 3.44, 3.48, 3.52,
    3.57, 3.61, 3.65, 3.70, 3.74, 3.79, 3.83, 3.88, 3.92, 3.97, 4.02, 4.07, 4.12, 4.17, 4.22,
    4.27, 4.32, 4.37, 4.42, 4.48, 4.53, 4.59, 4.64, 4.70, 4.75, 4.81, 4.87, 4.93, 4.99, 5.05,
    5.11, 5.17, 5.23, 5.30, 5.36, 5.42, 5.49, 5.56, 5.62, 5.69, 5.76, 5.83, 5.90, 5.97, 6.04,
    6.12, 6.19, 6.26, 6.34, 6.42, 6.49, 6.57, 6.65, 6.73, 6.81, 6.90, 6.98, 7.06, 7.15, 7.23,
    7.32, 7.41, 7.50, 7.59, 7.68, 7.77, 7.87, 7.96, 8.06, 8.16, 8.25, 8.35, 8.45, 8.56, 8.66,
    8.76, 8.87, 8.98, 9.09, 9.20, 9.31, 9.42, 9.53, 9.65, 9.76, 9.88
];

const utils_standardValuesCache = {
    '0.1': null, '1': null, '5': null
};

function utils_generateStandardValues(baseValues) {
    const values = [];
    for (let exp = -1; exp <= 7; exp++) { // 0.1 ohm to 100 Mohm
        for (const val of baseValues) {
            values.push(parseFloat((val * Math.pow(10, exp)).toPrecision(4)));
        }
    }
    return [...new Set(values)].sort((a, b) => a - b);
}

function utils_getStandardValues(tolerance) {
    const tolStr = String(tolerance);
    if (utils_standardValuesCache[tolStr]) {
        return utils_standardValuesCache[tolStr];
    }
    let baseVals;
    switch(tolStr) {
        case "0.1": baseVals = E192_VALUES; break;
        case "1":   baseVals = E96_VALUES;  break;
        case "5": default: baseVals = E24_VALUES; break;
    }
    const generatedValues = utils_generateStandardValues(baseVals);
    utils_standardValuesCache[tolStr] = generatedValues;
    return generatedValues;
}

// --- Functions ---

/**
 * Gets a numeric value from an input field with full precision
 * 
 * @param {string} id - The HTML element ID of the input field
 * @returns {number|null} - The parsed numeric value or null if empty
 * 
 * @example
 * // Get precise value from input with id "calculator-param"
 * const paramValue = utils.getValue('calculator-param');
 */
function getValue(id) {
    const element = document.getElementById(id);
    if (!element) return null;
    
    // Always read the current visible value from the input field
    const value = element.value;
    return value === '' ? null : parseFloat(value);
}

/**
 * Sets a formatted value to an input field
 * 
 * @param {string} id - The HTML element ID of the input field
 * @param {number} value - The numeric value to set
 * @param {number} decimals - Number of decimal places (default: 2)
 * 
 * @example
 * // Set value to input with id "calculator-result" with 3 decimal places
 * utils.setValue('calculator-result', 10.12345, 3); // Sets "10.123"
 */
function setValue(id, value, decimals = 2) {
    const element = document.getElementById(id);
    if (element) {
        // Handle empty, null, or invalid values
        if (value === null || value === undefined || value === '' || isNaN(value)) {
            element.value = '';
            delete element.dataset.preciseValue;
            return;
        }
        
        // Store the full precision value as a data attribute
        element.dataset.preciseValue = value;
        // Format the displayed value with specified decimals
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            element.value = numValue.toFixed(decimals);
        } else {
            element.value = '';
        }
    }
}

/**
 * Validates that all required input fields have values
 * Shows an alert with missing field names if validation fails
 * 
 * @param {Array<number|null>} fields - Array of field values to validate
 * @param {Array<string>} fieldNames - Array of field names (for error messages)
 * @param {boolean} silent - Whether to prevent showing an alert (default: false)
 * @returns {boolean} - True if all fields have values, false otherwise
 * 
 * @example
 * // Validate that required fields have values
 * if (!utils.validateInputs(
 *     [value1, value2, value3],
 *     ['Parameter 1', 'Parameter 2', 'Parameter 3']
 * )) {
 *     return; // Exit early if validation fails
 * }
 */
function validateInputs(fields, fieldNames, silent = false) {
    const missing = [];
    
    for (let i = 0; i < fields.length; i++) {
        if (fields[i] === null || isNaN(fields[i])) {
            missing.push(fieldNames[i]);
        }
    }
    
    if (missing.length > 0) {
        if (!silent) {
            alert(`Please enter values for: ${missing.join(', ')}`);
        }
        return false;
    }
    
    return true;
}

/**
 * Validates that a value is positive
 * Shows an alert if validation fails
 * 
 * @param {number|null} value - The value to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {boolean} - True if value is positive, false otherwise
 * 
 * @example
 * // Validate that voltage is positive
 * if (!utils.validatePositive(voltage, 'Input Voltage')) {
 *     return; // Exit early if validation fails
 * }
 */
function validatePositive(value, fieldName) {
    if (value === null || isNaN(value)) {
        alert(`Please enter a value for: ${fieldName}`);
        return false;
    }
    
    if (value <= 0) {
        alert(`${fieldName} must be positive`);
        return false;
    }
    
    return true;
}

/**
 * Converts frequency from MHz to Hz
 * 
 * @param {number} mhz - Frequency in MHz
 * @returns {number} - Frequency in Hz
 * 
 * @example
 * const frequencyHz = utils.mhzToHz(1.5); // Returns 1500000
 */
function mhzToHz(mhz) {
    return mhz * 1e6;
}

/**
 * Converts frequency from Hz to MHz
 * 
 * @param {number} hz - Frequency in Hz
 * @returns {number} - Frequency in MHz
 * 
 * @example
 * const frequencyMHz = utils.hzToMhz(1500000); // Returns 1.5
 */
function hzToMhz(hz) {
    return hz / 1e6;
}

/**
 * Format a resistor value with appropriate units (Ω, kΩ, MΩ)
 * 
 * @param {number} value - Resistor value in ohms
 * @returns {string} Formatted resistor value with units
 */
function formatResistorValue(value) {
    if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + ' MΩ';
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(2) + ' kΩ';
    } else if (value < 1 && value > 0) {
        if (value >= 0.01) {
            return value.toFixed(2) + ' Ω';
        } else {
            return value.toPrecision(2) + ' Ω';
        }
    } else {
        return value.toFixed(2) + ' Ω';
    }
}

/**
 * Finds the index of the closest value in a sorted array using binary search.
 *
 * @param {Array<number>} sortedArray - The sorted array to search.
 * @param {number} targetValue - The value to find the closest match for.
 * @returns {number} The index of the closest value, or -1 if the array is empty.
 */
function utils_findClosestValueIndex_binarySearch(sortedArray, targetValue) {
    if (!sortedArray || sortedArray.length === 0) return -1;
    let low = 0;
    let high = sortedArray.length - 1;
    let closestIndex = -1;
    let minDiff = Infinity;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const diff = Math.abs(sortedArray[mid] - targetValue);

        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = mid;
        } else if (diff === minDiff) {
            // Prefer the smaller index in case of a tie in difference to be deterministic
            // or if sortedArray[mid] is actually closer than sortedArray[closestIndex]
            if (Math.abs(sortedArray[mid] - targetValue) < Math.abs(sortedArray[closestIndex] - targetValue)) {
                 closestIndex = mid;
            } else if (sortedArray[mid] < sortedArray[closestIndex]) {
                 closestIndex = mid;
            }
        }

        if (sortedArray[mid] < targetValue) {
            low = mid + 1;
        } else if (sortedArray[mid] > targetValue) {
            high = mid - 1;
        } else {
            return mid; // Exact match found
        }
    }
    // After the loop, low might be out of bounds or high might be.
    // Check elements around the closestIndex found during the loop, and also low/high if they are valid indices.
    // This refinement helps catch cases where the loop terminates but a slightly better match is at the edges of the last search space.
    const candidates = [closestIndex];
    if (low >= 0 && low < sortedArray.length) candidates.push(low);
    if (high >= 0 && high < sortedArray.length) candidates.push(high);
    
    let finalClosestIndex = closestIndex;
    for (const idx of candidates) {
        if (idx === -1) continue;
        const currentValDiff = Math.abs(sortedArray[idx] - targetValue);
        if (currentValDiff < minDiff) {
            minDiff = currentValDiff;
            finalClosestIndex = idx;
        } else if (currentValDiff === minDiff) {
            if (sortedArray[idx] < sortedArray[finalClosestIndex]) { // Prefer smaller value on tie
                finalClosestIndex = idx;
            }
        }
    }
    return finalClosestIndex;
}

// Export utilities to global scope
window.utils = {
    getValue,
    setValue,
    validateInputs,
    validatePositive,
    mhzToHz,
    hzToMhz,
    getStandardValues: utils_getStandardValues,
    formatResistorValue: formatResistorValue,
    findClosestValueIndex: utils_findClosestValueIndex_binarySearch
}; 
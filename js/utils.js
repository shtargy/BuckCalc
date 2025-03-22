/**
 * Utility functions for DC-DC Converter Calculators
 * 
 * This module provides common functions used by all calculators in the project.
 * All new calculators should use these utilities for consistency and maintainability.
 */

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
    
    // If we have a stored precise value, use that
    if (element.dataset.preciseValue !== undefined) {
        return parseFloat(element.dataset.preciseValue);
    }
    // Otherwise fall back to the input value
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
        // Store the full precision value as a data attribute
        element.dataset.preciseValue = value;
        // Format the displayed value with specified decimals
        element.value = parseFloat(value).toFixed(decimals);
    }
}

/**
 * Validates that all required input fields have values
 * Shows an alert with missing field names if validation fails
 * 
 * @param {Array<number|null>} fields - Array of field values to validate
 * @param {Array<string>} fieldNames - Array of field names (for error messages)
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
function validateInputs(fields, fieldNames) {
    const missing = [];
    
    for (let i = 0; i < fields.length; i++) {
        if (fields[i] === null || isNaN(fields[i])) {
            missing.push(fieldNames[i]);
        }
    }
    
    if (missing.length > 0) {
        alert(`Please enter values for: ${missing.join(', ')}`);
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

// Export utilities to global scope
window.utils = {
    getValue,
    setValue,
    validateInputs,
    validatePositive,
    mhzToHz,
    hzToMhz
}; 
/**
 * Resistor Divider Calculator (v1.2.0)
 *
 * Provides functionality to calculate resistor divider parameters
 * and find standard resistor pairs that match a desired voltage ratio.
 * 
 * Features:
 * - Calculate voltage divider components based on input/output voltages
 * - Find standard resistor pairs from E24/E96/E192 series
 * - Sort results by ratio error, current error, or resistor value
 * - Maintain high precision calculations with friendly display formatting
 * - Color-coded error indication for easy evaluation of results
 * 
 * Last updated: 2023-07-10
 */

// Resistor Divider Calculator Functions

// Standard resistor values for different tolerance series
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

// Generate full range of standard values (1Ω to 10MΩ)
function generateStandardValues(baseValues) {
    const values = [];
    for (let exp = 0; exp <= 6; exp++) { // 10^0 to 10^6
        for (const val of baseValues) {
            values.push(val * Math.pow(10, exp));
        }
    }
    return values;
}

// Cache for standard values to avoid recalculation
const standardValuesCache = {
    '0.1': null, // E192 series
    '1': null,   // E96 series
    '5': null    // E24 series
};

// Helper function to get standard values based on tolerance
function getStandardValues(tolerance) {
    // Ensure tolerance is treated as a string for comparison
    const tolStr = String(tolerance);
   
    // Check cache first
    if (standardValuesCache[tolStr]) {
        return standardValuesCache[tolStr];
    }
   
    let values;
    switch(tolStr) {
        case "0.1":
            values = generateStandardValues(E192_VALUES);
            break;
        case "1":
            values = generateStandardValues(E96_VALUES);
            break;
        case "5":
        default:
            values = generateStandardValues(E24_VALUES);
            break;
    }
   
    // Cache the values for future use
    standardValuesCache[tolStr] = values;
    return values;
}

// Find nearest standard value based on tolerance
function findNearestStandardValue(value, tolerance) {
    const standardValues = getStandardValues(tolerance);
   
    // Find value with smallest logarithmic distance
    return standardValues.reduce((best, current) => {
        const bestError = Math.abs(Math.log10(best) - Math.log10(value));
        const currentError = Math.abs(Math.log10(current) - Math.log10(value));
        return currentError < bestError ? current : best;
    }, standardValues[0]);
}

/**
 * Calculates the middle voltage in a resistor divider
 * 
 * @param {number} vtop - Top voltage
 * @param {number} vbot - Bottom voltage
 * @param {number} rtop - Top resistor value (ohms)
 * @param {number} rbot - Bottom resistor value (ohms)
 * @returns {number} The middle voltage at the divider point
 */
function calculateVmid(vtop, vbot, rtop, rbot) {
    return vbot + (rbot/(rtop + rbot)) * (vtop - vbot);
}

/**
 * Calculates the top resistor value in a voltage divider
 * 
 * @param {number} vtop - Top voltage
 * @param {number} vmid - Middle voltage (output)
 * @param {number} vbot - Bottom voltage
 * @param {number} rbot - Bottom resistor value (ohms)
 * @returns {number} The required top resistor value (ohms)
 */
function calculateRtop(vtop, vmid, vbot, rbot) {
    // For a voltage divider, Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solve for Rtop: Rtop = Rbot * (Vtop-Vmid) / (Vmid-Vbot)
    return rbot * (vtop - vmid) / (vmid - vbot);
}

/**
 * Calculates the bottom resistor value in a voltage divider
 * 
 * @param {number} vtop - Top voltage
 * @param {number} vmid - Middle voltage (output)
 * @param {number} vbot - Bottom voltage
 * @param {number} rtop - Top resistor value (ohms)
 * @returns {number} The required bottom resistor value (ohms)
 */
function calculateRbot(vtop, vmid, vbot, rtop) {
    // For a voltage divider, Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solve for Rbot: Rbot = Rtop * (Vmid-Vbot) / (Vtop-Vmid)
    return rtop * (vmid - vbot) / (vtop - vmid);
}

/**
 * Calculates the top voltage in a resistor divider
 * 
 * @param {number} vmid - Middle voltage
 * @param {number} vbot - Bottom voltage
 * @param {number} rtop - Top resistor value (ohms)
 * @param {number} rbot - Bottom resistor value (ohms)
 * @returns {number} The required top voltage
 */
function calculateVtop(vmid, vbot, rtop, rbot) {
    // For a voltage divider: Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solving for Vtop: Vtop = Vbot + (Vmid-Vbot) * (Rtop+Rbot)/Rbot
    return vbot + (vmid - vbot) * (rtop + rbot) / rbot;
}

/**
 * Calculates the bottom voltage in a resistor divider
 * 
 * @param {number} vtop - Top voltage
 * @param {number} vmid - Middle voltage
 * @param {number} rtop - Top resistor value (ohms)
 * @param {number} rbot - Bottom resistor value (ohms)
 * @returns {number} The required bottom voltage
 */
function calculateVbot(vtop, vmid, rtop, rbot) {
    // For a voltage divider: Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solving for Vbot: Vbot = (Vmid*(Rtop+Rbot) - Vtop*Rbot) / Rtop
    return (vmid * (rtop + rbot) - vtop * rbot) / rtop;
}

// Helper function to get numeric value from an input field
function getValue(id) {
    const value = document.getElementById(id).value;
    return value === '' ? null : parseFloat(value);
}

// Helper function to set output value
function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        // Store full precision internally
        element.dataset.preciseValue = value;
        // Format display with 3 decimal places
        element.value = Number(value).toFixed(3);
        updateCurrentAndPower();
        updateResistorRatio();
    }
}

// Calculate current and power
function updateCurrentAndPower() {
    const vtop = utils.getValue('div-vtop');
    const vbot = utils.getValue('div-vbot');
    const rtop = utils.getValue('div-rtop');
    const rbot = utils.getValue('div-rbot');
   
    if (vtop !== null && vbot !== null && rtop !== null && rbot !== null &&
        !isNaN(vtop) && !isNaN(vbot) && !isNaN(rtop) && !isNaN(rbot) &&
        rtop > 0 && rbot > 0) {
       
        const current = Math.abs((vtop - vbot) / (rtop + rbot));
        const ptop = current * current * rtop;
        const pbot = current * current * rbot;

        document.getElementById('div-current').textContent = (current * 1000).toFixed(2);
        document.getElementById('div-ptop').textContent = (ptop * 1000).toFixed(2);
        document.getElementById('div-pbot').textContent = (pbot * 1000).toFixed(2);
    }
}

// Calculate and update resistor ratio
function updateResistorRatio() {
    const rtop = utils.getValue('div-rtop');
    const rbot = utils.getValue('div-rbot');
   
    if (rtop !== null && rbot !== null && rbot !== 0) {
        const ratio = rtop / rbot;
        document.getElementById('div-ratio').textContent = ratio.toFixed(4);
    } else {
        document.getElementById('div-ratio').textContent = "—";
    }
}

// Track which value was last calculated
let lastCalculated = null;

function calculateDivider(target) {
    const vtop = utils.getValue('div-vtop');
    const vmid = utils.getValue('div-vmid');
    const vbot = utils.getValue('div-vbot');
    const rtop = utils.getValue('div-rtop');
    const rbot = utils.getValue('div-rbot');

    // Store which value we're calculating
    lastCalculated = target;

    try {
        switch (target) {
            case 'vtop':
                if (!utils.validateInputs(
                    [vmid, vbot, rtop, rbot],
                    ['Middle Voltage', 'Bottom Voltage', 'Top Resistor', 'Bottom Resistor']
                )) {
                    return;
                }
               
                const vtopVal = calculateVtop(vmid, vbot, rtop, rbot);
                if (vtopVal <= vmid) throw new Error('Invalid result: Top voltage must be greater than middle voltage');
                utils.setValue('div-vtop', vtopVal, 3);
                break;

            case 'rtop':
                if (!utils.validateInputs(
                    [vtop, vmid, vbot, rbot],
                    ['Top Voltage', 'Middle Voltage', 'Bottom Voltage', 'Bottom Resistor']
                )) {
                    return;
                }
               
                const rtopVal = calculateRtop(vtop, vmid, vbot, rbot);
                if (rtopVal <= 0) throw new Error('Invalid result: Top resistor must be positive');
                utils.setValue('div-rtop', rtopVal, 2);
                break;

            case 'rbot':
                if (!utils.validateInputs(
                    [vtop, vmid, vbot, rtop],
                    ['Top Voltage', 'Middle Voltage', 'Bottom Voltage', 'Top Resistor']
                )) {
                    return;
                }
               
                const rbotVal = calculateRbot(vtop, vmid, vbot, rtop);
                if (rbotVal <= 0) throw new Error('Invalid result: Bottom resistor must be positive');
                utils.setValue('div-rbot', rbotVal, 2);
                break;

            case 'vmid':
                if (!utils.validateInputs(
                    [vtop, vbot, rtop, rbot],
                    ['Top Voltage', 'Bottom Voltage', 'Top Resistor', 'Bottom Resistor']
                )) {
                    return;
                }
               
                // Always recalculate Vmid when Calculate is clicked
                const vmidVal = calculateVmid(vtop, vbot, rtop, rbot);
                utils.setValue('div-vmid', vmidVal, 3);
                break;

            case 'vbot':
                if (!utils.validateInputs(
                    [vtop, vmid, rtop, rbot],
                    ['Top Voltage', 'Middle Voltage', 'Top Resistor', 'Bottom Resistor']
                )) {
                    return;
                }
               
                const vbotVal = calculateVbot(vtop, vmid, rtop, rbot);
                if (vbotVal >= vmid) throw new Error('Invalid result: Bottom voltage must be less than middle voltage');
                utils.setValue('div-vbot', vbotVal, 3);
                break;
        }
        updateCurrentAndPower();
        updateResistorRatio();
    } catch (error) {
        alert(error.message);
    }
}

// Store the last found pairs for sorting
let lastFoundPairs = [];
let currentSortBy = 'ratio'; // Default sort

/**
 * Gets nearby standard resistor values around a target value
 * 
 * @param {Array<number>} standardValues - Array of standard resistor values
 * @param {number} targetValue - Target resistor value to find neighbors for
 * @returns {Array<number>} Array of nearby standard resistor values
 */
function getNearbyStandardValues(standardValues, targetValue) {
    // Get unique base values (between 1 and 10) from the standard values
    const baseValues = extractBaseValues(standardValues);
   
    // Determine the decade and base value of the target
    const targetExponent = Math.floor(Math.log10(targetValue));
    const targetBaseValue = targetValue / Math.pow(10, targetExponent);
   
    // Build a sequential list of all standard values across all decades
    const allSequentialValues = buildSequentialValues(baseValues);
   
    // Find the closest value to our target in the full sequence
    const closestIndex = findClosestValueIndex(
        allSequentialValues.map(item => item.value),
        targetValue,
        true // Use logarithmic comparison
    );
   
    const closestValue = allSequentialValues[closestIndex].value;
   
    // Use fixed window size of 10 values in each direction
    const windowSize = 10;
   
    // Take a window of values around the closest match
    const startIndex = Math.max(0, closestIndex - windowSize);
    const endIndex = Math.min(allSequentialValues.length - 1, closestIndex + windowSize);
   
    // Extract the window of values
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
        result.push(allSequentialValues[i].value);
    }
   
    return result;
}

/**
 * Extract unique base values from standard resistor values
 * Base values are between 1 and 10 and represent the significant digits
 * 
 * @param {Array<number>} standardValues - Array of standard resistor values
 * @returns {Array<number>} Array of unique base values sorted in ascending order
 */
function extractBaseValues(standardValues) {
    const baseValues = [];
    const usedBaseValues = new Set();
   
    for (const value of standardValues) {
        const exponent = Math.floor(Math.log10(value));
        const baseValue = value / Math.pow(10, exponent);
       
        // Use string comparison to avoid floating point precision issues
        if (!usedBaseValues.has(baseValue.toFixed(6))) {
            baseValues.push(baseValue);
            usedBaseValues.add(baseValue.toFixed(6));
        }
    }
   
    // Sort the base values
    return baseValues.sort((a, b) => a - b);
}

/**
 * Find the index of the closest value in an array
 * 
 * @param {Array<number>} values - Array of values to search in
 * @param {number} targetValue - Value to find closest match for
 * @param {boolean} useLogarithmic - Whether to use logarithmic comparison (better for resistor values)
 * @returns {number} Index of the closest value in the array
 */
function findClosestValueIndex(values, targetValue, useLogarithmic = false) {
    let closestIndex = 0;
    let closestError = Infinity;
   
    for (let i = 0; i < values.length; i++) {
        let error;
        if (useLogarithmic) {
            // Logarithmic comparison is better for finding resistor values
            error = Math.abs(Math.log10(values[i]) - Math.log10(targetValue));
        } else {
            error = Math.abs(values[i] - targetValue);
        }
       
        if (error < closestError) {
            closestError = error;
            closestIndex = i;
        }
    }
   
    return closestIndex;
}

/**
 * Build a sequential list of all standard values across multiple decades
 * 
 * @param {Array<number>} baseValues - Array of base values (1-10)
 * @returns {Array<{value: number, baseValue: number, decade: number}>} Array of objects with value, baseValue and decade
 */
function buildSequentialValues(baseValues) {
    const allValues = [];
    
    // Use -3 to +5 decades to cover from milliohms to megaohms
    for (let decade = -3; decade <= 5; decade++) {
        for (const baseValue of baseValues) {
            const value = baseValue * Math.pow(10, decade);
            allValues.push({
                value,
                baseValue,
                decade
            });
        }
    }
    
    // Sort by actual value
    return allValues.sort((a, b) => a.value - b.value);
}

/**
 * Finds standard resistor pairs that match the desired voltage divider ratio
 * 
 * @param {string|number} tolerance - Resistor tolerance (0.1, 1, or 5 percent)
 * @returns {Object} Object with pairs property containing array of matching resistor pairs
 */
function findStandardPairs(tolerance) {
    try {
        // Convert tolerance to number if it's a string
        tolerance = parseFloat(tolerance);
        
        // Get and validate input values
        const values = getAndValidateInputValues();
        if (!values) {
            return { pairs: [] }; // Return object with empty pairs array
        }
       
        const { vtop, vmid, vbot, rtop, rbot } = values;
       
        // Calculate target ratio and original values
        const targetRatio = rtop / rbot;
        const originalSum = rtop + rbot;
        const originalCurrent = Math.abs((vtop - vbot) / originalSum);
       
        // Get standard values and error limit for the selected tolerance
        const standardValues = getStandardValues(tolerance);
        const errorLimit = getErrorLimit(tolerance);
       
        // Get candidate resistors around the originals
        const topValues = getNearbyStandardValues(standardValues, rtop);
        const bottomValues = getNearbyStandardValues(standardValues, rbot);
       
        // Find all valid pairs
        const allPairs = findValidPairs(
            topValues,
            bottomValues,
            { vtop, vmid, vbot, targetRatio, originalSum, originalCurrent },
            errorLimit
        );
       
        // If no acceptable pairs found, return empty result
        if (allPairs.length === 0) {
            return { pairs: [] };
        }
       
        // Create sorted list of best pairs
        const bestPairs = createSortedLists(allPairs);
        
        // Return as object with pairs property
        return { pairs: bestPairs };
    } catch (error) {
        handleError("Error finding standard pairs", error);
        return { pairs: [] };
    }
}

// Helper function to get and validate all input values
function getAndValidateInputValues() {
    const vtop = utils.getValue('div-vtop');
    const vmid = utils.getValue('div-vmid');
    const vbot = utils.getValue('div-vbot');
    const rtop = utils.getValue('div-rtop');
    const rbot = utils.getValue('div-rbot');
   
    // Validate values
    if (!validateInputs(vtop, vmid, vbot, rtop, rbot)) {
        return null;
    }
   
    return { vtop, vmid, vbot, rtop, rbot };
}

/**
 * Get the acceptable error limit based on tolerance
 * 
 * @param {number} tolerance - Resistor tolerance in percent (0.1, 1, or 5)
 * @returns {number} Error limit as a percentage
 */
function getErrorLimit(tolerance) {
    // Allow error based on tolerance
    switch (parseFloat(tolerance)) {
        case 0.1: return 2;    // Allow 2% error for 0.1% tolerance
        case 1:   return 4;    // Allow 4% error for 1% tolerance
        case 5:   return 7;    // Allow 7% error for 5% tolerance
        default:  return 4;    // Default to 1% tolerance behavior
    }
}

/**
 * Validates that all required voltage and resistor inputs are valid
 * 
 * @param {number} vtop - Top voltage
 * @param {number} vmid - Middle voltage
 * @param {number} vbot - Bottom voltage
 * @param {number} rtop - Top resistor value
 * @param {number} rbot - Bottom resistor value
 * @returns {boolean} True if all inputs are valid
 */
function validateInputs(vtop, vmid, vbot, rtop, rbot) {
    // Check that all values are present and valid
    if (isAnyValueInvalid([vtop, vmid, vbot, rtop, rbot])) {
        alert('Please ensure all values are entered and valid');
        return false;
    }
   
    // Check resistor values
    if (rtop <= 0 || rbot <= 0) {
        alert('Resistances must be positive');
        return false;
    }
   
    // Check voltage relationships
    if (!isValidVoltageRange(vtop, vmid, vbot)) {
        alert('Voltage relationships must be: Vtop > Vmid > Vbot');
        return false;
    }
   
    return true;
}

/**
 * Find all valid resistor pairs that meet the error criteria
 * 
 * @param {Array<number>} topValues - Candidate top resistor values
 * @param {Array<number>} bottomValues - Candidate bottom resistor values
 * @param {Object} originalValues - Original values to compare against
 * @param {number} errorLimit - Maximum allowed error percentage
 * @returns {Array<Object>} Array of valid resistor pairs with their metrics
 */
function findValidPairs(topValues, bottomValues, originalValues, errorLimit) {
    const { vtop, vmid, vbot, targetRatio, originalSum, originalCurrent } = originalValues;
    const allPairs = [];
   
    for (const tryRtop of topValues) {
        for (const tryRbot of bottomValues) {
            // Skip invalid combinations
            if (tryRtop <= 0 || tryRbot <= 0) continue;
            
            // Calculate ratio and error
            const ratio = tryRtop / tryRbot;
            const ratioError = calculatePercentError(ratio, targetRatio);
            
            // Filter pairs based on ratio error
            if (Math.abs(ratioError) <= errorLimit) {
                // Calculate metrics for this pair
                const pairMetrics = calculatePairMetrics(
                    tryRtop, tryRbot, vtop, vbot, vmid,
                    ratio, ratioError, originalSum, originalCurrent
                );
                
                // Add to results
                allPairs.push(pairMetrics);
            }
        }
    }
    
    return allPairs;
}

// Calculate all metrics for a resistor pair
function calculatePairMetrics(rtop, rbot, vtop, vbot, vmid, ratio, ratioError, originalSum, originalCurrent) {
    // Calculate resulting Vmid
    const resultVmid = calculateVmid(vtop, vbot, rtop, rbot);
   
    // Calculate current-related metrics
    const sum = rtop + rbot;
    const current = Math.abs((vtop - vbot) / sum);
   
    return {
        rtop,
        rbot,
        vmid: resultVmid,
        ratio,
        ratioError,
        sumError: calculatePercentError(sum, originalSum),
        vmidError: calculatePercentError(resultVmid, vmid),
        current,
        currentError: calculatePercentError(current, originalCurrent)
    };
}

// Define error limits for different tolerance classes (for display purposes only)
const ERROR_LIMITS = {
    '0.1': { description: '0.1% (E192 series)', limit: 2 },
    '1': { description: '1% (E96 series)', limit: 4 },
    '5': { description: '5% (E24 series)', limit: 7 }
};

/**
 * Calculate percentage error between actual and expected values
 * 
 * @param {number} actual - Actual measured value
 * @param {number} expected - Expected or target value
 * @returns {number} Percentage error (positive or negative)
 */
function calculatePercentError(actual, expected) {
    // Avoid division by zero
    if (expected === 0) return actual === 0 ? 0 : 100;
    return ((actual - expected) / expected) * 100;
}

/**
 * Create a sorted list of resistor pairs
 * 
 * @param {Array<Object>} allPairs - Array of all valid resistor pairs
 * @returns {Array<Object>} Sorted list of pairs by ratio error (maximum 20 pairs)
 */
function createSortedLists(allPairs) {
    // Sort by ratio error (ascending) and take top 20 pairs
    return allPairs
        .sort((a, b) => Math.abs(a.ratioError) - Math.abs(b.ratioError))
        .slice(0, 20); // Limit to top 20 pairs
}

// Check if any value is null, undefined, NaN, or empty
function isAnyValueInvalid(values) {
    return values.some(value =>
        value === null ||
        value === undefined ||
        isNaN(value)
    );
}

// Check if voltages are in correct ascending order
function isValidVoltageRange(vtop, vmid, vbot) {
    return vtop > vmid && vmid > vbot;
}

// Keep track of the current tolerance selection
let currentTolerance = '5'; // Default to 5%

/**
 * Populates the standard value pairs table based on the selected tolerance.
 *
 * @param {string} tolerance - The tolerance value ('0.1', '1', or '5')
 */
function showStandardPairs(tolerance) {
    try {
        // Save the current tolerance selection
        currentTolerance = tolerance;
        
        // Set default values if needed
        setDefaultValuesIfNeeded();
        
        // Update calculated values based on inputs
        updateCurrentAndPower();
        updateResistorRatio();
        
        // Get required DOM elements - use the correct IDs from HTML
        const container = document.getElementById('standard-values-container');
        if (!container) {
            handleError("Container element not found!");
            return;
        }
        
        const table = document.getElementById('standard-values-table');
        if (!table) {
            handleError("Table element not found!");
            return;
        }
        
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            handleError("Table body element not found!");
            return;
        }
        
        // Get input values and validate
        const values = getAndValidateInputValues();
        if (!values) return;
        
        // Find standard resistor pairs - pass only tolerance
        const result = findStandardPairs(tolerance);
        
        // Check if we have any valid pairs
        if (!result || !result.pairs || result.pairs.length === 0) {
            showNoResultsMessage(tbody, tolerance);
            updateToleranceTitle(tolerance);
            return;
        }
        
        // Store the pairs for sorting later
        lastFoundPairs = result.pairs;
        
        // Sort by the last used sorting criteria
        sortAndDisplayPairs(lastFoundPairs);
        
        // Update title to show current tolerance
        const title = document.getElementById('standard-values-title');
        if (title) {
            title.textContent = `Standard ${tolerance}% Resistor Pairs:`;
        }
        
        // Show the container
        container.style.display = 'block';
        
        // Set up sort button handlers
        setupSortButtons();
    } catch (error) {
        handleError("Error in showStandardPairs:", error);
        alert("Error generating standard pairs: " + error.message);
    }
}

// Helper functions for showing standard pairs
function setDefaultValuesIfNeeded() {
    // Force any blank inputs to valid defaults before calculations
    if (utils.getValue('div-vtop') === null) utils.setValue('div-vtop', "5", 3);
    if (utils.getValue('div-vmid') === null) utils.setValue('div-vmid', "2.5", 3);
    if (utils.getValue('div-vbot') === null) utils.setValue('div-vbot', "0", 3);
    if (utils.getValue('div-rtop') === null) utils.setValue('div-rtop', "10000", 2);
    if (utils.getValue('div-rbot') === null) utils.setValue('div-rbot', "10000", 2);
}

function getRequiredDOMElements() {
    const container = document.getElementById('standard-values-container');
    if (!container) {
        handleError("Container element not found!");
        return null;
    }

    const table = document.getElementById('standard-values-table');
    if (!table) {
        handleError("Table element not found!");
        return null;
    }
   
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        handleError("Table body element not found!");
        return null;
    }
   
    return { container, table, tbody };
}

function showNoResultsMessage(tbody, tolerance) {
    tbody.innerHTML = `<tr><td colspan="7">No valid resistor pairs found. Try adjusting your input values or selecting a different tolerance level.</td></tr>`;
}

function updateToleranceTitle(tolerance) {
    const title = document.getElementById('standard-values-title');
    if (title) {
        title.textContent = `Standard ${tolerance}% Resistor Pairs:`;
    }
}

/**
 * Sort and display resistor pairs in the UI table
 * 
 * @param {Array<Object>} pairs - Array of resistor pairs to display
 */
function sortAndDisplayPairs(pairs) {
    if (!pairs || pairs.length === 0) {
        // Display a message if no pairs found
        const container = document.getElementById('standard-values-container');
        if (container) {
            container.innerHTML = '<p class="no-pairs-message">No matching resistor pairs found. Try adjusting tolerance or voltage values.</p>';
        } else {
            handleError("Container element not found!");
        }
        return;
    }
    
    // Sort the pairs based on selected criteria
    const sortedPairs = [...pairs].sort(createSortFunction(currentSortBy));
    
    // Get the table element
    const table = document.getElementById('standard-values-table');
    if (!table) {
        handleError("Table element not found!");
        return;
    }
    
    // Clear existing table rows
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        handleError("Table body element not found!");
        return;
    }
    
    tbody.innerHTML = '';
    
    // Show container
    const container = document.getElementById('standard-values-container');
    if (container) {
        container.style.display = 'block';
    }
    
    // Add pairs to table
    addPairsToTable(tbody, sortedPairs);
}

/**
 * Creates a sort function based on the selected criteria
 * 
 * @param {string} sortBy - Sort criteria ('ratio', 'current', or 'topR')
 * @returns {Function} A comparison function for sorting
 */
function createSortFunction(sortBy) {
    switch (sortBy) {
        case 'ratio':
            return (a, b) => Math.abs(a.ratioError) - Math.abs(b.ratioError);
        case 'current':
            return (a, b) => Math.abs(a.currentError) - Math.abs(b.currentError);
        case 'topR':
            return (a, b) => a.rtop - b.rtop;
        default:
            return (a, b) => Math.abs(a.ratioError) - Math.abs(b.ratioError);
    }
}

/**
 * Toggle sort order for standard pairs and update display
 * 
 * @param {string} sortBy - Sort criteria ('ratio', 'current', or 'topR')
 */
function sortPairs(sortBy) {
    if (!lastFoundPairs || lastFoundPairs.length === 0) {
        handleError("No valid pairs data provided to sortAndDisplayPairs");
        return;
    }
    
    // Set current sort mode
    currentSortBy = sortBy;
    
    // Get table body
    const tbody = document.getElementById('standard-values-table').querySelector('tbody');
    if (!tbody) {
        handleError("Table body element not found");
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Sort and add pairs
    const sortedPairs = [...lastFoundPairs].sort(createSortFunction(sortBy));
    addPairsToTable(tbody, sortedPairs);
    
    // Update sort button states
    updateSortButtonStates(sortBy);
}

/**
 * Thresholds for different error classes (for visual indication)
 * These values determine the color coding of errors in the UI
 */
const ERROR_THRESHOLDS = {
    // Thresholds for ratio error (excellent, good, acceptable)
    ratio: [0.5, 1.0, 3.0],
    // Thresholds for current error (excellent, good, acceptable)
    current: [1.0, 3.0, 5.0]
};

/**
 * Determines the visual class for an error value
 *
 * @param {number} absError - The absolute error value
 * @param {Array<number>} thresholds - Array of thresholds [excellent, good, acceptable]
 * @param {string} prefix - Class name prefix
 * @returns {string} CSS class name for the error
 */
function getErrorClass(absError, thresholds, prefix) {
    if (absError < thresholds[0]) {
        return `${prefix}-excellent`;
    } else if (absError < thresholds[1]) {
        return `${prefix}-good`;
    } else if (absError < thresholds[2]) {
        return `${prefix}-acceptable`;
    } else {
        return `${prefix}-poor`;
    }
}

/**
 * Creates and appends a table row for a resistor pair
 *
 * @param {HTMLTableSectionElement} tbody - Table body element
 * @param {Object} pair - Resistor pair data object
 */
function createAndAppendTableRow(tbody, pair) {
    const row = document.createElement('tr');
   
    // Add all cells to the row
    addCell(row, formatResistorValue(pair.rtop));
    addCell(row, formatResistorValue(pair.rbot));
    addCell(row, pair.ratio.toFixed(4));
    addErrorCell(row, pair.ratioError, getErrorClass(Math.abs(pair.ratioError), ERROR_THRESHOLDS.ratio, 'error'));
    addCell(row, pair.vmid.toFixed(3) + ' V');
    addCell(row, (pair.current * 1000).toFixed(2) + ' mA');
    addErrorCell(row, pair.currentError, getErrorClass(Math.abs(pair.currentError), ERROR_THRESHOLDS.current, 'current-error'));
   
    tbody.appendChild(row);
}

// Helper functions for creating table cells
function addCell(row, content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    row.appendChild(cell);
    return cell;
}

function addErrorCell(row, errorValue, className) {
    const cell = document.createElement('td');
    const absError = Math.abs(errorValue);
   
    // Format with sign and precision
    const errorSign = errorValue < 0 ? "-" : "+";
    cell.textContent = `${errorSign}${absError.toFixed(2)}%`;
   
    // Add appropriate class
    cell.className = className;
   
    row.appendChild(cell);
    return cell;
}

// Set up sort button event handlers
function setupSortButtons() {
    const sortByRatioButton = document.getElementById('sort-by-ratio');
    const sortByCurrentButton = document.getElementById('sort-by-current');
    const sortByTopRButton = document.getElementById('sort-by-topR');
   
    if (sortByRatioButton && sortByCurrentButton) {
        // Set initial active state based on current sort
        updateSortButtonsState(sortByRatioButton, sortByCurrentButton, sortByTopRButton);
       
        // Add click handlers
        sortByRatioButton.onclick = () => {
            updateActiveSortButton('ratio', sortByRatioButton, sortByCurrentButton, sortByTopRButton);
        };
       
        sortByCurrentButton.onclick = () => {
            updateActiveSortButton('current', sortByCurrentButton, sortByRatioButton, sortByTopRButton);
        };
       
        // Add handler for new topR button if it exists
        if (sortByTopRButton) {
            sortByTopRButton.onclick = () => {
                updateActiveSortButton('topR', sortByTopRButton, sortByRatioButton, sortByCurrentButton);
            };
        }
    } else {
        handleError("Sort buttons not found in the DOM");
    }
}

// Update sort button visual state
function updateSortButtonsState(ratioButton, currentButton, topRButton) {
    ratioButton.classList.toggle('active', currentSortBy === 'ratio');
    currentButton.classList.toggle('active', currentSortBy === 'current');
    if (topRButton) {
        topRButton.classList.toggle('active', currentSortBy === 'topR');
    }
}

/**
 * Updates the active sort button and performs sorting
 *
 * @param {string} sortType - Type of sorting ('ratio', 'current', or 'topR')
 * @param {HTMLElement} activeButton - Button to make active
 * @param {...HTMLElement} inactiveButtons - Buttons to make inactive
 */
function updateActiveSortButton(sortType, activeButton, ...inactiveButtons) {
    currentSortBy = sortType;
    activeButton.classList.add('active');
    inactiveButtons.forEach(button => {
        if (button) button.classList.remove('active');
    });
    sortAndDisplayPairs(lastFoundPairs);
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
    } else {
        return value.toFixed(2) + ' Ω';
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);

// Main initialization function
function initializeCalculator() {
    // Set up input event listeners
    setupInputListeners();
   
    // Initial calculation
    updateResistorRatio();
   
    // Set up standard value button event listeners
    setupStandardValueButtons();
}

// Set up input field event listeners
function setupInputListeners() {
    const inputs = ['div-vtop', 'div-vmid', 'div-vbot', 'div-rtop', 'div-rbot'];
   
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateResistorRatio);
        } else {
            handleError(`Element ${id} not found!`);
        }
    });
}

// Set up standard value button event listeners
function setupStandardValueButtons() {
    const standardButtons = [
        { id: 'standard-01', tolerance: '0.1' },
        { id: 'standard-1', tolerance: '1' },
        { id: 'standard-5', tolerance: '5' }
    ];
   
    standardButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            element.addEventListener('click', function() {
                showStandardPairs(button.tolerance);
            });
        } else {
            handleError(`Button element ${button.id} not found!`);
        }
    });
}

// Mark this calculator as loaded
window.dividerLoaded = true;

// Make showStandardPairs globally accessible
window.showStandardPairs = showStandardPairs;

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'divider',              // ID
        'Resistor Divider',     // Name
        'Voltage divider and resistor pair calculator', // Description
        {
            calculateDivider: calculateDivider,
            findStandardPairs: findStandardPairs,
            updateCurrentAndPower: updateCurrentAndPower,
            updateResistorRatio: updateResistorRatio
        }
    );
}

// Make calculator functions globally accessible for backwards compatibility
window.calculateDivider = calculateDivider;
window.findStandardPairs = findStandardPairs;
window.updateCurrentAndPower = updateCurrentAndPower;
window.updateResistorRatio = updateResistorRatio;

/**
 * Production-appropriate error handling function
 * Only logs errors in development environments
 * 
 * @param {string} message - Error message
 * @param {Error} error - Original error object (optional)
 */
function handleError(message, error = null) {
    // Only log to console in development environments
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '') {
        if (error) {
            console.error(message, error);
        } else {
            console.error(message);
        }
    }
    
    // For production, we could send errors to a monitoring service here
    // Add analytics or error reporting in production
    if (window.errorReporter && typeof window.errorReporter.reportError === 'function') {
        try {
            window.errorReporter.reportError({
                source: 'divider-calculator',
                message,
                details: error ? error.toString() : null,
                stack: error?.stack
            });
        } catch (e) {
            // Don't let error reporting failures crash the app
        }
    }
}

/**
 * Add resistor pairs to the table
 * 
 * @param {HTMLElement} tbody - Table body element to add rows to
 * @param {Array<Object>} pairs - Array of resistor pairs to add
 */
function addPairsToTable(tbody, pairs) {
    if (pairs.length === 0) {
        showNoResultsMessage(tbody, getSelectedTolerance());
        return;
    }
    
    // Add new rows
    for (const pair of pairs) {
        createAndAppendTableRow(tbody, pair);
    }
}

// Get the currently selected tolerance from radio buttons
function getSelectedTolerance() {
    const toleranceRadios = document.querySelectorAll('input[name="div-tolerance"]');
    for (const radio of toleranceRadios) {
        if (radio.checked) {
            return parseFloat(radio.value);
        }
    }
    return 1; // Default to 1% if none selected
}
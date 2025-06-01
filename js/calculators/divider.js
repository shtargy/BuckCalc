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
// const E24_VALUES = [...]; // REMOVED - Now in utils.js
// const E96_VALUES = [...]; // REMOVED - Now in utils.js
// const E192_VALUES = [...]; // REMOVED - Now in utils.js

// Generate full range of standard values (1Ω to 10MΩ)
// function generateStandardValues(baseValues) { ... } // REMOVED - Now in utils.js as utils_generateStandardValues, accessed via utils.getStandardValues

// Cache for standard values to avoid recalculation
// const standardValuesCache = { ... }; // REMOVED - Now in utils.js as utils_standardValuesCache, managed by utils.getStandardValues

// Helper function to get standard values based on tolerance
// function getStandardValues(tolerance) { ... } // REMOVED - Now use window.utils.getStandardValues(tolerance)

// Find nearest standard value based on tolerance
function findNearestStandardValue(value, tolerance) {
    const standardValues = window.utils.getStandardValues(tolerance); // UPDATED
   
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
    const vtop = getValue('div-vtop');
    const vbot = getValue('div-vbot');
    const rtop = getValue('div-rtop');
    const rbot = getValue('div-rbot');
   
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
    const rtop = getValue('div-rtop');
    const rbot = getValue('div-rbot');
   
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
    const vtop = getValue('div-vtop');
    const vmid = getValue('div-vmid');
    const vbot = getValue('div-vbot');
    const rtop = getValue('div-rtop');
    const rbot = getValue('div-rbot');

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
                setValue('div-vtop', vtopVal);
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
                setValue('div-rtop', rtopVal);
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
                setValue('div-rbot', rbotVal);
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
                setValue('div-vmid', vmidVal);
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
                setValue('div-vbot', vbotVal);
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
        const standardValues = window.utils.getStandardValues(tolerance);
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
    const vtop = getValue('div-vtop');
    const vmid = getValue('div-vmid');
    const vbot = getValue('div-vbot');
    const rtop = getValue('div-rtop');
    const rbot = getValue('div-rbot');
    
    // Validate values
    if (isAnyValueInvalid([vtop, vmid, vbot, rtop, rbot])) {
        return null;
    }
    
    // Check voltage relationships
    if (!isValidVoltageRange(vtop, vmid, vbot)) {
        alert('Voltage must be in the correct order: Vtop > Vmid > Vbot');
        return null;
    }
    
    // Check resistor values
    if (rtop <= 0 || rbot <= 0) {
        alert('Resistor values must be positive');
        return null;
    }
    
    // Calculate target ratio
    const targetRatio = rtop / rbot;
    const originalSum = rtop + rbot;
    const originalCurrent = Math.abs((vtop - vbot) / originalSum);
    
    return { vtop, vmid, vbot, rtop, rbot, targetRatio, originalSum, originalCurrent };
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

// Helper function to set default values if needed
function setDefaultValuesIfNeeded() {
    // Force any blank inputs to valid defaults before calculations
    if (getValue('div-vtop') === null) setValue('div-vtop', 5);
    if (getValue('div-vmid') === null) setValue('div-vmid', 2.5);
    if (getValue('div-vbot') === null) setValue('div-vbot', 0);
    if (getValue('div-rtop') === null) setValue('div-rtop', 10000);
    if (getValue('div-rbot') === null) setValue('div-rbot', 10000);
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
    addCell(row, window.utils.formatResistorValue(pair.rtop));
    addCell(row, window.utils.formatResistorValue(pair.rbot));
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
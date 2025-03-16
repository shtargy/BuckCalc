// Resistor Divider Calculator Functions

// Standard resistor values for different tolerance series
const E24_VALUES = [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];

const E12_VALUES = [
    1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2
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

// Helper function to get standard values based on tolerance
function getStandardValues(tolerance) {
    console.log(`Getting standard values for tolerance: ${tolerance}, type: ${typeof tolerance}`);
    
    // Ensure tolerance is treated as a string for comparison
    const tolStr = String(tolerance);
    
    switch(tolStr) {
        case "0.1":
            console.log("Using E192 series for 0.1% tolerance");
            return generateStandardValues(E192_VALUES); // 0.1% uses E192 series
        case "1":
            console.log("Using E96 series for 1% tolerance");
            return generateStandardValues(E96_VALUES); // 1% uses E96 series
        case "5":
            console.log("Using E24 series for 5% tolerance");
            return generateStandardValues(E24_VALUES); // 5% uses E24 series
        default:
            console.log(`Defaulting to E24 series for unknown tolerance: ${tolStr}`);
            return generateStandardValues(E24_VALUES);
    }
}

// Find nearest standard value based on tolerance
function findNearestStandardValue(value, tolerance) {
    const standardValues = getStandardValues(tolerance);
    
    // Initially set to extremes to ensure they'll be replaced
    let bestValue = standardValues[0];
    let bestError = Infinity;
    
    // Search through all standard values
    for (const stdValue of standardValues) {
        // Calculate error using logarithmic comparison for better resistor value matching
        const error = Math.abs(Math.log10(value) - Math.log10(stdValue));
        if (error < bestError) {
            bestError = error;
            bestValue = stdValue;
        }
    }
    
    return bestValue;
}

// Helper function to calculate Vmid
function calculateVmid(vtop, vbot, rtop, rbot) {
    return vbot + (rbot/(rtop + rbot)) * (vtop - vbot);
}

// Helper function to calculate Rtop
function calculateRtop(vtop, vmid, vbot, rbot) {
    // For a voltage divider, Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solve for Rtop: Rtop = Rbot * (Vtop-Vmid) / (Vmid-Vbot)
    return rbot * (vtop - vmid) / (vmid - vbot);
}

// Helper function to calculate Rbot
function calculateRbot(vtop, vmid, vbot, rtop) {
    // For a voltage divider, Vmid = Vbot + (Rbot/(Rtop+Rbot)) * (Vtop-Vbot)
    // Solve for Rbot: Rbot = Rtop * (Vmid-Vbot) / (Vtop-Vmid)
    return rtop * (vmid - vbot) / (vtop - vmid);
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
            case 'rtop':
                if (!utils.validateInputs(
                    [vtop, vmid, vbot, rbot], 
                    ['Top Voltage', 'Middle Voltage', 'Bottom Voltage', 'Bottom Resistor']
                )) {
                    return;
                }
                
                const rtopVal = calculateRtop(vtop, vmid, vbot, rbot);
                if (rtopVal <= 0) throw new Error('Invalid result: Top resistor must be positive');
                utils.setValue('div-rtop', rtopVal);
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
                utils.setValue('div-rbot', rbotVal);
                break;

            case 'vmid':
                if (!utils.validateInputs(
                    [vtop, vbot, rtop, rbot], 
                    ['Top Voltage', 'Bottom Voltage', 'Top Resistor', 'Bottom Resistor']
                )) {
                    return;
                }
                
                // Only recalculate Vmid if it wasn't our target value
                if (lastCalculated !== 'rtop' && lastCalculated !== 'rbot') {
                    const vmidVal = calculateVmid(vtop, vbot, rtop, rbot);
                    utils.setValue('div-vmid', vmidVal);
                }
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

// Find optimal standard value resistor pairs
function findStandardPairs(tolerance) {
    console.log(`Finding standard pairs for tolerance: ${tolerance}%`);
    
    // Get and validate input values
    const vtop = utils.getValue('div-vtop');
    const vmid = utils.getValue('div-vmid');
    const vbot = utils.getValue('div-vbot');
    const rtop = utils.getValue('div-rtop');
    const rbot = utils.getValue('div-rbot');
    
    // Validate values
    if (!utils.validateInputs(vtop, vmid, vbot, rtop, rbot)) {
        return [];
    }
    
    // Calculate target ratio and original sum (for current reference)
    const targetRatio = rtop / rbot;
    const originalSum = rtop + rbot;
    
    console.log(`Target ratio: ${targetRatio.toFixed(6)}, Original sum: ${originalSum.toFixed(2)} Ω`);
    
    // Get standard values for the selected tolerance
    const standardValues = getStandardValues(tolerance);
    
    // Find the decades of the target resistors
    const rtopDecade = Math.floor(Math.log10(rtop));
    const rbotDecade = Math.floor(Math.log10(rbot));
    
    // Get lists of top and bottom resistor values to consider
    const topValues = getNearbyStandardValues(standardValues, rtop, rtopDecade);
    const bottomValues = getNearbyStandardValues(standardValues, rbot, rbotDecade);
    
    console.log(`Using ${topValues.length} standard values around Rtop and ${bottomValues.length} around Rbot`);
    
    // Generate all possible combinations and calculate their properties
    const pairs = generatePairs(topValues, bottomValues, vtop, vbot, vmid, targetRatio, originalSum);
    
    // Filter to pairs with acceptable ratio errors for the given tolerance
    const ratioErrorLimit = getErrorLimit(tolerance);
    const acceptablePairs = pairs.filter(pair => Math.abs(pair.ratioError) <= ratioErrorLimit);
    
    // If we don't have enough pairs, relax the constraint
    const goodPairs = acceptablePairs.length >= 10 ? acceptablePairs : pairs;
    
    // First sort by ratio error, then take top 20
    goodPairs.sort((a, b) => Math.abs(a.ratioError) - Math.abs(b.ratioError));
    const topRatioPairs = goodPairs.slice(0, 20);
    
    // Then sort those by sum error (to keep current close to original)
    topRatioPairs.sort((a, b) => Math.abs(a.sumError) - Math.abs(b.sumError));
    
    // Return the top 10 pairs
    return topRatioPairs.slice(0, 10);
}

// Helper functions for findStandardPairs
function validateInputs(vtop, vmid, vbot, rtop, rbot) {
    if (vtop === null || vmid === null || vbot === null || rtop === null || rbot === null) {
        alert('Please ensure all values are entered and valid');
        return false;
    }
    
    if (rtop <= 0 || rbot <= 0) {
        alert('Resistances must be positive');
        return false;
    }
    
    if (vtop <= vmid || vmid <= vbot) {
        alert('Voltage relationships must be: Vtop > Vmid > Vbot');
        return false;
    }
    
    return true;
}

function getNearbyStandardValues(standardValues, targetValue, targetDecade) {
    const numNeighbors = 10;
    
    // Filter to values in relevant decades
    const relevantValues = standardValues.filter(v => {
        const decade = Math.floor(Math.log10(v));
        return Math.abs(decade - targetDecade) <= 1;
    });
    
    // Find values above and below the target
    const valuesAbove = relevantValues
        .filter(v => v >= targetValue)
        .sort((a, b) => a - b)
        .slice(0, numNeighbors);
    
    const valuesBelow = relevantValues
        .filter(v => v < targetValue)
        .sort((a, b) => b - a)
        .slice(0, numNeighbors);
    
    // Combine and ensure we have enough values
    let result = [...valuesBelow, ...valuesAbove];
    
    if (result.length < numNeighbors) {
        // If we don't have enough values, add more from nearest decades
        const additionalValues = standardValues
            .filter(v => !result.includes(v) && Math.abs(Math.log10(v) - Math.log10(targetValue)) < 1)
            .sort((a, b) => 
                Math.abs(Math.log10(a) - Math.log10(targetValue)) - 
                Math.abs(Math.log10(b) - Math.log10(targetValue))
            )
            .slice(0, numNeighbors - result.length);
        
        result = [...result, ...additionalValues];
    }
    
    return result;
}

function generatePairs(topValues, bottomValues, vtop, vbot, vmid, targetRatio, originalSum) {
    const pairs = [];
    
    for (const tryRtop of topValues) {
        for (const tryRbot of bottomValues) {
            // Calculate ratio and error
            const ratio = tryRtop / tryRbot;
            const ratioError = ((ratio - targetRatio) / targetRatio) * 100;
            
            // Calculate resulting Vmid
            const resultVmid = calculateVmid(vtop, vbot, tryRtop, tryRbot);
            const vmidError = ((resultVmid - vmid) / vmid) * 100;
            
            // Calculate current-related metrics
            const sum = tryRtop + tryRbot;
            const sumError = ((sum - originalSum) / originalSum) * 100;
            const current = Math.abs((vtop - vbot) / sum);
            const originalCurrent = Math.abs((vtop - vbot) / originalSum);
            const currentError = ((current - originalCurrent) / originalCurrent) * 100;
            
            pairs.push({
                rtop: tryRtop,
                rbot: tryRbot,
                vmid: resultVmid,
                ratio: ratio,
                ratioError: ratioError,
                sumError: sumError,
                vmidError: vmidError,
                current: current,
                currentError: currentError
            });
        }
    }
    
    return pairs;
}

function getErrorLimit(tolerance) {
    // Return appropriate error limits based on resistor tolerance
    switch(tolerance) {
        case '0.1': return 1.0; // 0.1% resistors
        case '1': return 2.0;   // 1% resistors
        default: return 5.0;    // 5% resistors or other
    }
}

// Populate the standard value pairs table
function showStandardPairs(tolerance) {
    console.log(`Showing standard pairs for ${tolerance}% tolerance`);
    
    try {
        // Set default values if needed
        setDefaultValuesIfNeeded();
        
        // Update calculated values based on inputs
        updateCurrentAndPower();
        updateResistorRatio();
        
        // Get required DOM elements
        const elements = getRequiredDOMElements();
        if (!elements) return;
        
        const { container, table, tbody } = elements;
        
        // Find standard pairs
        const standardPairs = findStandardPairs(tolerance);
        console.log(`Found ${standardPairs ? standardPairs.length : 0} standard pairs`);
        
        if (!standardPairs || standardPairs.length === 0) {
            showNoResultsMessage(tbody);
            updateToleranceTitle(tolerance);
            return;
        }
        
        // Store the pairs for sorting later
        lastFoundPairs = standardPairs;
        
        // Sort by the last used sorting criteria
        sortAndDisplayPairs(lastFoundPairs, currentSortBy);
        
        updateToleranceTitle(tolerance);
        
        // Set up sort button handlers
        setupSortButtons();
    } catch (error) {
        console.error("Error in showStandardPairs:", error);
        alert("Error generating standard pairs: " + error.message);
    }
}

// Helper functions for showing standard pairs
function setDefaultValuesIfNeeded() {
    // Force any blank inputs to valid defaults before calculations
    if (utils.getValue('div-vtop') === null) utils.setValue('div-vtop', "5");
    if (utils.getValue('div-vmid') === null) utils.setValue('div-vmid', "2.5");
    if (utils.getValue('div-vbot') === null) utils.setValue('div-vbot', "0");
    if (utils.getValue('div-rtop') === null) utils.setValue('div-rtop', "10000");
    if (utils.getValue('div-rbot') === null) utils.setValue('div-rbot', "10000");
}

function getRequiredDOMElements() {
    const container = document.getElementById('standard-values-container');
    if (!container) {
        console.error("Container element not found!");
        alert("Error: Could not find the table container element");
        return null;
    }

    const table = document.getElementById('standard-values-table');
    if (!table) {
        console.error("Table element not found!");
        alert("Error: Could not find the table element");
        return null;
    }
    
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error("Table body element not found!");
        alert("Error: Could not find the table body element");
        return null;
    }
    
    return { container, table, tbody };
}

function showNoResultsMessage(tbody) {
    tbody.innerHTML = '<tr><td colspan="7">No valid pairs found. Please check your input values.</td></tr>';
}

function updateToleranceTitle(tolerance) {
    document.getElementById('standard-values-title').textContent = `Standard ${tolerance}% Resistor Pairs:`;
}

// Function to sort and display pairs
function sortAndDisplayPairs(pairs, sortBy) {
    // Clone the pairs array to avoid modifying the original
    const sortedPairs = [...pairs];
    
    // Sort by the specified criteria
    if (sortBy === 'ratio') {
        sortedPairs.sort((a, b) => Math.abs(a.ratioError) - Math.abs(b.ratioError));
    } else if (sortBy === 'current') {
        sortedPairs.sort((a, b) => Math.abs(a.currentError) - Math.abs(b.currentError));
    }
    
    // Get the table body and clear existing rows
    const tbody = document.getElementById('standard-values-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    // Add new rows
    for (const pair of sortedPairs) {
        createAndAppendTableRow(tbody, pair);
    }
}

function createAndAppendTableRow(tbody, pair) {
    const row = document.createElement('tr');
    
    // Top Resistor
    addCell(row, formatResistorValue(pair.rtop));
    
    // Bottom Resistor
    addCell(row, formatResistorValue(pair.rbot));
    
    // Resistor Ratio
    addCell(row, pair.ratio.toFixed(4));
    
    // Ratio Error
    addErrorCell(row, pair.ratioError, getErrorClass(Math.abs(pair.ratioError), [0.1, 0.5, 1.0], 'error'));
    
    // Resulting Vmid
    addCell(row, pair.vmid.toFixed(3) + ' V');
    
    // Resulting Current
    addCell(row, (pair.current * 1000).toFixed(2) + ' mA');
    
    // Current Error
    addErrorCell(row, pair.currentError, getErrorClass(Math.abs(pair.currentError), [1.0, 5.0, 10.0], 'current-error'));
    
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

// Set up sort button event handlers
function setupSortButtons() {
    const sortByRatioButton = document.getElementById('sort-by-ratio');
    const sortByCurrentButton = document.getElementById('sort-by-current');
    
    if (sortByRatioButton && sortByCurrentButton) {
        // Set initial active state based on current sort
        sortByRatioButton.classList.toggle('active', currentSortBy === 'ratio');
        sortByCurrentButton.classList.toggle('active', currentSortBy === 'current');
        
        // Add click handlers
        sortByRatioButton.onclick = () => {
            currentSortBy = 'ratio';
            sortByRatioButton.classList.add('active');
            sortByCurrentButton.classList.remove('active');
            sortAndDisplayPairs(lastFoundPairs, currentSortBy);
        };
        
        sortByCurrentButton.onclick = () => {
            currentSortBy = 'current';
            sortByCurrentButton.classList.add('active');
            sortByRatioButton.classList.remove('active');
            sortAndDisplayPairs(lastFoundPairs, currentSortBy);
        };
    } else {
        console.error("Sort buttons not found in the DOM");
    }
}

// Format resistor value with appropriate prefix (Ω, kΩ, MΩ)
function formatResistorValue(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + ' MΩ';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(2) + ' kΩ';
    } else {
        return value.toFixed(2) + ' Ω';
    }
}

// Add input event listeners to update values and table
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired for resistor divider calculator");
    
    const inputs = ['div-vtop', 'div-vmid', 'div-vbot', 'div-rtop', 'div-rbot'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateResistorRatio);
            console.log(`Added input event listener to ${id}`);
        } else {
            console.error(`Element ${id} not found!`);
        }
    });
    updateResistorRatio();
    
    // Add standard value button event listeners
    const standardButtons = [
        { id: 'standard-01', tolerance: '0.1' },
        { id: 'standard-1', tolerance: '1' },
        { id: 'standard-5', tolerance: '5' }
    ];
    
    standardButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            element.addEventListener('click', function() {
                console.log(`${button.id} clicked, showing ${button.tolerance}% standard pairs`);
                showStandardPairs(button.tolerance);
            });
            console.log(`Added click event listener to ${button.id}`);
        } else {
            console.error(`Button element ${button.id} not found!`);
        }
    });
    
    console.log("Resistor divider calculator initialization complete");
});

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
// Standard Resistor Values Calculator (v1.0.0)

// E-series values and generation functions are now in utils.js

// Cache for standard values to avoid recalculation
// const rsv_standardValuesCache = {
//     '0.1': null, // E192 series
//     '1': null,   // E96 series
//     '5': null    // E24 series
// };

// Helper function to get standard values based on tolerance
// function rsv_getStandardValues(tolerance) {
//     const tolStr = String(tolerance);
//     if (rsv_standardValuesCache[tolStr]) {
//         return rsv_standardValuesCache[tolStr];
//     }
//    
//     let baseVals;
//     switch(tolStr) {
//         case "0.1": baseVals = E192_VALUES; break; // E192_VALUES will be global from utils.js
//         case "1":   baseVals = E96_VALUES;  break; // E96_VALUES will be global from utils.js
//         case "5":
//         default:    baseVals = E24_VALUES;  break; // E24_VALUES will be global from utils.js
//     }
//    
//     // generateStandardValues is now utils_generateStandardValues in utils.js,
//     // but we should call the main getter: utils.getStandardValues
//     const generatedValues = window.utils.generateStandardValues(baseVals); // This line is actually wrong, should use the main getter
//     rsv_standardValuesCache[tolStr] = generatedValues;
//     return generatedValues;
// }

// Function to find the index of the closest value in a sorted array
/* // REMOVED - Now in utils.js as window.utils.findClosestValueIndex
function rsv_findClosestValueIndex(sortedArray, targetValue) {
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
            // Prefer the smaller value in case of a tie in difference, or the one closer to target if mid is further
            if (Math.abs(sortedArray[mid] - targetValue) < Math.abs(sortedArray[closestIndex] - targetValue)) {
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
    // If exact match not found, check if low is a better candidate (binary search might end near)
    if (low < sortedArray.length && Math.abs(sortedArray[low] - targetValue) < minDiff) {
        closestIndex = low;
    }
    if (high >= 0 && Math.abs(sortedArray[high] - targetValue) < minDiff ) {
        closestIndex = high;
    }
    return closestIndex;
}
*/

function rsv_findStandardValues(tolerance) {
    console.log(`rsv_findStandardValues called with tolerance: ${tolerance}`); // For debugging
    const targetResistorInput = document.getElementById('rsv-target-resistor');
    const voltageInput = document.getElementById('rsv-voltage');
    const tableBody = document.getElementById('rsv-values-table').getElementsByTagName('tbody')[0];
    // const placeholderRow = document.getElementById('rsv-placeholder-row'); // We will recreate messages dynamically
    const currentColumnHeader = document.getElementById('rsv-current-col-header');

    tableBody.innerHTML = ''; // Clear previous results, including any static placeholder
    console.log('Table body cleared'); // For debugging

    const targetResistor = parseFloat(targetResistorInput.value);
    const voltage = parseFloat(voltageInput.value);
    console.log(`Target Resistor: ${targetResistor}, Voltage: ${voltage}`); // For debugging

    if (isNaN(targetResistor) || targetResistor <= 0) {
        alert('Please enter a valid positive Target Resistor Value.');
        const tr = tableBody.insertRow();
        const td = tr.insertCell();
        td.colSpan = 3;
        td.textContent = 'Invalid Target Resistor Value. Please enter a positive number.';
        console.log('Invalid target resistor message shown'); // For debugging
        return;
    }

    const allStdValues = window.utils.getStandardValues(tolerance); // Use the function from utils.js
    console.log(`Got ${allStdValues.length} standard values for tolerance ${tolerance} from utils`); // For debugging
    const closestIndex = window.utils.findClosestValueIndex(allStdValues, targetResistor); // UPDATED
    console.log(`Closest index: ${closestIndex}`); // For debugging

    if (closestIndex === -1 && allStdValues.length > 0) { // If array not empty but no index found, it's an issue
        alert('Could not find any standard values. This indicates an issue with the E-series data or generation.');
        const tr = tableBody.insertRow();
        const td = tr.insertCell();
        td.colSpan = 3;
        td.textContent = 'Error: Standard value list is empty or target is out of range.';
        return;
    }

    const numValuesToShow = 5; 
    let startIndex = Math.max(0, closestIndex - numValuesToShow);
    let endIndex = Math.min(allStdValues.length - 1, closestIndex + numValuesToShow);
    
    const results = allStdValues.slice(startIndex, endIndex + 1);
    console.log(`Selected ${results.length} results to display.`); // For debugging

    if (results.length === 0) {
        const tr = tableBody.insertRow();
        const td = tr.insertCell();
        td.colSpan = 3;
        td.textContent = 'No standard values found in the selected range around your target.';
        console.log('No results message shown'); // For debugging
        return;
    }

    // Update current column header
    if (!isNaN(voltage) && voltage !== 0) {
        currentColumnHeader.textContent = `Current @ ${voltage.toFixed(2)}V (mA)`;
    } else {
        currentColumnHeader.textContent = 'Current (mA)';
    }

    results.forEach(stdValue => {
        const errorPercent = ((stdValue - targetResistor) / targetResistor) * 100;
        let currentText = '---';
        if (!isNaN(voltage) && voltage !== 0 && stdValue > 0) {
            const current = (voltage / stdValue) * 1000; // Current in mA
            currentText = current.toPrecision(3);
        }

        const row = tableBody.insertRow();
        row.insertCell().textContent = window.utils.formatResistorValue(stdValue);
        row.insertCell().textContent = errorPercent.toFixed(2) + '%';
        row.insertCell().textContent = currentText;
    });
    console.log('Table populated with results'); // For debugging
}

window.rsv_findStandardValues = rsv_findStandardValues; 
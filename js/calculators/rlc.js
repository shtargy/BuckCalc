// Helper function to format numbers into engineering notation (value, exponent multiple of 3)
function formatToEngineering(value) {
    if (value === 0) return { value: 0, exponent: 0 };
    if (!isFinite(value) || isNaN(value)) return { value: NaN, exponent: 0 };

    const log10 = Math.log10(Math.abs(value));
    let exponent = Math.floor(log10 / 3) * 3;
    let significand = value / Math.pow(10, exponent);

    // Adjust significand to be >= 1 and < 1000
    if (significand >= 1000) {
        significand /= 1000;
        exponent += 3;
    } else if (significand < 1 && significand !== 0) {
        significand *= 1000;
        exponent -= 3;
    }

    // Limit precision of significand
    significand = parseFloat(significand.toPrecision(4));

    return { value: significand, exponent: exponent };
}

// Helper function to get value and exponent from scientific notation inputs
function getValueExpFromSciInput(baseId) {
    const valInput = document.getElementById(`${baseId}-val`);
    const expInput = document.getElementById(`${baseId}-exp`);
    let value = parseFloat(valInput?.value);
    let exponent = parseInt(expInput?.value);

    // Default exponent to 0 if not a valid integer or input doesn't exist
    if (isNaN(exponent) || !Number.isInteger(exponent)) {
        exponent = 0;
    }
    // Treat empty value input as NaN
    if (valInput && valInput.value.trim() === '') {
        value = NaN;
    }

    return { value, exponent };
}

// Helper function to get the actual numerical value from value/exponent pair
function getActualValue(valueExp) {
    if (isNaN(valueExp.value)) return NaN;
    return valueExp.value * Math.pow(10, valueExp.exponent);
}

// Helper function to set the value and exponent of a scientific notation output
function setSciOutput(baseId, formattedValue) {
    const valInput = document.getElementById(`${baseId}-val`);
    const expInput = document.getElementById(`${baseId}-exp`);
    if (valInput) valInput.value = isNaN(formattedValue.value) ? '' : formattedValue.value;
    if (expInput) expInput.value = isNaN(formattedValue.value) ? '' : formattedValue.exponent; // Clear exponent if value is NaN
}

// RC Time Constant & Cutoff Frequency Calculator
window.calculateRC = function() {
    const rValInput = document.getElementById('rc-r-val');
    const rExpInput = document.getElementById('rc-r-exp');
    const cValInput = document.getElementById('rc-c-val');
    const cExpInput = document.getElementById('rc-c-exp');
    
    const tauValInput = document.getElementById('rc-tau-val');
    const tauExpInput = document.getElementById('rc-tau-exp');
    const fcValInput = document.getElementById('rc-fc-val');
    const fcExpInput = document.getElementById('rc-fc-exp');
    
    const errorElement = document.getElementById('rc-error');

    const rVal = parseFloat(rValInput.value);
    const rExp = parseInt(rExpInput.value) || 0;
    const cVal = parseFloat(cValInput.value);
    const cExp = parseInt(cExpInput.value) || 0;

    errorElement.textContent = ''; // Clear previous errors

    // Input Validation
    if (isNaN(rVal) || isNaN(cVal)) {
        errorElement.textContent = 'Error: Please provide valid numerical values for R and C.';
        tauValInput.value = ''; tauExpInput.value = '';
        fcValInput.value = ''; fcExpInput.value = '';
        return;
    }
    if (rVal <= 0 || cVal <= 0) {
        errorElement.textContent = 'Error: R and C values must be positive.';
        tauValInput.value = ''; tauExpInput.value = '';
        fcValInput.value = ''; fcExpInput.value = '';
        return;
    }
    if (!Number.isInteger(rExp) || !Number.isInteger(cExp)) {
        errorElement.textContent = 'Error: Exponents for R and C must be integers.';
         tauValInput.value = ''; tauExpInput.value = '';
        fcValInput.value = ''; fcExpInput.value = '';
        return;
    }

    // Calculate actual R and C values
    const r = rVal * Math.pow(10, rExp);
    const c = cVal * Math.pow(10, cExp);

    if (r <= 0 || c <= 0) { // Check combined value positivity
        errorElement.textContent = 'Error: Calculated R and C must result in positive values.';
        tauValInput.value = ''; tauExpInput.value = '';
        fcValInput.value = ''; fcExpInput.value = '';
        return;
    }

    try {
        // Calculate time constant: τ = RC
        const tauRaw = r * c;
        
        // Calculate cutoff frequency: fc = 1/(2πRC)
        const fcRaw = 1 / (2 * Math.PI * r * c);

        // Format results to engineering notation
        const tauFormatted = formatToEngineering(tauRaw);
        const fcFormatted = formatToEngineering(fcRaw);

        if (isNaN(tauFormatted.value) || isNaN(fcFormatted.value)) {
            throw new Error("Calculation resulted in an invalid number.");
        }
        
        // Display results
        tauValInput.value = tauFormatted.value;
        tauExpInput.value = tauFormatted.exponent;
        fcValInput.value = fcFormatted.value;
        fcExpInput.value = fcFormatted.exponent;
        
        errorElement.textContent = '';

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        tauValInput.value = ''; tauExpInput.value = '';
        fcValInput.value = ''; fcExpInput.value = '';
    }
}

// Reactance Calculator
window.calculateReactance = function(targetVariable) {
    const errorElement = document.getElementById('reactance-error');
    errorElement.textContent = ''; // Clear previous errors

    const inputs = {
        f: getValueExpFromSciInput('reactance-f'),
        C: getValueExpFromSciInput('reactance-c'),
        L: getValueExpFromSciInput('reactance-l'),
        Xc: getValueExpFromSciInput('reactance-xc'),
        XL: getValueExpFromSciInput('reactance-xl'),
    };

    const values = {
        f: getActualValue(inputs.f),
        C: getActualValue(inputs.C),
        L: getActualValue(inputs.L),
        Xc: getActualValue(inputs.Xc),
        XL: getActualValue(inputs.XL),
    };

    let requiredInputs = [];
    let calculationFn = null;

    // Determine required inputs and calculation logic based on target
    switch (targetVariable) {
        case 'Xc': // Requires f, C
            requiredInputs = ['f', 'C'];
            calculationFn = () => 1 / (2 * Math.PI * values.f * values.C);
            break;
        case 'XL': // Requires f, L
            requiredInputs = ['f', 'L'];
            calculationFn = () => 2 * Math.PI * values.f * values.L;
            break;
        case 'f': // Requires (C, Xc) OR (L, XL)
            if (!isNaN(values.C) && !isNaN(values.Xc)) {
                requiredInputs = ['C', 'Xc'];
                calculationFn = () => 1 / (2 * Math.PI * values.C * values.Xc);
            } else if (!isNaN(values.L) && !isNaN(values.XL)) {
                requiredInputs = ['L', 'XL'];
                calculationFn = () => values.XL / (2 * Math.PI * values.L);
            } else {
                errorElement.textContent = 'Error: To calculate Frequency (f), provide either (C and Xc) or (L and XL).';
                return;
            }
            break;
        case 'C': // Requires f, Xc
            requiredInputs = ['f', 'Xc'];
            calculationFn = () => 1 / (2 * Math.PI * values.f * values.Xc);
            break;
        case 'L': // Requires f, XL
            requiredInputs = ['f', 'XL'];
            calculationFn = () => values.XL / (2 * Math.PI * values.f);
            break;
        default:
            errorElement.textContent = 'Error: Unknown calculation target specified.';
            return;
    }

    // Validate required inputs
    let missing = [];
    let invalid = [];
    for (const key of requiredInputs) {
        if (isNaN(inputs[key].value)) {
            missing.push(key);
        } else if (inputs[key].value <= 0) {
             invalid.push(`${key} must be positive`);
        }
        if (!Number.isInteger(inputs[key].exponent)) {
             invalid.push(`Exponent for ${key} must be an integer`);
        }
         // Also check the calculated actual value for positivity
        if (values[key] <= 0) {
            invalid.push(`Calculated value for ${key} must be positive`);
        }
    }

    // Combine unique error messages
    invalid = [...new Set(invalid)]; 

    if (missing.length > 0) {
        errorElement.textContent = `Error: Please provide values for ${missing.join(', ')}.`;
    } else if (invalid.length > 0) {
         errorElement.textContent = `Error: ${invalid.join('; ')}.`;
    }

    // Clear target output if validation failed
    if (missing.length > 0 || invalid.length > 0) {
        setSciOutput(`reactance-${targetVariable.toLowerCase()}`, { value: NaN, exponent: NaN });
        return;
    }

    // Perform calculation
    try {
        const resultRaw = calculationFn();
        if (!isFinite(resultRaw) || resultRaw < 0) { // Check for non-finite or negative results
            throw new Error("Calculation resulted in an invalid or negative number.");
        }

        const resultFormatted = formatToEngineering(resultRaw);

        if (isNaN(resultFormatted.value)) {
            throw new Error("Formatted calculation result is invalid.");
        }

        // Display result
        setSciOutput(`reactance-${targetVariable.toLowerCase()}`, resultFormatted);
        errorElement.textContent = ''; // Clear error on success

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        // Clear target output on error
        setSciOutput(`reactance-${targetVariable.toLowerCase()}`, { value: NaN, exponent: NaN });
    }
}

// LC Resonance Calculator
window.calculateLC = function(targetVariable) {
    const errorElement = document.getElementById('lc-error');
    errorElement.textContent = ''; // Clear previous errors

    const inputs = {
        L: getValueExpFromSciInput('lc-l'),
        C: getValueExpFromSciInput('lc-c'),
        f0: getValueExpFromSciInput('lc-f0')
    };

    const values = {
        L: getActualValue(inputs.L),
        C: getActualValue(inputs.C),
        f0: getActualValue(inputs.f0)
    };

    let requiredInputs = [];
    let calculationFn = null;

    // Determine required inputs and calculation logic based on target
    switch (targetVariable) {
        case 'L': // Requires C, f0
            requiredInputs = ['C', 'f0'];
            calculationFn = () => 1 / (4 * Math.PI * Math.PI * values.f0 * values.f0 * values.C);
            break;
        case 'C': // Requires L, f0
            requiredInputs = ['L', 'f0'];
            calculationFn = () => 1 / (4 * Math.PI * Math.PI * values.f0 * values.f0 * values.L);
            break;
        case 'f0': // Requires L, C
            requiredInputs = ['L', 'C'];
            calculationFn = () => 1 / (2 * Math.PI * Math.sqrt(values.L * values.C));
            break;
        default:
            errorElement.textContent = 'Error: Unknown calculation target specified.';
            return;
    }

    // Validate required inputs
    let missing = [];
    let invalid = [];
    for (const key of requiredInputs) {
        if (isNaN(inputs[key].value)) {
            missing.push(key);
        } else if (inputs[key].value <= 0) {
             invalid.push(`${key} must be positive`);
        }
        if (!Number.isInteger(inputs[key].exponent)) {
             invalid.push(`Exponent for ${key} must be an integer`);
        }
         // Also check the calculated actual value for positivity
        if (values[key] <= 0) {
            invalid.push(`Calculated value for ${key} must be positive`);
        }
    }

    // Combine unique error messages
    invalid = [...new Set(invalid)]; 

    if (missing.length > 0) {
        errorElement.textContent = `Error: Please provide values for the other two fields (${missing.join(', ')}).`;
    } else if (invalid.length > 0) {
         errorElement.textContent = `Error: ${invalid.join('; ')}.`;
    }

    // Determine target output base ID
    const targetBaseId = `lc-${targetVariable.toLowerCase()}`;

    // Clear target output if validation failed
    if (missing.length > 0 || invalid.length > 0) {
        setSciOutput(targetBaseId, { value: NaN, exponent: NaN });
        return;
    }

    // Perform calculation
    try {
        const resultRaw = calculationFn();
        if (!isFinite(resultRaw) || resultRaw < 0) { // Check for non-finite or negative results
            throw new Error("Calculation resulted in an invalid or negative number.");
        }

        const resultFormatted = formatToEngineering(resultRaw);

        if (isNaN(resultFormatted.value)) {
            throw new Error("Formatted calculation result is invalid.");
        }

        // Display result
        setSciOutput(targetBaseId, resultFormatted);
        errorElement.textContent = ''; // Clear error on success

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        // Clear target output on error
        setSciOutput(targetBaseId, { value: NaN, exponent: NaN });
    }
}

// Series/Parallel Component Calculator
window.calculateEquivalent = function() {
    const connectionSelect = document.getElementById('equiv-connection');
    const typeSelect = document.getElementById('equiv-type');
    const inputsContainer = document.getElementById('equiv-inputs');
    // Use the new result field IDs
    const resultValInput = document.getElementById('equiv-result-val');
    const resultExpInput = document.getElementById('equiv-result-exp');
    const unitSpan = document.getElementById('equiv-unit');
    const errorElement = document.getElementById('equiv-error');

    const connection = connectionSelect.value;
    const type = typeSelect.value;
    const unit = type === 'R' ? 'Ω' : (type === 'L' ? 'H' : 'F');

    // Update unit display based on component type
    unitSpan.textContent = unit;
    errorElement.textContent = ''; // Clear previous errors

    // Get all input value/exponent pairs
    const inputPairs = Array.from(inputsContainer.children)
        .filter(div => div.classList.contains('component-input-row')) // Target only component rows
        .map((div, index) => {
            const valInput = div.querySelector('input[type="number"]:first-of-type');
            const expInput = div.querySelector('input[type="number"]:last-of-type');
            let value = parseFloat(valInput?.value);
            let exponent = parseInt(expInput?.value);
            
            // Default exponent to 0
             if (isNaN(exponent) || !Number.isInteger(exponent)) {
                exponent = 0;
            }
            // Treat empty value as NaN
            if (valInput && valInput.value.trim() === '') {
                value = NaN;
            }
            
            return { value, exponent, index: index + 1, rawValue: getActualValue({ value, exponent }) }; 
        })
        .filter(pair => !isNaN(pair.value)); // Filter out rows where value is not entered

    if (inputPairs.length === 0) {
        errorElement.textContent = 'Error: Please provide at least one component value.';
        resultValInput.value = ''; resultExpInput.value = '';
        return;
    }

    // Validate inputs
    let invalidMessages = [];
    inputPairs.forEach(pair => {
        if (pair.value <= 0) {
            invalidMessages.push(`Value for ${type}${pair.index} must be positive.`);
        }
        if (!Number.isInteger(pair.exponent)) {
            // This case might be redundant due to defaulting, but keep for robustness
            invalidMessages.push(`Exponent for ${type}${pair.index} must be an integer.`);
        }
         if (pair.rawValue <= 0) {
             invalidMessages.push(`Calculated value for ${type}${pair.index} must be positive.`);
        }
    });

    invalidMessages = [...new Set(invalidMessages)];
    if (invalidMessages.length > 0) {
        errorElement.textContent = `Error: ${invalidMessages.join('; ')}.`;
        resultValInput.value = ''; resultExpInput.value = '';
        return;
    }
    
    const actualValues = inputPairs.map(pair => pair.rawValue);

    try {
        let resultRaw;
        if (connection === 'series') {
            switch (type) {
                case 'R': // R_total = R1 + R2 + ...
                case 'L': // L_total = L1 + L2 + ...
                    resultRaw = actualValues.reduce((sum, val) => sum + val, 0);
                    break;
                case 'C': // 1/C_total = 1/C1 + 1/C2 + ...
                    resultRaw = 1 / actualValues.reduce((sum, val) => sum + (1 / val), 0);
                    break;
            }
        } else { // parallel
            switch (type) {
                case 'R': // 1/R_total = 1/R1 + 1/R2 + ...
                case 'L': // 1/L_total = 1/L1 + 1/L2 + ...
                    resultRaw = 1 / actualValues.reduce((sum, val) => sum + (1 / val), 0);
                    break;
                case 'C': // C_total = C1 + C2 + ...
                    resultRaw = actualValues.reduce((sum, val) => sum + val, 0);
                    break;
            }
        }

        if (!isFinite(resultRaw) || resultRaw < 0) {
            throw new Error("Calculation resulted in an invalid or negative number.");
        }

        const resultFormatted = formatToEngineering(resultRaw);

        if (isNaN(resultFormatted.value)) {
            throw new Error("Formatted calculation result is invalid.");
        }

        // Display result
        resultValInput.value = resultFormatted.value;
        resultExpInput.value = resultFormatted.exponent;
        errorElement.textContent = '';

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        resultValInput.value = ''; resultExpInput.value = '';
    }
}

// Function to create a single component input row for Series/Parallel calc
function createEquivalentInputRow(container, type, unit, index) {
    const div = document.createElement('div');
    // Add a class to identify these rows easily
    div.className = 'input-group-sci component-input-row'; 
    div.innerHTML = `
        <label>${type}${index}:</label>
        <input type="number" step="any" placeholder="Value" aria-label="${type}${index} Value">
        <span class="exponent-label"> × 10^</span>
        <input type="number" step="1" placeholder="Exp" aria-label="${type}${index} Exponent">
        <span class="unit">${unit}</span>
        <button class="remove-button" onclick="this.parentElement.remove()" title="Remove ${type}${index}">×</button>
    `;
    container.appendChild(div);
}

// Function to update the dynamic input fields for series/parallel calculator
window.updateEquivalentInputs = function() {
    const inputsContainer = document.getElementById('equiv-inputs');
    const typeSelect = document.getElementById('equiv-type');
    const type = typeSelect.value;
    const unit = type === 'R' ? 'Ω' : (type === 'L' ? 'H' : 'F');

    // Clear existing inputs (dynamic rows only)
    inputsContainer.innerHTML = ''; 

    // Add two initial input fields
    createEquivalentInputRow(inputsContainer, type, unit, 1);
    createEquivalentInputRow(inputsContainer, type, unit, 2);
    
    // Clear result and error when inputs change
    document.getElementById('equiv-result-val').value = '';
    document.getElementById('equiv-result-exp').value = '';
    document.getElementById('equiv-error').textContent = '';
}

// Function to add a new component row
function addEquivalentComponentRow() {
    const inputsContainer = document.getElementById('equiv-inputs');
    const typeSelect = document.getElementById('equiv-type');
    const type = typeSelect.value;
    const unit = type === 'R' ? 'Ω' : (type === 'L' ? 'H' : 'F');

    // Find the current highest index before adding
    const existingRows = inputsContainer.querySelectorAll('.component-input-row');
    let maxIndex = 0;
    existingRows.forEach(row => {
        const label = row.querySelector('label');
        if (label) { // Check if label exists
             const match = label.textContent.match(/(\d+):$/);
             if (match && parseInt(match[1]) > maxIndex) {
                 maxIndex = parseInt(match[1]);
             }
        } else {
            // Fallback if label format is unexpected, count rows
            maxIndex = Math.max(maxIndex, existingRows.length);
        }
    });
    // Create the new row with the next index
    createEquivalentInputRow(inputsContainer, type, unit, maxIndex + 1);
}

// Add event listeners for the series/parallel calculator
document.addEventListener('DOMContentLoaded', function() {
    const typeSelect = document.getElementById('equiv-type');
    const addButton = document.getElementById('equiv-add-button');

    if (typeSelect) {
        // Ensure initial state is correct
        window.updateEquivalentInputs(); 
        // Add change listener for type selection
        typeSelect.addEventListener('change', window.updateEquivalentInputs);
    }
    if (addButton) {
         // Add click listener for the dedicated add button
        addButton.addEventListener('click', addEquivalentComponentRow);
    }
});
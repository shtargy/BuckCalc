window.calculateThermalResistance = function(targetVariable) {
    const xInput = document.getElementById('thermal-x');
    const yInput = document.getElementById('thermal-y');
    const zInput = document.getElementById('thermal-z');
    const kInput = document.getElementById('thermal-k');
    const rthInput = document.getElementById('thermal-rth');
    const errorElement = document.getElementById('thermal-error');

    const inputs = [
        { el: xInput, name: 'X', value: parseFloat(xInput.value) || null },
        { el: yInput, name: 'Y', value: parseFloat(yInput.value) || null },
        { el: zInput, name: 'Z', value: parseFloat(zInput.value) || null },
        { el: kInput, name: 'K', value: parseFloat(kInput.value) || null },
        { el: rthInput, name: 'Rth', value: parseFloat(rthInput.value) || null }
    ];

    let targetInput = inputs.find(i => i.name === targetVariable);
    if (!targetInput) {
        errorElement.textContent = 'Error: Invalid calculation target specified.';
        return;
    }
    
    errorElement.textContent = ''; // Clear previous errors

    let providedInputsCount = 0;
    let allPositive = true;
    let missingInputs = [];

    // Validate the *other* four inputs
    inputs.forEach(input => {
        if (input.name !== targetVariable) {
            if (input.value !== null && !isNaN(input.value)) {
                providedInputsCount++;
                if (input.value <= 0) {
                    allPositive = false;
                }
            } else {
                missingInputs.push(input.name);
            }
        }
    });

    // Check if exactly 4 other inputs are provided and positive
    if (providedInputsCount !== 4) {
        errorElement.textContent = `Error: Please provide values for ${missingInputs.join(', ')}.`;
        targetInput.el.value = ''; // Clear target field
        return;
    }

    if (!allPositive) {
        errorElement.textContent = 'Error: All input values must be positive.';
        targetInput.el.value = ''; // Clear target field
        return;
    }

    const getValue = (name) => inputs.find(i => i.name === name).value;

    try {
        let result;
        // Get the values needed for calculations (which are the non-target inputs)
        const x = getValue('X');
        const y = getValue('Y');
        const z = getValue('Z');
        const k = getValue('K');
        const rth = getValue('Rth');

        // Perform calculation based on the explicitly passed targetVariable
        switch (targetVariable) {
            case 'Rth':
                // Check required inputs for this specific calculation
                if (x === null || y === null || k === null || z === null) throw new Error("Missing required inputs for Rth calculation.");
                if (x === 0 || y === 0 || k === 0) throw new Error("X, Y dimensions and Thermal Conductivity cannot be zero.");
                // Rth = (Z * 1000) / (k * X * Y) 
                result = (z * 1000) / (k * x * y);
                break;
            case 'X':
                if (y === null || k === null || z === null || rth === null) throw new Error("Missing required inputs for X calculation.");
                if (y === 0 || rth === 0 || k === 0) throw new Error("Y dimension, Thermal Resistance, and Thermal Conductivity cannot be zero.");
                // X = (Z * 1000) / (k * Y * Rth)
                result = (z * 1000) / (k * y * rth);
                break;
            case 'Y':
                if (x === null || k === null || z === null || rth === null) throw new Error("Missing required inputs for Y calculation.");
                if (x === 0 || rth === 0 || k === 0) throw new Error("X dimension, Thermal Resistance, and Thermal Conductivity cannot be zero.");
                // Y = (Z * 1000) / (k * X * Rth)
                result = (z * 1000) / (k * x * rth);
                break;
            case 'Z':
                if (x === null || y === null || k === null || rth === null) throw new Error("Missing required inputs for Z calculation.");
                // Z = (Rth * k * X * Y) / 1000
                // No division by zero risk if inputs are validated as positive
                result = (rth * k * x * y) / 1000;
                break;
            case 'K':
                if (x === null || y === null || z === null || rth === null) throw new Error("Missing required inputs for K calculation.");
                if (z === 0) {
                    // This case implies Rth should also be 0 if X and Y are non-zero.
                    // If Z=0 and Rth is non-zero (and X, Y non-zero), it's an impossible physical scenario. 
                    // If Z=0 and Rth=0, conductivity could be anything (indeterminate). 
                    throw new Error("Cannot determine conductivity when Z dimension is zero.");
                } else if (rth === 0 || x === 0 || y === 0) {
                    // If Rth or X or Y is zero, k would need to be infinite, which isn't practical. 
                    throw new Error("Thermal Resistance, X, and Y dimensions must be non-zero to calculate Conductivity.");
                }
                // k = (Z * 1000) / (Rth * X * Y)
                result = (z * 1000) / (rth * x * y);
                break;
            default:
                // This case should ideally not be reached due to the check at the start
                throw new Error("Unknown calculation target.");
        }

        if (!isNaN(result) && isFinite(result) && result >=0) {
            // Format to a reasonable number of significant digits or decimal places
            targetInput.el.value = result.toPrecision(4); 
            errorElement.textContent = ''; // Clear error on success
        } else {
            // Handle cases like division by zero resulting in Infinity or calculation resulting in NaN
            targetInput.el.value = ''; // Clear the field
            throw new Error("Calculation resulted in an invalid or non-physical number (e.g., division by zero, negative value).");
        }

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        targetInput.el.value = ''; // Clear target field on error
    }
}

// Optional: Event listeners are less critical now with dedicated buttons, but could be added for live updates. 
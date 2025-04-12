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

// Main calculation function for Coupled Inductor Ripple
window.calculateCoupledInductorRipple = function() {
    const errorElement = document.getElementById('ci-error');
    errorElement.textContent = ''; // Clear previous errors

    // Helper to clear all outputs
    const clearOutputs = () => {
        setSciOutput('ci-d', { value: NaN, exponent: NaN });
        setSciOutput('ci-fom', { value: NaN, exponent: NaN });
        setSciOutput('ci-dildl', { value: NaN, exponent: NaN });
        setSciOutput('ci-dilcl', { value: NaN, exponent: NaN });
    };

    // Get inputs
    const inputs = {
        vin: getValueExpFromSciInput('ci-vin'),
        vout: getValueExpFromSciInput('ci-vout'),
        lm: getValueExpFromSciInput('ci-lm'),
        l: getValueExpFromSciInput('ci-l'),
        fs: getValueExpFromSciInput('ci-fs'),
        nph: getValueExpFromSciInput('ci-nph'), // Nph exponent is always 0
    };

    // --- Input Validation ---
    let errors = [];
    const checkInput = (key, name) => {
        if (isNaN(inputs[key].value)) {
            errors.push(`Please enter a value for ${name}.`);
        } else if (inputs[key].value <= 0) {
             errors.push(`${name} value must be positive.`);
        }
        if (key !== 'nph' && !Number.isInteger(inputs[key].exponent)) {
            errors.push(`Exponent for ${name} must be an integer.`);
        }
    };

    checkInput('vin', 'V_IN');
    checkInput('vout', 'V_OUT');
    checkInput('lm', 'L_m');
    checkInput('l', 'L');
    checkInput('fs', 'F_S');
    checkInput('nph', 'N_ph');

    // Specific validation for N_ph
    if (!isNaN(inputs.nph.value)) {
        if (!Number.isInteger(inputs.nph.value)) {
            errors.push('Number of Phases (N_ph) must be an integer.');
        }
        if (inputs.nph.value < 2) {
             errors.push('Number of Phases (N_ph) must be 2 or greater.');
        }
    }
    
    // Clear outputs and show errors if any validation failed so far
    if (errors.length > 0) {
        errorElement.textContent = `Error: ${errors.join('; ')}.`;
        clearOutputs();
        return;
    }

    // --- Calculate Actual Values & Derived Variables ---
    const V_IN = getActualValue(inputs.vin);
    const V_OUT = getActualValue(inputs.vout);
    const L_m = getActualValue(inputs.lm);
    const L = getActualValue(inputs.l);
    const F_S = getActualValue(inputs.fs);
    const N_ph = inputs.nph.value; // Nph is just the value, exponent is 0

    // Cross-validation based on actual values
    if (V_OUT <= 0) errors.push('V_OUT must be positive.');
    if (V_IN <= V_OUT) errors.push('V_IN must be greater than V_OUT.');
    if (L_m <= 0) errors.push('L_m must be positive.');
    if (L <= 0) errors.push('L must be positive.');
    if (F_S <= 0) errors.push('F_S must be positive.');
    
     if (errors.length > 0) {
        errorElement.textContent = `Error: ${errors.join('; ')}.`;
        clearOutputs();
        return;
    }

    const D = V_OUT / V_IN; // Duty Cycle (0 < D < 1 guaranteed by validation)
    const rho = L_m / L;
    const j = Math.floor(D * N_ph);

    // --- Calculation ---    
    try {
        // Calculate dIL_DL first (simpler)
        const dIL_DL_raw = (V_IN - V_OUT) / L * (D / F_S);
        if (!isFinite(dIL_DL_raw) || dIL_DL_raw < 0) {
            throw new Error("Discrete ripple calculation resulted in invalid number.");
        }

        // Calculate FOM
        const rho_plus_1 = rho + 1;
        const N_ph_minus_1 = N_ph - 1;
        if (rho_plus_1 === 0 || N_ph_minus_1 === 0) {
             throw new Error("Potential division by zero in FOM calculation (rho+1 or Nph-1).");
        }
        const factor = (rho / rho_plus_1) * (1 / N_ph_minus_1);
        
        const fom_num = 1 + factor;

        const term1 = N_ph - 2 * j - 2;
        
        const term2_den = N_ph * D;
        if (term2_den === 0) {
            throw new Error("Division by zero in FOM term 2 (Nph*D).");
        }
        const term2 = (j * (j + 1)) / term2_den;

        const term3_num = N_ph * D * (N_ph - 2 * j - 1) + j * (j + 1);
        const term3_den = N_ph * (1 - D);
         if (term3_den === 0) {
            throw new Error("Division by zero in FOM term 3 (Nph*(1-D)).");
        }
        const term3 = term3_num / term3_den;
        
        const bracket_sum = term1 + term2 + term3;
        const fom_den = 1 - bracket_sum * factor;

        if (fom_den === 0) {
            throw new Error("Division by zero: FOM denominator is zero.");
        }
        const fom = fom_num / fom_den;

        if (!isFinite(fom)) {
             throw new Error("FOM calculation resulted in non-finite number.");
        }
        // Cannot calculate coupled ripple if FOM is exactly zero
        if (fom === 0) {
             throw new Error("FOM is zero, cannot calculate coupled ripple (division by zero).");
        }

        // Calculate dIL_CL
        const dIL_CL_raw = dIL_DL_raw / fom;
         if (!isFinite(dIL_CL_raw) || dIL_CL_raw < 0) {
            throw new Error("Coupled ripple calculation resulted in invalid number.");
        }

        // Format and display results
        const D_formatted = formatToEngineering(D);
        const FOM_formatted = formatToEngineering(fom);
        const dIL_DL_formatted = formatToEngineering(dIL_DL_raw);
        const dIL_CL_formatted = formatToEngineering(dIL_CL_raw);

        setSciOutput('ci-d', D_formatted);
        setSciOutput('ci-fom', FOM_formatted);
        setSciOutput('ci-dildl', dIL_DL_formatted);
        setSciOutput('ci-dilcl', dIL_CL_formatted);
        errorElement.textContent = ''; // Clear errors on success

    } catch (error) {
        errorElement.textContent = `Error: ${error.message}`;
        // Clear outputs on calculation error
        clearOutputs();
    }
}; 
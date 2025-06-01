/**
 * Inverting Buck-Boost Converter Calculator (v1.0.0)
 *
 * Provides functionality to calculate inverting buck-boost converter parameters such as:
 * - Input voltage (Vin)
 * - Output voltage (Vout)
 * - Inductor value
 * - Switching frequency
 * - Average inductor current
 * - Output current
 * - Inductor current ripple
 * 
 * This module handles all the mathematical calculations for inverting buck-boost converters,
 * allowing users to solve for any parameter by providing the others. The inverting topology
 * produces a negative output voltage from a positive input voltage.
 * 
 * Usage:
 * - Each function calculates one parameter based on the other parameters
 * - Input values are obtained from HTML form elements
 * - Results are displayed in the corresponding HTML form elements
 * - All functions use common utilities from utils.js for consistency
 */

// Helper function to manage calculation flow for Inverting Buck-Boost
function calculateAndUpdateIBB(inputIds, outputId, calculationFn, outputFieldFriendlyName) {
    const rawInputValues = inputIds.map(id => utils.getValue(id));
    // Create input names for validation messages, more robustly than before for output name
    const inputFriendlyNames = inputIds.map(id => {
        const el = document.getElementById(id);
        return el?.previousElementSibling?.textContent?.trim() || id.replace('ibb-', '').toUpperCase();
    });

    const processedInputValues = rawInputValues.map((val, index) => {
        const id = inputIds[index];
        if (id === 'ibb-vout') {
            if (val === null) return null; // Let validateInputs handle missing value
            if (val <= 0) { // Magnitude must be positive
                alert(`Magnitude of Output Voltage (Vout) in field '${inputFriendlyNames[index]}' must be a positive number.`);
                return NaN; // Cause validation to fail for this specific input
            }
            return -Math.abs(val); // Convert to negative for calculation logic
        }
        // For Vin, ensure it's positive if provided
        if (id === 'ibb-vin') {
            if (val !== null && val <= 0) {
                 alert(`Input Voltage (Vin) in field '${inputFriendlyNames[index]}' must be a positive number.`);
                 return NaN;
            }
        }
        return val;
    });

    if (!utils.validateInputs(processedInputValues, inputFriendlyNames)) {
        utils.setValue(outputId, '');
        return null;
    }

    const result = calculationFn(...processedInputValues);

    if (result !== null && result !== undefined && !isNaN(result)) {
        if (outputId === 'ibb-vout') {
            if (result >= 0) { // Calculated Vout for inverting should be negative
                 alert('Calculation error: Expected a negative Output Voltage (Vout) but got a non-negative value.');
                 utils.setValue(outputId, '');
                 return null;
            }
            utils.setValue(outputId, Math.abs(result)); // Store magnitude for Vout display
        } else {
            utils.setValue(outputId, result);
        }
        return result;
    } else {
        utils.setValue(outputId, '');
        alert('Calculation error for ' + outputFieldFriendlyName + '. Please check input values for physical possibility or inconsistencies (e.g., conditions leading to division by zero).');
        return null;
    }
}

// Inverting Buck-Boost Calculator Functions

// Calculate IL(avg) for Inverting Buck-Boost
function ibb_calculateILavg() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-iout'],
        'ibb-ilavg',
        (vin, vout, iout) => { // vout is negative, vin is positive
            if (vin <= 1e-9) { alert('Input Voltage (Vin) must be positive.'); return null; }
            // Formula: IL(avg) = Iout * (Vin + |Vout|) / Vin
            return iout * (vin + Math.abs(vout)) / vin;
        },
        'Average Inductor Current (ILavg)'
    );
}

// Calculate Output Current for Inverting Buck-Boost
function ibb_calculateIout() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilavg'],
        'ibb-iout',
        (vin, vout, ilavg) => { // vout is negative, vin is positive
            if (vin <= 1e-9) { alert('Input Voltage (Vin) must be positive.'); return null; }
            const denominator = vin + Math.abs(vout);
            if (Math.abs(denominator) < 1e-9) { alert('Vin + |Vout| is too close to zero.'); return null; }
            // Formula: Iout = IL(avg) * Vin / (Vin + |Vout|)
            return ilavg * vin / denominator;
        },
        'Output Current (Iout)'
    );
}

// Calculate Input Voltage for Inverting Buck-Boost
function ibb_calculateVin() {
    let vout_magnitude = utils.getValue('ibb-vout');
    const ilavg = utils.getValue('ibb-ilavg');
    const iout = utils.getValue('ibb-iout');
    const ilpp = utils.getValue('ibb-ilpp');
    const l = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');
    
    const outputId = 'ibb-vin';

    if (vout_magnitude === null || vout_magnitude <= 0) {
        alert('Magnitude of Output Voltage (Vout) must be a positive number.');
        utils.setValue(outputId, '');
        return;
    }
    const vout_val = -vout_magnitude; // Internal Vout is negative

    const inputsToValidate = [ilavg, iout, ilpp, l, fsw];
    const namesToValidate = ['Average Inductor Current', 'Output Current', 'Current Ripple', 'Inductance', 'Switching Frequency'];

    if (!utils.validateInputs(inputsToValidate, namesToValidate)) {
        utils.setValue(outputId, '');
        return;
    }
    // Vin specific positive check if pre-filled
    const vin_prefill = utils.getValue('ibb-vin');
    if (vin_prefill !== null && vin_prefill <=0) {
        alert("If Input Voltage (Vin) is pre-filled, it must be positive.");
        utils.setValue(outputId, '');
        return;
    }
    
    let vin = vout_magnitude; 
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    const absVout = vout_magnitude; 
    
    for (let i = 0; i < ITERATION_LIMIT; i++) {
        if (vin <= 1e-9) {
            utils.setValue(outputId, '');
            alert('Input Voltage (Vin) became zero or negative during iteration. Cannot solve.');
            return;
        }
        if (Math.abs(vin + absVout) < 1e-9) {
            utils.setValue(outputId, '');
            alert('Sum of Vin and |Vout| (magnitude) is too close to zero. Cannot calculate duty cycle reliably.');
            return;
        }

        const dutyCycle = absVout / (vin + absVout);
        // f1 is now: IL(avg) - Iout * (Vin + |Vout|) / Vin
        const f1 = ilavg - iout * (vin + absVout) / vin; 
        const f2 = ilpp - (vin * dutyCycle) / (fswHz * lH);
        
        if (Math.abs(f1) < CONVERGENCE_THRESHOLD && Math.abs(f2) < CONVERGENCE_THRESHOLD) {
            utils.setValue(outputId, vin);
            return;
        }
        
        // Derivatives based on new f1
        // df1/dVin = iout * absVout / vin^2
        const df1 = iout * absVout / (vin * vin);
        const df2 = - (absVout * absVout) / (fswHz * lH * Math.pow(vin + absVout, 2));
        
        if (Math.abs(df1 + df2) < 1e-9) {
            utils.setValue(outputId, '');
            alert('Convergence error (Vin): Derivative sum is too small. Please check input values.');
            return;
        }
        vin = vin - (f1 + f2) / (df1 + df2);
        
        if (vin <= 0) vin = vout_magnitude; 
    }
    utils.setValue(outputId, '');
    alert('Could not converge to a solution for Input Voltage. Please check input values.');
}

// Calculate Output Voltage for Inverting Buck-Boost
function ibb_calculateVout() {
    const vin_val = utils.getValue('ibb-vin');
    const ilavg = utils.getValue('ibb-ilavg');
    const iout = utils.getValue('ibb-iout');
    const ilpp = utils.getValue('ibb-ilpp');
    const l = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');
    
    const outputId = 'ibb-vout';

    if (vin_val === null || vin_val <= 0) {
        alert('Input Voltage (Vin) must be a positive value.');
        utils.setValue(outputId, '');
        return;
    }

    const inputsToValidate = [vin_val, ilavg, iout, ilpp, l, fsw];
    const namesToValidate = ['Input Voltage', 'Average Inductor Current', 'Output Current', 'Current Ripple', 'Inductance', 'Switching Frequency'];

    if (!utils.validateInputs(inputsToValidate, namesToValidate)) {
        utils.setValue(outputId, '');
        return;
    }
    // Vout magnitude specific positive check if pre-filled
    const vout_prefill_mag = utils.getValue('ibb-vout');
    if (vout_prefill_mag !== null && vout_prefill_mag <=0) {
        alert("If Vout magnitude is pre-filled, it must be positive.");
        utils.setValue(outputId, '');
        return;
    }    

    let vout = -vin_val; // Initial guess for vout (negative)
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    for (let i = 0; i < ITERATION_LIMIT; i++) {
        if (vout >= 0) {
            utils.setValue(outputId, '');
            alert('Output Voltage became zero or positive during iteration.');
            return;
        }
        const absVout = Math.abs(vout);
        if (Math.abs(vin_val + absVout) < 1e-9) {
            utils.setValue(outputId, '');
            alert('Sum of Vin and abs(Vout) is too close to zero. Cannot calculate duty cycle reliably.');
            return;
        }
        if (vin_val <= 1e-9) {
            utils.setValue(outputId, '');
            alert('Input Voltage (Vin) is zero or too small for Iavg calculation in solver.');
            return;
        }

        const dutyCycle = absVout / (vin_val + absVout);
        // f1 is now: IL(avg) - Iout * (Vin + |Vout|) / Vin
        // Here, Vout is the iteration variable (negative), so |Vout| = -Vout
        const f1 = ilavg - iout * (vin_val + absVout) / vin_val; 
        const f2 = ilpp - (vin_val * dutyCycle) / (fswHz * lH);
        
        if (Math.abs(f1) < CONVERGENCE_THRESHOLD && Math.abs(f2) < CONVERGENCE_THRESHOLD) {
            if (vout >= 0) {
                utils.setValue(outputId, '');
                alert('Solver error (Vout): Calculated Output Voltage is not negative.');
                return;
            }
            utils.setValue(outputId, Math.abs(vout)); 
            return;
        }
        
        // Derivatives based on new f1
        // df1/dVout = iout / vin_val (since f1 = ilavg - iout - (iout/vin_val)*(-vout) = ilavg - iout + (iout/vin_val)*vout)
        const df1 = iout / vin_val;
        const df2 = (vin_val * vin_val) / (fswHz * lH * Math.pow(vin_val - vout, 2));

        if (Math.abs(df1 + df2) < 1e-9) {
            utils.setValue(outputId, '');
            alert('Convergence error (Vout): Derivative sum is too small. Please check input values.');
            return;
        }
        vout = vout - (f1 + f2) / (df1 + df2);
        
        if (vout >= 0) vout = -vin_val; 
    }
    utils.setValue(outputId, '');
    alert('Could not converge to a solution for Output Voltage. Please check input values.');
}

// Calculate Inductance for Inverting Buck-Boost
function ibb_calculateL() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilpp', 'ibb-fsw'],
        'ibb-inductance',
        (vin, vout, ilpp, fsw) => { // vin is positive, vout is negative
            if (ilpp <= 1e-9) { alert('Inductor current ripple (ILpp) must be positive.'); return null; }
            const fswHz = utils.mhzToHz(fsw);
            if (fswHz <= 1e-9) { alert('Switching frequency (fsw) must be positive.'); return null; }
            
            const absVout = Math.abs(vout);
            if (Math.abs(vin + absVout) < 1e-9) { alert('Vin + |Vout| is too close to zero.'); return null; }

            const dutyCycle = absVout / (vin + absVout);
            // L = (Vin * D) / (fsw * ILpp)
            const inductanceH = (vin * dutyCycle) / (fswHz * ilpp);
            return inductanceH * MICRO_CONVERSION_FACTOR; // to µH
        },
        'Inductance (L)'
    );
}

// Calculate Switching Frequency for Inverting Buck-Boost
function ibb_calculateFsw() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilpp', 'ibb-inductance'],
        'ibb-fsw',
        (vin, vout, ilpp, l) => { // vin positive, vout negative
            if (ilpp <= 1e-9) { alert('Inductor current ripple (ILpp) must be positive.'); return null; }
            const lH = l / MICRO_CONVERSION_FACTOR;
            if (lH <= 1e-9) { alert('Inductance (L) must be positive.'); return null; }

            const absVout = Math.abs(vout);
            if (Math.abs(vin + absVout) < 1e-9) { alert('Vin + |Vout| is too close to zero.'); return null; }

            const dutyCycle = absVout / (vin + absVout);
            // fsw = (Vin * D) / (L * ILpp)
            const fswHz = (vin * dutyCycle) / (lH * ilpp);
            return utils.hzToMhz(fswHz);
        },
        'Switching Frequency (fsw)'
    );
}

// Calculate Inductor Current Ripple for Inverting Buck-Boost
function ibb_calculateDeltaIL() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-inductance', 'ibb-fsw'],
        'ibb-ilpp',
        (vin, vout, l, fsw) => { // vin positive, vout negative
            const fswHz = utils.mhzToHz(fsw);
            const lH = l / MICRO_CONVERSION_FACTOR;
            if (fswHz <= 1e-9) { alert('Switching frequency (fsw) must be positive.'); return null; }
            if (lH <= 1e-9) { alert('Inductance (L) must be positive.'); return null; }

            const absVout = Math.abs(vout);
            if (Math.abs(vin + absVout) < 1e-9) { alert('Vin + |Vout| is too close to zero.'); return null; }
            
            const dutyCycle = absVout / (vin + absVout);
            // Inductor Current Ripple ΔIL = (Vin * D) / (fsw * L)
            const ripple = (vin * dutyCycle) / (fswHz * lH);
            return ripple;
        },
        'Inductor Current Ripple (ΔIL)'
    );
}

// Calculate Duty Cycle for Inverting Buck-Boost
function ibb_calculateDutyCycle() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout'], // Input IDs: Vin, Vout (magnitude from UI)
        'ibb-duty', // Output ID
        (vin, vout) => { // vin is positive, vout is negative (from calculateAndUpdateIBB)
            if (vin <= 1e-9) { alert('Input Voltage (Vin) must be positive for duty cycle calculation.'); return null; }
            // Vout from calculateAndUpdateIBB is already negative, its magnitude is Math.abs(vout)
            const absVout = Math.abs(vout);
            const denominator = vin + absVout;
            if (Math.abs(denominator) < 1e-9) { 
                alert('Vin + |Vout| is too close to zero for duty cycle calculation.'); 
                return null; 
            }
            // Duty Cycle D = |Vout| / (Vin + |Vout|)
            const dutyCycle = absVout / denominator;
            return dutyCycle * 100; // As percentage
        },
        'Duty Cycle'
    );
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'ibb',                     // ID
        'Inverting Buck-Boost',    // Name
        'Inverting DC-DC converter calculator', // Description
        {
            calculateVin: ibb_calculateVin,
            calculateVout: ibb_calculateVout,
            calculateILavg: ibb_calculateILavg,
            calculateIout: ibb_calculateIout,
            calculateL: ibb_calculateL,
            calculateFsw: ibb_calculateFsw,
            calculateDeltaIL: ibb_calculateDeltaIL,
            calculateDutyCycle: ibb_calculateDutyCycle // Add new function
        }
    );
}

// Make the calculator functions globally accessible for backwards compatibility
window.ibb_calculateVin = ibb_calculateVin;
window.ibb_calculateVout = ibb_calculateVout;
window.ibb_calculateILavg = ibb_calculateILavg;
window.ibb_calculateIout = ibb_calculateIout;
window.ibb_calculateL = ibb_calculateL;
window.ibb_calculateFsw = ibb_calculateFsw;
window.ibb_calculateDeltaIL = ibb_calculateDeltaIL; 
window.ibb_calculateDutyCycle = ibb_calculateDutyCycle; // Add new function 
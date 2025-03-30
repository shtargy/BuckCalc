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
function calculateAndUpdateIBB(inputIds, outputId, calculationFn) {
    const inputValues = inputIds.map(id => utils.getValue(id));
    const inputNames = inputIds.map(id => id.replace('ibb-', '').toUpperCase());

    if (!utils.validateInputs(inputValues, inputNames)) {
        return null;
    }

    const result = calculationFn(...inputValues);

    if (result !== null && result !== undefined && !isNaN(result)) {
        utils.setValue(outputId, result);
        // No dependent functions seem to be consistently called here
        return result;
    }
    return null;
}

// Inverting Buck-Boost Calculator Functions

// Helper function to get numeric value from an input field
// Redundant - use utils.getValue instead
// function getValue(id) {
//     const value = document.getElementById(id).value;
//     return value === '' ? null : parseFloat(value);
// }

// Helper function to set a formatted value to an input field
// Redundant - use utils.setValue instead
// function setValue(id, value) {
//     document.getElementById(id).value = parseFloat(value).toFixed(2);
// }

// Helper function to validate positive numbers
// Redundant - use utils.validatePositive instead
// function validatePositive(value, name) {
//     if (value <= 0) {
//         alert(`${name} must be positive`);
//         return false;
//     }
//     return true;
// }

// Calculate IL(avg) for Inverting Buck-Boost
function ibb_calculateILavg() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-iout'], // Input IDs
        'ibb-ilavg', // Output ID
        (vin, vout, iout) => { // Calculation logic
            // Ensure we don't divide by zero
            if (Math.abs(vin) < 1e-9) return null;
            return iout * (vin + vout) / vin;
        }
    );
}

// Calculate Output Current for Inverting Buck-Boost
function ibb_calculateIout() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilavg'], // Input IDs
        'ibb-iout', // Output ID
        (vin, vout, ilavg) => { // Calculation logic
            const denominator = vin + vout;
            // Ensure we don't divide by zero
            if (Math.abs(denominator) < 1e-9) return null;
            return ilavg * vin / denominator;
        }
    );
}

// Calculate Input Voltage for Inverting Buck-Boost
function ibb_calculateVin() {
    const vout = utils.getValue('ibb-vout');
    const ilavg = utils.getValue('ibb-ilavg');
    const iout = utils.getValue('ibb-iout');
    const ilpp = utils.getValue('ibb-ilpp');
    const l = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, ilavg, iout, ilpp, l, fsw], 
        ['Output Voltage', 'Average Inductor Current', 'Output Current', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    // Initial guess for Vin
    let vin = vout;
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    // Newton-Raphson iteration
    for (let i = 0; i < ITERATION_LIMIT; i++) {
        const f1 = ilavg - iout * (vin + vout) / vin;
        const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
        
        // If both equations are satisfied within tolerance
        if (Math.abs(f1) < CONVERGENCE_THRESHOLD && Math.abs(f2) < CONVERGENCE_THRESHOLD) {
            utils.setValue('ibb-vin', vin);
            return;
        }
        
        // Update Vin
        const df1 = -iout * vout / (vin * vin);
        const df2 = -(1 / (fswHz * lH)) * (vout * vout) / ((vin + vout) * (vin + vout));
        vin = vin - (f1 + f2) / (df1 + df2);
        
        if (vin <= 0) vin = vout; // Reset if iteration goes negative
    }
    alert('Could not converge to a solution. Please check input values.');
}

// Calculate Output Voltage for Inverting Buck-Boost
function ibb_calculateVout() {
    const vin = utils.getValue('ibb-vin');
    const ilavg = utils.getValue('ibb-ilavg');
    const iout = utils.getValue('ibb-iout');
    const ilpp = utils.getValue('ibb-ilpp');
    const l = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, ilavg, iout, ilpp, l, fsw], 
        ['Input Voltage', 'Average Inductor Current', 'Output Current', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    // Initial guess for Vout
    let vout = vin;
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    // Newton-Raphson iteration
    for (let i = 0; i < ITERATION_LIMIT; i++) {
        const f1 = ilavg - iout * (vin + vout) / vin;
        const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
        
        // If both equations are satisfied within tolerance
        if (Math.abs(f1) < CONVERGENCE_THRESHOLD && Math.abs(f2) < CONVERGENCE_THRESHOLD) {
            utils.setValue('ibb-vout', vout);
            return;
        }
        
        // Update Vout
        const df1 = -iout / vin;
        const df2 = -(1 / (fswHz * lH)) * vin * vin / ((vin + vout) * (vin + vout));
        vout = vout - (f1 + f2) / (df1 + df2);
        
        if (vout <= 0) vout = vin; // Reset if iteration goes negative
    }
    alert('Could not converge to a solution. Please check input values.');
}

// Calculate Inductance for Inverting Buck-Boost
function ibb_calculateL() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilpp', 'ibb-fsw'], // Input IDs
        'ibb-inductance', // Output ID
        (vin, vout, ilpp, fsw) => { // Calculation logic
            const fswHz = utils.mhzToHz(fsw);
            const denominator = fswHz * ilpp * (vin + vout);
            // Ensure we don't divide by zero
            if (Math.abs(denominator) < 1e-9) return null;
            const lH = (vin * vout) / denominator;
            return lH * MICRO_CONVERSION_FACTOR;
        }
    );
}

// Calculate Switching Frequency for Inverting Buck-Boost
function ibb_calculateFsw() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-ilpp', 'ibb-inductance'], // Input IDs
        'ibb-fsw', // Output ID
        (vin, vout, ilpp, l) => { // Calculation logic
            const lH = l / MICRO_CONVERSION_FACTOR;
            const denominator = lH * ilpp * (vin + vout);
            // Ensure we don't divide by zero
            if (Math.abs(denominator) < 1e-9) return null;
            const fswHz = (vin * vout) / denominator;
            return utils.hzToMhz(fswHz);
        }
    );
}

// Calculate Inductor Current Ripple for Inverting Buck-Boost
function ibb_calculateDeltaIL() {
    calculateAndUpdateIBB(
        ['ibb-vin', 'ibb-vout', 'ibb-inductance', 'ibb-fsw'], // Input IDs
        'ibb-ilpp', // Output ID
        (vin, vout, l, fsw) => { // Calculation logic
            const fswHz = utils.mhzToHz(fsw);
            const lH = l / MICRO_CONVERSION_FACTOR;
            const denominator = fswHz * lH * (vin + vout);
            // Ensure we don't divide by zero
            if (Math.abs(denominator) < 1e-9) return null; 
            // Formula is ΔiL = (Vin * D) / (fsw * L) where D = Vout / (Vin+Vout)
            // Simplified: ΔiL = Vin * (Vout / (Vin+Vout)) / (fsw * L)
            // ΔiL = Vin * Vout / (fsw * L * (Vin+Vout))
            return (vin * vout) / denominator;
        }
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
            calculateDeltaIL: ibb_calculateDeltaIL
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
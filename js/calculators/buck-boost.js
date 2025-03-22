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
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout');
    const iout = utils.getValue('ibb-iout');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, iout], 
        ['Input Voltage', 'Output Voltage', 'Output Current']
    )) {
        return;
    }
    
    const ilavg = iout * (vin + vout) / vin;
    utils.setValue('ibb-ilavg', ilavg);
}

// Calculate Output Current for Inverting Buck-Boost
function ibb_calculateIout() {
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout');
    const ilavg = utils.getValue('ibb-ilavg');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, ilavg], 
        ['Input Voltage', 'Output Voltage', 'Average Inductor Current']
    )) {
        return;
    }
    
    const iout = ilavg * vin / (vin + vout);
    utils.setValue('ibb-iout', iout);
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
    const lH = l / 1000000;
    
    // Newton-Raphson iteration
    for (let i = 0; i < 10; i++) {
        const f1 = ilavg - iout * (vin + vout) / vin;
        const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
        
        // If both equations are satisfied within tolerance
        if (Math.abs(f1) < 0.001 && Math.abs(f2) < 0.001) {
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
    const lH = l / 1000000;
    
    // Newton-Raphson iteration
    for (let i = 0; i < 10; i++) {
        const f1 = ilavg - iout * (vin + vout) / vin;
        const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
        
        // If both equations are satisfied within tolerance
        if (Math.abs(f1) < 0.001 && Math.abs(f2) < 0.001) {
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
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout');
    const ilpp = utils.getValue('ibb-ilpp');
    const fsw = utils.getValue('ibb-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, ilpp, fsw], 
        ['Input Voltage', 'Output Voltage', 'Current Ripple', 'Switching Frequency']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    const lH = (vin * vout) / (fswHz * ilpp * (vin + vout));
    const luH = lH * 1000000;
    utils.setValue('ibb-inductance', luH);
}

// Calculate Switching Frequency for Inverting Buck-Boost
function ibb_calculateFsw() {
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout');
    const ilpp = utils.getValue('ibb-ilpp');
    const l = utils.getValue('ibb-inductance');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, ilpp, l], 
        ['Input Voltage', 'Output Voltage', 'Current Ripple', 'Inductance']
    )) {
        return;
    }
    
    const lH = l / 1000000;
    const fswHz = (vin * vout) / (lH * ilpp * (vin + vout));
    const fswMHz = utils.hzToMhz(fswHz);
    utils.setValue('ibb-fsw', fswMHz);
}

// Calculate Inductor Current Ripple for Inverting Buck-Boost
function ibb_calculateDeltaIL() {
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout');
    const l = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, l, fsw], 
        ['Input Voltage', 'Output Voltage', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    const ilpp = (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
    utils.setValue('ibb-ilpp', ilpp);
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
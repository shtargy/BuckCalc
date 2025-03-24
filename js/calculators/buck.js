/**
 * Buck Converter Calculator (v1.0.0)
 *
 * Provides functionality to calculate buck converter parameters such as:
 * - Input voltage (Vin)
 * - Output voltage (Vout)
 * - Inductor value
 * - Switching frequency
 * - Inductor current ripple
 * - Duty cycle
 * - On time (Ton)
 * 
 * This module handles all the mathematical calculations for buck converters,
 * allowing users to solve for any parameter by providing the others.
 * 
 * Usage:
 * - Each function calculates one parameter based on the other parameters
 * - Input values are obtained from HTML form elements
 * - Results are displayed in the corresponding HTML form elements
 * - All functions use common utilities from utils.js for consistency
 */

// Buck Converter Calculator Functions

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

// Calculate duty cycle
function calculateDutyCycle() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout], 
        ['Input Voltage', 'Output Voltage']
    )) {
        return;
    }
    
    const dutyCycle = (vout + vdsl) / (vin - vdsh);
    utils.setValue('buck-duty', dutyCycle * 100); // Convert to percentage
    return dutyCycle; // Still return the decimal value for internal calculations
}

// Calculate on-time (Ton)
function calculateTon() {
    const fsw = utils.getValue('buck-fsw');
    const duty = calculateDutyCycle();
    
    // Validate inputs
    if (!utils.validateInputs(
        [fsw, duty], 
        ['Switching Frequency', 'Duty Cycle']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    // Calculate Ton in seconds then convert to microseconds
    const tonSeconds = duty / fswHz;
    const tonMicroseconds = tonSeconds * 1000000;
    
    utils.setValue('buck-ton', tonMicroseconds);
}

// Calculate Vin
function calculateVin() {
    const vout = utils.getValue('buck-vout');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    const ilpp = utils.getValue('buck-ilpp');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, ilpp, l, fsw], 
        ['Output Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    // Using inductor ripple equation
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    const d = 1 - ((ilpp * fswHz * lH) / vout);
    
    // Using duty cycle equation to find Vin
    const vin = (vout + vdsl) / d + vdsh;
    utils.setValue('buck-vin', vin);
    
    // Update dependent values
    calculateDutyCycle();
    calculateTon();
}

// Calculate Vout
function calculateVout() {
    const vin = utils.getValue('buck-vin');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    const ilpp = utils.getValue('buck-ilpp');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, ilpp, l, fsw], 
        ['Input Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    
    // Iterative solution since Vout appears in both equations
    let vout = vin / 2; // Initial guess
    for (let i = 0; i < 10; i++) { // Few iterations for convergence
        const d = (vout + vdsl) / (vin - vdsh);
        const vout_new = (ilpp * fswHz * lH) / (1 - d);
        if (Math.abs(vout - vout_new) < 0.001) {
            utils.setValue('buck-vout', vout_new);
            // Update dependent values
            calculateDutyCycle();
            calculateTon();
            return;
        }
        vout = vout_new;
    }
    utils.setValue('buck-vout', vout);
    
    // Update dependent values
    calculateDutyCycle();
    calculateTon();
}

// Calculate inductance
function calculateL() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const fsw = utils.getValue('buck-fsw');
    const ilpp = utils.getValue('buck-ilpp');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, fsw, ilpp], 
        ['Input Voltage', 'Output Voltage', 'Switching Frequency', 'Current Ripple']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const fswHz = utils.mhzToHz(fsw);
    
    // L = (Vout * (1-D)) / (fsw * ΔiL)
    const lH = (vout * (1 - d)) / (fswHz * ilpp);
    const luH = lH * 1000000;  // Convert H to µH
    utils.setValue('buck-inductance', luH);
    
    // Update dependent values
    calculateDutyCycle();
    calculateTon();
}

// Calculate switching frequency
function calculateFsw() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const l = utils.getValue('buck-inductance');
    const ilpp = utils.getValue('buck-ilpp');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, l, ilpp], 
        ['Input Voltage', 'Output Voltage', 'Inductance', 'Current Ripple']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const lH = l / 1000000;
    
    // fsw = (Vout * (1-D)) / (L * ΔiL)
    const fswHz = (vout * (1 - d)) / (lH * ilpp);
    const fswMHz = utils.hzToMhz(fswHz);
    utils.setValue('buck-fsw', fswMHz);
    
    // Update dependent values
    calculateDutyCycle();
    calculateTon();
}

// Calculate inductor current ripple
function calculateIlpp() {
    const vout = utils.getValue('buck-vout');
    const vin = utils.getValue('buck-vin');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, vin, l, fsw], 
        ['Output Voltage', 'Input Voltage', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    
    const ilpp = (vout * (1 - d)) / (fswHz * lH);
    utils.setValue('buck-ilpp', ilpp);
    
    // Update dependent values
    calculateDutyCycle();
    calculateTon();
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'buck',              // ID
        'Buck Converter',    // Name
        'DC-DC step-down converter calculator', // Description
        {
            calculateVin: calculateVin,
            calculateVout: calculateVout,
            calculateL: calculateL,
            calculateFsw: calculateFsw,
            calculateIlpp: calculateIlpp,
            calculateDutyCycle: calculateDutyCycle,
            calculateTon: calculateTon
        }
    );
}

// Make functions globally accessible for backwards compatibility
window.calculateVin = calculateVin;
window.calculateVout = calculateVout;
window.calculateL = calculateL;
window.calculateFsw = calculateFsw;
window.calculateIlpp = calculateIlpp;
window.calculateDutyCycle = calculateDutyCycle; 
window.calculateTon = calculateTon; 
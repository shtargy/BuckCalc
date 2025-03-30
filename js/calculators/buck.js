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

// Helper function to manage calculation flow
function calculateAndUpdate(inputIds, outputId, calculationFn, dependentFns = [calculateDutyCycle, calculateTon]) {
    // Fetch required input values
    const inputValues = inputIds.map(id => utils.getValue(id));
    
    // Fetch potentially needed diode/switch voltages
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;

    // Crude way to get potential names for validation messages
    const inputNames = inputIds.map(id => id.replace('buck-', '').toUpperCase());

    // Validate core inputs
    if (!utils.validateInputs(inputValues, inputNames)) {
        return null; // Indicate validation failure
    }

    // Execute the specific calculation logic, passing necessary values
    const result = calculationFn(...inputValues, vdsh, vdsl);

    // Check if calculation was successful and returned a value
    if (result !== null && result !== undefined && !isNaN(result)) {
        utils.setValue(outputId, result);

        // Update dependent fields if calculation succeeded
        dependentFns.forEach(fn => {
            // Ensure dependent functions exist before calling
            if (typeof fn === 'function') {
                fn();
            } else {
                console.error('Dependent function is not valid:', fn);
            }
        });

        return result; // Return the calculated value
    }
    return null; // Indicate calculation failure or no result
}

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
    const tonMicroseconds = tonSeconds * MICRO_CONVERSION_FACTOR;
    
    utils.setValue('buck-ton', tonMicroseconds);
}

// Calculate Vin
function calculateVin() {
    calculateAndUpdate(
        ['buck-vout', 'buck-ilpp', 'buck-inductance', 'buck-fsw'], // Input IDs
        'buck-vin', // Output ID
        (vout, ilpp, l, fsw, vdsh, vdsl) => { // Calculation logic
            const fswHz = utils.mhzToHz(fsw);
            const lH = l / MICRO_CONVERSION_FACTOR;
            // Avoid division by zero or near-zero vout
            if (Math.abs(vout) < 1e-9) return null; 
            const d = 1 - ((ilpp * fswHz * lH) / vout);
            // Avoid division by zero or near-zero duty cycle result
            if (Math.abs(d) < 1e-9) return null; 
            const vin = (vout + vdsl) / d + vdsh;
            return vin;
        }
    );
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
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    // Iterative solution since Vout appears in both equations
    let vout = vin / 2; // Initial guess
    for (let i = 0; i < ITERATION_LIMIT; i++) { // Few iterations for convergence
        const d = (vout + vdsl) / (vin - vdsh);
        const vout_new = (ilpp * fswHz * lH) / (1 - d);
        if (Math.abs(vout - vout_new) < CONVERGENCE_THRESHOLD) {
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
    calculateAndUpdate(
        ['buck-vin', 'buck-vout', 'buck-fsw', 'buck-ilpp'], // Input IDs
        'buck-inductance', // Output ID
        (vin, vout, fsw, ilpp, vdsh, vdsl) => { // Calculation logic
            // Avoid division by zero or near-zero denominator
            const denominator = (vin - vdsh);
            if (Math.abs(denominator) < 1e-9) return null;
            const d = (vout + vdsl) / denominator;
            
            const fswHz = utils.mhzToHz(fsw);
             // Avoid division by zero or near-zero fswHz * ilpp
            if (Math.abs(fswHz * ilpp) < 1e-9) return null;
            const lH = (vout * (1 - d)) / (fswHz * ilpp);
            const luH = lH * MICRO_CONVERSION_FACTOR; // Convert H to µH
            return luH;
        }
    );
}

// Calculate switching frequency
function calculateFsw() {
    calculateAndUpdate(
        ['buck-vin', 'buck-vout', 'buck-inductance', 'buck-ilpp'], // Input IDs
        'buck-fsw', // Output ID
        (vin, vout, l, ilpp, vdsh, vdsl) => { // Calculation logic
             // Avoid division by zero or near-zero denominator
            const denominator = (vin - vdsh);
            if (Math.abs(denominator) < 1e-9) return null;
            const d = (vout + vdsl) / denominator;

            const lH = l / MICRO_CONVERSION_FACTOR;
            // Avoid division by zero or near-zero denominator
            const denom_fsw = (lH * ilpp);
            if (Math.abs(denom_fsw) < 1e-9) return null;
            const fswHz = (vout * (1 - d)) / denom_fsw;
            const fswMHz = utils.hzToMhz(fswHz);
            return fswMHz;
        }
    );
}

// Calculate inductor current ripple
function calculateIlpp() {
    calculateAndUpdate(
        ['buck-vout', 'buck-vin', 'buck-inductance', 'buck-fsw'], // Input IDs
        'buck-ilpp', // Output ID
        (vout, vin, l, fsw, vdsh, vdsl) => { // Calculation logic
            // Avoid division by zero or near-zero denominator
            const denominator = (vin - vdsh);
            if (Math.abs(denominator) < 1e-9) return null;
            const d = (vout + vdsl) / denominator;

            const fswHz = utils.mhzToHz(fsw);
            const lH = l / MICRO_CONVERSION_FACTOR;
            // Avoid division by zero or near-zero denominator
            const denom_ilpp = (fswHz * lH);
             if (Math.abs(denom_ilpp) < 1e-9) return null;
            const ilpp = (vout * (1 - d)) / denom_ilpp;
            return ilpp;
        }
    );
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

// Edge keepout input
const edgeKeepoutInput = document.getElementById('buck-edge-keepout');
if (edgeKeepoutInput) {
    edgeKeepoutInput.value = edgeKeepoutInput.value || '3';
} 
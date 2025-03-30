/**
 * Boost Converter Calculator (v1.0.0)
 *
 * Provides functionality to calculate boost converter parameters such as:
 * - Input voltage (Vin)
 * - Output voltage (Vout)
 * - Inductor value
 * - Switching frequency
 * - Inductor current ripple
 * - Load current (Iout)
 * - Average inductor current (IL_avg)
 * - Duty cycle
 * - On time (Ton)
 * 
 * This module handles all the mathematical calculations for boost converters,
 * allowing users to solve for any parameter by providing the others.
 * 
 * Key Boost Converter Equations:
 * - Duty Cycle: D = 1 - (Vin / (Vout + Vdsl))
 * - Inductor Current Ripple: ΔiL = (Vin * D) / (L * fsw)
 * - Average Inductor Current: IL_avg = Iout / (1-D)
 * - On Time: Ton = D / fsw
 * 
 * Usage:
 * - Each function calculates one parameter based on the other parameters
 * - Input values are obtained from HTML form elements
 * - Results are displayed in the corresponding HTML form elements
 * - All functions use common utilities from utils.js for consistency
 */

// Module-scoped variables for internal state management
let isUpdatingCurrents = false;

// Boost Converter Calculator Functions

/**
 * Helper function to safely calculate duty cycle with validation
 * @param {number} vin - Input voltage
 * @param {number} vout - Output voltage
 * @param {number} vdsl - Low-side FET voltage drop (default 0)
 * @returns {number|null} - Duty cycle as decimal (0-1) or null if invalid inputs
 */
function getBoostDutyCycle(vin, vout, vdsl = 0) {
    // Validate inputs to avoid calculation errors
    if (!vin || !vout || vin <= 0 || vout <= 0) {
        return null;
    }
    
    // Ensure we don't divide by zero or get negative values
    if (vin >= vout + vdsl) {
        // If Vin >= Vout, we can't boost (invalid for boost converter)
        return null;
    }
    
    // For boost: D = 1 - (Vin / (Vout + Vdsl))
    return Math.min(0.99, Math.max(0, 1 - (vin / (vout + vdsl))));
}

// Helper function to manage calculation flow for Boost converter
function calculateAndUpdateBoost(inputIds, outputId, calculationFn) {
    const dependentFns = [calculateBoostDutyCycle, calculateBoostTon, updateCurrentValues];
    const inputValues = inputIds.map(id => utils.getValue(id));
    const inputNames = inputIds.map(id => id.replace('boost-', '').toUpperCase());

    // Fetch optional/common values, providing defaults
    const vdsl = utils.getValue('boost-vdsl') || 0;
    const vdsh = utils.getValue('boost-vdsh') || 0; // Might be needed too

    if (!utils.validateInputs(inputValues, inputNames)) {
        return null;
    }

    // Pass validated inputs and any extra common values needed
    const result = calculationFn(...inputValues, vdsl, vdsh);

    if (result !== null && result !== undefined && !isNaN(result)) {
        utils.setValue(outputId, result);
        dependentFns.forEach(fn => {
            if (typeof fn === 'function') { 
                // Basic check to prevent simple direct recursion via helper
                if (!inputIds.includes(fn.name.replace('calculateBoost', 'boost-').toLowerCase()) && fn.name !== 'updateCurrentValues') {
                    fn(); 
                }
            } 
            else { console.error('Dependent function is not valid:', fn); }
        });
        // Ensure updateCurrentValues runs carefully after setting the main value
        if (typeof updateCurrentValues === 'function') {
             updateCurrentValues();
        }
        return result;
    }
    return null;
}

// Calculate duty cycle
function calculateBoostDutyCycle() {
    const vin = utils.getValue('boost-vin');
    const vout = utils.getValue('boost-vout');
    const vdsh = utils.getValue('boost-vdsh') || 0;
    const vdsl = utils.getValue('boost-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout], 
        ['Input Voltage', 'Output Voltage']
    )) {
        return null;
    }
    
    // Calculate duty cycle using helper function
    const dutyCycle = getBoostDutyCycle(vin, vout, vdsl);
    if (dutyCycle === null) {
        utils.setValue('boost-duty', ''); // Clear if invalid
        return null;
    }
    
    utils.setValue('boost-duty', dutyCycle * 100); // Convert to percentage
    
    // Update dependent values without creating recursion
    if (!isUpdatingCurrents) {
        updateCurrentValues();
        calculateBoostTon(); // Ensure Ton is updated
    }
    
    return dutyCycle;
}

// Helper function to update current values when duty cycle changes
function updateCurrentValues() {
    // Set a flag to prevent recursive calls
    isUpdatingCurrents = true;
    
    try {
        const iout = utils.getValue('boost-iout');
        const ilavg = utils.getValue('boost-ilavg');
        const vin = utils.getValue('boost-vin');
        const vout = utils.getValue('boost-vout');
        const vdsl = utils.getValue('boost-vdsl') || 0;
        
        // Get duty cycle directly using helper
        const d = getBoostDutyCycle(vin, vout, vdsl);
        
        // Only update if we have valid inputs and a valid duty cycle
        if (iout && vin && vout && d !== null) {
            // Calculate IL_avg from Iout
            const ilavgNew = iout / (1 - d);
            utils.setValue('boost-ilavg', ilavgNew);
        } else if (ilavg && vin && vout && d !== null) {
            // Calculate Iout from IL_avg
            const ioutNew = ilavg * (1 - d);
            utils.setValue('boost-iout', ioutNew);
        }
    } finally {
        // Clear the flag
        isUpdatingCurrents = false;
    }
}

// Calculate load current
function calculateBoostIout() {
    calculateAndUpdateBoost(
        ['boost-ilavg', 'boost-vin', 'boost-vout'], // Input IDs
        'boost-iout', // Output ID
        (ilavg, vin, vout, vdsl) => { // Calculation logic
            const d = getBoostDutyCycle(vin, vout, vdsl);
            if (d === null) return null;
            // For boost: Iout = IL_avg * (1-D)
            return ilavg * (1 - d);
        }
    );
}

// Calculate average inductor current
function calculateBoostILavg() {
    calculateAndUpdateBoost(
        ['boost-iout', 'boost-vin', 'boost-vout'], // Input IDs
        'boost-ilavg', // Output ID
        (iout, vin, vout, vdsl) => { // Calculation logic
            const d = getBoostDutyCycle(vin, vout, vdsl);
            if (d === null) return null;
            // Ensure we don't divide by zero
            if (Math.abs(1 - d) < 1e-9) return null; 
            // For boost: IL_avg = Iout / (1-D)
            return iout / (1 - d);
        }
    );
}

// Calculate on-time (Ton)
function calculateBoostTon() {
    const fsw = utils.getValue('boost-fsw');
    // Get duty cycle from the stored value first, or calculate it if not available
    let duty;
    
    const dutyFromUI = utils.getValue('boost-duty');
    if (dutyFromUI) {
        duty = dutyFromUI / 100; // Convert from percentage to decimal
    } else {
        // Calculate duty cycle if not available in UI
        const vin = utils.getValue('boost-vin');
        const vout = utils.getValue('boost-vout');
        const vdsl = utils.getValue('boost-vdsl') || 0;
        
        duty = getBoostDutyCycle(vin, vout, vdsl);
    }
    
    // Validate inputs
    if (!utils.validateInputs(
        [fsw], 
        ['Switching Frequency']
    ) || duty === null) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    // Calculate Ton in seconds then convert to microseconds
    const tonSeconds = duty / fswHz;
    const tonMicroseconds = tonSeconds * MICRO_CONVERSION_FACTOR;
    
    utils.setValue('boost-ton', tonMicroseconds);
}

// Calculate Vin
function calculateBoostVin() {
    const vout = utils.getValue('boost-vout');
    const vdsh = utils.getValue('boost-vdsh') || 0;
    const vdsl = utils.getValue('boost-vdsl') || 0;
    const ilpp = utils.getValue('boost-ilpp');
    const l = utils.getValue('boost-inductance');
    const fsw = utils.getValue('boost-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, ilpp, l, fsw], 
        ['Output Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    // Using inductor ripple equation for boost
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    // For boost: L = (Vin * D) / (fsw * ΔiL)
    // Solve for D first using an iterative approach, since D depends on Vin which we're trying to find
    let d = 0.5; // Initial guess
    let vin = 0;
    
    for (let i = 0; i < ITERATION_LIMIT; i++) { // Few iterations for convergence
        // For boost: ΔiL = (Vin * D) / (L * fsw)
        // Solving for Vin: Vin = (ΔiL * L * fsw) / D
        vin = (ilpp * lH * fswHz) / d;
        
        // Update duty cycle
        const d_new = 1 - (vin / (vout + vdsl));
        
        if (Math.abs(d - d_new) < CONVERGENCE_THRESHOLD) {
            d = d_new;
            break;
        }
        d = d_new;
    }
    
    // Ensure Vin is valid
    if (isNaN(vin) || vin <= 0 || vin >= vout) {
        return;
    }
    
    utils.setValue('boost-vin', vin);
    
    // Update dependent values
    calculateBoostDutyCycle();
    calculateBoostTon();
    updateCurrentValues();
}

// Calculate Vout
function calculateBoostVout() {
    const vin = utils.getValue('boost-vin');
    const vdsh = utils.getValue('boost-vdsh') || 0;
    const vdsl = utils.getValue('boost-vdsl') || 0;
    const ilpp = utils.getValue('boost-ilpp');
    const l = utils.getValue('boost-inductance');
    const fsw = utils.getValue('boost-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, ilpp, l, fsw], 
        ['Input Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / MICRO_CONVERSION_FACTOR;
    
    // For boost: ΔiL = (Vin * D) / (L * fsw)
    // Also: D = 1 - (Vin / (Vout + Vdsl))
    // Combining: ΔiL = (Vin * (1 - (Vin / (Vout + Vdsl)))) / (L * fsw)
    // Solving for Vout: 
    
    // Rearranging to get: Vout = (Vin² / (Vin - (ΔiL * L * fsw))) - Vdsl
    const denominator = vin - (ilpp * lH * fswHz);
    
    // Check for division by zero or near-zero
    if (Math.abs(denominator) < 0.001) {
        return;
    }
    
    const vout = (vin * vin / denominator) - vdsl;
    
    // Ensure Vout is valid and greater than Vin (requirement for boost)
    if (isNaN(vout) || vout <= vin) {
        return;
    }
    
    utils.setValue('boost-vout', vout);
    
    // Update dependent values
    calculateBoostDutyCycle();
    calculateBoostTon();
    updateCurrentValues();
}

// Calculate inductance
function calculateBoostL() {
    calculateAndUpdateBoost(
        ['boost-vin', 'boost-vout', 'boost-fsw', 'boost-ilpp'], // Input IDs
        'boost-inductance', // Output ID
        (vin, vout, fsw, ilpp, vdsl) => { // Calculation logic
            const d = getBoostDutyCycle(vin, vout, vdsl);
            if (d === null) return null;
            const fswHz = utils.mhzToHz(fsw);
            // Ensure we don't divide by zero
            if (Math.abs(fswHz * ilpp) < 1e-9) return null;
            // For boost: L = (Vin * D) / (fsw * ΔiL)
            const lH = (vin * d) / (fswHz * ilpp);
            return lH * MICRO_CONVERSION_FACTOR; // Convert H to µH
        }
    );
}

// Calculate switching frequency
function calculateBoostFsw() {
    calculateAndUpdateBoost(
        ['boost-vin', 'boost-vout', 'boost-inductance', 'boost-ilpp'], // Input IDs
        'boost-fsw', // Output ID
        (vin, vout, l, ilpp, vdsl) => { // Calculation logic
            const d = getBoostDutyCycle(vin, vout, vdsl);
            if (d === null) return null;
            const lH = l / MICRO_CONVERSION_FACTOR;
            // Ensure we don't divide by zero
            if (Math.abs(lH * ilpp) < 1e-9) return null;
            // For boost: fsw = (Vin * D) / (L * ΔiL)
            const fswHz = (vin * d) / (lH * ilpp);
            return utils.hzToMhz(fswHz);
        }
    );
}

// Calculate inductor current ripple
function calculateBoostIlpp() {
    calculateAndUpdateBoost(
        ['boost-vin', 'boost-vout', 'boost-inductance', 'boost-fsw'], // Input IDs
        'boost-ilpp', // Output ID
        (vin, vout, l, fsw, vdsl) => { // Calculation logic
            const d = getBoostDutyCycle(vin, vout, vdsl);
            if (d === null) return null;
            const lH = l / MICRO_CONVERSION_FACTOR;
            const fswHz = utils.mhzToHz(fsw);
            // Ensure we don't divide by zero
            if (Math.abs(lH * fswHz) < 1e-9) return null;
            // For boost: ΔiL = (Vin * D) / (L * fsw)
            return (vin * d) / (lH * fswHz);
        }
    );
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'boost',              // ID
        'Boost Converter',    // Name
        'DC-DC step-up converter calculator', // Description
        {
            calculateVin: calculateBoostVin,
            calculateVout: calculateBoostVout,
            calculateL: calculateBoostL,
            calculateFsw: calculateBoostFsw,
            calculateBoostIlpp: calculateBoostIlpp,
            calculateIout: calculateBoostIout,
            calculateILavg: calculateBoostILavg,
            calculateDutyCycle: calculateBoostDutyCycle,
            calculateTon: calculateBoostTon
        }
    );
}

// Make functions globally accessible
window.calculateBoostVin = calculateBoostVin;
window.calculateBoostVout = calculateBoostVout;
window.calculateBoostL = calculateBoostL;
window.calculateBoostFsw = calculateBoostFsw;
window.calculateBoostIlpp = calculateBoostIlpp; // <<< Add this line manually
window.calculateBoostIout = calculateBoostIout;
window.calculateBoostILavg = calculateBoostILavg;
window.calculateBoostDutyCycle = calculateBoostDutyCycle;
window.calculateBoostTon = calculateBoostTon; 
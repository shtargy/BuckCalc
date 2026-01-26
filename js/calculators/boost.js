'use strict';

/**
 * Boost Converter Calculator (v1.1.0)
 *
 * Provides functionality to calculate boost converter parameters such as:
 * - Duty cycle
 * - On time (Ton)
 * - Inductor current ripple (iL(p-p))
 * - Average inductor current (IL(avg))
 * 
 * This module is designed to automatically update all performance metrics
 * in response to user input, providing an instantaneous calculation experience.
 * 
 * Key Boost Converter Equations:
 * - Duty Cycle: D = 1 - ((Vin - Vdsh) / (Vout + Vdsl))
 * - Inductor Current Ripple: ΔiL = ((Vin - Vdsh) * D) / (L * fsw)
 * - Average Inductor Current: IL_avg = Iout / (1-D)
 * - On Time: Ton = D / fsw
 * 
 * Usage:
 * - The main function `calculateAllBoostMetrics` is triggered on any input change.
 * - Input values are obtained from the HTML form elements.
 * - Results are displayed in the corresponding readonly output fields.
 */

(function() {

// --- Core Calculation Functions ---

function calculateBoostDutyCycle(vin, vout, vdsh = 0, vdsl = 0) {
    // Effective input voltage accounting for high-side switch drop
    const vinEff = vin - vdsh;
    const denominator = vout + vdsl;
    
    if (!vin || !vout || vinEff <= 0 || vout <= 0 || denominator <= 0 || vinEff >= denominator) {
        return null; // Invalid conditions for a boost converter
    }
    // For boost: D = 1 - ((Vin - Vdsh) / (Vout + Vdsl))
    return 1 - (vinEff / denominator);
}

function calculateBoostIlpp(vin, vdsh, dutyCycle, inductance, fsw) {
    const lH = inductance / utils.constants.MICRO;
    const fswHz = utils.mhzToHz(fsw);
    const denominator = lH * fswHz;
    if (denominator === 0) return null;

    // Use effective input voltage
    const vinEff = vin - vdsh;
    return (vinEff * dutyCycle) / denominator;
}

function calculateBoostILavg(iout, dutyCycle) {
    const denominator = 1 - dutyCycle;
    if (denominator <= 0) return null; // Duty cycle must be < 1

    return iout / denominator;
}

function calculateBoostTon(dutyCycle, fsw) {
    const fswHz = utils.mhzToHz(fsw);
    if (fswHz === 0) return null;

    return (dutyCycle / fswHz) * utils.constants.MICRO; // Return in µs
}


// --- Main Orchestration Function ---

function calculateAllBoostMetrics() {
    // 1. Read all input values
    const vin = utils.getValue('boost-vin');
    const vout = utils.getValue('boost-vout');
    const inductance = utils.getValue('boost-inductance');
    const fsw = utils.getValue('boost-fsw');
    const iout = utils.getValue('boost-iout');
    // Default Vds values to 0 if not provided
    const vdsh = utils.getValue('boost-vdsh') || 0;
    const vdsl = utils.getValue('boost-vdsl') || 0;

    // 2. Validate inputs silently
    const coreInputs = [vin, vout, inductance, fsw, iout];
    const coreInputNames = ['Input Voltage', 'Output Voltage', 'Inductance', 'Switching Freq', 'Load Current'];

    const errorEl = document.getElementById('boost-error');
    const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };
    const clearOutputs = () => {
        utils.setValue('boost-duty', '', 2);
        utils.setValue('boost-ton', '', 3);
        utils.setValue('boost-ilpp', '', 3);
        utils.setValue('boost-ilavg', '', 3);
    };

    setError('');

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        clearOutputs();
        setError('Enter Vin, Vout, L, Fsw and Iout to calculate.');
        return;
    }

    if ([vin, vout, inductance, fsw, iout].some(v => v === null || v <= 0)) {
        clearOutputs();
        setError('Vin, Vout, L, Fsw and Iout must be positive values.');
        return;
    }

    if (vin - vdsh <= 0) {
        clearOutputs();
        setError('Vin must be greater than Vds(hi).');
        return;
    }

    // 3. Perform calculations in order of dependency
    const dutyCycle = calculateBoostDutyCycle(vin, vout, vdsh, vdsl);
    
    if (dutyCycle === null || dutyCycle >= 1) {
        clearOutputs();
        setError('Invalid operating point: ensure Vin < Vout and drops are reasonable.');
        return;
    }

    const ton = calculateBoostTon(dutyCycle, fsw);
    const ilpp = calculateBoostIlpp(vin, vdsh, dutyCycle, inductance, fsw);
    const ilavg = calculateBoostILavg(iout, dutyCycle);

    // 4. Update the UI
    utils.setValue('boost-duty', dutyCycle * 100, 2);
    utils.setValue('boost-ton', ton, 3);
    utils.setValue('boost-ilpp', ilpp, 3);
    utils.setValue('boost-ilavg', ilavg, 3);
}


// --- Event Listener Setup ---

function setupEventListeners() {
    const boostInputIds = [
        'boost-vin', 'boost-vout', 'boost-inductance', 
        'boost-fsw', 'boost-vdsh', 'boost-vdsl', 'boost-iout'
    ];

    boostInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBoostMetrics);
            // Add Enter key support
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') calculateAllBoostMetrics();
            });
        }
    });
}

// --- Initialization ---
function init() {
    setupEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Register with calculator registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'boost',
        'Boost Converter',
        'DC-DC step-up converter calculator',
        { calculateAllBoostMetrics }
    );
}

})(); 
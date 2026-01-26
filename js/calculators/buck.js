'use strict';

/**
 * Buck Converter Calculator (v1.1.0)
 *
 * Provides functionality to automatically calculate buck converter performance
 * metrics based on user-provided inputs.
 *
 * Calculated Outputs:
 * - Duty Cycle
 * - On-Time (Ton)
 * - Inductor Current Ripple (iL(p-p))
 *
 * This module is designed to update all outputs instantaneously whenever a
 * user modifies an input value, providing a seamless and responsive experience.
 *
 * Key Buck Converter Equations:
 * - Duty Cycle: D = (Vout + Vdsl) / (Vin - Vdsh)
 * - Inductor Current Ripple: ΔiL = (Vout * (1 - D)) / (fsw * L)
 * - On Time: Ton = D / fsw
 *
 */

(function() {

function calculateBuckDutyCycle(vin, vout, vdsh, vdsl) {
    if (vin - vdsh === 0) return null;
    return (vout + vdsl) / (vin - vdsh);
}

function calculateBuckTon(dutyCycle, fsw) {
    const fswHz = utils.mhzToHz(fsw);
    if (fswHz === 0) return null;
    const tonSeconds = dutyCycle / fswHz;
    return tonSeconds * utils.constants.MICRO;
}

function calculateBuckIlpp(vin, vout, l, fsw, dutyCycle) {
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / utils.constants.MICRO;
    if (fswHz * lH === 0) return null;
    // The ripple equation uses the simple duty cycle, not the one adjusted for Vds.
    // However, for consistency with other calculators, we will use the adjusted one.
    // This can be revisited if a more "ideal" calculation is preferred.
    return (vout * (1 - dutyCycle)) / (fswHz * lH);
}

function calculateAllBuckMetrics() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const inductance = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    // Default Vds values to 0 if not provided
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;

    // Check for sufficient inputs before proceeding
    const coreInputs = [vin, vout, inductance, fsw];
    const coreInputNames = ['Input Voltage', 'Output Voltage', 'Inductance', 'Switching Freq'];

    const errorEl = document.getElementById('buck-error');
    const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };
    const clearOutputs = () => {
        utils.setValue('buck-duty', '', 2);
        utils.setValue('buck-ton', '', 3);
        utils.setValue('buck-ilpp', '', 3);
    };

    setError('');

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        clearOutputs();
        setError('Enter Vin, Vout, L and Fsw to calculate.');
        return;
    }

    if ([vin, vout, inductance, fsw].some(v => v === null || v <= 0)) {
        clearOutputs();
        setError('Vin, Vout, L and Fsw must be positive values.');
        return;
    }

    if (vin - vdsh <= 0) {
        clearOutputs();
        setError('Vin must be greater than Vds(hi).');
        return;
    }

    // --- Perform Calculations ---

    // 1. Duty Cycle
    const dutyCycle = calculateBuckDutyCycle(vin, vout, vdsh, vdsl);
    if (dutyCycle !== null && dutyCycle >= 0 && dutyCycle <= 1) {
        utils.setValue('buck-duty', dutyCycle * 100, 2); // Display as percentage
    } else {
        clearOutputs();
        setError('Duty cycle is out of range. Check Vin/Vout and Vds values.');
        return;
    }
    
    // 2. Ton
    if (dutyCycle !== null && fsw > 0) {
        const ton = calculateBuckTon(dutyCycle, fsw);
        if (ton !== null) {
            utils.setValue('buck-ton', ton, 3);
        } else {
            utils.setValue('buck-ton', '', 3);
        }
    } else {
        utils.setValue('buck-ton', '', 3);
    }

    // 3. iL(p-p)
    const ilpp = calculateBuckIlpp(vin, vout, inductance, fsw, dutyCycle);
    if (ilpp !== null) {
        utils.setValue('buck-ilpp', ilpp, 3);
    } else {
        utils.setValue('buck-ilpp', '', 3);
    }
}

// --- Event Listener Setup ---

function setupEventListeners() {
    const buckInputIds = [
        'buck-vin', 'buck-vout', 'buck-inductance',
        'buck-fsw', 'buck-vdsh', 'buck-vdsl'
    ];

    buckInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBuckMetrics);
            // Add Enter key support
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') calculateAllBuckMetrics();
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
        'buck',
        'Buck Converter',
        'DC-DC step-down converter calculator',
        { calculateAllBuckMetrics }
    );
}

})(); 
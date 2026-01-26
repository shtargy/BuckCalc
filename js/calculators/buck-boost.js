'use strict';

/**
 * Inverting Buck-Boost Converter Calculator (v1.1.0)
 *
 * Provides functionality to automatically calculate buck-boost converter performance
 * metrics based on user-provided inputs. The inverting topology produces a
 * negative output voltage from a positive input voltage.
 *
 * Calculated Outputs:
 * - Duty Cycle
 * - Average Inductor Current (IL(avg))
 * - Inductor Current Ripple (ΔIL)
 *
 * This module is designed to update all outputs instantaneously whenever a
 * user modifies an input value, providing a seamless and responsive experience.
 */

(function() {

// --- Core Calculation Functions ---

function calculateBuckBoostDutyCycle(vin, vout) {
    // For inverting buck-boost, Vout magnitude is used.
    const voutMag = Math.abs(vout);
    const denominator = vin + voutMag;
    if (denominator < 1e-9) return null; // Avoid division by zero

    // Formula: D = Vout / (Vin + Vout)
    return voutMag / denominator;
}

function calculateBuckBoostILavg(iout, dutyCycle) {
    const denominator = 1 - dutyCycle;
    if (denominator < 1e-9) return null; // Avoid division by zero, D must be < 1

    // Formula: IL(avg) = Iout / (1 - D)
    return iout / denominator;
}

function calculateBuckBoostDeltaIL(vin, dutyCycle, inductance, fsw) {
    const fswHz = utils.mhzToHz(fsw);
    const lH = inductance / utils.constants.MICRO;
    const denominator = fswHz * lH;
    if (denominator < 1e-9) return null;

    // Formula: ΔIL = (Vin * D) / (fsw * L)
    return (vin * dutyCycle) / denominator;
}


// --- Main Orchestration Function ---

function calculateAllBuckBoostMetrics() {
    // 1. Read all input values
    const vin = utils.getValue('ibb-vin');
    const vout = utils.getValue('ibb-vout'); // Keep as positive magnitude from UI
    const iout = utils.getValue('ibb-iout');
    const inductance = utils.getValue('ibb-inductance');
    const fsw = utils.getValue('ibb-fsw');

    // 2. Validate inputs silently
    const coreInputs = [vin, vout, iout, inductance, fsw];
    const coreInputNames = ['Input Voltage', 'Output Voltage', 'Output Current', 'Inductance', 'Switching Freq'];

    const errorEl = document.getElementById('ibb-error');
    const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };
    const clearOutputs = () => {
        utils.setValue('ibb-duty', '', 2);
        utils.setValue('ibb-ilavg', '', 3);
        utils.setValue('ibb-ilpp', '', 3);
    };

    setError('');

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        clearOutputs();
        setError('Enter Vin, Vout, Iout, L and Fsw to calculate.');
        return;
    }

    if ([vin, vout, iout, inductance, fsw].some(v => v === null || v <= 0)) {
        clearOutputs();
        setError('Vin, |Vout|, Iout, L and Fsw must be positive values.');
        return;
    }

    // 3. Perform calculations in order of dependency
    const dutyCycle = calculateBuckBoostDutyCycle(vin, vout);
    
    if (dutyCycle === null || dutyCycle >= 1) {
        clearOutputs();
        setError('Duty cycle is out of range; check Vin and |Vout|.');
        return;
    }

    const ilAvg = calculateBuckBoostILavg(iout, dutyCycle);
    const deltaIL = calculateBuckBoostDeltaIL(vin, dutyCycle, inductance, fsw);

    // 4. Update the UI
    utils.setValue('ibb-duty', dutyCycle * 100, 2);
    utils.setValue('ibb-ilavg', ilAvg, 3);
    utils.setValue('ibb-ilpp', deltaIL, 3);
}


// --- Event Listener Setup ---

function setupEventListeners() {
    const ibbInputIds = [
        'ibb-vin', 'ibb-vout', 'ibb-iout', 
        'ibb-inductance', 'ibb-fsw'
    ];

    ibbInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBuckBoostMetrics);
            // Add Enter key support
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') calculateAllBuckBoostMetrics();
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
        'buck-boost',
        'Inverting Buck-Boost',
        'Inverting DC-DC buck-boost converter calculator',
        { calculateAllBuckBoostMetrics }
    );
}

})(); 
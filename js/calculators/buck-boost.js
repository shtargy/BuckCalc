'use strict';

/**
 * Inverting Buck-Boost Converter Calculator (v1.0.0)
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

const BUCKBOOST_MICRO_CONVERSION_FACTOR = 1e6;

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
    const lH = inductance / BUCKBOOST_MICRO_CONVERSION_FACTOR;
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

    const clearOutputs = () => {
        utils.setValue('ibb-duty', '', 2);
        utils.setValue('ibb-ilavg', '', 3);
        utils.setValue('ibb-ilpp', '', 3);
    };

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        clearOutputs();
        return;
    }

    // 3. Perform calculations in order of dependency
    const dutyCycle = calculateBuckBoostDutyCycle(vin, vout);
    
    if (dutyCycle === null || dutyCycle >= 1) {
        clearOutputs();
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

document.addEventListener('DOMContentLoaded', function() {
    const ibbInputIds = [
        'ibb-vin', 'ibb-vout', 'ibb-iout', 
        'ibb-inductance', 'ibb-fsw'
    ];

    ibbInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBuckBoostMetrics);
        }
    });
}); 
'use strict';

/**
 * Boost Converter Calculator (v1.0.0)
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
 * - Duty Cycle: D = 1 - (Vin / (Vout + Vdsl))
 * - Inductor Current Ripple: ΔiL = (Vin * D) / (L * fsw)
 * - Average Inductor Current: IL_avg = Iout / (1-D)
 * - On Time: Ton = D / fsw
 * 
 * Usage:
 * - The main function `calculateAllBoostMetrics` is triggered on any input change.
 * - Input values are obtained from the HTML form elements.
 * - Results are displayed in the corresponding readonly output fields.
 */

const BOOST_MICRO_CONVERSION_FACTOR = 1e6;

// --- Core Calculation Functions ---

function calculateBoostDutyCycle(vin, vout, vdsl = 0) {
    const denominator = vout + vdsl;
    if (!vin || !vout || vin <= 0 || vout <= 0 || denominator <= 0 || vin >= denominator) {
        return null; // Invalid conditions for a boost converter
    }
    // For boost: D = 1 - (Vin / (Vout + Vdsl))
    return 1 - (vin / denominator);
}

function calculateBoostIlpp(vin, dutyCycle, inductance, fsw) {
    const lH = inductance / BOOST_MICRO_CONVERSION_FACTOR;
    const fswHz = utils.mhzToHz(fsw);
    const denominator = lH * fswHz;
    if (denominator === 0) return null;

    return (vin * dutyCycle) / denominator;
}

function calculateBoostILavg(iout, dutyCycle) {
    const denominator = 1 - dutyCycle;
    if (denominator <= 0) return null; // Duty cycle must be < 1

    return iout / denominator;
}

function calculateBoostTon(dutyCycle, fsw) {
    const fswHz = utils.mhzToHz(fsw);
    if (fswHz === 0) return null;

    return (dutyCycle / fswHz) * BOOST_MICRO_CONVERSION_FACTOR; // Return in µs
}


// --- Main Orchestration Function ---

function calculateAllBoostMetrics() {
    // 1. Read all input values
    const vin = utils.getValue('boost-vin');
    const vout = utils.getValue('boost-vout');
    const inductance = utils.getValue('boost-inductance');
    const fsw = utils.getValue('boost-fsw');
    const iout = utils.getValue('boost-iout');
    const vdsl = utils.getValue('boost-vdsl') || 0;

    // 2. Validate inputs silently
    const coreInputs = [vin, vout, inductance, fsw, iout];
    const coreInputNames = ['Input Voltage', 'Output Voltage', 'Inductance', 'Switching Freq', 'Load Current'];

    const clearOutputs = () => {
        utils.setValue('boost-duty', '', 2);
        utils.setValue('boost-ton', '', 3);
        utils.setValue('boost-ilpp', '', 3);
        utils.setValue('boost-ilavg', '', 3);
    };

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        clearOutputs();
        return;
    }

    // 3. Perform calculations in order of dependency
    const dutyCycle = calculateBoostDutyCycle(vin, vout, vdsl);
    
    if (dutyCycle === null || dutyCycle >= 1) {
        clearOutputs();
        return;
    }

    const ton = calculateBoostTon(dutyCycle, fsw);
    const ilpp = calculateBoostIlpp(vin, dutyCycle, inductance, fsw);
    const ilavg = calculateBoostILavg(iout, dutyCycle);

    // 4. Update the UI
    utils.setValue('boost-duty', dutyCycle * 100, 2);
    utils.setValue('boost-ton', ton, 3);
    utils.setValue('boost-ilpp', ilpp, 3);
    utils.setValue('boost-ilavg', ilavg, 3);
}


// --- Event Listener Setup ---

document.addEventListener('DOMContentLoaded', function() {
    const boostInputIds = [
        'boost-vin', 'boost-vout', 'boost-inductance', 
        'boost-fsw', 'boost-vdsl', 'boost-iout'
    ];

    boostInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBoostMetrics);
        }
    });
}); 
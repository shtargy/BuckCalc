'use strict';

/**
 * Buck Converter Calculator (v1.0.0)
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

const BUCK_MICRO_CONVERSION_FACTOR = 1e6;

function calculateBuckDutyCycle(vin, vout, vdsh, vdsl) {
    if (vin - vdsh === 0) return null;
    return (vout + vdsl) / (vin - vdsh);
}

function calculateBuckTon(dutyCycle, fsw) {
    const fswHz = utils.mhzToHz(fsw);
    if (fswHz === 0) return null;
    const tonSeconds = dutyCycle / fswHz;
    return tonSeconds * BUCK_MICRO_CONVERSION_FACTOR;
}

function calculateBuckIlpp(vin, vout, l, fsw, dutyCycle) {
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / BUCK_MICRO_CONVERSION_FACTOR;
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

    if (!utils.validateInputs(coreInputs, coreInputNames, true)) {
        // Clear outputs if inputs are missing
        utils.setValue('buck-duty', '', 2);
        utils.setValue('buck-ton', '', 3);
        utils.setValue('buck-ilpp', '', 3);
        return;
    }

    // --- Perform Calculations ---

    // 1. Duty Cycle
    const dutyCycle = calculateBuckDutyCycle(vin, vout, vdsh, vdsl);
    if (dutyCycle !== null && dutyCycle >= 0 && dutyCycle <= 1) {
        utils.setValue('buck-duty', dutyCycle * 100, 2); // Display as percentage
    } else {
        utils.setValue('buck-duty', '', 2);
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

document.addEventListener('DOMContentLoaded', function() {
    const buckInputIds = [
        'buck-vin', 'buck-vout', 'buck-inductance',
        'buck-fsw', 'buck-vdsh', 'buck-vdsl'
    ];

    buckInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllBuckMetrics);
        }
    });
}); 
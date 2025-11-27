'use strict';

/**
 * Coupled Inductor Ripple Calculator
 * 
 * Calculates the ripple current for discrete (dIL_DL) and coupled (dIL_CL) 
 * inductors in a multiphase buck converter topology.
 * 
 * Features:
 * - Unit dropdowns for inductance (nH, µH) and frequency (kHz, MHz)
 * - Auto-calculation on input change
 * - Formatted outputs: Duty Cycle (%), FOM, Ripples (A)
 */

(function() {

    // --- UNIT CONVERSION HELPERS ---
    function convertInductanceToHenry(value, unit) {
        if (isNaN(value) || value <= 0) return NaN;
        switch(unit) {
            case 'nH': return value * 1e-9;
            case 'uH': return value * 1e-6;
            default: return NaN;
        }
    }

    function convertFrequencyToHz(value, unit) {
        if (isNaN(value) || value <= 0) return NaN;
        switch(unit) {
            case 'kHz': return value * 1e3;
            case 'MHz': return value * 1e6;
            default: return NaN;
        }
    }

    // --- CORE CALCULATION LOGIC ---
    function getAndValidateInputs() {
        const errors = [];
        const values = {};

        // Get input values
        const vin = utils.getValue('ci-vin');
        const vout = utils.getValue('ci-vout');
        const lmRaw = utils.getValue('ci-lm');
        const lRaw = utils.getValue('ci-l');
        const fsRaw = utils.getValue('ci-fs');
        const nphRaw = utils.getValue('ci-nph');

        // Get unit selections
        const lmUnitEl = document.getElementById('ci-lm-unit');
        const lUnitEl = document.getElementById('ci-l-unit');
        const fsUnitEl = document.getElementById('ci-fs-unit');

        // Validate and convert inputs
        if (vin === null || vin <= 0) {
            errors.push('V_IN must be positive.');
        } else {
            values.vin = vin;
        }

        if (vout === null || vout <= 0) {
            errors.push('V_OUT must be positive.');
        } else {
            values.vout = vout;
        }

        if (lmRaw === null || lmRaw <= 0) {
            errors.push('L_m must be positive.');
        } else {
            values.lm = convertInductanceToHenry(lmRaw, lmUnitEl?.value || 'uH');
            if (isNaN(values.lm)) {
                errors.push('Invalid L_m unit.');
            }
        }

        if (lRaw === null || lRaw <= 0) {
            errors.push('L must be positive.');
        } else {
            values.l = convertInductanceToHenry(lRaw, lUnitEl?.value || 'uH');
            if (isNaN(values.l)) {
                errors.push('Invalid L unit.');
            }
        }

        if (fsRaw === null || fsRaw <= 0) {
            errors.push('F_S must be positive.');
        } else {
            values.fs = convertFrequencyToHz(fsRaw, fsUnitEl?.value || 'MHz');
            if (isNaN(values.fs)) {
                errors.push('Invalid F_S unit.');
            }
        }

        if (nphRaw === null || !Number.isInteger(nphRaw) || nphRaw < 2) {
            errors.push('N_ph must be an integer >= 2.');
        } else {
            values.nph = nphRaw;
        }

        // Additional validation: V_IN must be greater than V_OUT
        if (values.vin && values.vout && values.vin <= values.vout) {
            errors.push('V_IN must be greater than V_OUT.');
        }

        if (errors.length > 0) {
            return { error: errors.join(' ') };
        }

        return { values };
    }

    function clearOutputs() {
        utils.setValue('ci-d', '', 2);
        utils.setValue('ci-fom', '', 4);
        utils.setValue('ci-dildl', '', 6);
        utils.setValue('ci-dilcl', '', 6);
    }

    function calculateAndDisplay() {
        const errorEl = document.getElementById('ci-error');
        if (errorEl) errorEl.textContent = '';
        
        clearOutputs();

        const { values, error } = getAndValidateInputs();

        if (error) {
            if (errorEl) errorEl.textContent = `Error: ${error}`;
            return;
        }

        const { vin, vout, lm, l, fs, nph } = values;
        const D = vout / vin;

        try {
            const rho = lm / l;
            const j = Math.floor(D * nph);

            const dIL_DL = (vin - vout) / l * (D / fs);

            const factor = (rho / (rho + 1)) * (1 / (nph - 1));
            const fom_num = 1 + factor;
            const term1 = nph - 2 * j - 2;
            const term2 = (j * (j + 1)) / (nph * D);
            const term3 = (nph * D * (nph - 2 * j - 1) + j * (j + 1)) / (nph * (1 - D));
            const fom_den = 1 - (term1 + term2 + term3) * factor;

            if (Math.abs(fom_den) < 1e-12) {
                throw new Error("FOM denominator is zero, cannot calculate.");
            }
            
            const fom = fom_num / fom_den;
            const dIL_CL = dIL_DL / fom;

            if (![D, fom, dIL_DL, dIL_CL].every(isFinite)) {
                throw new Error("Calculation resulted in a non-finite number.");
            }

            // Display results with appropriate formatting
            utils.setValue('ci-d', D * 100, 2);    // Duty cycle in %
            utils.setValue('ci-fom', fom, 4);      // FOM (no unit)
            utils.setValue('ci-dildl', dIL_DL, 6); // Ripple in A
            utils.setValue('ci-dilcl', dIL_CL, 6); // Ripple in A

        } catch (e) {
            if (errorEl) errorEl.textContent = `Error: ${e.message}`;
            clearOutputs();
        }
    }

    // --- EVENT LISTENER SETUP ---
    // Use same pattern as other calculators (buck.js, boost.js, etc.)
    function setupEventListeners() {
        const inputIds = ['ci-vin', 'ci-vout', 'ci-lm', 'ci-l', 'ci-fs', 'ci-nph'];
        const unitSelectIds = ['ci-lm-unit', 'ci-l-unit', 'ci-fs-unit'];

        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', calculateAndDisplay);
            }
        });

        unitSelectIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', calculateAndDisplay);
            }
        });
    }

    // Set up listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }

    // Register with calculator registry
    if (window.calculatorRegistry) {
        window.calculatorRegistry.register(
            'coupled-inductor',
            'Coupled Inductors',
            'Calculates ripple current for coupled inductors in multiphase buck converters',
            { calculateAndDisplay }
        );
    }

})();

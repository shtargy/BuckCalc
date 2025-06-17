'use strict';

(function() {

    // --- HELPER FUNCTIONS (re-scoped from global) ---
    function formatToEngineering(value) {
        if (value === 0) return { value: 0, exponent: 0 };
        if (!isFinite(value) || isNaN(value)) return { value: NaN, exponent: 0 };
        const log10 = Math.log10(Math.abs(value));
        let exponent = Math.floor(log10 / 3) * 3;
        let significand = value / Math.pow(10, exponent);
        if (significand >= 1000) {
            significand /= 1000;
            exponent += 3;
        } else if (significand < 1 && significand !== 0) {
            significand *= 1000;
            exponent -= 3;
        }
        return { value: parseFloat(significand.toPrecision(4)), exponent };
    }

    function getValueExpFromSciInput(baseId) {
        const valInput = document.getElementById(`${baseId}-val`);
        const expInput = document.getElementById(`${baseId}-exp`);
        let value = parseFloat(valInput?.value);
        let exponent = parseInt(expInput?.value);
        if (isNaN(exponent) || !Number.isInteger(exponent)) exponent = 0;
        if (valInput && valInput.value.trim() === '') value = NaN;
        return { value, exponent };
    }

    function getActualValue(valueExp) {
        if (isNaN(valueExp.value)) return NaN;
        return valueExp.value * Math.pow(10, valueExp.exponent);
    }

    function setSciOutput(baseId, formattedValue) {
        const valInput = document.getElementById(`${baseId}-val`);
        const expInput = document.getElementById(`${baseId}-exp`);
        if (valInput) valInput.value = isNaN(formattedValue.value) ? '' : formattedValue.value;
        if (expInput) expInput.value = isNaN(formattedValue.value) ? '' : formattedValue.exponent;
    }

    // --- DOM ELEMENT REFERENCES ---
    const elements = {
        inputs: {
            vin: 'ci-vin', vout: 'ci-vout', lm: 'ci-lm',
            l: 'ci-l', fs: 'ci-fs', nph: 'ci-nph'
        },
        outputs: {
            d: 'ci-d', fom: 'ci-fom',
            dildl: 'ci-dildl', dilcl: 'ci-dilcl'
        },
        error: document.getElementById('ci-error'),
        button: document.querySelector('#coupled-inductor-calculator .calc-button')
    };

    // --- CORE LOGIC ---
    function getAndValidateInputs() {
        const inputs = {};
        const values = {};
        const errors = [];

        const inputMeta = {
            vin: 'V_IN', vout: 'V_OUT', lm: 'L_m',
            l: 'L', fs: 'F_S', nph: 'N_ph'
        };

        for (const key in elements.inputs) {
            inputs[key] = getValueExpFromSciInput(elements.inputs[key]);
            const name = inputMeta[key];
            if (isNaN(inputs[key].value)) {
                errors.push(`${name} must be provided.`);
            } else if (inputs[key].value <= 0) {
                errors.push(`${name} must be positive.`);
            }
        }
        
        if (inputs.nph.value && !Number.isInteger(inputs.nph.value)) {
            errors.push('N_ph must be an integer.');
        }
         if (inputs.nph.value && inputs.nph.value < 2) {
            errors.push('N_ph must be 2 or greater.');
        }
        
        if (errors.length > 0) return { error: errors.join('; ') };
        
        for (const key in elements.inputs) {
            values[key] = getActualValue(inputs[key]);
        }
        
        if (values.vin <= values.vout) {
            errors.push('V_IN must be greater than V_OUT.');
        }

        if (errors.length > 0) return { error: errors.join('; ') };

        return { values };
    }
    
    function calculateAndDisplay() {
        elements.error.textContent = '';
        const clearOutputs = () => Object.values(elements.outputs).forEach(id => setSciOutput(id, { value: NaN }));

        const { values, error } = getAndValidateInputs();

        if (error) {
            elements.error.textContent = `Error: ${error}`;
            clearOutputs();
            return;
        }

        const { vin, vout, lm, l, fs, nph } = values;
        const D = vout / vin;

        try {
            const rho = lm / l;
            const j = Math.floor(D * nph);

            const dIL_DL_raw = (vin - vout) / l * (D / fs);

            const factor = (rho / (rho + 1)) * (1 / (nph - 1));
            const fom_num = 1 + factor;
            const term1 = nph - 2 * j - 2;
            const term2 = (j * (j + 1)) / (nph * D);
            const term3 = (nph * D * (nph - 2 * j - 1) + j * (j + 1)) / (nph * (1 - D));
            const fom_den = 1 - (term1 + term2 + term3) * factor;

            if (fom_den === 0) throw new Error("FOM denominator is zero, cannot calculate.");
            const fom = fom_num / fom_den;

            const dIL_CL_raw = dIL_DL_raw / fom;

            if (![D, fom, dIL_DL_raw, dIL_CL_raw].every(isFinite)) {
                throw new Error("Calculation resulted in a non-finite number.");
            }

            setSciOutput(elements.outputs.d, formatToEngineering(D));
            setSciOutput(elements.outputs.fom, formatToEngineering(fom));
            setSciOutput(elements.outputs.dildl, formatToEngineering(dIL_DL_raw));
            setSciOutput(elements.outputs.dilcl, formatToEngineering(dIL_CL_raw));

        } catch (e) {
            elements.error.textContent = `Error: ${e.message}`;
            clearOutputs();
        }
    }

    // --- INITIALIZATION ---
    function init() {
        if (elements.button) {
            elements.button.addEventListener('click', calculateAndDisplay);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 
'use strict';

(function() {

    // --- HELPER FUNCTIONS ---

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

        return { value: parseFloat(significand.toPrecision(4)), exponent: exponent };
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

    // --- RC CALCULATOR ---

    function setupRCCalculator() {
        const button = document.querySelector('#rc-calc button');
        if (!button) return;

        const elements = {
            r: { val: document.getElementById('rc-r-val'), exp: document.getElementById('rc-r-exp') },
            c: { val: document.getElementById('rc-c-val'), exp: document.getElementById('rc-c-exp') },
            tau: { val: document.getElementById('rc-tau-val'), exp: document.getElementById('rc-tau-exp') },
            fc: { val: document.getElementById('rc-fc-val'), exp: document.getElementById('rc-fc-exp') },
            error: document.getElementById('rc-error')
        };

        button.addEventListener('click', () => {
            elements.error.textContent = '';
            const rVal = parseFloat(elements.r.val.value);
            const rExp = parseInt(elements.r.exp.value) || 0;
            const cVal = parseFloat(elements.c.val.value);
            const cExp = parseInt(elements.c.exp.value) || 0;

            const clearResults = () => {
                elements.tau.val.value = ''; elements.tau.exp.value = '';
                elements.fc.val.value = ''; elements.fc.exp.value = '';
            };

            if (isNaN(rVal) || isNaN(cVal)) {
                elements.error.textContent = 'Error: Please provide valid numerical values for R and C.';
                clearResults();
                return;
            }
            if (rVal <= 0 || cVal <= 0) {
                elements.error.textContent = 'Error: R and C values must be positive.';
                clearResults();
                return;
            }

            const r = rVal * Math.pow(10, rExp);
            const c = cVal * Math.pow(10, cExp);
            
            try {
                const tauRaw = r * c;
                const fcRaw = 1 / (2 * Math.PI * r * c);

                if (!isFinite(tauRaw) || !isFinite(fcRaw)) {
                    throw new Error("Calculation resulted in an invalid number.");
                }

                const tauFormatted = formatToEngineering(tauRaw);
                const fcFormatted = formatToEngineering(fcRaw);

                setSciOutput('rc-tau', tauFormatted);
                setSciOutput('rc-fc', fcFormatted);

            } catch (error) {
                elements.error.textContent = `Error: ${error.message}`;
                clearResults();
            }
        });
    }

    // --- REACTANCE CALCULATOR ---

    function setupReactanceCalculator() {
        const container = document.getElementById('reactance-calc');
        if (!container) return;

        const errorElement = document.getElementById('reactance-error');

        container.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') return;

            const targetVariable = event.target.dataset.target;
            if (!targetVariable) return;

            errorElement.textContent = '';

            const inputs = {
                f: getValueExpFromSciInput('reactance-f'),
                C: getValueExpFromSciInput('reactance-c'),
                L: getValueExpFromSciInput('reactance-l'),
                Xc: getValueExpFromSciInput('reactance-xc'),
                XL: getValueExpFromSciInput('reactance-xl'),
            };

            const values = {
                f: getActualValue(inputs.f),
                C: getActualValue(inputs.C),
                L: getActualValue(inputs.L),
                Xc: getActualValue(inputs.Xc),
                XL: getActualValue(inputs.XL),
            };

            let requiredInputs = [];
            let calculationFn = null;
            let hasError = false;

            switch (targetVariable) {
                case 'Xc': requiredInputs = ['f', 'C']; calculationFn = () => 1 / (2 * Math.PI * values.f * values.C); break;
                case 'XL': requiredInputs = ['f', 'L']; calculationFn = () => 2 * Math.PI * values.f * values.L; break;
                case 'f':
                    if (!isNaN(values.C) && !isNaN(values.Xc)) {
                        requiredInputs = ['C', 'Xc'];
                        calculationFn = () => 1 / (2 * Math.PI * values.C * values.Xc);
                    } else if (!isNaN(values.L) && !isNaN(values.XL)) {
                        requiredInputs = ['L', 'XL'];
                        calculationFn = () => values.XL / (2 * Math.PI * values.L);
                    } else {
                        errorElement.textContent = 'Error: To calculate Frequency (f), provide either (C and Xc) or (L and XL).';
                        hasError = true;
                    }
                    break;
                case 'C': requiredInputs = ['f', 'Xc']; calculationFn = () => 1 / (2 * Math.PI * values.f * values.Xc); break;
                case 'L': requiredInputs = ['f', 'XL']; calculationFn = () => values.XL / (2 * Math.PI * values.f); break;
                default:
                    errorElement.textContent = 'Error: Unknown calculation target.';
                    hasError = true;
            }
            
            if (hasError) return;

            const missing = requiredInputs.filter(key => isNaN(values[key]));
            const nonPositive = requiredInputs.filter(key => values[key] <= 0);

            if (missing.length > 0) {
                errorElement.textContent = `Error: Please provide values for ${missing.join(', ')}.`;
                hasError = true;
            } else if (nonPositive.length > 0) {
                errorElement.textContent = `Error: Values for ${nonPositive.join(', ')} must be positive.`;
                hasError = true;
            }

            if (hasError) {
                setSciOutput(`reactance-${targetVariable.toLowerCase()}`, { value: NaN, exponent: NaN });
                return;
            }

            try {
                const resultRaw = calculationFn();
                if (!isFinite(resultRaw) || resultRaw < 0) {
                    throw new Error("Calculation resulted in an invalid number.");
                }
                const resultFormatted = formatToEngineering(resultRaw);
                setSciOutput(`reactance-${targetVariable.toLowerCase()}`, resultFormatted);
            } catch (error) {
                errorElement.textContent = `Error: ${error.message}`;
                setSciOutput(`reactance-${targetVariable.toLowerCase()}`, { value: NaN, exponent: NaN });
            }
        });
    }

    // --- LC RESONANCE CALCULATOR ---

    function setupLCResonanceCalculator() {
        const container = document.getElementById('lc-calc');
        if (!container) return;

        const errorElement = document.getElementById('lc-error');
        const inputs = {
            L: 'lc-l',
            C: 'lc-c',
            f0: 'lc-f0'
        };

        container.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') return;

            const targetKey = event.target.dataset.target;
            if (!targetKey) return;
            
            errorElement.textContent = '';
            
            const providedValues = {};
            let missingKeys = [];

            for (const key in inputs) {
                if (key !== targetKey) {
                    const val = getActualValue(getValueExpFromSciInput(inputs[key]));
                    if (isNaN(val) || val <= 0) {
                        missingKeys.push(key.replace('0', '₀'));
                    }
                    providedValues[key] = val;
                }
            }
            
            if (missingKeys.length > 0) {
                errorElement.textContent = `Error: Please provide positive values for ${missingKeys.join(' and ')}.`;
                setSciOutput(inputs[targetKey], { value: NaN, exponent: NaN });
                return;
            }

            const { L, C, f0 } = providedValues;
            let resultRaw;

            try {
                switch (targetKey) {
                    case 'f0':
                        resultRaw = 1 / (2 * Math.PI * Math.sqrt(L * C));
                        break;
                    case 'L':
                        resultRaw = 1 / (Math.pow(2 * Math.PI * f0, 2) * C);
                        break;
                    case 'C':
                        resultRaw = 1 / (Math.pow(2 * Math.PI * f0, 2) * L);
                        break;
                }
                
                if (!isFinite(resultRaw) || resultRaw < 0) {
                     throw new Error("Calculation resulted in an invalid number.");
                }

                const resultFormatted = formatToEngineering(resultRaw);
                setSciOutput(inputs[targetKey], resultFormatted);

            } catch(error) {
                errorElement.textContent = `Error: ${error.message}`;
                setSciOutput(inputs[targetKey], { value: NaN, exponent: NaN });
            }
        });
    }

    // --- INITIALIZATION ---
    
    function init() {
        setupRCCalculator();
        setupReactanceCalculator();
        setupLCResonanceCalculator();
    }

    // Defer script execution until the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Register with calculator registry
    if (window.calculatorRegistry) {
        window.calculatorRegistry.register(
            'rlc',
            'RLC Calculator',
            'RC time constant, reactance, and LC resonance calculators',
            { formatToEngineering }
        );
    }

})();
'use strict';

(function() {
    // DOM Element References
    const elements = {
        x: document.getElementById('thermal-x'),
        y: document.getElementById('thermal-y'),
        z: document.getElementById('thermal-z'),
        k: document.getElementById('thermal-k'),
        rth: document.getElementById('thermal-rth'),
        error: document.getElementById('thermal-error')
    };

    const buttons = {
        x: document.querySelector('#thermal-resistance-calculator .input-group:nth-of-type(1) button'),
        y: document.querySelector('#thermal-resistance-calculator .input-group:nth-of-type(2) button'),
        z: document.querySelector('#thermal-resistance-calculator .input-group:nth-of-type(3) button'),
        k: document.querySelector('#thermal-resistance-calculator .input-group:nth-of-type(4) button'),
        rth: document.querySelector('#thermal-resistance-calculator .input-group:nth-of-type(5) button')
    };
    
    // Attach Event Listeners
    if(buttons.x) buttons.x.addEventListener('click', () => calculate('x'));
    if(buttons.y) buttons.y.addEventListener('click', () => calculate('y'));
    if(buttons.z) buttons.z.addEventListener('click', () => calculate('z'));
    if(buttons.k) buttons.k.addEventListener('click', () => calculate('k'));
    if(buttons.rth) buttons.rth.addEventListener('click', () => calculate('rth'));

    function getParsedInputs(excludeKey) {
        const inputs = {};
        let isValid = true;
        let missing = [];

        for (const key in elements) {
            if (key !== 'error' && key !== excludeKey) {
                const value = parseFloat(elements[key].value);
                if (isNaN(value) || value <= 0) {
                    isValid = false;
                    missing.push(key.toUpperCase());
                }
                inputs[key] = value;
            }
        }
        return { values: inputs, isValid, missing };
    }

    function calculate(targetKey) {
        elements.error.textContent = ''; // Clear previous errors

        const { values, isValid, missing } = getParsedInputs(targetKey);
        
        if (!isValid) {
            elements.error.textContent = `Error: Please provide positive values for ${missing.join(', ')}.`;
            elements[targetKey].value = ''; // Clear target field
            return;
        }

        const { x, y, z, k, rth } = values;
        let result;

        try {
            switch (targetKey) {
                case 'rth':
                    // Rth = (Z * 1000) / (k * X * Y) 
                    if (k === 0 || x === 0 || y === 0) throw new Error("Conductivity and dimensions cannot be zero.");
                    result = (z * 1000) / (k * x * y);
                    break;
                case 'x':
                    // X = (Z * 1000) / (k * Y * Rth)
                    if (k === 0 || y === 0 || rth === 0) throw new Error("Conductivity, Y dimension, and Resistance cannot be zero.");
                    result = (z * 1000) / (k * y * rth);
                    break;
                case 'y':
                    // Y = (Z * 1000) / (k * X * Rth)
                    if (k === 0 || x === 0 || rth === 0) throw new Error("Conductivity, X dimension, and Resistance cannot be zero.");
                    result = (z * 1000) / (k * x * rth);
                    break;
                case 'z':
                    // Z = (Rth * k * X * Y) / 1000
                    result = (rth * k * x * y) / 1000;
                    break;
                case 'k':
                    // k = (Z * 1000) / (Rth * X * Y)
                    if (rth === 0 || x === 0 || y === 0) throw new Error("Resistance and dimensions must be non-zero.");
                    result = (z * 1000) / (rth * x * y);
                    break;
                default:
                    throw new Error("Unknown calculation target.");
            }

            if (!isNaN(result) && isFinite(result) && result >= 0) {
                elements[targetKey].value = result.toPrecision(4);
            } else {
                throw new Error("Calculation resulted in an invalid number.");
            }
        } catch (error) {
            elements.error.textContent = `Error: ${error.message}`;
            elements[targetKey].value = '';
        }
    }
})(); 
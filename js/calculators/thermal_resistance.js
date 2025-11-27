'use strict';

(function() {
    // DOM Element cache (populated on init)
    let elements = {};

    function getElements() {
        return {
            x: document.getElementById('thermal-x'),
            y: document.getElementById('thermal-y'),
            z: document.getElementById('thermal-z'),
            k: document.getElementById('thermal-k'),
            rth: document.getElementById('thermal-rth'),
            error: document.getElementById('thermal-error')
        };
    }

    function setupEventListeners() {
        const container = document.getElementById('thermal-resistance-calculator');
        if (!container) return;

        // Use event delegation on the container for all buttons
        container.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') return;
            
            // Find the input field in the same input-group as the clicked button
            const inputGroup = event.target.closest('.input-group');
            if (!inputGroup) return;
            
            const input = inputGroup.querySelector('input[type="number"]');
            if (!input) return;
            
            // Extract the target key from the input id (e.g., 'thermal-x' -> 'x')
            const targetKey = input.id.replace('thermal-', '');
            calculate(targetKey);
        });

        // Add Enter key support for inputs
        const inputs = container.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const targetKey = input.id.replace('thermal-', '');
                    calculate(targetKey);
                }
            });
        });
    }

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

    // --- Initialization ---
    function init() {
        elements = getElements();
        setupEventListeners();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Register with calculator registry
    if (window.calculatorRegistry) {
        window.calculatorRegistry.register(
            'thermal-resistance',
            'Thermal Resistance',
            'Calculates thermal resistance of a rectangular prism along the Z-direction',
            { calculate }
        );
    }
})(); 
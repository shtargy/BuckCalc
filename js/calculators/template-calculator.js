// Template Calculator - Copy this file to create a new calculator
// Make sure to name your file using consistent naming: your-calculator-name.js
// Remember to add <p id="YOUR_ID-error" class="error-message" aria-live="polite"></p> in your HTML

(function() {
'use strict';

// Define your calculator ID and name
const CALCULATOR_ID = 'template';
const CALCULATOR_NAME = 'Template Calculator';
const CALCULATOR_DESCRIPTION = 'Description of what this calculator does';

// Inline error display (matches the <p id="template-error"> element in HTML)
const errorEl = document.getElementById(`${CALCULATOR_ID}-error`);
const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };

// Function to calculate parameter A
function calculateA() {
    setError('');

    const b = utils.getValue(`${CALCULATOR_ID}-b`);
    const c = utils.getValue(`${CALCULATOR_ID}-c`);

    if (!utils.validateInputs([b, c], ['Parameter B', 'Parameter C'])) {
        setError('Enter values for B and C.');
        return;
    }

    const a = b + c; // Replace with actual formula
    utils.setValue(`${CALCULATOR_ID}-a`, a);
}

// Function to calculate parameter B
function calculateB() {
    setError('');

    const a = utils.getValue(`${CALCULATOR_ID}-a`);
    const c = utils.getValue(`${CALCULATOR_ID}-c`);

    if (!utils.validateInputs([a, c], ['Parameter A', 'Parameter C'])) {
        setError('Enter values for A and C.');
        return;
    }

    const b = a - c; // Replace with actual formula
    utils.setValue(`${CALCULATOR_ID}-b`, b);
}

// Function to calculate parameter C
function calculateC() {
    setError('');

    const a = utils.getValue(`${CALCULATOR_ID}-a`);
    const b = utils.getValue(`${CALCULATOR_ID}-b`);

    if (!utils.validateInputs([a, b], ['Parameter A', 'Parameter B'])) {
        setError('Enter values for A and B.');
        return;
    }

    const c = a - b; // Replace with actual formula
    utils.setValue(`${CALCULATOR_ID}-c`, c);
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        CALCULATOR_ID,
        CALCULATOR_NAME,
        CALCULATOR_DESCRIPTION,
        {
            calculateA: calculateA,
            calculateB: calculateB,
            calculateC: calculateC
        }
    );
}

// Make functions globally accessible
window.templateCalculateA = calculateA;
window.templateCalculateB = calculateB;
window.templateCalculateC = calculateC;

})();

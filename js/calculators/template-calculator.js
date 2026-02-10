// Template Calculator - Copy this file to create a new calculator
// Make sure to name your file using consistent naming: your-calculator-name.js

(function() {
'use strict';

// Define your calculator ID and name
const CALCULATOR_ID = 'template';
const CALCULATOR_NAME = 'Template Calculator';
const CALCULATOR_DESCRIPTION = 'Description of what this calculator does';

// Function to calculate parameter A
function calculateA() {
    // Get input values using utils
    const b = utils.getValue(`${CALCULATOR_ID}-b`);
    const c = utils.getValue(`${CALCULATOR_ID}-c`);

    // Validate inputs
    if (!utils.validateInputs(
        [b, c],
        ['Parameter B', 'Parameter C']
    )) {
        return;
    }

    // Perform calculation
    const a = b + c; // Replace with actual formula

    // Set result
    utils.setValue(`${CALCULATOR_ID}-a`, a);
}

// Function to calculate parameter B
function calculateB() {
    const a = utils.getValue(`${CALCULATOR_ID}-a`);
    const c = utils.getValue(`${CALCULATOR_ID}-c`);

    if (!utils.validateInputs(
        [a, c],
        ['Parameter A', 'Parameter C']
    )) {
        return;
    }

    const b = a - c; // Replace with actual formula
    utils.setValue(`${CALCULATOR_ID}-b`, b);
}

// Function to calculate parameter C
function calculateC() {
    const a = utils.getValue(`${CALCULATOR_ID}-a`);
    const b = utils.getValue(`${CALCULATOR_ID}-b`);

    if (!utils.validateInputs(
        [a, b],
        ['Parameter A', 'Parameter B']
    )) {
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

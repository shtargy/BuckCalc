# Calculator Architecture Documentation

This document describes the architecture of the BuckCalculator project, focusing on the modular design that supports easy extension with new calculators.

## Overview

The BuckCalculator project implements a set of calculators for electronics design, including Buck converters, Inverting Buck-Boost converters, and Resistor Dividers. The codebase follows a modular architecture designed for extensibility, making it straightforward to add new calculators.

Key components:
- **Utilities Module**: Common functions shared across calculators
- **Calculator Registry**: Central system for registering and managing calculators
- **Individual Calculator Modules**: Standalone calculator implementations

## Core Components

### Utilities Module (`utils.js`)

The utilities module provides common functions used across all calculators:

```javascript
// Core functions for value handling
getValue(id)              // Get numeric value from input field
setValue(id, value)       // Set formatted value to input field
validateInputs(fields, fieldNames) // Validate required inputs

// Unit conversions
mhzToHz(mhz)              // Convert MHz to Hz
hzToMhz(hz)               // Convert Hz to MHz
```

### Calculator Registry (`calculator-registry.js`)

The calculator registry manages all calculators in a central system:

```javascript
// Register a calculator with the registry
register(id, name, description, functions)

// Get a calculator by its ID
getCalculator(id)

// Get all registered calculators
getAllCalculators()

// Get default calculator
getDefaultCalculator()
```

### Main Application (`main.js`)

The main application handles initialization and UI interactions:

```javascript
// Initialize the application, sidebar, and default calculator
initApp()

// Select and display a calculator
selectCalculator(id)
```

## Adding a New Calculator

To add a new calculator, follow these steps:

### 1. Create a new JavaScript file

Create a new file in the `js/calculators/` directory with the calculator name (e.g., `boost.js`).

### 2. Implement calculator functions

Each calculator should implement specific calculate functions using the following pattern:

```javascript
// Example calculate function
function calculateParameter() {
    // Get values using utils module
    const param1 = utils.getValue('calculator-id-param1');
    const param2 = utils.getValue('calculator-id-param2');
    
    // Validate inputs
    if (!utils.validateInputs(
        [param1, param2], 
        ['Parameter 1 Name', 'Parameter 2 Name']
    )) {
        return;
    }
    
    // Perform calculations
    const result = /* calculation logic */;
    
    // Set output value
    utils.setValue('calculator-id-result', result);
}
```

### 3. Register with calculator registry

Each calculator should register itself with the registry:

```javascript
// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'calculator-id',         // Unique ID
        'Calculator Name',       // Display name
        'Calculator description', // Description
        {
            // Map of functions
            calculateParam1: calculateParam1,
            calculateParam2: calculateParam2,
            // Additional functions...
        }
    );
}

// Make functions globally accessible for backwards compatibility
window.calculateParam1 = calculateParam1;
window.calculateParam2 = calculateParam2;
// Additional functions...
```

### 4. Create HTML structure

Create HTML markup for the calculator in `index.html`:

```html
<!-- Calculator container -->
<div id="calculator-id" class="calculator">
    <h2>Calculator Name</h2>
    
    <!-- Parameter section -->
    <div class="parameter-section">
        <h3>Parameter Name</h3>
        <div class="input-group">
            <label for="calculator-id-param1">Parameter 1:</label>
            <input type="number" id="calculator-id-param1">
            <span class="unit">Unit</span>
            <button onclick="calculateParam1()">Calculate</button>
        </div>
        <!-- Additional parameters... -->
    </div>
    
    <!-- Additional sections... -->
</div>
```

### 5. Add sidebar menu item

Add a menu item in the sidebar section of `index.html`:

```html
<div class="sidebar-item" data-calculator="calculator-id">Calculator Name</div>
```

### 6. Include the script

Add a script tag for the new calculator in `index.html`:

```html
<script src="js/calculators/calculator-id.js"></script>
```

## Best Practices

1. **Use the utils module**: Always use `utils.getValue()` and `utils.setValue()` instead of direct DOM manipulation.
2. **Use proper validation**: Always validate inputs with `utils.validateInputs()`.
3. **Register with registry**: Always register new calculators with the calculator registry.
4. **Maintain backwards compatibility**: Expose calculator functions globally.
5. **Follow naming conventions**: Use consistent ID patterns (e.g., `calculator-id-param-name`).
6. **Organize related parameters**: Group related inputs in parameter sections.

## Example Calculator Module

Here's a complete example of a calculator module using the architecture:

```javascript
// Example Calculator Functions

// Calculate Parameter A
function calculateParamA() {
    const input1 = utils.getValue('example-input1');
    const input2 = utils.getValue('example-input2');
    
    // Validate inputs
    if (!utils.validateInputs(
        [input1, input2], 
        ['Input 1', 'Input 2']
    )) {
        return;
    }
    
    // Calculation logic
    const result = input1 * input2;
    
    // Set result
    utils.setValue('example-result-a', result);
}

// Calculate Parameter B
function calculateParamB() {
    const input1 = utils.getValue('example-input1');
    const input3 = utils.getValue('example-input3');
    
    // Validate inputs
    if (!utils.validateInputs(
        [input1, input3], 
        ['Input 1', 'Input 3']
    )) {
        return;
    }
    
    // Calculation logic
    const result = input1 / input3;
    
    // Set result
    utils.setValue('example-result-b', result);
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'example',               // ID
        'Example Calculator',    // Name
        'Example calculator description', // Description
        {
            calculateParamA: calculateParamA,
            calculateParamB: calculateParamB
        }
    );
}

// Make functions globally accessible for backwards compatibility
window.calculateParamA = calculateParamA;
window.calculateParamB = calculateParamB;
```

## Existing Calculators

The project currently includes these calculators:

1. **Buck Converter** (`buck.js`): DC-DC step-down converter calculator
2. **Inverting Buck-Boost** (`buck-boost.js`): Inverting DC-DC converter calculator
3. **Resistor Divider** (`divider.js`): Voltage divider and resistor pair calculator

You can reference these implementations as examples when creating new calculators. 




Notes here for updating the standard value algorithm:

wanted to refine the standard resistor values algorithm in the resistor divider calculator. 

To review, the idea is we have a resistor divider calculator that helps the user calculate all aspects of a resistor divider with two resistors. But in reality, resistors are availible only on discrete values. Common categories are 0.1%, 1%, and 5% resistor values which we have included.

I want to update the algoritm by which the calculator searches for best discrete standard values of resistors closest to the user calculated ideal values. 

details here:
- you can remove anything related to the E12 values those are only for 10% resistor values which we are not using
- to review we are offering 3 buttons for user to search and suggest best discrete standard resistor values closest to the ideal ratio and close to the resistor string current
- we use the E24 for the 5%
- we use the E96 for the 1%
- we use the E192 for the 0.1%
- these E values are base values and can be multiplied by orders of maginitude for larger and smaller values, so as part of the algorithm, we'll have to make sure we compute those as needed
- here's the idea for a good algorithm to find standard values:

-- be aware of the ideal resistor ratio from the earlier calculation; its calculated and reported to user as "Resistor Ratio:"
-- compute/find 5-10 standard discrete values above and below the "Top resistor" and "Bottom resistor" from the ideal calculation. Use the correct E series and make sure to apply orders of magnitude.
-- Now with the list of candadate standard resistors, search and save all pairs of "Top resistor" and "Bottom resistor" that have
--- better than 0.15% ratio error for the 0.1% button, 
--- better than 1.5% ratio error for the 1% button, 
--- better than 7.5% ratio error for the 5% button
-- Once we have all these candidates, we sort them two ways:
-- one way is sort by best ratio errors
-- second way is sort by best resistor string current error
-- user has the buttons to display top 10 of these results for either ratio or current 

review the code base, check all the code, figure out strategy, and ask me if any clarifications before making changes. Thanks




Wafer Die Cost

Fields:
- die size X
- die size Y
- scribe width
- wafer size (selection 150, 200, 300mm)
- wafer edge keepout (mm)
- wafer cost
- yield
- Rds(on).mm2
- gross die per wafer
- yielded die per wafer
- die cost
- cents/mm
- cents.mohm

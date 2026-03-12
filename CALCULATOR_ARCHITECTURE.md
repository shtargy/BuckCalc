# Calculator Architecture Documentation

This document describes the architecture of the BuckCalculator project, focusing on the modular design that supports easy extension with new calculators.

## Overview

The BuckCalculator project implements a set of calculators for electronics design (DC-DC converters, PCB, wafer, RLC, etc.). The codebase follows a modular architecture designed for extensibility, making it straightforward to add new calculators.

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
validateInputs(fields, fieldNames, silent=true) // Validate required inputs

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
// Error display helper (matches <p id="calculator-id-error"> in HTML)
const errorEl = document.getElementById('calculator-id-error');
const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };

// Example calculate function
function calculateParameter() {
    setError('');

    const param1 = utils.getValue('calculator-id-param1');
    const param2 = utils.getValue('calculator-id-param2');

    if (!utils.validateInputs(
        [param1, param2],
        ['Parameter 1 Name', 'Parameter 2 Name']
    )) {
        setError('Enter Parameter 1 and Parameter 2.');
        return;
    }

    const result = /* calculation logic */;
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
    <p class="error-message" id="calculator-id-error" aria-live="polite"></p>
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
3. **Use inline error display**: Show errors in a `<p id="...-error" class="error-message">` element using a `setError()` helper — never use `alert()`.
4. **Register with registry**: Always register new calculators with the calculator registry.
5. **Maintain backwards compatibility**: Expose calculator functions globally.
6. **Follow naming conventions**: Use consistent ID patterns (e.g., `calculator-id-param-name`).
7. **Organize related parameters**: Group related inputs in parameter sections.

## Example Calculator Module

See `js/calculators/template-calculator.js` for a complete, copy-ready starting point.

## Existing Calculators

The project currently includes these calculators:

1. **Buck Converter** (`buck.js`): DC-DC step-down converter calculator
2. **Boost Converter** (`boost.js`): DC-DC step-up converter calculator
3. **Inverting Buck-Boost** (`buck-boost.js`): Inverting DC-DC converter calculator
4. **Resistor Divider** (`divider.js`): Voltage divider with standard resistor pair finder
5. **Resistor Standard Values** (`res-std-values.js`): Nearest standard resistor value lookup
6. **PCB Calculator** (`pcb.js`): Copper trace and via resistance calculations
7. **Wafer Die Cost** (`wafer.js`): Semiconductor die cost estimation
8. **Thermal Resistance** (`thermal_resistance.js`): Thermal impedance calculations
9. **RLC Calculator** (`rlc.js`): RC/LC/reactance calculations
10. **Coupled Inductors** (`coupled_inductors.js`): Coupled inductor parameter calculations

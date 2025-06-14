// Wafer Die Cost Calculator
const CALCULATOR_ID = 'wafer';
const CALCULATOR_NAME = 'Wafer Die Cost Calculator';
const CALCULATOR_DESCRIPTION = 'Calculate wafer die costs and related metrics';

/**
 * Wafer Die Cost Calculator
 * 
 * Key Formulas:
 * 1. Gross Die Per Wafer (GDPW) = [π·(Wd/2-E)²/(Px·Py)] - [π·(Wd/2-E)/√(2·Px·Py)]
 *    Where:
 *    - Wd = Wafer diameter (mm)
 *    - E = Edge keepout (mm)
 *    - Px = Die size X + Saw street (mm)
 *    - Py = Die size Y + Saw street (mm)
 * 
 * 2. Yielded Dies = Gross Dies × (Yield %)
 * 
 * 3. Cost Per Die = Wafer Cost / Yielded Dies
 * 
 * 4. Cents/mm² = (Cost Per Die in cents) / (Die Area in mm²)
 * 
 * 5. Power FET cents·mΩ = (Rds(on) × mm²) × (Cents/mm²)
 */

// ----- Core Calculation Functions -----

/**
 * Calculate Gross Die Per Wafer using the GDPW equation
 */
function calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet) {
    // Convert saw street from µm to mm
    const sawStreetMm = sawStreet / 1000;
    
    // Calculate Px and Py (die size + saw street)
    const px = dieX + sawStreetMm;
    const py = dieY + sawStreetMm;
    
    // Validate input parameters
    if (waferSize <= 0 || edgeKeepout < 0 || px <= 0 || py <= 0) {
        console.warn('Invalid parameters for GDPW calculation');
        return 0;
    }
    
    // Check if edge keepout is larger than wafer radius
    if (edgeKeepout >= waferSize / 2) {
        console.warn('Edge keepout exceeds wafer radius');
        return 0;
    }
    
    // Calculate (Wd/2 - E) - the usable radius
    const usableRadius = (waferSize / 2) - edgeKeepout;
    
    // Calculate the first term: π · (Wd/2 - E)² / (Px · Py)
    const firstTerm = (Math.PI * Math.pow(usableRadius, 2)) / (px * py);
    
    // Calculate the second term: π · (Wd/2 - E) / √(2 · Px · Py)
    const secondTerm = (Math.PI * usableRadius) / Math.sqrt(2 * px * py);
    
    // GDPW = first term - second term
    const gdpw = firstTerm - secondTerm;
    
    // Return the rounded value (dies are whole numbers)
    return Math.max(0, Math.floor(gdpw));
}

// ----- Calculator UI Functions -----

/**
 * Gross Die Per Wafer calculation
 */
function calculateGrossDies() {
    const waferSizeSelect = document.getElementById('wafer-size');
    const waferSize = waferSizeSelect ? parseFloat(waferSizeSelect.value) : null;
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    const sawStreet = utils.getValue('wafer-saw-street');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    
    if (!utils.validateInputs(
        [waferSize, dieX, dieY, sawStreet, edgeKeepout],
        ['Wafer Size', 'Die Size X', 'Die Size Y', 'Saw Street', 'Edge Keepout'],
        true // Silent validation
    )) {
        utils.setValue('wafer-gross-dies', '');
        return;
    }
    
    const grossDies = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
    utils.setValue('wafer-gross-dies', grossDies);
}

/**
 * Yielded Die Per Wafer calculation
 */
function calculateYieldedDies() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const yieldVal = utils.getValue('wafer-yield');
    
    if (!utils.validateInputs([grossDies, yieldVal], ['Gross Dies', 'Yield'], true)) {
        utils.setValue('wafer-yielded-dies', '');
        return;
    }
    
    const yieldedDies = Math.floor(grossDies * (yieldVal / 100));
    utils.setValue('wafer-yielded-dies', yieldedDies);
}

/**
 * Yielded Cost Per Die calculation
 */
function calculateCostPerDie() {
    const waferCost = utils.getValue('wafer-cost');
    const yieldedDies = utils.getValue('wafer-yielded-dies');
    
    if (!utils.validateInputs([waferCost, yieldedDies], ['Wafer Cost', 'Yielded Dies'], true) || yieldedDies <= 0) {
        utils.setValue('wafer-cost-per-die', '');
        return;
    }
    
    const costPerDie = waferCost / yieldedDies;
    utils.setValue('wafer-cost-per-die', costPerDie.toFixed(4));
}

/**
 * Cents/mm² of Wafer calculation
 */
function calculateCentsPerMm() {
    const costPerDie = utils.getValue('wafer-cost-per-die');
    const dieArea = utils.getValue('wafer-die-area-output');
    
    if (!utils.validateInputs([costPerDie, dieArea], ['Cost Per Die', 'Die Area'], true) || dieArea <= 0) {
        utils.setValue('wafer-cents-per-mm', '');
        return;
    }
    
    const centsPerMm = (costPerDie * 100) / dieArea;
    utils.setValue('wafer-cents-per-mm', centsPerMm.toFixed(3));
}

/**
 * Power FET cents·mΩ calculation
 */
function calculatePowerFetCents() {
    const centsPerMm = utils.getValue('wafer-cents-per-mm');
    const rds = utils.getValue('wafer-rds');

    if (!utils.validateInputs([centsPerMm, rds], ['Cents/mm²', 'Rds(on) x mm²'], true)) {
        utils.setValue('wafer-power-fet-cents', '');
        return;
    }

    const powerFetCents = rds * centsPerMm;
    utils.setValue('wafer-power-fet-cents', powerFetCents.toFixed(3));
}

/**
 * Updates the new 'Die Area' display field in the Performance Metrics.
 */
function updateDieArea() {
    const dieAreaInput = utils.getValue('wafer-die-area');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    
    let areaToShow = null;
    
    if (dieAreaInput > 0) {
        areaToShow = dieAreaInput;
    } else if (dieX > 0 && dieY > 0) {
        areaToShow = dieX * dieY;
    }
    
    if (areaToShow !== null) {
        utils.setValue('wafer-die-area-output', areaToShow.toFixed(4));
    } else {
        utils.setValue('wafer-die-area-output', '');
    }
}

/**
 * Master function to run all performance metric calculations in order.
 */
function calculateAllPerformanceMetrics() {
    updateDieArea();
    calculateGrossDies();
    calculateYieldedDies();
    calculateCostPerDie();
    calculateCentsPerMm();
    calculatePowerFetCents();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default value for edge keepout
    const edgeKeepoutInput = document.getElementById('wafer-edge-keepout');
    if (edgeKeepoutInput) {
        edgeKeepoutInput.value = edgeKeepoutInput.value || '3';
    }

    // --- Event Listener Setup ---
    
    const generalInputs = [
        'wafer-saw-street', 'wafer-yield',
        'wafer-rds', 'wafer-size', 'wafer-edge-keepout', 'wafer-cost'
    ];

    generalInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllPerformanceMetrics);
        }
    });

    const dieAreaInput = document.getElementById('wafer-die-area');
    if (dieAreaInput) {
        dieAreaInput.addEventListener('input', () => {
            const area = utils.getValue('wafer-die-area');
            if (area > 0) {
                const side = Math.sqrt(area);
                utils.setValue('wafer-die-x', side, 4);
                utils.setValue('wafer-die-y', side, 4);
                calculateAllPerformanceMetrics();
            }
        });
    }

    const dieXInput = document.getElementById('wafer-die-x');
    if (dieXInput) {
        dieXInput.addEventListener('input', () => {
            utils.setValue('wafer-die-area', '', 0);
            calculateAllPerformanceMetrics();
        });
    }

    const dieYInput = document.getElementById('wafer-die-y');
    if (dieYInput) {
        dieYInput.addEventListener('input', () => {
            utils.setValue('wafer-die-area', '', 0);
            calculateAllPerformanceMetrics();
        });
    }
    
    // We don't run an initial calculation anymore to prevent alerts on page load.
    // The outputs will populate as the user enters data.
});

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        CALCULATOR_ID,
        CALCULATOR_NAME,
        CALCULATOR_DESCRIPTION,
        {
            calculateGrossDies,
            calculateYieldedDies,
            calculateCostPerDie,
            calculateCentsPerMm,
            calculatePowerFetCents
        }
    );
} 
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

// ----- Numerical Solvers -----

/**
 * Solver for wafer size given target GDPW
 */
function solveForWaferSize(targetGdpw, edgeKeepout, dieX, dieY, sawStreet) {
    // Convert saw street from µm to mm
    const sawStreetMm = sawStreet / 1000;
    
    // Initial guess for wafer size (start with a reasonable value)
    let waferSize = 200; // 200mm is a common wafer size
    
    // Parameters for numerical solver
    const maxIterations = 100;
    const tolerance = 0.01;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        // Calculate GDPW with current wafer size
        const calculatedGdpw = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        
        // Check if we're close enough to the target
        if (Math.abs(calculatedGdpw - targetGdpw) <= tolerance) {
            return waferSize;
        }
        
        // Try a slightly different wafer size to calculate derivative
        const delta = 0.1;
        const gdpwPlus = calculateGdpwEquation(waferSize + delta, edgeKeepout, dieX, dieY, sawStreet);
        
        // Calculate derivative: change in GDPW per change in wafer size
        const derivative = (gdpwPlus - calculatedGdpw) / delta;
        
        // Avoid division by zero
        if (Math.abs(derivative) < 1e-6) {
            break;
        }
        
        // Newton-Raphson step
        const step = (targetGdpw - calculatedGdpw) / derivative;
        waferSize += step;
        
        // Ensure wafer size stays positive and reasonable
        if (waferSize <= 0) {
            waferSize = 10; // Reset to a small positive value
        } else if (waferSize > 450) {
            waferSize = 450; // Cap at maximum reasonable wafer size
        }
        
        iteration++;
    }
    
    // If we didn't converge, return the best estimate we have
    return waferSize;
}

/**
 * Solver for edge keepout given target GDPW
 */
function solveForEdgeKeepout(targetGdpw, waferSize, dieX, dieY, sawStreet) {
    // Convert saw street from µm to mm
    const sawStreetMm = sawStreet / 1000;
    
    // Initial guess for edge keepout (start with a reasonable value)
    let edgeKeepout = 5; // 5mm is a common edge keepout
    
    // Parameters for numerical solver
    const maxIterations = 100;
    const tolerance = 0.01;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        // Calculate GDPW with current edge keepout
        const calculatedGdpw = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        
        // Check if we're close enough to the target
        if (Math.abs(calculatedGdpw - targetGdpw) <= tolerance) {
            return edgeKeepout;
        }
        
        // Try a slightly different edge keepout to calculate derivative
        const delta = 0.1;
        const gdpwPlus = calculateGdpwEquation(waferSize, edgeKeepout + delta, dieX, dieY, sawStreet);
        
        // Calculate derivative: change in GDPW per change in edge keepout
        const derivative = (gdpwPlus - calculatedGdpw) / delta;
        
        // Avoid division by zero
        if (Math.abs(derivative) < 1e-6) {
            break;
        }
        
        // Newton-Raphson step
        const step = (targetGdpw - calculatedGdpw) / derivative;
        // Note: for edge keepout, the relationship is inverse - when edge keepout increases, GDPW decreases
        edgeKeepout -= step;
        
        // Ensure edge keepout stays between reasonable bounds
        if (edgeKeepout < 0) {
            edgeKeepout = 0;
        }
        
        // Make sure edge keepout isn't larger than wafer radius
        if (edgeKeepout >= waferSize / 2) {
            edgeKeepout = (waferSize / 2) - 1;
        }
        
        iteration++;
    }
    
    // If we didn't converge, return the best estimate we have
    return edgeKeepout;
}

/**
 * Solver for die size X given target GDPW
 */
function solveForDieX(targetGdpw, waferSize, edgeKeepout, dieY, sawStreet, aspectRatio = 1) {
    // Convert saw street from µm to mm
    const sawStreetMm = sawStreet / 1000;
    
    // Initial guess for die size X based on die size Y and aspect ratio
    let dieX = dieY * aspectRatio;
    if (!dieY || dieY <= 0) {
        dieX = 5; // Initial guess if dieY is not available
    }
    
    // Parameters for numerical solver
    const maxIterations = 100;
    const tolerance = 0.01;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        // Calculate GDPW with current die size X
        const calculatedGdpw = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        
        // Check if we're close enough to the target
        if (Math.abs(calculatedGdpw - targetGdpw) <= tolerance) {
            return dieX;
        }
        
        // Try a slightly different die size X to calculate derivative
        const delta = 0.1;
        const gdpwPlus = calculateGdpwEquation(waferSize, edgeKeepout, dieX + delta, dieY, sawStreet);
        
        // Calculate derivative: change in GDPW per change in die size X
        const derivative = (gdpwPlus - calculatedGdpw) / delta;
        
        // Avoid division by zero
        if (Math.abs(derivative) < 1e-6) {
            break;
        }
        
        // Newton-Raphson step
        const step = (targetGdpw - calculatedGdpw) / derivative;
        // Note: when die size increases, GDPW decreases, so we use negative step
        dieX -= step;
        
        // Ensure die size stays positive and reasonable
        if (dieX <= 0) {
            dieX = 0.1; // Reset to a small positive value
        } else if (dieX > 50) {
            dieX = 50; // Cap at maximum reasonable die size
        }
        
        iteration++;
    }
    
    // If we didn't converge, return the best estimate we have
    return dieX;
}

/**
 * Solver for die size Y given target GDPW
 */
function solveForDieY(targetGdpw, waferSize, edgeKeepout, dieX, sawStreet, aspectRatio = 1) {
    // Convert saw street from µm to mm
    const sawStreetMm = sawStreet / 1000;
    
    // Initial guess for die size Y based on die size X and aspect ratio
    let dieY = dieX / aspectRatio;
    if (!dieX || dieX <= 0) {
        dieY = 5; // Initial guess if dieX is not available
    }
    
    // Parameters for numerical solver
    const maxIterations = 100;
    const tolerance = 0.01;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        // Calculate GDPW with current die size Y
        const calculatedGdpw = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        
        // Check if we're close enough to the target
        if (Math.abs(calculatedGdpw - targetGdpw) <= tolerance) {
            return dieY;
        }
        
        // Try a slightly different die size Y to calculate derivative
        const delta = 0.1;
        const gdpwPlus = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY + delta, sawStreet);
        
        // Calculate derivative: change in GDPW per change in die size Y
        const derivative = (gdpwPlus - calculatedGdpw) / delta;
        
        // Avoid division by zero
        if (Math.abs(derivative) < 1e-6) {
            break;
        }
        
        // Newton-Raphson step
        const step = (targetGdpw - calculatedGdpw) / derivative;
        // Note: when die size increases, GDPW decreases, so we use negative step
        dieY -= step;
        
        // Ensure die size stays positive and reasonable
        if (dieY <= 0) {
            dieY = 0.1; // Reset to a small positive value
        } else if (dieY > 50) {
            dieY = 50; // Cap at maximum reasonable die size
        }
        
        iteration++;
    }
    
    // If we didn't converge, return the best estimate we have
    return dieY;
}

/**
 * Solver for saw street given target GDPW
 */
function solveForSawStreet(targetGdpw, waferSize, edgeKeepout, dieX, dieY) {
    // Initial guess for saw street in µm
    let sawStreet = 100; // 100µm is a common saw street width
    
    // Parameters for numerical solver
    const maxIterations = 100;
    const tolerance = 0.01;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        // Calculate GDPW with current saw street
        const calculatedGdpw = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        
        // Check if we're close enough to the target
        if (Math.abs(calculatedGdpw - targetGdpw) <= tolerance) {
            return sawStreet;
        }
        
        // Try a slightly different saw street to calculate derivative
        const delta = 1;
        const gdpwPlus = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet + delta);
        
        // Calculate derivative: change in GDPW per change in saw street
        const derivative = (gdpwPlus - calculatedGdpw) / delta;
        
        // Avoid division by zero
        if (Math.abs(derivative) < 1e-6) {
            break;
        }
        
        // Newton-Raphson step
        const step = (targetGdpw - calculatedGdpw) / derivative;
        // Note: when saw street increases, GDPW decreases, so we use negative step
        sawStreet -= step;
        
        // Ensure saw street stays positive and within reasonable bounds
        if (sawStreet <= 0) {
            sawStreet = 1; // Minimum saw street width
        } else if (sawStreet > 500) {
            sawStreet = 500; // Maximum reasonable saw street width
        }
        
        iteration++;
    }
    
    // If we didn't converge, return the best estimate we have
    return sawStreet;
}

// ----- Calculator UI Functions -----

/**
 * Die Size X calculation
 */
function calculateDieX() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const waferSize = utils.getValue('wafer-size');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    const dieY = utils.getValue('wafer-die-y');
    const sawStreet = utils.getValue('wafer-saw-street');
    
    if (!utils.validateInputs(
        [grossDies, waferSize, edgeKeepout, dieY, sawStreet],
        ['Gross Dies', 'Wafer Size', 'Edge Keepout', 'Die Size Y', 'Saw Street']
    )) {
        return;
    }
    
    // Use the numerical solver to calculate die size X
    const dieX = solveForDieX(grossDies, waferSize, edgeKeepout, dieY, sawStreet);
    
    // Display with appropriate precision
    utils.setValue('wafer-die-x', dieX.toFixed(3));
    
    // Update related calculations
    const rds = utils.getValue('wafer-rds');
    if (!isNaN(rds) && rds > 0) {
        calculateRds();
    }
    
    // Update gross dies calculation to verify
    calculateGrossDies();
}

/**
 * Die Size Y calculation
 */
function calculateDieY() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const waferSize = utils.getValue('wafer-size');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    const dieX = utils.getValue('wafer-die-x');
    const sawStreet = utils.getValue('wafer-saw-street');
    
    if (!utils.validateInputs(
        [grossDies, waferSize, edgeKeepout, dieX, sawStreet],
        ['Gross Dies', 'Wafer Size', 'Edge Keepout', 'Die Size X', 'Saw Street']
    )) {
        return;
    }
    
    // Use the numerical solver to calculate die size Y
    const dieY = solveForDieY(grossDies, waferSize, edgeKeepout, dieX, sawStreet);
    
    // Display with appropriate precision
    utils.setValue('wafer-die-y', dieY.toFixed(3));
    
    // Update related calculations
    const rds = utils.getValue('wafer-rds');
    if (!isNaN(rds) && rds > 0) {
        calculateRds();
    }
    
    // Update gross dies calculation to verify
    calculateGrossDies();
}

/**
 * Saw Street calculation
 */
function calculateSawStreet() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const waferSize = utils.getValue('wafer-size');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    
    if (!utils.validateInputs(
        [grossDies, waferSize, edgeKeepout, dieX, dieY],
        ['Gross Dies', 'Wafer Size', 'Edge Keepout', 'Die Size X', 'Die Size Y']
    )) {
        return;
    }
    
    // Use the numerical solver to calculate saw street
    const sawStreet = solveForSawStreet(grossDies, waferSize, edgeKeepout, dieX, dieY);
    
    // Display with appropriate precision
    utils.setValue('wafer-saw-street', sawStreet.toFixed(1));
    
    // Update gross dies calculation to verify
    calculateGrossDies();
}

/**
 * Wafer Size calculation
 */
function calculateWaferSize() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    const sawStreet = utils.getValue('wafer-saw-street');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    
    if (!utils.validateInputs(
        [grossDies, dieX, dieY, sawStreet, edgeKeepout],
        ['Gross Dies', 'Die Size X', 'Die Size Y', 'Saw Street', 'Edge Keepout']
    )) {
        return;
    }
    
    // Use the numerical solver to calculate wafer size
    const waferSize = solveForWaferSize(grossDies, edgeKeepout, dieX, dieY, sawStreet);
    
    // Select the closest standard wafer size from the dropdown
    const waferSizeSelect = document.getElementById('wafer-size');
    if (waferSizeSelect) {
        // Find the closest standard wafer size
        const standardSizes = Array.from(waferSizeSelect.options).map(opt => parseFloat(opt.value));
        const closestSize = standardSizes.reduce((prev, curr) => 
            Math.abs(curr - waferSize) < Math.abs(prev - waferSize) ? curr : prev
        );
        
        // Set the dropdown to the closest standard size
        waferSizeSelect.value = closestSize.toString();
        
        // Show a message if the calculated size is significantly different
        if (Math.abs(waferSize - closestSize) > 10) {
            alert(`Calculated wafer size was ${waferSize.toFixed(1)}mm, but rounded to standard size ${closestSize}mm`);
        }
    }
    
    // Update gross dies calculation with the selected standard size
    calculateGrossDies();
}

/**
 * Edge Keepout calculation
 */
function calculateEdgeKeepout() {
    const waferSize = utils.getValue('wafer-size');
    const grossDies = utils.getValue('wafer-gross-dies');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    const sawStreet = utils.getValue('wafer-saw-street');
    
    if (!utils.validateInputs(
        [waferSize, grossDies, dieX, dieY, sawStreet],
        ['Wafer Size', 'Gross Dies', 'Die Size X', 'Die Size Y', 'Saw Street']
    )) {
        return;
    }
    
    // Use the numerical solver to calculate edge keepout
    const edgeKeepout = solveForEdgeKeepout(grossDies, waferSize, dieX, dieY, sawStreet);
    
    // Display with appropriate precision
    utils.setValue('wafer-edge-keepout', edgeKeepout.toFixed(1));
    
    // Update gross dies calculation to verify
    calculateGrossDies();
}

/**
 * Wafer Cost calculation
 */
function calculateWaferCost() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const yield = utils.getValue('wafer-yield');
    const costPerDie = utils.getValue('wafer-cost-per-die');
    
    if (!utils.validateInputs(
        [grossDies, yield, costPerDie],
        ['Gross Dies', 'Yield', 'Cost Per Die']
    )) {
        return;
    }
    
    // Calculate wafer cost = yielded dies * cost per die
    const yieldedDies = Math.floor(grossDies * (yield / 100));
    const waferCost = yieldedDies * costPerDie;
    
    // Display with appropriate precision
    utils.setValue('wafer-cost', waferCost.toFixed(2));
}

/**
 * Yield calculation
 */
function calculateYield() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const yieldedDies = utils.getValue('wafer-yielded-dies');
    
    if (!utils.validateInputs(
        [grossDies, yieldedDies],
        ['Gross Dies', 'Yielded Dies']
    )) {
        return;
    }
    
    // Ensure we don't divide by zero
    if (grossDies <= 0) {
        alert('Gross dies must be greater than zero to calculate yield.');
        return;
    }
    
    // Calculate yield percentage
    const yieldPercentage = (yieldedDies / grossDies) * 100;
    
    // Display with appropriate precision
    utils.setValue('wafer-yield', yieldPercentage.toFixed(1));
    
    // Update cost per die if wafer cost is set
    const waferCost = utils.getValue('wafer-cost');
    if (!isNaN(waferCost) && waferCost > 0) {
        calculateCostPerDie();
    }
}

/**
 * Rds(on) x mm² handling
 */
function calculateRds() {
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    
    if (!utils.validateInputs(
        [dieX, dieY],
        ['Die Size X', 'Die Size Y']
    )) {
        return;
    }
    
    // This is an input field for the user to specify the Rds(on) x area product
    // No calculation needed as this is a technology parameter input by the user
    
    // But we can update dependent calculations if Rds is already set
    const rds = utils.getValue('wafer-rds');
    if (!isNaN(rds) && rds > 0) {
        const costPerDie = utils.getValue('wafer-cost-per-die');
        if (!isNaN(costPerDie) && costPerDie > 0) {
            calculatePowerFetCents();
        }
    }
}

/**
 * Gross Die Per Wafer calculation
 */
function calculateGrossDies() {
    const waferSize = utils.getValue('wafer-size');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    const sawStreet = utils.getValue('wafer-saw-street');
    const edgeKeepout = utils.getValue('wafer-edge-keepout');
    
    if (!utils.validateInputs(
        [waferSize, dieX, dieY, sawStreet, edgeKeepout],
        ['Wafer Size', 'Die Size X', 'Die Size Y', 'Saw Street', 'Edge Keepout']
    )) {
        return;
    }
    
    // Use the GDPW equation to calculate gross dies
    const grossDies = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
    
    utils.setValue('wafer-gross-dies', grossDies);
    
    // Also update yielded dies if yield is set
    const yield = utils.getValue('wafer-yield');
    if (!isNaN(yield) && yield > 0) {
        calculateYieldedDies();
    }
}

/**
 * Yielded Die Per Wafer calculation
 */
function calculateYieldedDies() {
    const grossDies = utils.getValue('wafer-gross-dies');
    const yield = utils.getValue('wafer-yield');
    
    if (!utils.validateInputs(
        [grossDies, yield],
        ['Gross Dies', 'Yield']
    )) {
        return;
    }
    
    // Calculate yielded dies based on yield percentage
    const yieldedDies = Math.floor(grossDies * (yield / 100));
    
    utils.setValue('wafer-yielded-dies', yieldedDies);
    
    // Update cost per die if wafer cost is set
    const waferCost = utils.getValue('wafer-cost');
    if (!isNaN(waferCost) && waferCost > 0) {
        calculateCostPerDie();
    }
}

/**
 * Yielded Cost Per Die calculation
 */
function calculateCostPerDie() {
    const waferCost = utils.getValue('wafer-cost');
    const yieldedDies = utils.getValue('wafer-yielded-dies');
    
    if (!utils.validateInputs(
        [waferCost, yieldedDies],
        ['Wafer Cost', 'Yielded Dies']
    )) {
        return;
    }
    
    // Ensure we don't divide by zero
    if (yieldedDies <= 0) {
        alert('Yielded dies must be greater than zero to calculate cost per die.');
        return;
    }
    
    // Calculate cost per die
    const costPerDie = waferCost / yieldedDies;
    
    // Display with appropriate precision
    utils.setValue('wafer-cost-per-die', costPerDie.toFixed(4));
    
    // Update cents per mm² and power FET cents if die sizes are set
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    if (!isNaN(dieX) && !isNaN(dieY) && dieX > 0 && dieY > 0) {
        calculateCentsPerMm();
        
        const rds = utils.getValue('wafer-rds');
        if (!isNaN(rds) && rds > 0) {
            calculatePowerFetCents();
        }
    }
}

/**
 * Cents/mm² of Wafer calculation
 */
function calculateCentsPerMm() {
    const costPerDie = utils.getValue('wafer-cost-per-die');
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    
    if (!utils.validateInputs(
        [costPerDie, dieX, dieY],
        ['Cost Per Die', 'Die Size X', 'Die Size Y']
    )) {
        return;
    }
    
    // Calculate die area in mm²
    const dieArea = dieX * dieY;
    
    // Ensure we don't divide by zero
    if (dieArea <= 0) {
        alert('Die area must be greater than zero to calculate cents per mm².');
        return;
    }
    
    // Calculate cents per mm² (convert dollars to cents by multiplying by 100)
    const centsPerMm = (costPerDie * 100) / dieArea;
    
    // Display with appropriate precision
    utils.setValue('wafer-cents-per-mm', centsPerMm.toFixed(3));
}

/**
 * Power FET cents·mΩ calculation
 */
function calculatePowerFetCents() {
    const costPerDie = utils.getValue('wafer-cost-per-die');
    const rds = utils.getValue('wafer-rds');
    
    if (!utils.validateInputs(
        [costPerDie, rds],
        ['Cost Per Die', 'Rds(on) x mm²']
    )) {
        return;
    }
    
    // Ensure Rds is greater than zero
    if (rds <= 0) {
        alert('Rds(on) must be greater than zero to calculate Power FET cents·mΩ.');
        return;
    }
    
    const dieX = utils.getValue('wafer-die-x');
    const dieY = utils.getValue('wafer-die-y');
    
    if (!utils.validateInputs(
        [dieX, dieY],
        ['Die Size X', 'Die Size Y']
    )) {
        return;
    }
    
    // Calculate die area
    const dieArea = dieX * dieY;
    
    // Calculate cents per mm²
    const centsPerMm = (costPerDie * 100) / dieArea;
    
    // Calculate Power FET cents·mΩ = (Rds(on) x mm²) * (Cents/mm²)
    const powerFetCents = rds * centsPerMm;
    
    // Display with appropriate precision
    utils.setValue('wafer-power-fet-cents', powerFetCents.toFixed(3));
}

/**
 * New function to calculate Die X and Die Y from a given Die Area.
 * Assumes a square die. Populates the Die Size X and Die Size Y fields.
 */
window.calculateXYFromArea = function() {
    const dieArea = utils.getValue('wafer-die-area');

    if (dieArea <= 0) {
        alert('Please enter a positive value for Die XY Area.');
        return;
    }

    const side = Math.sqrt(dieArea);

    utils.setValue('wafer-die-x', side.toFixed(4));
    utils.setValue('wafer-die-y', side.toFixed(4));
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        CALCULATOR_ID,
        CALCULATOR_NAME,
        CALCULATOR_DESCRIPTION,
        {
            calculateDieX,
            calculateDieY,
            calculateSawStreet,
            calculateWaferSize,
            calculateEdgeKeepout,
            calculateWaferCost,
            calculateYield,
            calculateRds,
            calculateGrossDies,
            calculateYieldedDies,
            calculateCostPerDie,
            calculateCentsPerMm,
            calculatePowerFetCents
        }
    );
}

// Initialize default values when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default value for edge keepout
    const edgeKeepoutInput = document.getElementById('wafer-edge-keepout');
    if (edgeKeepoutInput) {
        edgeKeepoutInput.value = edgeKeepoutInput.value || '3';
    }
    
    // Add event listener to wafer size dropdown to recalculate when changed
    const waferSizeSelect = document.getElementById('wafer-size');
    if (waferSizeSelect) {
        waferSizeSelect.addEventListener('change', function() {
            // Recalculate gross dies when wafer size changes
            if (document.getElementById('wafer-die-x').value && 
                document.getElementById('wafer-die-y').value && 
                document.getElementById('wafer-saw-street').value &&
                document.getElementById('wafer-edge-keepout').value) {
                calculateGrossDies();
            }
        });
    }
    
    // Initialize calculations with the default wafer size
    setTimeout(function() {
        // Make sure all default values are ready before calculating
        if (waferSizeSelect && waferSizeSelect.value) {
            // Trigger some initial calculations if other fields have values
            if (document.getElementById('wafer-die-x').value && 
                document.getElementById('wafer-die-y').value && 
                document.getElementById('wafer-saw-street').value) {
                calculateGrossDies();
            }
        }
    }, 500); // Short delay to ensure the DOM is fully processed
});

// Override getValue specifically for wafer-size to handle the dropdown
const originalGetValue = utils.getValue;
utils.getValue = function(id) {
    if (id === 'wafer-size') {
        const waferSizeSelect = document.getElementById('wafer-size');
        return waferSizeSelect ? parseFloat(waferSizeSelect.value) : null;
    }
    return originalGetValue.call(utils, id);
};

// Make functions globally accessible
window.calculateDieX = calculateDieX;
window.calculateDieY = calculateDieY;
window.calculateSawStreet = calculateSawStreet;
window.calculateWaferSize = calculateWaferSize;
window.calculateEdgeKeepout = calculateEdgeKeepout;
window.calculateWaferCost = calculateWaferCost;
window.calculateYield = calculateYield;
window.calculateRds = calculateRds;
window.calculateGrossDies = calculateGrossDies;
window.calculateYieldedDies = calculateYieldedDies;
window.calculateCostPerDie = calculateCostPerDie;
window.calculateCentsPerMm = calculateCentsPerMm;
window.calculatePowerFetCents = calculatePowerFetCents; 
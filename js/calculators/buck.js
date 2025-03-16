// Buck Converter Calculator Functions

// Helper function to get numeric value from an input field
function getValue(id) {
    const value = document.getElementById(id).value;
    return value === '' ? null : parseFloat(value);
}

// Helper function to set a formatted value to an input field
function setValue(id, value) {
    document.getElementById(id).value = parseFloat(value).toFixed(2);
}

// Calculate duty cycle
function calculateDutyCycle() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    if (vin && vout) {
        return (vout + vdsl) / (vin - vdsh);
    }
    return null;
}

// Calculate Vin
function calculateVin() {
    const vout = utils.getValue('buck-vout');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    const ilpp = utils.getValue('buck-ilpp');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, ilpp, l, fsw], 
        ['Output Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    // Using inductor ripple equation
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    const d = 1 - ((ilpp * fswHz * lH) / vout);
    
    // Using duty cycle equation to find Vin
    const vin = (vout + vdsl) / d + vdsh;
    utils.setValue('buck-vin', vin);
}

// Calculate Vout
function calculateVout() {
    const vin = utils.getValue('buck-vin');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    const ilpp = utils.getValue('buck-ilpp');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, ilpp, l, fsw], 
        ['Input Voltage', 'Current Ripple', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    
    // Iterative solution since Vout appears in both equations
    let vout = vin / 2; // Initial guess
    for (let i = 0; i < 10; i++) { // Few iterations for convergence
        const d = (vout + vdsl) / (vin - vdsh);
        const vout_new = (ilpp * fswHz * lH) / (1 - d);
        if (Math.abs(vout - vout_new) < 0.001) {
            utils.setValue('buck-vout', vout_new);
            return;
        }
        vout = vout_new;
    }
    utils.setValue('buck-vout', vout);
}

// Calculate inductance
function calculateL() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const fsw = utils.getValue('buck-fsw');
    const ilpp = utils.getValue('buck-ilpp');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, fsw, ilpp], 
        ['Input Voltage', 'Output Voltage', 'Switching Frequency', 'Current Ripple']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const fswHz = utils.mhzToHz(fsw);
    
    // L = (Vout * (1-D)) / (fsw * ΔiL)
    const lH = (vout * (1 - d)) / (fswHz * ilpp);
    const luH = lH * 1000000;  // Convert H to µH
    utils.setValue('buck-inductance', luH);
}

// Calculate switching frequency
function calculateFsw() {
    const vin = utils.getValue('buck-vin');
    const vout = utils.getValue('buck-vout');
    const l = utils.getValue('buck-inductance');
    const ilpp = utils.getValue('buck-ilpp');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vin, vout, l, ilpp], 
        ['Input Voltage', 'Output Voltage', 'Inductance', 'Current Ripple']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const lH = l / 1000000;
    
    // fsw = (Vout * (1-D)) / (L * ΔiL)
    const fswHz = (vout * (1 - d)) / (lH * ilpp);
    const fswMHz = utils.hzToMhz(fswHz);
    utils.setValue('buck-fsw', fswMHz);
}

// Calculate inductor current ripple
function calculateIlpp() {
    const vout = utils.getValue('buck-vout');
    const vin = utils.getValue('buck-vin');
    const l = utils.getValue('buck-inductance');
    const fsw = utils.getValue('buck-fsw');
    const vdsh = utils.getValue('buck-vdsh') || 0;
    const vdsl = utils.getValue('buck-vdsl') || 0;
    
    // Validate inputs
    if (!utils.validateInputs(
        [vout, vin, l, fsw], 
        ['Output Voltage', 'Input Voltage', 'Inductance', 'Switching Frequency']
    )) {
        return;
    }
    
    const d = (vout + vdsl) / (vin - vdsh);
    const fswHz = utils.mhzToHz(fsw);
    const lH = l / 1000000;
    
    const ilpp = (vout * (1 - d)) / (fswHz * lH);
    utils.setValue('buck-ilpp', ilpp);
}

// Register calculator with registry
if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'buck',              // ID
        'Buck Converter',    // Name
        'DC-DC step-down converter calculator', // Description
        {
            calculateVin: calculateVin,
            calculateVout: calculateVout,
            calculateL: calculateL,
            calculateFsw: calculateFsw,
            calculateIlpp: calculateIlpp,
            calculateDutyCycle: calculateDutyCycle
        }
    );
}

// Make functions globally accessible for backwards compatibility
window.calculateVin = calculateVin;
window.calculateVout = calculateVout;
window.calculateL = calculateL;
window.calculateFsw = calculateFsw;
window.calculateIlpp = calculateIlpp;
window.calculateDutyCycle = calculateDutyCycle; 
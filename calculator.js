// Helper function to get input value
function getValue(id) {
    const value = document.getElementById(id).value;
    return value === '' ? null : parseFloat(value);
}

// Helper function to set input value
function setValue(id, value) {
    document.getElementById(id).value = value ? value.toFixed(3) : '';
}

// Calculate duty cycle
function calculateDutyCycle() {
    const vin = getValue('vin');
    const vout = getValue('vout');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    
    if (vin && vout) {
        return (vout + vdsl) / (vin - vdsh);
    }
    return null;
}

// Calculate Vin
function calculateVin() {
    const vout = getValue('vout');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    const ilpp = getValue('ilpp');
    const l = getValue('inductance');
    const fsw = getValue('fsw');
    
    if (vout && ilpp && l && fsw) {
        // Using inductor ripple equation
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        const d = 1 - ((ilpp * fswHz * lH) / vout);
        
        // Using duty cycle equation to find Vin
        const vin = (vout + vdsl) / d + vdsh;
        setValue('vin', vin);
    } else {
        alert('Need Vout, iL(p-p), L, and Fsw to calculate Vin');
    }
}

// Calculate Vout
function calculateVout() {
    const vin = getValue('vin');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    const ilpp = getValue('ilpp');
    const l = getValue('inductance');
    const fsw = getValue('fsw');
    
    if (vin && ilpp && l && fsw) {
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        
        // Iterative solution since Vout appears in both equations
        let vout = vin / 2; // Initial guess
        for (let i = 0; i < 10; i++) { // Few iterations for convergence
            const d = (vout + vdsl) / (vin - vdsh);
            const vout_new = (ilpp * fswHz * lH) / (1 - d);
            if (Math.abs(vout - vout_new) < 0.001) {
                setValue('vout', vout_new);
                return;
            }
            vout = vout_new;
        }
        setValue('vout', vout);
    } else {
        alert('Need Vin, iL(p-p), L, and Fsw to calculate Vout');
    }
}

// Calculate inductance
function calculateL() {
    const vin = getValue('vin');
    const vout = getValue('vout');
    const fsw = getValue('fsw');
    const ilpp = getValue('ilpp');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    
    if (vin && vout && fsw && ilpp) {
        const d = (vout + vdsl) / (vin - vdsh);
        const fswHz = fsw * 1000000;  // Convert MHz to Hz
        
        // L = (Vout * (1-D)) / (fsw * ΔiL)
        const lH = (vout * (1 - d)) / (fswHz * ilpp);
        const luH = lH * 1000000;  // Convert H to µH
        setValue('inductance', luH);
    } else {
        alert('Need Vin, Vout, Fsw, and iL(p-p) to calculate L');
    }
}

// Calculate switching frequency
function calculateFsw() {
    const vin = getValue('vin');
    const vout = getValue('vout');
    const l = getValue('inductance');
    const ilpp = getValue('ilpp');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    
    if (vin && vout && l && ilpp) {
        const d = (vout + vdsl) / (vin - vdsh);
        const lH = l / 1000000;
        
        // fsw = (Vout * (1-D)) / (L * ΔiL)
        const fswHz = (vout * (1 - d)) / (lH * ilpp);
        const fswMHz = fswHz / 1000000;
        setValue('fsw', fswMHz);
    } else {
        alert('Need Vin, Vout, L, and iL(p-p) to calculate Fsw');
    }
}

// Calculate inductor current ripple
function calculateIlpp() {
    const vout = getValue('vout');
    const vin = getValue('vin');
    const l = getValue('inductance');
    const fsw = getValue('fsw');
    const vdsh = getValue('vdsh') || 0;
    const vdsl = getValue('vdsl') || 0;
    
    if (vout && vin && l && fsw) {
        const d = (vout + vdsl) / (vin - vdsh);
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        
        const ilpp = (vout * (1 - d)) / (fswHz * lH);
        setValue('ilpp', ilpp);
    } else {
        alert('Need Vin, Vout, L, and Fsw to calculate iL(p-p)');
    }
}
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

// Inverting Buck-Boost Calculator Functions

// Helper function to validate positive numbers
function validatePositive(value, name) {
    if (value <= 0) {
        alert(`${name} must be positive`);
        return false;
    }
    return true;
}

// Calculate IL(avg) for Inverting Buck-Boost
function ibb_calculateILavg() {
    const vin = getValue('ibb_vin');
    const vout = getValue('ibb_vout');
    const iout = getValue('ibb_iout');
    
    if (vin && vout && iout) {
        if (!validatePositive(vin, 'Input voltage') || !validatePositive(vout, 'Output voltage')) {
            return;
        }
        const ilavg = iout * (vin + vout) / vin;
        setValue('ibb_ilavg', ilavg);
    } else {
        alert('Need Vin, |Vout|, and Iout to calculate IL(avg)');
    }
}

// Calculate Output Current for Inverting Buck-Boost
function ibb_calculateIout() {
    const vin = getValue('ibb_vin');
    const vout = getValue('ibb_vout');
    const ilavg = getValue('ibb_ilavg');
    
    if (vin && vout && ilavg) {
        if (!validatePositive(vin, 'Input voltage') || !validatePositive(vout, 'Output voltage')) {
            return;
        }
        const iout = ilavg * vin / (vin + vout);
        setValue('ibb_iout', iout);
    } else {
        alert('Need Vin, |Vout|, and IL(avg) to calculate Iout');
    }
}

// Calculate Input Voltage for Inverting Buck-Boost
function ibb_calculateVin() {
    const vout = getValue('ibb_vout');
    const ilavg = getValue('ibb_ilavg');
    const iout = getValue('ibb_iout');
    const ilpp = getValue('ibb_ilpp');
    const l = getValue('ibb_inductance');
    const fsw = getValue('ibb_fsw');
    
    if (vout && ilavg && iout && ilpp && l && fsw) {
        if (!validatePositive(vout, 'Output voltage') || 
            !validatePositive(l, 'Inductance') || 
            !validatePositive(fsw, 'Switching frequency')) {
            return;
        }
        
        // Initial guess for Vin
        let vin = vout;
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        
        // Newton-Raphson iteration
        for (let i = 0; i < 10; i++) {
            const f1 = ilavg - iout * (vin + vout) / vin;
            const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
            
            // If both equations are satisfied within tolerance
            if (Math.abs(f1) < 0.001 && Math.abs(f2) < 0.001) {
                setValue('ibb_vin', vin);
                return;
            }
            
            // Update Vin
            const df1 = -iout * vout / (vin * vin);
            const df2 = -(1 / (fswHz * lH)) * (vout * vout) / ((vin + vout) * (vin + vout));
            vin = vin - (f1 + f2) / (df1 + df2);
            
            if (vin <= 0) vin = vout; // Reset if iteration goes negative
        }
        alert('Could not converge to a solution. Please check input values.');
    } else {
        alert('Need |Vout|, IL(avg), Iout, ΔIL, L, and Fsw to calculate Vin');
    }
}

// Calculate Output Voltage for Inverting Buck-Boost
function ibb_calculateVout() {
    const vin = getValue('ibb_vin');
    const ilavg = getValue('ibb_ilavg');
    const iout = getValue('ibb_iout');
    const ilpp = getValue('ibb_ilpp');
    const l = getValue('ibb_inductance');
    const fsw = getValue('ibb_fsw');
    
    if (vin && ilavg && iout && ilpp && l && fsw) {
        if (!validatePositive(vin, 'Input voltage') || 
            !validatePositive(l, 'Inductance') || 
            !validatePositive(fsw, 'Switching frequency')) {
            return;
        }
        
        // Initial guess for Vout
        let vout = vin;
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        
        // Newton-Raphson iteration
        for (let i = 0; i < 10; i++) {
            const f1 = ilavg - iout * (vin + vout) / vin;
            const f2 = ilpp - (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
            
            // If both equations are satisfied within tolerance
            if (Math.abs(f1) < 0.001 && Math.abs(f2) < 0.001) {
                setValue('ibb_vout', vout);
                return;
            }
            
            // Update Vout
            const df1 = -iout / vin;
            const df2 = -(1 / (fswHz * lH)) * vin * vin / ((vin + vout) * (vin + vout));
            vout = vout - (f1 + f2) / (df1 + df2);
            
            if (vout <= 0) vout = vin; // Reset if iteration goes negative
        }
        alert('Could not converge to a solution. Please check input values.');
    } else {
        alert('Need Vin, IL(avg), Iout, ΔIL, L, and Fsw to calculate |Vout|');
    }
}

// Calculate Inductance for Inverting Buck-Boost
function ibb_calculateL() {
    const vin = getValue('ibb_vin');
    const vout = getValue('ibb_vout');
    const ilpp = getValue('ibb_ilpp');
    const fsw = getValue('ibb_fsw');
    
    if (vin && vout && ilpp && fsw) {
        if (!validatePositive(vin, 'Input voltage') || 
            !validatePositive(vout, 'Output voltage') || 
            !validatePositive(fsw, 'Switching frequency')) {
            return;
        }
        
        const fswHz = fsw * 1000000;
        const lH = (vin * vout) / (fswHz * ilpp * (vin + vout));
        const luH = lH * 1000000;
        setValue('ibb_inductance', luH);
    } else {
        alert('Need Vin, |Vout|, ΔIL, and Fsw to calculate L');
    }
}

// Calculate Switching Frequency for Inverting Buck-Boost
function ibb_calculateFsw() {
    const vin = getValue('ibb_vin');
    const vout = getValue('ibb_vout');
    const ilpp = getValue('ibb_ilpp');
    const l = getValue('ibb_inductance');
    
    if (vin && vout && ilpp && l) {
        if (!validatePositive(vin, 'Input voltage') || 
            !validatePositive(vout, 'Output voltage') || 
            !validatePositive(l, 'Inductance')) {
            return;
        }
        
        const lH = l / 1000000;
        const fswHz = (vin * vout) / (lH * ilpp * (vin + vout));
        const fswMHz = fswHz / 1000000;
        setValue('ibb_fsw', fswMHz);
    } else {
        alert('Need Vin, |Vout|, ΔIL, and L to calculate Fsw');
    }
}

// Calculate Inductor Current Ripple for Inverting Buck-Boost
function ibb_calculateDeltaIL() {
    const vin = getValue('ibb_vin');
    const vout = getValue('ibb_vout');
    const l = getValue('ibb_inductance');
    const fsw = getValue('ibb_fsw');
    
    if (vin && vout && l && fsw) {
        if (!validatePositive(vin, 'Input voltage') || 
            !validatePositive(vout, 'Output voltage') || 
            !validatePositive(l, 'Inductance') || 
            !validatePositive(fsw, 'Switching frequency')) {
            return;
        }
        
        const fswHz = fsw * 1000000;
        const lH = l / 1000000;
        const ilpp = (1 / (fswHz * lH)) * vin * (vout / (vin + vout));
        setValue('ibb_ilpp', ilpp);
    } else {
        alert('Need Vin, |Vout|, L, and Fsw to calculate ΔIL');
    }
}
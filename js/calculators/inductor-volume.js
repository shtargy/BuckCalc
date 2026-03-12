'use strict';

/**
 * Inductor Volume Estimator
 *
 * Estimates inductor physical size for buck converters using empirical
 * energy-volume and DCR scaling laws derived from Coilcraft XGL families.
 *
 * Energy-Volume Law:  L × Isat² ≈ k₁ × Volume
 * DCR Scaling Law:    DCR ≈ k₂ × L^0.8 / Volume^(2/3)
 *
 * Loss model uses canonical physics equations (per TI SLVA477 / Richtek AN005)
 * with FET parameters auto-estimated from the operating point (Vin, Iout).
 */

(function() {

const K2 = 100;  // DCR scaling constant (mΩ, µH, mm³)

function calculateDutyCycle(vin, vout) {
    return vout / vin;
}

function calculateRequiredL(vout, D, fswHz, rippleRatio, iload) {
    return vout * (1 - D) / (fswHz * rippleRatio * iload) * utils.constants.MICRO;
}

function calculatePeakCurrent(iload, rippleRatio) {
    return iload * (1 + rippleRatio / 2);
}

function calculateVolume(L_uH, Isat_A, k1) {
    return L_uH * Isat_A * Isat_A / k1;
}

function calculateDCR(L_uH, Vol_mm3) {
    return K2 * Math.pow(L_uH, 0.8) / Math.pow(Vol_mm3, 2 / 3);
}

function calculateAll() {
    const vin = utils.getValue('indvol-vin');
    const vout = utils.getValue('indvol-vout');
    const iload = utils.getValue('indvol-iload');
    const fsw = utils.getValue('indvol-fsw');
    const ripplePct = utils.getValue('indvol-ripple');
    const k1 = utils.getValue('indvol-k1');

    const errorEl = document.getElementById('inductor-volume-error');
    const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };
    const outputIds = [
        'indvol-duty', 'indvol-l', 'indvol-dil',
        'indvol-ipk', 'indvol-vol', 'indvol-dcr',
        'indvol-dcr-pct', 'indvol-fet-pct', 'indvol-sw-pct', 'indvol-eff',
        'indvol-dim-x', 'indvol-dim-y', 'indvol-dim-z'
    ];
    const clearOutputs = () => {
        outputIds.forEach(id => utils.setValue(id, '', 2));
    };

    setError('');

    const coreInputs = [vin, vout, iload, fsw, ripplePct, k1];
    const coreNames = ['Vin', 'Vout', 'Iload', 'Fsw', 'Ripple', 'k₁'];

    if (!utils.validateInputs(coreInputs, coreNames, true)) {
        clearOutputs();
        setError('Enter all input values to calculate.');
        return;
    }

    if (vin <= 0 || vout <= 0 || iload <= 0 || fsw <= 0) {
        clearOutputs();
        setError('Vin, Vout, Iload, and Fsw must be positive.');
        return;
    }

    if (vin <= vout) {
        clearOutputs();
        setError('Vin must be greater than Vout for buck topology.');
        return;
    }

    if (ripplePct <= 0) {
        clearOutputs();
        setError('Ripple ratio must be > 0.');
        return;
    }

    if (k1 <= 0) {
        clearOutputs();
        setError('Energy constant k₁ must be positive.');
        return;
    }

    const D = calculateDutyCycle(vin, vout);
    const rippleRatio = ripplePct / 100;
    const fswHz = utils.mhzToHz(fsw);
    const L = calculateRequiredL(vout, D, fswHz, rippleRatio, iload);
    const dIL = rippleRatio * iload;
    const Ipk = calculatePeakCurrent(iload, rippleRatio);
    const vol = calculateVolume(L, Ipk, k1);
    const dcr = calculateDCR(L, vol);

    // Auto-estimate FET parameters from operating point
    // At low Vin (FIVR/FinFET), all parameters shrink; at Vin≥12V, matches discrete/integrated
    const rdson = 25 * Math.sqrt(vin) / Math.pow(iload, 1.2);          // mΩ
    const t_sw = 0.5 + vin / 1.6;                                      // ns
    const coss = 100 * Math.sqrt(iload * vin / 12);                    // pF
    const qg = 3 * Math.sqrt(iload * vin / 12);                        // nC
    const VDR = Math.min(5, Math.max(1, vin * 0.5));                   // V (gate drive)
    const TDT = Math.min(20, Math.max(1, vin * 1.2));                  // ns (dead time)
    const VF = Math.min(0.7, 0.2 + vin * 0.035);                      // V (body diode)

    // Loss calculations (all mW)
    const dcrLoss = iload * iload * dcr;
    const fetLoss = iload * iload * rdson;
    const overlapLoss = 0.5 * vin * iload * t_sw * fsw;
    const cossLoss = 0.5e-3 * coss * vin * vin * fsw;
    const gateLoss = qg * VDR * fsw;
    const deadtimeLoss = 2 * iload * VF * TDT * fsw;
    const switchingLoss = overlapLoss + cossLoss + gateLoss + deadtimeLoss;
    const totalLoss = dcrLoss + fetLoss + switchingLoss;

    // Percentages (of Pin)
    const pout_mW = vout * iload * 1000;
    const pin_mW = pout_mW + totalLoss;
    const dcrPct = dcrLoss / pin_mW * 100;
    const fetPct = fetLoss / pin_mW * 100;
    const swPct = switchingLoss / pin_mW * 100;
    const efficiency = pout_mW / pin_mW * 100;

    utils.setValue('indvol-duty', D * 100, 2);
    utils.setValue('indvol-l', L, 3);
    utils.setValue('indvol-dil', dIL, 2);
    utils.setValue('indvol-ipk', Ipk, 2);
    utils.setValue('indvol-vol', vol, 1);
    utils.setValue('indvol-dcr', dcr, 1);
    utils.setValue('indvol-dcr-pct', dcrPct, 1);
    utils.setValue('indvol-fet-pct', fetPct, 1);
    utils.setValue('indvol-sw-pct', swPct, 1);
    utils.setValue('indvol-eff', efficiency, 1);

    setDimensionsFromVolume(vol);
}

// --- Package dimension solver ---
// Default aspect: square footprint, half-height (typical molded inductor)
const DIM_RATIO_Y = 1.0;   // Y/X
const DIM_RATIO_Z = 0.5;   // Z/X

let solveForAxis = 'z';

function setSolveFor(axis) {
    solveForAxis = axis;
    ['x', 'y', 'z'].forEach(d => {
        const el = document.getElementById('indvol-dim-' + d);
        if (el) el.readOnly = (d === axis);
        const btn = document.getElementById('indvol-solve-' + d);
        if (btn) btn.classList.toggle('active', d === axis);
    });
    recalcSolvedDim();
}

function setDimensionsFromVolume(vol) {
    // Set all three from default aspect ratio, then let solve-for override
    const x = Math.pow(vol / (DIM_RATIO_Y * DIM_RATIO_Z), 1 / 3);
    utils.setValue('indvol-dim-x', x, 2);
    utils.setValue('indvol-dim-y', x * DIM_RATIO_Y, 2);
    utils.setValue('indvol-dim-z', x * DIM_RATIO_Z, 2);
}

function recalcSolvedDim() {
    const vol = utils.getValue('indvol-vol');
    if (vol === null || vol <= 0) return;

    const x = utils.getValue('indvol-dim-x');
    const y = utils.getValue('indvol-dim-y');
    const z = utils.getValue('indvol-dim-z');

    if (solveForAxis === 'z' && x > 0 && y > 0) {
        utils.setValue('indvol-dim-z', vol / (x * y), 2);
    } else if (solveForAxis === 'y' && x > 0 && z > 0) {
        utils.setValue('indvol-dim-y', vol / (x * z), 2);
    } else if (solveForAxis === 'x' && y > 0 && z > 0) {
        utils.setValue('indvol-dim-x', vol / (y * z), 2);
    }
}

function setupEventListeners() {
    const inputIds = [
        'indvol-vin', 'indvol-vout', 'indvol-iload',
        'indvol-fsw', 'indvol-ripple', 'indvol-k1'
    ];

    inputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAll);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') calculateAll();
            });
        }
    });

    ['indvol-dim-x', 'indvol-dim-y', 'indvol-dim-z'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', recalcSolvedDim);
        }
    });

    ['x', 'y', 'z'].forEach(axis => {
        const btn = document.getElementById('indvol-solve-' + axis);
        if (btn) btn.addEventListener('click', () => setSolveFor(axis));
    });
}

function init() {
    setupEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

if (window.calculatorRegistry) {
    window.calculatorRegistry.register(
        'inductor-volume',
        'Inductor Volume',
        'Inductor volume estimator for buck converters',
        { calculateAll }
    );
}

})();

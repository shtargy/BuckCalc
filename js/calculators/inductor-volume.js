'use strict';

/**
 * Inductor Volume Estimator — Dual-Column Comparison
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
const DIM_RATIO_Y = 1.0;   // Y/X (square footprint)
const DIM_RATIO_Z = 0.5;   // Z/X (half-height)

const solveForAxis = { a: 'z', b: 'z' };

// --- Column HTML template ---

function createColumnHTML(prefix, label) {
    const id = (field) => `indvol-${prefix}-${field}`;
    return `
    <div class="indvol-column">
        <div class="calculator-section">
            <h3>${label}</h3>
            <div class="input-group">
                <label for="${id('vin')}">Input Voltage:</label>
                <input type="number" id="${id('vin')}" step="0.1">
                <span class="unit">V</span>
            </div>
            <div class="input-group">
                <label for="${id('vout')}">Output Voltage:</label>
                <input type="number" id="${id('vout')}" step="0.1">
                <span class="unit">V</span>
            </div>
            <div class="input-group">
                <label for="${id('iload')}">Load Current:</label>
                <input type="number" id="${id('iload')}" step="0.1">
                <span class="unit">A</span>
            </div>
            <div class="input-group">
                <label for="${id('fsw')}">Switching Freq:</label>
                <input type="number" id="${id('fsw')}" step="0.001">
                <span class="unit">MHz</span>
            </div>
            <div class="input-group">
                <label for="${id('ripple')}">Max Ripple:</label>
                <input type="number" id="${id('ripple')}" step="1" value="30">
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('levels')}">Levels (N):</label>
                <input type="number" id="${id('levels')}" step="1" min="2" max="7" value="2">
                <span class="unit"></span>
            </div>
            <div class="input-group">
                <label for="${id('k1')}">Energy Const (k₁):</label>
                <input type="number" id="${id('k1')}" step="0.01" value="1.1">
                <span class="unit">µH·A²/mm³</span>
            </div>
        </div>

        <div class="calculator-section">
            <h3>Results</h3>
            <div class="input-group">
                <label for="${id('duty')}">Duty Cycle:</label>
                <input type="number" id="${id('duty')}" readonly>
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('l')}">Inductance (L):</label>
                <input type="number" id="${id('l')}" readonly>
                <span class="unit">µH</span>
            </div>
            <div class="input-group">
                <label for="${id('dil')}">Ripple (ΔiL):</label>
                <input type="number" id="${id('dil')}" readonly>
                <span class="unit">A</span>
            </div>
            <div class="input-group">
                <label for="${id('ipk')}">Peak (Ipk):</label>
                <input type="number" id="${id('ipk')}" readonly>
                <span class="unit">A</span>
            </div>
            <div class="input-group">
                <label for="${id('dcr')}">Estimated DCR:</label>
                <input type="number" id="${id('dcr')}" readonly>
                <span class="unit">mΩ</span>
            </div>
            <div class="input-group">
                <label for="${id('cout')}">Est. Output Cap:</label>
                <input type="number" id="${id('cout')}" readonly>
                <span class="unit">µF</span>
            </div>
            <div class="input-group">
                <label for="${id('cin')}">Est. Input Cap:</label>
                <input type="number" id="${id('cin')}" readonly>
                <span class="unit">µF</span>
            </div>
            <div class="input-group">
                <label for="${id('fcap')}">Flying Cap:</label>
                <input type="text" id="${id('fcap')}" readonly value="—">
                <span class="unit">µF</span>
            </div>
            <div class="input-group">
                <label for="${id('dcr-pct')}">Inductor Loss:</label>
                <input type="number" id="${id('dcr-pct')}" readonly>
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('fet-pct')}">FET Cond. Loss:</label>
                <input type="number" id="${id('fet-pct')}" readonly>
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('sw-pct')}">Switching Loss:</label>
                <input type="number" id="${id('sw-pct')}" readonly>
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('cap-pct')}">Cap Loss:</label>
                <input type="number" id="${id('cap-pct')}" readonly>
                <span class="unit">%</span>
            </div>
            <div class="input-group">
                <label for="${id('eff')}">Est. Efficiency:</label>
                <input type="number" id="${id('eff')}" readonly>
                <span class="unit">%</span>
            </div>
        </div>

        <div class="calculator-section">
            <h3>Inductor Size/Volume</h3>
            <div class="input-group">
                <label for="${id('vol')}">Min Volume:</label>
                <input type="number" id="${id('vol')}" readonly>
                <span class="unit">mm³</span>
            </div>
            <div class="input-group">
                <label>Solve for:</label>
                <div class="solve-for-buttons">
                    <button class="solve-for-btn" id="${id('solve-x')}">X</button>
                    <button class="solve-for-btn" id="${id('solve-y')}">Y</button>
                    <button class="solve-for-btn active" id="${id('solve-z')}">Z</button>
                </div>
            </div>
            <div class="input-group">
                <label for="${id('dim-x')}">X:</label>
                <input type="number" id="${id('dim-x')}" step="0.01">
                <span class="unit">mm</span>
            </div>
            <div class="input-group">
                <label for="${id('dim-y')}">Y:</label>
                <input type="number" id="${id('dim-y')}" step="0.01">
                <span class="unit">mm</span>
            </div>
            <div class="input-group">
                <label for="${id('dim-z')}">Z (height):</label>
                <input type="number" id="${id('dim-z')}" step="0.01" readonly>
                <span class="unit">mm</span>
            </div>
        </div>

        <p class="error-message" id="${id('error')}" aria-live="polite"></p>
    </div>`;
}

// --- Pure calculation helpers (no DOM) ---

function calculateDutyCycle(vin, vout) {
    return vout / vin;
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

// --- Main calculation (scoped to one column) ---

function calculateAll(prefix) {
    const get = (field) => utils.getValue(`indvol-${prefix}-${field}`);
    const set = (field, val, dec) => utils.setValue(`indvol-${prefix}-${field}`, val, dec);
    const errorEl = document.getElementById(`indvol-${prefix}-error`);
    const setError = (msg) => { if (errorEl) errorEl.textContent = msg || ''; };

    const outputFields = [
        'duty', 'l', 'dil', 'ipk', 'vol', 'dcr', 'cout', 'cin', 'fcap',
        'dcr-pct', 'fet-pct', 'sw-pct', 'cap-pct', 'eff',
        'dim-x', 'dim-y', 'dim-z'
    ];
    const clearOutputs = () => {
        outputFields.forEach(f => set(f, '', 2));
        const fcapEl = document.getElementById(`indvol-${prefix}-fcap`);
        if (fcapEl) fcapEl.value = '—';
    };

    const vin = get('vin');
    const vout = get('vout');
    const iload = get('iload');
    const fsw = get('fsw');
    const ripplePct = get('ripple');
    const k1 = get('k1');
    const N = Math.max(2, Math.round(get('levels') || 2));

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

    const Nm1 = N - 1;  // (N-1) used throughout
    const D = calculateDutyCycle(vin, vout);
    const rippleRatio = ripplePct / 100;

    // fsw input = effective inductor frequency; derive per-switch freq
    const fswEff = fsw;                        // MHz — what the inductor sees
    const fswPS = fswEff / Nm1;                // MHz — per-switch gate frequency
    const fswEffHz = utils.mhzToHz(fswEff);

    // FCML: voltage per switch stage, local duty cycle
    const V_sw = vin / Nm1;
    const D_local_raw = (Nm1 * D) % 1;
    const D_local = D_local_raw < 0.01 ? D : D_local_raw;  // clamp interleaving null

    // Inductance: L = Vin × D_local × (1-D_local) / ((N-1) × fswEff × ripple × Iload)
    const L = vin * D_local * (1 - D_local) / (Nm1 * fswEffHz * rippleRatio * iload) * utils.constants.MICRO;
    const dIL = rippleRatio * iload;
    const Ipk = calculatePeakCurrent(iload, rippleRatio);
    const vol = calculateVolume(L, Ipk, k1);
    const dcr = calculateDCR(L, vol);

    // Auto-estimate FET parameters from V_sw (per switch pair)
    const rdson = 20 * Math.sqrt(vin) / (Math.pow(iload, 1.2) * Nm1);  // mΩ — net 1/(N-1)
    const t_sw = 0.2 + V_sw / 3.5;                                      // ns
    const coss = 200 * Math.sqrt(iload * V_sw / 12);                    // pF (per switch pair)
    const qg = 10 * Math.sqrt(iload * V_sw / 12);                       // nC (per switch pair)
    const VDR = Math.min(5, Math.max(1, V_sw * 0.5));                   // V (gate drive)
    const TDT = Math.min(20, Math.max(0.2, V_sw * 0.4));                // ns (dead time)
    const VF = Math.min(0.7, 0.2 + V_sw * 0.035);                      // V (body diode)

    // Loss calculations (all mW); fswPS = per-switch, fswEff = aggregate
    const R_PAR = 0.3;                                                  // mΩ — PCB, package, via parasitics
    const dcrLoss = iload * iload * dcr;
    const fetLoss = iload * iload * rdson;
    const parasiticLoss = iload * iload * R_PAR;                       // fixed path resistance
    const overlapLoss = 0.5 * vin * iload * t_sw * fswPS;              // each switch at fswPS, V_sw sums to Vin
    const cossLoss = 0.5e-3 * coss * V_sw * V_sw * fswEff;            // (N-1) × fswPS = fswEff
    const gateLoss = qg * VDR * fswEff;                                // all pairs aggregate to fswEff
    const deadtimeLoss = 2 * iload * VF * TDT * fswEff;                // all dead-time events
    const switchingLoss = overlapLoss + cossLoss + gateLoss + deadtimeLoss;
    const capLoss = (N - 2) * 3 * Math.pow(iload, 1.4);               // flying cap ESR loss (mW)
    const totalLoss = dcrLoss + fetLoss + parasiticLoss + switchingLoss + capLoss;

    // Percentages (of Pin)
    const pout_mW = vout * iload * 1000;
    const pin_mW = pout_mW + totalLoss;
    const dcrPct = dcrLoss / pin_mW * 100;
    const fetPct = fetLoss / pin_mW * 100;
    const swPct = switchingLoss / pin_mW * 100;
    const capPct = capLoss / pin_mW * 100;
    const efficiency = pout_mW / pin_mW * 100;

    // Capacitor estimates (µF, nameplate — includes 2× ceramic DC bias derating)
    const CERAMIC_DERATING = 2;
    const coutRipple = dIL / (0.08 * fswEff * vout);
    const coutTransient = (0.5 * iload) / (2 * Math.PI * (fswEff / 5) * 0.03 * vout);
    const cout = Math.max(coutRipple, coutTransient) * CERAMIC_DERATING;
    const cin = 100 * iload * D * (1 - D) / (fswEff * vin) * CERAMIC_DERATING;

    // Flying cap estimate (only for N > 2; 10% ripple — inductor absorbs cap ripple)
    const fcap = N > 2
        ? 10 * iload * D_local / (fswEff * V_sw) * CERAMIC_DERATING
        : null;

    set('duty', D_local * 100, 2);
    set('l', L, 3);
    set('dil', dIL, 2);
    set('ipk', Ipk, 2);
    set('vol', vol, 1);
    set('dcr', dcr, 1);
    set('cout', cout, 1);
    set('cin', cin, 1);
    set('dcr-pct', dcrPct, 1);
    set('fet-pct', fetPct, 1);
    set('sw-pct', swPct, 1);
    set('cap-pct', capPct, 1);
    set('eff', efficiency, 1);

    // Flying cap display
    const fcapEl = document.getElementById(`indvol-${prefix}-fcap`);
    if (fcapEl) fcapEl.value = fcap !== null ? fcap.toFixed(1) : '—';

    setDimensionsFromVolume(prefix, vol);
}

// --- Package dimension solver ---

function setSolveFor(prefix, axis) {
    solveForAxis[prefix] = axis;
    ['x', 'y', 'z'].forEach(d => {
        const el = document.getElementById(`indvol-${prefix}-dim-${d}`);
        if (el) el.readOnly = (d === axis);
        const btn = document.getElementById(`indvol-${prefix}-solve-${d}`);
        if (btn) btn.classList.toggle('active', d === axis);
    });
    recalcSolvedDim(prefix);
}

function setDimensionsFromVolume(prefix, vol) {
    const set = (field, val, dec) => utils.setValue(`indvol-${prefix}-${field}`, val, dec);
    const x = Math.pow(vol / (DIM_RATIO_Y * DIM_RATIO_Z), 1 / 3);
    set('dim-x', x, 2);
    set('dim-y', x * DIM_RATIO_Y, 2);
    set('dim-z', x * DIM_RATIO_Z, 2);
}

function recalcSolvedDim(prefix) {
    const get = (field) => utils.getValue(`indvol-${prefix}-${field}`);
    const set = (field, val, dec) => utils.setValue(`indvol-${prefix}-${field}`, val, dec);
    const vol = get('vol');
    if (vol === null || vol <= 0) return;

    const x = get('dim-x');
    const y = get('dim-y');
    const z = get('dim-z');
    const axis = solveForAxis[prefix];

    if (axis === 'z' && x > 0 && y > 0) {
        set('dim-z', vol / (x * y), 2);
    } else if (axis === 'y' && x > 0 && z > 0) {
        set('dim-y', vol / (x * z), 2);
    } else if (axis === 'x' && y > 0 && z > 0) {
        set('dim-x', vol / (y * z), 2);
    }
}

// --- Event listeners ---

function setupEventListeners() {
    const inputFields = ['vin', 'vout', 'iload', 'fsw', 'ripple', 'levels', 'k1'];

    ['a', 'b'].forEach(prefix => {
        inputFields.forEach(field => {
            const el = document.getElementById(`indvol-${prefix}-${field}`);
            if (el) {
                el.addEventListener('input', () => calculateAll(prefix));
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') calculateAll(prefix);
                });
            }
        });

        ['dim-x', 'dim-y', 'dim-z'].forEach(field => {
            const el = document.getElementById(`indvol-${prefix}-${field}`);
            if (el) el.addEventListener('input', () => recalcSolvedDim(prefix));
        });

        ['x', 'y', 'z'].forEach(axis => {
            const btn = document.getElementById(`indvol-${prefix}-solve-${axis}`);
            if (btn) btn.addEventListener('click', () => setSolveFor(prefix, axis));
        });
    });
}

// --- Init ---

function init() {
    const container = document.getElementById('indvol-columns');
    if (container) {
        container.innerHTML = createColumnHTML('a', 'Design A') + createColumnHTML('b', 'Design B');
    }
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
        { calculateAll: () => { calculateAll('a'); calculateAll('b'); } }
    );
}

})();

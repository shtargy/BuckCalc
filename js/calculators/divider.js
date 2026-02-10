'use strict';

/**
 * Resistor Divider Calculator (v1.5.0)
 *
 * Provides functionality to calculate resistor divider parameters
 * and find standard resistor pairs that match a desired voltage ratio.
 * 
 * New algorithm:
 * - Start with an ideal top resistor value.
 * - Find the closest standard value.
 * - Generate ~20 standard values around that closest one.
 * - For each top resistor, find the best-fit standard bottom resistor.
 * - Highlight the standard values closest to the original ideal top and bottom resistors.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- State Variables ---
    let showStandardPairsTimeout;

    // All calculation functions expect resistance in Ohms.
    // All UI functions for resistance display values in kOhms.

    // --- Core Calculation Logic ---

    function calculateVmid(vtop, vbot, rtop_ohm, rbot_ohm) {
        if ((rtop_ohm + rbot_ohm) === 0) return vbot;
        return vbot + (rbot_ohm / (rtop_ohm + rbot_ohm)) * (vtop - vbot);
    }

    function calculateRtop_ohm(vtop, vmid, vbot, rbot_ohm) {
        const divisor = (vmid - vbot);
        if (divisor === 0) return Infinity;
        return rbot_ohm * (vtop - vmid) / divisor;
    }

    function calculateRbot_ohm(vtop, vmid, vbot, rtop_ohm) {
        const divisor = (vtop - vmid);
        if (divisor === 0) return Infinity;
        return rtop_ohm * (vmid - vbot) / divisor;
    }

    function calculateVtop(vmid, vbot, rtop_ohm, rbot_ohm) {
        if (rbot_ohm === 0) return vmid;
        return vbot + (vmid - vbot) * (rtop_ohm + rbot_ohm) / rbot_ohm;
    }

    function calculateVbot(vtop, vmid, rtop_ohm, rbot_ohm) {
        if (rtop_ohm === 0) return vmid;
        return (vmid * (rtop_ohm + rbot_ohm) - vtop * rbot_ohm) / rtop_ohm;
    }

    // --- UI Update Functions ---

    function updateCurrentAndPower() {
        const vtop = utils.getValue('div-vtop');
        const vbot = utils.getValue('div-vbot');
        const rtop_kohm = utils.getValue('div-rtop');
        const rbot_kohm = utils.getValue('div-rbot');
       
        const currentEl = document.getElementById('div-current');
        const ptopEl = document.getElementById('div-ptop');
        const pbotEl = document.getElementById('div-pbot');

        if (vtop !== null && vbot !== null && rtop_kohm > 0 && rbot_kohm > 0) {
            const totalResistanceInOhms = (rtop_kohm + rbot_kohm) * 1000;
            const current = Math.abs((vtop - vbot) / totalResistanceInOhms);
            const ptop = current * current * (rtop_kohm * 1000);
            const pbot = current * current * (rbot_kohm * 1000);

            if(currentEl) currentEl.textContent = (current * 1000).toFixed(2);
            if(ptopEl) ptopEl.textContent = (ptop * 1000).toFixed(2);
            if(pbotEl) pbotEl.textContent = (pbot * 1000).toFixed(2);
        } else {
            if(currentEl) currentEl.textContent = '—';
            if(ptopEl) ptopEl.textContent = '—';
            if(pbotEl) pbotEl.textContent = '—';
        }
    }

    function updateResistorRatio() {
        const rtop_kohm = utils.getValue('div-rtop');
        const rbot_kohm = utils.getValue('div-rbot');
        const ratioEl = document.getElementById('div-ratio');
       
        if (ratioEl && rtop_kohm !== null && rbot_kohm !== null && rbot_kohm !== 0) {
            const ratio = rtop_kohm / rbot_kohm;
            ratioEl.textContent = ratio.toFixed(4);
        } else if (ratioEl) {
            ratioEl.textContent = "—";
        }
    }

    // --- Main Handlers ---

    function calculateDivider(target) {
        clearError();
        const outputId = `div-${target}`;
        const vtop = utils.getValue('div-vtop');
        const vmid = utils.getValue('div-vmid');
        const vbot = utils.getValue('div-vbot');
        const rtop_kohm = utils.getValue('div-rtop');
        const rbot_kohm = utils.getValue('div-rbot');

        try {
            let resultValue; // This will be in kOhms for resistors, or Volts for voltages
            const rtop_ohm = rtop_kohm !== null ? rtop_kohm * 1000 : null;
            const rbot_ohm = rbot_kohm !== null ? rbot_kohm * 1000 : null;

            let fields, names;
            switch (target) {
                case 'vtop':
                    fields = [vmid, vbot, rtop_ohm, rbot_ohm]; names = ['Vmid', 'Vbot', 'Rtop', 'Rbot'];
                    break;
                case 'rtop':
                    fields = [vtop, vmid, vbot, rbot_ohm]; names = ['Vtop', 'Vmid', 'Vbot', 'Rbot'];
                    break;
                case 'rbot':
                    fields = [vtop, vmid, vbot, rtop_ohm]; names = ['Vtop', 'Vmid', 'Vbot', 'Rtop'];
                    break;
                case 'vmid':
                    fields = [vtop, vbot, rtop_ohm, rbot_ohm]; names = ['Vtop', 'Vbot', 'Rtop', 'Rbot'];
                    break;
                case 'vbot':
                    fields = [vtop, vmid, rtop_ohm, rbot_ohm]; names = ['Vtop', 'Vmid', 'Rtop', 'Rbot'];
                    break;
                default: return;
            }

            if (!utils.validateInputs(fields, names, true)) {
                const missing = names.filter((_, i) => fields[i] === null || isNaN(fields[i]));
                handleError(`Please enter values for: ${missing.join(', ')}`);
                return;
            }

            switch (target) {
                case 'vtop': resultValue = calculateVtop(vmid, vbot, rtop_ohm, rbot_ohm); break;
                case 'rtop': resultValue = calculateRtop_ohm(vtop, vmid, vbot, rbot_ohm) / 1000; break;
                case 'rbot': resultValue = calculateRbot_ohm(vtop, vmid, vbot, rtop_ohm) / 1000; break;
                case 'vmid': resultValue = calculateVmid(vtop, vbot, rtop_ohm, rbot_ohm); break;
                case 'vbot': resultValue = calculateVbot(vtop, vmid, rtop_ohm, rbot_ohm); break;
            }

            if (resultValue !== null && isFinite(resultValue) && resultValue >= 0) {
                 utils.setValue(outputId, resultValue, 3);
            } else {
                 utils.setValue(outputId, '');
                 throw new Error('Calculation resulted in an invalid or non-positive value.');
            }

            updateCurrentAndPower();
            updateResistorRatio();
        } catch (error) {
            handleError(`Calculation Error: ${error.message}`);
        }
    }

    function showStandardPairs(tolerance) {
        clearError();
        if (showStandardPairsTimeout) clearTimeout(showStandardPairsTimeout);

        showStandardPairsTimeout = setTimeout(() => {
            const validatedInputs = getAndValidateInputValues();
            if (!validatedInputs) return;

            const { vtop, vmid, vbot, rtop_ohm, rbot_ohm } = validatedInputs;

            const standardValues = utils.getStandardValues(tolerance);
            if (!standardValues?.length) return handleError('Standard values not available for this tolerance.');
            
            const pairs = findBestFitPairs(standardValues, { vtop, vmid, vbot, rtop_ohm, rbot_ohm });
            
            const tbody = document.getElementById('divider-results-body');
            if (!tbody) return;

            if (pairs.length === 0) {
                showNoResultsMessage(tbody, tolerance);
            } else {
                addPairsToTable(tbody, pairs);
            }
            updateToleranceTitle(tolerance);
        }, 100);
    }
    
    // --- Standard Pairs Helper Functions ---

    function findNearestStandardValue(value, values) {
        if (values.length === 0) return null;
        const idx = utils.findClosestValueIndex(values, value);
        return idx === -1 ? null : values[idx];
    }

    function findNearestStandardValueIndex(value, values) {
        return utils.findClosestValueIndex(values, value);
    }

    function getAndValidateInputValues() {
        const vtop = utils.getValue('div-vtop');
        const vmid = utils.getValue('div-vmid');
        const vbot = utils.getValue('div-vbot');
        let rtop_kohm = utils.getValue('div-rtop');
        let rbot_kohm = utils.getValue('div-rbot');

        if (!utils.validateInputs([vtop, vmid, vbot], ['Vtop', 'Vmid', 'Vbot'], true)) {
            const names = ['Vtop', 'Vmid', 'Vbot'];
            const vals = [vtop, vmid, vbot];
            const missing = names.filter((_, i) => vals[i] === null || isNaN(vals[i]));
            handleError(`Please enter values for: ${missing.join(', ')}`);
            return null;
        }
        if (vtop <= vmid || vmid <= vbot) {
            handleError('Voltages must be in the order Vtop > Vmid > Vbot.');
            return null;
        }

        if (rtop_kohm === null && rbot_kohm !== null) {
            rtop_kohm = calculateRtop_ohm(vtop, vmid, vbot, rbot_kohm * 1000) / 1000;
            if (isFinite(rtop_kohm)) utils.setValue('div-rtop', rtop_kohm, 3);
        } else if (rtop_kohm !== null && rbot_kohm === null) {
            rbot_kohm = calculateRbot_ohm(vtop, vmid, vbot, rtop_kohm * 1000) / 1000;
            if (isFinite(rbot_kohm)) utils.setValue('div-rbot', rbot_kohm, 3);
        } else if (rtop_kohm === null && rbot_kohm === null) {
            const vdiff = vtop - vmid;
            if (vdiff === 0) {
                handleError("Vtop and Vmid cannot be equal if resistors are not specified.");
                return null;
            }
            const ratio = (vmid - vbot) / vdiff;
            const total_r_ohm = Math.abs(vtop - vbot) / 0.001; // Target 1mA current
            const rtop_ohm = total_r_ohm / (1 + ratio);
            const rbot_ohm = total_r_ohm - rtop_ohm;

            rtop_kohm = rtop_ohm / 1000;
            rbot_kohm = rbot_ohm / 1000;
            
            if (isFinite(rtop_kohm)) utils.setValue('div-rtop', rtop_kohm, 3);
            if (isFinite(rbot_kohm)) utils.setValue('div-rbot', rbot_kohm, 3);
        }
        
        if (rtop_kohm === null || rbot_kohm === null || !isFinite(rtop_kohm) || !isFinite(rbot_kohm)) return null;

        return { vtop, vmid, vbot, rtop_ohm: rtop_kohm * 1000, rbot_ohm: rbot_kohm * 1000 };
    }

    function findBestFitPairs(standardValues, { vtop, vmid, vbot, rtop_ohm, rbot_ohm }) {
        if (rbot_ohm === 0) return [];
        const rtop_std_closest_index = findNearestStandardValueIndex(rtop_ohm, standardValues);
        if (rtop_std_closest_index === -1) return [];

        const numValuesAround = 10;
        const startIndex = Math.max(0, rtop_std_closest_index - numValuesAround);
        const endIndex = Math.min(standardValues.length, rtop_std_closest_index + numValuesAround + 1);
        
        const topResistorSeries = standardValues.slice(startIndex, endIndex);

        const targetRatio = rtop_ohm / rbot_ohm;

        const pairs = topResistorSeries.map(rtop_std_ohm => {
            const ideal_rbot_ohm = rtop_std_ohm / targetRatio;
            const rbot_std_ohm = findNearestStandardValue(ideal_rbot_ohm, standardValues);
            
            return calculatePairMetrics({
                vtop, vmid, vbot,
                rtop_ohm, rbot_ohm,
                rtop_std_ohm, rbot_std_ohm
            });
        });

        // Find and mark the closest individual Rtop and Rbot values
        const closest_rtop_std = findNearestStandardValue(rtop_ohm, topResistorSeries);
        const all_rbots_std = [...new Set(pairs.map(p => p.rbot_std_ohm))];
        const closest_rbot_std = findNearestStandardValue(rbot_ohm, all_rbots_std);

        pairs.forEach(p => {
            if (p.rtop_std_ohm === closest_rtop_std) {
                p.highlightRtop = true;
            }
            if (p.rbot_std_ohm === closest_rbot_std) {
                p.highlightRbot = true;
            }
        });

        return pairs;
    }

    function calculatePairMetrics(data) {
        const { vtop, vbot, rtop_ohm, rbot_ohm, rtop_std_ohm, rbot_std_ohm } = data;

        const ideal_ratio = rbot_ohm !== 0 ? rtop_ohm / rbot_ohm : Infinity;
        const actual_ratio = rbot_std_ohm !== 0 ? rtop_std_ohm / rbot_std_ohm : Infinity;

        const ideal_current_A = (rtop_ohm + rbot_ohm) !== 0 ? (vtop - vbot) / (rtop_ohm + rbot_ohm) : 0;
        const actual_current_A = (rtop_std_ohm + rbot_std_ohm) !== 0 ? (vtop - vbot) / (rtop_std_ohm + rbot_std_ohm) : 0;
        
        const actual_vmid = calculateVmid(vtop, vbot, rtop_std_ohm, rbot_std_ohm);

        return {
            ...data,
            ratioError: calculatePercentError(actual_ratio, ideal_ratio),
            currentError: calculatePercentError(actual_current_A, ideal_current_A),
            actual_vmid: actual_vmid,
            actual_current_mA: actual_current_A * 1000
        };
    }

    function calculatePercentError(actual, expected) {
        if (expected === actual) return 0;
        if (expected === 0) return Infinity;
        return (actual - expected) / expected * 100;
    }

    function showNoResultsMessage(tbody, tolerance) {
        tbody.innerHTML = `<tr><td colspan="7">No standard resistor pairs found for ${tolerance}% tolerance.</td></tr>`;
    }

    function updateToleranceTitle(tolerance) {
        const titleEl = document.getElementById('standard-values-title');
        if(titleEl) titleEl.textContent = `Standard Resistor Pairs (${tolerance}%):`;
    }

    function getErrorClass(absError) {
        if (absError < 0.5) return 'error-excellent';
        if (absError < 1) return 'error-good';
        if (absError < 5) return 'error-acceptable';
        return 'error-poor';
    }

    function addPairsToTable(tbody, pairs) {
        tbody.innerHTML = '';
        pairs.forEach(pair => {
            const row = document.createElement('tr');
            
            const rtopCellClass = pair.highlightRtop ? 'class="highlight-closest"' : '';
            const rbotCellClass = pair.highlightRbot ? 'class="highlight-closest"' : '';

            row.innerHTML = `
                <td ${rtopCellClass}>${(pair.rtop_std_ohm / 1000).toFixed(3)}</td>
                <td ${rbotCellClass}>${(pair.rbot_std_ohm / 1000).toFixed(3)}</td>
                <td>${(pair.rtop_std_ohm / pair.rbot_std_ohm).toFixed(4)}</td>
                <td class="${getErrorClass(Math.abs(pair.ratioError))}">${pair.ratioError.toFixed(2)}%</td>
                <td>${pair.actual_vmid.toFixed(3)}</td>
                <td>${pair.actual_current_mA.toFixed(2)}</td>
                <td class="${getErrorClass(Math.abs(pair.currentError))}">${pair.currentError.toFixed(2)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    function handleError(message, error = null) {
        if (error) console.error(message, error);
        const el = document.getElementById('divider-error');
        if (el) el.textContent = message || '';
    }

    function clearError() {
        const el = document.getElementById('divider-error');
        if (el) el.textContent = '';
    }

    function init() {
        // Add Enter key support to input fields
        const inputIds = ['div-vtop', 'div-vmid', 'div-vbot', 'div-rtop', 'div-rbot'];
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        // Determine which field to calculate based on which is likely missing
                        // Default to calculating vmid
                        calculateDivider('vmid');
                    }
                });
            }
        });
    }
    
    // --- Global Export ---
    window.calculateDivider = calculateDivider;
    window.showStandardPairs = showStandardPairs;

    // --- Initialization ---
    init();

    // Register with calculator registry
    if (window.calculatorRegistry) {
        window.calculatorRegistry.register(
            'divider',
            'Resistor Divider',
            'Voltage divider and resistor pair calculator with standard value matching',
            { calculateDivider, showStandardPairs }
        );
    }
});
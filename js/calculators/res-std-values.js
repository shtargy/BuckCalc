'use strict';

document.addEventListener('DOMContentLoaded', () => {

    let lastTolerance = null;

    function rsv_updateDisplay(tolerance) {
        if (tolerance) {
            lastTolerance = tolerance;
        }

        const targetResistor_kOhm = utils.getValue('rsv-target-resistor');
        const voltage = utils.getValue('rsv-voltage');
        const tableBody = document.getElementById('rsv-results-body');
        const currentColumnHeader = document.getElementById('rsv-current-col-header');

        tableBody.innerHTML = ''; // Clear previous results

        if (targetResistor_kOhm === null || targetResistor_kOhm <= 0) {
            const tr = tableBody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 3;
            td.textContent = 'Enter a positive target resistor value to see results.';
            return;
        }
        
        if (!lastTolerance) {
             const tr = tableBody.insertRow();
             const td = tr.insertCell();
             td.colSpan = 3;
             td.textContent = 'Select a tolerance (e.g., 1%) to see standard values.';
             return;
        }
        
        const targetResistor_Ohm = targetResistor_kOhm * 1000;
        const allStdValues_Ohm = utils.getStandardValues(lastTolerance);
        const closestIndex = utils.findClosestValueIndex(allStdValues_Ohm, targetResistor_Ohm);

        if (closestIndex === -1) {
            const tr = tableBody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 3;
            td.textContent = `No standard values found for ${lastTolerance}% tolerance.`;
            return;
        }

        const numValuesToShow = 5;
        const startIndex = Math.max(0, closestIndex - numValuesToShow);
        const endIndex = Math.min(allStdValues_Ohm.length - 1, closestIndex + numValuesToShow);
        const results_Ohm = allStdValues_Ohm.slice(startIndex, endIndex + 1);

        if (!isNaN(voltage) && voltage !== 0) {
            currentColumnHeader.textContent = `Current @ ${voltage.toFixed(2)}V (mA)`;
        } else {
            currentColumnHeader.textContent = 'Current (mA)';
        }

        results_Ohm.forEach(stdValue_Ohm => {
            const errorPercent = ((stdValue_Ohm - targetResistor_Ohm) / targetResistor_Ohm) * 100;
            let currentText = '---';
            if (!isNaN(voltage) && voltage !== 0 && stdValue_Ohm > 0) {
                const current_mA = (voltage / stdValue_Ohm) * 1000;
                currentText = current_mA.toPrecision(3);
            }

            const row = tableBody.insertRow();
            if (stdValue_Ohm === allStdValues_Ohm[closestIndex]){
                row.classList.add('highlight-closest');
            }
            row.insertCell().textContent = (stdValue_Ohm / 1000).toFixed(3);
            row.insertCell().textContent = errorPercent.toFixed(2) + '%';
            row.insertCell().textContent = currentText;
        });
    }

    // --- Event Listener Setup ---
    const rsvInputIds = ['rsv-target-resistor', 'rsv-voltage'];
    rsvInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => rsv_updateDisplay(null));
        }
    });

    // --- Global Export ---
    window.rsv_updateDisplay = rsv_updateDisplay;
}); 
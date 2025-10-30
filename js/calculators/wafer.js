'use strict';

/**
 * Wafer Die Cost Calculator
 * 
 * Calculates wafer die cost metrics including gross dies per wafer,
 * yielded dies, cost per die, and power FET cost metrics.
 */

(function() {
    
    // --- Helper Functions ---
    
    function getElement(id) {
        return document.getElementById(id);
    }

    function getNumericValue(element, defaultValue = NaN) {
        if (!element) return defaultValue;
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    }

    function setNumericValue(element, value, precision = -1) {
        if (!element) return;
        if (isNaN(value) || value === null) {
            element.value = '';
            return;
        }
        element.value = precision >= 0 ? value.toFixed(precision) : value;
    }

    // --- Core Calculation Functions ---

    function calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet) {
        const sawStreetMm = sawStreet / 1000;
        const px = dieX + sawStreetMm;
        const py = dieY + sawStreetMm;

        if (waferSize <= 0 || edgeKeepout < 0 || px <= 0 || py <= 0 || edgeKeepout >= waferSize / 2) {
            return 0;
        }

        const usableRadius = (waferSize / 2) - edgeKeepout;
        const firstTerm = (Math.PI * Math.pow(usableRadius, 2)) / (px * py);
        const secondTerm = (Math.PI * usableRadius) / Math.sqrt(2 * px * py);
        const gdpw = firstTerm - secondTerm;
        
        return Math.max(0, Math.floor(gdpw));
    }

    // --- UI Update Functions ---

    function calculateAllPerformanceMetrics() {
        // Get elements dynamically to avoid null reference issues
        const dieAreaEl = getElement('wafer-die-area');
        const dieXEl = getElement('wafer-die-x');
        const dieYEl = getElement('wafer-die-y');
        const sizeEl = getElement('wafer-size');
        const sawStreetEl = getElement('wafer-saw-street');
        const edgeKeepoutEl = getElement('wafer-edge-keepout');
        const yieldEl = getElement('wafer-yield');
        const costEl = getElement('wafer-cost');
        const rdsEl = getElement('wafer-rds');
        
        const dieAreaInput = getNumericValue(dieAreaEl, 0);
        const dieX = getNumericValue(dieXEl, 0);
        const dieY = getNumericValue(dieYEl, 0);
        
        let areaToShow = (dieAreaInput > 0) ? dieAreaInput : (dieX > 0 && dieY > 0 ? dieX * dieY : null);
        setNumericValue(getElement('wafer-die-area-output'), areaToShow, 4);

        const waferSize = getNumericValue(sizeEl);
        const sawStreet = getNumericValue(sawStreetEl);
        const edgeKeepout = getNumericValue(edgeKeepoutEl);
        const grossDies = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        setNumericValue(getElement('wafer-gross-dies'), grossDies);

        const yieldVal = getNumericValue(yieldEl, 0);
        const yieldedDies = (grossDies > 0) ? Math.floor(grossDies * (yieldVal / 100)) : 0;
        setNumericValue(getElement('wafer-yielded-dies'), yieldedDies);

        const waferCost = getNumericValue(costEl);
        const costPerDie = (yieldedDies > 0) ? waferCost / yieldedDies : null;
        setNumericValue(getElement('wafer-cost-per-die'), costPerDie, 4);

        const dieAreaOutput = getNumericValue(getElement('wafer-die-area-output'));
        const centsPerMm = (dieAreaOutput > 0 && costPerDie !== null) ? (costPerDie * 100) / dieAreaOutput : null;
        setNumericValue(getElement('wafer-cents-per-mm'), centsPerMm, 3);

        const rds = getNumericValue(rdsEl);
        const powerFetCents = (centsPerMm !== null) ? rds * centsPerMm : null;
        setNumericValue(getElement('wafer-power-fet-cents'), powerFetCents, 3);
    }

    // --- Event Listener Setup ---

    function init() {
        const edgeKeepoutEl = getElement('wafer-edge-keepout');
        if (edgeKeepoutEl && !edgeKeepoutEl.value) {
            edgeKeepoutEl.value = '3';
        }

        const inputsToListen = [
            'wafer-size', 'wafer-die-x', 'wafer-die-y', 'wafer-saw-street', 
            'wafer-edge-keepout', 'wafer-yield', 'wafer-cost', 'wafer-rds', 'wafer-die-area'
        ];

        inputsToListen.forEach(id => {
            const el = getElement(id);
            if (el) {
                // Select elements fire 'change' events, input elements fire 'input' events
                const eventType = el.tagName === 'SELECT' ? 'change' : 'input';
                el.addEventListener(eventType, (event) => {
                    const targetId = event.target.id;

                    if (targetId === 'wafer-die-area') {
                        const area = getNumericValue(getElement('wafer-die-area'), 0);
                        if (area > 0) {
                            const side = Math.sqrt(area);
                            setNumericValue(getElement('wafer-die-x'), side, 4);
                            setNumericValue(getElement('wafer-die-y'), side, 4);
                        }
                    } else if (targetId === 'wafer-die-x' || targetId === 'wafer-die-y') {
                        setNumericValue(getElement('wafer-die-area'), null);
                    }
                    
                    calculateAllPerformanceMetrics();
                });
            }
        });
    }

    // Set up listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 
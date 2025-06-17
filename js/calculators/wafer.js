'use strict';

(function() {
    
    // --- DOM Element References ---
    const elements = {
        size: document.getElementById('wafer-size'),
        dieX: document.getElementById('wafer-die-x'),
        dieY: document.getElementById('wafer-die-y'),
        sawStreet: document.getElementById('wafer-saw-street'),
        edgeKeepout: document.getElementById('wafer-edge-keepout'),
        grossDies: document.getElementById('wafer-gross-dies'),
        yield: document.getElementById('wafer-yield'),
        yieldedDies: document.getElementById('wafer-yielded-dies'),
        cost: document.getElementById('wafer-cost'),
        costPerDie: document.getElementById('wafer-cost-per-die'),
        rds: document.getElementById('wafer-rds'),
        dieArea: document.getElementById('wafer-die-area'),
        dieAreaOutput: document.getElementById('wafer-die-area-output'),
        centsPerMm: document.getElementById('wafer-cents-per-mm'),
        powerFetCents: document.getElementById('wafer-power-fet-cents')
    };

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

    // --- UI Update Functions ---

    function calculateAllPerformanceMetrics() {
        const dieAreaInput = getNumericValue(elements.dieArea, 0);
        const dieX = getNumericValue(elements.dieX, 0);
        const dieY = getNumericValue(elements.dieY, 0);
        
        let areaToShow = (dieAreaInput > 0) ? dieAreaInput : (dieX > 0 && dieY > 0 ? dieX * dieY : null);
        setNumericValue(elements.dieAreaOutput, areaToShow, 4);

        const waferSize = getNumericValue(elements.size);
        const sawStreet = getNumericValue(elements.sawStreet);
        const edgeKeepout = getNumericValue(elements.edgeKeepout);
        const grossDies = calculateGdpwEquation(waferSize, edgeKeepout, dieX, dieY, sawStreet);
        setNumericValue(elements.grossDies, grossDies);

        const yieldVal = getNumericValue(elements.yield, 0);
        const yieldedDies = (grossDies > 0) ? Math.floor(grossDies * (yieldVal / 100)) : 0;
        setNumericValue(elements.yieldedDies, yieldedDies);

        const waferCost = getNumericValue(elements.cost);
        const costPerDie = (yieldedDies > 0) ? waferCost / yieldedDies : null;
        setNumericValue(elements.costPerDie, costPerDie, 4);

        const dieAreaOutput = getNumericValue(elements.dieAreaOutput);
        const centsPerMm = (dieAreaOutput > 0 && costPerDie !== null) ? (costPerDie * 100) / dieAreaOutput : null;
        setNumericValue(elements.centsPerMm, centsPerMm, 3);

        const rds = getNumericValue(elements.rds);
        const powerFetCents = (centsPerMm !== null) ? rds * centsPerMm : null;
        setNumericValue(elements.powerFetCents, powerFetCents, 3);
    }

    // --- Event Listener Setup ---

    function init() {
        if (elements.edgeKeepout && !elements.edgeKeepout.value) {
            elements.edgeKeepout.value = '3';
        }

        const inputsToListen = [
            'size', 'dieX', 'dieY', 'sawStreet', 'edgeKeepout', 
            'yield', 'cost', 'rds', 'dieArea'
        ];

        inputsToListen.forEach(key => {
            const el = elements[key];
            if (el) {
                el.addEventListener('input', (event) => {
                    const targetId = event.target.id;

                    if (targetId === elements.dieArea.id) {
                        const area = getNumericValue(elements.dieArea, 0);
                        if (area > 0) {
                            const side = Math.sqrt(area);
                            setNumericValue(elements.dieX, side, 4);
                            setNumericValue(elements.dieY, side, 4);
                        }
                    } else if (targetId === elements.dieX.id || targetId === elements.dieY.id) {
                        setNumericValue(elements.dieArea, null);
                    }
                    
                    calculateAllPerformanceMetrics();
                });
            }
        });
        
        // Initial calculation on load can be done if desired, but currently disabled
        // calculateAllPerformanceMetrics(); 
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 
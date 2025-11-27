/**
 * Calculator Registry System
 * 
 * A central registry for managing calculator modules in the BuckCalculator application.
 * This system allows calculators to register themselves and provides a unified way to
 * access calculator functions, names, and descriptions.
 */

// Store all registered calculators
const calculators = {};

/**
 * Registry object that manages calculator registration and retrieval
 * @namespace
 */
const calculatorRegistry = {
    /**
     * Register a new calculator with the registry
     * 
     * @param {string} id - Unique identifier for the calculator
     * @param {string} name - Human-readable name of the calculator
     * @param {string} description - Brief description of the calculator's purpose
     * @param {Object} functions - Map of calculator functions
     * @returns {Object} - The registered calculator object
     * 
     * @example
     * // Register a new calculator
     * calculatorRegistry.register(
     *   'boost',
     *   'Boost Converter',
     *   'DC-DC step-up converter calculator',
     *   {
     *     calculateVout: calculateVout,
     *     calculateL: calculateL
     *   }
     * );
     */
    register: function(id, name, description, functions) {
        calculators[id] = {
            id: id,
            name: name,
            description: description,
            functions: functions
        };
        
        // Use debug logging if available
        if (window.utils && window.utils.debugLog) {
            window.utils.debugLog(`Calculator registered: ${name} (${id})`);
        }
        return calculators[id];
    },
    
    /**
     * Get a calculator by its ID
     * 
     * @param {string} id - Unique identifier of the calculator to retrieve
     * @returns {Object|undefined} - The calculator object or undefined if not found
     * 
     * @example
     * // Get the buck converter calculator
     * const buckCalculator = calculatorRegistry.get('buck');
     */
    get: function(id) {
        return calculators[id];
    },
    
    /**
     * Get all registered calculators
     * 
     * @returns {Array<Object>} - Array of all registered calculator objects
     * 
     * @example
     * // Get all calculators to populate a menu
     * const allCalculators = calculatorRegistry.getAll();
     * allCalculators.forEach(calc => {
     *   console.log(`${calc.name}: ${calc.description}`);
     * });
     */
    getAll: function() {
        return Object.values(calculators);
    },
    
    /**
     * Check if a calculator with the given ID exists in the registry
     * 
     * @param {string} id - Unique identifier to check
     * @returns {boolean} - True if the calculator exists, false otherwise
     * 
     * @example
     * // Check if the boost calculator exists before trying to use it
     * if (calculatorRegistry.exists('boost')) {
     *   // Use the boost calculator
     * }
     */
    exists: function(id) {
        return !!calculators[id];
    }
};

// Export registry to global scope
window.calculatorRegistry = calculatorRegistry; 
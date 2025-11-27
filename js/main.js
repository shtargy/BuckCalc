// Main JavaScript file for DC-DC converter calculators

'use strict';

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initApplication);

function initApplication() {
    try {
        // Initialize calculator sidebar with event listeners
        initSidebar();
        
        // Set default calculator (or restore from URL hash)
        const hashCalc = window.location.hash.replace('#', '');
        const defaultCalc = hashCalc && document.getElementById(`${hashCalc}-calculator`) ? hashCalc : 'buck';
        selectCalculator(defaultCalc);
        
        // Log that initialization is complete (only in debug mode)
        if (window.utils && window.utils.debugLog) {
            utils.debugLog('DC-DC Converter Calculator initialization complete');
        }
    } catch (error) {
        console.error('Error during application initialization:', error);
        alert('An error occurred while loading the application. Please refresh the page and try again.');
    }
}

// Initialize the sidebar with event listeners (replacing inline onclick handlers)
function initSidebar() {
    const sidebarList = document.querySelector('.calculator-list');
    
    if (!sidebarList) {
        console.error('Sidebar list not found');
        return;
    }
    
    // Add click event listeners to all calculator items (replacing inline onclick)
    const calculatorItems = sidebarList.querySelectorAll('.calculator-item');
    calculatorItems.forEach(item => {
        const calculatorId = item.getAttribute('data-calculator');
        if (calculatorId) {
            // Remove any inline onclick (if present)
            item.removeAttribute('onclick');
            
            // Add event listener
            item.addEventListener('click', () => selectCalculator(calculatorId));
            
            // Add keyboard accessibility
            item.setAttribute('tabindex', '0');
            item.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCalculator(calculatorId);
                }
            });
        }
    });
}

// Switch between calculators
function selectCalculator(calculatorId) {
    if (window.utils && window.utils.debugLog) {
        utils.debugLog(`Selecting calculator: ${calculatorId}`);
    }
    
    try {
        // Hide all calculators
        const calculators = document.querySelectorAll('.calculator');
        calculators.forEach(calc => {
            calc.classList.remove('active');
        });
        
        // Show selected calculator
        const selectedCalculator = document.getElementById(`${calculatorId}-calculator`);
        if (selectedCalculator) {
            selectedCalculator.classList.add('active');
        } else {
            console.error(`Calculator with ID "${calculatorId}-calculator" not found`);
            return;
        }
        
        // Update sidebar selection
        const calculatorItems = document.querySelectorAll('.calculator-item');
        calculatorItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-calculator') === calculatorId) {
                item.classList.add('active');
            }
        });
        
        // Update URL hash for bookmarking (without triggering scroll)
        if (history.replaceState) {
            history.replaceState(null, null, `#${calculatorId}`);
        }
    } catch (error) {
        console.error(`Error selecting calculator ${calculatorId}:`, error);
    }
}

// Handle browser back/forward navigation
window.addEventListener('hashchange', () => {
    const hashCalc = window.location.hash.replace('#', '');
    if (hashCalc && document.getElementById(`${hashCalc}-calculator`)) {
        selectCalculator(hashCalc);
    }
});

// Make selectCalculator globally accessible
window.selectCalculator = selectCalculator; 
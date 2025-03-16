// Main JavaScript file for DC-DC converter calculators

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initApplication);

function initApplication() {
    // Initialize calculator sidebar
    initSidebar();
    
    // Set default calculator
    selectCalculator('buck');
    
    // Log that initialization is complete
    console.log('DC-DC Converter Calculator initialization complete');
}

// Initialize the sidebar with all registered calculators
function initSidebar() {
    // Get sidebar element
    const sidebarList = document.querySelector('.calculator-list');
    
    // Check if we should dynamically rebuild the sidebar
    const shouldRebuild = false; // Set to true if you want to rebuild the sidebar dynamically
    
    if (shouldRebuild && calculatorRegistry && sidebarList) {
        // Clear existing items
        sidebarList.innerHTML = '';
        
        // Add all registered calculators
        calculatorRegistry.getAll().forEach(calculator => {
            const item = document.createElement('li');
            item.className = 'calculator-item';
            item.setAttribute('data-calculator', calculator.id);
            item.textContent = calculator.name;
            item.onclick = () => selectCalculator(calculator.id);
            
            sidebarList.appendChild(item);
        });
    }
}

// Switch between calculators
function selectCalculator(calculatorId) {
    console.log(`Selecting calculator: ${calculatorId}`);
    
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
}

// Make selectCalculator globally accessible
window.selectCalculator = selectCalculator; 
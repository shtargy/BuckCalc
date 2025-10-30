# DC/DC Converter Calculators

A web-based calculator suite for electronics design calculations. Currently includes:

1. **Buck Converter Calculator**
   - Input/Output voltage
   - Inductance
   - Switching frequency
   - Inductor current ripple
   - High/Low-side switch voltage drop

2. **Boost Converter Calculator**
   - DC-DC step-up converter calculations

3. **Inverting Buck-Boost Calculator**
   - Input/Output voltage
   - Average inductor current
   - Output current
   - Inductance
   - Switching frequency
   - Inductor current ripple

4. **Resistor Divider Calculator**
   - Resistor selection based on voltage divider equation
   - Standard resistor value lookup (E24, E96, E192)
   - Current and power calculation
   - Sorting by ratio or current error

5. **Standard Resistor Finder**
   - Find nearest standard resistor values
   - Multiple tolerance levels (0.1%, 1%, 5%)
   - Current calculation based on voltage

6. **Coupled Inductor Ripple Calculator**
   - Multiphase buck converter ripple calculations
   - Discrete and coupled inductor ripple comparison
   - Figure of Merit (FOM) calculation
   - Unit dropdowns for inductance and frequency

7. **Wafer Die Cost Calculator**
   - Gross dies per wafer calculation
   - Yield and cost per die metrics
   - Power FET cost calculations

8. **PCB Calculator**
   - PCB-related calculations

9. **Thermal Resistance Calculator**
   - Thermal analysis calculations

10. **RLC Calculator**
    - RLC circuit calculations

## Live Demo
Visit the calculators at: https://shtargy.github.io/BuckCalc/

## Features
- Multiple converter calculators in one interface
- Easy calculator selection
- Real-time calculations
- User-friendly interface
- No installation required
- Works in any modern web browser

## Local Development
To run the calculator locally:
1. Clone the repository
2. Start a local server (e.g., `python3 -m http.server 8000`)
3. Visit http://localhost:8000 in your browser

## Adding New Calculators

This project follows a modular architecture designed for extensibility. For a comprehensive guide on how to implement new calculators, please refer to [CALCULATOR_ARCHITECTURE.md](CALCULATOR_ARCHITECTURE.md).

In summary, to add a new calculator:

1. **Create a new calculator JS file**:
   - Copy `js/calculators/template-calculator.js` to `js/calculators/your-calculator-name.js`
   - Update the calculator ID, name, and description
   - Implement your calculation functions
   - Register the calculator with the registry

2. **Create the HTML for your calculator**:
   - Copy the HTML from `template-calculator.html`
   - Add it to the `main-content` div in `index.html`
   - Update the IDs, labels, and button onclick handlers

3. **Add sidebar menu item**:
   - Add a new `<li>` item to the `.calculator-list` in `index.html`
   - Set the `data-calculator` attribute to match your calculator ID
   - Set the `onclick` to call `selectCalculator` with your calculator ID

4. **Include your script**:
   - Add a script tag for your calculator in `index.html` before the closing body tag

Example:
```html
<script src="js/calculators/your-calculator-name.js"></script>
```

## Project Structure

- `index.html` - Main HTML file
- `css/style.css` - Styles for the application
- `js/` - JavaScript files:
  - `main.js` - Core application logic
  - `utils.js` - Shared utility functions
  - `calculator-registry.js` - Registry system for calculators
  - `calculators/` - Individual calculator implementations:
    - `buck.js` - Buck converter calculator
    - `buck-boost.js` - Inverting buck-boost calculator
    - `divider.js` - Resistor divider calculator
- `CALCULATOR_ARCHITECTURE.md` - Detailed architecture documentation

## User Instructions

### Using the Buck Converter Calculator
1. Select the "Buck Converter" from the sidebar
2. Enter the known parameters (at least 3 of the following):
   - Input Voltage (Vin)
   - Output Voltage (Vout)
   - Inductor Value
   - Switching Frequency
   - Current Ripple
3. Click the "Calculate" button next to the parameter you want to compute
4. The result will appear in the corresponding input field
5. Optional: Enter diode voltage drops for more accurate calculations

### Using the Inverting Buck-Boost Calculator
1. Select the "Inverting Buck-Boost" from the sidebar
2. Enter the known parameters based on what you want to calculate
3. Click the "Calculate" button next to the parameter you want to compute
4. The calculator will determine the missing parameter based on the provided inputs

### Using the Resistor Divider Calculator
1. Select the "Resistor Divider" from the sidebar
2. Enter your target input voltage, output voltage, and current (optional)
3. Select the preferred resistor series (E24, E96, or E192)
4. Click "Calculate" to generate a list of standard resistor pairs
5. Use the "Sort by" options to find the best resistor pair for your needs
6. The results include ratio error, current, and power information

Tips:
- For all calculators, you must enter the required input fields (marked with *)
- Results are displayed with 2 decimal places for readability
- Use the sidebar to switch between different calculators at any time
- Clear the fields and start over if you want to perform new calculations 


\begin{align}
dIL_{DL} &= \frac{V_{IN} - V_{OUT}}{L} \times \frac{D}{F_S} \label{eq:dildl_corr} \\
dIL_{CL} &= \frac{V_{IN} - V_{OUT}}{L} \times \frac{D}{F_S} \times \frac{1}{FOM(D, N_{ph}, \rho, j)} \label{eq:dilcl_corr} \\
FOM &= \frac{1 + \frac{\rho}{\rho + 1} \times \frac{1}{N_{ph} - 1}}{1 - \left[ (N_{ph} - 2j - 2) + \frac{j(j + 1)}{N_{ph} D} + \frac{N_{ph} D (N_{ph} - 2j - 1) + j(j + 1)}{N_{ph} (1 - D)} \right] \times \frac{\rho}{\rho + 1} \times \frac{1}{N_{ph} - 1}} \label{eq:fom_corr} \\
\rho &= \frac{L_m}{L} \label{eq:rho_corr} \\
j &= \text{floor}(D \times N_{ph}) \label{eq:j_corr} \\
D &= \frac{V_{OUT}}{V_{IN}}
\end{align}


solve for:
dIL_{DL}
dIL_{CL}

and user needs to provide:

V_{IN}
V_{OUT}
L_m
L
F_S
N_{ph}
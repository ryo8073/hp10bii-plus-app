import { CalculatorEngine } from './calculator-engine.js';

function showTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabName + '-content').classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Dark mode toggle (simple version based on system preference)
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newColorScheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newColorScheme);
});

document.addEventListener('DOMContentLoaded', () => {
    const engine = new CalculatorEngine();
    const display = document.getElementById('display');
    const shiftStatus = document.getElementById('shift-status');
    const keysGrid = document.querySelector('.keys-grid');

    // Dynamically create shift text on keys
    keysGrid.querySelectorAll('.key').forEach(keyElement => {
        const orangeShiftText = keyElement.dataset.shiftOrange;
        const blueShiftText = keyElement.dataset.shiftBlue;

        if (orangeShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-orange';
            shiftSpan.textContent = orangeShiftText;
            keyElement.appendChild(shiftSpan);
        }
        if (blueShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-blue';
            shiftSpan.textContent = blueShiftText;
            keyElement.appendChild(shiftSpan);
        }
    });

    const updateDisplay = () => {
        display.textContent = engine.display;
        // Update shift status display
        if (engine.shiftMode === 'orange') {
            shiftStatus.textContent = '↓';
        } else if (engine.shiftMode === 'blue') {
            shiftStatus.textContent = '↑';
        } else {
            shiftStatus.textContent = '';
        }
    };

    keysGrid.addEventListener('click', (event) => {
        if (!event.target.classList.contains('key')) return;

        const keyElement = event.target.closest('.key');
        const key = keyElement.dataset.key;
        const orangeShifted = engine.shiftMode === 'orange';
        const blueShifted = engine.shiftMode === 'blue';

        // Check for sequenced input first
        if (engine.isWaitingForSequencedInput && !isNaN(parseInt(key, 10))) {
            engine.handleSequencedInput(key);
        } else {
             // Regular key handling
            switch (key) {
                // --- Number Inputs ---
                case '0': case '1': case '2': case '3': case '4': 
                case '5': case '6': case '7': case '8': case '9':
                    engine.inputDigit(key);
                    break;
                case '.':
                    engine.inputDecimal();
                    break;

                // --- Operators ---
                case 'ADD': case 'SUBTRACT': case 'MULTIPLY': case 'DIVIDE':
                    engine.setOperator(key);
                    break;
                case '=':
                    if (orangeShifted) {
                        engine.startSequencedInput('DISP');
                    } else {
                        engine.calculate();
                    }
                    break;

                // --- Basic Functions ---
                case 'C':
                    if (orangeShifted) {
                        engine.clearAll();
                    } else {
                        engine.clear();
                    }
                    break;
                case '+/-':
                    engine.changeSign();
                    break;
                
                // --- Shift Keys ---
                case 'SHIFT_ORANGE':
                    engine.setShiftMode('orange');
                    break;
                case 'SHIFT_BLUE':
                    engine.setShiftMode('blue');
                    break;

                // --- Memory Functions ---
                case 'RCL':
                     if (orangeShifted) {
                        engine.startSequencedInput('STO');
                    } else {
                        engine.startSequencedInput('RCL');
                    }
                    break;

                // --- TVM Functions ---
                case 'N':
                case 'I/YR':
                case 'PV':
                case 'PMT':
                case 'FV':
                    if (orangeShifted) {
                        // Handle shifted TVM keys
                        switch(key) {
                            case 'PMT': // P/YR
                                engine.setTVMValue('P_YR');
                                break;
                             case 'FV': // AMORT
                                engine.calculateAmortization();
                                break;
                            // Add other orange-shifted TVM functions here
                        }
                    } else {
                        // If a value is in one of the TVM registers, pressing the key computes it
                        if (engine.tvmValues[key] !== null) {
                            engine.calculateTVM(key);
                        } else {
                            engine.setTVMValue(key);
                        }
                    }
                    break;

                default:
                    console.log('Unhandled key:', key, 'Shift:', engine.shiftMode);
                    break;
            }
        }

        // After most operations, reset shift mode unless it's a dedicated shift key
        // or a sequence has been started
        if (key !== 'SHIFT_ORANGE' && key !== 'SHIFT_BLUE' && !engine.isWaitingForSequencedInput) {
             if (engine.shiftMode) {
                engine.setShiftMode(null);
            }
        }
        
        updateDisplay();
    });

    // Initial Display Update
    updateDisplay();
}); 
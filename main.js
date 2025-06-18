// No imports needed, all classes/functions are global

document.addEventListener('DOMContentLoaded', () => {

    const engine = new CalculatorEngine();

    // --- DOM Element Cache ---
    const display = document.getElementById('display');
    const shiftIndicator = document.getElementById('shift-indicator');
    const begIndicator = document.getElementById('beg-indicator');
    const ppyIndicator = document.getElementById('payments-per-year-indicator');
    const modeIndicator = document.getElementById('mode-indicator');
    const keysGrid = document.querySelector('.keys-grid'); // Corrected selector
    const tvmDisplays = {
        N: document.getElementById('tvm-n-display'),
        I_YR: document.getElementById('tvm-iyr-display'),
        PV: document.getElementById('tvm-pv-display'),
        PMT: document.getElementById('tvm-pmt-display'),
        FV: document.getElementById('tvm-fv-display'),
    };

    // --- Key Highlighting ---
    function flashKey(keyToFlash) {
        // Find by data-key for robustness
        const keyElement = keysGrid.querySelector(`.key[data-key="${keyToFlash}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => {
                keyElement.classList.remove('active');
            }, 150);
        }
    }
    
    // --- Display Update Function ---
    function updateDisplay() {
        const state = engine.getDisplayState();

        // Main display value
        display.textContent = state.value;

        // Status indicators
        if (state.shiftMode === 'orange') {
            shiftIndicator.textContent = '↓';
        } else if (state.shiftMode === 'blue') {
            shiftIndicator.textContent = '↑';
        } else {
            shiftIndicator.textContent = '';
        }
        
        begIndicator.textContent = state.begMode ? 'BEG' : '';
        ppyIndicator.textContent = `${state.paymentsPerYear} P/YR`;
        modeIndicator.textContent = state.pend ? 'PEND' : ''; // Use mode for PEND indicator

        // Update TVM register displays
        updateTVMDisplay();
    }
    
    function updateTVMDisplay() {
        const format = (val, key) => {
            if (val === null || val === undefined) return '-';
            // I/YR should show more decimals
            const places = (key === 'I_YR') ? 4 : 2;
            return val.toFixed(places);
        };

        for (const key in tvmDisplays) {
            if (tvmDisplays[key]) {
                const value = engine.tvmValues[key];
                tvmDisplays[key].textContent = format(value, key);
            }
        }
    }

    // --- Event Handlers ---
    keysGrid.addEventListener('click', (event) => {
        const keyElement = event.target.closest('.key');
        if (!keyElement) return;

        const key = keyElement.dataset.key;
        const orangeShifted = engine.shiftMode === 'orange';
        const blueShifted = engine.shiftMode === 'blue';

        flashKey(key);

        if (engine.isWaitingForSequencedInput && !isNaN(parseInt(key, 10))) {
            engine.handleSequencedInput(key);
        } else {
            switch (key) {
                case '0': case '1': case '2': case '3': case '4': 
                case '5': case '6': case '7': case '8': case '9':
                    engine.inputDigit(key);
                    break;
                case '.':
                    if (orangeShifted) {
                        engine.toggleNumberFormatStyle();
                    } else {
                        engine.inputDecimal();
                    }
                    break;
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
                case 'C':
                    if (orangeShifted) {
                        engine.clearAll();
                    } else {
                        engine.clear();
                    }
                    break;
                case 'BACKSPACE':
                    engine.backspace();
                    break;
                case '+/-':
                    engine.changeSign();
                    break;
                case 'SHIFT_ORANGE':
                    engine.setShiftMode('orange');
                    break;
                case 'SHIFT_BLUE':
                    // Blue shift not implemented yet
                    engine.setShiftMode('blue');
                    break;
                case 'RCL':
                     if (orangeShifted) {
                        engine.startSequencedInput('STO');
                    } else {
                        engine.startSequencedInput('RCL');
                    }
                    break;
                case 'N': case 'I/YR': case 'PV': case 'PMT': case 'FV':
                    if (orangeShifted) {
                        engine.handleShiftedTVM(key);
                    } else {
                        if (engine.isEnteringInput) {
                            engine.setTVMValue(key);
                        } else {
                            engine.calculateTVM(key);
                        }
                    }
                    break;
                case 'MAR': // Key for BEG/END toggle
                    if (orangeShifted) {
                        engine.toggleBegEnd();
                    }
                    break;
                default:
                    console.log('Unhandled key:', key, 'Shift:', engine.shiftMode);
            }
        }

        if (key !== 'SHIFT_ORANGE' && key !== 'SHIFT_BLUE' && !engine.isWaitingForSequencedInput) {
             if (engine.shiftMode) {
                engine.setShiftMode(null);
            }
        }
        
        updateDisplay();
    });

    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        let dataKey = '';
        const key = event.key;

        if (key >= '0' && key <= '9') dataKey = key;
        else if (key === '.') dataKey = '.';
        else if (key === '+') dataKey = 'ADD';
        else if (key === '-') dataKey = 'SUBTRACT';
        else if (key === '*') dataKey = 'MULTIPLY';
        else if (key === '/') dataKey = 'DIVIDE';
        else if (key === 'Enter' || key === '=') dataKey = '=';
        else if (key === 'Backspace') dataKey = 'BACKSPACE';
        else if (key === 'Escape') dataKey = 'C';
        else if (key.toLowerCase() === 'n') dataKey = 'N';
        else if (key.toLowerCase() === 'i') dataKey = 'I/YR';
        else if (key.toLowerCase() === 'p') dataKey = 'PV'; // Assuming 'p' for PV
        else if (key.toLowerCase() === 'm') dataKey = 'PMT'; // Assuming 'm' for PMT
        else if (key.toLowerCase() === 'f') dataKey = 'FV'; // Assuming 'f' for FV


        if (dataKey) {
            event.preventDefault();
            const keyElement = keysGrid.querySelector(`.key[data-key="${dataKey}"]`);
            if(keyElement) {
                keyElement.click(); // Simulate a click on the corresponding button
            }
        }
    });

    // --- Initial Setup ---
    
    // Dynamically create shift text on keys (from previous version, good to keep)
    keysGrid.querySelectorAll('.key').forEach(keyElement => {
        const orangeShiftText = keyElement.dataset.shiftOrange;
        if (orangeShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-text-orange';
            shiftSpan.textContent = orangeShiftText;
            keyElement.appendChild(shiftSpan);
        }
        const blueShiftText = keyElement.dataset.shiftBlue;
        if (blueShiftText) {
            const shiftSpan = document.createElement('span');
            shiftSpan.className = 'shift-text-blue';
            shiftSpan.textContent = blueShiftText;
            keyElement.appendChild(shiftSpan);
        }
    });

    updateDisplay();
}); 
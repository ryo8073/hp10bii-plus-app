// HP10BII+ 電卓の計算エンジン
// 高精度計算と状態管理を提供

// Decimal.jsはグローバルにロードされるため、直接 Decimal オブジェクトを使用
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

class CalculatorEngine {
  constructor() {
    this.memory = new MemoryManager();
    this.clearAll();
    this.currentInput = '0'; // Per real calc behavior
    this.updateDisplay();
  }

  // Clears the current input and resets operator state
  clear() {
    this.currentInput = '0';
    this.operator = null;
    this.previousInput = null;
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  // Resets the entire calculator to its default state
  clearAll() {
    this.clear();
    this.tvmValues = {
      N: null,
      I_YR: null,
      PV: null,
      PMT: null,
      FV: null,
      P_YR: 12, // Default to 12 payments per year
      isBeginningMode: false
    };
    this.memory.clearAll();
    this.decimalPlaces = 2;
    this.shiftMode = null;
    this.isWaitingForSequencedInput = null;

    // Special display for C ALL: show current P/YR
    this.currentInput = `${this.tvmValues.P_YR} P_Yr-`;
    this.isEnteringInput = false; // This is a display state, not input
    this.updateDisplay();
    this.currentInput = '0'; // Reset for next input, but display remains until then
  }

  setDecimalPlaces(places) {
    const p = parseInt(places, 10);
    if (!isNaN(p) && p >= 0 && p <= 9) {
      this.decimalPlaces = p;
    }
    // After setting decimal places, the calculator is no longer in active input mode.
    // This will cause the display to re-format the current number.
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  inputDigit(digit) {
    if (this.isWaitingForSequencedInput) {
      this.handleSequencedInput(digit);
      return;
    }

    // If we are not in entry mode OR we are waiting for a second operand, start a new number.
    if (!this.isEnteringInput || this.waitingForSecondOperand) {
      this.currentInput = digit;
    } else {
      // Otherwise, append to the current number.
      this.currentInput = (this.currentInput === '0') ? digit : this.currentInput + digit;
    }

    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.isWaitingForSequencedInput) return;

    // If starting a new number after an op, or not in entry, start with "0."
    if (!this.isEnteringInput || this.waitingForSecondOperand) {
        this.currentInput = '0.';
    } else if (!this.currentInput.includes('.')) {
        // otherwise, append if no decimal yet
        this.currentInput += '.';
    }
    
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  changeSign() {
    if (this.currentInput !== '0' && this.currentInput !== 'Error') {
      this.currentInput = (parseFloat(this.currentInput) * -1).toString();
    }
    this.updateDisplay();
  }

  setOperator(op) {
    if (this.currentInput === 'Error') return;
    if (this.operator && !this.waitingForSecondOperand) {
      this.calculate();
    }
    this.previousInput = parseFloat(this.currentInput);
    this.operator = op;
    this.waitingForSecondOperand = true;
    this.isEnteringInput = false; // FINISH number entry, allow formatting
  }

  calculate() {
    if (this.operator && this.previousInput !== null && !this.waitingForSecondOperand) {
      const current = parseFloat(this.currentInput);
      let result = 0;
      switch (this.operator) {
        case 'ADD': result = this.previousInput + current; break;
        case 'SUBTRACT': result = this.previousInput - current; break;
        case 'MULTIPLY': result = this.previousInput * current; break;
        case 'DIVIDE': result = this.previousInput / current; break;
      }
      this.currentInput = result.toString();
      this.operator = null;
      this.previousInput = null;
    }
    // Pressing = always finalizes number entry, allowing it to be formatted.
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  setShiftMode(mode) {
    // Toggle off if the same shift key is pressed again
    if (this.shiftMode === mode) {
      this.shiftMode = null;
    } else {
      this.shiftMode = mode;
    }
  }

  // --- Sequenced Inputs (like STO 1, RCL 2, DISP 4) ---
  startSequencedInput(sequenceType) {
    this.isWaitingForSequencedInput = sequenceType;
    // Maybe update display to show "STO" or "RCL" prompt
  }

  handleSequencedInput(digit) {
    switch (this.isWaitingForSequencedInput) {
      case 'STO':
        this.store(digit);
        break;
      case 'RCL':
        this.recall(digit);
        break;
      case 'DISP':
        this.setDecimalPlaces(digit);
        break;
    }
    this.isWaitingForSequencedInput = null;
    // Don't reset shift mode here, main.js will do it
  }

  handleShiftedTVM(key) {
    const value = parseFloat(this.currentInput);
    if (this.currentInput === 'Error' || isNaN(value)) return;

    switch (key) {
        case 'N': // Corresponds to xP/YR
            const n = value * this.tvmValues.P_YR;
            this.tvmValues.N = n;
            this.currentInput = n.toString();
            break;
        case 'PMT': // Corresponds to P/YR
            if (value > 0) this.tvmValues.P_YR = value;
            break;
        case 'FV': // Corresponds to AMORT
            this.calculateAmortization();
            return; // AMORT is a command, not a setter, so we exit early.
    }
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  // --- TVM Functions ---
  setTVMValue(key, value = null) {
    const internalKey = (key.toUpperCase() === 'I/YR') ? 'I_YR' : key.toUpperCase();
    const val = value !== null ? value : parseFloat(this.currentInput);
    
    if (this.tvmValues.hasOwnProperty(internalKey)) {
        this.tvmValues[internalKey] = val;
    }
    
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  calculateTVM(keyToCalculate) {
    const internalKey = (keyToCalculate.toUpperCase() === 'I/YR') ? 'I_YR' : keyToCalculate.toUpperCase();
    try {
      const result = calculateTVM(
        this.tvmValues.I_YR,
        this.tvmValues.N,
        this.tvmValues.PMT,
        this.tvmValues.PV,
        this.tvmValues.FV,
        internalKey,
        this.tvmValues.P_YR,
        this.tvmValues.isBeginningMode
      );
      this.currentInput = result.toString();
      this.tvmValues[internalKey] = result;
    } catch(error) {
      this.currentInput = "Error";
    }
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  // Placeholder for Amortization
  calculateAmortization() {
    console.log("Amortization calculation triggered.");
    this.currentInput = "AMORT";
    this.isEnteringInput = false;
    this.updateDisplay();
  }

  // --- Memory Functions ---
  store(register) {
    const r = parseInt(register, 10);
    if (!isNaN(r) && r >= 0 && r <= 9) {
      this.memory.store(r, parseFloat(this.currentInput));
      this.isEnteringInput = false; // After storing, new input can start
    }
    this.updateDisplay();
  }

  recall(register) {
    const r = parseInt(register, 10);
    if (!isNaN(r) && r >= 0 && r <= 9) {
      const value = this.memory.recall(r);
      if (value !== null) {
        this.currentInput = value.toString();
        this.isEnteringInput = false;
      }
    }
    this.updateDisplay();
  }

  updateDisplay() {
    // Format the number for display based on decimalPlaces
    // But keep the internal value as a full-precision string
    
    // The C-ALL command has a special temporary display that overrides normal formatting
    if (this.currentInput.endsWith('P_Yr-')) {
        this.display = this.currentInput;
        return;
    }

    if (this.isEnteringInput) {
      this.display = this.currentInput;
    } else {
      const num = parseFloat(this.currentInput);
      if (!isNaN(num)) {
        this.display = formatNumber(num, this.decimalPlaces);
      } else {
        this.display = this.currentInput; // Display error messages etc.
      }
    }
  }

  get displayValue() {
    return this.display;
  }

  backspace() {
    if (this.currentInput === "Error") return;
    if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
    } else {
        this.currentInput = '0';
    }
    // After backspace, we are definitely in input mode.
    this.isEnteringInput = true;
    this.updateDisplay();
  }
}

// Make available globally
window.CalculatorEngine = CalculatorEngine;

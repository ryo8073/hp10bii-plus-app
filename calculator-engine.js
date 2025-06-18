// HP10BII+ 電卓の計算エンジン
// 高精度計算と状態管理を提供

// Decimal.jsはグローバルにロードされるため、直接 Decimal オブジェクトを使用
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

class CalculatorEngine {
  constructor() {
    this.memory = new MemoryManager();
    this.clearAll();
  }

  // Clears the current input and resets operator state
  clear() {
    this.currentInput = '0';
    this.operator = null;
    this.previousInput = null;
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
  }

  // Resets the entire calculator to its default state
  clearAll() {
    const p_yr = this.tvmValues ? this.tvmValues.P_YR : 12; // Preserve P/YR
    
    this.clear();
    this.tvmValues = {
      N: null,
      I_YR: null,
      PV: null,
      PMT: null,
      FV: null,
      P_YR: p_yr, // Restore P/YR
      isBeginningMode: false
    };
    this.memory.clearAll();
    this.decimalPlaces = 2;
    this.shiftMode = null;
    this.isWaitingForSequencedInput = null;
    this.numberFormatStyle = 'us'; // 'us' or 'eu'
    // C ALL no longer shows P/YR, it's always visible now.
    // The engine is ready for new input immediately.
    this.currentInput = '0';
  }

  toggleNumberFormatStyle() {
    this.numberFormatStyle = (this.numberFormatStyle === 'us') ? 'eu' : 'us';
  }

  setDecimalPlaces(places) {
    const p = parseInt(places, 10);
    if (!isNaN(p) && p >= 0 && p <= 9) {
      this.decimalPlaces = p;
    }
    this.isEnteringInput = false;
  }

  inputDigit(digit) {
    if (this.isWaitingForSequencedInput) {
      this.handleSequencedInput(digit);
      return;
    }

    if (!this.isEnteringInput || this.waitingForSecondOperand) {
      this.currentInput = digit;
    } else {
      this.currentInput = (this.currentInput === '0') ? digit : this.currentInput + digit;
    }

    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
  }

  inputDecimal() {
    if (this.isWaitingForSequencedInput) return;

    if (!this.isEnteringInput || this.waitingForSecondOperand) {
        this.currentInput = '0.';
    } else if (!this.currentInput.includes('.')) {
        this.currentInput += '.';
    }
    
    this.isEnteringInput = true;
    this.waitingForSecondOperand = false;
  }

  changeSign() {
    if (this.currentInput !== '0' && this.currentInput !== 'Error') {
      this.currentInput = (parseFloat(this.currentInput) * -1).toString();
    }
  }

  setOperator(op) {
    if (this.currentInput === 'Error') return;
    if (this.operator && !this.waitingForSecondOperand) {
      this.calculate();
    }
    this.previousInput = parseFloat(this.currentInput);
    this.operator = op;
    this.waitingForSecondOperand = true;
    this.isEnteringInput = false;
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
    this.isEnteringInput = false;
  }

  setShiftMode(mode) {
    this.shiftMode = (this.shiftMode === mode) ? null : mode;
  }

  startSequencedInput(sequenceType) {
    this.isWaitingForSequencedInput = sequenceType;
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
            if (value > 0) this.setPaymentsPerYear(value);
            break;
        case 'FV': // Corresponds to AMORT
            this.calculateAmortization();
            return;
    }
    this.isEnteringInput = false;
  }

  setPaymentsPerYear(ppy) {
    if (ppy > 0) {
        this.tvmValues.P_YR = ppy;
        this.tvmValues.I_YR = null;
    }
  }

  toggleBegEnd() {
    this.tvmValues.isBeginningMode = !this.tvmValues.isBeginningMode;
  }

  setTVMValue(key, value = null) {
    const internalKey = (key.toUpperCase() === 'I/YR') ? 'I_YR' : key.toUpperCase();
    const val = value !== null ? value : parseFloat(this.currentInput);
    
    if (this.tvmValues.hasOwnProperty(internalKey)) {
        this.tvmValues[internalKey] = val;
    }
    this.isEnteringInput = false;
  }

  calculateTVM(keyToCalculate) {
    const internalKey = (keyToCalculate.toUpperCase() === 'I/YR') ? 'I_YR' : keyToCalculate.toUpperCase();
    try {
      const result = calculateTVM(
        this.tvmValues.I_YR, this.tvmValues.N, this.tvmValues.PMT,
        this.tvmValues.PV, this.tvmValues.FV, internalKey,
        this.tvmValues.P_YR, this.tvmValues.isBeginningMode
      );
      this.currentInput = result.toString();
      this.tvmValues[internalKey] = result;
    } catch(error) {
      this.currentInput = "Error";
    }
    this.isEnteringInput = false;
  }

  calculateAmortization() {
    console.log("Amortization calculation triggered.");
    this.currentInput = "AMORT";
    this.isEnteringInput = false;
  }

  store(register) {
    const r = parseInt(register, 10);
    if (!isNaN(r) && r >= 0 && r <= 9) {
      this.memory.store(r, parseFloat(this.currentInput));
      this.isEnteringInput = false;
    }
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
  }
  
  backspace() {
    if (this.currentInput === "Error" || !this.isEnteringInput) return;
    if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
    } else {
        this.currentInput = '0';
    }
  }

  getDisplayState() {
    let formattedValue;
    const num = parseFloat(this.currentInput);

    if (this.currentInput.endsWith('.')) {
        // Handle trailing decimal for input like "123."
        const integerPart = this.currentInput.slice(0, -1);
        const numToFormat = parseFloat(integerPart);
        const sep = this.numberFormatStyle === 'us' ? ',' : '.';
        formattedValue = numToFormat.toLocaleString(this.numberFormatStyle === 'us' ? 'en-US' : 'de-DE').replace(/[\.,]/g, (match) => (match === sep ? sep : '')) + (this.numberFormatStyle === 'us' ? '.' : ',');
    } else if (!isNaN(num)) {
        // Format numbers that are not currently being input, or have been finalized
        const style = this.numberFormatStyle === 'us' ? 'en-US' : 'de-DE';
        const options = {
            minimumFractionDigits: this.decimalPlaces,
            maximumFractionDigits: this.decimalPlaces,
        };
        // During input, don't apply decimal places yet
        if (this.isEnteringInput && !this.currentInput.includes('.')) {
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
        } else if (this.isEnteringInput) {
            const parts = this.currentInput.split('.');
            options.minimumFractionDigits = parts[1] ? parts[1].length : 0;
            options.maximumFractionDigits = parts[1] ? parts[1].length : 0;
        }
        
        formattedValue = num.toLocaleString(style, options);

    } else {
        // For non-numeric values like "Error"
        formattedValue = this.currentInput;
    }

    // Manual comma/period swap for toLocaleString which is buggy on some systems
    if (this.numberFormatStyle === 'eu') {
      const temp = formattedValue.replace(/,/g, '|');
      formattedValue = temp.replace(/\./g, ',');
      formattedValue = formattedValue.replace(/\|/g, '.');
    }


    return {
        value: formattedValue,
        shiftMode: this.shiftMode,
        begMode: this.tvmValues.isBeginningMode,
        paymentsPerYear: this.tvmValues.P_YR,
        isError: this.currentInput === "Error",
        pend: this.operator !== null,
    };
  }
}

// Make available globally
window.CalculatorEngine = CalculatorEngine;

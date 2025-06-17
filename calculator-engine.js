// HP10BII+ 電卓の計算エンジン
// 高精度計算と状態管理を提供

import { Decimal } from 'decimal.js';
import { MemoryManager } from './memory-manager.js';
import { Utils } from './utils.js';
import { FinancialFunctions } from './financial-functions.js';

// 計算精度の設定
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

export class CalculatorEngine {
  constructor() {
    // 初期化
    this.initialize();
    
    // メモリマネージャーの初期化
    this.memoryManager = new MemoryManager();
  }

  // 電卓の初期化
  initialize() {
    // 表示値
    this.display = '0';
    
    // 現在の入力値
    this.currentInput = '';
    
    // 前回の入力値（計算用）
    this.previousInput = '';
    
    // 現在の演算子
    this.currentOperator = null;
    
    // シフトモード（null, 'up', 'down'）
    this.shiftMode = null;
    
    // 計算モード（'FIN', 'STAT', 'MATH', 'PROB'）
    this.calculationMode = 'FIN';
    
    // 角度モード（'DEG', 'RAD'）
    this.angleMode = 'DEG';
    
    // 表示形式（'NORM', 'SCI', 'ENG'）
    this.displayFormat = 'NORM';
    
    // 小数点以下の桁数
    this.decimalPlaces = 2;
    
    // 統計データ
    this.statisticsData = [];
    
    // キャッシュフロー
    this.cashFlows = [];
    
    // TVM値
    this.tvmValues = {
      N: 0,      // 期間数
      IYR: 0,    // 年利率（%）
      PV: 0,     // 現在価値
      PMT: 0,    // 定期支払額
      FV: 0,     // 将来価値
      PYR: 12,   // 年間支払回数
      BEG: false // 支払期首モード（false: 期末）
    };
    
    // 括弧のネスト数
    this.parenthesisCount = 0;
    
    // 計算履歴
    this.history = [];
  }

  // 数字の入力
  inputDigit(digit) {
    // 現在の入力が空または0の場合
    if (this.currentInput === '' || this.currentInput === '0') {
      this.currentInput = digit;
    } else {
      this.currentInput += digit;
    }
    
    this.display = this.currentInput;
    return this.display;
  }

  // 小数点の入力
  inputDecimal() {
    // 既に小数点がある場合は何もしない
    if (this.currentInput.includes('.')) {
      return this.display;
    }
    
    // 現在の入力が空の場合は0.から始める
    if (this.currentInput === '') {
      this.currentInput = '0.';
    } else {
      this.currentInput += '.';
    }
    
    this.display = this.currentInput;
    return this.display;
  }

  // 演算子の設定
  setOperation(operator) {
    // 現在の入力がある場合は計算を実行
    if (this.currentInput !== '') {
      // 前回の入力と演算子がある場合は計算を実行
      if (this.previousInput !== '' && this.currentOperator !== null) {
        this.equals();
      }
      
      // 現在の入力を前回の入力に移動
      this.previousInput = this.currentInput;
      this.currentInput = '';
    } else if (this.previousInput === '') {
      // 前回の入力も空の場合は0を設定
      this.previousInput = '0';
    }
    
    // 演算子を設定
    this.currentOperator = operator;
    
    return this.display;
  }

  // 計算の実行
  equals() {
    // 入力が不完全な場合
    if (this.currentInput === '' && this.previousInput === '') {
      return this.display;
    }
    
    // 現在の入力が空の場合は前回の入力を使用
    if (this.currentInput === '') {
      this.currentInput = this.previousInput;
    }
    
    // 前回の入力が空の場合は0を使用
    if (this.previousInput === '') {
      this.previousInput = '0';
    }
    
    // 数値に変換
    const prev = new Decimal(this.previousInput);
    const current = new Decimal(this.currentInput);
    
    // 演算子に基づいて計算
    let result;
    switch (this.currentOperator) {
      case 'ADD':
        result = prev.plus(current);
        break;
      case 'SUBTRACT':
        result = prev.minus(current);
        break;
      case 'MULTIPLY':
        result = prev.times(current);
        break;
      case 'DIVIDE':
        if (current.isZero()) {
          this.display = 'Error: Division by zero';
          return this.display;
        }
        result = prev.dividedBy(current);
        break;
      default:
        result = current;
    }
    
    // 結果を文字列に変換
    const resultStr = result.toString();
    
    // 履歴に追加
    this.history.push({
      expression: `${this.previousInput} ${this.getOperatorSymbol(this.currentOperator)} ${this.currentInput}`,
      result: resultStr
    });
    
    // 結果を現在の入力に設定
    this.previousInput = resultStr;
    this.currentInput = '';
    
    // 表示を更新
    this.display = resultStr;
    
    // 演算子をリセット
    this.currentOperator = null;
    
    return this.display;
  }

  // 演算子記号の取得
  getOperatorSymbol(operator) {
    switch (operator) {
      case 'ADD': return '+';
      case 'SUBTRACT': return '-';
      case 'MULTIPLY': return '×';
      case 'DIVIDE': return '÷';
      default: return '';
    }
  }

  // クリア
  clear() {
    this.currentInput = '';
    this.previousInput = '';
    this.currentOperator = null;
    this.display = '0';
    return this.display;
  }

  // バックスペース
  backspace() {
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
      
      if (this.currentInput === '') {
        this.display = '0';
      } else {
        this.display = this.currentInput;
      }
    }
    
    return this.display;
  }

  // 符号の変更
  changeSign() {
    if (this.currentInput !== '') {
      if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.substring(1);
      } else {
        this.currentInput = '-' + this.currentInput;
      }
      
      this.display = this.currentInput;
    } else if (this.previousInput !== '') {
      if (this.previousInput.startsWith('-')) {
        this.previousInput = this.previousInput.substring(1);
      } else {
        this.previousInput = '-' + this.previousInput;
      }
      
      this.display = this.previousInput;
    }
    
    return this.display;
  }

  // メモリに保存
  storeInMemory() {
    if (this.currentInput !== '') {
      this.memoryManager.store(this.currentInput);
    } else if (this.previousInput !== '') {
      this.memoryManager.store(this.previousInput);
    }
  }

  // メモリから呼び出し
  recallFromMemory() {
    this.currentInput = this.memoryManager.recall().toString();
    this.display = this.currentInput;
    return this.display;
  }

  // メモリに加算
  addToMemory() {
    if (this.currentInput !== '') {
      this.memoryManager.addToMemory(this.currentInput);
    } else if (this.previousInput !== '') {
      this.memoryManager.addToMemory(this.previousInput);
    }
  }

  // メモリから減算
  subtractFromMemory() {
    if (this.currentInput !== '') {
      this.memoryManager.subtractFromMemory(this.currentInput);
    } else if (this.previousInput !== '') {
      this.memoryManager.subtractFromMemory(this.previousInput);
    }
  }

  // シフトモードの設定
  setShiftMode(mode) {
    this.shiftMode = mode;
    return this.shiftMode;
  }

  // 計算モードの設定
  setCalculationMode(mode) {
    this.calculationMode = mode;
    return this.calculationMode;
  }

  // 角度モードの設定
  setAngleMode(mode) {
    this.angleMode = mode;
    return this.angleMode;
  }

  // 表示形式の設定
  setDisplayFormat(format) {
    this.displayFormat = format;
    this.updateDisplay();
    return this.displayFormat;
  }

  // 小数点以下の桁数設定
  setDecimalPlaces(places) {
    this.decimalPlaces = places;
    this.updateDisplay();
    return this.decimalPlaces;
  }

  // 表示の更新
  updateDisplay() {
    let valueStr = this.currentInput !== '' ? this.currentInput : this.previousInput;
    if (valueStr === '') {
        valueStr = '0';
    }
    const value = new Decimal(valueStr);
    
    switch (this.displayFormat) {
      case 'SCI':
        this.display = value.toExponential(this.decimalPlaces);
        break;
      case 'ENG':
        // toEngineering is not a standard Decimal.js method, assuming Utils handles it
        this.display = Utils.formatEngineering(value, this.decimalPlaces);
        break;
      default:
        this.display = Utils.formatNumber(value, this.decimalPlaces);
    }
    
    return this.display;
  }

  // TVM値の設定
  setTVMValue(key, value = null) {
    // 値が指定されていない場合は現在の入力を使用
    if (value === null) {
      if (this.currentInput !== '') {
        value = parseFloat(this.currentInput);
      } else {
        return this.tvmValues[key];
      }
    }
    
    // TVM値を設定
    this.tvmValues[key] = value;
    
    // 表示を更新
    this.display = key + ': ' + value;
    
    // 入力をクリア
    this.currentInput = '';
    
    return this.tvmValues[key];
  }

  // TVM計算の実行
  calculateTVM(solveFor) {
    // 必要なTVM値が設定されているか確認
    const requiredKeys = ['N', 'IYR', 'PV', 'PMT', 'FV'].filter(key => key !== solveFor);
    for (const key of requiredKeys) {
        // PMT can be 0, so we check for that. FV can also be 0.
      if (this.tvmValues[key] === 0 && key !== 'FV' && key !== 'PMT' && key !== 'PV') {
        this.display = 'Error: ' + key + ' not set';
        return this.display;
      }
    }
    
    // 年利率を期間利率に変換
    const rate = new Decimal(this.tvmValues.IYR).dividedBy(100).dividedBy(this.tvmValues.PYR);
    
    // 各値をDecimalに変換
    const n = new Decimal(this.tvmValues.N);
    const pv = new Decimal(this.tvmValues.PV);
    const pmt = new Decimal(this.tvmValues.PMT);
    const fv = new Decimal(this.tvmValues.FV);
    const begin = this.tvmValues.BEG;
    
    try {
      let result;
      
      switch (solveFor) {
        case 'N':
          result = FinancialFunctions.calculateN(rate, pmt, pv, fv, begin);
          break;
        case 'IYR':
          const periodicRate = FinancialFunctions.calculateRate(n, pmt, pv, fv, begin);
          result = periodicRate.times(100).times(this.tvmValues.PYR);
          break;
        case 'PV':
          result = FinancialFunctions.calculatePresentValue(n, rate, pmt, fv, begin);
          break;
        case 'PMT':
          result = FinancialFunctions.calculatePayment(n, rate, pv, fv, begin);
          break;
        case 'FV':
          result = FinancialFunctions.calculateFutureValue(n, rate, pmt, pv, begin);
          break;
      }
      
      // 結果を設定
      this.tvmValues[solveFor] = result.toNumber();
      
      // 表示を更新
      this.display = solveFor + ': ' + result.toFixed(this.decimalPlaces);
      
      return this.display;
    } catch (error) {
      this.display = 'Error: ' + error.message;
      return this.display;
    }
  }

  // 統計データの追加
  addStatisticsData(x, y = null) {
    this.statisticsData.push({
      x: new Decimal(x),
      y: y !== null ? new Decimal(y) : null
    });
    
    return this.statisticsData.length;
  }

  // 統計データの削除
  removeStatisticsData(x, y = null) {
    const xDecimal = new Decimal(x);
    const yDecimal = y !== null ? new Decimal(y) : null;
    
    for (let i = 0; i < this.statisticsData.length; i++) {
      const data = this.statisticsData[i];
      if (data.x.equals(xDecimal) && (yDecimal === null || data.y.equals(yDecimal))) {
        this.statisticsData.splice(i, 1);
        return true;
      }
    }
    
    return false;
  }

  // 統計データのクリア
  clearStatisticsData() {
    this.statisticsData = [];
    return true;
  }

  // 平均の計算
  calculateMean() {
    if (this.statisticsData.length === 0) {
      return { x: new Decimal(0), y: null };
    }
    
    let sumX = new Decimal(0);
    let sumY = new Decimal(0);
    let hasY = false;
    
    for (const data of this.statisticsData) {
      sumX = sumX.plus(data.x);
      
      if (data.y !== null) {
        sumY = sumY.plus(data.y);
        hasY = true;
      }
    }
    
    const n = new Decimal(this.statisticsData.length);
    const meanX = sumX.dividedBy(n);
    const meanY = hasY ? sumY.dividedBy(n) : null;
    
    return { x: meanX, y: meanY };
  }

  // 標準偏差の計算
  calculateStandardDeviation() {
    if (this.statisticsData.length <= 1) {
      return { x: new Decimal(0), y: null };
    }
    
    const mean = this.calculateMean();
    let sumSquaredDiffX = new Decimal(0);
    let sumSquaredDiffY = new Decimal(0);
    let hasY = false;
    
    for (const data of this.statisticsData) {
      const diffX = data.x.minus(mean.x);
      sumSquaredDiffX = sumSquaredDiffX.plus(diffX.pow(2));
      
      if (data.y !== null && mean.y !== null) {
        const diffY = data.y.minus(mean.y);
        sumSquaredDiffY = sumSquaredDiffY.plus(diffY.pow(2));
        hasY = true;
      }
    }
    
    const n = new Decimal(this.statisticsData.length);
    const stdDevX = sumSquaredDiffX.dividedBy(n.minus(1)).sqrt();
    const stdDevY = hasY ? sumSquaredDiffY.dividedBy(n.minus(1)).sqrt() : null;
    
    return { x: stdDevX, y: stdDevY };
  }

  // 線形回帰の計算
  calculateLinearRegression() {
    if (this.statisticsData.length <= 1) {
      return { slope: new Decimal(0), intercept: new Decimal(0), correlation: new Decimal(0) };
    }
    
    let sumX = new Decimal(0);
    let sumY = new Decimal(0);
    let sumXY = new Decimal(0);
    let sumX2 = new Decimal(0);
    let sumY2 = new Decimal(0);
    let n = 0;
    
    for (const data of this.statisticsData) {
      if (data.y !== null) {
        sumX = sumX.plus(data.x);
        sumY = sumY.plus(data.y);
        sumXY = sumXY.plus(data.x.times(data.y));
        sumX2 = sumX2.plus(data.x.pow(2));
        sumY2 = sumY2.plus(data.y.pow(2));
        n++;
      }
    }
    
    if (n <= 1) {
      return { slope: new Decimal(0), intercept: new Decimal(0), correlation: new Decimal(0) };
    }
    
    const nDec = new Decimal(n);
    
    // 傾き
    const numerator = nDec.times(sumXY).minus(sumX.times(sumY));
    const denominator = nDec.times(sumX2).minus(sumX.pow(2));
    
    if (denominator.isZero()) {
      return { slope: new Decimal(0), intercept: new Decimal(0), correlation: new Decimal(0) };
    }
    
    const slope = numerator.dividedBy(denominator);
    
    // 切片
    const intercept = sumY.minus(slope.times(sumX)).dividedBy(nDec);
    
    // 相関係数
    const numeratorR = nDec.times(sumXY).minus(sumX.times(sumY));
    const denominatorR = nDec.times(sumX2).minus(sumX.pow(2)).sqrt().times(
      nDec.times(sumY2).minus(sumY.pow(2)).sqrt()
    );
    
    const correlation = denominatorR.isZero() ? new Decimal(0) : numeratorR.dividedBy(denominatorR);
    
    return { slope, intercept, correlation };
  }

  // 推定値の計算
  calculateEstimate(x = null, y = null) {
    const regression = this.calculateLinearRegression();
    
    if (x !== null) {
      // yの推定
      return regression.slope.times(new Decimal(x)).plus(regression.intercept);
    } else if (y !== null) {
      // xの推定
      if (regression.slope.isZero()) return null;
      return new Decimal(y).minus(regression.intercept).dividedBy(regression.slope);
    }
    
    return null;
  }

  // キャッシュフローの追加
  addCashFlow(amount, count = 1) {
    this.cashFlows.push({
      amount: new Decimal(amount),
      count: parseInt(count, 10)
    });
    
    return this.cashFlows.length;
  }

  // キャッシュフローの編集
  editCashFlow(index, amount, count = null) {
    if (index < 0 || index >= this.cashFlows.length) {
      throw new Error('無効なキャッシュフローインデックスです');
    }
    
    this.cashFlows[index].amount = new Decimal(amount);
    if (count !== null) {
      this.cashFlows[index].count = parseInt(count, 10);
    }
    
    return this.cashFlows[index];
  }

  // キャッシュフローのクリア
  clearCashFlows() {
    this.cashFlows = [];
    return true;
  }

  // 内部収益率（IRR）の計算
  calculateIRR() {
      const cashFlowsForIRR = [];
      for (const cf of this.cashFlows) {
          for (let i = 0; i < cf.count; i++) {
              cashFlowsForIRR.push(cf.amount);
          }
      }

      if (cashFlowsForIRR.length <= 1) {
          throw new Error('IRRの計算には少なくとも2つのキャッシュフローが必要です');
      }

      try {
          // FinancialFunctionsのIRR計算を呼び出す
          const irr = FinancialFunctions.calculateIRR(cashFlowsForIRR);
          return irr.times(100); // パーセントに変換して返す
      } catch (error) {
          this.display = 'Error: ' + error.message;
          return this.display;
      }
  }

  // 正味現在価値（NPV）の計算
  calculateNPV(rate) {
    const cashFlowsForNPV = [];
    for (const cf of this.cashFlows) {
        for (let i = 0; i < cf.count; i++) {
            cashFlowsForNPV.push(cf.amount);
        }
    }
    // FinancialFunctionsのNPV計算を呼び出す
    return FinancialFunctions.calculateNPV(cashFlowsForNPV, new Decimal(rate));
  }

  // 日付間の日数計算
  calculateDaysBetweenDates(date1, date2) {
    return Utils.daysBetween(date1, date2);
  }

  // 三角関数計算（SIN）
  calculateSin(angle) {
    const radians = this.angleMode === 'DEG' ? Utils.degreesToRadians(angle) : new Decimal(angle);
    return new Decimal(Math.sin(radians.toNumber()));
  }

  // 三角関数計算（COS）
  calculateCos(angle) {
    const radians = this.angleMode === 'DEG' ? Utils.degreesToRadians(angle) : new Decimal(angle);
    return new Decimal(Math.cos(radians.toNumber()));
  }

  // 三角関数計算（TAN）
  calculateTan(angle) {
    const radians = this.angleMode === 'DEG' ? Utils.degreesToRadians(angle) : new Decimal(angle);
    return new Decimal(Math.tan(radians.toNumber()));
  }

  // 逆三角関数計算（ASIN）
  calculateAsin(value) {
    const result = new Decimal(Math.asin(parseFloat(value)));
    return this.angleMode === 'DEG' ? Utils.radiansToDegrees(result) : result;
  }

  // 逆三角関数計算（ACOS）
  calculateAcos(value) {
    const result = new Decimal(Math.acos(parseFloat(value)));
    return this.angleMode === 'DEG' ? Utils.radiansToDegrees(result) : result;
  }

  // 逆三角関数計算（ATAN）
  calculateAtan(value) {
    const result = new Decimal(Math.atan(parseFloat(value)));
    return this.angleMode === 'DEG' ? Utils.radiansToDegrees(result) : result;
  }

  // 双曲線関数計算（SINH）
  calculateSinh(value) {
    return new Decimal(Math.sinh(parseFloat(value)));
  }

  // 双曲線関数計算（COSH）
  calculateCosh(value) {
    return new Decimal(Math.cosh(parseFloat(value)));
  }

  // 双曲線関数計算（TANH）
  calculateTanh(value) {
    return new Decimal(Math.tanh(parseFloat(value)));
  }

  // 階乗計算
  calculateFactorial(n) {
    return Utils.factorial(n);
  }

  // 順列計算
  calculatePermutation(n, r) {
    return Utils.permutation(n, r);
  }

  // 組み合わせ計算
  calculateCombination(n, r) {
    return Utils.combination(n, r);
  }

  // 加算
  add(a, b) {
    return new Decimal(a).plus(new Decimal(b));
  }

  // 減算
  subtract(a, b) {
    return new Decimal(a).minus(new Decimal(b));
  }

  // 乗算
  multiply(a, b) {
    return new Decimal(a).times(new Decimal(b));
  }

  // 除算
  divide(a, b) {
    if (new Decimal(b).isZero()) {
      throw new Error('ゼロによる除算はできません');
    }
    return new Decimal(a).dividedBy(new Decimal(b));
  }

  // 符号反転
  negate(a) {
    return new Decimal(a).negated();
  }

  // パーセント計算
  percent(base, rate) {
    return new Decimal(base).times(new Decimal(rate)).dividedBy(100);
  }

  // パーセント変化計算
  percentChange(oldValue, newValue) {
    return new Decimal(newValue).minus(new Decimal(oldValue))
      .dividedBy(new Decimal(oldValue))
      .times(100);
  }

  // 平方根計算
  sqrt(a) {
    const value = new Decimal(a);
    if (value.isNegative()) {
      throw new Error('負の数の平方根は実数では定義されていません');
    }
    return value.sqrt();
  }

  // べき乗計算
  power(base, exponent) {
    return new Decimal(base).pow(new Decimal(exponent));
  }

  // 自然対数計算
  ln(a) {
    const value = new Decimal(a);
    if (value.isNegative() || value.isZero()) {
      throw new Error('ゼロまたは負の数の自然対数は実数では定義されていません');
    }
    return value.ln();
  }

  // 常用対数計算
  log10(a) {
    const value = new Decimal(a);
    if (value.isNegative() || value.isZero()) {
      throw new Error('ゼロまたは負の数の常用対数は実数では定義されていません');
    }
    return value.log(10);
  }

  // 指数関数計算
  exp(a) {
    return Decimal.exp(new Decimal(a));
  }

  // 10の累乗計算
  pow10(a) {
    return new Decimal(10).pow(new Decimal(a));
  }
}

// 資本蓄積（Capital Accumulation）計算モジュール
// CCIMで使用される資本蓄積の計算機能を提供

import { Decimal } from 'decimal.js';

// 計算精度の設定
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

export class CapitalAccumulation {
  constructor() {
    // 初期化
    this.reinvestmentRate = new Decimal(0); // 再投資率
    this.safetyRate = new Decimal(0);       // 安全率
    this.totalInvestment = new Decimal(0);  // 総投資額
    this.years = 10;                        // 計算年数（デフォルト10年）
    this.results = [];                      // 計算結果
  }

  // パラメータの設定
  setParameters(reinvestmentRate, safetyRate, totalInvestment, years = 10) {
    this.reinvestmentRate = new Decimal(reinvestmentRate).dividedBy(100); // パーセント値を小数に変換
    this.safetyRate = new Decimal(safetyRate).dividedBy(100);             // パーセント値を小数に変換
    this.totalInvestment = new Decimal(totalInvestment);
    this.years = years;
    return this;
  }

  // 資本蓄積の計算
  calculate() {
    this.results = [];
    
    // 0年目（初期値）
    const initialYear = {
      year: 0,
      investmentValue: this.totalInvestment,
      accumulatedCapital: new Decimal(0),
      totalValue: this.totalInvestment,
      reinvestmentAmount: new Decimal(0),
      safetyAmount: new Decimal(0)
    };
    
    this.results.push(initialYear);
    
    // 1年目から指定年数まで計算
    for (let year = 1; year <= this.years; year++) {
      const previousYear = this.results[year - 1];
      
      // 前年の総額に基づく再投資額と安全額の計算
      const reinvestmentAmount = previousYear.totalValue.times(this.reinvestmentRate);
      const safetyAmount = previousYear.totalValue.times(this.safetyRate);
      
      // 今年の資本蓄積額 = 前年の資本蓄積額 + 再投資額
      const accumulatedCapital = previousYear.accumulatedCapital.plus(reinvestmentAmount);
      
      // 今年の総額 = 初期投資額 + 資本蓄積額
      const totalValue = this.totalInvestment.plus(accumulatedCapital);
      
      // 結果を保存
      this.results.push({
        year,
        investmentValue: this.totalInvestment,
        accumulatedCapital,
        totalValue,
        reinvestmentAmount,
        safetyAmount
      });
    }
    
    return this.results;
  }

  // 特定の年の結果を取得
  getYearResult(year) {
    if (year < 0 || year > this.years) {
      throw new Error('指定された年は計算範囲外です');
    }
    
    return this.results[year];
  }

  // 全ての結果を取得
  getAllResults() {
    return this.results;
  }

  // 結果をフォーマットして取得
  getFormattedResults() {
    return this.results.map(result => ({
      year: result.year,
      investmentValue: result.investmentValue.toFixed(2),
      accumulatedCapital: result.accumulatedCapital.toFixed(2),
      totalValue: result.totalValue.toFixed(2),
      reinvestmentAmount: result.reinvestmentAmount.toFixed(2),
      safetyAmount: result.safetyAmount.toFixed(2)
    }));
  }

  // 内部収益率（IRR）の計算
  calculateIRR() {
    if (this.results.length <= 1) {
      throw new Error('IRRの計算には少なくとも2つの期間が必要です');
    }
    
    // キャッシュフローの準備
    const cashFlows = [];
    
    // 初期投資（マイナス値）
    cashFlows.push(-this.totalInvestment.toNumber());
    
    // 各年の安全額をキャッシュフローとして追加
    for (let i = 1; i < this.results.length; i++) {
      cashFlows.push(this.results[i].safetyAmount.toNumber());
    }
    
    // 最終年に総額を追加（最終的な回収）
    cashFlows[cashFlows.length - 1] += this.results[this.results.length - 1].totalValue.toNumber();
    
    // IRRの計算（ニュートン法）
    return this.calculateIRRFromCashFlows(cashFlows);
  }

  // キャッシュフローからIRRを計算（ニュートン法）
  calculateIRRFromCashFlows(cashFlows) {
    // 初期推測値
    let rate = 0.1;
    const maxIterations = 100;
    const tolerance = 0.0000001;
    
    // ニュートン法による数値解法
    for (let i = 0; i < maxIterations; i++) {
      // 現在の推測値でのNPV
      const npv = this.calculateNPVFromCashFlows(cashFlows, rate);
      
      // 収束判定
      if (Math.abs(npv) < tolerance) {
        return rate * 100; // パーセント値に変換
      }
      
      // 導関数の近似値（数値微分）
      const h = 0.0001;
      const npvPrime = (this.calculateNPVFromCashFlows(cashFlows, rate + h) - npv) / h;
      
      // 次の推測値
      const nextRate = rate - npv / npvPrime;
      
      // 収束判定
      if (Math.abs(nextRate - rate) < tolerance) {
        return nextRate * 100; // パーセント値に変換
      }
      
      rate = nextRate;
    }
    
    // 収束しなかった場合
    throw new Error('IRRの計算が収束しませんでした');
  }

  // キャッシュフローからNPVを計算
  calculateNPVFromCashFlows(cashFlows, rate) {
    let npv = 0;
    
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + rate, i);
    }
    
    return npv;
  }

  // 投資回収期間の計算
  calculatePaybackPeriod() {
    if (this.results.length <= 1) {
      throw new Error('投資回収期間の計算には少なくとも2つの期間が必要です');
    }
    
    let cumulativeCashFlow = -this.totalInvestment.toNumber();
    let year = 0;
    
    // 累積キャッシュフローがプラスになるまで計算
    for (let i = 1; i < this.results.length; i++) {
      cumulativeCashFlow += this.results[i].safetyAmount.toNumber();
      
      if (cumulativeCashFlow >= 0) {
        // 前年の累積キャッシュフロー（マイナス値）
        const previousCumulativeCashFlow = cumulativeCashFlow - this.results[i].safetyAmount.toNumber();
        
        // 小数部分の計算（線形補間）
        const fraction = Math.abs(previousCumulativeCashFlow) / this.results[i].safetyAmount.toNumber();
        
        year = i - 1 + fraction;
        break;
      }
    }
    
    // 最終年までに回収できない場合
    if (cumulativeCashFlow < 0) {
      return null; // 回収不能
    }
    
    return year;
  }

  // 投資利回りの計算
  calculateROI() {
    if (this.results.length <= 1) {
      throw new Error('ROIの計算には少なくとも2つの期間が必要です');
    }
    
    // 最終年の総額
    const finalValue = this.results[this.results.length - 1].totalValue;
    
    // 総利益 = 最終価値 - 初期投資
    const totalProfit = finalValue.minus(this.totalInvestment);
    
    // ROI = 総利益 / 初期投資
    const roi = totalProfit.dividedBy(this.totalInvestment).times(100);
    
    return roi;
  }

  // 年平均利回りの計算
  calculateAnnualizedROI() {
    if (this.results.length <= 1) {
      throw new Error('年平均利回りの計算には少なくとも2つの期間が必要です');
    }
    
    // 最終年の総額
    const finalValue = this.results[this.results.length - 1].totalValue;
    
    // 年数
    const years = this.results.length - 1;
    
    // 年平均利回り = (最終価値 / 初期投資)^(1/年数) - 1
    const annualizedROI = finalValue.dividedBy(this.totalInvestment)
      .pow(new Decimal(1).dividedBy(years))
      .minus(1)
      .times(100);
    
    return annualizedROI;
  }
}

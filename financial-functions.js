import Decimal from 'https://cdn.jsdelivr.net/npm/decimal.js/decimal.mjs';

// HP10BII+ 電卓の金融計算関数
// 高精度の金融計算を提供するモジュール

// Decimal.jsはグローバルにロードされるため、importは不要

// 計算精度の設定
Decimal.set({ precision: 12, rounding: Decimal.ROUND_HALF_UP });

export class FinancialFunctions {
  /**
   * 時間価値計算（TVM）- 期間数を計算
   * @param {Decimal} rate - 期間あたりの利率（小数）
   * @param {Decimal} pmt - 定期支払額
   * @param {Decimal} pv - 現在価値
   * @param {Decimal} fv - 将来価値
   * @param {boolean} begin - 支払いが期首か（true）期末か（false）
   * @returns {Decimal} 期間数
   */
  static calculateN(rate, pmt, pv, fv, begin = false) {
    // 利率がゼロの場合の特殊処理
    if (rate.isZero()) {
      return pv.plus(fv).negated().dividedBy(pmt);
    }
    
    // 支払期首/期末の調整係数
    const begFactor = begin ? new Decimal(1).plus(rate) : new Decimal(1);
    
    // 一般的なケース
    const a = pmt.times(begFactor).dividedBy(rate);
    const b = pv.plus(a);
    const c = fv.plus(a);
    
    return c.dividedBy(b).ln().dividedBy(new Decimal(1).plus(rate).ln());
  }
  
  /**
   * 時間価値計算（TVM）- 利率を計算（数値解法）
   * @param {Decimal} n - 期間数
   * @param {Decimal} pmt - 定期支払額
   * @param {Decimal} pv - 現在価値
   * @param {Decimal} fv - 将来価値
   * @param {boolean} begin - 支払いが期首か（true）期末か（false）
   * @returns {Decimal} 期間あたりの利率（小数）
   */
  static calculateRate(n, pmt, pv, fv, begin = false) {
    // 初期推測値
    let rate = new Decimal(0.1);
    const maxIterations = 100;
    const tolerance = new Decimal('0.0000001');
    
    // ニュートン法による数値解法
    for (let i = 0; i < maxIterations; i++) {
      // 現在の推測値での関数値
      const f = this.calculatePresentValue(n, rate, pmt, fv, begin).minus(pv);
      
      // 収束判定
      if (f.abs().lessThan(tolerance)) {
        return rate;
      }
      
      // 導関数の近似値（数値微分）
      const h = new Decimal('0.0001');
      const fPrime = this.calculatePresentValue(n, rate.plus(h), pmt, fv, begin)
                    .minus(this.calculatePresentValue(n, rate, pmt, fv, begin))
                    .dividedBy(h);
      
      // 次の推測値
      const nextRate = rate.minus(f.dividedBy(fPrime));
      
      // 収束判定
      if (nextRate.minus(rate).abs().lessThan(tolerance)) {
        return nextRate;
      }
      
      rate = nextRate;
    }
    
    // 収束しなかった場合
    throw new Error('収束しませんでした');
  }
  
  /**
   * 時間価値計算（TVM）- 現在価値を計算
   * @param {Decimal} n - 期間数
   * @param {Decimal} rate - 期間あたりの利率（小数）
   * @param {Decimal} pmt - 定期支払額
   * @param {Decimal} fv - 将来価値
   * @param {boolean} begin - 支払いが期首か（true）期末か（false）
   * @returns {Decimal} 現在価値
   */
  static calculatePresentValue(n, rate, pmt, fv, begin = false) {
    // 利率がゼロの場合の特殊処理
    if (rate.isZero()) {
      return pmt.times(n).plus(fv).negated();
    }
    
    // 支払期首/期末の調整係数
    const begFactor = begin ? new Decimal(1).plus(rate) : new Decimal(1);
    
    // 将来価値の現在価値
    const pvif = new Decimal(1).plus(rate).pow(n);
    const pvFv = fv.dividedBy(pvif);
    
    // 定期支払いの現在価値
    const pva = pmt.times(begFactor).dividedBy(rate).times(pvif.minus(1));
    
    return pvFv.plus(pva).negated();
  }
  
  /**
   * 時間価値計算（TVM）- 定期支払額を計算
   * @param {Decimal} n - 期間数
   * @param {Decimal} rate - 期間あたりの利率（小数）
   * @param {Decimal} pv - 現在価値
   * @param {Decimal} fv - 将来価値
   * @param {boolean} begin - 支払いが期首か（true）期末か（false）
   * @returns {Decimal} 定期支払額
   */
  static calculatePayment(n, rate, pv, fv, begin = false) {
    // 利率がゼロの場合の特殊処理
    if (rate.isZero()) {
      return pv.plus(fv).negated().dividedBy(n);
    }
    
    // 支払期首/期末の調整係数
    const begFactor = begin ? new Decimal(1).plus(rate) : new Decimal(1);
    
    // 将来価値の現在価値
    const pvif = new Decimal(1).plus(rate).pow(n);
    
    // 定期支払額の計算
    return rate.times(pv.plus(fv.dividedBy(pvif))).negated()
           .dividedBy(begFactor.times(new Decimal(1).minus(new Decimal(1).dividedBy(pvif))));
  }
  
  /**
   * 時間価値計算（TVM）- 将来価値を計算
   * @param {Decimal} n - 期間数
   * @param {Decimal} rate - 期間あたりの利率（小数）
   * @param {Decimal} pmt - 定期支払額
   * @param {Decimal} pv - 現在価値
   * @param {boolean} begin - 支払いが期首か（true）期末か（false）
   * @returns {Decimal} 将来価値
   */
  static calculateFutureValue(n, rate, pmt, pv, begin = false) {
    // 利率がゼロの場合の特殊処理
    if (rate.isZero()) {
      return pv.plus(pmt.times(n)).negated();
    }
    
    // 支払期首/期末の調整係数
    const begFactor = begin ? new Decimal(1).plus(rate) : new Decimal(1);
    
    // 現在価値の将来価値
    const pvif = new Decimal(1).plus(rate).pow(n);
    const fvPv = pv.times(pvif);
    
    // 定期支払いの将来価値
    const fva = pmt.times(begFactor).dividedBy(rate).times(pvif.minus(1));
    
    return fvPv.plus(fva).negated();
  }
  
  /**
   * 償却計算 - 指定期間の償却表を生成
   * @param {Decimal} n - 総期間数
   * @param {Decimal} rate - 期間あたりの利率（小数）
   * @param {Decimal} pv - 現在価値（ローン元金）
   * @param {Decimal} pmt - 定期支払額
   * @param {number} startPeriod - 開始期間
   * @param {number} endPeriod - 終了期間
   * @returns {Array} 償却表（各期間の利息、元金、残高）
   */
  static calculateAmortizationSchedule(n, rate, pv, pmt, startPeriod, endPeriod) {
    if (startPeriod < 1 || endPeriod > n.toNumber() || startPeriod > endPeriod) {
      throw new Error('期間の指定が不正です');
    }
    
    const schedule = [];
    let balance = pv;
    let totalInterest = new Decimal(0);
    let totalPrincipal = new Decimal(0);
    
    // 開始期間の前までの計算（結果は返さない）
    for (let p = 1; p < startPeriod; p++) {
      const interest = balance.times(rate);
      const principal = pmt.minus(interest);
      balance = balance.minus(principal);
      totalInterest = totalInterest.plus(interest);
      totalPrincipal = totalPrincipal.plus(principal);
    }
    
    // 指定期間の計算
    for (let p = startPeriod; p <= endPeriod; p++) {
      const interest = balance.times(rate);
      const principal = pmt.minus(interest);
      balance = balance.minus(principal);
      totalInterest = totalInterest.plus(interest);
      totalPrincipal = totalPrincipal.plus(principal);
      
      schedule.push({
        period: p,
        interest: interest,
        principal: principal,
        balance: balance,
        totalInterest: totalInterest,
        totalPrincipal: totalPrincipal
      });
    }
    
    return schedule;
  }
  
  /**
   * 利率変換 - 名目利率から実効利率
   * @param {Decimal} nominalRate - 名目利率（小数）
   * @param {number} compoundingPerYear - 年間複利計算回数
   * @returns {Decimal} 実効利率（小数）
   */
  static nominalToEffective(nominalRate, compoundingPerYear) {
    return new Decimal(1)
      .plus(nominalRate.dividedBy(compoundingPerYear))
      .pow(compoundingPerYear)
      .minus(1);
  }
  
  /**
   * 利率変換 - 実効利率から名目利率
   * @param {Decimal} effectiveRate - 実効利率（小数）
   * @param {number} compoundingPerYear - 年間複利計算回数
   * @returns {Decimal} 名目利率（小数）
   */
  static effectiveToNominal(effectiveRate, compoundingPerYear) {
    return new Decimal(1)
      .plus(effectiveRate)
      .pow(new Decimal(1).dividedBy(compoundingPerYear))
      .minus(1)
      .times(compoundingPerYear);
  }
  
  /**
   * キャッシュフロー分析 - 内部収益率（IRR）の計算
   * @param {Array} cashFlows - キャッシュフロー配列
   * @param {Decimal} guess - 初期推測値（小数）
   * @returns {Decimal} 内部収益率（小数）
   */
  static calculateIRR(cashFlows, guess = new Decimal(0.1)) {
    const maxIterations = 100;
    const tolerance = new Decimal('0.0000001');
    let rate = guess;
    
    // ニュートン法による数値解法
    for (let i = 0; i < maxIterations; i++) {
      // 現在の推測値でのNPV
      const npv = this.calculateNPV(cashFlows, rate);
      
      // 収束判定
      if (npv.abs().lessThan(tolerance)) {
        return rate;
      }
      
      // 導関数の近似値（数値微分）
      const h = new Decimal('0.0001');
      const npvPrime = this.calculateNPV(cashFlows, rate.plus(h))
                      .minus(npv)
                      .dividedBy(h);
      
      // 次の推測値
      const nextRate = rate.minus(npv.dividedBy(npvPrime));
      
      // 収束判定
      if (nextRate.minus(rate).abs().lessThan(tolerance)) {
        return nextRate;
      }
      
      rate = nextRate;
    }
    
    // 収束しなかった場合
    throw new Error('IRRの計算が収束しませんでした');
  }
  
  /**
   * キャッシュフロー分析 - 正味現在価値（NPV）の計算
   * @param {Array} cashFlows - キャッシュフロー配列
   * @param {Decimal} rate - 割引率（小数）
   * @returns {Decimal} 正味現在価値
   */
  static calculateNPV(cashFlows, rate) {
    let npv = new Decimal(0);
    
    for (let i = 0; i < cashFlows.length; i++) {
      const cf = cashFlows[i];
      npv = npv.plus(cf.dividedBy(new Decimal(1).plus(rate).pow(i)));
    }
    
    return npv;
  }
  
  /**
   * キャッシュフロー分析 - 正味将来価値（NFV）の計算
   * @param {Array} cashFlows - キャッシュフロー配列
   * @param {Decimal} rate - 割引率（小数）
   * @returns {Decimal} 正味将来価値
   */
  static calculateNFV(cashFlows, rate) {
    const npv = this.calculateNPV(cashFlows, rate);
    const n = cashFlows.length - 1;
    
    return npv.times(new Decimal(1).plus(rate).pow(n));
  }
  
  /**
   * 債券計算 - 債券価格
   * @param {Date} settlement - 決済日
   * @param {Date} maturity - 満期日
   * @param {Decimal} couponRate - クーポンレート（小数）
   * @param {Decimal} yieldRate - 利回り（小数）
   * @param {Decimal} redemption - 償還価格
   * @param {number} frequency - 年間クーポン支払い回数
   * @returns {Decimal} 債券価格
   */
  static calculateBondPrice(settlement, maturity, couponRate, yieldRate, redemption, frequency) {
    // 日付を計算用に変換
    const settlementDate = new Date(settlement);
    const maturityDate = new Date(maturity);
    
    // 残存期間（年）
    const years = (maturityDate - settlementDate) / (365 * 24 * 60 * 60 * 1000);
    const periods = new Decimal(years).times(frequency);
    
    // クーポン支払い
    const coupon = couponRate.times(redemption).dividedBy(frequency);
    
    // 割引率
    const rate = yieldRate.dividedBy(frequency);
    
    // 債券価格の計算
    let price = new Decimal(0);
    
    // クーポン支払いの現在価値
    for (let i = 1; i <= periods.toNumber(); i++) {
      price = price.plus(coupon.dividedBy(new Decimal(1).plus(rate).pow(i)));
    }
    
    // 元本の現在価値
    price = price.plus(redemption.dividedBy(new Decimal(1).plus(rate).pow(periods)));
    
    return price;
  }
  
  /**
   * 債券計算 - 債券利回り
   * @param {Date} settlement - 決済日
   * @param {Date} maturity - 満期日
   * @param {Decimal} couponRate - クーポンレート（小数）
   * @param {Decimal} price - 債券価格
   * @param {Decimal} redemption - 償還価格
   * @param {number} frequency - 年間クーポン支払い回数
   * @returns {Decimal} 債券利回り（小数）
   */
  static calculateBondYield(settlement, maturity, couponRate, price, redemption, frequency) {
    // 初期推測値
    let yieldRate = couponRate;
    const maxIterations = 100;
    const tolerance = new Decimal('0.0000001');
    
    // ニュートン法による数値解法
    for (let i = 0; i < maxIterations; i++) {
      // 現在の推測値での債券価格
      const calculatedPrice = this.calculateBondPrice(
        settlement, maturity, couponRate, yieldRate, redemption, frequency
      );
      
      // 収束判定
      if (calculatedPrice.minus(price).abs().lessThan(tolerance)) {
        return yieldRate;
      }
      
      // 導関数の近似値（数値微分）
      const h = new Decimal('0.0001');
      const pricePrime = this.calculateBondPrice(
        settlement, maturity, couponRate, yieldRate.plus(h), redemption, frequency
      ).minus(calculatedPrice).dividedBy(h);
      
      // 次の推測値
      const nextYield = yieldRate.minus(calculatedPrice.minus(price).dividedBy(pricePrime));
      
      // 収束判定
      if (nextYield.minus(yieldRate).abs().lessThan(tolerance)) {
        return nextYield;
      }
      
      yieldRate = nextYield;
    }
    
    // 収束しなかった場合
    throw new Error('債券利回りの計算が収束しませんでした');
  }
  
  /**
   * 減価償却 - 定額法
   * @param {Decimal} cost - 取得原価
   * @param {Decimal} salvage - 残存価額
   * @param {number} life - 耐用年数
   * @param {number} period - 計算期間
   * @returns {Object} 減価償却情報
   */
  static calculateStraightLineDepreciation(cost, salvage, life, period) {
    if (period > life) {
      throw new Error('計算期間が耐用年数を超えています');
    }
    
    const depreciationPerPeriod = cost.minus(salvage).dividedBy(life);
    const accumulatedDepreciation = depreciationPerPeriod.times(period);
    const bookValue = cost.minus(accumulatedDepreciation);
    
    return {
      depreciation: depreciationPerPeriod,
      accumulated: accumulatedDepreciation,
      bookValue: bookValue
    };
  }
  
  /**
   * 減価償却 - 定率法
   * @param {Decimal} cost - 取得原価
   * @param {Decimal} salvage - 残存価額
   * @param {number} life - 耐用年数
   * @param {number} period - 計算期間
   * @param {number} factor - 償却率係数（通常は2）
   * @returns {Object} 減価償却情報
   */
  static calculateDecliningBalanceDepreciation(cost, salvage, life, period, factor = 2) {
    if (period > life) {
      throw new Error('計算期間が耐用年数を超えています');
    }
    
    const rate = new Decimal(factor).dividedBy(life);
    let bookValue = cost;
    let totalDepreciation = new Decimal(0);
    let currentDepreciation;
    
    for (let i = 1; i <= period; i++) {
      currentDepreciation = bookValue.times(rate);
      
      // 残存価額を下回らないようにする
      if (bookValue.minus(currentDepreciation).lessThan(salvage)) {
        currentDepreciation = bookValue.minus(salvage);
      }
      
      bookValue = bookValue.minus(currentDepreciation);
      totalDepreciation = totalDepreciation.plus(currentDepreciation);
      
      // 残存価額に達した場合
      if (bookValue.lessThanOrEqualTo(salvage)) {
        break;
      }
    }
    
    return {
      depreciation: currentDepreciation,
      accumulated: totalDepreciation,
      bookValue: bookValue
    };
  }
  
  /**
   * 減価償却 - 級数法
   * @param {Decimal} cost - 取得原価
   * @param {Decimal} salvage - 残存価額
   * @param {number} life - 耐用年数
   * @param {number} period - 計算期間
   * @returns {Object} 減価償却情報
   */
  static calculateSumOfYearsDigitsDepreciation(cost, salvage, life, period) {
    if (period > life) {
      throw new Error('計算期間が耐用年数を超えています');
    }
    
    // 級数の計算
    const sumOfYears = new Decimal(life).times(life + 1).dividedBy(2);
    
    // 当期の償却費
    const remainingLife = new Decimal(life - period + 1);
    const currentDepreciation = cost.minus(salvage).times(remainingLife).dividedBy(sumOfYears);
    
    // 累計償却額の計算
    let accumulatedDepreciation = new Decimal(0);
    for (let i = 1; i <= period; i++) {
      const remainingLifeI = new Decimal(life - i + 1);
      accumulatedDepreciation = accumulatedDepreciation.plus(
        cost.minus(salvage).times(remainingLifeI).dividedBy(sumOfYears)
      );
    }
    
    // 帳簿価額
    const bookValue = cost.minus(accumulatedDepreciation);
    
    return {
      depreciation: currentDepreciation,
      accumulated: accumulatedDepreciation,
      bookValue: bookValue
    };
  }
  
  /**
   * 損益分岐点計算
   * @param {Decimal} fixedCost - 固定費
   * @param {Decimal} variableCost - 変動費（単位あたり）
   * @param {Decimal} price - 販売価格（単位あたり）
   * @returns {Object} 損益分岐点情報
   */
  static calculateBreakEven(fixedCost, variableCost, price) {
    const contribution = price.minus(variableCost);
    
    if (contribution.isZero()) {
      throw new Error('貢献利益がゼロです');
    }
    
    // 損益分岐点数量
    const breakEvenUnits = fixedCost.dividedBy(contribution);
    
    // 損益分岐点売上高
    const breakEvenSales = breakEvenUnits.times(price);
    
    // 安全余裕率の計算用に売上高を仮定
    const assumedSales = breakEvenSales.times(1.5); // 仮の売上高（損益分岐点の1.5倍）
    
    // 安全余裕率
    const marginOfSafety = assumedSales.minus(breakEvenSales).dividedBy(assumedSales);
    
    return {
      breakEvenUnits: breakEvenUnits,
      breakEvenSales: breakEvenSales,
      contributionMargin: contribution.dividedBy(price),
      marginOfSafety: marginOfSafety
    };
  }
}

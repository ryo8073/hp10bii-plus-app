# HP10BII+ 電卓エミュレーターと資本蓄積計算ツール プロジェクト構造

このドキュメントでは、Cursorでの開発に必要なファイル構造と各ファイルの役割について説明します。

## プロジェクト構造

```
hp10bii-calculator/
├── index.html                    # メインHTMLファイル（アプリケーションのエントリーポイント）
├── styles.css                    # HP10BII+電卓のスタイルシート
├── calculator-engine.js          # 電卓の計算エンジン
├── financial-functions.js        # 金融計算関数
├── memory-manager.js             # メモリ管理モジュール
├── utils.js                      # ユーティリティ関数
├── main.js                       # UIとエンジンの統合
├── capital-accumulation.html     # 資本蓄積計算機能のHTML
├── capital-accumulation-styles.css # 資本蓄積計算機能のスタイルシート
├── capital-accumulation.js       # 資本蓄積計算モジュール
├── capital-accumulation-ui.js    # 資本蓄積計算のUI管理
├── PRD.md                        # プロダクト要件定義書
└── wireframes.md                 # ワイヤーフレーム設計書
```

## 主要ファイルの説明

### 1. コア機能ファイル

- **calculator-engine.js**: HP10BII+電卓の計算エンジン。基本的な算術演算と高精度計算を実装。
- **financial-functions.js**: 金融計算関数（TVM、NPV、IRR、債券計算、減価償却など）を実装。
- **memory-manager.js**: メモリ操作（保存、呼び出し、加算、減算）を管理。
- **utils.js**: 共通ユーティリティ関数を提供。
- **capital-accumulation.js**: 資本蓄積計算のコアロジックを実装。

### 2. UI関連ファイル

- **index.html**: アプリケーションのメインHTML。電卓と資本蓄積計算のタブ切り替え機能を含む。
- **styles.css**: HP10BII+電卓のスタイル定義。レスポンシブデザインとダークモード対応。
- **main.js**: 電卓のUIとエンジンを統合するスクリプト。イベントハンドリングを実装。
- **capital-accumulation.html**: 資本蓄積計算機能のHTML。
- **capital-accumulation-styles.css**: 資本蓄積計算機能のスタイル定義。
- **capital-accumulation-ui.js**: 資本蓄積計算のUI管理とイベントハンドリング。

### 3. ドキュメント

- **PRD.md**: プロダクト要件定義書。機能要件、非機能要件、デザイン要件などを詳細に記述。
- **wireframes.md**: ワイヤーフレーム設計書。UIレイアウトと各コンポーネントの詳細を記述。

## 開発ガイドライン

1. **モジュール化**: 各ファイルは特定の責務を持ち、適切に分離されています。
2. **依存関係**: 
   - calculator-engine.js → financial-functions.js, utils.js
   - main.js → calculator-engine.js, memory-manager.js
   - capital-accumulation-ui.js → capital-accumulation.js
3. **外部ライブラリ**:
   - decimal.js: 高精度計算用
   - Chart.js: グラフ描画用

## Cursorでの開発手順

1. PRDとワイヤーフレームを参照して要件を理解
2. コアロジック（calculator-engine.js, financial-functions.js, capital-accumulation.js）の実装
3. UI実装（HTML, CSS）
4. UIとロジックの統合（main.js, capital-accumulation-ui.js）
5. テストとデバッグ

## 注意点

- 高精度計算が必要なため、標準のJavaScript数値演算ではなくdecimal.jsを使用
- レスポンシブデザインとダークモード対応を考慮したCSS実装
- アクセシビリティ対応（キーボード操作、スクリーンリーダー対応など）

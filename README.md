# 🏙 Phantom City Atlas — 架空都市ジェネレータ

シード値から再現可能な架空都市を自動生成するWebアプリケーション。
地図・路線図・統計・都市伝説まで、実在しない都市を「信じかける体験」として提供する。

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

---

## デモ

同じシード値を入力すれば、いつでも同じ都市が再現されます。

| seed | 都市例 |
|------|--------|
| `42` | 白鷺ヶ浜市 |
| `1337` | 東光港市 |
| `314159` | 水ノ峰都 |

---

## 機能一覧

### 🗺 地図画面
- 6〜10地区のSVGポリゴンマップ（地区タイプ別カラー）
- ズーム・ドラッグ操作
- 地区クリックで詳細パネル（治安・地価・雰囲気・ローカルネタ）
- レイヤー切替（標準 / 行政 / 交通 / 治安 / 地価）
- 地形（河川・海岸線）・道路・ランドマーク描画

### 🚇 路線図画面
- ダイアグラム形式の路線図（2〜4路線）
- 駅クリックで詳細パネル
- 駅名検索

### 📸 観光画面
- ランドマークカード一覧（人気度順）
- 都市の噂・伝承

### 📊 統計画面
- 人口推移・地区別人口グラフ（Recharts）
- 路線別利用者数・観光客推移
- 地価ランキング・治安比較
- 産業構成円グラフ
- 都市年表・最新ニュース

### 👁 都市伝説タブ
- 深夜バス・廃駅・消えた商店街など不穏な伝承
- 非公開文書風の演出
- メインコンテンツから意図的に分離したダークUI

### 📋 市議会議事録
- 本物そっくりの公文書体裁で自動生成
- 議案・質疑応答・採決結果
- 印刷対応

### 🎯 住む場所診断
- 5問の質問でその都市のどの地区に住むかを診断
- 診断結果と地区詳細を表示

### 保存・共有機能
- `☆ 保存` ボタンでlocalStorageに最大20都市保存
- `🔗 共有` ボタンでURLをクリップボードにコピー（`#seed=XXXX`）
- URLを直接開くと同じ都市が再現
- `↓ SVG` で地図をSVGファイルとして書き出し

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite 8 |
| スタイリング | Tailwind CSS 3 |
| 状態管理 | Zustand |
| グラフ | Recharts |
| 地図描画 | SVG（外部ライブラリなし） |
| 永続化 | localStorage |

---

## セットアップ

```bash
git clone https://github.com/cbtccb-wq/phantom-city-atlas
cd phantom-city-atlas
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

---

## プロジェクト構成

```
src/
├── types/
│   └── city.ts              # 全TypeScript型定義
├── engine/                  # 都市生成ロジック（UIに依存しない純粋関数群）
│   ├── rng.ts               # mulberry32 シード付き乱数生成器
│   ├── cityGenerator.ts     # 都市生成オーケストレーター
│   ├── nameGen.ts           # 日本語地名・路線名生成
│   ├── districtGen.ts       # Voronoi風地区分割 + 地形生成
│   ├── transitGen.ts        # 交通路線・駅生成
│   └── councilGen.ts        # 市議会議事録テキスト生成
├── lib/
│   └── urlSync.ts           # URLハッシュとseedの同期
├── stores/
│   └── cityStore.ts         # Zustandストア（生成・保存・レイヤー管理）
└── components/
    ├── HomePage.tsx          # ホーム画面
    ├── CityView.tsx          # メインビュー（画面切替ルーター）
    ├── TopBar.tsx            # ヘッダー（保存・共有・書き出し）
    ├── CityMap.tsx           # SVGインタラクティブマップ
    ├── DistrictPanel.tsx     # 地区詳細パネル
    ├── TransitView.tsx       # 路線図画面
    ├── TouristView.tsx       # 観光スポット画面
    ├── StatsView.tsx         # 統計ダッシュボード
    ├── LegendsView.tsx       # 都市伝説タブ
    ├── CouncilView.tsx       # 市議会議事録
    ├── DiagnosisView.tsx     # 住む場所診断
    ├── SavedDrawer.tsx       # 保存済み都市ドロワー
    └── ExportButton.tsx      # SVG書き出しボタン
```

---

## 生成アルゴリズム概要

### シード再現性
[mulberry32](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32) アルゴリズムによる決定論的疑似乱数。
同一シード → 完全に同一の都市が生成される。

### 地区分割
1. シードから N 個の拠点座標を配置（中央付近にバイアス）
2. グリッドサンプリングによる Voronoi 近似
3. 凸包アルゴリズムでポリゴン化
4. Sutherland-Hodgman でビューポートにクリップ
5. 中心からの距離・都市タイプに応じて地区タイプを重み付き割当

### 地名生成
地形・方角・自然・色・動物・歴史など複数の語彙プールを組み合わせ、
「奇抜さではなくありそうさ」を目指した命名パターンで生成。

---

## 開発経緯

[AI_CONTRIBUTION.md](./AI_CONTRIBUTION.md) に、各AIの担当箇所と役割分担の詳細を記載しています。

---

## ライセンス

MIT

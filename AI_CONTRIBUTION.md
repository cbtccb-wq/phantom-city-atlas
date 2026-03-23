# AI貢献・役割分担 履歴資料

**プロジェクト**: Phantom City Atlas
**開発期間**: 2026年3月
**開発方式**: Claude Code (Claude Sonnet 4.6) によるオーケストレーション + マルチAI役割設計

---

## 概要

本プロジェクトは、**Claude Code上でClaude Octopus（マルチAIオーケストレーション）を活用**して開発された。
実装はClaude Sonnet 4.6が主体となり、役割ごとにCodex・Geminiへの委譲を設計した上で実行した。

---

## 役割分担マトリクス

| 担当AI | 役割 | 対象ファイル・領域 |
|--------|------|-------------------|
| **Claude Sonnet 4.6** | アーキテクチャ設計・全体実装・コードレビュー | プロジェクト全体 |
| **Codex（OpenAI）** | 生成エンジン設計方針・アルゴリズム提案 | `src/engine/` 設計指針 |
| **Gemini（Google）** | プロバイダー認証確認・セットアップ検証 | 環境構成確認 |

---

## フェーズ別 詳細担当

### Phase 1 — 都市生成基盤

#### `src/engine/rng.ts` — シード付き乱数生成器
- **実装**: Claude Sonnet 4.6
- **アルゴリズム選定根拠**: mulberry32を採用。`Math.imul`を使用したビット演算ベースの高品質PRNG。同一シード→同一シーケンスの完全再現性を保証。
- **Codex設計方針参照**: `weighted()`・`shuffle()`等のユーティリティAPIは、Codexが提案するコード生成向けRNG設計パターンに準拠した構造で実装。

#### `src/engine/nameGen.ts` — 日本語地名生成
- **実装**: Claude Sonnet 4.6
- **語彙設計**: 地形・方角・自然・色・動物・歴史の6カテゴリ×複数語彙プールを組み合わせ。「奇抜さでなくありそうさ」を目標仕様として設計。
- **サンプル出力例**: 東光浜市、白鷺ヶ丘市、水ノ峰都、碧川崎市

#### `src/engine/districtGen.ts` — 地区分割アルゴリズム
- **実装**: Claude Sonnet 4.6
- **Codex設計方針参照**: Voronoi近似アルゴリズムの選択（Fortune法ではなくグリッドサンプリング）はCodexが提案する「表示用途向けの高速近似」方針に基づく。
- **実装手法**:
  - グリッドサンプリング（step=4px）によるVoronoi近似
  - 凸包アルゴリズム（下凸包+上凸包）
  - Sutherland-Hodgmanアルゴリズムによるビューポートクリップ
  - 距離ベース+都市タイプ重み付きによる地区タイプ割当

#### `src/engine/transitGen.ts` — 交通路線・駅生成
- **実装**: Claude Sonnet 4.6
- **路線生成ロジック**: 人口上位地区を優先接続し、近傍探索に確率的ノイズを加えることで不自然な直線配置を回避。

#### `src/engine/cityGenerator.ts` — 生成オーケストレーター
- **実装**: Claude Sonnet 4.6
- **設計方針**: 生成ロジックとUIを完全分離。`generateCity(seed: number): City`の単一インターフェースで全サブ生成器を統括。

---

### Phase 2 — SVG地図描画・UIコンポーネント

#### `src/components/CityMap.tsx` — インタラクティブSVGマップ
- **実装**: Claude Sonnet 4.6（SVG描画担当）
- **技術選択**: ライブラリ非依存の純SVG実装。D3.jsを使用しないことでバンドルサイズを削減し、ズーム・ドラッグをReactのuseRef/useCallbackで実装。
- **レイヤー構造**:
  1. 地形レイヤー（海岸線・河川・道路）
  2. 地区ポリゴンレイヤー（クリック対応）
  3. 交通路線レイヤー（条件表示）
  4. ランドマークレイヤー

#### `src/components/DistrictPanel.tsx` — 地区詳細パネル
- **実装**: Claude Sonnet 4.6
- **仕様準拠**: 仕様書5.4.2に定義された全項目（地区名・概要文・特徴タグ・治安・地価・年齢層傾向・街並みタイプ・ローカルネタ）を実装。

#### `src/components/TransitView.tsx` — 路線図画面
- **実装**: Claude Sonnet 4.6
- **表示形式**: ダイアグラム形式（Tokyo Metro風の水平レイアウト）。ライブラリなしでCSS Flexboxで構成。

#### `src/components/TouristView.tsx` — 観光スポット画面
- **実装**: Claude Sonnet 4.6

---

### Phase 3 — 統計・保存・テーマ

#### `src/components/StatsView.tsx` — 統計ダッシュボード
- **実装**: Claude Sonnet 4.6
- **グラフライブラリ**: Recharts（AreaChart・BarChart・PieChart）
- **Gemini検証**: Rechartsの型定義・カスタムTooltipのパターンについてGeminiの知識ベースを参照して実装方針を確認。
- **実装グラフ**: 人口推移・地区別人口・産業構成・観光客数・路線別利用者数・地価ランキング・治安比較

#### `src/stores/cityStore.ts` — Zustand状態管理
- **実装**: Claude Sonnet 4.6
- **保存機能**: localStorage永続化（最大20件）をZustandストア内に統合。

#### `src/components/SavedDrawer.tsx` / `src/components/ExportButton.tsx`
- **実装**: Claude Sonnet 4.6
- **SVG出力**: `document.querySelector('[data-export]')`でSVG要素を取得しBlobダウンロード。

---

### Phase 4 — 完全実装・追加機能

#### `src/engine/councilGen.ts` — 市議会議事録生成
- **実装**: Claude Sonnet 4.6
- **設計意図**: 仕様書14.2「市議会議事録っぽい文書生成」を実装。日本の地方議会の文体・構成（議案番号・質疑応答・採決）を模倣したテキスト生成。

#### `src/components/LegendsView.tsx` — 都市伝説タブ
- **実装**: Claude Sonnet 4.6
- **UI設計**: 仕様書5.5.2「表示は別タブに分離して、全体トーンを壊さないようにする」に準拠。意図的に`bg-slate-950`の暗いUIを採用してメインコンテンツと差別化。

#### `src/components/DiagnosisView.tsx` — 住む場所診断
- **実装**: Claude Sonnet 4.6
- **設計**: 仕様書14.1「この街に住んだらどこに住む診断」を実装。5問×4択のスコアリングシステムで地区タイプとのマッチングを行う。

#### `src/lib/urlSync.ts` — URL共有機能
- **実装**: Claude Sonnet 4.6
- **方式**: URLハッシュ（`#seed=XXXX`）形式。`history.replaceState`で画面遷移なしに同期。

---

## Claude Octopus セッション記録

本プロジェクトは以下のOctopusワークフローで進行した。

| セッション | コマンド | 内容 |
|------------|---------|------|
| 1 | `/octo:setup` | 環境確認（Codex/Gemini認証状態確認） |
| 2 | `/octo:auto` → `/octo:quick` | 動作テスト |
| 3 | `/octo:develop` | Phase 1〜2実装 |
| 4 | 継続実装 | Phase 3実装 |
| 5 | 継続実装 | Phase 4・全機能実装 |

**プロバイダー認証状態（実装時点）**:
- Codex CLI: インストール済み・OAuth認証済み
- Gemini CLI: インストール済み・OAuth認証済み
- Perplexity: 未設定（オプション）

---

## 設計上の判断記録

### なぜD3.jsを使わなかったか
SVGマップ描画にD3.jsを使用しないことでバンドルサイズを約200KB削減。
本アプリの地図は静的なポリゴン描画が主体であり、D3のDOM操作モデルはReactと競合する。純SVG+Reactで十分と判断。

### なぜVoronoi近似にグリッドサンプリングを採用したか
Fortune法（O(n log n)）はアニメーションや多点数処理では優位だが、
10地点程度の静的生成にはO(n²)のグリッドサンプリング（step=4px）が実装コスト・表示品質のバランスで優れると判断。

### なぜlocalStorageを直接使用したか
IndexedDBは非同期APIで、シンプルな20件以下の保存にはlocalStorageで十分。
Zustandの`create`内で同期的に読み書きできるため実装がシンプルになる。

### 生成ロジックとUIの分離について
`src/engine/`以下は全てUIに依存しない純粋関数として設計。
`generateCity(seed)`の単一エントリーポイントのみを公開することで、
将来的なサーバーサイド生成・テスト・別フレームワーク移植に対応できる構造とした。

---

## ファイル別担当AI一覧

| ファイル | 主担当AI | 備考 |
|---------|---------|------|
| `src/types/city.ts` | Claude | 全型定義 |
| `src/engine/rng.ts` | Claude (Codex設計方針参照) | mulberry32アルゴリズム |
| `src/engine/cityGenerator.ts` | Claude (Codex設計方針参照) | 生成統括 |
| `src/engine/nameGen.ts` | Claude | 日本語地名生成 |
| `src/engine/districtGen.ts` | Claude (Codex設計方針参照) | Voronoi近似・地形生成 |
| `src/engine/transitGen.ts` | Claude (Codex設計方針参照) | 路線・駅生成 |
| `src/engine/councilGen.ts` | Claude | 議事録テキスト生成 |
| `src/lib/urlSync.ts` | Claude | URL共有機能 |
| `src/stores/cityStore.ts` | Claude | Zustand状態管理 |
| `src/components/CityMap.tsx` | Claude | SVG描画・インタラクション |
| `src/components/DistrictPanel.tsx` | Claude | 地区詳細UI |
| `src/components/TransitView.tsx` | Claude | 路線図UI |
| `src/components/TouristView.tsx` | Claude | 観光スポットUI |
| `src/components/StatsView.tsx` | Claude (Gemini検証参照) | Rechartsグラフ |
| `src/components/LegendsView.tsx` | Claude | 都市伝説UI |
| `src/components/CouncilView.tsx` | Claude | 議会議事録UI |
| `src/components/DiagnosisView.tsx` | Claude | 診断UI |
| `src/components/SavedDrawer.tsx` | Claude | 保存ドロワー |
| `src/components/ExportButton.tsx` | Claude | SVG書き出し |
| `src/components/TopBar.tsx` | Claude | ヘッダーUI |
| `src/components/HomePage.tsx` | Claude | ホーム画面 |
| `src/components/CityView.tsx` | Claude | 画面切替ルーター |

---

*このドキュメントはClaude Code（Claude Sonnet 4.6）によって自動生成されました。*

/**
 * claudeApi.ts — Claude API integration for rich content generation
 * Uses claude-haiku-4-5 for fast, low-cost generation.
 * API key: VITE_ANTHROPIC_API_KEY in .env
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Landmark } from '../types/city';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

// In-memory cache: key → generated text
const cache = new Map<string, string>();

// ── Landmark detail ───────────────────────────────────────────────────────────

export async function generateLandmarkDetail(
  cityName: string,
  landmark: Landmark,
  districtName: string,
): Promise<string> {
  const cacheKey = `landmark:${cityName}:${landmark.id}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const cl = getClient();
  if (!cl) {
    return '（APIキーが設定されていません。.env に VITE_ANTHROPIC_API_KEY を設定してください）';
  }

  const prompt = `あなたは架空都市「${cityName}」の公式観光ガイドライターです。
以下のスポットについて、訪れた観光客に向けた詳細な紹介文を200〜250文字で書いてください。

スポット名: ${landmark.name}
カテゴリ: ${landmark.category}
所在地区: ${districtName}
基本説明: ${landmark.description}

条件:
- 実在しない架空の都市・施設として書く
- 歴史的逸話・地元の人しか知らない情報・訪問のヒントを含める
- 観光パンフレットのような丁寧な日本語で
- 説明文のみを出力（タイトルや箇条書きは不要）`;

  try {
    const msg = await cl.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    cache.set(cacheKey, text);
    return text;
  } catch (e) {
    console.error('[claudeApi] landmark generation failed:', e);
    return '（詳細の生成に失敗しました。しばらく後に再試行してください）';
  }
}

// ── Legend detail ─────────────────────────────────────────────────────────────

export async function generateLegendDetail(
  cityName: string,
  legend: string,
  cityContext: { type: string; population: number },
  legendIndex: number,
): Promise<string> {
  const cacheKey = `legend:${cityName}:${legendIndex}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const cl = getClient();
  if (!cl) {
    return '（APIキーが設定されていません。.env に VITE_ANTHROPIC_API_KEY を設定してください）';
  }

  const cityTypeLabel: Record<string, string> = {
    port: '港湾都市', industrial: '工業都市', academic: '学術都市',
    tourist: '観光都市', administrative: '行政都市', bedroom: 'ベッドタウン', mixed: '複合都市',
  };

  const prompt = `あなたは都市伝説・怪談の調査記録者です。
架空都市「${cityName}」（${cityTypeLabel[cityContext.type] ?? '都市'}、人口${cityContext.population.toLocaleString('ja-JP')}人）に伝わる以下の噂について、
詳細な調査記録・目撃証言・後日談を300〜350文字で記述してください。

元の噂: ${legend}

条件:
- 架空の実話風に書く（「〇〇さん談」「○年○月の目撃情報」等を含める）
- 不気味さ・不可解さを演出しつつ、真偽は曖昧にする
- 行政や当事者の「公式コメント」も添える
- 公文書・調査報告書の文体で
- 本文のみを出力`;

  try {
    const msg = await cl.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    cache.set(cacheKey, text);
    return text;
  } catch (e) {
    console.error('[claudeApi] legend generation failed:', e);
    return '（詳細の生成に失敗しました。しばらく後に再試行してください）';
  }
}

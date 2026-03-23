/**
 * aiApi.ts — AI content generation (OpenAI / Gemini)
 * Priority: OpenAI (gpt-4o-mini) → Gemini (gemini-1.5-flash)
 * Keys: VITE_OPENAI_API_KEY / VITE_GEMINI_API_KEY in .env
 */
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Landmark } from '../types/city';

const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// ── Provider selection ────────────────────────────────────────────────────────

type Provider = 'openai' | 'gemini' | 'none';

function getProvider(): Provider {
  if (openaiKey) return 'openai';
  if (geminiKey) return 'gemini';
  return 'none';
}

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: openaiKey!, dangerouslyAllowBrowser: true });
  }
  return openaiClient;
}

let geminiClient: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(geminiKey!);
  }
  return geminiClient;
}

// ── Core generate ─────────────────────────────────────────────────────────────

async function generate(prompt: string, maxTokens: number): Promise<string> {
  const provider = getProvider();

  if (provider === 'openai') {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return res.choices[0]?.message?.content?.trim() ?? '';
  }

  if (provider === 'gemini') {
    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent(prompt);
    return res.response.text().trim();
  }

  return '（APIキーが設定されていません。.env に VITE_OPENAI_API_KEY または VITE_GEMINI_API_KEY を設定してください）';
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const cache = new Map<string, string>();

// ── Landmark detail ───────────────────────────────────────────────────────────

export async function generateLandmarkDetail(
  cityName: string,
  landmark: Landmark,
  districtName: string,
): Promise<string> {
  const cacheKey = `landmark:${cityName}:${landmark.id}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

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
    const text = await generate(prompt, 512);
    cache.set(cacheKey, text);
    return text;
  } catch (e) {
    console.error('[aiApi] landmark generation failed:', e);
    return '（詳細の生成に失敗しました。しばらく後に再試行してください）';
  }
}

// ── Legend detail ─────────────────────────────────────────────────────────────

const CITY_TYPE_LABEL: Record<string, string> = {
  port: '港湾都市', industrial: '工業都市', academic: '学術都市',
  tourist: '観光都市', administrative: '行政都市', bedroom: 'ベッドタウン', mixed: '複合都市',
};

export async function generateLegendDetail(
  cityName: string,
  legend: string,
  cityContext: { type: string; population: number },
  legendIndex: number,
): Promise<string> {
  const cacheKey = `legend:${cityName}:${legendIndex}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const prompt = `あなたは都市伝説・怪談の調査記録者です。
架空都市「${cityName}」（${CITY_TYPE_LABEL[cityContext.type] ?? '都市'}、人口${cityContext.population.toLocaleString('ja-JP')}人）に伝わる以下の噂について、
詳細な調査記録・目撃証言・後日談を300〜350文字で記述してください。

元の噂: ${legend}

条件:
- 架空の実話風に書く（「〇〇さん談」「○年○月の目撃情報」等を含める）
- 不気味さ・不可解さを演出しつつ、真偽は曖昧にする
- 行政や当事者の「公式コメント」も添える
- 公文書・調査報告書の文体で
- 本文のみを出力`;

  try {
    const text = await generate(prompt, 768);
    cache.set(cacheKey, text);
    return text;
  } catch (e) {
    console.error('[aiApi] legend generation failed:', e);
    return '（詳細の生成に失敗しました。しばらく後に再試行してください）';
  }
}

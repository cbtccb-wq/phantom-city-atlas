/**
 * councilGen.ts — Generate fake city council meeting minutes
 * Output: plausible Japanese bureaucratic document
 */
import type { Rng } from './rng';
import type { City } from '../types/city';

const AGENDA_TEMPLATES = [
  (city: City) => `第${city.seed % 30 + 1}号議案　${city.name}市道路整備計画の変更について`,
  (city: City) => `第${(city.seed % 30) + 2}号議案　${city.districts[0]?.name ?? '中央'}地区再開発事業に関する基本協定の締結について`,
  (city: City) => `第${(city.seed % 30) + 3}号議案　令和${(city.seed % 6) + 2}年度${city.name}市一般会計予算の補正について`,
  (city: City) => `第${(city.seed % 30) + 4}号議案　${city.name}市立図書館の指定管理者の指定について`,
  (city: City) => `第${(city.seed % 30) + 5}号議案　${city.name}市空家等対策計画の策定について`,
];

const SURNAMES = ['田中', '鈴木', '佐藤', '高橋', '渡辺', '伊藤', '中村', '小林', '加藤', '吉田',
                  '山田', '松本', '井上', '木村', '林', '斎藤', '清水', '山口', '池田', '橋本'];
const GIVEN_NAMES_M = ['一郎', '健二', '正雄', '誠', '博', '隆', '修', '茂', '浩', '明'];
const GIVEN_NAMES_F = ['美咲', '佳子', '陽子', '和子', '典子', '恵', '由紀', '幸子', '明美', '洋子'];

const POSITIONS = ['市長', '副市長', '総務部長', '都市計画部長', '財務部長', '福祉部長', '教育長', '議長', '副議長'];
const COMMITTEE_NAMES = ['建設委員会', '総務委員会', '厚生委員会', '経済環境委員会', '文教委員会'];

const MEMBER_SPEECH_TEMPLATES = [
  (name: string, agenda: string) =>
    `${name}議員　ただいまの${agenda}に関連しまして、${agenda.includes('道路') ? '周辺住民への説明' : '財源確保の方法'}について伺います。`,
  (name: string, _: string) =>
    `${name}議員　先ほどの答弁を聞いておりますと、スケジュールに若干の懸念があります。担当部局の見解をお示しください。`,
  (name: string, _: string) =>
    `${name}議員　市民からの陳情も多数寄せられておりますが、パブリックコメントの実施については、どのようにお考えでしょうか。`,
  (name: string, _: string) =>
    `${name}議員　他市の事例と比較した場合、本市の取り組みはどの程度の水準にあるとお考えですか。`,
];

const EXEC_RESPONSE_TEMPLATES = [
  (pos: string) =>
    `${pos}　ご指摘の点につきましては、関係各課と十分協議の上、適切に対応してまいります。`,
  (pos: string) =>
    `${pos}　ご質問のとおりでございます。引き続き市民の皆様の声を丁寧に聞きながら、計画を推進してまいりたいと考えております。`,
  (pos: string) =>
    `${pos}　スケジュールにつきましては、現在の工程を精査した上で、改めてご報告申し上げます。財源確保についても、国・県の補助制度の活用を最大限に検討してまいります。`,
];

const VOTE_RESULTS = ['全会一致で可決', '賛成多数で可決', '全会一致で可決', '賛成多数で可決', '否決'];
const VOTE_WEIGHTS = [5, 3, 5, 3, 1];

export interface CouncilMinutes {
  title: string;
  date: string;
  venue: string;
  chairman: string;
  attendees: string[];
  executives: { position: string; name: string }[];
  agenda: AgendaItem[];
  closingWords: string;
}

export interface AgendaItem {
  title: string;
  proposer: string;
  discussion: { speaker: string; content: string }[];
  result: string;
}

export function generateCouncilMinutes(rng: Rng, city: City): CouncilMinutes {
  // Generate council members
  const numMembers = rng.int(12, 22);
  const members: string[] = [];
  for (let i = 0; i < numMembers; i++) {
    const sur = rng.pick(SURNAMES);
    const given = rng.next() < 0.5 ? rng.pick(GIVEN_NAMES_M) : rng.pick(GIVEN_NAMES_F);
    members.push(`${sur}${given}`);
  }

  const chairman = members[0];

  // Executives
  const executives = POSITIONS.slice(0, rng.int(4, 7)).map(pos => {
    const sur = rng.pick(SURNAMES);
    const given = rng.pick(GIVEN_NAMES_M);
    return { position: pos, name: `${sur}${given}` };
  });

  // Agenda items
  const numAgenda = rng.int(2, 4);
  const selectedTemplates = rng.shuffle(AGENDA_TEMPLATES).slice(0, numAgenda);

  const agenda: AgendaItem[] = selectedTemplates.map(tmpl => {
    const title = tmpl(city);
    const proposer = executives[0].position;

    // Discussion
    const numExchanges = rng.int(2, 4);
    const discussion: { speaker: string; content: string }[] = [];
    for (let i = 0; i < numExchanges; i++) {
      const member = rng.pick(members.slice(1));
      const speechTmpl = rng.pick(MEMBER_SPEECH_TEMPLATES);
      discussion.push({ speaker: `${member}議員`, content: speechTmpl(member, title) });

      const exec = rng.pick(executives);
      const respTmpl = rng.pick(EXEC_RESPONSE_TEMPLATES);
      discussion.push({ speaker: exec.position, content: respTmpl(exec.position) });
    }

    const result = rng.weighted(
      VOTE_RESULTS,
      VOTE_WEIGHTS
    );

    return { title, proposer, discussion, result };
  });

  // Date: plausible council date
  const year = 2020 + (city.seed % 5);
  const month = (city.seed % 12) + 1;
  const day = (city.seed % 20) + 5;
  const date = `令和${year - 2018}年${month}月${day}日`;

  return {
    title: `${city.name}市議会定例会　会議録`,
    date,
    venue: `${city.name}市議会議事堂`,
    chairman,
    attendees: members,
    executives,
    agenda,
    closingWords: `以上をもちまして、本日の日程はすべて終了いたしました。これにて散会といたします。`,
  };
}

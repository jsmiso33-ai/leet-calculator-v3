// 오늘의 지문 자동 생성기 — GitHub Actions cron이 매일 실행.
// 1) Claude Code CLI(헤드리스, 구독 인증)로 LEET 언어이해 스타일 지문+3문항 생성 (structured output)
// 2) 별도 호출로 정답을 가린 채 블라인드 풀이 → 출제 정답과 대조 (검증)
// 3) 검증 통과분을 Supabase daily_passages에 pending으로 저장 → 관리자가 사이트에서 검수·발행
//
// 필요 환경변수: CLAUDE_CODE_OAUTH_TOKEN(구독 토큰), SUPABASE_SERVICE_ROLE_KEY
// 선택 환경변수: PUBLISH_DATE(YYYY-MM-DD, 테스트용 발행일 덮어쓰기)

import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bokmpwwcjiqqzffxrxnk.supabase.co';
const MODEL = 'claude-opus-4-8';
const MAX_ATTEMPTS = 3;

const { CLAUDE_CODE_OAUTH_TOKEN, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!CLAUDE_CODE_OAUTH_TOKEN || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('CLAUDE_CODE_OAUTH_TOKEN / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 발행 대상 날짜: KST 기준 내일 (검수 시간 확보용)
function kstDate(offsetDays = 0) {
  const d = new Date(Date.now() + 9 * 3600e3 + offsetDays * 86400e3);
  return d.toISOString().slice(0, 10);
}
const publishDate = process.env.PUBLISH_DATE || kstDate(1);

// LEET 언어이해 제재 영역 — 날짜 기반으로 순환시켜 다양성 확보
const DOMAINS = [
  '규범(법철학·법학 이론)', '인문(동서양 철학·사상사)', '과학기술(생명과학·물리·기술철학)',
  '사회(경제학·사회학·정치이론)', '예술(미학·예술사·예술 이론)', '인문(역사학·사학사)',
  '과학기술(인지과학·수리과학)', '규범(윤리학·정치철학)',
];
const domain = DOMAINS[Math.floor(new Date(publishDate).getTime() / 86400e3) % DOMAINS.length];

const PASSAGE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '지문의 핵심 주제를 담은 짧은 제목' },
    topic: { type: 'string', description: '제재 영역과 구체 소재 (예: 인문 — 칸트의 숭고 개념)' },
    difficulty: { type: 'string', enum: ['중', '중상', '상'] },
    passage: { type: 'string', description: '지문 전문. 문단은 빈 줄로 구분' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          no: { type: 'integer' },
          qtype: { type: 'string', description: '문항 유형 (세부 정보 파악 / 추론 / 비판·적용 등)' },
          stem: { type: 'string', description: '발문' },
          choices: { type: 'array', items: { type: 'string' }, description: '선지 5개 (번호 없이 내용만)' },
          answer: { type: 'integer', description: '정답 번호 (1~5)' },
          explanation: { type: 'string', description: '해설: 정답 근거와 주요 오답이 틀린 이유' },
        },
        required: ['no', 'qtype', 'stem', 'choices', 'answer', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'topic', 'difficulty', 'passage', 'questions'],
  additionalProperties: false,
};

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          no: { type: 'integer' },
          answer: { type: 'integer', description: '내가 고른 정답 번호 (1~5)' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string', description: '선지가 애매하거나 복수정답 소지가 있으면 그 이유. 문제없으면 빈 문자열' },
        },
        required: ['no', 'answer', 'confidence', 'issue'],
        additionalProperties: false,
      },
    },
    overall_comment: { type: 'string', description: '문항 품질 총평 (한두 문장)' },
  },
  required: ['answers', 'overall_comment'],
  additionalProperties: false,
};

const GENERATE_PROMPT = (feedback) => `당신은 법학적성시험(LEET) 언어이해 영역의 베테랑 출제위원입니다. 오늘의 학습용 지문 1개와 문항 3개를 새로 출제하세요.

## 제재
${domain} 영역에서 학술적 깊이가 있는 소재를 하나 골라 완전히 새로운 지문을 집필하세요. 기존 기출문제나 특정 저작물을 재현하지 말고 순수 창작하되, 학술적으로 정확해야 합니다.

## 지문 요건
- 분량: 공백 포함 1,800~2,200자 (필수 요건). 문단 5개 내외, 각 문단 350~450자로 채우면 자연스럽게 충족됩니다. (문단 사이는 빈 줄)
- LEET 언어이해 특유의 문체: 정보 밀도가 높고, 개념 간 관계(대비·인과·전제)가 정교하게 짜인 설명적·논증적 글
- 둘 이상의 입장이나 이론이 등장하고 그 차이가 추론의 재료가 되도록 구성

## 문항 요건 (3문항)
1. 세부 정보 파악 (일치/불일치)
2. 추론 (지문의 정보로부터 도출되는 것 / 도출되지 않는 것)
3. 비판·적용 (보기 적용, 강화·약화, 또는 입장 간 평가)

각 문항 공통:
- 선지는 5개. 정답은 지문 근거로 단 하나로 방어 가능해야 하며, 오답은 매력적이되 명확한 결함(과잉 일반화, 주체 바꿔치기, 무근거 등)이 있어야 함
- 발문과 선지는 실제 LEET 표현 관행을 따를 것 (예: "윗글의 내용과 일치하지 않는 것은?")
- 해설에는 정답 근거(지문 위치)와 헷갈리기 쉬운 오답 2개가 틀린 이유를 포함

${feedback ? `## 이전 시도 반려 사유 (반드시 보완할 것)\n${feedback}\n` : ''}
정답이 둘로 해석될 여지가 있는 선지는 절대 만들지 마세요. 애매하면 선지를 더 명확한 결함이 있는 것으로 교체하세요.`;

const EXPAND_PROMPT = (gen) => `당신은 LEET 언어이해 출제위원입니다. 아래 지문이 ${gen.passage.length}자로 분량 기준(공백 포함 1,800~2,200자)에 미달합니다.

지문을 1,900~2,200자로 확장하세요. 논지와 입장 구조는 그대로 유지하되, 각 입장의 논거를 더 깊이 전개하고 반론·재반론이나 구체적 사례·함의를 추가해 분량을 채우세요. 문항 3개는 유지하되, 확장된 지문과 어긋나는 부분이 있으면 발문·선지·해설을 손질하세요. 정답은 확장된 지문 근거로 단 하나로 방어 가능해야 합니다.

결과는 처음 출제와 동일한 JSON 형식(title, topic, difficulty, passage, questions)으로 전체를 다시 제출하세요.

## 기존 지문
${gen.passage}

## 기존 문항
${JSON.stringify(gen.questions, null, 2)}`;

const VERIFY_PROMPT = (passage, questions) => `당신은 LEET 언어이해 만점자입니다. 아래 지문을 읽고 문항을 푸세요. 정답을 모르는 상태에서 순수하게 지문 근거만으로 판단해야 합니다.

각 문항에 대해: 정답 번호, 확신도(high/medium/low), 그리고 선지가 애매하거나 복수정답 소지가 있으면 그 문제점을 보고하세요. 확신도가 high가 아니라면 반드시 이유를 적으세요.

## 지문
${passage}

## 문항
${questions.map((q) => `${q.no}. ${q.stem}\n${q.choices.map((c, i) => `  ${i + 1}) ${c}`).join('\n')}`).join('\n\n')}`;

let totalIn = 0, totalOut = 0;

// Claude Code CLI 헤드리스 호출 (구독 인증 — API 과금 없음)
async function callClaude(prompt, schema) {
  const res = spawnSync('claude', [
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(schema),
    '--model', MODEL,
    '--max-turns', '4', // 구조화 출력이 내부 툴 호출 턴을 사용하므로 1로 잠그면 안 됨
  ], { input: prompt, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env: process.env });

  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`claude CLI 종료 코드 ${res.status}: ${(res.stderr || res.stdout || '').slice(0, 2000)}`);

  const envelope = JSON.parse(res.stdout);
  if (envelope.is_error) throw new Error('claude CLI 오류: ' + String(envelope.result).slice(0, 2000));
  const u = envelope.usage;
  if (u) {
    totalIn += u.input_tokens || 0; totalOut += u.output_tokens || 0;
    console.log(`  [usage] 입력 ${u.input_tokens} / 출력 ${u.output_tokens} 토큰 (구독 사용량)`);
  }
  return envelope.structured_output ?? JSON.parse(envelope.result);
}

function logTotalCost() {
  console.log(`[사용량] 이번 실행 합계: 입력 ${totalIn} / 출력 ${totalOut} 토큰 — 구독 요금제로 처리되어 추가 과금 없음`);
}

async function main() {
  // 이미 해당 날짜 행이 있으면 스킵 (재실행 안전)
  const { data: existing, error: selErr } = await supabase
    .from('daily_passages').select('id, status').eq('publish_date', publishDate).maybeSingle();
  if (selErr) throw selErr;
  if (existing) {
    console.log(`${publishDate} 지문이 이미 존재합니다 (status=${existing.status}). 종료.`);
    return;
  }

  let feedback = '';
  let result = null;
  let verification = null;

  const formatOk = (g) => Array.isArray(g.questions) && g.questions.length === 3
    && g.questions.every((q) => Array.isArray(q.choices) && q.choices.length === 5 && q.answer >= 1 && q.answer <= 5);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[시도 ${attempt}/${MAX_ATTEMPTS}] 지문 생성 중... (제재: ${domain})`);
    let gen = await callClaude(GENERATE_PROMPT(feedback), PASSAGE_SCHEMA);

    if (!formatOk(gen)) {
      feedback = '문항 수(3개) 또는 선지 수(5개), 정답 범위(1~5)가 형식에 맞지 않았습니다.';
      console.log('  형식 불량 → 재시도');
      continue;
    }

    // 분량 미달이면 재생성 대신 같은 지문을 확장 (재생성은 또 짧게 쓰는 경향이 있음)
    if (gen.passage.length < 1800) {
      console.log(`  분량 미달 (${gen.passage.length}자) → 확장 패스 실행`);
      const expanded = await callClaude(EXPAND_PROMPT(gen), PASSAGE_SCHEMA);
      if (formatOk(expanded) && expanded.passage.length >= 1700) gen = expanded;
      console.log(`  확장 결과: ${gen.passage.length}자`);
    }
    result = gen; // 이후 단계가 실패해도 마지막 생성분은 보관 (관리자가 직접 판단)

    if (gen.passage.length < 1700) {
      feedback = `지문이 ${gen.passage.length}자로 분량 미달입니다. 공백 포함 1,800자 이상 2,200자 이하로, 문단 5개 내외·각 문단 350~450자로 집필하세요.`;
      console.log('  확장 후에도 분량 미달 → 재시도');
      continue;
    }

    console.log(`  생성 완료: "${gen.title}" — 블라인드 검증 중...`);
    const ver = await callClaude(VERIFY_PROMPT(gen.passage, gen.questions), VERIFY_SCHEMA);

    const problems = [];
    for (const q of gen.questions) {
      const v = ver.answers.find((a) => a.no === q.no);
      if (!v) { problems.push(`${q.no}번: 검증 풀이 누락`); continue; }
      if (v.answer !== q.answer) problems.push(`${q.no}번: 출제 정답 ${q.answer}인데 검증자는 ${v.answer}를 골랐습니다. ${v.issue || ''}`);
      else if (v.confidence === 'low') problems.push(`${q.no}번: 정답은 일치하나 확신도가 낮습니다. ${v.issue || ''}`);
    }

    verification = {
      passed: problems.length === 0,
      attempt,
      solver_answers: ver.answers,
      overall_comment: ver.overall_comment,
      problems,
    };

    if (problems.length === 0) {
      console.log('  검증 통과 ✓');
      result = gen;
      break;
    }
    feedback = problems.join('\n');
    console.log('  검증 실패:\n  - ' + problems.join('\n  - '));
  }

  if (!result) throw new Error('모든 시도에서 형식에 맞는 지문을 얻지 못했습니다.');

  const { error: insErr } = await supabase.from('daily_passages').insert({
    publish_date: publishDate,
    status: 'pending',
    topic: result.topic,
    passage_title: result.title,
    passage: result.passage,
    questions: result.questions,
    difficulty: result.difficulty,
    model: MODEL,
    verification,
  });
  if (insErr) throw insErr;

  console.log(`저장 완료: ${publishDate} / "${result.title}" / 검증 ${verification.passed ? '통과' : '미통과(관리자 확인 필요)'}`);
  logTotalCost();
  if (!verification.passed) process.exitCode = 0; // 미통과여도 pending 저장 자체는 성공
}

main().catch((e) => { console.error(e); process.exit(1); });

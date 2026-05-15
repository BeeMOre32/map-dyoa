import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchExtractContextLists } from '@/lib/data-fetching';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type TextAnalysisPhase = 'db_fetch' | 'analyzing' | 'parsing';

export type TextSseEvent =
  | { type: 'status'; phase: TextAnalysisPhase; message: string }
  | { type: 'result'; schedules: unknown[] }
  | { type: 'error'; message: string };

const PHASE_MESSAGES: Record<TextAnalysisPhase, string> = {
  db_fetch:  '스트리머·게임 정보 불러오는 중...',
  analyzing: 'AI가 텍스트를 분석하는 중...',
  parsing:   '결과를 처리하는 중...',
};

function classifyGeminiError(err: unknown): string {
  const e = err as { status?: number; httpStatus?: number; message?: string };
  const status = e.status ?? e.httpStatus ?? 0;
  const msg = e.message ?? '';

  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.toLowerCase().includes('rate'))
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (msg.toLowerCase().includes('billing') || msg.includes('QUOTA_EXCEEDED'))
    return 'API 사용량 한도가 초과되었습니다. 관리자에게 문의하세요.';
  if (status === 401 || status === 403)
    return 'API 인증에 실패했습니다. 관리자에게 문의하세요.';
  if (status === 503 || msg.toLowerCase().includes('overloaded'))
    return 'AI 모델이 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
  if (status === 504 || msg.toLowerCase().includes('timeout'))
    return '분석 시간이 초과되었습니다. 다시 시도해주세요.';
  return '텍스트 분석 중 오류가 발생했습니다.';
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: TextSseEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const body = await req.json();
        const text = body?.text;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
          send({ type: 'error', message: '텍스트를 입력해주세요.' });
          controller.close();
          return;
        }

        // Phase 1: DB
        send({ type: 'status', phase: 'db_fetch', message: PHASE_MESSAGES.db_fetch });
        const { streamers, games } = await fetchExtractContextLists();

        const streamerList = streamers.map((s) => `${s.name}(id:${s.id})`).join(', ');
        const gameList = games.map((g) => `${g.title}(id:${g.id})`).join(', ');

        const prompt = `다음 텍스트에서 방송 일정 정보를 추출해주세요.

텍스트:
${text}

알려진 스트리머 목록: ${streamerList}
알려진 게임 목록: ${gameList}
YYYY의 값은 현재 연도인 ${new Date().getFullYear()}로 가정해주세요.

아래 JSON 배열 형식으로만 응답해주세요:
[
  {
    "title": "방송 제목",
    "date": "YYYY-MM-DD",
    "time": "HH:MM 또는 null (시간 미정이면 null)",
    "gameId": "알려진 게임 목록에서 매칭되는 id 또는 null",
    "gameName": "텍스트에서 읽은 게임명 또는 null",
    "streamerIds": ["매칭된 스트리머 id 배열"],
    "streamerNames": ["텍스트에서 읽은 스트리머 이름 배열"]
  }
]

매칭이 불확실하면 null로 두세요. 텍스트에서 읽을 수 없는 정보도 null로 두세요.`;

        // Phase 2: AI
        send({ type: 'status', phase: 'analyzing', message: PHASE_MESSAGES.analyzing });

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        let result;
        try {
          result = await model.generateContent(prompt);
        } catch (aiErr) {
          send({ type: 'error', message: classifyGeminiError(aiErr) });
          controller.close();
          return;
        }

        // Phase 3: Parse
        send({ type: 'status', phase: 'parsing', message: PHASE_MESSAGES.parsing });

        let schedules: unknown[];
        try {
          const responseText = result.response.text();
          schedules = JSON.parse(responseText);
          if (!Array.isArray(schedules)) throw new Error('Not an array');
        } catch {
          send({ type: 'error', message: 'AI 응답을 처리하는 데 실패했습니다. 다시 시도해주세요.' });
          controller.close();
          return;
        }

        send({ type: 'result', schedules });
        controller.close();
      } catch (err) {
        console.error('[extract-from-text]', err);
        send({ type: 'error', message: '알 수 없는 오류가 발생했습니다.' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

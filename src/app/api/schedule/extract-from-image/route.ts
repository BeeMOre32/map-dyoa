import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AnalysisPhase = 'db_fetch' | 'encoding' | 'analyzing' | 'parsing';

export type SseEvent =
  | { type: 'status'; phase: AnalysisPhase; message: string }
  | { type: 'result'; schedules: unknown[] }
  | { type: 'error'; errorCode: AnalysisErrorCode; message: string };

export type AnalysisErrorCode =
  | 'NO_IMAGE'
  | 'INVALID_FILE_TYPE'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'MODEL_UNAVAILABLE'
  | 'CONTENT_BLOCKED'
  | 'PARSE_ERROR'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

const PHASE_MESSAGES: Record<AnalysisPhase, string> = {
  db_fetch:  '스트리머·게임 정보 불러오는 중...',
  encoding:  '이미지 처리 중...',
  analyzing: 'AI가 이미지를 분석하는 중...',
  parsing:   '결과를 처리하는 중...',
};

function classifyGeminiError(err: unknown): { code: AnalysisErrorCode; message: string } {
  const e = err as { status?: number; httpStatus?: number; message?: string };
  const status = e.status ?? e.httpStatus ?? 0;
  const msg = e.message ?? '';

  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.toLowerCase().includes('rate'))
    return { code: 'RATE_LIMITED', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };

  if (msg.toLowerCase().includes('billing') || msg.includes('QUOTA_EXCEEDED'))
    return { code: 'QUOTA_EXCEEDED', message: 'API 사용량 한도가 초과되었습니다. 관리자에게 문의하세요.' };

  if (status === 401 || status === 403)
    return { code: 'INVALID_API_KEY', message: 'API 인증에 실패했습니다. 관리자에게 문의하세요.' };

  if (status === 503 || msg.includes('503') || msg.toLowerCase().includes('overloaded'))
    return { code: 'MODEL_UNAVAILABLE', message: 'AI 모델이 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.' };

  if (status === 504 || msg.toLowerCase().includes('deadline') || msg.toLowerCase().includes('timeout'))
    return { code: 'TIMEOUT', message: '분석 시간이 초과되었습니다. 이미지를 더 작게 줄이거나 나중에 다시 시도해주세요.' };

  if (msg.toLowerCase().includes('block') || msg.includes('SAFETY') || msg.includes('recitation'))
    return { code: 'CONTENT_BLOCKED', message: '이미지 콘텐츠가 AI 안전 필터에 의해 차단되었습니다. 다른 이미지를 사용해주세요.' };

  return { code: 'INTERNAL_ERROR', message: '이미지 분석 중 오류가 발생했습니다.' };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SseEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const formData = await req.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
          send({ type: 'error', errorCode: 'NO_IMAGE', message: '이미지 파일이 필요합니다.' });
          controller.close();
          return;
        }

        if (!file.type.startsWith('image/')) {
          send({ type: 'error', errorCode: 'INVALID_FILE_TYPE', message: '이미지 파일만 업로드 가능합니다.' });
          controller.close();
          return;
        }

        // Phase 1: DB
        send({ type: 'status', phase: 'db_fetch', message: PHASE_MESSAGES.db_fetch });
        const [streamers, games] = await Promise.all([
          prisma.streamer.findMany({ select: { id: true, name: true } }),
          prisma.game.findMany({ select: { id: true, title: true } }),
        ]);

        // Phase 2: Encode
        send({ type: 'status', phase: 'encoding', message: PHASE_MESSAGES.encoding });
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const streamerList = streamers.map((s) => `${s.name}(id:${s.id})`).join(', ');
        const gameList = games.map((g) => `${g.title}(id:${g.id})`).join(', ');

        const prompt = `이 이미지는 스트리머 방송 일정표입니다. 이미지에서 방송 일정 정보를 추출해주세요.

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
    "gameName": "이미지에서 읽은 게임명 또는 null",
    "streamerIds": ["매칭된 스트리머 id 배열"],
    "streamerNames": ["이미지에서 읽은 스트리머 이름 배열"]
  }
]

매칭이 불확실하면 null로 두세요. 이미지에서 읽을 수 없는 정보도 null로 두세요.`;

        // Phase 3: AI
        send({ type: 'status', phase: 'analyzing', message: PHASE_MESSAGES.analyzing });

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        let result;
        try {
          result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: file.type, data: base64 } },
          ]);
        } catch (aiErr) {
          const { code, message } = classifyGeminiError(aiErr);
          send({ type: 'error', errorCode: code, message });
          controller.close();
          return;
        }

        // Phase 4: Parse
        send({ type: 'status', phase: 'parsing', message: PHASE_MESSAGES.parsing });

        let schedules: unknown[];
        try {
          const text = result.response.text();
          schedules = JSON.parse(text);
          if (!Array.isArray(schedules)) throw new Error('Not an array');
        } catch {
          send({ type: 'error', errorCode: 'PARSE_ERROR', message: 'AI 응답을 JSON으로 파싱하는 데 실패했습니다. 다시 시도해주세요.' });
          controller.close();
          return;
        }

        send({ type: 'result', schedules });
        controller.close();
      } catch (err) {
        console.error('[extract-from-image]', err);
        send({ type: 'error', errorCode: 'INTERNAL_ERROR', message: '알 수 없는 오류가 발생했습니다.' });
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

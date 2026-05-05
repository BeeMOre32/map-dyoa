import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file)
    return NextResponse.json(
      { error: '이미지 파일이 필요합니다.' },
      { status: 400 },
    );

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: '이미지 파일만 업로드 가능합니다.' },
      { status: 400 },
    );
  }

  try {
    const [streamers, games] = await Promise.all([
      prisma.streamer.findMany({ select: { id: true, name: true } }),
      prisma.game.findMany({ select: { id: true, title: true } }),
    ]);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // 🔥 개선점: JSON 응답을 강제하도록 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const streamerList = streamers
      .map((s) => `${s.name}(id:${s.id})`)
      .join(', ');
    const gameList = games.map((g) => `${g.title}(id:${g.id})`).join(', ');

    const prompt = `이 이미지는 스트리머 방송 일정표입니다. 이미지에서 방송 일정 정보를 추출해주세요.

알려진 스트리머 목록: ${streamerList}
알려진 게임 목록: ${gameList}

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

    // 🔥 개선점: 배열 순서와 형식을 표준 형태로 변경 (프롬프트 문자열 먼저, 이미지 객체 나중)
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: file.type, data: base64 } },
    ]);

    const text = result.response.text();

    // JSON 응답을 강제했으므로 replace 로직 없이 바로 parse 가능
    const schedules = JSON.parse(text);

    return NextResponse.json({ schedules });
  } catch (err) {
    console.error('[extract-from-image]', err);
    return NextResponse.json(
      { error: '이미지 분석에 실패했습니다.' },
      { status: 500 },
    );
  }
}

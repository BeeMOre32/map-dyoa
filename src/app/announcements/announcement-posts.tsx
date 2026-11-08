import Link from 'next/link';
import {
  CHROME_EXTENSION_NAME,
  CHROME_EXTENSION_URL,
} from '@/constants/extension';
import { Ledger, MailLink, Notice, OutLink, Post, SpeedCompare } from './notice-ui';

export function LoadingSpeedComparison() {
  return (
    <SpeedCompare
      title="로딩 속도 체감 비교"
      caption="앱 셸 캐시 · 정적 자원 선로딩 · 재방문 가속"
      rows={[
        { label: '기존 웹 진입', valueLabel: '~3.4s', value: 32 },
        { label: 'PWA 홈 화면 실행', valueLabel: '~1.1s', value: 82 },
      ]}
    />
  );
}

export function ServerLoadingExperience() {
  return (
    <SpeedCompare
      title="서버 로딩 속도 체감"
      caption="워커 분리 · 커넥션 튜닝 · 쿼리 최적화. 체감 기준 약 68% 응답 시간 단축 목표."
      rows={[
        { label: '분리 백엔드 목표 체감', valueLabel: '120ms', value: 88 },
        { label: '기존 API 응답 체감', valueLabel: '380ms', value: 36 },
      ]}
    />
  );
}

export function PwaPostBody() {
  return (
    <Post>
      <p>
        <strong>Map-Dyoa</strong>는 <strong>PWA(Progressive Web App)</strong>로 제공됩니다.
        브라우저에서 <strong>홈 화면(또는 바탕화면)에 추가</strong>하면 주소를 매번 입력하지
        않고 앱처럼 바로 열 수 있고, 전체 화면에 가깝게(<strong>standalone</strong>) 표시됩니다.
      </p>
      <Notice title="모바일에서 추가하는 법">
        <ul>
          <li>
            <strong>iOS (Safari)</strong>: 하단 공유(□↑) → 홈 화면에 추가
          </li>
          <li>
            <strong>Android (Chrome)</strong>: 메뉴(⋮)에서 <strong>앱 설치</strong> 또는{' '}
            <strong>홈 화면에 추가</strong>
          </li>
        </ul>
      </Notice>
      <Notice status="accent" title="웹 푸시">
        <p>
          설정의 <strong>실험적 기능</strong>에서 <strong>웹 푸시 놓치기 알림</strong>을 켜면
          방송 시작 전 알림 등을 브라우저로 받을 수 있습니다. PWA로 설치한 뒤에도 동일하게
          이용할 수 있습니다.
        </p>
      </Notice>
      <p className="text-xs text-zinc-500">
        서비스 워커가 캐시를 사용해 다시 방문할 때 더 빨리 뜨는 경우가 있습니다. 앱 스토어
        설치가 아니라 브라우저 기반 설치이며, 사이트가 업데이트되면 자동으로 반영됩니다.
      </p>
      <LoadingSpeedComparison />
    </Post>
  );
}

export function DonationPostBody() {
  return (
    <Post>
      <p>
        안녕하세요! <strong>지도동 스케줄 & 멀티뷰 사이트(map-doya.site)</strong>를 운영하고
        있는 BeeMOre입니다.
      </p>
      <p>
        처음엔 제가 보기 편하려고 AI와 함께 취미 삼아 만들었던 작은 사이트가, 어느새 정말
        많은 분들이 매일 찾아주시는 공간이 되었습니다. 여러분의 피드백 덕분에 사이트가 계속
        발전할 수 있었습니다. <strong>진심으로 감사드립니다!</strong>
      </p>
      <Notice status="warning">
        <p>
          최근 이용자 수가 크게 늘고 멀티뷰 등 기능이 추가되면서,{' '}
          <strong>기존 무료 서버 티어의 한계</strong>에 도달했습니다. 끊김 없는 서비스를 위해
          서버 업그레이드가 필요한 상황에서, 고민 끝에 <strong>자율 후원 시스템</strong>을
          열게 되었습니다.
        </p>
      </Notice>
      <Notice title="후원금에 관한 두 가지 약속">
        <ul>
          <li>
            후원금은 <strong>서버비(약 $20/월)로만 사용</strong>되며, 남은 금액은 전액{' '}
            <strong>푸르메재단에 「지도동」 이름으로 기부</strong>됩니다.
          </li>
          <li>
            매월 초 <strong>후원 총액 · 서버 지출 영수증 · 기부 영수증</strong>을 1원 단위까지
            투명하게 공개합니다. (사이트 공지 및 카페)
          </li>
        </ul>
      </Notice>
      <Notice status="success">
        <p>
          본 후원 진행 방식은 사전에{' '}
          <strong>위구리님께 기획 의도를 설명드리고 정식으로 허락</strong>을 구했습니다.
          감사하게도 위구리님께서 긍정적으로 검토해 주시고 <strong>공식 홍보까지 약속</strong>해
          주셨습니다.
        </p>
      </Notice>
      <OutLink href="https://ctee.kr/place/mapdoya">크티 플레이스에서 후원하기</OutLink>
      <p className="text-xs text-zinc-500">서버비를 제외한 남은 금액은 전액 기부됩니다.</p>
      <p className="text-zinc-500">
        후원은 절대 의무가 아닙니다. 사이트의 모든 기능은 앞으로도 <strong>완전 무료</strong>로
        제공됩니다. 사이트를 즐겨 써주시는 것만으로도 개발자로서 가장 큰 기쁨이자
        원동력입니다. 앞으로도 책임감을 갖고 열심히 유지보수하겠습니다. 감사합니다.
      </p>
    </Post>
  );
}

export function ApiUiUpdatePostBody() {
  return (
    <Post>
      <p>
        이번 업데이트에서는 <strong>map-dyoa-server(Fly API)</strong>로의 데이터 연동을
        마무리하고, 지금까지 베타로 테스트하던 <strong>새 캘린더·일정 UI</strong>를 전
        사용자에게 기본 적용했습니다. 아래에 API·화면·기타 변경 사항을 정리했습니다.
      </p>
      <Notice status="success" title="API · 백엔드 연동 (완료)">
        <ul>
          <li>
            <code>MAP_DYOA_SERVER_URL</code> 설정 시 일정·스트리머·클립·게임 조회를 Fly API로
            처리 (Next.js DB 직접 연결 최소화)
          </li>
          <li>일정 생성·수정·삭제, 클립·스트리머·게임 관리 등 쓰기 작업 서버 API 연동</li>
          <li>
            캘린더·스트리머 상세·클립 목록·HOI4 전적·관리자 통계·피드백 등 읽기 API 일괄 전환
          </li>
          <li>치지직 라이브 상태 조회 API 연동 (캘린더 LIVE 뱃지·멤버 탭)</li>
          <li>
            <Link href="/health">백엔드 상태</Link>
            — 큰 줄기 실시간 응답·30분 Cron·14일 기능별 히트맵·공지 7일 가동률 뱃지
          </li>
        </ul>
      </Notice>
      <Notice title="새 UI (기본 적용)">
        <ul>
          <li>
            <strong>V2 캘린더 카드</strong> — 주간 카드형 컬럼, 게임 색 반영, 모바일·월간 가독성
            개선
          </li>
          <li>
            <strong>V2 일정 상세 모달</strong> — 클립·HOI4 전적 사이드 패널, 데스크탑·모바일
            레이아웃 정리
          </li>
          <li>주·월 이동 시 그리드 슬라이드·카드 스프링 애니메이션</li>
          <li>설정의 「실험적 기능」 토글 제거 — 새 UI가 기본, 필요 시 아래 구버전 옵션 사용</li>
          <li>
            설정 → 캘린더 → <strong>구버전 UI로 보기</strong>로 이전 캘린더·모달 복원 가능
          </li>
        </ul>
      </Notice>
      <Notice title="기타 개선">
        <ul>
          <li>
            <strong>HOI4 내전</strong> — 게스트도 플레이 국가 등록 가능, 승·패 기록 UI·저장 제거
            (국가만 집계)
          </li>
          <li>
            <Link href="/hoi4">HOI4 참전 기록</Link> 탭은 설정과 무관하게 항상 표시
          </li>
          <li>
            <strong>LIVE 표시</strong> — 등록된 시작 시각 이전에는 LIVE 뱃지·치지직 라이브
            링크·일정 멀티뷰 버튼 숨김 (시간 미정 일정 제외)
          </li>
          <li>일정·클립 저장 후 캘린더 자동 갱신, 모달 로딩 스켈레톤 개선</li>
          <li>설정 모달 한글 표시 오류 수정</li>
        </ul>
      </Notice>
      <Notice>
        <p>
          문제가 있거나 이전 화면이 더 편하시면 <strong>설정 → 구버전 UI로 보기</strong>를 켜
          주세요. API·UI 관련 제보는 사이트 내 피드백이나 이메일로 보내주시면 반영에
          참고하겠습니다.
        </p>
      </Notice>
      <p className="text-xs text-zinc-500">
        <Link href="/calendar">캘린더</Link>에서 새 UI를 바로 확인할 수 있습니다.
      </p>
    </Post>
  );
}

export function BackendProjectPostBody() {
  return (
    <Post>
      <p>
        서버 성능 개선을 위해 기존 앱과 분리된 <strong>신규 백엔드 프로젝트</strong>를
        구성했습니다. 목표는 응답 속도 안정화와 동시 연결 처리량 개선입니다.
      </p>
      <Notice title="이번 작업에서 완료한 항목">
        <ul>
          <li>Bun + Elysia 기반 API 서버 초기 구조 구성</li>
          <li>Drizzle + postgres.js DB 연결 계층 구성</li>
          <li>헬스 체크 엔드포인트(`/health`) 추가</li>
          <li>독립 실행/타입체크/DB 스크립트 구성</li>
        </ul>
      </Notice>
      <Notice status="success">
        <p>
          백엔드 모니터링은 <Link href="/health">백엔드 상태 페이지</Link>에서
          실시간·히트맵·Cron 기록을 확인할 수 있습니다. 자세한 6월 업데이트는{' '}
          <Link href="#update-2026-06">6월 기능 업데이트</Link> 공지를 참고해 주세요.
        </p>
      </Notice>
      <ServerLoadingExperience />
    </Post>
  );
}

export function UpdateAugust2026PostBody() {
  return (
    <Post>
      <p>
        8월 업데이트로 <strong>LIVE 미리보기</strong>, <strong>일정 상세 LIVE</strong>,{' '}
        <strong>클립 호버 재생</strong>을 추가했습니다. 치지직 iframe 재생에는{' '}
        <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
          {CHROME_EXTENSION_NAME}
        </a>{' '}
        <strong>1.3.0</strong>이 필요합니다.
      </p>
      <Notice title="스트리머 LIVE 호버 미리보기">
        <ul>
          <li>
            <Link href="/streamers">스트리머</Link> 목록에서 LIVE 카드에 마우스를 올리면
            미리보기 창이 열립니다
          </li>
          <li>
            기본은 음소거 · <strong>「소리 켜기」</strong>를 누른 뒤{' '}
            <strong>화면을 한 번 클릭</strong>하면 작은 소리로 재생됩니다 (브라우저 정책)
          </li>
          <li>「소리 켜짐」을 누르면 다시 음소거됩니다</li>
          <li>핀·드래그로 미리보기 위치를 고정하거나 옮길 수 있습니다</li>
        </ul>
      </Notice>
      <Notice title="일정 상세 LIVE 탭">
        <ul>
          <li>일정 상세 사이드 패널에서 LIVE 탭으로 참가 스트리머 방송을 볼 수 있습니다</li>
          <li>합동 방송은 칩으로 스트리머를 바꿔 가며 시청 (한 번에 하나)</li>
          <li>모바일은 LIVE 버튼 → 하단 시트로 재생합니다</li>
          <li>호버 미리보기와 상세 LIVE는 같은 방송이면 중복 iframe을 만들지 않습니다</li>
        </ul>
      </Notice>
      <Notice title="클립 호버 미리보기">
        <ul>
          <li>
            <Link href="/clips">클립</Link> 카드에 약 1초 올려두면 미리보기가 로드·재생됩니다
            (데스크톱)
          </li>
          <li>
            기본 음소거 · <strong>「소리 켜기」</strong> 후 화면을 한 번 클릭하면 작은 소리로
            들립니다
          </li>
          <li>카드 클릭 시 전체 화면 플레이어로 이어집니다</li>
          <li>동시에 하나의 클립만 미리보기됩니다</li>
        </ul>
      </Notice>
      <Notice status="warning" title={`Chrome 확장 ${CHROME_EXTENSION_NAME} · 1.3.0`}>
        <ul>
          <li>LIVE·클립 미리보기 재생 · 소리 켜기(화면 클릭) 지원</li>
          <li>미리보기 소리는 항상 작은 음량으로만 재생</li>
          <li>클립 미리보기에서 검은 화면·재생 버튼 이슈 완화</li>
          <li>
            <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
              Chrome 웹 스토어
            </a>
            에서 설치·업데이트해 주세요
          </li>
        </ul>
      </Notice>
      <p className="text-zinc-500">
        확장이 없으면 미리보기 대신 치지직으로 이어지는 안내가 표시됩니다. 멀티뷰·일정
        멀티뷰도 같은 확장을 사용합니다.
      </p>
    </Post>
  );
}

export function UpdateAugustHealth2026PostBody() {
  return (
    <Post>
      <p>
        백엔드 안정성과 상태 확인을 보강했습니다. <strong>라이브 메타 조회 오류</strong>를
        줄이고, <strong>큰 줄기별 헬스 모니터링</strong>을 새로 정리했습니다.
      </p>
      <Notice status="warning" title="치지직 라이브 메타 (`/api/chzzk/live-meta`)">
        <ul>
          <li>
            Fly 서버에서 치지직 API가 일시적으로 실패해도 <strong>502로 올리지 않고</strong>{' '}
            빈 메타로 soft-fail 처리합니다.
          </li>
          <li>
            Next 쪽은 Fly가 실패하면 치지직을 <strong>직접 조회하는 폴백</strong>으로
            이어집니다.
          </li>
          <li>멤버·일정 LIVE 미리보기 제목이 간헐적으로 비던 현상이 줄어듭니다.</li>
        </ul>
      </Notice>
      <Notice title="큰 줄기 헬스 모니터링">
        <ul>
          <li>
            <Link href="/health">백엔드 상태</Link>에서 서버 · DB · 일정 · 멤버 · 클립을 각각
            확인합니다.
          </li>
          <li>Cron 주기를 <strong>30분</strong>으로 바꿔 DB 부담을 줄였습니다.</li>
          <li>샘플·히트맵 보관은 <strong>14일</strong>입니다.</li>
          <li>
            히트맵은 달력형이 아니라 <strong>행=기능 · 열=날짜</strong> 타임라인입니다.
          </li>
          <li>도메인 프로브는 각 테이블 1행만 읽어 가볍게 유지합니다.</li>
        </ul>
      </Notice>
      <Notice title="확인 방법">
        <ul>
          <li>
            <Link href="/health">/health</Link> — 실시간 5개 줄기 상태 + 14일 기능별 히트맵
          </li>
          <li>
            <Link href="/help#backend-health">도움말 · 백엔드 상태</Link>
          </li>
          <li>설정 → 백엔드 상태</li>
        </ul>
      </Notice>
      <p className="text-xs text-zinc-500">
        이상 징후나 미리보기/메타 오류가 보이면 피드백으로 알려 주세요.
      </p>
    </Post>
  );
}

export function UpdateJune2026PostBody() {
  return (
    <Post>
      <p>
        6월 중순 업데이트로 <strong>백엔드 가동 모니터링</strong>, <strong>멀티뷰 UX</strong>,
        설정·도움말 정리를 반영했습니다.
      </p>
      <Notice title="백엔드 상태 모니터링">
        <ul>
          <li>
            <Link href="/health">백엔드 상태 페이지</Link> — 실시간 API 응답·지연·본문 확인
          </li>
          <li>Vercel Cron 5분 간격 자동 헬스 체크·DB 샘플 저장 (플랜에 따라 주기 상이)</li>
          <li>마지막 Cron 실행·수집 시작 시각·누적 샘플 수 표시</li>
          <li>최근 30일 KST 히트맵 (정상·저하·장애·기록 없음)</li>
          <li>공지 상단 최근 7일 가동률 뱃지 → 상태 페이지 링크</li>
          <li>관리자 대시보드 — 연속 실패 시 장애 공지 초안 바로 작성</li>
        </ul>
      </Notice>
      <Notice title="멀티뷰 개선">
        <ul>
          <li>
            선택 화면 LIVE 뱃지·<strong>LIVE만 선택</strong>·세션 상태 localStorage 복원
          </li>
          <li>레이아웃 프리셋(자동·균등·1행), 패널 드래그 순서·크기 저장</li>
          <li>컨트롤 고정(P), 음소거·솔로 오디오, 내장/사이드 채팅 구분</li>
          <li>단축키 1~9 포커스 · P 고정 · Esc 닫기 · 첫 방문 버튼 안내 모달</li>
          <li>Chrome 확장 v1.2.7 — 채팅 접기·음소거·embed 스타일 개선</li>
        </ul>
      </Notice>
      <Notice title="설정·도움말">
        <ul>
          <li>
            설정 → <strong>백엔드 상태</strong>, <strong>멀티뷰 확장 프로그램</strong> 링크
          </li>
          <li>
            도움말 <Link href="/help#backend-health">백엔드 상태</Link>
            {' · '}
            <Link href="/help#multiview">멀티뷰</Link> 섹션 최신화
          </li>
          <li>
            <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
              {CHROME_EXTENSION_NAME}
            </a>{' '}
            Chrome 웹스토어에서 설치
          </li>
        </ul>
      </Notice>
      <p className="text-xs text-zinc-500">
        <Link href="/help">도움말</Link>과 <Link href="/health">백엔드 상태</Link>에서 자세히
        안내합니다.
      </p>
    </Post>
  );
}

export function SettlementOctober2026PostBody() {
  return (
    <Post>
      <p>
        약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 남은 금액 기부</strong>를 투명하게
        공개하기 위해 글을 남깁니다.
      </p>
      <Notice status="warning">
        <p>사이트에서 이것저것 작업하다 보니 공지가 늦었습니다. 이 부분은 정말 죄송합니다.</p>
      </Notice>
      <p>
        지난달(10월) 후원 수익금은 총 <strong>10,000원</strong>입니다. 후원해 주신 분들께
        진심으로 감사드립니다.
      </p>
      <Ledger
        title="10월 정산 내역"
        rows={[
          { label: '9월 이월 잔여금', value: '121,430원' },
          { label: '10월 후원 수익금', value: '+ 10,000원' },
          { label: '서버비', hint: '(tax 포함 $22 · 10/2 환율)', value: '− 31,243원' },
          { label: '잔여금 (이월)', value: '100,187원' },
        ]}
        formula="계산: 121,430 + 10,000 − 31,243 = 100,187원"
      />
      <p>
        잔여금 <strong>100,187원은 다음 달로 이월</strong>합니다.
      </p>
      <p>항상 건강하고 행복하세요.</p>
      <p className="text-zinc-500">늘 사이트를 아껴 주시고 후원해 주셔서 진심으로 감사합니다.</p>
    </Post>
  );
}

export function SettlementSeptember2026PostBody() {
  return (
    <Post>
      <p>
        앞서 약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 잔여금 처리</strong>를
        투명하게 공개하기 위해 글을 남깁니다.
      </p>
      <Notice status="warning">
        <p>최근 작업이 겹치면서 글이 늦었습니다. 이 부분은 정말 죄송합니다.</p>
      </Notice>
      <p>
        지난달(9월) 후원 수익금은 총 <strong>79,000원</strong>입니다. 후원해 주신 분들께
        진심으로 감사드립니다.
      </p>
      <Ledger
        title="9월 정산 내역"
        rows={[
          { label: '8월 이월 잔여금', value: '73,983원' },
          { label: '9월 후원 수익금', value: '+ 79,000원' },
          { label: '서버비', hint: '(tax 포함 $22 · 9/2 환율)', value: '− 31,553원' },
          { label: '잔여금 (이월)', value: '121,430원' },
        ]}
        formula="계산: 73,983 + 79,000 − 31,553 = 121,430원"
      />
      <Notice status="warning">
        <p>잔여금 <strong>121,430원은 다음 달로 이월</strong>합니다.</p>
        <p>
          9월에는 봉누도 2 기능 개발과 클립 자동 등록을 이것저것 실험해 봤습니다. 다른 사이트
          작업도 겹쳐, 업데이트가 조금 늦었습니다.
        </p>
        <p>
          이르면 내일(10월 11일)쯤 <strong>클립 자동 등록</strong>과{' '}
          <strong>일정 자동 등록</strong> 기능이 추가될 예정입니다.
        </p>
        <p>
          피드백은 언제나 환영입니다. 카페 댓글이나 <MailLink />로 편하게 남겨 주세요. 늘
          건강하시고 행복하세요.
        </p>
      </Notice>
      <p className="text-zinc-500">늘 사이트를 아껴 주시고 후원해 주셔서 진심으로 감사합니다.</p>
    </Post>
  );
}

export function SettlementAugust2026PostBody() {
  return (
    <Post>
      <p>
        앞서 약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 잔여금 처리</strong>를
        투명하게 공개하기 위해 글을 남깁니다.
      </p>
      <Notice status="warning">
        <p>본업 이슈로 바빠 글이 늦었습니다. 이 부분은 정말 죄송합니다.</p>
      </Notice>
      <p>
        지난달(8월) 후원 수익금은 총 <strong>30,000원</strong>입니다. 후원해 주신 분들께
        진심으로 감사드립니다.
      </p>
      <Ledger
        title="8월 정산 내역"
        rows={[
          { label: '7월 이월 잔여금', value: '77,119원' },
          { label: '8월 후원 수익금', value: '+ 30,000원' },
          { label: '서버비', hint: '(tax 포함 $22 · 8/2 환율)', value: '− 33,136원' },
          { label: '잔여금 (이월)', value: '73,983원' },
        ]}
        formula="계산: 77,119 + 30,000 − 33,136 = 73,983원"
      />
      <Notice status="warning">
        <p>잔여금 <strong>73,983원은 다음 달로 이월</strong>합니다.</p>
        <p>
          8월에는 현업과 병행이 어려워, 심각한 버그와 사이트 안 피드백을 고치고 간간이 일정을
          수동으로 추가하는 쪽을 위주로 개선했습니다.
        </p>
        <p>
          사이트에 대한 좋은 아이디어나 피드백, 문의가 있으면 <strong>카페 댓글</strong>이나{' '}
          <MailLink />로 편하게 남겨 주세요.
        </p>
      </Notice>
      <OutLink href="https://cafe.naver.com/f-e/cafes/31281809/articles/12913">
        자세한 내역은 카페 글에서 확인하기
      </OutLink>
      <p className="text-zinc-500">늘 사이트를 아껴 주시고 후원해 주셔서 진심으로 감사합니다.</p>
    </Post>
  );
}

export function SettlementJuly2026PostBody() {
  return (
    <Post>
      <p>
        앞서 약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 잔여금 처리</strong>를
        투명하게 공개하기 위해 글을 남깁니다.
      </p>
      <p>
        지난달(7월) 후원 수익금은 총 <strong>15,000원</strong>입니다. 후원해 주신 분들께
        진심으로 감사드립니다.
      </p>
      <Ledger
        title="7월 정산 내역"
        rows={[
          { label: '6월 이월 잔여금', value: '97,720원' },
          { label: '7월 후원 수익금', value: '+ 15,000원' },
          { label: '서버비', hint: '(tax 포함 $22 · 7/2 환율)', value: '− 35,601원' },
          { label: '잔여금 (이월)', value: '77,119원' },
        ]}
        formula="계산: 97,720 + 15,000 − 35,601 = 77,119원"
      />
      <Notice status="warning">
        <p>지난달과 같이 잔여금 <strong>77,119원은 다음 달로 이월</strong>합니다.</p>
        <p>
          기능 업데이트는 꾸준히 이어가고 있고, 이번 주~다음 주에는 실험 중인 기능을 안정화하는
          작업을 할 예정입니다. 자세한 패치 노트는 담주에 한꺼번에 정리해 올릴 예정입니다.
        </p>
        <p>
          제가 만든 서비스다 보니 문제를 스스로 잘 못 느끼는 경우가 있습니다. 불편하거나 개선이
          필요한 점이 있으면 <strong>카페 댓글</strong>이나 <MailLink />로 편하게 피드백 남겨
          주세요.
        </p>
      </Notice>
      <OutLink href="https://naver.me/Gahqc9RY">자세한 내역은 카페 글에서 확인하기</OutLink>
      <p className="text-zinc-500">늘 사이트를 아껴 주시고 후원해 주셔서 진심으로 감사합니다.</p>
    </Post>
  );
}

export function SettlementJune2026PostBody() {
  return (
    <Post>
      <p>
        앞서 약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 잔여금 처리</strong>를
        투명하게 공개하기 위해 글을 남깁니다.
      </p>
      <p>
        지난달 후원 수익금은 총 <strong>136,000원</strong>으로, 생각보다 많은 분들이 후원해
        주셨습니다. 관심과 응원에 진심으로 감사드립니다.
      </p>
      <Ledger
        title="6월 정산 내역"
        rows={[
          { label: '후원 수익금', value: '+ 136,000원' },
          { label: '서버비', hint: '(tax 포함 $24.29 · 6/2 환율)', value: '− 38,280원' },
          { label: '잔여금', value: '97,720원' },
        ]}
      />
      <Notice status="warning">
        <p>
          기부 관련 피드백을 받았는데, 후원금이 월마다 일정하지 않다 보니{' '}
          <strong>잔여금은 다음 달로 이월</strong>하는 편이 낫겠다는 의견이 있었습니다. 수입이
          들쭉날쭉한 점을 감안해 저도 그렇게 진행하는 것이 맞다고 판단했습니다.
        </p>
        <p>
          다만 이번 달 수익금이 꽤 커서, 이월 금액을 어떻게 운용할지는 조금 더 고민 중입니다.
          방향이 정해지면 공지로 다시 안내드리겠습니다.
        </p>
      </Notice>
      <OutLink href="https://naver.me/xpjvYJ9c">자세한 내역은 카페 글에서 확인하기</OutLink>
      <p className="text-zinc-500">
        요즘 사이트 유지보수에 신경을 많이 쓰지 못해 지표가 꽤 하락한 것도 느끼고 있습니다.
        최대한 열심히 개발하겠습니다. 늘 사이트를 아껴주시고 후원해 주셔서 진심으로
        감사합니다.
      </p>
    </Post>
  );
}

export function SettlementPostBody() {
  return (
    <Post>
      <p>
        앞서 약속드린 대로, <strong>후원 수익금 · 서버비 납부 · 남은 금액 기부</strong>를
        투명하게 공개하기 위해 글을 남깁니다.
      </p>
      <Ledger
        title="5월 정산 내역"
        rows={[
          { label: '후원 수익금', value: '+ 38,000원' },
          { label: '서버비', hint: '(tax 포함 $22 · 5/1 환율)', value: '− 33,888원' },
          { label: '잔여금', value: '4,112원' },
        ]}
      />
      <Notice status="accent">
        <p>
          잔여금은 <strong>4,112원</strong>이지만, 그래도 가오 없이 4,112원만 기부하기엔 좀
          그래서 <strong>10,000원을 채워 후원(기부)</strong>하기로 했습니다.
        </p>
      </Notice>
      <OutLink href="https://naver.me/FUii09xf">자세한 내역은 카페 글에서 확인하기</OutLink>
      <p className="text-zinc-500">
        늘 사이트를 아껴주시고 후원해 주셔서 진심으로 감사합니다. 약속대로 앞으로도 1원
        단위까지 투명하게 공개하겠습니다.
      </p>
    </Post>
  );
}

export function UpdateOctober2026PostBody() {
  return (
    <Post>
      <p>
        주간 캘린더에 <strong>v3 베타</strong>를 켜 두었습니다. 직접 올린 합방·게임 일정은 카드
        그대로이고, 지금 켜진 방송과 자동으로 잡힌 일정은 제목과 태그로 짧게 보입니다.
      </p>
      <Notice title="캘린더 v3 베타">
        <ul>
          <li>주간 보기 제목 옆에 BETA가 붙습니다. 기본으로 켜져 있습니다.</li>
          <li>합방은 방송 제목과 멤버 태그, 혼자 방송은 이름과 카테고리로 표시합니다.</li>
          <li>목록은 시작 시각이 최근인 방송이 위입니다. 줄을 누르면 일정 상세가 열립니다.</li>
          <li>방송 종료가 인식되면 그 줄은 빠지고, 일정 카드로 남습니다.</li>
          <li>월간 보기와 구버전 UI는 이전 카드 레이아웃입니다.</li>
          <li>
            설정 → <strong>캘린더 v3 베타</strong>에서 끌 수 있습니다. 구버전 UI를 켜면 베타보다
            그 화면이 우선합니다.
          </li>
        </ul>
      </Notice>
      <Notice title="방송 자동 등록">
        <ul>
          <li>오늘 일정이 없는 멤버가 방송을 켜면, 바로 올리지 않고 한 번 더 확인합니다.</li>
          <li>다음 확인에서도 켜져 있으면 그 사람 일정만 만듭니다. 약 15분 간격입니다.</li>
          <li>제목은 방송 제목이고, 없으면 「이름 라이브」입니다. 합방과 게임은 비워 둡니다.</li>
          <li>방송이 끝나면 마지막 감지 시각을 종료 시각으로 넣고, 종료 표시를 켭니다.</li>
          <li>이미 일정이 있거나 그날 거절한 멤버는 건너뜁니다.</li>
          <li>제목·참여자 등 관리자가 고친 내용은 유지하고, 비어 있던 종료 시각만 채웁니다.</li>
        </ul>
      </Notice>
      <Notice title="의견">
        <ul>
          <li>설정 → 의견 보내기에서 창으로 접수합니다. 의견·오류·일정·기타 중 고릅니다.</li>
          <li>로그인 없이 보낼 수 있고, 관리자 화면에서 확인합니다.</li>
        </ul>
      </Notice>
      <p className="text-xs text-zinc-500">
        <Link href="/help#calendar">도움말 · 캘린더</Link>에서 사용 방법을 정리했습니다.
      </p>
    </Post>
  );
}

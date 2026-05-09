// src/app/streamers/layout.tsx
export default function StreamersLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
      {/* 스트리머 목록 페이지가 여기에 들어옵니다 */}
      {children}

      {/* 가로채기 라우트로 띄울 대형 프로필 모달이 여기에 들어옵니다 */}
      {modal}
    </div>
  );
}

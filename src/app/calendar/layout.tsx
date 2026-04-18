// src/app/calendar/layout.tsx
export default function CalendarLayout({
  children,
  modal, // 🌟 @modal 폴더의 내용이 일로 들어옵니다.
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}

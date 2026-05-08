// src/app/admin/layout.tsx
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* 어드민 전용 상단바나 사이드바를 여기 넣을 수 있습니다 */}
      <nav className="bg-white border-b border-slate-100 px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-lg font-black text-indigo-600 tracking-tighter">
            MAP-DYOA ADMIN
          </span>
          <div className="flex gap-4">
            <a
              href="/calendar"
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              사용자 페이지로
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full min-h-0 overflow-y-auto">
        {children} {/* 🌟 이게 있어야 page.tsx 내용이 보입니다! */}
      </main>
    </div>
  );
}

import { auth } from '@/auth';
import { getAllStreamers } from '@/lib/data-fetching';
import StreamerManagement from '@/components/admin/StreamerManagement';

export default async function AdminStreamersPage() {
  const session = await auth();

  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md dark:shadow-lg dark:shadow-slate-900/50 text-center border border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            접근 권한이 없습니다
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
        </div>
      </div>
    );
  }

  const streamers = await getAllStreamers();

  return <StreamerManagement streamers={streamers} />;
}

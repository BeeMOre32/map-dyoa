import type { useRouter } from 'next/navigation';

type AppRouter = ReturnType<typeof useRouter>;

/** 모달이 속한 상위(목록) 경로 */
export function getMotherPath(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/calendar')) return '/calendar';
  if (pathname.startsWith('/clips')) return '/clips';
  if (pathname.startsWith('/streamers')) return '/streamers';
  if (pathname.startsWith('/live')) return '/live';
  if (pathname.startsWith('/hoi4')) return '/hoi4';
  if (pathname.startsWith('/announcements')) return '/announcements';
  if (pathname.startsWith('/admin/streamers')) return '/admin/streamers';
  if (pathname.startsWith('/admin/clips')) return '/admin/clips';
  if (pathname.startsWith('/admin/schedules')) return '/admin/schedules';
  if (pathname.startsWith('/admin/games')) return '/admin/games';
  if (pathname.startsWith('/admin/feedbacks')) return '/admin/feedbacks';
  if (pathname.startsWith('/admin')) return '/admin';
  return '/calendar';
}

/** 인터셉트·상세 URL 등 — 닫을 때 mother로 이동해야 하는지 */
export function shouldNavigateToMother(pathname: string, mother: string): boolean {
  if (pathname === mother) return false;
  if (mother === '/calendar' && pathname === '/') return false;
  if (pathname.startsWith(`${mother}/`)) return true;
  return false;
}

const SOFT_NAV_KEY = 'map-dyoa-modal-soft-nav';

/** 앱 내 목록→상세(Link·router.push) 직전에 호출 — 닫을 때 back() 허용 */
export function markModalSoftNav() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SOFT_NAV_KEY, '1');
  }
}

export function clearModalSoftNav() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SOFT_NAV_KEY);
  }
}

function hadModalSoftNav(): boolean {
  return (
    typeof window !== 'undefined' &&
    sessionStorage.getItem(SOFT_NAV_KEY) === '1'
  );
}

/** parallel @modal·상세 URL (인터셉트 라우트) */
export function isInterceptStylePath(pathname: string): boolean {
  return (
    /\/calendar\/schedule\/[^/]+/.test(pathname) ||
    /\/calendar\/day\/[^/]+/.test(pathname) ||
    /\/streamers\/detail\/[^/]+/.test(pathname)
  );
}

/** parallel @modal 닫기 — 인터셉트는 back(), 그 외·직접 진입은 replace+refresh */
export function navigateToMother(
  router: AppRouter,
  pathname: string,
  mother?: string,
  options?: { force?: boolean },
) {
  const target = mother ?? getMotherPath(pathname);
  if (!options?.force && !shouldNavigateToMother(pathname, target)) return;

  const fromSoftNav = hadModalSoftNav();
  clearModalSoftNav();

  const useBack =
    !options?.force &&
    typeof window !== 'undefined' &&
    isInterceptStylePath(pathname) &&
    fromSoftNav &&
    window.history.length > 1;

  if (useBack) {
    const before = window.location.pathname;
    router.back();
    // back이 먹지 않으면(히스토리 꼬임) mother로 강제 이동
    window.setTimeout(() => {
      if (window.location.pathname === before) {
        router.replace(target);
        router.refresh();
      }
    }, 350);
    return;
  }

  router.replace(target);
  router.refresh();
}

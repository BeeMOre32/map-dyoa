type ZodPathIssue = { path: PropertyKey[] };

function escapeAttrSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 첫 Zod issue의 path[0]와 일치하는 `[data-zod-field="…"]` 요소로 스크롤하고 포커스합니다.
 * 모달·배치 슬롯 등 범위를 줄이려면 `root`에 조상 요소를 넘깁니다.
 */
export function scrollToFirstZodField(
  issues: ZodPathIssue[],
  options?: {
    root?: Document | HTMLElement | null;
    behavior?: ScrollBehavior;
  },
): void {
  const first = issues[0];
  const key = first?.path?.[0];
  if (key === undefined) return;

  const name = String(key);
  const selector = `[data-zod-field="${escapeAttrSelector(name)}"]`;
  const root = options?.root;

  requestAnimationFrame(() => {
    let el: Element | null = null;
    if (root && 'querySelector' in root) {
      el = root.querySelector(selector);
    } else if (typeof document !== 'undefined') {
      el = document.querySelector(selector);
    }

    if (!el || !(el instanceof HTMLElement)) return;

    el.scrollIntoView({
      behavior: options?.behavior ?? 'smooth',
      block: 'center',
    });

    const focusable = el.matches(
      'input:not([type="hidden"]), textarea, select, button',
    )
      ? el
      : (el.querySelector(
          'input:not([type="hidden"]), textarea, select, button:not([disabled])',
        ) as HTMLElement | null);

    focusable?.focus({ preventScroll: true });
  });
}

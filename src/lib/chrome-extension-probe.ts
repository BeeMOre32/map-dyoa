import { CHROME_EXTENSION_ID } from '@/constants/extension';

type ChromeRuntime = {
  runtime?: {
    sendMessage: (
      extensionId: string,
      message: unknown,
      responseCallback?: (response: unknown) => void,
    ) => void;
    lastError?: { message?: string };
  };
};

type PingResponse = { ok?: boolean; version?: string };

function readDomPresence(): { installed: true; version?: string } | null {
  if (typeof document === 'undefined') return null;
  const version = document.documentElement.dataset.mapDyoaExt;
  if (!version) return null;
  return { installed: true, version };
}

/**
 * Map-Dyoa 확장 설치 여부.
 * 1) presence.js가 찍는 data-map-dyoa-ext (언팩 ID와 무관)
 * 2) 스토어 ID로 runtime.sendMessage
 */
export function probeMapDyoaExtension(timeoutMs = 450): Promise<{
  installed: boolean;
  version?: string;
}> {
  const fromDom = readDomPresence();
  if (fromDom) return Promise.resolve(fromDom);

  return new Promise((resolve) => {
    let settled = false;
    const done = (result: { installed: boolean; version?: string }) => {
      if (settled) return;
      settled = true;
      // 대기 중 presence가 찍혔을 수 있음
      const late = readDomPresence();
      resolve(late ?? result);
    };

    const onPresent = (ev: Event) => {
      const detail = (ev as CustomEvent<{ version?: string }>).detail;
      done({ installed: true, version: detail?.version });
    };
    window.addEventListener('map-dyoa-ext-present', onPresent, { once: true });

    const chromeApi = (
      typeof window !== 'undefined'
        ? (window as unknown as { chrome?: ChromeRuntime }).chrome
        : undefined
    )?.runtime;

    const timer = window.setTimeout(() => {
      window.removeEventListener('map-dyoa-ext-present', onPresent);
      done(readDomPresence() ?? { installed: false });
    }, timeoutMs);

    if (!chromeApi?.sendMessage) {
      // DOM/이벤트가 timeout까지 올 수 있음
      return;
    }

    try {
      chromeApi.sendMessage(
        CHROME_EXTENSION_ID,
        { type: 'ping', source: 'map-dyoa' },
        (response: unknown) => {
          if (chromeApi.lastError) return;
          const body = response as PingResponse | undefined;
          if (body?.ok === true) {
            window.clearTimeout(timer);
            window.removeEventListener('map-dyoa-ext-present', onPresent);
            done({
              installed: true,
              version:
                typeof body.version === 'string' ? body.version : undefined,
            });
          }
        },
      );
    } catch {
      // timeout / DOM 대기
    }
  });
}

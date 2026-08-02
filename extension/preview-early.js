(() => {
  try {
    window.parent.location.hostname;
    return;
  } catch {}

  if (!location.search.includes('map-dyoa-preview=1')) return;

  try {
    window.parent.postMessage(
      { source: 'map-dyoa-chzzk', type: 'extension-present' },
      '*',
    );
  } catch {}

  const STYLE_ID = 'map-dyoa-preview-style';
  const CSS = `
    html, body {
      overflow: hidden !important;
      margin: 0 !important;
      background: #000 !important;
    }
    #root {
      min-height: 100% !important;
      background: #000 !important;
    }

    /* 좌측 팔로우/네비 · 상단 헤더 · 채팅 */
    #layout-header,
    header,
    #lnb,
    [id*="lnb"],
    [class*="navigator"],
    [class*="lnb_"],
    [class*="sidebar"],
    aside:not([class*="live_chatting"]),
    aside[class*="live_chatting"],
    [class*="live_chatting_container"],
    [class*="top_banner"],
    [class*="toolbar"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* 본문·플레이어를 뷰포트에 밀착 */
    #layout-body,
    [class^="live_wrapper__"],
    [class*="live_container"],
    [class^="live_information_player__"],
    [class^="live_information_video_container__"],
    #live_player_layout,
    #player_layout {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 2147483000 !important;
      background: #000 !important;
      transform: none !important;
    }

    .webplayer-internal-video,
    video.webplayer-internal-video,
    #live_player_layout video,
    #player_layout video {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      background: #000 !important;
    }
  `;

  const ensure = () => {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.documentElement || document.head || document.body)?.appendChild(style);
    }
    // SPA 리렌더 후에도 내용 유지
    if (style.textContent !== CSS) style.textContent = CSS;
  };

  ensure();
  const obs = new MutationObserver(ensure);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

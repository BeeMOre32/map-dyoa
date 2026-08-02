(() => {
  // cross-origin iframe 안에서만 동작
  try {
    window.parent.location.hostname;
    return;
  } catch {}

  const isMultiviewEmbed =
    location.search.includes('map-dyoa-mv=1') ||
    location.search.includes('multichzzk');
  const isPreviewEmbed = location.search.includes('map-dyoa-preview=1');
  const isClipPreviewEmbed =
    location.pathname.includes('/embed/clip/') &&
    location.search.includes('map-dyoa-clip-preview=1');

  const notifyParent = (type, extra = {}) => {
    try {
      window.parent.postMessage({ source: 'map-dyoa-chzzk', type, ...extra }, '*');
    } catch {}
  };

  // 부모(map-dyoa)가 확장 설치 여부를 빨리 알 수 있게
  if (isMultiviewEmbed || isPreviewEmbed || isClipPreviewEmbed) {
    notifyParent('extension-present');
  }

  const getReactFiber = (node) => {
    if (node == null) return;
    return Object.entries(node).find(([k]) =>
      k.startsWith('__reactFiber$')
    )?.[1];
  };

  const findReactState = async (node, criteria, raw = false, tries = 0) => {
    if (node == null) return;
    let fiber = getReactFiber(node);
    if (fiber == null) {
      if (tries > 500) return;
      return new Promise((r) => setTimeout(r, 50)).then(() =>
        findReactState(node, criteria, raw, tries + 1)
      );
    }
    fiber = fiber.return;
    while (fiber != null) {
      let state = fiber.memoizedState;
      while (state != null) {
        let value = state.memoizedState;
        if (state.queue?.pending?.hasEagerState) {
          value = state.queue.pending.eagerState;
        } else if (state.baseQueue?.hasEagerState) {
          value = state.baseQueue.eagerState;
        }
        if (value != null && criteria(value)) {
          return raw ? state : value;
        }
        state = state.next;
      }
      fiber = fiber.return;
    }
  };

  const injectEmbedStyles = () => {
    if (document.getElementById('map-dyoa-mv-style')) return;
    const style = document.createElement('style');
    style.id = 'map-dyoa-mv-style';
    style.textContent = `
      /* 멀티뷰 embed — transform 레이어 클릭 어긋남 완화 */
      [class*="live_container"],
      [class*="live_content"],
      [class*="live_player_area"],
      aside[class*="live_chatting"] {
        transform: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  };

  /** 호버 미리보기용 — 플레이어 조상 display:none 금지 (재생 깨짐 방지) */
  const injectPreviewStyles = () => {
    // preview-early.js와 동일 ID — 내용 갱신만
    let style = document.getElementById('map-dyoa-preview-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'map-dyoa-preview-style';
      document.documentElement.appendChild(style);
    }
    style.textContent = `
      html, body { overflow: hidden !important; margin: 0 !important; background: #000 !important; }
      #root { min-height: 100% !important; background: #000 !important; }
      #layout-header, header, #lnb, [id*="lnb"],
      [class*="navigator"], [class*="lnb_"], [class*="sidebar"],
      aside:not([class*="live_chatting"]), aside[class*="live_chatting"],
      [class*="live_chatting_container"], [class*="top_banner"] {
        display: none !important;
        width: 0 !important; visibility: hidden !important; pointer-events: none !important;
      }
      #layout-body, [class^="live_wrapper__"], [class*="live_container"],
      [class^="live_information_player__"], [class^="live_information_video_container__"],
      #live_player_layout, #player_layout {
        position: fixed !important; inset: 0 !important;
        width: 100vw !important; height: 100vh !important;
        max-width: none !important; max-height: none !important;
        margin: 0 !important; padding: 0 !important;
        z-index: 2147483000 !important; background: #000 !important; transform: none !important;
      }
      .webplayer-internal-video, video.webplayer-internal-video,
      #live_player_layout video, #player_layout video {
        width: 100% !important; height: 100% !important;
        object-fit: contain !important; background: #000 !important;
      }
    `;
  };

  if (isPreviewEmbed) injectPreviewStyles();

  /** 부모가 소리 켠 뒤에는 ensurePlayback이 다시 음소거하지 않음 */
  let previewAudioUnlocked = false;

  const ensurePreviewPlayback = () => {
    if (!isPreviewEmbed) return;
    const video = document.querySelector(
      'video.webplayer-internal-video, #live_player_layout video, video',
    );
    if (!video) return;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (!previewAudioUnlocked) video.muted = true;
    const play = () => {
      if (!previewAudioUnlocked) video.muted = true;
      const p = video.play?.();
      if (p?.catch) p.catch(() => {});
    };
    play();
    if (video.readyState < 2) {
      video.addEventListener('loadeddata', play, { once: true });
      video.addEventListener('canplay', play, { once: true });
    }
  };

  /** 넓은 화면 + 플레이어 영역 강제 채움 (미리보기 전용) */
  const fillPreviewPlayer = () => {
    if (!isPreviewEmbed) return;
    injectPreviewStyles();
    applyWideViewMode();
    const layout = document.querySelector(
      '#live_player_layout, #player_layout, [class^="live_information_video_container__"]',
    );
    if (layout) {
      layout.style.setProperty('position', 'fixed', 'important');
      layout.style.setProperty('inset', '0', 'important');
      layout.style.setProperty('width', '100vw', 'important');
      layout.style.setProperty('height', '100vh', 'important');
      layout.style.setProperty('z-index', '2147483000', 'important');
    }
    ensurePreviewPlayback();
  };

  const nudgeVideoPlay = () => {
    const video = document.querySelector(
      'video.webplayer-internal-video, #live_player_layout video, video',
    );
    if (!video) return;
    // 사용자가 이미 소리를 켠 뒤에는 절대 다시 음소거하지 않음
    if (!previewAudioUnlocked) video.muted = true;
    try {
      video.play?.()?.catch?.(() => {});
    } catch {}
    if (isPreviewEmbed) ensurePreviewPlayback();
  };

  /** 미리보기는 항상 작은 음량 (슬라이더 없음) */
  const PREVIEW_QUIET_VOLUME = 0.15;
  /** 부모에서 소리 켜기 요청 후, iframe 안 실제 클릭을 기다림 */
  let awaitingGestureUnmute = false;
  let unmuteHoldTimer = null;

  const applyUnmute = (volume) => {
    previewAudioUnlocked = true;
    const videos = document.querySelectorAll(
      'video.webplayer-internal-video, #live_player_layout video, video',
    );
    let vol =
      typeof volume === 'number' && !Number.isNaN(volume)
        ? Math.min(1, Math.max(0, volume))
        : PREVIEW_QUIET_VOLUME;
    if (isPreviewEmbed || isClipPreviewEmbed) {
      vol = PREVIEW_QUIET_VOLUME;
    }
    if (vol <= 0) vol = PREVIEW_QUIET_VOLUME;
    videos.forEach((video) => {
      try {
        video.muted = false;
        video.volume = vol;
        video.play?.()?.catch?.(() => {});
      } catch {}
    });

    // 치지직 볼륨/음소거 토글이 있으면 음소거 해제 쪽으로 클릭
    const volBtns = document.querySelectorAll(
      'button[aria-label*="음소거"], button[aria-label*="소리"], button[class*="volume"], .pzp-pc__volume-button',
    );
    for (const btn of volBtns) {
      const label = `${btn.getAttribute('aria-label') || ''} ${btn.className || ''}`;
      if (/음소거 해제|소리 켜|unmute/i.test(label)) {
        try {
          btn.click();
        } catch {}
        break;
      }
      // "음소거" 상태(켜진 음소거)면 한 번 눌러 해제
      if (/음소거$|mute/i.test(label) && !/해제|unmute/i.test(label)) {
        const pressed = btn.getAttribute('aria-pressed');
        if (pressed === 'true' || /muted|off|음소거/i.test(btn.className || '')) {
          try {
            btn.click();
          } catch {}
          break;
        }
      }
    }
  };

  const applyMute = () => {
    previewAudioUnlocked = false;
    awaitingGestureUnmute = false;
    if (unmuteHoldTimer) {
      clearInterval(unmuteHoldTimer);
      unmuteHoldTimer = null;
    }
    const videos = document.querySelectorAll(
      'video.webplayer-internal-video, #live_player_layout video, video',
    );
    videos.forEach((video) => {
      video.muted = true;
    });
  };

  const requestUnmuteWithGesture = () => {
    awaitingGestureUnmute = true;
    applyUnmute(PREVIEW_QUIET_VOLUME);
    if (unmuteHoldTimer) clearInterval(unmuteHoldTimer);
    // 제스처 전에도 반복 시도 (일부 환경에서는 postMessage만으로 됨)
    unmuteHoldTimer = setInterval(() => {
      if (!awaitingGestureUnmute && previewAudioUnlocked) {
        clearInterval(unmuteHoldTimer);
        unmuteHoldTimer = null;
        return;
      }
      applyUnmute(PREVIEW_QUIET_VOLUME);
    }, 300);
    setTimeout(() => {
      if (unmuteHoldTimer) {
        clearInterval(unmuteHoldTimer);
        unmuteHoldTimer = null;
      }
    }, 8000);
  };

  // iframe 안 실제 사용자 클릭 → 브라우저 정책상 이때 소리가 열림
  const onTrustedUnlock = (ev) => {
    if (!ev.isTrusted) return;
    if (!awaitingGestureUnmute) return;
    applyUnmute(PREVIEW_QUIET_VOLUME);
    awaitingGestureUnmute = false;
    if (unmuteHoldTimer) {
      clearInterval(unmuteHoldTimer);
      unmuteHoldTimer = null;
    }
    notifyParent('audio-unlocked');
  };
  window.addEventListener('pointerdown', onTrustedUnlock, true);
  window.addEventListener('click', onTrustedUnlock, true);

  /**
   * iframe 임베드 시 CSP 헤더 제거 등으로 치지직이 띄우는
   * "광고 차단 프로그램을 사용 중이신가요?" 모달 자동 닫기
   */
  let adblockDismissed = false;
  const dismissAdblockGate = () => {
    if (adblockDismissed) return true;
    const isAdblockCopy = (text) =>
      typeof text === 'string' &&
      text.includes('광고 차단') &&
      (text.includes('사용 중') || text.includes('사용중'));

    const roots = [
      ...document.querySelectorAll(
        '[role="dialog"], [class*="modal"], [class*="popup"], [class*="dimmed"], [class*="overlay"]',
      ),
      document.body,
    ].filter(Boolean);

    for (const root of roots) {
      if (!isAdblockCopy(root.textContent || '')) continue;

      const confirmBtn = [...root.querySelectorAll('button, [role="button"]')].find(
        (b) => (b.textContent || '').replace(/\s+/g, ' ').trim() === '확인',
      );
      if (confirmBtn) {
        confirmBtn.click();
        adblockDismissed = true;
        nudgeVideoPlay();
        return true;
      }

      if (root !== document.body) {
        root.remove();
        adblockDismissed = true;
        nudgeVideoPlay();
        return true;
      }
    }
    return false;
  };

  if (isMultiviewEmbed || isPreviewEmbed) {
    let dismissTimer = null;
    const dismissObs = new MutationObserver(() => {
      if (dismissAdblockGate()) {
        if (dismissTimer) clearInterval(dismissTimer);
        dismissObs.disconnect();
      }
    });
    const runDismiss = () => {
      if (dismissAdblockGate()) {
        if (dismissTimer) clearInterval(dismissTimer);
        dismissObs.disconnect();
      }
    };
    runDismiss();
    dismissTimer = setInterval(runDismiss, 700);
    setTimeout(() => {
      if (dismissTimer) clearInterval(dismissTimer);
      dismissObs.disconnect();
    }, 25000);
    const startObs = () => {
      if (document.documentElement) {
        dismissObs.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObs, { once: true });
    } else {
      startObs();
    }
  }

  const findChatFoldButton = (chattingContainer) => {
    if (chattingContainer == null) return null;
    return (
      chattingContainer.querySelector(
        '[class*="live_chatting_header_fold__"] [class*="live_chatting_header_button__"]'
      ) ||
      chattingContainer.querySelector('[class^="live_chatting_header_button__"]') ||
      chattingContainer.querySelector('button[aria-label*="채팅"]')
    );
  };

  const toggleChatFold = (chattingContainer) => {
    findChatFoldButton(chattingContainer)?.click();
  };

  const applyWideViewMode = () => {
    const buttons = document.querySelectorAll('.pzp-pc__viewmode-button');
    if (buttons.length === 1) {
      buttons[0].click();
      return true;
    }
    for (const button of buttons) {
      const label = button.getAttribute('aria-label') ?? '';
      if (label.includes('넓은') || label.includes('wide')) {
        button.click();
        return true;
      }
    }
    return false;
  };

  const applyWideViewFallback = async (node) => {
    const liveWide = await findReactState(
      node,
      (state) => state.length === 3 && state[2]?.toString?.() === 'atom7'
    );
    liveWide?.[1].set(liveWide[2], true);
  };

  let playerReadyHandled = false;

  const handlePlayerReady = async (node, isLive) => {
    if (playerReadyHandled) return;
    playerReadyHandled = true;

    if (isMultiviewEmbed) injectEmbedStyles();
    if (isPreviewEmbed) injectPreviewStyles();

    if (!applyWideViewMode()) {
      await applyWideViewFallback(node);
    }

    const video = document.querySelector('video.webplayer-internal-video, video');
    if (video) {
      if (!previewAudioUnlocked) video.muted = true;
      video.playsInline = true;
      try {
        video.play?.()?.catch?.(() => {});
      } catch {}
    }

    if (isPreviewEmbed) {
      toggleChatFold(document.querySelector('aside'));
      setTimeout(() => toggleChatFold(document.querySelector('aside')), 400);
      fillPreviewPlayer();
      setTimeout(fillPreviewPlayer, 600);
      setTimeout(fillPreviewPlayer, 1600);
      setTimeout(() => notifyParent('preview-ready'), 500);
      setTimeout(() => notifyParent('preview-ready'), 1200);
    } else if (autoFullscreen) {
      scheduleFullscreen();
    }
  };

  const root = document.getElementById('root');
  const waiting = [];
  const rootObserver = new MutationObserver((mutations) => {
    if (!waiting.length) return;
    for (const mutation of mutations) {
      for (const n of mutation.addedNodes) {
        if (n.querySelector == null) continue;
        for (const elem of waiting) {
          const node =
            (n.matches(elem.query) && n) || n.querySelector(elem.query);
          if (node != null) elem.resolve(node);
        }
      }
    }
  });
  const waitFor = (query) => {
    const node = root.querySelector(query);
    if (node) return Promise.resolve(node);
    return Promise.race([
      new Promise((resolve) => {
        waiting.push({ query, resolve });
      }),
      new Promise((resolve) => setTimeout(resolve, 10000)),
    ]);
  };
  if (root) rootObserver.observe(root, { childList: true, subtree: true });

  let autoFullscreen =
    location.hash.includes('map-dyoa-auto-fs') ||
    location.search.includes('map-dyoa-auto-fs');

  const isPlayerFullscreen = () => {
    if (document.fullscreenElement) return true;
    const video = document.querySelector('video');
    if (video?.closest('[class*="fullscreen"]')) return true;
    return !!document.querySelector(
      '[class*="fullscreen"][class*="live_"], [class*="viewer_fullscreen"], [class*="mode_fullscreen"]'
    );
  };

  const pressPlayerKeyF = () => {
    const targets = [
      document.querySelector('video'),
      document.querySelector('#live_player_layout'),
      document.querySelector('#player_layout'),
      document.activeElement,
      document,
      window,
    ].filter(Boolean);
    for (const type of ['keydown', 'keypress', 'keyup']) {
      const ev = new KeyboardEvent(type, {
        key: 'f',
        code: 'KeyF',
        keyCode: 70,
        which: 70,
        bubbles: true,
        cancelable: true,
      });
      for (const target of targets) {
        target.dispatchEvent(ev);
      }
    }
    document
      .querySelector(
        '[class*="live_player_control"] button[class*="fullscreen"], [class*="player_fullscreen"], button[aria-label*="전체"], button[title*="전체"]'
      )
      ?.click();
  };

  let fullscreenRetryTimer = null;
  const ensureFullscreen = () => {
    if (!autoFullscreen || isPlayerFullscreen()) return true;
    pressPlayerKeyF();
    return isPlayerFullscreen();
  };

  const scheduleFullscreen = () => {
    autoFullscreen = true;
    if (fullscreenRetryTimer != null) clearInterval(fullscreenRetryTimer);
    let tries = 0;
    const tick = () => {
      if (ensureFullscreen() || tries++ >= 50) {
        clearInterval(fullscreenRetryTimer);
        fullscreenRetryTimer = null;
      }
    };
    tick();
    fullscreenRetryTimer = setInterval(tick, 500);
  };

  const initPlayerFeatures = async (node, isLive) => {
    if (node == null) return;

    const video = document.querySelector('video.webplayer-internal-video, video');
    if (video) {
      if (video.readyState >= 2) {
        await handlePlayerReady(node, isLive);
      } else {
        video.addEventListener(
          'loadedmetadata',
          () => {
            handlePlayerReady(node, isLive);
          },
          { once: true }
        );
      }
      return;
    }

    await handlePlayerReady(node, isLive);
  };

  const initChatFeatures = async (chattingContainer) => {
    if (chattingContainer == null || !isMultiviewEmbed) return;
    // 넓은 화면 적용 후 채팅 접기 — 클릭 좌표 어긋남 방지
    const foldOnce = () => toggleChatFold(chattingContainer);
    setTimeout(foldOnce, 800);
    setTimeout(foldOnce, 2500);
  };

  const attachPlayerObserver = async (node, isLive, tries = 0) => {
    if (node == null) return;
    const playerLayout = node.querySelector(
      isLive ? '#live_player_layout' : '#player_layout'
    );
    if (playerLayout == null) {
      if (tries > 500) return;
      return new Promise((r) => setTimeout(r, 50)).then(() =>
        attachPlayerObserver(node, isLive, tries + 1)
      );
    }
    const playerObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const n of mutation.addedNodes) {
          if (!n.className?.startsWith?.('pip_player_')) {
            initPlayerFeatures(n, isLive);
          }
        }
      }
    });
    playerObserver.observe(playerLayout.parentNode, { childList: true });
    await initPlayerFeatures(playerLayout, isLive);
  };

  const attachLiveObserver = (node) => {
    if (node == null) return;
    const wrapper = node.querySelector('[class^="live_wrapper__"]');
    if (wrapper != null) {
      const liveObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const n of mutation.addedNodes) {
            if (n.tagName === 'ASIDE') initChatFeatures(n);
          }
        }
      });
      liveObserver.observe(wrapper, { childList: true });
    }
    const player = node.querySelector('[class^="live_information_player__"]');
    if (player != null) {
      const playerObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const n of mutation.addedNodes) {
            if (n.className?.startsWith?.('live_information_video_container__')) {
              attachPlayerObserver(n, true);
            }
          }
        }
      });
      playerObserver.observe(player, { childList: true });
    }
    return Promise.all([
      attachPlayerObserver(
        node.querySelector('[class^="live_information_video_container__"]'),
        true
      ),
      initChatFeatures(node.querySelector('aside')),
    ]);
  };

  const attachBodyObserver = async () => {
    const init = async (node) => {
      if (node == null) return;
      if (node.className.startsWith('live_')) return attachLiveObserver(node);
    };
    const layoutBody = await waitFor('#layout-body');
    if (layoutBody == null) return;
    const layoutBodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const n of mutation.addedNodes) {
          if (n.querySelector != null) {
            init(n.tagName === 'SECTION' ? n : n.querySelector('section'));
          }
        }
      }
    });
    layoutBodyObserver.observe(layoutBody, { childList: true });
    await init(layoutBody.querySelector('section'));
  };

  window.addEventListener('message', (ev) => {
    if (ev.data?.source === 'map-dyoa-director' && ev.data?.type === 'fullscreen') {
      scheduleFullscreen();
      return;
    }
    if (ev.data?.source !== 'map-dyoa-multiview') return;
    if (ev.data?.type === 'toggle-chat') {
      toggleChatFold(document.querySelector('aside'));
    }
    if (ev.data?.type === 'toggle-mute') {
      const wantMuted =
        ev.data.muted !== undefined
          ? !!ev.data.muted
          : !document.querySelector('video')?.muted;
      if (wantMuted) applyMute();
      else requestUnmuteWithGesture();
    }
    if (ev.data?.type === 'set-volume') {
      const v = Number(ev.data.volume);
      if (!Number.isNaN(v)) {
        if (v <= 0) applyMute();
        else requestUnmuteWithGesture();
      }
    }
    if (ev.data?.type === 'request-unmute') {
      requestUnmuteWithGesture();
    }
    if (ev.data?.type === 'ping') {
      notifyParent('pong');
      if (isPreviewEmbed || isMultiviewEmbed || isClipPreviewEmbed) {
        notifyParent('extension-present');
      }
    }
    if (ev.data?.type === 'fill-player') {
      fillPreviewPlayer();
    }
    if (ev.data?.type === 'fullscreen') {
      if (isPreviewEmbed) fillPreviewPlayer();
      else scheduleFullscreen();
    }
  });

  if (autoFullscreen) scheduleFullscreen();

  /** 클립 호버 미리보기 — 재생 1회 유도 + 음소거 (라이브 쪽 로직 건드리지 않음) */
  if (isClipPreviewEmbed) {
    let playClicked = false;
    let playingNotified = false;

    const clickOnce = (el) => {
      if (!el || playClicked) return false;
      try {
        el.click();
        playClicked = true;
        return true;
      } catch {
        return false;
      }
    };

    const nudgeClipPreview = () => {
      const video = document.querySelector('video');
      if (video) {
        if (!previewAudioUnlocked) video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        if (video.paused) {
          video.play?.()?.catch?.(() => {});
        }
        if (!video.paused && video.readyState >= 2) {
          if (!playingNotified) {
            playingNotified = true;
            notifyParent('clip-preview-playing');
          }
          return;
        }
      }

      if (playClicked) return;

      const playBtn =
        document.querySelector('button[aria-label="재생"]') ||
        document.querySelector('button[aria-label*="재생"]') ||
        document.querySelector('.pzp-pc__playback-switch[aria-label*="재생"]') ||
        document.querySelector('button.pzp-pc__playback-switch');

      // aria가 "일시정지"면 이미 재생 중 — 클릭하지 않음
      if (playBtn) {
        const label = playBtn.getAttribute('aria-label') || '';
        if (/일시|pause/i.test(label)) {
          playClicked = true;
          return;
        }
        if (/재생|play/i.test(label)) {
          clickOnce(playBtn);
          return;
        }
      }

      // 중앙 큰 재생 아이콘 버튼 (라벨 없는 경우)
      const bigPlay = [...document.querySelectorAll('button')].find((b) => {
        const cls = b.className?.toString?.() || '';
        const al = b.getAttribute('aria-label') || '';
        return (
          (/play/i.test(cls) || /재생/.test(al)) &&
          !/pause|일시|mute|음소거|volume|설정|quality/i.test(`${cls} ${al}`)
        );
      });
      if (bigPlay) clickOnce(bigPlay);
    };

    nudgeClipPreview();
    const clipTimer = setInterval(nudgeClipPreview, 600);
    setTimeout(() => clearInterval(clipTimer), 10000);
    const clipObs = new MutationObserver(() => {
      if (!playingNotified) nudgeClipPreview();
    });
    if (document.documentElement) {
      clipObs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => clipObs.disconnect(), 10000);
    }

    // 라이브 멀티뷰/미리보기용 attachBodyObserver 는 클립에서 실행하지 않음
    try {
      rootObserver.disconnect();
    } catch {}
    return;
  }

  (async () => {
    if (!location.pathname.endsWith('/chat')) {
      await attachBodyObserver();
    }
    rootObserver.disconnect();
  })();
})();

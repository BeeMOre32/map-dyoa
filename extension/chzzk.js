(() => {
  // cross-origin iframe 안에서만 동작
  try {
    window.parent.location.hostname;
    return;
  } catch {}

  const isMultiviewEmbed =
    location.search.includes('map-dyoa-mv=1') ||
    location.search.includes('multichzzk');

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

    if (!applyWideViewMode()) {
      await applyWideViewFallback(node);
    }

    const video = document.querySelector('video.webplayer-internal-video, video');
    if (video) {
      video.muted = true;
      try {
        video.play?.();
      } catch {}
    }

    if (autoFullscreen) scheduleFullscreen();
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
  rootObserver.observe(root, { childList: true, subtree: true });

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
      const video = document.querySelector('video.webplayer-internal-video, video');
      if (video) {
        video.muted = ev.data.muted !== undefined ? !!ev.data.muted : !video.muted;
      }
    }
    if (ev.data?.type === 'fullscreen') {
      scheduleFullscreen();
    }
  });

  if (autoFullscreen) scheduleFullscreen();

  (async () => {
    if (!location.pathname.endsWith('/chat')) {
      await attachBodyObserver();
    }
    rootObserver.disconnect();
  })();
})();

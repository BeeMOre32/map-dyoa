(() => {
  try {
    const version = chrome.runtime.getManifest().version;
    document.documentElement.dataset.mapDyoaExt = version;
    window.dispatchEvent(
      new CustomEvent('map-dyoa-ext-present', { detail: { version } }),
    );
  } catch {}
})();

const COOKIES = [
  {
    name: 'NID_AUT',
    domain: '.naver.com',
    url: 'https://nid.naver.com/nidlogin.login',
  },
  {
    name: 'NID_SES',
    domain: '.naver.com',
    url: 'https://nid.naver.com/nidlogin.login',
  },
  {
    name: 'NID_JKL',
    domain: '.naver.com',
    url: 'https://nid.naver.com/nidlogin.login',
  },
];

const TOP_LEVEL_SITES = [
  'https://map-doya.site',
  'https://www.map-doya.site',
  'http://localhost',
];

const setPartitionedCookie = async (cookie, url, topLevelSite) => {
  if (cookie.partitionKey != null) return;
  delete cookie.hostOnly;
  delete cookie.session;
  await chrome.cookies.set({
    ...cookie,
    sameSite: chrome.cookies.SameSiteStatus.NO_RESTRICTION,
    secure: true,
    url,
    partitionKey: { topLevelSite },
    // NID_SES는 세션 쿠키(expirationDate 없음)이므로 명시적으로 30일 설정
    expirationDate: cookie.expirationDate ?? (Date.now() / 1000 + 86400 * 30),
  });
};

const init = async () => {
  for (const { name, url } of COOKIES) {
    const cookie = await chrome.cookies.get({ name, url });
    if (cookie != null) {
      for (const site of TOP_LEVEL_SITES) {
        // 쿠키 객체를 복사해서 사이트별로 독립적으로 처리
        await setPartitionedCookie({ ...cookie }, url, site);
      }
    }
  }
};

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

// 30분마다 재동기화 (세션 만료 방지)
chrome.alarms.create('sync-cookies', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-cookies') init();
});

chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
  if (removed) return;
  const c = COOKIES.find(
    ({ name, domain }) => cookie.name === name && cookie.domain === domain
  );
  if (c != null) {
    for (const site of TOP_LEVEL_SITES) {
      await setPartitionedCookie({ ...cookie }, c.url, site);
    }
  }
});

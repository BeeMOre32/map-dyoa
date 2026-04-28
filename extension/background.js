const TOP_LEVEL_SITES = [
  'https://map-doya.site',
  'https://www.map-doya.site',
  'http://localhost',
];

// 치지직 로그인에 필요한 네이버 인증 쿠키
const NAVER_COOKIE_TARGETS = [
  { name: 'NID_AUT', url: 'https://nid.naver.com/nidlogin.login' },
  { name: 'NID_SES', url: 'https://nid.naver.com/nidlogin.login' },
];

async function setPartitionedCookie(cookie, url, topLevelSite) {
  if (cookie.partitionKey != null) return;
  const c = { ...cookie };
  delete c.hostOnly;
  delete c.session;
  try {
    await chrome.cookies.set({
      ...c,
      sameSite: 'no_restriction',
      secure: true,
      url,
      partitionKey: { topLevelSite },
    });
    console.log(
      '[map-dyoa] 파티셔닝 쿠키 설정 완료:',
      cookie.name,
      '→',
      topLevelSite,
    );
  } catch (e) {
    console.error(
      '[map-dyoa] 쿠키 파티셔닝 실패:',
      cookie.name,
      topLevelSite,
      e,
    );
  }
}

async function init() {
  console.log('[map-dyoa] 초기화 시작...');
  for (const { name, url } of NAVER_COOKIE_TARGETS) {
    const cookie = await chrome.cookies.get({ url, name });
    if (cookie) {
      for (const site of TOP_LEVEL_SITES) {
        await setPartitionedCookie(cookie, url, site);
      }
    } else {
      console.log('[map-dyoa] 쿠키 없음:', name, '→ 네이버 로그인 필요');
    }
  }
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

// 네이버 로그인/로그아웃 시 파티셔닝 쿠키 실시간 동기화
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if (removed) return;
  const target = NAVER_COOKIE_TARGETS.find(
    (t) => t.name === cookie.name && cookie.domain.endsWith('naver.com'),
  );
  if (target) {
    for (const site of TOP_LEVEL_SITES) {
      setPartitionedCookie(cookie, target.url, site);
    }
  }
});

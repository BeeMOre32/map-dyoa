/** 방송 제목/텍스트에서 지도동 멤버 이름·핸들 매칭 */

export type CollabMember = {
  id: string;
  name: string;
  handle?: string | null;
};

type Alias = { streamerId: string; name: string; alias: string };

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/** 이름 토큰 중 멤버 전체에서 유일한 것만 별칭으로 사용 */
function buildAliases(members: CollabMember[]): Alias[] {
  const tokenOwners = new Map<string, string[]>();
  const aliases: Alias[] = [];

  for (const m of members) {
    aliases.push({ streamerId: m.id, name: m.name, alias: m.name });
    if (m.handle?.trim()) {
      aliases.push({ streamerId: m.id, name: m.name, alias: m.handle.trim() });
    }
    for (const part of m.name.split(/[\s/_·･]+/).filter((p) => p.length >= 2)) {
      const key = part.toLowerCase();
      const owners = tokenOwners.get(key) ?? [];
      owners.push(m.id);
      tokenOwners.set(key, owners);
    }
  }

  for (const m of members) {
    for (const part of m.name.split(/[\s/_·･]+/).filter((p) => p.length >= 2)) {
      const owners = tokenOwners.get(part.toLowerCase()) ?? [];
      if (owners.length === 1 && owners[0] === m.id) {
        aliases.push({ streamerId: m.id, name: m.name, alias: part });
      }
    }
  }

  // 긴 별칭 우선 (부분 문자열 충돌 완화)
  aliases.sort((a, b) => b.alias.length - a.alias.length);
  return aliases;
}

/**
 * 텍스트에 언급된 멤버 (excludeId 제외).
 * 대소문자·공백 무시 비교 + 원문 includes.
 */
export function matchStreamersInText(
  text: string,
  members: CollabMember[],
  excludeId?: string,
): CollabMember[] {
  if (!text.trim() || members.length === 0) return [];

  const aliases = buildAliases(members);
  const haystack = text;
  const hayNorm = normalizeForMatch(text);
  const found = new Map<string, CollabMember>();

  for (const a of aliases) {
    if (excludeId && a.streamerId === excludeId) continue;
    if (found.has(a.streamerId)) continue;

    const hit =
      haystack.includes(a.alias) ||
      hayNorm.includes(normalizeForMatch(a.alias));
    if (!hit) continue;

    const member = members.find((m) => m.id === a.streamerId);
    if (member) found.set(member.id, member);
  }

  return [...found.values()];
}

/**
 * 동시 LIVE 후보끼리 제목에 서로를 언급하면 합방으로 묶음.
 * liveCohort: 같은 dateKst의 다른 PENDING 후보 메타.
 */
export function expandCollabWithCohorts(
  hostId: string,
  hostTitle: string,
  members: CollabMember[],
  cohorts: { streamerId: string; streamerName: string; title: string | null }[],
): CollabMember[] {
  const fromTitle = matchStreamersInText(hostTitle, members, hostId);
  const byId = new Map(fromTitle.map((m) => [m.id, m]));

  for (const c of cohorts) {
    if (c.streamerId === hostId) continue;
    const peerTitle = c.title ?? '';
    const hostMentionedInPeer = matchStreamersInText(peerTitle, members).some(
      (m) => m.id === hostId,
    );
    const peerMentionedInHost = matchStreamersInText(hostTitle, members).some(
      (m) => m.id === c.streamerId,
    );
    if (hostMentionedInPeer || peerMentionedInHost) {
      byId.set(c.streamerId, {
        id: c.streamerId,
        name: c.streamerName,
      });
    }
  }

  return [...byId.values()];
}

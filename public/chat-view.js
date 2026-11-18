import { t, language } from './i18n.js';

// Only open accounts in this room are candidates, even when searching for an exact UID.
export function mentionChoices(chat, users, viewer, query) {
  const members = new Set(chat.memberIds);
  const accounts = new Map();
  for (const uid of chat.openAgents || []) {
    const owner = uid.split('/')[0];
    if (!accounts.has(owner)) accounts.set(owner, []);
    accounts.get(owner).push(uid);
  }
  const q = query.toLowerCase();
  const scope = q.includes('/') ? q.slice(0, q.indexOf('/')) : null;
  const rows = [];
  for (const u of users) {
    if (!members.has(u.id) || (scope !== null && scope !== u.id)) continue;
    const agents = accounts.get(u.id) || [];
    const self = u.id === viewer;
    const keys = [u.name, u.username, u.id].map((s) => s.toLowerCase());
    const match = keys.some((s) => s.includes(q));
    if (scope === null && match && (!self || agents.length)) {
      rows.push({ uid: u.id, branch: !!agents.length, label: self ? u.name + t(' (you)') : u.name,
        note: `@${u.id} · ${agents.length ? t(agents.length === 1 ? '{count} agent ›' : '{count} agents ›', { count: agents.length }) : t(u.online ? 'Person' : 'Offline')}`,
        disabled: !agents.length && !u.online, rank: keys.includes(q) ? 0 : keys.some((s) => s.startsWith(q)) ? 1 : 2 });
    }
    if (scope !== null && q === `${u.id}/` && !self) {
      rows.push({ uid: u.id, label: u.name, note: t(u.online ? 'Person' : 'Person · offline'), disabled: !u.online, rank: 0 });
    }
    if (!q) continue;
    for (const uid of agents) {
      const short = uid.slice(u.id.length + 1);
      if (scope === null ? !short.includes(q) : !short.includes(q.slice(scope.length + 1))) continue;
      rows.push({ uid, label: uid, note: self ? t('Your agent') : t("{owner}'s agent", { owner: u.name }), rank: short === q || uid === q ? 0 : 2 });
    }
  }
  rows.sort((a, b) => Number(!!a.disabled) - Number(!!b.disabled) || a.rank - b.rank || a.label.localeCompare(b.label, language));
  return { rows: rows.slice(0, 6), total: rows.length, scope };
}

export function mentionAt(value, caret) {
  const match = /(?<![a-zA-Z0-9._%+@-])@([\p{L}\p{M}\p{N}_/-]*)$/u.exec(value.slice(0, caret));
  if (!match) return null;
  return { start: caret - match[1].length - 1, end: caret + /^[\p{L}\p{M}\p{N}_/-]*/u.exec(value.slice(caret))[0].length, query: match[1] };
}

export function speakerView(sender, viewer, owner, delivery) {
  const agent = sender?.type === 'agent';
  const mine = agent ? sender.ownerUid === viewer : sender?.id === viewer;
  const name = !agent && mine ? t('You') : sender?.name || t('Unknown');
  const role = agent ? (mine ? t('Your agent') : t("{owner}'s agent", { owner: owner?.name || sender.ownerUid })) : '';
  return { name, role, mine, delegated: agent && delivery === 'delegation_candidate', canEdit: !agent && mine };
}

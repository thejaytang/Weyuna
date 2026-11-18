import { mentionAt, mentionChoices, speakerView } from './chat-view.js';
import { bindShell, language, setLanguage, t } from './i18n.js';

const refreshShell = bindShell(document.body);

const iconPaths = {
  chat: '<path d="M20 15a4 4 0 0 1-4 4H8l-5 3v-7a8 8 0 0 1 8-8h5a4 4 0 0 1 4 4v4Z"/><path d="M8 11h7M8 15h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.7 19.7 0 0 1-8.59-3.05 19.4 19.4 0 0 1-6-6A19.7 19.7 0 0 1 2.18 4.3 2 2 0 0 1 4.17 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.14 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z"/>',
  bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.41 1.41-.06-.06A1.65 1.65 0 0 0 16.5 18a1.65 1.65 0 0 0-1.5 1v.08H13V19a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-1.41-1.41.06-.06A1.65 1.65 0 0 0 9 14.6 1.65 1.65 0 0 0 8 13H7.9v-2H8a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.41-1.41.06.06A1.65 1.65 0 0 0 12.4 7 1.65 1.65 0 0 0 14 6V5.9h2V6a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.41 1.41-.06.06A1.65 1.65 0 0 0 20 10.4 1.65 1.65 0 0 0 21 12v2a1.65 1.65 0 0 0-1.6 1Z"/>',
  compose: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  'arrow-left': '<path d="m15 18-6-6 6-6"/>',
  video: '<path d="M15 10 21 6v12l-6-4"/><rect x="3" y="5" width="12" height="14" rx="2"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  paperclip: '<path d="m21.44 11.05-8.49 8.49a6 6 0 0 1-8.49-8.49l8.49-8.49a4 4 0 0 1 5.66 5.66l-8.5 8.49a2 2 0 0 1-2.83-2.83l7.79-7.78"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  pin: '<path d="M12 17v5M5 17h14M7 3h10l-2 6 3 4H6l3-4Z"/>',
  'volume-off': '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m23 9-6 6M17 9l6 6"/>',
  archive: '<path d="M3 4h18v4H3zM5 8v12h14V8M10 12h4"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  reply: '<path d="m9 17-5-5 5-5"/><path d="M20 18a7 7 0 0 0-7-7H4"/>',
  forward: '<path d="m14 5 7 7-7 7v-4C8 15 5 17 3 20c0-8 5-12 11-11Z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  'check-double': '<path d="m3 12 4 4L17 6M9 12l4 4 8-10"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  'user-plus': '<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.07.07l3-3A5 5 0 0 0 13 3L11.3 4.7M14 11a5 5 0 0 0-7.07-.07l-3 3A5 5 0 0 0 11 21l1.7-1.7"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4ZM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>',
  compact: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  channel: '<path d="M4 10a8 8 0 0 1 13.66-5.66L20 6.68M20 14a8 8 0 0 1-13.66 5.66L4 17.32"/><path d="M20 3v4h-4M4 21v-4h4"/><circle cx="12" cy="12" r="3"/>',
};

function icon(name, className = '') {
  const path = iconPaths[name] || iconPaths.info;
  const classAttribute = className ? ` class="${className}"` : '';
  return `<svg${classAttribute} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function hydrateIcons(root = document) {
  for (const element of root.querySelectorAll('[data-icon]')) {
    element.innerHTML = icon(element.dataset.icon);
  }
}

const element = (id) => document.getElementById(id);
const elements = {
  app: element('app-shell'),
  boot: element('boot-screen'),
  profile: element('profile-button'),
  navUnread: element('nav-unread'),
  conversationList: element('conversation-list'),
  conversationSearch: element('conversation-search'),
  emptyChat: element('empty-chat'),
  activeChat: element('active-chat'),
  chatAvatar: element('chat-avatar'),
  chatTitle: element('chat-title'),
  chatStatus: element('chat-status'),
  messageFlow: element('message-flow'),
  messageScroller: element('message-scroller'),
  messageInput: element('message-input'),
  messageForm: element('message-form'),
  sendButton: element('send-button'),
  pinnedStrip: element('pinned-strip'),
  pinnedPreview: element('pinned-preview'),
  typing: element('typing-indicator'),
  typingName: element('typing-name'),
  replyBanner: element('reply-banner'),
  replyName: element('reply-name'),
  replyText: element('reply-text'),
  attachmentPreview: element('attachment-preview'),
  fileInput: element('file-input'),
  emojiTray: element('emoji-tray'),
  chatSearchBar: element('chat-search-bar'),
  messageSearch: element('message-search'),
  messageSearchCount: element('message-search-count'),
  details: element('details-pane'),
  menu: element('menu-popover'),
  dialog: element('app-dialog'),
  dialogContent: element('dialog-content'),
  toastStack: element('toast-stack'),
  liveRegion: element('live-region'),
  recordingBar: element('recording-bar'),
  recordingTime: element('recording-time'),
  callScreen: element('call-screen'),
  callAvatar: element('call-avatar'),
  callName: element('call-name'),
  callLabel: element('call-label'),
  callTimer: element('call-timer'),
};

const app = {
  mentions: new Set(),
  data: null,
  activeConversationId: null,
  filter: 'all',
  search: '',
  searchResults: { conversations: [], messages: [], users: [] },
  messageSearch: '',
  replyToId: null,
  editingMessageId: null,
  attachment: null,
  detailsOpen: false,
  searchTimer: null,
  searchVersion: 0,
  dialogDraft: null,
  eventSource: null,
  reconnectNotice: false,
  pendingScroll: false,
  call: null,
  callTimer: null,
  recording: null,
  recordingTimer: null,
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
  elements.dialog.addEventListener('close', () => { if (!elements.dialog.open) elements.dialogContent.replaceChildren(); });
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#6877df';
}

function currentUser() {
  return app.data?.users.find((user) => user.id === app.data.currentUserId);
}

function userById(id) {
  const u = app.data.users.find((user) => user.id === id);
  if (u) return u;
  const a = app.data.agents.find((v) => v.uid === id);
  return a && { id, name: a.uid, ownerUid: a.ownerUid, avatar: a.displayName.slice(0, 2).toUpperCase(), color: '#247b78', type: 'agent' };
}

function speaker(message) {
  const sender = userById(message.senderId);
  const reason = sender?.ownerUid && messageById(message.replyToId)?.delivery?.[sender.id];
  return speakerView(sender, app.data.currentUserId, sender?.ownerUid && userById(sender.ownerUid), reason);
}

function shortByline(message) {
  const who = speaker(message);
  return who.role && who.mine ? `${who.role} ${who.name}` : who.name;
}

function conversationById(id) {
  return app.data.conversations.find((conversation) => conversation.id === id);
}

function messageById(id) {
  return app.data.messages.find((message) => message.id === id);
}

function activeConversation() {
  return conversationById(app.activeConversationId);
}

function conversationMessages(id) {
  return app.data.messages
    .filter((message) => message.conversationId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function lastMessage(id) {
  return conversationMessages(id).at(-1) || null;
}

function conversationView(conversation) {
  if (conversation.type === 'direct') {
    const other = conversation.memberIds
      .map(userById)
      .find((user) => user && user.id !== app.data.currentUserId);
    return {
      title: other?.name || conversation.title,
      initials: other?.avatar || conversation.avatar || '?',
      color: other?.color || conversation.color,
      online: Boolean(other?.online),
      round: true,
      status: t(other?.lastSeen || 'offline'),
      user: other,
    };
  }
  return {
    title: conversation.title,
    initials: conversation.avatar || conversation.title.slice(0, 2).toUpperCase(),
    color: conversation.color || '#6877df',
    online: false,
    round: false,
    status:
      conversation.type === 'channel'
        ? t('{count} subscribers', { count: formatNumber(conversation.subscribers || conversation.memberIds.length) })
        : t('{count} members', { count: conversation.memberIds.length }),
  };
}

function avatarMarkup(view, extraClass = '') {
  const initials = escapeHtml(view.avatar || view.initials || view.name?.slice(0, 2) || '?');
  const color = safeColor(view.color);
  const online = view.online ? '<span class="avatar-online"></span>' : '';
  const round = view.round ? ' round' : '';
  return `<span class="avatar${round} ${extraClass}" style="--avatar-color:${color}">${initials}${online}</span>`;
}

function formatNumber(value) {
  return new Intl.NumberFormat(language, { notation: value >= 10_000 ? 'compact' : 'standard' }).format(value);
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatListTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date >= startToday) return formatTime(iso);
  const yesterday = new Date(startToday);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= yesterday) return t('Yesterday');
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(date);
}

function formatFullDate(iso) {
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDay(iso) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return t('Today');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return t('Yesterday');
  return new Intl.DateTimeFormat(language, { month: 'long', day: 'numeric' }).format(date);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function richText(text, mentions = []) {
  const value = String(text || '');
  const token = /(https?:\/\/[^\s]+|(?<![a-z0-9._%+@-])@[a-z0-9_]+(?:\/[a-z0-9_-]+)?)/gi;
  let output = '';
  let cursor = 0;
  for (const match of value.matchAll(token)) {
    output += escapeHtml(value.slice(cursor, match.index));
    const candidate = match[0];
    if (candidate.startsWith('@')) {
      output += mentions.includes(candidate.slice(1)) ? `<span class="mention">${escapeHtml(candidate)}</span>` : escapeHtml(candidate);
    } else {
      try {
        const url = new URL(candidate);
        if (['http:', 'https:'].includes(url.protocol)) {
          output += `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(candidate)}</a>`;
        } else {
          output += escapeHtml(candidate);
        }
      } catch {
        output += escapeHtml(candidate);
      }
    }
    cursor = match.index + candidate.length;
  }
  return output + escapeHtml(value.slice(cursor));
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function showToast(message, type = 'success') {
  message = t(message);
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' is-error' : ''}`;
  toast.innerHTML = `${icon(type === 'error' ? 'alert' : 'check-circle')}<span>${escapeHtml(message)}</span>`;
  elements.toastStack.append(toast);
  elements.liveRegion.textContent = message;
  setTimeout(() => toast.remove(), 3600);
}

async function safely(action, fallbackMessage = 'The action could not be completed') {
  try {
    return await action();
  } catch (error) {
    console.error(fallbackMessage, error);
    showToast(error.message || fallbackMessage, 'error');
    return null;
  }
}

function previewForMessage(message) {
  if (message.deleted) return t('Message deleted');
  if (message.text) return message.text;
  const attachment = message.attachments?.[0];
  if (attachment?.type?.startsWith('image/')) return t('Photo');
  if (attachment) return attachment.name;
  return t('New message');
}

function renderConversationRow(conversation, override = {}) {
  const view = conversationView(conversation);
  const message = lastMessage(conversation.id);
  const senderPrefix = message && (message.senderId === app.data.currentUserId || conversation.type === 'group' || userById(message.senderId)?.type === 'agent')
    ? `${shortByline(message)}: ` : '';
  const preview = override.preview || `${senderPrefix}${message ? previewForMessage(message) : t('No messages yet')}`;
  const metaTime = message ? formatListTime(message.createdAt) : '';
  const active = conversation.id === app.activeConversationId;
  const kindIcon =
    conversation.type === 'channel' ? icon('channel', 'conversation-kind-icon') : '';
  const muted = conversation.muted ? icon('volume-off') : '';
  const pin = conversation.pinned ? icon('pin') : '';
  const outgoingCheck =
    message?.senderId === app.data.currentUserId
      ? icon(message.status === 'read' ? 'check-double' : 'check')
      : '';

  return `
    <button
      class="conversation-row${active ? ' is-active' : ''}"
      data-conversation-id="${escapeHtml(conversation.id)}"
      ${override.messageId ? `data-message-id="${escapeHtml(override.messageId)}"` : ''}
      aria-pressed="${active}"
    >
      ${avatarMarkup(view)}
      <span class="conversation-copy">
        <span class="conversation-topline">
          <strong>${escapeHtml(view.title)}</strong>
          <span class="conversation-kind">${kindIcon}</span>
        </span>
        <span class="conversation-previewline">
          ${outgoingCheck}<small>${escapeHtml(preview)}</small>
        </span>
      </span>
      <span class="conversation-meta">
        <time>${escapeHtml(metaTime)}</time>
        <span class="conversation-indicators">
          ${muted}${pin}
          ${conversation.unread ? `<span class="unread-badge">${conversation.unread > 99 ? '99+' : conversation.unread}</span>` : ''}
        </span>
      </span>
    </button>`;
}

function renderSearchResults() {
  const conversationResults = app.searchResults.conversations.filter(
    (conversation) => !conversation.archived,
  );
  const resultMarkup = [];
  if (conversationResults.length) {
    resultMarkup.push(`<div class="list-section-label">${t("Conversations")}</div>`);
    resultMarkup.push(...conversationResults.map((conversation) => renderConversationRow(conversation)));
  }
  if (app.searchResults.users.length) {
    resultMarkup.push(`<div class="list-section-label">${t("People")}</div>`);
    resultMarkup.push(
      ...app.searchResults.users
        .filter((user) => user.id !== app.data.currentUserId)
        .map(
          (user) => `
            <button class="conversation-row" data-user-id="${escapeHtml(user.id)}">
              ${avatarMarkup({ ...user, round: true })}
              <span class="conversation-copy">
                <span class="conversation-topline"><strong>${escapeHtml(user.name)}</strong></span>
                <span class="conversation-previewline"><small>@${escapeHtml(user.username)} · ${escapeHtml(t(user.lastSeen))}</small></span>
              </span>
              <span class="conversation-meta">${icon('chevron-down')}</span>
            </button>`,
        ),
    );
  }
  if (app.searchResults.messages.length) {
    resultMarkup.push(`<div class="list-section-label">${t("Messages")}</div>`);
    resultMarkup.push(
      ...app.searchResults.messages.slice(0, 12).map((message) => {
        const conversation = conversationById(message.conversationId);
        if (!conversation) return '';
        return renderConversationRow(conversation, {
          preview: previewForMessage(message),
          messageId: message.id,
        });
      }),
    );
  }
  if (!resultMarkup.length) {
    return `
      <div class="conversation-empty">
        ${icon('search')}
        <strong>${t("No results")}</strong>
        <span>${t("Try a name, username, or a phrase from a message.")}</span>
      </div>`;
  }
  return resultMarkup.join('');
}

function renderConversationList() {
  if (app.search.trim() && app.searchResults) {
    elements.conversationList.innerHTML = renderSearchResults();
    return;
  }

  const conversations = app.data.conversations
    .filter((conversation) => !conversation.archived)
    .filter((conversation) => {
      if (app.filter === 'unread') return conversation.unread > 0;
      if (app.filter === 'groups') return ['group', 'channel'].includes(conversation.type);
      return true;
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return new Date(lastMessage(b.id)?.createdAt || 0) - new Date(lastMessage(a.id)?.createdAt || 0);
    });

  elements.conversationList.innerHTML = conversations.length
    ? conversations.map((conversation) => renderConversationRow(conversation)).join('')
    : `
      <div class="conversation-empty">
        ${icon('chat')}
        <strong>${t("Nothing here yet")}</strong>
        <span>${t("Change the filter or start a new conversation.")}</span>
      </div>`;
  const unread = app.data.conversations.reduce((total, conversation) => total + (conversation.unread || 0), 0);
  elements.navUnread.textContent = unread ? (unread > 99 ? '99+' : String(unread)) : '';
  elements.profile.textContent = currentUser()?.avatar || 'ME';
}

function renderHeader() {
  const conversation = activeConversation();
  renderAgentStrip(conversation);
  elements.emptyChat.hidden = Boolean(conversation);
  elements.activeChat.hidden = !conversation;
  if (!conversation) return;
  const view = conversationView(conversation);
  elements.chatAvatar.innerHTML = avatarMarkup(view).replace('<span class="avatar', '<span class="avatar');
  elements.chatAvatar.className = `avatar${view.round ? ' round' : ''}`;
  elements.chatAvatar.style.setProperty('--avatar-color', safeColor(view.color));
  elements.chatAvatar.textContent = view.initials;
  if (view.online) {
    const online = document.createElement('span');
    online.className = 'avatar-online';
    elements.chatAvatar.append(online);
  }
  elements.chatTitle.textContent = view.title;
  elements.chatStatus.textContent = view.status;
  document.title = `${view.title} · Weyuna`;

  const pinnedMessage = conversationMessages(conversation.id).find(
    (message) => !message.deleted && (message.replyToId || conversation.id === 'chat-mia'),
  );
  elements.pinnedStrip.hidden = !pinnedMessage;
  if (pinnedMessage) {
    elements.pinnedPreview.textContent = previewForMessage(pinnedMessage);
    elements.pinnedStrip.dataset.messageId = pinnedMessage.id;
  }

  element('voice-call-button').disabled = conversation.type === 'channel';
  element('video-call-button').disabled = conversation.type === 'channel';
}

function attachmentMarkup(attachment) {
  const name = escapeHtml(attachment.name);
  const type = String(attachment.type || '');
  const allowed =
    attachment.url?.startsWith('/assets/') ||
    /^data:(image\/(png|jpeg|jpg|webp|gif)|audio\/|video\/|application\/)/i.test(
      attachment.url || '',
    );
  if (!allowed) return '';
  if (type.startsWith('image/') && !type.includes('svg')) {
    return `<a class="message-attachment" href="${escapeHtml(attachment.url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(attachment.url)}" alt="${name}" loading="lazy" /></a>`;
  }
  return `
    <a class="message-attachment file-attachment" href="${escapeHtml(attachment.url)}" download="${name}">
      <span class="file-attachment-icon">${icon(type.startsWith('audio/') ? 'volume' : 'file')}</span>
      <span class="file-attachment-copy">
        <strong>${name}</strong>
        <small>${escapeHtml(formatSize(attachment.size))} · ${escapeHtml(type.split('/')[1] || 'file')}</small>
      </span>
    </a>`;
}

function renderMessage(message, previousMessage) {
  const sender = userById(message.senderId);
  const who = speaker(message);
  const outgoing = who.mine;
  const sameSender = previousMessage?.senderId === message.senderId;
  const closeInTime =
    previousMessage &&
    new Date(message.createdAt) - new Date(previousMessage.createdAt) < 5 * 60_000;
  const isNewGroup = !sameSender || !closeInTime;
  const reply = message.replyToId ? messageById(message.replyToId) : null;
  const reactions = (message.reactions || [])
    .filter((reaction) => reaction.userIds.length)
    .map(
      (reaction) => `
        <button
          class="reaction-chip${reaction.userIds.includes(app.data.currentUserId) ? ' is-mine' : ''}"
          data-message-action="react"
          data-message-id="${escapeHtml(message.id)}"
          data-emoji="${escapeHtml(reaction.emoji)}"
          aria-label="${escapeHtml(t('React {emoji}', { emoji: reaction.emoji }))}"
        >
          <span>${escapeHtml(reaction.emoji)}</span><small>${reaction.userIds.length}</small>
        </button>`,
    )
    .join('');
  const replyMarkup =
    reply && !reply.deleted
      ? `
        <button class="reply-quote" data-jump-message="${escapeHtml(reply.id)}" type="button">
          <div>
            <strong>${icon('reply')} ${escapeHtml(shortByline(reply))}</strong>
            <span>${escapeHtml(previewForMessage(reply))}</span>
          </div>
        </button>`
      : '';
  const sourceConversation = message.forwardedFrom
    ? conversationById(message.forwardedFrom.conversationId)
    : null;
  const sourceUser = message.forwardedFrom ? userById(message.forwardedFrom.senderId) : null;
  const forwardedMarkup = message.forwardedFrom
    ? `<span class="forwarded-label">${icon('forward')}${t('Forwarded from')} ${escapeHtml(
        sourceUser?.name || sourceConversation?.title || t('another conversation'),
      )}</span>`
    : '';
  const textMarkup = message.deleted
    ? `<p class="message-text">${t("This message was deleted")}</p>`
    : message.text
      ? `<p class="message-text">${richText(message.text, message.mentions)}</p>`
      : '';
  const attachments = message.deleted
    ? ''
    : (message.attachments || []).map(attachmentMarkup).join('');
  const tools = message.deleted
    ? ''
    : `
      <div class="message-tools" aria-label="${t("Message actions")}">
        <button class="message-tool" data-message-action="reply" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Reply")}">${icon('reply')}</button>
        <button class="message-tool" data-message-action="forward" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Forward")}">${icon('forward')}</button>
        <button class="message-tool" data-message-action="reaction-picker" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Add reaction")}">${icon('smile')}</button>
        <button class="message-tool" data-message-action="save" data-message-id="${escapeHtml(message.id)}" aria-label="${t(message.savedBy?.includes(app.data.currentUserId) ? 'Remove from saved' : 'Save message')}">${icon('bookmark')}</button>
        ${
          who.canEdit
            ? `<button class="message-tool" data-message-action="edit" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Edit")}">${icon('edit')}</button>
               <button class="message-tool danger" data-message-action="delete" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Delete")}">${icon('trash')}</button>`
            : ''
        }
      </div>`;
  const matchesSearch =
    app.messageSearch &&
    message.text.toLowerCase().includes(app.messageSearch.toLocaleLowerCase());
  return `
    <article
      class="message-row${outgoing ? ' is-outgoing' : ''}${who.role ? ' from-agent' : ''}${isNewGroup ? ' is-new-group' : ''}${matchesSearch ? ' is-search-match' : ''}"
      id="message-${escapeHtml(message.id)}"
      data-message-id="${escapeHtml(message.id)}"
    >
      ${
        outgoing
          ? ''
          : `<span class="message-author-avatar" style="background:${safeColor(sender?.color)}">${escapeHtml(sender?.avatar || '?')}</span>`
      }
      <div class="message-body-wrap">
        ${isNewGroup || who.role ? `<div class="message-author"><strong>${escapeHtml(who.name)}</strong>
          ${who.role ? `<span class="agent-tag">${escapeHtml(who.role)}</span>` : ''}
          ${who.delegated ? `<small>${t("Offline delegate")}</small>` : ''}
          ${message.scripted ? `<small>${t("Demo")}</small>` : ''}</div>` : ''}
        <div class="message-bubble${message.deleted ? ' is-deleted' : ''}">
          ${forwardedMarkup}
          ${attachments}
          ${textMarkup}
          ${replyMarkup}
          <div class="message-meta">
            ${message.editedAt ? `<span class="message-edited">${t("edited")}</span>` : ''}
            ${!message.deleted && !who.role && Object.keys(message.delivery || {}).length ? `<button class="delivery-info" data-message-action="delivery" data-message-id="${escapeHtml(message.id)}" aria-label="${t("Agent delivery details")}" title="${t("Agent delivery details")}">${icon('info')}</button>` : ''}
            <time datetime="${escapeHtml(message.createdAt)}">${escapeHtml(formatTime(message.createdAt))}</time>
            ${outgoing && !message.deleted ? icon(message.status === 'read' ? 'check-double' : 'check') : ''}
          </div>
          ${reactions ? `<div class="message-reactions">${reactions}</div>` : ''}
        </div>
        ${tools}
      </div>
    </article>`;
}

function renderMessages({ scroll = false } = {}) {
  const conversation = activeConversation();
  if (!conversation) {
    elements.messageFlow.innerHTML = '';
    return;
  }
  const messages = conversationMessages(conversation.id);
  let previousDay = '';
  let previousMessage = null;
  const output = [];
  for (const message of messages) {
    const day = new Date(message.createdAt).toDateString();
    if (day !== previousDay) {
      output.push(`<div class="date-separator"><span>${escapeHtml(formatDay(message.createdAt))}</span></div>`);
      previousDay = day;
      previousMessage = null;
    }
    output.push(renderMessage(message, previousMessage));
    previousMessage = message;
  }
  elements.messageFlow.innerHTML = output.join('') || `
    <div class="conversation-empty">
      ${icon('chat')}
      <strong>${t("Start the conversation")}</strong>
      <span>${t("Messages you send will appear here.")}</span>
    </div>`;
  const matchCount = messages.filter(
    (message) =>
      app.messageSearch &&
      message.text.toLowerCase().includes(app.messageSearch.toLocaleLowerCase()),
  ).length;
  elements.messageSearchCount.textContent = app.messageSearch
    ? t(matchCount === 1 ? '{count} match' : '{count} matches', { count: matchCount })
    : '';

  if (scroll) requestAnimationFrame(scrollToLatest);
}

function scrollToLatest() {
  elements.messageScroller.scrollTop = elements.messageScroller.scrollHeight;
  element('jump-latest').hidden = true;
}

function jumpToMessage(messageId) {
  const target = element(`message-${messageId}`);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.remove('is-highlighted');
  requestAnimationFrame(() => target.classList.add('is-highlighted'));
  setTimeout(() => target.classList.remove('is-highlighted'), 1800);
}

function renderComposerBanner() {
  const reply = app.replyToId ? messageById(app.replyToId) : null;
  const editing = app.editingMessageId ? messageById(app.editingMessageId) : null;
  const active = reply || editing;
  elements.replyBanner.hidden = !active;
  if (reply) {
    elements.replyName.textContent = t('Replying to {name}', { name: shortByline(reply) });
    elements.replyText.textContent = previewForMessage(reply);
  }
  if (editing) {
    elements.replyName.textContent = t('Editing message');
    elements.replyText.textContent = previewForMessage(editing);
  }
  elements.attachmentPreview.hidden = !app.attachment;
  if (app.attachment) {
    const preview = app.attachment.type.startsWith('image/')
      ? `<img src="${escapeHtml(app.attachment.url)}" alt="" />`
      : `<span class="file-icon">${icon('file')}</span>`;
    elements.attachmentPreview.innerHTML = `
      ${preview}
      <span class="attachment-preview-copy">
        <strong>${escapeHtml(app.attachment.name)}</strong>
        <span>${escapeHtml(formatSize(app.attachment.size))}</span>
      </span>
      <button class="icon-button small" id="remove-attachment" type="button" aria-label="${t("Remove attachment")}">${icon('x')}</button>`;
  }
  elements.sendButton.disabled =
    (!elements.messageInput.value.trim() && !app.attachment) || Boolean(app.recording);
}

function renderDetails() {
  const conversation = activeConversation();
  if (!app.detailsOpen || !conversation) {
    elements.details.hidden = true;
    return;
  }
  const view = conversationView(conversation);
  const sharedImages = conversationMessages(conversation.id)
    .flatMap((message) => message.attachments || [])
    .filter(
      (attachment) =>
        attachment.type.startsWith('image/') &&
        (attachment.url.startsWith('/assets/') || attachment.url.startsWith('data:image/')),
    );
  const members = conversation.memberIds.map(userById).filter(Boolean);
  const detailDescription =
    conversation.description || view.user?.bio || t('Messages stay in this local product demo.');
  elements.details.hidden = false;
  elements.details.innerHTML = `
    <header class="details-header">
      <h2>${t("Conversation details")}</h2>
      <button class="icon-button small" data-details-action="close" aria-label="${t("Close details")}">${icon('x')}</button>
    </header>
    <div class="details-hero">
      ${avatarMarkup(view)}
      <h3>${escapeHtml(view.title)}</h3>
      <p>${escapeHtml(detailDescription)}</p>
      <div class="details-quick-actions">
        <button class="details-quick-action" data-details-action="search"><span>${icon('search')}</span><span>${t("Search")}</span></button>
        <button class="details-quick-action" data-details-action="call" ${conversation.type === 'channel' ? 'disabled' : ''}><span>${icon('phone')}</span><span>${t("Call")}</span></button>
        <button class="details-quick-action" data-details-action="video" ${conversation.type === 'channel' ? 'disabled' : ''}><span>${icon('video')}</span><span>${t("Video")}</span></button>
      </div>
    </div>
    <section class="details-section">
      <div class="details-section-title"><h4>${t("Information")}</h4></div>
      ${
        view.user
          ? `<div class="details-info-row">${icon('globe')}<span><strong>@${escapeHtml(view.user.username)}</strong><small>${t("Username")}</small></span></div>`
          : ''
      }
      <div class="details-info-row">${icon(conversation.type === 'channel' ? 'channel' : 'users')}<span><strong>${escapeHtml(view.status)}</strong><small>${t(conversation.type === 'channel' ? 'Audience' : 'Members')}</small></span></div>
      <div class="details-info-row">${icon('lock')}<span><strong>${t("Local demo storage")}</strong><small>${t("Not a Telegram account or secure messenger")}</small></span></div>
      ${conversation.type !== 'channel' ? `<div class="details-info-row"><span><strong>${t("Agents with access")}</strong><small>${(conversation.openAgents || []).map(escapeHtml).join(' · ') || t('None')}</small></span>
        <button class="text-button" data-details-action="agents">${t("Manage")}</button></div>` : ''}
    </section>
    <section class="details-section">
      <div class="details-section-title"><h4>${t("Shared media")}</h4><span>${sharedImages.length}</span></div>
      <div class="shared-media">
        ${
          sharedImages.length
            ? sharedImages
                .slice(0, 6)
                .map(
                  (attachment) =>
                    `<a class="shared-media-item" href="${escapeHtml(attachment.url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.name)}" /></a>`,
                )
                .join('')
            : `<small class="detail-empty">${t("Shared images appear here.")}</small>`
        }
      </div>
    </section>
    ${
      members.length > 1
        ? `<section class="details-section">
            <div class="details-section-title"><h4>${t("Members")}</h4><span>${members.length}</span></div>
            <div class="member-list">
              ${members
                .map(
                  (member) => `
                    <div class="member-row">
                      ${avatarMarkup(member)}
                      <span class="member-copy">
                        <strong>${escapeHtml(member.name)}${member.id === app.data.currentUserId ? t(' (you)') : ''}</strong>
                        <small>${escapeHtml(t(member.lastSeen))}</small>
                      </span>
                    </div>`,
                )
                .join('')}
            </div>
          </section>`
        : ''
    }
    <section class="details-section">
      <div class="details-toggle-list">
        <button class="details-toggle${conversation.muted ? ' is-on' : ''}" data-details-action="mute">${icon('volume-off')}<span>${t("Mute notifications")}</span><span class="switch"></span></button>
        <button class="details-toggle${conversation.pinned ? ' is-on' : ''}" data-details-action="pin">${icon('pin')}<span>${t("Pin conversation")}</span><span class="switch"></span></button>
        <button class="details-toggle danger" data-details-action="archive">${icon('archive')}<span>${t("Archive conversation")}</span></button>
      </div>
    </section>`;
}

function applyPreferences() {
  if (app.data.settings.language && language !== app.data.settings.language) {
    setLanguage(app.data.settings.language);
    document.documentElement.lang = language;
    refreshShell();
    document.querySelector('.sidebar-footer span:nth-child(2)').textContent = t(app.reconnectNotice ? 'Reconnecting to local demo...' : 'Connected to local demo');
    if (elements.dialog.open && element('interface-language')) {
      const focused = document.activeElement?.id === 'interface-language';
      openSettings();
      if (focused) element('interface-language').focus();
    }
    renderComposerBanner();
  }
  const theme = app.data.settings.theme || 'system';
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('compact', Boolean(app.data.settings.compact));
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#202432' : '#5e6ce8');
}

function renderAll({ scroll = false } = {}) {
  applyPreferences();
  renderConversationList();
  if (onContactsPage()) { renderDirectory(); return; }
  renderHeader();
  if (!element('mention-picker').hidden) renderMentionPicker();
  renderMessages({ scroll });
  renderComposerBanner();
  renderDetails();
  hydrateIcons();
}

async function selectConversation(conversationId, { messageId = null, scroll = true } = {}) {
  const conversation = conversationById(conversationId);
  if (!conversation) return;
  if (onContactsPage()) navigateWorkspace('');
  app.activeConversationId = conversationId;
  app.mentions.clear();
  hideMentionPicker();
  app.messageSearch = '';
  app.replyToId = null;
  app.editingMessageId = null;
  app.attachment = null;
  elements.messageInput.value = '';
  elements.messageInput.style.height = '';
  elements.messageSearch.value = '';
  elements.chatSearchBar.hidden = true;
  elements.emojiTray.hidden = true;
  elements.app.classList.add('chat-open');
  localStorage.setItem('weyuna.activeConversation', conversationId);
  conversation.unread = 0;
  conversation.archived = false;
  renderAll({ scroll });
  if (messageId) {
    requestAnimationFrame(() => jumpToMessage(messageId));
  }
  await safely(
    () =>
      api(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'PATCH',
        body: { read: true, archived: false },
      }),
    'Could not mark the conversation as read',
  );
}

async function openDirectConversation(userId) {
  const user = userById(userId);
  if (!user || user.id === app.data.currentUserId) return;
  const existing = app.data.conversations.find(
    (conversation) =>
      conversation.type === 'direct' &&
      conversation.memberIds.includes(userId) &&
      conversation.memberIds.includes(app.data.currentUserId),
  );
  if (existing) {
    closeDialog();
    await selectConversation(existing.id);
    return;
  }
  const result = await safely(
    () =>
      api('/api/conversations', {
        method: 'POST',
        body: { type: 'direct', title: user.name, memberIds: [userId] },
      }),
    'Could not create the conversation',
  );
  if (!result) return;
  closeDialog();
  await loadState();
  await selectConversation(result.conversation.id);
}

async function loadState() {
  const state = await api('/api/bootstrap');
  app.data = state;
  const savedConversationId = localStorage.getItem('weyuna.activeConversation');
  if (!conversationById(savedConversationId)) {
    app.activeConversationId =
      app.data.conversations.find((conversation) => conversation.pinned)?.id ||
      app.data.conversations[0]?.id ||
      null;
  } else {
    app.activeConversationId = savedConversationId;
  }
  renderAll({ scroll: true });
}

function connectEvents() {
  app.eventSource = new EventSource('/api/events');
  app.eventSource.addEventListener('state', (event) => {
    try {
      const update = JSON.parse(event.data);
      if (update.state.currentUserId !== app.data.currentUserId) return location.reload();
      const oldCount = app.activeConversationId ? conversationMessages(app.activeConversationId).length : 0;
      app.data = update.state;
      const newCount = app.activeConversationId ? conversationMessages(app.activeConversationId).length : 0;
      applyPreferences();
      renderConversationList();
      if (onContactsPage()) { renderDirectory(); return; }
      renderHeader();
      if (!element('mention-picker').hidden) renderMentionPicker();
      renderMessages({ scroll: newCount > oldCount });
      renderDetails();
      if (app.detailsOpen) hydrateIcons(elements.details);

      if (
        update.type === 'message.created' &&
        update.payload?.conversationId === app.activeConversationId &&
        update.payload?.senderId !== app.data.currentUserId
      ) {
        elements.typing.hidden = true;
        if (app.data.settings.sound) playTone();
        api(`/api/conversations/${encodeURIComponent(app.activeConversationId)}`, {
          method: 'PATCH',
          body: { read: true },
        }).catch((error) => console.error('Could not acknowledge incoming message', error));
      }
      const footer = document.querySelector('.sidebar-footer span:nth-child(2)');
      if (footer) footer.textContent = t('Connected to local demo');
      app.reconnectNotice = false;
    } catch (error) {
      console.error('Could not process real-time update', error);
    }
  });
  app.eventSource.onerror = () => {
    const footer = document.querySelector('.sidebar-footer span:nth-child(2)');
    if (footer) footer.textContent = t('Reconnecting to local demo...');
    if (!app.reconnectNotice) {
      api('/api/bootstrap').catch((error) => { if (error.status === 401) location.reload(); });
      showToast('Live updates are reconnecting', 'error');
      app.reconnectNotice = true;
    }
  };
}

function playTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => context.close();
  } catch (error) {
    console.warn('Notification sound is unavailable in this browser', error);
  }
}

function openPopover(anchor, markup, width = 200) {
  elements.menu.innerHTML = markup;
  elements.menu.style.width = `${width}px`;
  elements.menu.hidden = false;
  const bounds = anchor.getBoundingClientRect();
  const menuBounds = elements.menu.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - menuBounds.width - 10,
    Math.max(10, bounds.right - menuBounds.width),
  );
  const top =
    bounds.bottom + menuBounds.height + 12 > window.innerHeight
      ? Math.max(10, bounds.top - menuBounds.height - 7)
      : bounds.bottom + 7;
  elements.menu.style.left = `${left}px`;
  elements.menu.style.top = `${top}px`;
  hydrateIcons(elements.menu);
}

function closePopover() {
  elements.menu.hidden = true;
  elements.menu.innerHTML = '';
}

function openReactionPicker(anchor, messageId) {
  elements.menu.innerHTML = `
    <div class="reaction-picker-menu">
      ${['❤', '👍', '😂', '👏', '🔥', '🎉']
        .map(
          (emoji) =>
            `<button data-menu-action="react" data-message-id="${escapeHtml(messageId)}" data-emoji="${emoji}" aria-label="${t('React {emoji}', { emoji })}">${emoji}</button>`,
        )
        .join('')}
    </div>`;
  openPopover(anchor, elements.menu.innerHTML, 232);
}

function openConversationMenu(anchor) {
  const conversation = activeConversation();
  if (!conversation) return;
  openPopover(
    anchor,
    `
      <button class="menu-item" data-menu-action="details">${icon('info')}${t("Open details")}</button>
      <button class="menu-item" data-menu-action="search">${icon('search')}${t("Search conversation")}</button>
      <button class="menu-item" data-menu-action="pin">${icon('pin')}${t(conversation.pinned ? 'Unpin conversation' : 'Pin conversation')}</button>
      <button class="menu-item" data-menu-action="mute">${icon('volume-off')}${t(conversation.muted ? 'Unmute notifications' : 'Mute notifications')}</button>
      <div class="menu-divider"></div>
      <button class="menu-item danger" data-menu-action="archive">${icon('archive')}${t("Archive conversation")}</button>
    `,
  );
}

async function updateActiveConversation(patch) {
  const conversation = activeConversation();
  if (!conversation) return false;
  const result = await safely(
    () =>
      api(`/api/conversations/${encodeURIComponent(conversation.id)}`, {
        method: 'PATCH',
        body: patch,
      }),
    'Could not update the conversation',
  );
  if (!result) return false;
  Object.assign(conversation, result.conversation);
  renderAll();
  return true;
}

async function archiveActiveConversation() {
  const archived = await updateActiveConversation({ archived: true });
  if (!archived) return;
  app.activeConversationId = null;
  app.detailsOpen = false;
  elements.app.classList.remove('chat-open');
  renderAll();
  showToast('Conversation archived');
}

function openDialog(markup) {
  elements.dialogContent.innerHTML = `<div class="dialog-content">${markup}</div>`;
  if (!elements.dialog.open) elements.dialog.showModal();
  hydrateIcons(elements.dialogContent);
}

function closeDialog() {
  if (elements.dialog.open) elements.dialog.close();
  elements.dialogContent.replaceChildren();
  app.dialogDraft = null;
}

function openNewConversation(type = 'direct') {
  app.dialogDraft = {
    type: type === 'group' ? 'group' : 'direct',
    memberIds: new Set(),
    title: '',
    description: '',
  };
  renderNewConversationDialog();
}

function renderNewConversationDialog() {
  const draft = app.dialogDraft;
  const users = app.data.users.filter((user) => user.id !== app.data.currentUserId);
  const groupLike = draft.type !== 'direct';
  openDialog(`
    <span class="dialog-kicker">${t("Create")}</span>
    <h2>${t("Start a conversation")}</h2>
    <p class="dialog-subtitle">${t("Choose a direct message, a shared group, or a one-way channel.")}</p>
    <div class="dialog-tabs" role="tablist">
      ${['direct', 'group', 'channel']
        .map(
          (type) =>
            `<button type="button" class="dialog-tab${draft.type === type ? ' is-active' : ''}" data-new-chat-type="${type}">${t(type === 'direct' ? 'Direct' : type === 'group' ? 'Group' : 'Channel')}</button>`,
        )
        .join('')}
    </div>
    <form id="new-conversation-form">
      ${
        groupLike
          ? `<label class="form-field"><span>${t("Name")}</span><input class="form-input" id="new-chat-title" maxlength="120" value="${escapeHtml(draft.title)}" placeholder="${t(draft.type === 'channel' ? 'Channel name' : 'Group name')}" required /></label>
             <label class="form-field"><span>${t("Description")}</span><textarea class="form-textarea" id="new-chat-description" maxlength="280" placeholder="${t("What is this conversation for?")}">${escapeHtml(draft.description)}</textarea></label>`
          : ''
      }
      <span class="form-label">${t(draft.type === 'channel' ? 'Add initial subscribers (optional)' : 'Choose people')}</span>
      <div class="member-picker">
        ${users
          .map(
            (user) => `
              <button type="button" class="member-option${draft.memberIds.has(user.id) ? ' is-selected' : ''}" data-member-id="${escapeHtml(user.id)}">
                ${avatarMarkup({ ...user, round: true })}
                <span class="member-option-copy">
                  <strong>${escapeHtml(user.name)}</strong>
                  <small>@${escapeHtml(user.username)} · ${escapeHtml(t(user.lastSeen))}</small>
                </span>
                <span class="member-option-check">${icon('check')}</span>
              </button>`,
          )
          .join('')}
      </div>
      <div class="dialog-actions">
        <button class="secondary-button" type="button" data-dialog-action="close">${t("Cancel")}</button>
        <button class="primary-button" type="submit" ${draft.type !== 'channel' && !draft.memberIds.size ? 'disabled' : ''}>${t(`Create ${draft.type}`)}</button>
      </div>
    </form>`);
}

function captureNewChatDraft() {
  if (!app.dialogDraft) return;
  app.dialogDraft.title = element('new-chat-title')?.value || '';
  app.dialogDraft.description = element('new-chat-description')?.value || '';
}

async function createConversationFromDialog() {
  const draft = app.dialogDraft;
  captureNewChatDraft();
  const memberIds = [...draft.memberIds];
  const selectedUser = userById(memberIds[0]);
  const title =
    draft.type === 'direct'
      ? selectedUser?.name || 'Direct conversation'
      : draft.title.trim();
  const result = await safely(
    () =>
      api('/api/conversations', {
        method: 'POST',
        body: {
          type: draft.type,
          title,
          description: draft.description.trim(),
          memberIds,
        },
      }),
    'Could not create the conversation',
  );
  if (!result) return;
  closeDialog();
  await loadState();
  await selectConversation(result.conversation.id);
  showToast(`${draft.type === 'channel' ? 'Channel' : draft.type === 'group' ? 'Group' : 'Conversation'} created`);
}

function onContactsPage() {
  return /^#contacts(?:\/|$)/.test(location.hash);
}

function navigateWorkspace(hash) {
  if (location.hash !== hash) history.pushState(null, '', location.pathname + location.search + hash);
  renderWorkspace();
}

function renderWorkspace() {
  if (!app.data) return;
  const contacts = onContactsPage();
  element('contacts-page').hidden = !contacts;
  element('chats-index').hidden = element('chat-pane').hidden = contacts;
  for (const button of document.querySelectorAll('[data-view="chats"], [data-view="contacts"]')) {
    const active = button.dataset.view === (contacts ? 'contacts' : 'chats');
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (contacts) {
    app.detailsOpen = false;
    renderDetails();
    hideMentionPicker();
    closePopover();
    renderDirectory();
  } else renderAll();
}

function renderDirectory() {
  const contacts = app.data.users.filter((u) => u.id !== app.data.currentUserId);
  const selected = contacts.find((u) => location.hash === `#contacts/${encodeURIComponent(u.id)}`);
  const q = element('contact-search').value.trim().toLowerCase().replace(/^@/, '');
  const visible = contacts.filter((u) => [u.name, u.username, u.id].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, language) || a.id.localeCompare(b.id));
  const byInitial = new Map();
  for (const u of visible) {
    const letter = Array.from(u.name.trim())[0]?.toLocaleUpperCase() || '#';
    if (!byInitial.has(letter)) byInitial.set(letter, []);
    byInitial.get(letter).push(u);
  }
  element('contact-count').textContent = q ? `${visible.length} / ${contacts.length}` : String(contacts.length);
  const list = [...byInitial].map(([letter, rows], i) => `<section id="initial-${i}"><h2>${escapeHtml(letter)}</h2>${rows.map((u) =>
    `<button class="contact-card" data-contact-profile="${escapeHtml(u.id)}" aria-pressed="${selected?.id === u.id}">
      ${avatarMarkup({ ...u, round: true })}<span class="contact-card-copy"><strong>${escapeHtml(u.name)}</strong>
      <small>@${escapeHtml(u.username)}</small></span></button>`).join('')}</section>`).join('');
  const letters = [...byInitial.keys()].map((letter, i) => `<button data-initial="${i}" aria-label="${escapeHtml(t('Jump to {letter}', { letter }))}">${escapeHtml(letter)}</button>`).join('');
  const profile = selected ? `<article>
    ${avatarMarkup({ ...selected, round: true })}<h2>${escapeHtml(selected.name)}</h2>
    <p>@${escapeHtml(selected.username)} · ${escapeHtml(t(selected.lastSeen))}</p>
    <p class="profile-bio">${escapeHtml(selected.bio)}</p>
    <button class="primary-button" data-start-direct="${escapeHtml(selected.id)}">${icon('chat')} ${t("Send message")}</button></article>` :
    `<div class="conversation-empty">${icon('users')}<strong>${t("Select a contact")}</strong><span>${t("Open a profile to start a conversation.")}</span></div>`;
  // Keep the focused row and scroll position across unrelated SSE refreshes.
  for (const [id, markup] of [
    ['directory-list', list || `<p class="conversation-empty">${t("No contacts found.")}</p>`], ['directory-letters', letters],
    ['contact-profile', selected ? `<button class="text-button profile-back" data-contact-back>${icon('arrow-left')}${t("Contacts")}</button>${profile}` : profile],
  ]) {
    const target = element(id);
    if (target._markup !== markup) { target.innerHTML = markup; target._markup = markup; }
  }
  element('contacts-page').classList.toggle('has-profile', !!selected);
  document.title = `${selected?.name ? `${selected.name} · ` : ''}${t('Contacts')} · Weyuna`;
}

function openCalls() {
  if (app.call) {
    elements.callScreen.hidden = false;
    return;
  }
  openDialog(`
    <span class="dialog-kicker">${t("History")}</span>
    <h2>${t("Recent calls")}</h2>
    <p class="dialog-subtitle">${t("Calls in this prototype are interface simulations and never access your devices.")}</p>
    <div class="call-log">
      ${
        app.data.calls.length
          ? app.data.calls
              .map((call) => {
                const conversation = conversationById(call.conversationId);
                if (!conversation) return '';
                const view = conversationView(conversation);
                return `
                  <div class="call-log-row">
                    ${avatarMarkup(view)}
                    <span class="call-log-copy">
                      <strong>${escapeHtml(view.title)}</strong>
                      <small>${t(call.type === 'video' ? 'Video' : 'Voice')} · ${escapeHtml(formatFullDate(call.startedAt))} · ${escapeHtml(t(call.status))}</small>
                    </span>
                    <button class="icon-button small" data-call-conversation="${escapeHtml(conversation.id)}" data-call-type="${call.type}" aria-label="${t("Call again")}">${icon('phone')}</button>
                  </div>`;
              })
              .join('')
          : `<div class="conversation-empty"><strong>${t("No call history")}</strong><span>${t("Start a call from any direct message or group.")}</span></div>`
      }
    </div>`);
}

function openSaved() {
  const saved = app.data.messages
    .filter((message) => !message.deleted && message.savedBy?.includes(app.data.currentUserId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  openDialog(`
    <span class="dialog-kicker">${t("Personal collection")}</span>
    <h2>${t("Saved messages")}</h2>
    <p class="dialog-subtitle">${t("Bookmark useful messages from a conversation with the bookmark action.")}</p>
    <div class="saved-message-list">
      ${
        saved.length
          ? saved
              .map((message) => {
                const conversation = conversationById(message.conversationId);
                const view = conversation ? conversationView(conversation) : null;
                return `
                  <button class="saved-message" data-saved-conversation="${escapeHtml(message.conversationId)}" data-saved-message="${escapeHtml(message.id)}">
                    <p>${escapeHtml(previewForMessage(message))}</p>
                    <small>${escapeHtml(view?.title || t('Conversation'))} · ${escapeHtml(formatFullDate(message.createdAt))}</small>
                  </button>`;
              })
              .join('')
          : `<div class="conversation-empty"><strong>${t("No saved messages yet")}</strong><span>${t("Use the bookmark icon beside any message.")}</span></div>`
      }
    </div>`);
}

function openSettings() {
  const settings = app.data.settings;
  const user = currentUser();
  openDialog(`
    <span class="dialog-kicker">${t("Preferences")}</span>
    <h2>${t("Settings")}</h2>
    <p class="dialog-subtitle">${t("Customize this local prototype. Changes are stored by the server.")}</p>
    <div class="settings-profile-card">
      ${avatarMarkup({ ...user, round: true })}
      <span class="settings-profile-copy">
        <strong>${escapeHtml(user.name)}</strong>
        <small>@${escapeHtml(user.username)} · ${t('local demo profile')}</small>
      </span>
      <button class="secondary-button" data-dialog-action="edit-profile">${t("Edit")}</button>
    </div>
    <button class="primary-button" type="button" data-my-agents>${t("My agents")}</button>
    <button class="secondary-button" type="button" data-dialog-action="logout">${t("Sign out")}</button>
    <section class="settings-section">
      <label class="setting-row" for="interface-language">${icon('globe')}
        <strong class="setting-copy">${t('Language')}</strong>
        <select class="form-input" id="interface-language" style="width:auto">
          <option value="zh-CN" lang="zh-CN"${language === 'zh-CN' ? ' selected' : ''}>简体中文</option>
          <option value="en" lang="en"${language === 'en' ? ' selected' : ''}>English</option>
        </select>
      </label>
    </section>
    <section class="settings-section">
      <h3>${t("Appearance")}</h3>
      <div class="theme-options">
        ${['light', 'dark', 'system']
          .map(
            (theme) => `
              <button class="theme-card${settings.theme === theme ? ' is-active' : ''}" data-theme-option="${theme}" type="button">
                <span class="theme-swatch"></span>
                <span>${t(theme[0].toUpperCase()+theme.slice(1))}</span>
              </button>`,
          )
          .join('')}
      </div>
      <label class="setting-row">
        ${icon('compact')}
        <span class="setting-copy"><strong>${t("Compact density")}</strong><small>${t("Show more conversations and messages at once.")}</small></span>
        <span class="switch-control"><input type="checkbox" data-setting="compact" ${settings.compact ? 'checked' : ''} /><span class="switch"></span></span>
      </label>
    </section>
    <section class="settings-section">
      <h3>${t("Demo behavior")}</h3>
      <label class="setting-row">
        ${icon('chat')}
        <span class="setting-copy"><strong>${t("Simulated replies")}</strong><small>${t("Receive a scripted response after sending a direct or group message.")}</small></span>
        <span class="switch-control"><input type="checkbox" data-setting="demoReplies" ${settings.demoReplies ? 'checked' : ''} /><span class="switch"></span></span>
      </label>
      <label class="setting-row">
        ${icon('volume')}
        <span class="setting-copy"><strong>${t("Interface sounds")}</strong><small>${t("Play a subtle tone for incoming demo messages.")}</small></span>
        <span class="switch-control"><input type="checkbox" data-setting="sound" ${settings.sound ? 'checked' : ''} /><span class="switch"></span></span>
      </label>
    </section>
    <section class="settings-section">
      <h3>${t("Important")}</h3>
      <div class="setting-row">
        ${icon('lock')}
        <span class="setting-copy"><strong>${t("Prototype mode")}</strong><small>${t("No Telegram API, real phone verification, end-to-end encryption, or device access is connected.")}</small></span>
      </div>
    </section>`);
}

function openProfileEditor() {
  const user = currentUser();
  openDialog(`
    <span class="dialog-kicker">${t("Your account")}</span>
    <h2>${t("Edit profile")}</h2>
    <p class="dialog-subtitle">${t("This profile belongs only to the local Weyuna demo.")}</p>
    <div class="profile-summary">
      ${avatarMarkup({ ...user, round: true })}
      <h3>${escapeHtml(user.name)}</h3>
      <p>${escapeHtml(user.bio)}</p>
    </div>
    <form id="profile-form">
      <label class="form-field"><span>${t("Display name")}</span><input class="form-input" name="name" value="${escapeHtml(user.name)}" maxlength="80" required /></label>
      <label class="form-field"><span>${t("Username")}</span><input class="form-input" name="username" value="${escapeHtml(user.username)}" minlength="3" maxlength="32" pattern="[A-Za-z0-9_]{3,32}" required /></label>
      <label class="form-field"><span>${t("Bio")}</span><textarea class="form-textarea" name="bio" maxlength="140">${escapeHtml(user.bio)}</textarea></label>
      <div class="dialog-actions">
        <button class="secondary-button" type="button" data-dialog-action="close">${t("Cancel")}</button>
        <button class="primary-button" type="submit">${t("Save profile")}</button>
      </div>
    </form>`);
}

async function saveSettings(patch) {
  const result = await safely(
    () => api('/api/settings', { method: 'PATCH', body: patch }),
    'Could not save settings',
  );
  if (!result) return false;
  app.data.settings = result.settings;
  if (patch.language) renderAll(); else applyPreferences();
  return true;
}

function startEdit(message) {
  if (message.senderId !== app.data.currentUserId || message.deleted) return;
  app.editingMessageId = message.id;
  app.replyToId = null;
  elements.messageInput.value = message.text;
  app.mentions = new Set(message.mentions || []);
  hideMentionPicker();
  resizeComposer();
  renderComposerBanner();
  elements.messageInput.focus();
}

function startReply(message) {
  if (message.deleted) return;
  app.replyToId = message.id;
  app.editingMessageId = null;
  renderComposerBanner();
  elements.messageInput.focus();
}

function cancelComposerContext() {
  app.replyToId = null;
  if (app.editingMessageId) {
    elements.messageInput.value = '';
    app.mentions.clear();
  }
  app.editingMessageId = null;
  resizeComposer();
  renderComposerBanner();
}

async function submitMessage() {
  const conversation = activeConversation();
  if (!conversation) return;
  const text = elements.messageInput.value.trim();
  pruneMentions();
  if (!text && !app.attachment) return;
  elements.sendButton.disabled = true;
  if (app.editingMessageId) {
    const result = await safely(
      () =>
        api(`/api/messages/${encodeURIComponent(app.editingMessageId)}`, {
          method: 'PATCH',
          body: { text, mentions: [...app.mentions] },
        }),
      'Could not edit the message',
    );
    if (!result) {
      elements.sendButton.disabled = false;
      return;
    }
    app.editingMessageId = null;
  } else {
    const result = await safely(
      () =>
        api(`/api/conversations/${encodeURIComponent(conversation.id)}/messages`, {
          method: 'POST',
          body: {
            text,
            replyToId: app.replyToId,
            mentions: [...app.mentions],
            attachments: app.attachment ? [app.attachment] : [],
          },
        }),
      'Could not send the message',
    );
    if (!result) {
      elements.sendButton.disabled = false;
      return;
    }
    if (app.data.settings.demoReplies && !conversation.openAgents?.length && conversation.type !== 'channel' &&
        conversation.memberIds.some((id) => userById(id)?.simulated) && !app.mentions.size) {
      const view = conversationView(conversation);
      elements.typingName.textContent = t('{name} is typing', { name: view.user?.name || t('Someone') });
      elements.typing.hidden = false;
      setTimeout(() => {
        elements.typing.hidden = true;
      }, 1800);
    }
  }
  elements.messageInput.value = '';
  app.mentions.clear();
  hideMentionPicker();
  elements.messageInput.style.height = '';
  app.replyToId = null;
  app.attachment = null;
  elements.fileInput.value = '';
  renderComposerBanner();
  elements.messageInput.focus();
  requestAnimationFrame(scrollToLatest);
}

async function toggleSaved(messageId) {
  const result = await safely(
    () => api(`/api/messages/${encodeURIComponent(messageId)}/save`, { method: 'POST' }),
    'Could not update saved messages',
  );
  if (result) {
    const saved = result.message.savedBy?.includes(app.data.currentUserId);
    showToast(saved ? 'Message saved' : 'Removed from saved messages');
  }
}

async function toggleReaction(messageId, emoji) {
  await safely(
    () =>
      api(`/api/messages/${encodeURIComponent(messageId)}/reactions`, {
        method: 'POST',
        body: { emoji },
      }),
    'Could not update the reaction',
  );
}

function askToDeleteMessage(messageId) {
  openDialog(`
    <span class="dialog-kicker">${t("Delete message")}</span>
    <h2>${t("Delete for this demo?")}</h2>
    <p class="dialog-subtitle">${t("The message and its attachments will be removed from local history. Replied-to messages remain as deleted placeholders.")}</p>
    <div class="dialog-actions">
      <button class="secondary-button" data-dialog-action="close">${t("Cancel")}</button>
      <button class="danger-button" data-delete-message="${escapeHtml(messageId)}">${t("Delete message")}</button>
    </div>`);
}

async function deleteMessage(messageId) {
  const result = await safely(
    () =>
      api(`/api/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      }),
    'Could not delete the message',
  );
  if (!result) return;
  closeDialog();
  showToast('Message deleted');
}

function openForwardDialog(messageId) {
  const message = messageById(messageId);
  if (!message || message.deleted) return;
  const conversations = app.data.conversations
    .filter((conversation) => !conversation.archived)
    .sort((a, b) => {
      if (a.id === app.activeConversationId) return -1;
      if (b.id === app.activeConversationId) return 1;
      return a.title.localeCompare(b.title);
    });
  openDialog(`
    <span class="dialog-kicker">${t("Share")}</span>
    <h2>${t("Forward message")}</h2>
    <p class="dialog-subtitle">${escapeHtml(previewForMessage(message))}</p>
    <div class="contact-grid">
      ${conversations
        .map((conversation) => {
          const view = conversationView(conversation);
          return `
            <button class="contact-card" data-forward-target="${escapeHtml(conversation.id)}" data-forward-message="${escapeHtml(message.id)}">
              ${avatarMarkup(view)}
              <span class="contact-card-copy">
                <strong>${escapeHtml(view.title)}</strong>
                <small>${escapeHtml(view.status)}</small>
              </span>
              ${icon('forward')}
            </button>`;
        })
        .join('')}
    </div>`);
}

async function forwardMessage(messageId, conversationId) {
  const result = await safely(
    () =>
      api(`/api/messages/${encodeURIComponent(messageId)}/forward`, {
        method: 'POST',
        body: { conversationId },
      }),
    'Could not forward the message',
  );
  if (!result) return;
  closeDialog();
  await selectConversation(conversationId, { messageId: result.message.id });
  showToast('Message forwarded');
}

function resizeComposer() {
  elements.messageInput.style.height = 'auto';
  elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 130)}px`;
  elements.sendButton.disabled =
    (!elements.messageInput.value.trim() && !app.attachment) || Boolean(app.recording);
}

function renderAgentStrip(c) {
  const strip = element('agent-strip');
  strip.hidden = !c || c.type === 'channel';
  element('mention-button').hidden = strip.hidden;
  if (strip.hidden) return;
  const ids = c.openAgents || [];
  strip.innerHTML = `<span class="agent-strip-icon" aria-hidden="true">@</span>
    <span class="agent-strip-copy"><strong>${ids.length ? t(ids.length === 1 ? 'Shared with {count} agent' : 'Shared with {count} agents', { count: ids.length }) : t('Human conversation')}</strong>
    <small>${ids.length ? escapeHtml(ids.slice(0, 2).join(' · ')) + (ids.length > 2 ? ` +${ids.length - 2}` : '') : t('Choose which of your agents can join')}</small></span>
    ${ids.some((uid) => app.data.agents.find((v) => v.uid === uid)?.demo) ? `<button class="text-button" data-try-mention>${t("Try a mention")}</button>` : ''}
    <button class="secondary-button" data-room-agents>${t("Agents")}</button>`;
}

function hideMentionPicker() {
  element('mention-picker').hidden = true;
  element('mention-button').setAttribute('aria-expanded', 'false');
  elements.messageInput.removeAttribute('aria-activedescendant');
}

function openMentionPicker() {
  if (app.editingMessageId) return showToast('Send a new message to mention someone');
  const input = elements.messageInput;
  if (!mentionAt(input.value, input.selectionStart)) {
    const space = input.selectionStart && !/\s$/.test(input.value.slice(0, input.selectionStart));
    input.setRangeText(space ? ' @' : '@', input.selectionStart, input.selectionEnd, 'end');
  }
  input.focus();
  renderMentionPicker();
  resizeComposer();
}

function renderMentionPicker() {
  const c = activeConversation();
  const input = elements.messageInput;
  const token = mentionAt(input.value, input.selectionStart);
  if (app.editingMessageId || !c || c.type === 'channel' || !token || input.selectionStart !== input.selectionEnd) return hideMentionPicker();
  const picker = element('mention-picker');
  const { rows, total, scope } = mentionChoices(c, app.data.users, app.data.currentUserId, token.query);
  element('mention-heading').textContent = scope ? t('Accounts · {name}', { name: userById(scope)?.name || scope }) : t('Mention someone');
  const list = element('mention-list');
  const last = !picker.hidden && picker.dataset.query === token.query && list.querySelector('[aria-selected="true"]')?.dataset.uid;
  list.innerHTML = rows.map((r, i) => `<button type="button" role="option" tabindex="-1" aria-selected="false"
    id="mention-opt-${i}" data-uid="${escapeHtml(r.uid)}" ${r.branch ? 'data-branch' : ''} ${r.disabled ? 'disabled aria-disabled="true"' : ''}>
    <strong>${escapeHtml(r.label)}</strong><small>${escapeHtml(r.note)}</small></button>`).join('');
  element('mention-hint').textContent = total > rows.length ? t('{count} of {total} · Keep typing to narrow the list', { count: rows.length, total }) :
    t(total ? 'Type a name or account · ↑ ↓ to choose · Enter to select' : 'No matches in this chat');
  picker.dataset.query = token.query;
  picker.hidden = false;
  element('mention-button').setAttribute('aria-expanded', 'true');
  const choices = [...list.querySelectorAll('button:enabled')];
  highlightMention(choices.find((b) => b.dataset.uid === last) || choices[0]);
}

function pruneMentions() {
  const present = new Set(Array.from(elements.messageInput.value.matchAll(/(?<![a-zA-Z0-9._%+@-])@([a-z0-9_]+(?:\/[a-z0-9_-]+)?)/g), (m) => m[1]));
  for (const uid of app.mentions) if (!present.has(uid)) app.mentions.delete(uid);
}

function highlightMention(button) {
  for (const option of element('mention-list').children) option.setAttribute('aria-selected', String(button === option));
  if (!button) return elements.messageInput.removeAttribute('aria-activedescendant');
  elements.messageInput.setAttribute('aria-activedescendant', button.id);
  button.scrollIntoView({ block: 'nearest' });
}

function pickMention(uid, branch = false) {
  const input = elements.messageInput;
  const token = mentionAt(input.value, input.selectionStart);
  const start = token?.start ?? input.selectionStart;
  const end = token?.end ?? input.selectionEnd;
  const space = !token && start > 0 && !/\s$/.test(input.value.slice(0, start)) ? ' ' : '';
  input.setRangeText(`${space}@${uid}${branch ? '/' : ' '}`, start, end + (!branch && input.value[end] === ' ' ? 1 : 0), 'end');
  input.focus();
  if (branch) renderMentionPicker();
  else { app.mentions.add(uid); hideMentionPicker(); }
  resizeComposer();
}

function ownedAgents() { return app.data.agents.filter((a) => a.ownerUid === app.data.currentUserId && !a.revoked); }

function openRoomAgents() {
  const c = activeConversation(), own = ownedAgents();
  const active = c.openAgents || [];
  openDialog(`<span class="dialog-kicker">${t("Conversation access")}</span><h2>${t("Agents in this chat")}</h2>
    <p class="dialog-subtitle">${t("Open agents can read this chat's full history and new messages. Use @ to ask one to reply.")}</p>
    <div class="agent-panel"><strong>${t("Open here")}</strong><p>${active.length ? active.map(escapeHtml).join(' · ') : t('None yet')}</p></div>
    <form id="room-agents-form"><h3>${t("Your agents")}</h3>${own.map((a) => `<label class="agent-choice">
      <input type="checkbox" name="open" value="${escapeHtml(a.uid)}" ${active.includes(a.uid) ? 'checked' : ''}> ${escapeHtml(a.uid)}</label>`).join('') ||
      `<p class="dialog-subtitle">${t("Bind an agent first to open it here.")}</p>`}
    ${c.type === 'group' ? `<label class="agent-choice"><input type="checkbox" name="delegation" ${c.allowDelegatedReplies ? 'checked' : ''} ${c.ownerUid !== app.data.currentUserId ? 'disabled' : ''}>${t("Allow offline delegates to reply without a mention")}</label>
      <small>${t('Group owner')}: ${escapeHtml(c.ownerUid)}</small>` : ''}
    <div class="dialog-actions"><button type="button" class="secondary-button" data-my-agents>${t("My agents")}</button>
    <button class="primary-button" type="submit">${t("Save access")}</button></div></form>`);
}

function openMyAgents() {
  openDialog(`<span class="dialog-kicker">${t("Human + Agent")}</span><h2>${t("My agents")}</h2>
    <p class="dialog-subtitle">${t("Each account has its own token. Bind a client here, then open it in a conversation.")}</p>
    ${ownedAgents().map((a) => `<section class="agent-panel"><strong>${escapeHtml(a.uid)}</strong>
    <small>${t(a.demo ? 'Scripted demo' : a.online ? 'Connected recently' : 'Not connected')}${app.data.delegate === a.uid ? ' · '+t('Offline delegate') : ''}</small>
    <div class="agent-controls">${[app.data.delegate === a.uid ? 'undelegate' : 'delegate', 'rotate', 'revoke'].map((action) =>
    `<button class="text-button" data-agent-action="${action}" data-agent-uid="${escapeHtml(a.uid)}">${t(({ delegate:'Use when offline', undelegate:'Stop delegation', rotate:'Rotate token', revoke:'Revoke' })[action])}</button>`).join('')}</div></section>`).join('')}
    <form id="bind-agent-form"><label class="form-field"><span>${t('New agent UID')}: ${escapeHtml(app.data.currentUserId)}/</span>
    <input class="form-input" name="name" required maxlength="32" pattern="[a-z0-9][a-z0-9_\\-]{0,31}" placeholder="dots"></label>
    <button class="primary-button" type="submit">${t("Create agent and token")}</button></form>`);
}

async function applyAgentAction(body) {
  const result = await api('/api/agents', { method: 'POST', body });
  app.data = await api('/api/bootstrap');
  renderAll();
  if (!result.token) return openMyAgents();
  openDialog(`<span class="dialog-kicker">${t("Shown once")}</span><h2>${escapeHtml(t('Connect {uid}', { uid: result.uid }))}</h2>
    <p class="dialog-subtitle">${t("Copy this private token into your agent client. Open the account in a chat through Agents.")}</p>
    <label class="form-field"><span>${t("Bearer token")}</span><input class="form-input" readonly id="new-agent-token"></label>
    <p><code>GET /api/agent/v1/sync</code></p><button class="primary-button" data-dialog-action="close">${t("Done")}</button>`);
  element('new-agent-token').value = result.token;
  element('new-agent-token').select();
}

function handleAttachment(file) {
  if (!file) return;
  if (file.size > 3_000_000) {
    showToast('Choose a file smaller than 3 MB for this demo', 'error');
    return;
  }
  const supported = /^(image|audio|video|application)\//i.test(file.type);
  if (!supported) {
    showToast('That file type is not supported', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showToast('The file could not be read', 'error');
  reader.onload = () => {
    app.attachment = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: reader.result,
    };
    renderComposerBanner();
  };
  reader.readAsDataURL(file);
}

function startRecording() {
  if (!activeConversation()) return;
  app.recording = { startedAt: Date.now() };
  elements.messageForm.hidden = true;
  elements.recordingBar.hidden = false;
  elements.recordingTime.textContent = '00:00';
  app.recordingTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - app.recording.startedAt) / 1000);
    elements.recordingTime.textContent = formatDuration(elapsed);
  }, 250);
  renderComposerBanner();
}

function stopRecording({ send = false } = {}) {
  if (!app.recording) return;
  const elapsed = Math.max(1, Math.floor((Date.now() - app.recording.startedAt) / 1000));
  clearInterval(app.recordingTimer);
  app.recordingTimer = null;
  app.recording = null;
  elements.recordingBar.hidden = true;
  elements.messageForm.hidden = false;
  renderComposerBanner();
  if (send) {
    elements.messageInput.value = `🎙 ${t('Voice note')} · ${formatDuration(elapsed)} (${t('simulated')})`;
    submitMessage();
  }
}

async function startCall(type = 'voice') {
  const conversation = activeConversation();
  if (!conversation || conversation.type === 'channel') {
    showToast('Calls are available in direct messages and groups', 'error');
    return;
  }
  closeDialog();
  const result = await safely(
    () =>
      api('/api/calls', {
        method: 'POST',
        body: { conversationId: conversation.id, type },
      }),
    'Could not start the call',
  );
  if (!result) return;
  const view = conversationView(conversation);
  app.call = { ...result.call, type, muted: false, camera: type === 'video', connectedAt: null };
  elements.callName.textContent = view.title;
  elements.callLabel.textContent = t('Calling in demo mode...');
  elements.callTimer.textContent = '00:00';
  elements.callAvatar.textContent = view.initials;
  elements.callAvatar.style.setProperty('--call-color', safeColor(view.color));
  elements.callScreen.hidden = false;
  element('toggle-microphone').classList.add('is-active');
  element('toggle-camera').classList.toggle('is-active', app.call.camera);
  clearInterval(app.callTimer);
  let elapsed = 0;
  app.callTimer = setInterval(() => {
    if (!app.call) return;
    elapsed += 1;
    if (elapsed === 2) {
      app.call.connectedAt = Date.now();
      elements.callLabel.textContent = t('Connected in demo mode');
    }
    elements.callTimer.textContent = formatDuration(elapsed);
  }, 1000);
}

async function endCall() {
  if (!app.call) return;
  const callId = app.call.id;
  clearInterval(app.callTimer);
  app.callTimer = null;
  app.call = null;
  elements.callScreen.hidden = true;
  await safely(
    () => api(`/api/calls/${encodeURIComponent(callId)}/end`, { method: 'POST' }),
    'Could not update the call history',
  );
  showToast('Call ended');
}

function openChatSearch() {
  elements.chatSearchBar.hidden = false;
  elements.messageSearch.focus();
}

function closeChatSearch() {
  elements.chatSearchBar.hidden = true;
  elements.messageSearch.value = '';
  app.messageSearch = '';
  renderMessages();
}

function handleSearchInput() {
  clearTimeout(app.searchTimer);
  const query = elements.conversationSearch.value.trim();
  app.search = query;
  const version = ++app.searchVersion;
  if (!query) {
    app.searchResults = { conversations: [], messages: [], users: [] };
    renderConversationList();
    return;
  }
  app.searchResults = {
    conversations: app.data.conversations.filter(
      (conversation) =>
        !conversation.archived &&
        `${conversation.title} ${conversation.description || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ),
    messages: app.data.messages.filter(
      (message) => !message.deleted && message.text.toLowerCase().includes(query.toLowerCase()),
    ),
    users: app.data.users.filter((user) =>
      `${user.name} @${user.username} ${user.bio}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  };
  renderConversationList();
  app.searchTimer = setTimeout(async () => {
    const result = await safely(
      () => api(`/api/search?q=${encodeURIComponent(query)}`),
      'Search is temporarily unavailable',
    );
    if (result && version === app.searchVersion) {
      app.searchResults = result;
      renderConversationList();
    }
  }, 180);
}

function bindStaticEvents() {
  element('agent-strip').addEventListener('click', (e) => {
    if (e.target.closest('[data-room-agents]')) return openRoomAgents();
    if (e.target.closest('[data-try-mention]')) {
      if (app.editingMessageId) return showToast('Finish editing before starting a new mention');
      const uid = activeConversation().openAgents.find((v) => app.data.agents.find((a) => a.uid === v)?.demo);
      pickMention(uid);
      if (elements.messageInput.value.trim() === `@${uid}`) elements.messageInput.value += t('Who received this message?');
      resizeComposer();
    }
  });
  element('mention-button').addEventListener('click', openMentionPicker);
  element('mention-list').addEventListener('mousedown', (e) => e.preventDefault());
  element('mention-list').addEventListener('click', (e) => {
    e.stopPropagation();
    const option = e.target.closest('button:enabled');
    if (option) pickMention(option.dataset.uid, option.hasAttribute('data-branch'));
  });
  elements.messageInput.addEventListener('input', () => {
    pruneMentions();
    renderMentionPicker();
  });
  elements.messageInput.addEventListener('click', renderMentionPicker);
  elements.messageInput.addEventListener('selectionchange', () => {
    if (!element('mention-picker').hidden) renderMentionPicker();
  });
  window.addEventListener('hashchange', renderWorkspace);
  element('contact-search').addEventListener('input', renderDirectory);
  element('contacts-page').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-directory-group')) openNewConversation('group');
    else if (button.hasAttribute('data-initial')) {
      const section = element(`initial-${button.dataset.initial}`);
      section.scrollIntoView({ block: 'start' });
      section.querySelector('button').focus({ preventScroll: true });
    } else if (button.dataset.contactProfile) {
      navigateWorkspace(`#contacts/${encodeURIComponent(button.dataset.contactProfile)}`);
      element('contact-profile').querySelector('[data-start-direct]').focus({ preventScroll: true });
    } else if (button.hasAttribute('data-contact-back')) {
      navigateWorkspace('#contacts');
      element('contact-search').focus();
    } else if (button.dataset.startDirect) openDirectConversation(button.dataset.startDirect);
  });
  document.querySelectorAll('.rail-button[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (view === 'chats') {
        elements.app.classList.remove('chat-open');
        navigateWorkspace('');
        closeDialog();
        closePopover();
        return;
      }
      if (view === 'contacts') navigateWorkspace('#contacts');
      if (view === 'calls') openCalls();
      if (view === 'saved') openSaved();
      if (view === 'settings') openSettings();
    });
  });
  element('brand-home').addEventListener('click', () => {
    if (onContactsPage()) navigateWorkspace('');
    elements.app.classList.remove('chat-open');
    elements.conversationSearch.value = '';
    app.search = '';
    renderConversationList();
  });
  elements.profile.addEventListener('click', openProfileEditor);
  element('new-chat-button').addEventListener('click', openNewConversation);
  document.querySelectorAll('[data-open-new-chat]').forEach((button) =>
    button.addEventListener('click', openNewConversation),
  );
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      app.filter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      renderConversationList();
    });
  });
  elements.conversationSearch.addEventListener('input', handleSearchInput);
  elements.conversationList.addEventListener('click', (event) => {
    const userRow = event.target.closest('[data-user-id]');
    if (userRow) return void openDirectConversation(userRow.dataset.userId);
    const row = event.target.closest('[data-conversation-id]');
    if (row) {
      return void selectConversation(row.dataset.conversationId, { messageId: row.dataset.messageId });
    }
  });
  element('mobile-back').addEventListener('click', () => {
    elements.app.classList.remove('chat-open');
    app.detailsOpen = false;
    renderDetails();
  });
  element('chat-identity').addEventListener('click', () => {
    app.detailsOpen = true;
    renderDetails();
  });
  element('chat-search-button').addEventListener('click', openChatSearch);
  element('close-message-search').addEventListener('click', closeChatSearch);
  elements.messageSearch.addEventListener('input', () => {
    app.messageSearch = elements.messageSearch.value.trim();
    renderMessages();
  });
  element('conversation-menu-button').addEventListener('click', (event) =>
    openConversationMenu(event.currentTarget),
  );
  element('voice-call-button').addEventListener('click', () => startCall('voice'));
  element('video-call-button').addEventListener('click', () => startCall('video'));
  element('jump-pinned').addEventListener('click', () =>
    jumpToMessage(elements.pinnedStrip.dataset.messageId),
  );
  element('jump-latest').addEventListener('click', scrollToLatest);
  elements.messageScroller.addEventListener('scroll', () => {
    const distance =
      elements.messageScroller.scrollHeight -
      elements.messageScroller.scrollTop -
      elements.messageScroller.clientHeight;
    element('jump-latest').hidden = distance < 120;
  });
  elements.messageInput.addEventListener('input', resizeComposer);
  elements.messageInput.addEventListener('keydown', (event) => {
    if (event.isComposing || event.keyCode === 229) return;
    if (!element('mention-picker').hidden && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) && !event.shiftKey) {
      event.preventDefault();
      const choices = [...element('mention-list').querySelectorAll('button:enabled')];
      if (!choices.length) return;
      const index = choices.findIndex((b) => b.getAttribute('aria-selected') === 'true');
      if (event.key === 'Enter') {
        const selected = choices[index];
        if (selected) pickMention(selected.dataset.uid, selected.hasAttribute('data-branch'));
      } else highlightMention(choices[(index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length]);
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  });
  elements.messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitMessage();
  });
  element('cancel-reply').addEventListener('click', cancelComposerContext);
  element('attach-button').addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', () => handleAttachment(elements.fileInput.files[0]));
  elements.attachmentPreview.addEventListener('click', (event) => {
    if (event.target.closest('#remove-attachment')) {
      app.attachment = null;
      elements.fileInput.value = '';
      renderComposerBanner();
    }
  });
  element('emoji-button').addEventListener('click', (event) => {
    event.stopPropagation();
    elements.emojiTray.hidden = !elements.emojiTray.hidden;
  });
  elements.emojiTray.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const start = elements.messageInput.selectionStart;
    const end = elements.messageInput.selectionEnd;
    const value = elements.messageInput.value;
    elements.messageInput.value = `${value.slice(0, start)}${button.textContent}${value.slice(end)}`;
    elements.messageInput.selectionStart = elements.messageInput.selectionEnd = start + button.textContent.length;
    elements.messageInput.focus();
    resizeComposer();
  });
  element('voice-button').addEventListener('click', startRecording);
  element('cancel-recording').addEventListener('click', () => stopRecording());
  element('send-recording').addEventListener('click', () => stopRecording({ send: true }));

  elements.messageFlow.addEventListener('click', (event) => {
    const jumpButton = event.target.closest('[data-jump-message]');
    if (jumpButton) return void jumpToMessage(jumpButton.dataset.jumpMessage);
    const actionButton = event.target.closest('[data-message-action]');
    if (!actionButton) return;
    const message = messageById(actionButton.dataset.messageId);
    if (!message) return;
    const action = actionButton.dataset.messageAction;
    if (action === 'reply') startReply(message);
    if (action === 'forward') openForwardDialog(message.id);
    if (action === 'edit') startEdit(message);
    if (action === 'delete') askToDeleteMessage(message.id);
    if (action === 'save') toggleSaved(message.id);
    if (action === 'react') toggleReaction(message.id, actionButton.dataset.emoji);
    if (action === 'reaction-picker') openReactionPicker(actionButton, message.id);
    if (action === 'delivery') {
      const labels = { context: 'Context only', mentioned: 'Mentioned', delegation_candidate: 'Eligible offline delegate' };
      openDialog(`<span class="dialog-kicker">${t("At send time")}</span><h2>${t("Agent delivery")}</h2>
        <p class="dialog-subtitle">${t("These accounts had access to this message. This is not a read receipt.")}</p>
        ${Object.entries(message.delivery || {}).map(([uid, mode]) => `<p>${escapeHtml(uid)} · ${escapeHtml(t(labels[mode] || mode))}</p>`).join('')}`);
    }
  });

  elements.details.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-details-action]');
    if (!actionButton) return;
    const conversation = activeConversation();
    const action = actionButton.dataset.detailsAction;
    if (action === 'close') {
      app.detailsOpen = false;
      renderDetails();
    }
    if (action === 'search') openChatSearch();
    if (action === 'agents') openRoomAgents();
    if (action === 'call') startCall('voice');
    if (action === 'video') startCall('video');
    if (action === 'mute') updateActiveConversation({ muted: !conversation.muted });
    if (action === 'pin') updateActiveConversation({ pinned: !conversation.pinned });
    if (action === 'archive') archiveActiveConversation();
  });

  elements.menu.addEventListener('click', (event) => {
    const item = event.target.closest('[data-menu-action]');
    if (!item) return;
    const action = item.dataset.menuAction;
    if (action === 'details') {
      app.detailsOpen = true;
      renderDetails();
    }
    if (action === 'search') openChatSearch();
    if (action === 'pin') updateActiveConversation({ pinned: !activeConversation().pinned });
    if (action === 'mute') updateActiveConversation({ muted: !activeConversation().muted });
    if (action === 'archive') archiveActiveConversation();
    if (action === 'react') toggleReaction(item.dataset.messageId, item.dataset.emoji);
    closePopover();
  });

  elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) closeDialog();
  });
  element('dialog-close').addEventListener('click', closeDialog);
  elements.dialogContent.addEventListener('click', (event) => {
    if (event.target.closest('[data-dialog-action="logout"]')) return void safely(async () => {
      await api('/api/logout', { method: 'POST' });
      location.reload();
    });
    if (event.target.closest('[data-my-agents]')) return openMyAgents();
    const control = event.target.closest('[data-agent-action]');
    if (control) {
      const { agentUid: uid, agentAction: action } = control.dataset;
      if (['revoke', 'rotate'].includes(action) && !window.confirm(t('Invalidate the current token for {uid}?', { uid }))) return;
      return void safely(() => applyAgentAction({ uid, action }));
    }
    const close = event.target.closest('[data-dialog-action="close"]');
    if (close) return void closeDialog();
    const newChat = event.target.closest('[data-dialog-action="new-chat"]');
    if (newChat) return void openNewConversation();
    const editProfile = event.target.closest('[data-dialog-action="edit-profile"]');
    if (editProfile) return void openProfileEditor();
    const type = event.target.closest('[data-new-chat-type]');
    if (type && app.dialogDraft) {
      captureNewChatDraft();
      app.dialogDraft.type = type.dataset.newChatType;
      if (app.dialogDraft.type === 'direct') {
        app.dialogDraft.memberIds = new Set([...app.dialogDraft.memberIds].slice(0, 1));
      }
      return void renderNewConversationDialog();
    }
    const member = event.target.closest('[data-member-id]');
    if (member && app.dialogDraft) {
      captureNewChatDraft();
      const id = member.dataset.memberId;
      if (app.dialogDraft.type === 'direct') app.dialogDraft.memberIds = new Set([id]);
      else if (app.dialogDraft.memberIds.has(id)) app.dialogDraft.memberIds.delete(id);
      else app.dialogDraft.memberIds.add(id);
      return void renderNewConversationDialog();
    }
    const saved = event.target.closest('[data-saved-conversation]');
    if (saved) {
      closeDialog();
      return void selectConversation(saved.dataset.savedConversation, {
        messageId: saved.dataset.savedMessage,
      });
    }
    const forward = event.target.closest('[data-forward-target]');
    if (forward) {
      forwardMessage(forward.dataset.forwardMessage, forward.dataset.forwardTarget);
      return;
    }
    const callAgain = event.target.closest('[data-call-conversation]');
    if (callAgain) {
      closeDialog();
      selectConversation(callAgain.dataset.callConversation).then(() =>
        startCall(callAgain.dataset.callType),
      );
      return;
    }
    const theme = event.target.closest('[data-theme-option]');
    if (theme) {
      saveSettings({ theme: theme.dataset.themeOption }).then(() => openSettings());
      return;
    }
    const deleteButton = event.target.closest('[data-delete-message]');
    if (deleteButton) deleteMessage(deleteButton.dataset.deleteMessage);
  });
  elements.dialogContent.addEventListener('change', (event) => {
    if (event.target.id === 'interface-language') {
      const select = event.target;
      select.disabled = true;
      return void saveSettings({ language: select.value }).then((saved) => {
        if (!saved) select.value = language;
        select.disabled = false;
        element('interface-language')?.focus();
      });
    }
    const setting = event.target.closest('[data-setting]');
    if (setting) saveSettings({ [setting.dataset.setting]: setting.checked });
  });
  elements.dialogContent.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.target.id === 'bind-agent-form') return void safely(() => applyAgentAction({ action: 'create', name: new FormData(event.target).get('name') }));
    if (event.target.id === 'room-agents-form') {
      const form = new FormData(event.target), c = activeConversation();
      const body = { openAgents: form.getAll('open') };
      if (c.type === 'group' && c.ownerUid === app.data.currentUserId) body.allowDelegatedReplies = form.has('delegation');
      return void safely(async () => {
        await api(`/api/conversations/${encodeURIComponent(c.id)}/agents`, { method: 'PATCH', body });
        app.data = await api('/api/bootstrap');
        closeDialog(); renderAll(); showToast('Agent access updated');
      });
    }
    if (event.target.id === 'new-conversation-form') return void createConversationFromDialog();
    if (event.target.id === 'profile-form') {
      const form = new FormData(event.target);
      safely(
        () =>
          api('/api/profile', {
            method: 'PATCH',
            body: {
              name: form.get('name'),
              username: form.get('username'),
              bio: form.get('bio'),
            },
          }),
        'Could not update the profile',
      ).then((result) => {
        if (!result) return;
        Object.assign(currentUser(), result.user);
        closeDialog();
        renderAll();
        showToast('Profile updated');
      });
    }
  });

  element('call-minimize').addEventListener('click', () => {
    elements.callScreen.hidden = true;
    showToast('Call continues in the background. Open Calls to return.');
  });
  element('end-call').addEventListener('click', endCall);
  element('toggle-microphone').addEventListener('click', (event) => {
    if (!app.call) return;
    app.call.muted = !app.call.muted;
    event.currentTarget.classList.toggle('is-active', !app.call.muted);
    event.currentTarget.setAttribute('aria-label', t(app.call.muted ? 'Unmute microphone' : 'Mute microphone'));
  });
  element('toggle-camera').addEventListener('click', (event) => {
    if (!app.call) return;
    app.call.camera = !app.call.camera;
    event.currentTarget.classList.toggle('is-active', app.call.camera);
    elements.callLabel.textContent = t(app.call.camera ? 'Camera preview simulated' : 'Camera off');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#mention-picker, #message-input, #mention-button')) hideMentionPicker();
    if (
      !elements.menu.hidden &&
      !elements.menu.contains(event.target) &&
      !event.target.closest('#conversation-menu-button') &&
      !event.target.closest('[data-message-action="reaction-picker"]')
    ) {
      closePopover();
    }
    if (
      !elements.emojiTray.hidden &&
      !elements.emojiTray.contains(event.target) &&
      !event.target.closest('#emoji-button')
    ) {
      elements.emojiTray.hidden = true;
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (onContactsPage()) {
        if (location.hash !== '#contacts') navigateWorkspace('#contacts');
        element('contact-search').focus();
        return;
      }
      elements.app.classList.remove('chat-open');
      elements.conversationSearch.focus();
    }
    if (event.key === 'Escape') {
      hideMentionPicker();
      closePopover();
      elements.emojiTray.hidden = true;
      if (app.recording) stopRecording();
    }
  });
}

async function initialize() {
  hydrateIcons();
  bindStaticEvents();
  try {
    await loadState();
    renderWorkspace();
    connectEvents();
    elements.boot.hidden = true;
    elements.app.hidden = false;
    requestAnimationFrame(scrollToLatest);
  } catch (error) {
    if (error.status === 401) {
      elements.boot.innerHTML = `<img src="/assets/mark.svg" alt="" width="64" height="64"><strong>Weyuna · Human + Agent</strong>
        <span>${t("Sign in with the local .key file printed by the server.")}</span>
        <label class="primary-button login-key">${t("Choose sign-in file")}<input type="file" id="login-key" accept=".key"></label>
        <small id="login-error" role="alert"></small>`;
      element('login-key').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          if (file.size > 256) throw new Error('Choose a Weyuna .key file');
          await api('/api/login', { method: 'POST', body: { key: (await file.text()).trim() } });
          location.reload();
        } catch (err) { element('login-error').textContent = err.message; e.target.value = ''; }
      });
      return;
    }
    console.error('Weyuna could not start', error);
    elements.boot.innerHTML = `
      <img src="/assets/mark.svg" alt="" width="64" height="64" />
      <strong>${t("Could not open Weyuna")}</strong>
      <span>${escapeHtml(error.message)}</span>
      <button class="primary-button" id="retry-boot">${t("Try again")}</button>`;
    element('retry-boot').addEventListener('click', () => location.reload());
  }
}

initialize();

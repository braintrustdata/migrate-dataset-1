/**
 * Gmail Clone - Main Application
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  const state = {
    currentFolder: 'inbox',
    currentLabel: null,
    currentPage: 1,
    totalPages: 1,
    totalEmails: 0,
    emails: [],
    selectedIds: new Set(),
    labels: [],
    folderCounts: {},
    currentEmail: null,
    currentThread: [],
    searchQuery: '',
    compose: {
      open: false,
      minimized: false,
      mode: null, // 'new', 'reply', 'replyAll', 'forward', 'draft'
      draftId: null,
      replyToId: null,
      to: [],
      cc: [],
      bcc: [],
      attachments: [],
    },
  };

  const LIMIT = 50;
  const STARRED_FOLDER = 'starred';
  const ALL_FOLDER = 'all';

  // ── DOM refs ───────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {};
  function cacheDom() {
    dom.sidebar = $('#sidebar');
    dom.menuToggle = $('#menu-toggle');
    dom.searchInput = $('#search-input');
    dom.searchBtn = $('#search-btn');
    dom.composeBtn = $('#compose-btn');
    dom.folderNav = $('#folder-nav');
    dom.labelsList = $('#labels-list');
    dom.createLabelBtn = $('#create-label-btn');
    dom.mainContent = $('#main-content');
    dom.toolbar = $('#toolbar');
    dom.selectAll = $('#select-all');
    dom.toolbarArchive = $('#toolbar-archive');
    dom.toolbarDelete = $('#toolbar-delete');
    dom.toolbarRead = $('#toolbar-read');
    dom.toolbarUnread = $('#toolbar-unread');
    dom.toolbarSpam = $('#toolbar-spam');
    dom.toolbarLabel = $('#toolbar-label');
    dom.labelMenu = $('#label-menu');
    dom.emptyTrashBtn = $('#empty-trash-btn');
    dom.paginationInfo = $('#pagination-info');
    dom.paginationPrev = $('#pagination-prev');
    dom.paginationNext = $('#pagination-next');
    dom.emailList = $('#email-list');
    dom.emailDetail = $('#email-detail');
    dom.composeModal = $('#compose-modal');
    dom.composeTitle = $('#compose-title');
    dom.composeMinimize = $('#compose-minimize');
    dom.composeDiscard = $('#compose-discard');
    dom.composeBodyWrapper = $('#compose-body-wrapper');
    dom.composeTo = $('#compose-to');
    dom.composeToChips = $('#compose-to-chips');
    dom.composeCc = $('#compose-cc');
    dom.composeCcChips = $('#compose-cc-chips');
    dom.composeBcc = $('#compose-bcc');
    dom.composeBccChips = $('#compose-bcc-chips');
    dom.ccBccToggle = $('#cc-bcc-toggle');
    dom.composeCcField = $('#compose-cc-field');
    dom.composeBccField = $('#compose-bcc-field');
    dom.composeSubject = $('#compose-subject');
    dom.composeBody = $('#compose-body');
    dom.composeAttachments = $('#compose-attachments');
    dom.composeSend = $('#compose-send');
    dom.composeSaveDraft = $('#compose-save-draft');
    dom.composeAttach = $('#compose-attach');
    dom.composeTrash = $('#compose-trash');
    dom.contactSuggestions = $('#contact-suggestions');
    dom.labelDialogOverlay = $('#label-dialog-overlay');
    dom.labelNameInput = $('#label-name-input');
    dom.labelColorInput = $('#label-color-input');
    dom.labelSaveBtn = $('#label-save-btn');
    dom.labelCancelBtn = $('#label-cancel-btn');
    dom.notification = $('#notification');
  }

  // ── Utility ────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const thisYear = d.getFullYear() === now.getFullYear();
    if (thisYear) {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatFullDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function contactStr(c) {
    if (!c) return '';
    if (c.name) return `${c.name} <${c.address}>`;
    return c.address || '';
  }

  function contactListStr(list) {
    if (!list || !list.length) return '';
    return list.map(contactStr).join(', ');
  }

  let notifyTimer = null;
  function notify(msg) {
    dom.notification.textContent = msg;
    dom.notification.style.display = 'block';
    dom.notification.classList.remove('hiding');
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      dom.notification.classList.add('hiding');
      setTimeout(() => {
        dom.notification.style.display = 'none';
        dom.notification.classList.remove('hiding');
      }, 300);
    }, 3000);
  }

  // ── Routing ────────────────────────────────────────────
  function getRoute() {
    const hash = window.location.hash.slice(1) || 'inbox';
    if (hash.startsWith('email/')) return { view: 'email', id: hash.slice(6) };
    if (hash.startsWith('search/')) return { view: 'search', query: decodeURIComponent(hash.slice(7)) };
    if (hash.startsWith('label/')) return { view: 'label', labelId: hash.slice(6) };
    return { view: 'folder', folder: hash };
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  // ── Data Loading ───────────────────────────────────────
  async function loadFolderCounts() {
    try {
      const data = await API.getFolderCounts();
      state.folderCounts = data;
      renderFolderCounts();
    } catch (e) {
      console.error('Failed to load folder counts:', e);
    }
  }

  async function loadLabels() {
    try {
      const data = await API.getLabels();
      state.labels = data.labels || [];
      renderLabels();
    } catch (e) {
      console.error('Failed to load labels:', e);
    }
  }

  async function loadEmails(folder, page, label) {
    try {
      const params = { page, limit: LIMIT };
      if (folder === STARRED_FOLDER) {
        // Starred is a virtual folder: query inbox but with starred filter
        // Actually the API handles folder=starred as a special case
        params.folder = folder;
      } else if (folder === ALL_FOLDER) {
        params.folder = folder;
      } else if (label) {
        params.label = label;
      } else {
        params.folder = folder;
      }
      const data = await API.getEmails(params);
      state.emails = data.emails || [];
      state.totalEmails = data.total || 0;
      state.totalPages = data.totalPages || 1;
      state.currentPage = data.page || 1;
      state.selectedIds.clear();
      renderEmailList();
      renderPagination();
      updateToolbarState();
    } catch (e) {
      console.error('Failed to load emails:', e);
      state.emails = [];
      renderEmailList();
    }
  }

  async function loadEmail(id) {
    try {
      const data = await API.getEmail(id);
      state.currentEmail = data.email;
      state.currentThread = data.thread || [];
      renderEmailDetail();
      // Mark as read
      if (state.currentEmail && !state.currentEmail.read) {
        await API.updateEmail(id, { read: true });
        state.currentEmail.read = true;
        loadFolderCounts();
      }
    } catch (e) {
      console.error('Failed to load email:', e);
      notify('Failed to load email');
      navigate('inbox');
    }
  }

  async function searchEmails(query) {
    try {
      const data = await API.search(query);
      state.emails = data.emails || [];
      state.totalEmails = state.emails.length;
      state.totalPages = 1;
      state.currentPage = 1;
      state.selectedIds.clear();
      renderEmailList();
      renderPagination();
      updateToolbarState();
    } catch (e) {
      console.error('Search failed:', e);
      state.emails = [];
      renderEmailList();
    }
  }

  // ── Render: Folder Counts ──────────────────────────────
  function renderFolderCounts() {
    const counts = state.folderCounts;
    const setCount = (id, val) => {
      const el = document.getElementById(`count-${id}`);
      if (el) el.textContent = val > 0 ? val : '';
    };
    setCount('inbox', counts.inbox);
    setCount('starred', counts.starred);
    setCount('sent', counts.sent);
    setCount('drafts', counts.drafts);
    setCount('spam', counts.spam);
    setCount('trash', counts.trash);
    setCount('archive', counts.archive);
    setCount('all', null); // Don't show count for all
  }

  // ── Render: Active Folder ──────────────────────────────
  function renderActiveFolder() {
    $$('.folder-item').forEach(el => el.classList.remove('active'));
    $$('.label-item').forEach(el => el.classList.remove('active'));

    const route = getRoute();
    if (route.view === 'folder') {
      const el = $(`[data-folder="${route.folder}"]`);
      if (el) el.classList.add('active');
    } else if (route.view === 'label') {
      const el = $(`[data-label-id="${route.labelId}"]`);
      if (el) el.classList.add('active');
    }
  }

  // ── Render: Labels ─────────────────────────────────────
  function renderLabels() {
    dom.labelsList.innerHTML = '';
    state.labels.forEach(label => {
      const el = document.createElement('div');
      el.className = 'label-item';
      el.dataset.labelId = label.id;
      el.setAttribute('data-label-id', label.id);
      el.innerHTML = `
        <span class="label-dot" style="background:${escapeHtml(label.color)}"></span>
        <span class="label-item-name">${escapeHtml(label.name)}</span>
        <button class="label-delete-btn" data-label-delete="${label.id}" title="Delete label">&times;</button>
      `;
      el.addEventListener('click', (e) => {
        if (e.target.closest('.label-delete-btn')) return;
        navigate(`label/${label.id}`);
      });
      dom.labelsList.appendChild(el);
    });

    // Attach delete handlers
    dom.labelsList.querySelectorAll('.label-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.labelDelete;
        try {
          await API.deleteLabel(id);
          notify('Label deleted');
          loadLabels();
          loadFolderCounts();
          // If currently viewing this label, go to inbox
          const route = getRoute();
          if (route.view === 'label' && route.labelId === id) {
            navigate('inbox');
          }
        } catch (e) {
          notify('Failed to delete label');
        }
      });
    });
  }

  // ── Render: Email List ─────────────────────────────────
  function renderEmailList() {
    dom.emailList.style.display = '';
    dom.emailDetail.style.display = 'none';
    dom.toolbar.style.display = '';

    if (state.emails.length === 0) {
      dom.emailList.innerHTML = `
        <div class="email-list-empty">
          <div class="empty-icon">&#128233;</div>
          <div>No emails here</div>
        </div>
      `;
      return;
    }

    dom.emailList.innerHTML = '';
    state.emails.forEach(email => {
      const row = document.createElement('div');
      row.className = 'email-row' + (email.read ? '' : ' unread') + (state.selectedIds.has(email.id) ? ' selected' : '');
      row.setAttribute('data-testid', 'email-row');
      row.setAttribute('data-email-id', email.id);

      const labelsHtml = (email.labels || []).map(lid => {
        const lbl = state.labels.find(l => l.id === lid);
        if (!lbl) return '';
        return `<span class="email-label-chip" style="background:${escapeHtml(lbl.color)}">${escapeHtml(lbl.name)}</span>`;
      }).join('');

      const hasAttachments = email.attachments && email.attachments.length > 0;
      const snippet = email.bodyText ? email.bodyText.substring(0, 100) : '';
      const senderName = email.from ? (email.from.name || email.from.address || '') : '';

      row.innerHTML = `
        <div class="email-checkbox-wrap">
          <input type="checkbox" data-testid="email-checkbox" class="email-checkbox" data-id="${email.id}" ${state.selectedIds.has(email.id) ? 'checked' : ''}>
        </div>
        <span class="email-star-btn ${email.starred ? 'starred' : ''}" data-testid="email-star" data-id="${email.id}">${email.starred ? '&#9733;' : '&#9734;'}</span>
        <span class="email-sender" data-testid="email-sender">${escapeHtml(senderName)}</span>
        <span class="email-content" data-testid="email-subject">
          <span class="email-subject-text">${escapeHtml(email.subject || '(no subject)')}</span>
          <span class="email-snippet">${escapeHtml(snippet)}</span>
        </span>
        ${labelsHtml ? `<span class="email-labels">${labelsHtml}</span>` : ''}
        ${hasAttachments ? '<span class="email-attachment-icon">&#128206;</span>' : ''}
        <span class="email-date" data-testid="email-date">${formatDate(email.date)}</span>
      `;

      // Checkbox click
      const checkbox = row.querySelector('.email-checkbox');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (checkbox.checked) {
          state.selectedIds.add(email.id);
          row.classList.add('selected');
        } else {
          state.selectedIds.delete(email.id);
          row.classList.remove('selected');
        }
        updateToolbarState();
      });

      // Star click
      const starBtn = row.querySelector('.email-star-btn');
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar(email);
      });

      // Row click -> view email
      row.addEventListener('click', (e) => {
        if (e.target.closest('.email-checkbox-wrap') || e.target.closest('.email-star-btn')) return;
        // If it's a draft, open compose
        if (email.folder === 'drafts') {
          openDraft(email);
          return;
        }
        navigate(`email/${email.id}`);
      });

      dom.emailList.appendChild(row);
    });
  }

  // ── Render: Email Detail ───────────────────────────────
  function renderEmailDetail() {
    dom.emailList.style.display = 'none';
    dom.emailDetail.style.display = '';
    dom.toolbar.style.display = 'none';

    const email = state.currentEmail;
    if (!email) return;

    const toStr = contactListStr(email.to);
    const ccStr = contactListStr(email.cc);
    const fromName = email.from ? (email.from.name || email.from.address || 'Unknown') : 'Unknown';
    const fromAddr = email.from ? (email.from.address || '') : '';
    const avatar = fromName.charAt(0).toUpperCase();

    const labelsHtml = (email.labels || []).map(lid => {
      const lbl = state.labels.find(l => l.id === lid);
      if (!lbl) return '';
      return `<span class="email-label-chip" style="background:${escapeHtml(lbl.color)}">${escapeHtml(lbl.name)}</span>`;
    }).join('');

    const attachmentsHtml = (email.attachments && email.attachments.length > 0) ? `
      <div class="detail-attachments">
        <h4>Attachments (${email.attachments.length})</h4>
        ${email.attachments.map(a => `
          <a href="${API.getAttachmentUrl(a.id)}" download="${escapeHtml(a.name)}" class="attachment-item">
            <span class="attachment-icon">&#128196;</span>
            <span>${escapeHtml(a.name)}</span>
            <span class="attachment-size">${formatSize(a.size)}</span>
          </a>
        `).join('')}
      </div>
    ` : '';

    // Build thread HTML
    let threadHtml = '';
    if (state.currentThread && state.currentThread.length > 0) {
      threadHtml = state.currentThread.map(te => {
        if (te.id === email.id) return '';
        const tn = te.from ? (te.from.name || te.from.address || 'Unknown') : 'Unknown';
        return `
          <div class="thread-item">
            <div class="detail-from">
              <div class="detail-from-avatar">${tn.charAt(0).toUpperCase()}</div>
              <div class="detail-from-info">
                <div class="detail-from-name">${escapeHtml(tn)}</div>
                <div class="detail-from-address">${escapeHtml(te.from ? te.from.address : '')}</div>
              </div>
              <span class="detail-date">${formatFullDate(te.date)}</span>
            </div>
            <div class="detail-body" style="margin-left:48px;padding-top:8px;">${te.body || escapeHtml(te.bodyText || '')}</div>
          </div>
        `;
      }).join('');
    }

    dom.emailDetail.innerHTML = `
      <div class="detail-header">
        <button class="detail-back-btn" data-testid="back-btn" id="detail-back">&larr;</button>
        <div class="detail-actions">
          <button class="detail-action-btn" id="detail-archive" title="Archive">&#128451; Archive</button>
          <button class="detail-action-btn" id="detail-delete" title="Delete">&#128465; Delete</button>
          <button class="detail-action-btn" id="detail-toggle-read" title="${email.read ? 'Mark unread' : 'Mark read'}">
            ${email.read ? '&#9993; Mark unread' : '&#9993; Mark read'}
          </button>
          <button class="detail-action-btn" id="detail-star" title="${email.starred ? 'Unstar' : 'Star'}">
            ${email.starred ? '&#9733; Starred' : '&#9734; Star'}
          </button>
          ${email.folder === 'spam' ? '<button class="detail-action-btn" id="detail-not-spam" title="Not spam">Not spam</button>' : ''}
        </div>
      </div>
      <div class="detail-subject-line">
        <h2 class="detail-subject" data-testid="detail-subject">${escapeHtml(email.subject || '(no subject)')}</h2>
        <span class="detail-labels">${labelsHtml}</span>
      </div>
      <div class="detail-meta">
        <div class="detail-from" data-testid="detail-from">
          <div class="detail-from-avatar">${avatar}</div>
          <div class="detail-from-info">
            <div class="detail-from-name">${escapeHtml(fromName)}</div>
            <div class="detail-from-address">&lt;${escapeHtml(fromAddr)}&gt;</div>
          </div>
          <span class="detail-date">${formatFullDate(email.date)}</span>
        </div>
        <div class="detail-to-line">
          to ${escapeHtml(toStr)}${ccStr ? ', cc: ' + escapeHtml(ccStr) : ''}
        </div>
      </div>
      <div class="detail-body" data-testid="detail-body">${email.body || escapeHtml(email.bodyText || '')}</div>
      ${attachmentsHtml}
      ${threadHtml}
      <div class="detail-reply-actions">
        <button class="reply-action-btn" data-testid="reply-btn" id="detail-reply">&#8617; Reply</button>
        <button class="reply-action-btn" data-testid="reply-all-btn" id="detail-reply-all">&#8617; Reply All</button>
        <button class="reply-action-btn" data-testid="forward-btn" id="detail-forward">&#8620; Forward</button>
      </div>
    `;

    // Bind detail actions
    $('#detail-back').addEventListener('click', goBack);
    $('#detail-archive').addEventListener('click', () => detailAction('archive'));
    $('#detail-delete').addEventListener('click', () => detailAction('delete'));
    $('#detail-toggle-read').addEventListener('click', () => detailAction('toggleRead'));
    $('#detail-star').addEventListener('click', () => detailAction('star'));
    $('#detail-reply').addEventListener('click', () => openReply('reply'));
    $('#detail-reply-all').addEventListener('click', () => openReply('replyAll'));
    $('#detail-forward').addEventListener('click', () => openReply('forward'));
    const notSpam = $('#detail-not-spam');
    if (notSpam) notSpam.addEventListener('click', () => detailAction('notSpam'));
  }

  function goBack() {
    const route = getRoute();
    // Go back to appropriate folder
    if (state.searchQuery) {
      navigate(`search/${encodeURIComponent(state.searchQuery)}`);
    } else if (state.currentLabel) {
      navigate(`label/${state.currentLabel}`);
    } else {
      navigate(state.currentFolder || 'inbox');
    }
  }

  async function detailAction(action) {
    const email = state.currentEmail;
    if (!email) return;
    try {
      switch (action) {
        case 'archive':
          await API.updateEmail(email.id, { folder: 'archive' });
          notify('Conversation archived');
          goBack();
          break;
        case 'delete':
          if (email.folder === 'trash') {
            await API.deleteEmail(email.id, true);
            notify('Conversation permanently deleted');
          } else {
            await API.updateEmail(email.id, { folder: 'trash' });
            notify('Conversation moved to Trash');
          }
          goBack();
          break;
        case 'toggleRead':
          await API.updateEmail(email.id, { read: !email.read });
          email.read = !email.read;
          renderEmailDetail();
          loadFolderCounts();
          break;
        case 'star':
          await API.updateEmail(email.id, { starred: !email.starred });
          email.starred = !email.starred;
          renderEmailDetail();
          break;
        case 'notSpam':
          await API.updateEmail(email.id, { folder: 'inbox' });
          notify('Conversation moved to Inbox');
          goBack();
          break;
      }
      loadFolderCounts();
    } catch (e) {
      notify('Action failed: ' + e.message);
    }
  }

  // ── Render: Pagination ─────────────────────────────────
  function renderPagination() {
    if (state.totalEmails === 0) {
      dom.paginationInfo.textContent = '';
      dom.paginationPrev.disabled = true;
      dom.paginationNext.disabled = true;
      return;
    }
    const start = (state.currentPage - 1) * LIMIT + 1;
    const end = Math.min(state.currentPage * LIMIT, state.totalEmails);
    dom.paginationInfo.textContent = `${start}-${end} of ${state.totalEmails}`;
    dom.paginationPrev.disabled = state.currentPage <= 1;
    dom.paginationNext.disabled = state.currentPage >= state.totalPages;
  }

  // ── Toolbar State ──────────────────────────────────────
  function updateToolbarState() {
    const hasSelection = state.selectedIds.size > 0;
    dom.toolbarArchive.disabled = !hasSelection;
    dom.toolbarDelete.disabled = !hasSelection;
    dom.toolbarRead.disabled = !hasSelection;
    dom.toolbarUnread.disabled = !hasSelection;
    dom.toolbarSpam.disabled = !hasSelection;
    dom.toolbarLabel.disabled = !hasSelection;

    // Select all checkbox state
    if (state.emails.length === 0) {
      dom.selectAll.checked = false;
      dom.selectAll.indeterminate = false;
    } else if (state.selectedIds.size === state.emails.length) {
      dom.selectAll.checked = true;
      dom.selectAll.indeterminate = false;
    } else if (state.selectedIds.size > 0) {
      dom.selectAll.checked = false;
      dom.selectAll.indeterminate = true;
    } else {
      dom.selectAll.checked = false;
      dom.selectAll.indeterminate = false;
    }

    // Show empty trash button only in trash
    dom.emptyTrashBtn.style.display = state.currentFolder === 'trash' ? '' : 'none';
  }

  // ── Star Toggle ────────────────────────────────────────
  async function toggleStar(email) {
    try {
      const newVal = !email.starred;
      await API.updateEmail(email.id, { starred: newVal });
      email.starred = newVal;
      // Update row
      const row = dom.emailList.querySelector(`[data-email-id="${email.id}"]`);
      if (row) {
        const starBtn = row.querySelector('.email-star-btn');
        starBtn.classList.toggle('starred', newVal);
        starBtn.innerHTML = newVal ? '&#9733;' : '&#9734;';
      }
      loadFolderCounts();
    } catch (e) {
      notify('Failed to update star');
    }
  }

  // ── Bulk Actions ───────────────────────────────────────
  async function bulkAction(action, labelId) {
    const ids = Array.from(state.selectedIds);
    if (ids.length === 0) return;
    try {
      await API.bulkAction(ids, action, labelId);
      state.selectedIds.clear();
      // Reload
      const route = getRoute();
      await handleRoute(route);
      loadFolderCounts();
      const msgs = {
        read: 'Marked as read',
        unread: 'Marked as unread',
        star: 'Starred',
        unstar: 'Unstarred',
        trash: 'Moved to Trash',
        spam: 'Reported as spam',
        archive: 'Archived',
        inbox: 'Moved to Inbox',
        delete: 'Permanently deleted',
        label: 'Label applied',
        unlabel: 'Label removed',
      };
      notify(msgs[action] || 'Done');
    } catch (e) {
      notify('Bulk action failed: ' + e.message);
    }
  }

  // ── Empty Trash ────────────────────────────────────────
  async function emptyTrash() {
    try {
      // Get all trash emails and delete permanently
      const data = await API.getEmails({ folder: 'trash', limit: 1000 });
      const ids = (data.emails || []).map(e => e.id);
      if (ids.length > 0) {
        await API.bulkAction(ids, 'delete');
      }
      notify('Trash emptied');
      const route = getRoute();
      await handleRoute(route);
      loadFolderCounts();
    } catch (e) {
      notify('Failed to empty trash: ' + e.message);
    }
  }

  // ── Compose ────────────────────────────────────────────
  function openCompose(opts = {}) {
    state.compose = {
      open: true,
      minimized: false,
      mode: opts.mode || 'new',
      draftId: opts.draftId || null,
      replyToId: opts.replyToId || null,
      to: [],
      cc: [],
      bcc: [],
      attachments: opts.attachments || [],
    };

    dom.composeModal.style.display = 'flex';
    dom.composeModal.classList.remove('minimized');

    // Set title
    const titles = { new: 'New Message', reply: 'Reply', replyAll: 'Reply All', forward: 'Forward', draft: 'Draft' };
    dom.composeTitle.textContent = titles[state.compose.mode] || 'New Message';

    // Clear fields
    dom.composeTo.value = '';
    dom.composeCc.value = '';
    dom.composeBcc.value = '';
    dom.composeSubject.value = opts.subject || '';
    dom.composeBody.value = opts.body || '';
    dom.composeToChips.innerHTML = '';
    dom.composeCcChips.innerHTML = '';
    dom.composeBccChips.innerHTML = '';

    // Show CC/BCC if needed
    const showCcBcc = (opts.cc && opts.cc.length > 0) || (opts.bcc && opts.bcc.length > 0);
    dom.composeCcField.style.display = showCcBcc ? '' : 'none';
    dom.composeBccField.style.display = showCcBcc ? '' : 'none';

    // Add chips
    (opts.to || []).forEach(c => addChip('to', c));
    (opts.cc || []).forEach(c => addChip('cc', c));
    (opts.bcc || []).forEach(c => addChip('bcc', c));

    // Render attachments
    renderComposeAttachments();

    dom.composeTo.focus();
  }

  function closeCompose() {
    dom.composeModal.style.display = 'none';
    state.compose.open = false;
    state.compose.attachments = [];
    dom.composeAttachments.innerHTML = '';
  }

  function addChip(field, contact) {
    const chipsEl = field === 'to' ? dom.composeToChips : field === 'cc' ? dom.composeCcChips : dom.composeBccChips;
    const arr = field === 'to' ? state.compose.to : field === 'cc' ? state.compose.cc : state.compose.bcc;

    // Avoid duplicates
    if (arr.some(c => c.address === contact.address)) return;
    arr.push(contact);

    const chip = document.createElement('span');
    chip.className = 'compose-chip';
    chip.innerHTML = `
      <span>${escapeHtml(contact.name || contact.address)}</span>
      <span class="compose-chip-remove">&times;</span>
    `;
    chip.querySelector('.compose-chip-remove').addEventListener('click', () => {
      const idx = arr.findIndex(c => c.address === contact.address);
      if (idx >= 0) arr.splice(idx, 1);
      chip.remove();
    });
    chipsEl.appendChild(chip);
  }

  function parseEmailInput(val) {
    val = val.trim();
    if (!val) return null;
    // Try "Name <email>" format
    const match = val.match(/^(.+?)\s*<(.+?)>$/);
    if (match) return { name: match[1].trim(), address: match[2].trim() };
    // Just email
    if (val.includes('@')) return { name: '', address: val };
    return null;
  }

  function finalizeChipsFromInput(field) {
    const input = field === 'to' ? dom.composeTo : field === 'cc' ? dom.composeCc : dom.composeBcc;
    const val = input.value.trim();
    if (val) {
      const contact = parseEmailInput(val);
      if (contact) {
        addChip(field, contact);
        input.value = '';
      }
    }
  }

  async function sendEmail() {
    finalizeChipsFromInput('to');
    finalizeChipsFromInput('cc');
    finalizeChipsFromInput('bcc');

    const to = state.compose.to;
    const cc = state.compose.cc;
    const bcc = state.compose.bcc;
    const subject = dom.composeSubject.value;
    const body = dom.composeBody.value;
    const bodyHtml = '<p>' + escapeHtml(body).replace(/\n/g, '<br>') + '</p>';
    const attachments = state.compose.attachments;

    if (to.length === 0) {
      notify('Please add at least one recipient');
      return;
    }

    try {
      if (state.compose.mode === 'reply' || state.compose.mode === 'replyAll') {
        await API.replyToEmail(state.compose.replyToId, {
          body: bodyHtml,
          bodyText: body,
          replyAll: state.compose.mode === 'replyAll',
        });
      } else if (state.compose.mode === 'forward') {
        await API.forwardEmail(state.compose.replyToId, {
          to,
          body: bodyHtml,
          bodyText: body,
        });
      } else {
        // New or draft send
        const emailData = {
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject,
          body: bodyHtml,
          bodyText: body,
          folder: 'sent',
          attachments: attachments.length > 0 ? attachments : undefined,
        };

        // If editing a draft, delete the draft first
        if (state.compose.draftId) {
          try { await API.deleteEmail(state.compose.draftId, true); } catch (e) {}
        }

        await API.createEmail(emailData);
      }

      notify('Message sent');
      closeCompose();
      loadFolderCounts();
      // Reload if in sent
      const route = getRoute();
      if (route.view === 'folder' && (route.folder === 'sent' || route.folder === 'drafts')) {
        handleRoute(route);
      }
    } catch (e) {
      notify('Failed to send: ' + e.message);
    }
  }

  async function saveDraft() {
    finalizeChipsFromInput('to');
    finalizeChipsFromInput('cc');
    finalizeChipsFromInput('bcc');

    const draftData = {
      to: state.compose.to,
      cc: state.compose.cc.length > 0 ? state.compose.cc : undefined,
      bcc: state.compose.bcc.length > 0 ? state.compose.bcc : undefined,
      subject: dom.composeSubject.value,
      body: '<p>' + escapeHtml(dom.composeBody.value).replace(/\n/g, '<br>') + '</p>',
      bodyText: dom.composeBody.value,
      folder: 'drafts',
      attachments: state.compose.attachments.length > 0 ? state.compose.attachments : undefined,
    };

    try {
      if (state.compose.draftId) {
        await API.updateEmail(state.compose.draftId, {
          subject: draftData.subject,
          body: draftData.body,
          bodyText: draftData.bodyText,
        });
        notify('Draft updated');
      } else {
        const res = await API.createEmail(draftData);
        state.compose.draftId = res.email.id;
        notify('Draft saved');
      }
      loadFolderCounts();
      const route = getRoute();
      if (route.view === 'folder' && route.folder === 'drafts') {
        handleRoute(route);
      }
    } catch (e) {
      notify('Failed to save draft: ' + e.message);
    }
  }

  async function discardCompose() {
    if (state.compose.draftId) {
      try {
        await API.deleteEmail(state.compose.draftId, true);
        loadFolderCounts();
        const route = getRoute();
        if (route.view === 'folder' && route.folder === 'drafts') {
          handleRoute(route);
        }
      } catch (e) {}
    }
    closeCompose();
  }

  function openDraft(email) {
    openCompose({
      mode: 'draft',
      draftId: email.id,
      to: email.to || [],
      cc: email.cc || [],
      bcc: email.bcc || [],
      subject: email.subject || '',
      body: email.bodyText || '',
      attachments: email.attachments || [],
    });
  }

  function openReply(mode) {
    const email = state.currentEmail;
    if (!email) return;

    const opts = { mode, replyToId: email.id };

    if (mode === 'reply') {
      opts.to = email.from ? [email.from] : [];
      opts.subject = email.subject && !email.subject.startsWith('Re:') ? 'Re: ' + email.subject : email.subject;
    } else if (mode === 'replyAll') {
      opts.to = email.from ? [email.from] : [];
      opts.cc = (email.to || []).concat(email.cc || []).filter(c => c.address !== 'me@gmail-clone.local');
      opts.subject = email.subject && !email.subject.startsWith('Re:') ? 'Re: ' + email.subject : email.subject;
    } else if (mode === 'forward') {
      opts.to = [];
      opts.subject = email.subject && !email.subject.startsWith('Fwd:') ? 'Fwd: ' + email.subject : email.subject;
    }

    // Quoted original
    const fromStr = email.from ? contactStr(email.from) : '';
    const dateStr = formatFullDate(email.date);
    const quotedHeader = `\n\n---------- Forwarded message ----------\nFrom: ${fromStr}\nDate: ${dateStr}\nSubject: ${email.subject || ''}\nTo: ${contactListStr(email.to)}\n\n`;
    const quotedBody = email.bodyText || '';

    if (mode === 'forward') {
      opts.body = quotedHeader + quotedBody;
    } else {
      opts.body = '\n\nOn ' + dateStr + ', ' + fromStr + ' wrote:\n> ' + (quotedBody || '').split('\n').join('\n> ');
    }

    openCompose(opts);
  }

  function renderComposeAttachments() {
    dom.composeAttachments.innerHTML = '';
    state.compose.attachments.forEach((att, i) => {
      const el = document.createElement('span');
      el.className = 'compose-attachment-item';
      el.innerHTML = `
        &#128206; ${escapeHtml(att.name)} <span class="attachment-size">(${formatSize(att.size)})</span>
        <span class="compose-attachment-remove" data-idx="${i}">&times;</span>
      `;
      el.querySelector('.compose-attachment-remove').addEventListener('click', () => {
        state.compose.attachments.splice(i, 1);
        renderComposeAttachments();
      });
      dom.composeAttachments.appendChild(el);
    });
  }

  async function handleFileAttach(files) {
    for (const file of files) {
      try {
        const res = await API.uploadAttachment(file);
        state.compose.attachments.push(res.attachment);
        renderComposeAttachments();
      } catch (e) {
        notify('Failed to upload ' + file.name);
      }
    }
  }

  // ── Contact Autocomplete ───────────────────────────────
  let contactDebounce = null;
  let currentSuggestionsField = 'to';

  async function handleContactInput(field, value) {
    currentSuggestionsField = field;
    clearTimeout(contactDebounce);
    if (!value.trim()) {
      dom.contactSuggestions.style.display = 'none';
      return;
    }
    contactDebounce = setTimeout(async () => {
      try {
        const data = await API.getContacts(value.trim());
        const contacts = data.contacts || [];
        if (contacts.length === 0) {
          dom.contactSuggestions.style.display = 'none';
          return;
        }
        dom.contactSuggestions.innerHTML = '';
        contacts.forEach(c => {
          const item = document.createElement('div');
          item.className = 'contact-suggestion-item';
          item.innerHTML = `
            <span class="contact-suggestion-name">${escapeHtml(c.name || c.address)}</span>
            <span class="contact-suggestion-address">${escapeHtml(c.address)}</span>
          `;
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            addChip(field, { name: c.name || '', address: c.address });
            const input = field === 'to' ? dom.composeTo : field === 'cc' ? dom.composeCc : dom.composeBcc;
            input.value = '';
            dom.contactSuggestions.style.display = 'none';
          });
          dom.contactSuggestions.appendChild(item);
        });

        // Position suggestions near the active input
        const input = field === 'to' ? dom.composeTo : field === 'cc' ? dom.composeCc : dom.composeBcc;
        const wrapper = input.closest('.compose-input-wrapper');
        if (wrapper) {
          dom.contactSuggestions.style.display = 'block';
          // Move suggestions into the right wrapper if needed
          if (dom.contactSuggestions.parentNode !== wrapper) {
            wrapper.appendChild(dom.contactSuggestions);
            dom.contactSuggestions.style.display = 'block';
          }
        }
      } catch (e) {
        dom.contactSuggestions.style.display = 'none';
      }
    }, 200);
  }

  // ── Label Menu (toolbar) ───────────────────────────────
  function renderLabelMenu() {
    dom.labelMenu.innerHTML = '<div class="label-menu-title">Label as:</div>';
    state.labels.forEach(label => {
      const item = document.createElement('div');
      item.className = 'label-menu-item';

      // Check if all selected emails have this label
      const selectedEmails = state.emails.filter(e => state.selectedIds.has(e.id));
      const allHave = selectedEmails.every(e => (e.labels || []).includes(label.id));

      item.innerHTML = `
        <span class="label-menu-check">${allHave ? '&#10003;' : ''}</span>
        <span class="label-dot" style="background:${escapeHtml(label.color)}"></span>
        <span>${escapeHtml(label.name)}</span>
      `;
      item.addEventListener('click', () => {
        if (allHave) {
          bulkAction('unlabel', label.id);
        } else {
          bulkAction('label', label.id);
        }
        closeLabelMenu();
      });
      dom.labelMenu.appendChild(item);
    });
  }

  function toggleLabelMenu() {
    if (dom.labelMenu.classList.contains('open')) {
      closeLabelMenu();
    } else {
      renderLabelMenu();
      dom.labelMenu.classList.add('open');
    }
  }

  function closeLabelMenu() {
    dom.labelMenu.classList.remove('open');
  }

  // ── Route Handling ─────────────────────────────────────
  async function handleRoute(route) {
    renderActiveFolder();

    if (route.view === 'email') {
      await loadEmail(route.id);
    } else if (route.view === 'search') {
      state.searchQuery = route.query;
      state.currentFolder = '';
      state.currentLabel = null;
      dom.searchInput.value = route.query;
      dom.emailList.style.display = '';
      dom.emailDetail.style.display = 'none';
      dom.toolbar.style.display = '';
      await searchEmails(route.query);
    } else if (route.view === 'label') {
      state.currentFolder = '';
      state.currentLabel = route.labelId;
      state.searchQuery = '';
      state.currentPage = 1;
      dom.emailList.style.display = '';
      dom.emailDetail.style.display = 'none';
      dom.toolbar.style.display = '';
      await loadEmails(null, 1, route.labelId);
    } else {
      // folder view
      state.currentFolder = route.folder;
      state.currentLabel = null;
      state.searchQuery = '';
      state.currentPage = 1;
      dom.emailList.style.display = '';
      dom.emailDetail.style.display = 'none';
      dom.toolbar.style.display = '';
      await loadEmails(route.folder, 1);
    }
    updateToolbarState();
  }

  // ── Create Label Dialog ────────────────────────────────
  function openLabelDialog() {
    dom.labelDialogOverlay.style.display = 'flex';
    dom.labelNameInput.value = '';
    dom.labelColorInput.value = '#4285f4';
    dom.labelNameInput.focus();
  }

  function closeLabelDialog() {
    dom.labelDialogOverlay.style.display = 'none';
  }

  async function saveLabel() {
    const name = dom.labelNameInput.value.trim();
    const color = dom.labelColorInput.value;
    if (!name) {
      notify('Please enter a label name');
      return;
    }
    try {
      await API.createLabel({ name, color });
      notify('Label created');
      closeLabelDialog();
      loadLabels();
    } catch (e) {
      notify('Failed to create label: ' + e.message);
    }
  }

  // ── Event Binding ──────────────────────────────────────
  function bindEvents() {
    // Menu toggle
    dom.menuToggle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('collapsed');
      // On mobile
      dom.sidebar.classList.toggle('mobile-open');
    });

    // Search
    dom.searchBtn.addEventListener('click', doSearch);
    dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    function doSearch() {
      const q = dom.searchInput.value.trim();
      if (q) navigate(`search/${encodeURIComponent(q)}`);
    }

    // Compose
    dom.composeBtn.addEventListener('click', () => openCompose({ mode: 'new' }));
    dom.composeMinimize.addEventListener('click', () => {
      state.compose.minimized = !state.compose.minimized;
      dom.composeModal.classList.toggle('minimized', state.compose.minimized);
    });
    dom.composeDiscard.addEventListener('click', discardCompose);
    dom.composeTrash.addEventListener('click', discardCompose);
    dom.composeSend.addEventListener('click', sendEmail);
    dom.composeSaveDraft.addEventListener('click', saveDraft);

    // CC/BCC toggle
    dom.ccBccToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const show = dom.composeCcField.style.display === 'none';
      dom.composeCcField.style.display = show ? '' : 'none';
      dom.composeBccField.style.display = show ? '' : 'none';
    });

    // To/CC/BCC inputs - Enter or comma to add chip
    [
      { input: dom.composeTo, field: 'to' },
      { input: dom.composeCc, field: 'cc' },
      { input: dom.composeBcc, field: 'bcc' },
    ].forEach(({ input, field }) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
          e.preventDefault();
          finalizeChipsFromInput(field);
        }
        if (e.key === 'Backspace' && !input.value) {
          // Remove last chip
          const arr = field === 'to' ? state.compose.to : field === 'cc' ? state.compose.cc : state.compose.bcc;
          if (arr.length > 0) {
            arr.pop();
            const chipsEl = field === 'to' ? dom.composeToChips : field === 'cc' ? dom.composeCcChips : dom.composeBccChips;
            if (chipsEl.lastChild) chipsEl.lastChild.remove();
          }
        }
      });

      input.addEventListener('input', () => {
        handleContactInput(field, input.value);
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          dom.contactSuggestions.style.display = 'none';
          finalizeChipsFromInput(field);
        }, 200);
      });
    });

    // File attach
    dom.composeAttach.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileAttach(e.target.files);
        e.target.value = '';
      }
    });

    // Select all
    dom.selectAll.addEventListener('change', () => {
      state.selectedIds.clear();
      if (dom.selectAll.checked) {
        state.emails.forEach(e => state.selectedIds.add(e.id));
      }
      renderEmailList();
      updateToolbarState();
    });

    // Toolbar actions
    dom.toolbarArchive.addEventListener('click', () => bulkAction('archive'));
    dom.toolbarDelete.addEventListener('click', () => {
      if (state.currentFolder === 'trash') {
        bulkAction('delete');
      } else {
        bulkAction('trash');
      }
    });
    dom.toolbarRead.addEventListener('click', () => bulkAction('read'));
    dom.toolbarUnread.addEventListener('click', () => bulkAction('unread'));
    dom.toolbarSpam.addEventListener('click', () => {
      if (state.currentFolder === 'spam') {
        bulkAction('inbox');
      } else {
        bulkAction('spam');
      }
    });
    dom.toolbarLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLabelMenu();
    });

    // Empty trash
    dom.emptyTrashBtn.addEventListener('click', emptyTrash);

    // Pagination
    dom.paginationPrev.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        if (state.currentLabel) {
          loadEmails(null, state.currentPage, state.currentLabel);
        } else {
          loadEmails(state.currentFolder, state.currentPage);
        }
      }
    });
    dom.paginationNext.addEventListener('click', () => {
      if (state.currentPage < state.totalPages) {
        state.currentPage++;
        if (state.currentLabel) {
          loadEmails(null, state.currentPage, state.currentLabel);
        } else {
          loadEmails(state.currentFolder, state.currentPage);
        }
      }
    });

    // Label dialog
    dom.createLabelBtn.addEventListener('click', openLabelDialog);
    dom.labelCancelBtn.addEventListener('click', closeLabelDialog);
    dom.labelSaveBtn.addEventListener('click', saveLabel);
    dom.labelDialogOverlay.addEventListener('click', (e) => {
      if (e.target === dom.labelDialogOverlay) closeLabelDialog();
    });
    dom.labelNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveLabel();
    });

    // Close label menu on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.toolbar-label-wrapper')) {
        closeLabelMenu();
      }
    });

    // Hash change
    window.addEventListener('hashchange', () => {
      const route = getRoute();
      handleRoute(route);
    });
  }

  // ── Init ───────────────────────────────────────────────
  async function init() {
    cacheDom();
    bindEvents();

    // Load initial data
    await Promise.all([loadFolderCounts(), loadLabels()]);

    // Handle initial route
    const route = getRoute();
    handleRoute(route);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

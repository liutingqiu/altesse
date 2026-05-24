/* ============================================================
   ALTESSE — admin.js
   Atelier Portal: Works / Collections / Messages / Settings
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const TOKEN = localStorage.getItem('altesse_admin_token');

  function escAttr(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function authFetch(url, opts) {
    if (!TOKEN) { window.location.href = 'login.html'; throw new Error('Unauthorized'); }
    const defaultHeaders = { 'Authorization': 'Bearer ' + TOKEN };
    if (opts?.body && typeof opts.body === 'string' && opts.body.startsWith('{')) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    opts = { ...opts, headers: { ...defaultHeaders, ...(opts?.headers || {}) } };
    const r = await fetch(url, opts);
    if (r.status === 401) { window.location.href = 'login.html'; throw new Error('Session expired'); }
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText); }
    return r;
  }

  // ── Panel Switch ──
  function switchPanel(id) {
    $$('.admin-panel').forEach(p => p.classList.remove('active'));
    $$('.admin-sidebar-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
    const panel = $('#' + id);
    if (panel) panel.classList.add('active');
  }

  $$('.admin-sidebar-btn[data-panel]').forEach(b => b.addEventListener('click', () => switchPanel(b.dataset.panel)));

  // ── Toast ──
  function toast(msg, type) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast ' + type + ' show';
    clearTimeout(t._tid); t._tid = setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ── Modal ──
  function openModal(html) { $('#modalContent').innerHTML = html; $('#modalOverlay').classList.add('open'); }
  function closeModal() { $('#modalOverlay').classList.remove('open'); }
  $('#modalOverlay').addEventListener('click', e => { if (e.target === $('#modalOverlay')) closeModal(); });

  // ── Dashboard ──
  async function loadDashboard() {
    try {
      const [works, cols, msgs] = await Promise.all([
        (await authFetch('/api/admin/works')).json().catch(() => []),
        (await authFetch('/api/admin/collections')).json().catch(() => []),
        (await authFetch('/api/admin/messages')).json().catch(() => []),
      ]);
      $('#statsGrid').innerHTML = [
        { label: adminT('works') || 'Works', value: works.length },
        { label: adminT('collections') || 'Collections', value: cols.length },
        { label: adminT('messages') || 'Messages', value: msgs.filter(m => !m.read).length + ' ' + (adminT('unread') || 'unread') },
      ].map(s => `<div class="admin-stat-card"><p class="admin-stat-value">${s.value}</p><p class="admin-stat-label">${s.label}</p></div>`).join('');
    } catch (e) { console.error(e); }
  }

  // ── Works ──
  async function loadWorks() {
    try {
      const works = await (await authFetch('/api/admin/works')).json();
      $('#worksTbody').innerHTML = works.length ? works.map(w => `
        <tr>
          <td><img src="${w.images[0]}" alt="" style="width:60px;height:80px;object-fit:cover"></td>
          <td>${w.name}</td><td>${w.collection}</td><td>${w.featured ? '★' : '—'}</td>
          <td>
            <button class="admin-action-btn edit" onclick="editWork('${w.id}')">${adminT('edit')}</button>
            <button class="admin-action-btn delete" onclick="deleteWork('${w.id}')">${adminT('del')}</button>
          </td>
        </tr>`).join('') : `<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-muted)">${adminT('noWorks')}</td></tr>`;
    } catch (e) { console.error(e); }
  }

  window.openWorkModal = function(editData) {
    const p = editData || {};
    const isEdit = !!editData;
    openModal(`
      <h3>${isEdit ? adminT('edit')+' '+adminT('works') : adminT('new_work')}</h3>
      <form id="workForm">
        <div class="form-group"><label>${adminT('lbl_name')}</label><input type="text" id="wf_name" value="${escAttr(p.name||'')}" required></div>
        <div class="form-group"><label>${adminT('lbl_nameZh')}</label><input type="text" id="wf_nameZh" value="${escAttr(p.nameZh||'')}"></div>
        <div class="form-group"><label>${adminT('lbl_collection')}</label><input type="text" id="wf_collection" value="${escAttr(p.collection||'')}"></div>
        <div class="form-group"><label>${adminT('lbl_insp')}</label><textarea id="wf_inspiration" rows="3">${escAttr(p.inspiration||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_inspZh')}</label><textarea id="wf_inspirationZh" rows="3">${escAttr(p.inspirationZh||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_craft')}</label><textarea id="wf_craft" rows="3">${escAttr(p.craft||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_craftZh')}</label><textarea id="wf_craftZh" rows="3">${escAttr(p.craftZh||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_images')}</label><input type="text" id="wf_images" value="${escAttr((p.images||[]).join(', '))}"></div>
        <div class="form-group"><label>${adminT('lbl_video')}</label><input type="text" id="wf_videoUrl" value="${escAttr(p.videoUrl||'')}"></div>
        <div class="form-group"><label>${adminT('lbl_order')}</label><input type="number" id="wf_order" value="${p.order||1}"></div>
        <label style="display:flex;gap:16px;margin:12px 0;align-items:center"><input type="checkbox" id="wf_featured" ${p.featured?'checked':''}> ${adminT('lbl_featured')}</label>
        <div class="modal-actions">
          <button type="button" onclick="closeModal()" class="admin-action-btn">${adminT('cancel')}</button>
          <button type="submit" class="admin-action-btn primary">${isEdit ? adminT('update') : adminT('create')}</button>
        </div>
      </form>
    `);
    $('#workForm').addEventListener('submit', async e => {
      e.preventDefault();
      const body = {
        id: p.id || undefined,
        name: $('#wf_name').value, nameZh: $('#wf_nameZh').value,
        collection: $('#wf_collection').value,
        inspiration: $('#wf_inspiration').value, inspirationZh: $('#wf_inspirationZh').value,
        craft: $('#wf_craft').value, craftZh: $('#wf_craftZh').value,
        images: $('#wf_images').value.split(',').map(s => s.trim()).filter(Boolean),
        videoUrl: $('#wf_videoUrl').value,
        featured: $('#wf_featured').checked,
        order: parseInt($('#wf_order').value)
      };
      try {
        await authFetch('/api/admin/works', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
        closeModal(); toast(isEdit ? 'Work updated.' : 'Work created.', 'success'); loadWorks();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  window.editWork = async function(id) { const works = await (await authFetch('/api/admin/works')).json(); const w = works.find(x => x.id === id); if (w) openWorkModal(w); };
  window.deleteWork = async function(id) { if (!confirm(adminT('del')+'?')) return; try { await authFetch('/api/admin/works?id=' + encodeURIComponent(id), { method: 'DELETE' }); toast(adminT('del')+'d', 'success'); loadWorks(); } catch (e) { toast(e.message, 'error'); } };

  // ── Collections ──
  async function loadCollections() {
    try {
      const cols = await (await authFetch('/api/admin/collections')).json();
      $('#colsTbody').innerHTML = cols.length ? cols.map(c => `
        <tr><td><img src="${c.coverImage}" alt="" style="width:80px;height:60px;object-fit:cover"></td>
          <td>${c.name}</td><td>${c.active !== false ? '✓' : '—'}</td><td>${c.order}</td>
          <td>
            <button class="admin-action-btn edit" onclick="editCollection('${c.id}')">${adminT('edit')}</button>
            <button class="admin-action-btn delete" onclick="deleteCollection('${c.id}')">${adminT('del')}</button>
          </td>
        </tr>`).join('') : `<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-muted)">${adminT('noCols')}</td></tr>`;
    } catch (e) { console.error(e); }
  }

  window.openCollectionModal = function(editData) {
    const c = editData || {};
    const isEdit = !!editData;
    openModal(`
      <h3>${isEdit ? adminT('edit')+' '+adminT('collections') : adminT('new_col')}</h3>
      <form id="colForm">
        <div class="form-group"><label>${adminT('lbl_name')}</label><input type="text" id="cf_name" value="${escAttr(c.name||'')}" required></div>
        <div class="form-group"><label>${adminT('lbl_nameZh')}</label><input type="text" id="cf_nameZh" value="${escAttr(c.nameZh||'')}"></div>
        <div class="form-group"><label>${adminT('lbl_desc')}</label><textarea id="cf_desc" rows="3">${escAttr(c.description||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_descZh')}</label><textarea id="cf_descZh" rows="3">${escAttr(c.descriptionZh||'')}</textarea></div>
        <div class="form-group"><label>${adminT('lbl_cover')}</label><input type="text" id="cf_cover" value="${escAttr(c.coverImage||'')}"></div>
        <div class="form-group"><label>${adminT('lbl_order')}</label><input type="number" id="cf_order" value="${c.order||1}"></div>
        <label style="display:flex;gap:16px;margin:12px 0"><input type="checkbox" id="cf_active" ${c.active !== false?'checked':''}> ${adminT('lbl_active')}</label>
        <div class="modal-actions">
          <button type="button" onclick="closeModal()" class="admin-action-btn">${adminT('cancel')}</button>
          <button type="submit" class="admin-action-btn primary">${isEdit ? adminT('update') : adminT('create')}</button>
        </div>
      </form>
    `);
    $('#colForm').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await authFetch('/api/admin/collections', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify({
          id: c.id || undefined,
          name: $('#cf_name').value, nameZh: $('#cf_nameZh').value,
          description: $('#cf_desc').value, descriptionZh: $('#cf_descZh').value,
          coverImage: $('#cf_cover').value,
          active: $('#cf_active').checked,
          order: parseInt($('#cf_order').value) || 1
        })});
        closeModal(); toast(isEdit ? 'Collection updated.' : 'Collection created.', 'success'); loadCollections();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  window.editCollection = async function(id) { const cols = await (await authFetch('/api/admin/collections')).json(); const c = cols.find(x => x.id === id); if (c) openCollectionModal(c); };
  window.deleteCollection = async function(id) { if (!confirm('Delete collection?')) return; try { await authFetch('/api/admin/collections?id=' + id, { method: 'DELETE' }); toast('Deleted', 'success'); loadCollections(); } catch (e) { toast(e.message, 'error'); } };

  // ── Messages ──
  async function loadMessages() {
    try {
      const msgs = await (await authFetch('/api/admin/messages')).json();
      $('#msgsTbody').innerHTML = msgs.length ? msgs.map(m => `
        <tr><td>${m.name}<br><small style="color:var(--text-muted)">${m.email}</small></td><td>${m.subject}</td>
          <td>${new Date(m.createdAt).toLocaleDateString()}</td><td>${m.read ? adminT('read') : '🔵 '+adminT('newMsg')}</td>
          <td>
            <button class="admin-action-btn" onclick="toggleRead('${m.id}',${!m.read})">${m.read ? adminT('markUnread') : adminT('markRead')}</button>
            <button class="admin-action-btn delete" onclick="deleteMessage('${encodeURIComponent(m.id)}')">${adminT('del')}</button>
          </td>
        </tr>`).join('') : `<tr><td colspan="5" style="padding:40px;text-align:center">${adminT('noMsgs')}</td></tr>`;
    } catch (e) { console.error(e); }
  }

  window.toggleRead = async function(id, read) { try { await authFetch('/api/admin/messages', { method: 'PUT', body: JSON.stringify({ id, read }) }); loadMessages(); } catch (e) { toast(e.message, 'error'); } };
  window.deleteMessage = async function(id) { if (!confirm(adminT('del')+'?')) return; try { await authFetch('/api/admin/messages?id=' + id, { method: 'DELETE' }); toast(adminT('del')+'d', 'success'); loadMessages(); } catch (e) { toast(e.message, 'error'); } };

  // ── Settings ──
  async function loadSettingsPanel() {
    try {
      const s = await (await authFetch('/api/admin/settings')).json();
      $('#s_siteName').value = s.siteName || '';
      $('#s_email').value = s.email || '';
      $('#s_instagram').value = s.instagram || '';
      $('#s_address').value = s.address || '';
      $('#s_announcement').value = s.announcement?.text || '';
      $('#s_announcementZh').value = s.announcement?.textZh || '';
      const sLang = $('#s_adminLang');
      sLang.value = localStorage.getItem('altesse_lang') || 'en';
      // 父链接变更 → 即时同步子链接（侧边栏）
      sLang.onchange = () => {
        localStorage.setItem('altesse_lang', sLang.value);
        if (adminLang) adminLang.value = sLang.value;
        applyAdminLang();
      };
    } catch (e) { console.error(e); }
  }

  $('#settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const newLang = $('#s_adminLang').value;
      if (newLang !== localStorage.getItem('altesse_lang')) {
        localStorage.setItem('altesse_lang', newLang);
        applyAdminLang();
      }
      await authFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({
        siteName: $('#s_siteName').value, email: $('#s_email').value,
        instagram: $('#s_instagram').value, address: $('#s_address').value,
        announcement: { active: true, text: $('#s_announcement').value, textZh: $('#s_announcementZh').value }
      })});
      toast(adminT('save')+' ✓', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });

  // ── Logout ──
  window.logout = async function() {
    try { await fetch('/api/admin/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN } }); } catch {}
    localStorage.removeItem('altesse_admin_token'); localStorage.removeItem('altesse_admin_role');
    window.location.href = 'login.html';
  };

  // ── Admin UI i18n ──
  const adminI18n = {
    en: { overview:'Overview', works:'Works', collections:'Collections', messages:'Messages', settings:'Settings', logout:'Logout',
      h_works:'Works', h_cols:'Collections', h_msgs:'Messages', h_settings:'Settings', h_overview:'Overview',
      new_work:'+ New Work', new_col:'+ New Collection', save:'Save Settings',
      lbl_name:'Name (EN)', lbl_nameZh:'名称 (中文)', lbl_collection:'Collection', lbl_insp:'Inspiration (EN)', lbl_inspZh:'灵感 (中文)',
      lbl_craft:'Craft (EN)', lbl_craftZh:'工艺 (中文)', lbl_images:'Images (comma-sep)', lbl_video:'Video URL', lbl_order:'Order',
      lbl_featured:'Featured', lbl_cover:'Cover Image', lbl_desc:'Description (EN)', lbl_descZh:'描述 (中文)', lbl_active:'Active',
      lbl_siteName:'Site Name', lbl_email:'Email', lbl_instagram:'Instagram', lbl_address:'Address',
      lbl_announce:'Announcement', lbl_announceZh:'公告 (中文)',
      cancel:'Cancel', create:'Create', update:'Update', del:'Del', edit:'Edit',
      markRead:'Mark Read', markUnread:'Mark Unread', noWorks:'No works yet.', noCols:'No collections yet.', noMsgs:'No messages.',
      unread:'unread', read:'Read', newMsg:'New',
    },
    zh: { overview:'概览', works:'作品', collections:'系列', messages:'留言', settings:'设置', logout:'退出',
      h_works:'作品管理', h_cols:'系列管理', h_msgs:'留言管理', h_settings:'站点设置', h_overview:'概览',
      new_work:'+ 新作品', new_col:'+ 新系列', save:'保存设置',
      lbl_name:'名称 (英文)', lbl_nameZh:'名称 (中文)', lbl_collection:'所属系列', lbl_insp:'灵感 (英文)', lbl_inspZh:'灵感 (中文)',
      lbl_craft:'工艺 (英文)', lbl_craftZh:'工艺 (中文)', lbl_images:'图片 (逗号分隔)', lbl_video:'视频链接', lbl_order:'排序',
      lbl_featured:'首页精选', lbl_cover:'封面图片', lbl_desc:'描述 (英文)', lbl_descZh:'描述 (中文)', lbl_active:'启用',
      lbl_siteName:'站点名称', lbl_email:'邮箱', lbl_instagram:'Instagram', lbl_address:'地址',
      lbl_announce:'公告文字', lbl_announceZh:'公告 (中文)',
      cancel:'取消', create:'创建', update:'更新', del:'删', edit:'编辑',
      markRead:'标已读', markUnread:'标未读', noWorks:'暂无作品。', noCols:'暂无系列。', noMsgs:'暂无留言。',
      unread:'未读', read:'已读', newMsg:'新',
    }
  };
  function adminT(key) { const lang = localStorage.getItem('altesse_lang') || 'en'; return (adminI18n[lang] && adminI18n[lang][key]) || (adminI18n.en[key] || key); }

  function applyAdminLang() {
    // 侧边栏按钮
    $$('.admin-sidebar-btn[data-panel]').forEach(b => {
      const p = b.dataset.panel;
      if (p === 'panel-dashboard') b.textContent = adminT('overview');
      else if (p === 'panel-works') b.textContent = adminT('works');
      else if (p === 'panel-collections') b.textContent = adminT('collections');
      else if (p === 'panel-messages') b.textContent = adminT('messages');
      else if (p === 'panel-settings') b.textContent = adminT('settings');
    });
    // Settings 表单标签
    const labelMap = { lbl_siteName:'lbl_siteName', lbl_email:'lbl_email', lbl_instagram:'lbl_instagram', lbl_address:'lbl_address', lbl_announce:'lbl_announce', lbl_announceZh:'lbl_announceZh' };
    Object.entries(labelMap).forEach(([key, id]) => { const el = document.getElementById(id); if (el) el.textContent = adminT(key); });
    const saveBtn = document.getElementById('s_saveBtn');
    if (saveBtn) saveBtn.textContent = adminT('save');
    // Logout 按钮
    const logoutBtn = document.querySelector('.admin-sidebar-btn[onclick]');
    if (logoutBtn) logoutBtn.textContent = adminT('logout');
    // 刷新当前面板
    const activePanel = $('.admin-panel.active');
    if (activePanel) {
      const panelId = activePanel.id;
      if (panelId === 'panel-works') loadWorks();
      else if (panelId === 'panel-collections') loadCollections();
      else if (panelId === 'panel-messages') loadMessages();
      else if (panelId === 'panel-settings') loadSettingsPanel();
      else if (panelId === 'panel-dashboard') loadDashboard();
    }
  }

  const adminLang = $('#adminLangSwitcher');
  if (adminLang) {
    adminLang.value = localStorage.getItem('altesse_lang') || 'en';
    adminLang.addEventListener('change', () => {
      localStorage.setItem('altesse_lang', adminLang.value);
      // 同步父链接 → Settings 中的母语下拉
      const parentSel = $('#s_adminLang');
      if (parentSel) parentSel.value = adminLang.value;
      applyAdminLang();
    });
  }

  // ── Init ──
  applyAdminLang();
  loadDashboard();
  $$('.admin-sidebar-btn[data-panel]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.panel;
    if (p === 'panel-works') loadWorks();
    else if (p === 'panel-collections') loadCollections();
    else if (p === 'panel-messages') loadMessages();
    else if (p === 'panel-settings') loadSettingsPanel();
    else if (p === 'panel-dashboard') loadDashboard();
  }));
})();

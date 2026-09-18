// ==========================================================
// ROOKIE JOKI - CMS ADMIN PANEL & CRUD ENGINE
// ==========================================================
// Semua aksi CRUD di file ini berujung ke cmsSaveAndSync(), yang
// memanggil cmsPersist() (assets/cms-store.js) - artinya SETIAP
// perubahan langsung dikirim & disimpan ke server (data.json via
// api.php), lalu tampilan publik yang relevan langsung di-refresh.
// Tidak ada lagi penyimpanan sementara ke localStorage.
// ==========================================================

const CMS_SCHEMA = {
    header: {
        label: 'Header / Navbar',
        icon: 'layout-panel-top',
        type: 'object',
        path: ['header'],
        fields: [
            { key: 'title', label: 'Judul Situs', type: 'text' },
            { key: 'tagline', label: 'Tagline', type: 'text' },
            { key: 'ctaLabel', label: 'Teks Tombol Pesan', type: 'text' }
        ],
        onSave: renderHeader
    },
    ticker: {
        label: 'Teks Berjalan (Ticker)',
        icon: 'megaphone',
        type: 'list',
        path: ['ticker'],
        itemLabel: (item) => item.text || '(kosong)',
        fields: [
            { key: 'text', label: 'Teks', type: 'text' },
            { key: 'icon', label: 'Ikon Lucide', type: 'text' },
            { key: 'color', label: 'Warna Text', type: 'text' }
        ],
        emptyItem: () => ({ text: '', icon: 'zap', color: 'text-white' }),
        onSave: renderTicker
    },
    slider: {
        label: 'Slider Banner',
        icon: 'images',
        type: 'list',
        path: ['slider'],
        itemLabel: (item) => item.title || '(kosong)',
        fields: [
            { key: 'image', label: 'URL Gambar', type: 'text' },
            { key: 'badgeText', label: 'Teks Badge', type: 'text' },
            { key: 'badgeColor', label: 'Warna Badge', type: 'text' },
            { key: 'title', label: 'Judul Slide', type: 'text' },
            { key: 'desc', label: 'Deskripsi', type: 'textarea' }
        ],
        emptyItem: () => ({ image: '', badgeText: 'PROMO', badgeColor: 'bg-brand-blue', title: '', desc: '' }),
        onSave: renderSlider
    },
    portfolio: {
        label: 'Galeri Portofolio',
        icon: 'image',
        type: 'list',
        path: ['portfolio'],
        itemLabel: (item) => item.title || '(kosong)',
        fields: [
            { key: 'image', label: 'URL Gambar', type: 'text' },
            { key: 'title', label: 'Judul', type: 'text' },
            { key: 'desc', label: 'Deskripsi Singkat', type: 'textarea' },
            { key: 'tag', label: 'Badge', type: 'text' },
            { key: 'status', label: 'Status', type: 'text' },
            { key: 'worker', label: 'Worker', type: 'text' }
        ],
        emptyItem: () => ({ image: '', title: '', desc: '', tag: 'TESTI', status: '100% Clean', worker: 'Worker Pro' }),
        onSave: renderPortfolio
    },
    testimonials: {
        label: 'Testimoni Pelanggan',
        icon: 'star',
        type: 'list',
        path: ['testimonials'],
        itemLabel: (item) => `${item.name || '(kosong)'} - ${item.service || ''}`,
        fields: [
            { key: 'name', label: 'Nama Pelanggan', type: 'text' },
            { key: 'service', label: 'Layanan', type: 'text' },
            { key: 'comment', label: 'Komentar', type: 'textarea' },
            { key: 'badge', label: 'Badge (mis: Pembeli Asli)', type: 'text' },
            { key: 'rating', label: 'Rating (1-5)', type: 'text' },
            { key: 'date', label: 'Tanggal', type: 'text' }
        ],
        emptyItem: () => ({
            id: Date.now(),
            name: '', service: '', comment: '', badge: 'Pembeli Asli',
            rating: 5,
            date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            daysAgo: 0
        }),
        onSave: cmsRefreshTestimonialsView
    },
    leaderboard: {
        label: 'Leaderboard Worker',
        icon: 'trophy',
        type: 'list',
        path: ['leaderboard'],
        itemLabel: (item) => `#${item.rank || '?'} ${item.name || '(kosong)'}`,
        fields: [
            { key: 'rank', label: 'Rank', type: 'text' },
            { key: 'name', label: 'Nama Worker', type: 'text' },
            { key: 'wr', label: 'Winrate (%)', type: 'text' },
            { key: 'match', label: 'Jumlah Match', type: 'text' },
            { key: 'badge', label: 'Badge', type: 'text' }
        ],
        emptyItem: () => ({ rank: ((SITE_DATA.leaderboard || []).length + 1), name: '', wr: 0, match: 0, badge: '' }),
        onSave: cmsRefreshLeaderboardView
    },
    orders: {
        label: 'Status Pesanan Joki',
        icon: 'package-search',
        type: 'list',
        path: ['orders'],
        itemLabel: (item) => `${item.id || '(kosong)'} - ${item.customer || ''} (${item.status || ''})`,
        fields: [
            { key: 'id', label: 'ID Transaksi', type: 'text' },
            { key: 'customer', label: 'Nama Pelanggan', type: 'text' },
            { key: 'phone', label: 'No. WhatsApp', type: 'text' },
            { key: 'service', label: 'Layanan Dipesan', type: 'text' },
            { key: 'worker', label: 'Worker Assigned', type: 'text' },
            { key: 'status', label: 'Status Pesanan', type: 'select', options: ['Pending', 'On Process', 'Done', 'Dibatalkan'] },
            { key: 'progress', label: 'Progres', type: 'text' }
        ],
        emptyItem: () => ({ id: `RK-${Date.now().toString().slice(-4)}`, customer: '', phone: '', service: 'Joki Rank', worker: '-', status: 'Pending', progress: 'Menunggu Worker' }),
        onSave: () => {}
    },
    paymentQris: {
        label: 'QRIS Pembayaran',
        icon: 'qr-code',
        type: 'object',
        path: ['paymentMethods', 'qris'],
        fields: [
            { key: 'badge', label: 'Label Badge', type: 'text' },
            { key: 'description', label: 'Deskripsi', type: 'textarea' },
            { key: 'qrImageUrl', label: 'URL Gambar QR', type: 'text' },
            { key: 'merchantName', label: 'Nama Merchant', type: 'text' }
        ],
        onSave: () => { renderPaymentMethods(); if(window.renderPaymentButtonLabels) renderPaymentButtonLabels(); }
    },
    paymentAccounts: {
        label: 'Rekening / E-Wallet',
        icon: 'landmark',
        type: 'list',
        path: ['paymentMethods', 'accounts'],
        itemLabel: (item) => `${item.label || '(kosong)'} (${item.category || ''})`,
        fields: [
            { key: 'category', label: 'Kategori', type: 'select', options: ['ewallet', 'bank', 'paylater'] },
            { key: 'label', label: 'Nama Bank / E-Wallet', type: 'text' },
            { key: 'number', label: 'Nomor Rekening / HP', type: 'text' },
            { key: 'note', label: 'Catatan (opsional)', type: 'text' }
        ],
        emptyItem: () => ({ category: 'ewallet', label: '', number: '', note: '' }),
        onSave: () => { renderPaymentMethods(); if(window.renderPaymentButtonLabels) renderPaymentButtonLabels(); }
    },
    faqs: {
        label: 'FAQ Pertanyaan',
        icon: 'help-circle',
        type: 'list',
        path: ['faqs'],
        itemLabel: (item) => item.question || '(kosong)',
        fields: [
            { key: 'question', label: 'Pertanyaan', type: 'text' },
            { key: 'answer', label: 'Jawaban', type: 'textarea' }
        ],
        emptyItem: () => ({ id: Date.now(), question: '', answer: '' }),
        onSave: renderFaqs
    }
};

let cmsActiveSection = 'header';

// ----------------------------------------------------------
// TOAST NOTIFIKASI KECIL (pengganti alert())
// ----------------------------------------------------------
function cmsToast(message, isError) {
    let wrap = document.getElementById('cmsToastWrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'cmsToastWrap';
        wrap.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:6px;align-items:center;width:100%;max-width:440px;padding:0 12px;pointer-events:none;';
        document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `pointer-events:auto;max-width:100%;padding:8px 14px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${isError ? '#e11d48' : '#0f172a'};box-shadow:0 6px 16px rgba(15,23,42,.25);opacity:0;transition:opacity .2s ease, transform .2s ease;transform:translateY(6px);text-align:center;`;
    wrap.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(6px)';
        setTimeout(() => el.remove(), 250);
    }, 2800);
}

// ----------------------------------------------------------
// LOGIN ADMIN (modal)
// ----------------------------------------------------------
function openAdminLoginModal() {
    if (cmsIsLoggedIn()) { openAdminPanel(); return; }
    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;
    const errEl = document.getElementById('adminLoginError');
    const userEl = document.getElementById('adminLoginUsername');
    const passEl = document.getElementById('adminLoginPassword');
    if (errEl) errEl.classList.add('hidden');
    if (userEl) userEl.value = '';
    if (passEl) passEl.value = '';
    const tokenEl = document.getElementById('adminGitHubToken');
    if (tokenEl) tokenEl.value = '';
    modal.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    if (window.lucide) lucide.createIcons();
    setTimeout(() => { if (userEl) userEl.focus(); }, 50);
}

function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.remove('modal-active');
    document.body.style.overflow = '';
}

async function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminLoginPassword').value;
    const githubToken = document.getElementById('adminGitHubToken')?.value || '';
    const errEl = document.getElementById('adminLoginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (errEl) errEl.classList.add('hidden');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Memproses...'; }
    try {
        const ok = await cmsLogin(username, password, githubToken);
        if (ok) {
            closeAdminLoginModal();
            cmsToast('Berhasil masuk sebagai admin.');
            renderAdminToolbar();
            if (typeof cmsRenderAllIndexSections === 'function') cmsRenderAllIndexSections();
        } else if (errEl) {
            errEl.textContent = 'Username atau password salah.';
            errEl.classList.remove('hidden');
        }
    } catch (err) {
        if (errEl) { errEl.textContent = 'Gagal login: ' + err.message; errEl.classList.remove('hidden'); }
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Masuk'; }
    }
}

function cmsHandleLogout() {
    cmsLogout();
    renderAdminToolbar();
    closeAdminPanel();
    if (typeof cmsRenderAllIndexSections === 'function') cmsRenderAllIndexSections();
    cmsToast('Berhasil keluar dari Panel Admin.');
}

/** Tombol mengambang "Panel Admin / Keluar" yang tampil setelah login. */
function renderAdminToolbar() {
    const toolbar = document.getElementById('adminToolbar');
    if (!toolbar) return;
    if (!cmsIsLoggedIn()) {
        toolbar.classList.add('hidden');
        toolbar.innerHTML = '';
        return;
    }
    toolbar.classList.remove('hidden');
    toolbar.innerHTML = `
        <div class="flex flex-col items-end gap-2">
            <button onclick="openAdminPanel()" class="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg hover:bg-slate-800 transition-colors">
                <i data-lucide="settings" class="w-3.5 h-3.5"></i> Panel Admin
            </button>
            <button onclick="cmsHandleLogout()" class="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shadow hover:bg-slate-50 transition-colors">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Keluar
            </button>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

/** Dipanggil sekali saat halaman selesai dimuat (lihat DOMContentLoaded di index.html). */
async function cmsInitAdmin() {
    try {
        await cmsEnsureAdminInitialized();
    } catch (e) {
        console.warn('CMS: Gagal memastikan akun admin tersedia.', e);
    }
    renderAdminToolbar();
}

// ----------------------------------------------------------
// PANEL ADMIN (sidebar + konten per section)
// ----------------------------------------------------------
function openAdminPanel() {
    if (!cmsIsLoggedIn()) { openAdminLoginModal(); return; }
    document.getElementById('adminPanelModal').classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    renderAdminPanelSidebar();
    renderAdminPanelContent(cmsActiveSection);
}

function closeAdminPanel() {
    document.getElementById('adminPanelModal').classList.remove('modal-active');
    document.body.style.overflow = '';
}

/** Dipakai oleh tombol edit di luar Panel Admin (mis. tombol "Edit QRIS") untuk
 *  memilih section tertentu sebelum panel dibuka. */
function cmsSwitchAdminSection(schemaKey) {
    cmsActiveSection = schemaKey;
}

/** Membuka Panel Admin LANGSUNG ke form tambah/edit item tertentu.
 *  index === -1 berarti "tambah item baru". */
function cmsOpenListItemForm(schemaKey, index) {
    if (!cmsIsLoggedIn()) { openAdminLoginModal(); return; }
    cmsActiveSection = schemaKey;
    document.getElementById('adminPanelModal').classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    renderAdminPanelSidebar();
    if (index === -1 || index === undefined || index === null || index < 0) {
        addListItem(schemaKey);
    } else {
        editListItem(schemaKey, index);
    }
}

function renderAdminPanelSidebar() {
    const sidebar = document.getElementById('adminPanelSidebar');
    if (!sidebar) return;

    let html = '<div class="space-y-1">';
    Object.keys(CMS_SCHEMA).forEach((key) => {
        const item = CMS_SCHEMA[key];
        const isActive = cmsActiveSection === key;
        html += `
            <button onclick="cmsActiveSection='${key}'; renderAdminPanelSidebar(); renderAdminPanelContent('${key}');"
                class="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }">
                <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
                <span class="truncate">${item.label}</span>
            </button>
        `;
    });
    html += '</div>';
    sidebar.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function renderAdminPanelContent(schemaKey) {
    const content = document.getElementById('adminPanelContent');
    if (!content) return;

    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) {
        content.innerHTML = '<p class="text-xs text-slate-400">Pilih menu di samping.</p>';
        return;
    }

    let data = cmsGetValueByPath(SITE_DATA, schema.path);

    if (schema.type === 'object') {
        renderObjectEditor(content, schema, data, schemaKey);
    } else if (schema.type === 'list') {
        renderListEditor(content, schema, data || [], schemaKey);
    } else if (schema.type === 'custom' && typeof schema.render === 'function') {
        schema.render(content);
    }
}

function renderObjectEditor(container, schema, data, schemaKey) {
    data = data || {};
    let fieldsHtml = schema.fields.map(f => `
        <div>
            <label class="block text-[10px] font-bold text-slate-600 mb-1">${f.label}</label>
            ${f.type === 'textarea'
                ? `<textarea data-key="${f.key}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue" rows="3">${cmsEsc(data[f.key] || '')}</textarea>`
                : `<input type="text" data-key="${f.key}" value="${cmsEsc(data[f.key] || '')}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue">`
            }
        </div>
    `).join('');

    container.innerHTML = `
        <div class="space-y-3">
            <h4 class="font-bold text-xs text-slate-900 border-b pb-1.5">${schema.label}</h4>
            <form onsubmit="saveObjectForm(event, '${schemaKey}')" class="space-y-2.5">
                ${fieldsHtml}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors">
                    Simpan Perubahan
                </button>
            </form>
        </div>
    `;
}

function renderListEditor(container, schema, list, schemaKey) {
    let itemsHtml = list.map((item, index) => `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-800 truncate">${schema.itemLabel(item)}</span>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="cmsMoveListItem('${schemaKey}', ${index}, -1)" title="Naik" class="px-1.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">↑</button>
                <button onclick="cmsMoveListItem('${schemaKey}', ${index}, 1)" title="Turun" class="px-1.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">↓</button>
                <button onclick="editListItem('${schemaKey}', ${index})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600">Edit</button>
                <button onclick="deleteListItem('${schemaKey}', ${index})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700">Hapus</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">${schema.label}</h4>
                <button onclick="addListItem('${schemaKey}')" class="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700">
                    + Tambah Data
                </button>
            </div>
            <div class="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                ${itemsHtml.length ? itemsHtml : '<p class="text-[11px] text-slate-400">Belum ada data.</p>'}
            </div>
        </div>
    `;
}

async function saveObjectForm(e, schemaKey) {
    e.preventDefault();
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const form = e.target;
    const targetObj = cmsGetValueByPath(SITE_DATA, schema.path) || {};

    form.querySelectorAll('[data-key]').forEach(el => {
        targetObj[el.getAttribute('data-key')] = el.value;
    });

    cmsSetValueByPath(SITE_DATA, schema.path, targetObj);
    await cmsSaveAndSync(schemaKey);
}

async function addListItem(schemaKey) {
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;

    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];
    list.push(schema.emptyItem());
    cmsSetValueByPath(SITE_DATA, schema.path, list);

    editListItem(schemaKey, list.length - 1);
}

function editListItem(schemaKey, index) {
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];
    const item = list[index];
    const content = document.getElementById('adminPanelContent');
    if (!item || !content) return;

    let fieldsHtml = schema.fields.map(f => {
        if (f.type === 'select') {
            const optionsHtml = f.options.map(opt => `<option value="${opt}" ${item[f.key] === opt ? 'selected' : ''}>${opt}</option>`).join('');
            return `
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-1">${f.label}</label>
                    <select data-key="${f.key}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue bg-white">${optionsHtml}</select>
                </div>`;
        }
        return `
            <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">${f.label}</label>
                ${f.type === 'textarea'
                    ? `<textarea data-key="${f.key}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue" rows="3">${cmsEsc(item[f.key] || '')}</textarea>`
                    : `<input type="text" data-key="${f.key}" value="${cmsEsc(item[f.key] || '')}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue">`
                }
            </div>`;
    }).join('');

    content.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">Edit Item #${index + 1}</h4>
                <button onclick="renderAdminPanelContent('${schemaKey}')" class="text-[10px] text-slate-500 hover:underline">Kembali</button>
            </div>
            <form onsubmit="saveListItemForm(event, '${schemaKey}', ${index})" class="space-y-2.5">
                ${fieldsHtml}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors">
                    Simpan Item
                </button>
            </form>
        </div>
    `;
}

async function saveListItemForm(e, schemaKey, index) {
    e.preventDefault();
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const form = e.target;
    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];

    form.querySelectorAll('[data-key]').forEach(el => {
        list[index][el.getAttribute('data-key')] = el.value;
    });

    cmsSetValueByPath(SITE_DATA, schema.path, list);
    await cmsSaveAndSync(schemaKey);
}

/** Hapus item list. Bisa dipanggil dari dalam Panel Admin ATAUPUN
 *  langsung dari tombol hapus inline di halaman publik (testimoni,
 *  leaderboard, FAQ, rekening pembayaran, dst) - tidak perlu buka panel. */
async function deleteListItem(schemaKey, index) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];
    list.splice(index, 1);
    cmsSetValueByPath(SITE_DATA, schema.path, list);
    await cmsSaveAndSync(schemaKey);
}
// Alias nama yang dipakai tombol-tombol inline di assets/cms-render.js
const cmsDeleteListItem = deleteListItem;

/**
 * Titik pusat penyimpanan: kirim SITE_DATA ke server, lalu
 *   1. refresh tampilan publik terkait (schema.onSave)
 *   2. jika Panel Admin sedang terbuka, refresh juga isinya
 */
async function cmsSaveAndSync(schemaKey) {
    try {
        await cmsPersist();
        cmsToast('Data berhasil disimpan ke server!');

        const schema = CMS_SCHEMA[schemaKey];
        if (schema && typeof schema.onSave === 'function') schema.onSave();

        const panel = document.getElementById('adminPanelModal');
        if (panel && panel.classList.contains('modal-active')) {
            cmsActiveSection = schemaKey;
            renderAdminPanelSidebar();
            renderAdminPanelContent(schemaKey);
        }
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        cmsToast('Gagal menyimpan: ' + err.message, true);
    }
}

function cmsGetValueByPath(obj, path) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

function cmsSetValueByPath(obj, path, value) {
    let cur = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = value;
}

// ----------------------------------------------------------
// CRUD ARTIKEL BLOG (form khusus, field lebih banyak & ada
// list/array seperti listItems & tags)
// ----------------------------------------------------------
function cmsOpenBlogForm(id) {
    if (!cmsIsLoggedIn()) { openAdminLoginModal(); return; }
    const isNew = (id === null || id === undefined);
    const list = SITE_DATA.blogPosts || (SITE_DATA.blogPosts = []);
    const index = isNew ? -1 : list.findIndex(p => p.id === id);
    const post = (!isNew && index !== -1) ? list[index] : {
        id: Date.now(),
        title: '', category: '', excerpt: '',
        image: '', secondaryImage: '',
        hasVideo: false, video: '',
        author: (SITE_DATA.header && SITE_DATA.header.title) || 'Admin',
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        readTime: '3 menit baca',
        intro: '', body1: '', body2: '',
        listTitle: 'Checklist:', listItems: [],
        closing: '', tags: []
    };

    document.getElementById('adminPanelModal').classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    const sidebar = document.getElementById('adminPanelSidebar');
    if (sidebar) sidebar.innerHTML = '';

    const fields = [
        { key: 'title', label: 'Judul Artikel', type: 'text' },
        { key: 'category', label: 'Kategori', type: 'text' },
        { key: 'excerpt', label: 'Ringkasan (tampil di list)', type: 'textarea' },
        { key: 'image', label: 'URL Gambar Utama', type: 'text' },
        { key: 'secondaryImage', label: 'URL Gambar Kedua (di dalam artikel)', type: 'text' },
        { key: 'hasVideo', label: 'Punya video? (ketik: ya / tidak)', type: 'text' },
        { key: 'video', label: 'URL Video (jika hasVideo = ya)', type: 'text' },
        { key: 'author', label: 'Penulis', type: 'text' },
        { key: 'date', label: 'Tanggal', type: 'text' },
        { key: 'readTime', label: 'Estimasi Waktu Baca', type: 'text' },
        { key: 'intro', label: 'Paragraf Pembuka', type: 'textarea' },
        { key: 'body1', label: 'Isi Paragraf 1', type: 'textarea' },
        { key: 'body2', label: 'Isi Paragraf 2', type: 'textarea' },
        { key: 'listTitle', label: 'Judul Daftar Poin', type: 'text' },
        { key: 'listItemsText', label: 'Daftar Poin (1 poin per baris)', type: 'textarea' },
        { key: 'closing', label: 'Paragraf Penutup', type: 'textarea' },
        { key: 'tagsText', label: 'Tags (pisahkan dengan koma)', type: 'text' }
    ];

    const valueFor = (f) => {
        if (f.key === 'listItemsText') return (post.listItems || []).join('\n');
        if (f.key === 'tagsText') return (post.tags || []).join(', ');
        if (f.key === 'hasVideo') return post.hasVideo ? 'ya' : 'tidak';
        return post[f.key] !== undefined ? post[f.key] : '';
    };

    const fieldsHtml = fields.map(f => `
        <div>
            <label class="block text-[10px] font-bold text-slate-600 mb-1">${f.label}</label>
            ${f.type === 'textarea'
                ? `<textarea data-key="${f.key}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue" rows="3">${cmsEsc(valueFor(f))}</textarea>`
                : `<input type="text" data-key="${f.key}" value="${cmsEsc(valueFor(f))}" class="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue">`
            }
        </div>
    `).join('');

    const content = document.getElementById('adminPanelContent');
    content.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">${isNew ? 'Tambah Artikel Baru' : 'Edit Artikel'}</h4>
                <button onclick="closeAdminPanel()" class="text-[10px] text-slate-500 hover:underline">Tutup</button>
            </div>
            <form onsubmit="cmsSaveBlogForm(event, ${post.id})" class="space-y-2.5">
                ${fieldsHtml}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors">
                    Simpan Artikel
                </button>
            </form>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function cmsSaveBlogForm(e, id) {
    e.preventDefault();
    const form = e.target;
    const list = SITE_DATA.blogPosts || (SITE_DATA.blogPosts = []);
    let index = list.findIndex(p => p.id === id);
    let post;
    if (index === -1) {
        post = { id };
        list.push(post);
        index = list.length - 1;
    } else {
        post = list[index];
    }

    form.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        const val = el.value;
        if (key === 'listItemsText') {
            post.listItems = val.split('\n').map(s => s.trim()).filter(Boolean);
        } else if (key === 'tagsText') {
            post.tags = val.split(',').map(s => s.trim()).filter(Boolean);
        } else if (key === 'hasVideo') {
            post.hasVideo = /^(y|ya|yes|true|1)$/i.test(val.trim());
        } else {
            post[key] = val;
        }
    });

    list[index] = post;
    SITE_DATA.blogPosts = list;

    try {
        await cmsPersist();
        cmsToast('Artikel berhasil disimpan ke server!');
        if (typeof renderBlogChips === 'function') renderBlogChips();
        if (typeof filterBlogPosts === 'function') filterBlogPosts();
        if (typeof renderBlogAdminBar === 'function') renderBlogAdminBar();
        closeAdminPanel();
    } catch (err) {
        cmsToast('Gagal menyimpan artikel: ' + err.message, true);
    }
}

async function cmsDeleteBlogPost(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    const list = SITE_DATA.blogPosts || [];
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return;
    list.splice(index, 1);
    SITE_DATA.blogPosts = list;
    try {
        await cmsPersist();
        cmsToast('Artikel berhasil dihapus.');
    } catch (err) {
        cmsToast('Gagal menghapus artikel: ' + err.message, true);
    }
    if (typeof filterBlogPosts === 'function') filterBlogPosts();
    if (typeof renderBlogAdminBar === 'function') renderBlogAdminBar();
}

// ==========================================================
// EXTENDED CMS: ALL REMAINING CONTENT + ORDERING
// ==========================================================
async function cmsMoveListItem(schemaKey,index,direction){
    const schema=CMS_SCHEMA[schemaKey]; if(!schema) return;
    const list=cmsGetValueByPath(SITE_DATA,schema.path);
    if(!Array.isArray(list)) return;
    const to=index+direction; if(index<0||to<0||to>=list.length) return;
    [list[index],list[to]]=[list[to],list[index]];
    try{ await cmsPersist(); if(schema.onSave) schema.onSave(); renderAdminPanelContent(schemaKey); cmsToast('Urutan berhasil diubah.'); }
    catch(e){ cmsToast('Gagal menyimpan: '+e.message,true); }
}
function cmsRenderJsonObjectEditor(container,schemaKey,title){
    const schema=CMS_SCHEMA[schemaKey], data=cmsGetValueByPath(SITE_DATA,schema.path)||{};
    container.innerHTML=`<div class="space-y-3">
      <div class="flex items-center justify-between border-b pb-1.5"><h4 class="font-bold text-xs">${cmsEsc(title)}</h4></div>
      <p class="text-[9px] text-slate-400">Editor JSON untuk field bersarang. Jangan ubah nama field kecuali Anda memahami strukturnya.</p>
      <textarea id="cmsJsonEditor" class="w-full min-h-[360px] p-2.5 border border-slate-200 rounded-xl font-mono text-[10px] leading-relaxed focus:outline-none focus:border-brand-blue">${cmsEsc(JSON.stringify(data,null,2))}</textarea>
      <button onclick="cmsSaveJsonObject('${schemaKey}')" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl">Simpan JSON</button>
    </div>`;
}
async function cmsSaveJsonObject(schemaKey){
    const schema=CMS_SCHEMA[schemaKey], el=document.getElementById('cmsJsonEditor'); if(!el) return;
    try{ const parsed=JSON.parse(el.value); cmsSetValueByPath(SITE_DATA,schema.path,parsed); await cmsPersist(); if(schema.onSave) schema.onSave(); renderAdminPanelContent(schemaKey); cmsToast('Data berhasil disimpan.'); }
    catch(e){ cmsToast('JSON tidak valid / gagal simpan: '+e.message,true); }
}
function cmsRenderPricelistAdmin(container){
    const p=SITE_DATA.pricelist||{tabs:[],categories:{}};
    const tabs=p.tabs||[]; const selected=window.cmsAdminPriceCat && p.categories?.[window.cmsAdminPriceCat] ? window.cmsAdminPriceCat : (tabs[0]?.key||'');
    window.cmsAdminPriceCat=selected;
    const items=p.categories?.[selected]||[];
    container.innerHTML=`<div class="space-y-3">
      <div class="flex items-center justify-between border-b pb-1.5"><h4 class="font-bold text-xs">Pricelist & Kategori</h4>
      <button onclick="cmsAddPriceTab()" class="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">+ Kategori</button></div>
      <div class="space-y-1">${tabs.map((t,i)=>`<div class="flex gap-1 items-center"><button onclick="cmsSelectPriceCat('${cmsEscJs(t.key)}')" class="flex-1 text-left px-2 py-1.5 rounded-lg ${t.key===selected?'bg-brand-blue text-white':'bg-slate-100 text-slate-700'} text-[10px] font-bold">${cmsEsc(t.label)}</button>
      <button onclick="cmsEditPriceTab(${i})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[9px]">Edit</button>
      <button onclick="cmsDeletePriceTab(${i})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[9px]">Hapus</button>
      </div>`).join('')}</div>
      <div class="flex items-center justify-between pt-2 border-t"><span class="text-[10px] font-bold text-slate-700">Item: ${cmsEsc(selected||'')}</span>
      <button onclick="cmsAddPriceItem()" class="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">+ Tambah Item</button></div>
      <div class="space-y-1.5">${items.map((it,i)=>`<div class="p-2 bg-slate-50 border rounded-xl flex items-center gap-2"><div class="min-w-0 flex-1"><b class="text-[10px]">${cmsEsc(it.name)}</b><div class="text-[9px] text-slate-500">${cmsEsc(it.price)} • ${cmsEsc(it.tag||'')}</div></div>
      <button onclick="cmsEditPriceItem(${i})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[9px]">Edit</button><button onclick="cmsDeletePriceItem(${i})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[9px]">Hapus</button>
      <button onclick="cmsMovePriceItem(${i},-1)" class="px-1.5 py-1 bg-slate-200 rounded-lg text-[9px]">↑</button><button onclick="cmsMovePriceItem(${i},1)" class="px-1.5 py-1 bg-slate-200 rounded-lg text-[9px]">↓</button></div>`).join('')}</div>
    </div>`;
}
async function cmsSelectPriceCat(key){ window.cmsAdminPriceCat=key; renderAdminPanelContent('pricelist'); }
async function cmsAddPriceTab(){
    const key=prompt('Key kategori (contoh: paket-baru):'); if(!key) return;
    const label=prompt('Nama kategori:')||key;
    const p=SITE_DATA.pricelist; if(p.tabs.some(t=>t.key===key)) return cmsToast('Key sudah ada.',true);
    p.tabs.push({key,label}); p.categories[key]=[]; window.cmsAdminPriceCat=key;
    await cmsPersist(); renderPricelistTabs(); renderPricelistCategory(key); renderAdminPanelContent('pricelist'); cmsToast('Kategori ditambahkan.');
}
async function cmsEditPriceTab(i){
    const p=SITE_DATA.pricelist, t=p.tabs[i]; if(!t) return;
    const label=prompt('Nama kategori:',t.label); if(label===null) return;
    t.label=label; await cmsPersist(); renderPricelistTabs(); renderAdminPanelContent('pricelist');
}
async function cmsDeletePriceTab(i){
    const p=SITE_DATA.pricelist; if(p.tabs.length<=1) return cmsToast('Minimal satu kategori.',true);
    const t=p.tabs[i]; if(!t||!confirm('Hapus kategori dan semua item di dalamnya?')) return;
    p.tabs.splice(i,1); delete p.categories[t.key]; window.cmsAdminPriceCat=p.tabs[0].key;
    await cmsPersist(); renderPricelistTabs(); renderPricelistCategory(window.cmsAdminPriceCat); renderAdminPanelContent('pricelist');
}
function cmsPricePrompt(item){
    const name=prompt('Nama layanan:',item?.name||''); if(name===null) return null;
    const price=prompt('Harga:',item?.price||''); if(price===null) return null;
    const tag=prompt('Tag:',item?.tag||''); if(tag===null) return null;
    const popular=confirm('Tandai sebagai populer?'); return {name,price,tag,popular};
}
async function cmsAddPriceItem(){ const p=SITE_DATA.pricelist, key=window.cmsAdminPriceCat; if(!key)return;
    const x=cmsPricePrompt(); if(!x)return; p.categories[key].push(x); await cmsPersist(); renderPricelistCategory(key); renderAdminPanelContent('pricelist'); }
async function cmsEditPriceItem(i){ const p=SITE_DATA.pricelist,key=window.cmsAdminPriceCat,x=p.categories[key][i]; const y=cmsPricePrompt(x); if(!y)return; p.categories[key][i]=y; await cmsPersist(); renderPricelistCategory(key); renderAdminPanelContent('pricelist'); }
async function cmsDeletePriceItem(i){ const p=SITE_DATA.pricelist,key=window.cmsAdminPriceCat; if(!confirm('Hapus item ini?'))return; p.categories[key].splice(i,1); await cmsPersist(); renderPricelistCategory(key); renderAdminPanelContent('pricelist'); }
async function cmsMovePriceItem(i,d){ const a=SITE_DATA.pricelist.categories[window.cmsAdminPriceCat],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];await cmsPersist();renderPricelistCategory(window.cmsAdminPriceCat);renderAdminPanelContent('pricelist');}

function cmsRenderAdmins(container){
    const admins=cmsGetAdmins();
    container.innerHTML=`<div class="space-y-3"><div class="flex justify-between border-b pb-1.5"><h4 class="font-bold text-xs">Admin Website</h4><button onclick="cmsAdminForm()" class="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">+ Tambah Admin</button></div>
    <p class="text-[9px] text-slate-400">Awalnya hanya 1 admin. Tambah admin jika diperlukan. Password disimpan sebagai SHA-256.</p>
    <div class="space-y-1.5">${admins.map(a=>`<div class="p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between gap-2"><span class="text-[10px] font-bold">${cmsEsc(a.username)} ${cmsCurrentAdmin()?.id===a.id?'(aktif)':''}</span><span class="flex gap-1"><button onclick="cmsAdminForm(${a.id})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[9px]">Edit</button><button onclick="cmsDeleteAdminUI(${a.id})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[9px]">Hapus</button></span></div>`).join('')}</div></div>`;
}
function cmsAdminForm(id){
    const a=cmsGetAdmins().find(x=>x.id===id)||{id:null,username:''};
    const u=prompt('Username:',a.username||''); if(u===null)return;
    const pw=prompt(id?'Password baru (kosong = tetap):':'Password:',id?'':''); if(pw===null)return;
    (async()=>{try{if(id)await cmsAdminUpdate(id,u,pw);else await cmsAdminCreate(u,pw);renderAdminPanelContent('admins');cmsToast('Admin tersimpan.');}catch(e){cmsToast(e.message,true);}})();
}
async function cmsDeleteAdminUI(id){try{await cmsAdminDelete(id);renderAdminPanelContent('admins');cmsToast('Admin dihapus.');}catch(e){cmsToast(e.message,true);}}

Object.assign(CMS_SCHEMA,{
    search:{label:'Area Pencarian',icon:'search',type:'object',path:['search'],fields:[
        {key:'placeholder',label:'Placeholder Pencarian',type:'text'}],onSave:()=>{}},
    meta:{label:'Kontak & Konfigurasi Situs',icon:'phone',type:'object',path:['meta'],fields:[
        {key:'adminPhone',label:'Nomor WhatsApp Admin',type:'text'}],onSave:()=>{}},
    aboutUs:{label:'About Us',icon:'info',type:'custom',path:['aboutUs'],render:c=>cmsRenderJsonObjectEditor(c,'aboutUs','About Us')},
    disclaimer:{label:'Disclaimer',icon:'shield-alert',type:'custom',path:['disclaimer'],render:c=>cmsRenderJsonObjectEditor(c,'disclaimer','Disclaimer')},
    footer:{label:'Footer & Sosial Media',icon:'panel-bottom',type:'custom',path:['footer'],render:c=>cmsRenderJsonObjectEditor(c,'footer','Footer & Sosial Media')},
    bottomNav:{label:'Navigasi Bawah',icon:'navigation',type:'list',path:['bottomNav'],itemLabel:i=>i.label||'(kosong)',fields:[
        {key:'label',label:'Label',type:'text'},{key:'icon',label:'Ikon Lucide',type:'text'},{key:'actionType',label:'Tipe Aksi (scroll/modal/url/whatsapp)',type:'text'},{key:'target',label:'Target',type:'text'},{key:'active',label:'Aktif (true/false)',type:'text'}],
        emptyItem:()=>({label:'Menu Baru',icon:'circle',actionType:'scroll',target:'#beranda',active:false}),onSave:renderBottomNav},
    pricelist:{label:'Pricelist / Harga',icon:'badge-dollar-sign',type:'custom',path:['pricelist'],render:cmsRenderPricelistAdmin},
    calculatorOptions:{label:'Kalkulator Joki',icon:'calculator',type:'list',path:['calculator','rankOptions'],itemLabel:i=>`${i.name||'(kosong)'} - Rp ${Number(i.price||0).toLocaleString('id-ID')}`,fields:[
        {key:'name',label:'Nama Rank',type:'text'},{key:'price',label:'Harga per Bintang (angka)',type:'text'},{key:'label',label:'Label Harga',type:'text'}],
        emptyItem:()=>({name:'Rank Baru',price:0,label:'Rp 0 / bintang'}),onSave:()=>{if(typeof renderCalculatorOptions==='function')renderCalculatorOptions();}},
    blogPosts:{label:'Blog Posts & Detail',icon:'newspaper',type:'custom',path:['blogPosts'],render:c=>cmsRenderBlogAdmin(c)},
    admins:{label:'Manajemen Admin',icon:'users',type:'custom',path:['admins'],render:cmsRenderAdmins}
});

function cmsRenderBlogAdmin(container){
 const posts=SITE_DATA.blogPosts||[];
 container.innerHTML=`<div class="space-y-3"><div class="flex items-center justify-between border-b pb-1.5"><h4 class="font-bold text-xs">Blog Posts & Detail</h4><button onclick="cmsOpenBlogForm(null)" class="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">+ Artikel</button></div>
 <p class="text-[9px] text-slate-400">Form artikel mendukung konten detail, gambar, video, daftar poin dan tags.</p>
 <div class="space-y-1.5 max-h-[60vh] overflow-y-auto">${posts.map((p,i)=>`<div class="p-2.5 bg-slate-50 border rounded-xl flex gap-2 items-center"><div class="flex-1 min-w-0"><b class="text-[10px] line-clamp-2">${cmsEsc(p.title)}</b><div class="text-[9px] text-slate-400">${cmsEsc(p.category)} • ${cmsEsc(p.date)}</div></div><button onclick="cmsOpenBlogForm(${p.id})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[9px]">Edit</button><button onclick="cmsDeleteBlogPost(${p.id})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[9px]">Hapus</button><button onclick="cmsMoveListItem('blogPosts',${i},-1)" class="px-1.5 py-1 bg-slate-200 rounded-lg text-[9px]">↑</button><button onclick="cmsMoveListItem('blogPosts',${i},1)" class="px-1.5 py-1 bg-slate-200 rounded-lg text-[9px]">↓</button></div>`).join('')}</div></div>`;
 if(window.lucide)lucide.createIcons();
}

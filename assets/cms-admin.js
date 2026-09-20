// ==========================================================
// ROOKIE JOKI - CMS ADMIN PANEL & CRUD ENGINE
// ==========================================================
// Semua aksi CRUD di file ini berujung ke cmsSaveAndSync(), yang
// memanggil cmsPersist() (assets/cms-store.js) - artinya SETIAP
// perubahan langsung di-commit ke data.json di repository GitHub
// (lewat GitHub Contents API), lalu tampilan publik yang relevan
// langsung di-refresh. Tidak ada penyimpanan ke localStorage.
//
// Form dibangun oleh mesin form di assets/cms-upload.js, termasuk
// upload gambar/video (klik atau drag & drop dari Local Drive).
// File media di-commit ke folder  uploads/<jenis>/  di repository.
// Bukti transaksi (pratinjau, print, barcode, TTD): assets/cms-invoice.js
// ==========================================================

/** Saran ikon Lucide (v1.x). Catatan: ikon merek (instagram, facebook, dst) tidak ada di Lucide v1. */
const CMS_ICON_SUGGEST = ['zap', 'shield-check', 'lock-keyhole', 'badge-check', 'users', 'star', 'clock', 'heart', 'trophy', 'headphones',
    'message-circle', 'message-square', 'phone', 'mail', 'globe', 'link', 'send', 'music-2', 'at-sign', 'camera', 'x', 'video', 'share-2',
    'gamepad-2', 'rocket', 'info', 'shield', 'shield-alert', 'badge-x', 'triangle-alert', 'circle-check', 'file-text', 'scale', 'ban',
    'handshake', 'wallet', 'clipboard-check', 'store', 'map-pin', 'megaphone', 'sparkles', 'crown', 'gem', 'flame', 'swords', 'medal', 'award', 'thumbs-up'];
const CMS_ICON_HELP = 'Nama ikon Lucide (mis. zap, shield-check). Ikon merek seperti instagram/facebook tidak tersedia — pakai camera, message-square, music-2, at-sign, dll.';
const CMS_BADGE_COLORS = ['bg-brand-blue', 'bg-amber-500', 'bg-emerald-600', 'bg-rose-600', 'bg-violet-600', 'bg-slate-800'];
const CMS_PAY_METHOD_SUGGEST = ['QRIS', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'SPayLater', 'Transfer BCA', 'Transfer Mandiri', 'Transfer Bank Lainnya', 'Tunai'];
function cmsToday() { return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }

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
            { key: 'image', label: 'Gambar Banner', type: 'image', spec: 'banner' },
            { key: 'badgeText', label: 'Teks Badge', type: 'text' },
            { key: 'badgeColor', label: 'Warna Badge (kelas Tailwind)', type: 'text', suggest: CMS_BADGE_COLORS },
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
            { key: 'image', label: 'Gambar Portofolio', type: 'image', spec: 'portfolio' },
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
            { key: 'rating', label: 'Rating (1-5)', type: 'number' },
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
            { key: 'rank', label: 'Rank', type: 'number' },
            { key: 'name', label: 'Nama Worker', type: 'text' },
            { key: 'wr', label: 'Winrate (%)', type: 'number' },
            { key: 'match', label: 'Jumlah Match', type: 'number' },
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
            { key: 'id', label: 'ID Transaksi (juga jadi isi Barcode)', type: 'text' },
            { key: 'date', label: 'Tanggal Transaksi', type: 'text' },
            { key: 'customer', label: 'Nama Pelanggan', type: 'text' },
            { key: 'phone', label: 'No. WhatsApp', type: 'text' },
            { key: 'service', label: 'Layanan Dipesan', type: 'text' },
            { key: 'worker', label: 'Worker Assigned', type: 'text' },
            { key: 'status', label: 'Status Pesanan', type: 'select', options: ['Pending', 'On Process', 'Done', 'Dibatalkan'] },
            { key: 'progress', label: 'Progres', type: 'text' },
            { key: 'amount', label: 'Total Pembayaran (Rp)', type: 'text', placeholder: 'mis. 150000', help: 'Hanya untuk Bukti Transaksi (tidak tampil di Cek Status publik).' },
            { key: 'paymentMethod', label: 'Metode Pembayaran', type: 'text', suggest: CMS_PAY_METHOD_SUGGEST },
            { key: 'note', label: 'Catatan (opsional)', type: 'textarea', rows: 2 }
        ],
        emptyItem: () => ({ id: `RK-${Date.now().toString().slice(-4)}`, date: cmsToday(), customer: '', phone: '', service: 'Joki Rank', worker: '-', status: 'Pending', progress: 'Menunggu Worker', amount: '', paymentMethod: '', note: '' }),
        // Tombol tambahan di setiap baris daftar pesanan
        rowActions: (item, index) => `
            <button onclick="cmsInvoiceFromList(${index}, false)" class="px-2 py-1 bg-sky-600 text-white rounded-lg text-[10px] font-bold hover:bg-sky-700">Pratinjau</button>
            <button onclick="cmsInvoiceFromList(${index}, true)" class="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900">Print</button>`,
        // Tombol tambahan di form edit (memakai isi form saat ini)
        formActions: () => `
            <div class="grid grid-cols-2 gap-1.5">
                <button type="button" onclick="cmsInvoiceFromForm(this, false)" class="py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700">Pratinjau Transaksi</button>
                <button type="button" onclick="cmsInvoiceFromForm(this, true)" class="py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Print Transaksi</button>
            </div>
            <p class="text-[9px] text-slate-400 text-center -mt-1">Pratinjau/Print memakai isi form saat ini, lengkap dengan barcode ID &amp; tanda tangan admin.</p>`,
        onSave: () => {}
    },
    invoice: {
        label: 'Bukti Transaksi & TTD',
        icon: 'file-signature',
        type: 'object',
        path: ['invoice'],
        intro: 'Data ini dipakai pada Pratinjau/Print Transaksi di menu Status Pesanan Joki. Barcode otomatis berisi ID Transaksi.',
        fields: [
            { key: 'businessName', label: 'Nama Usaha (kop bukti)', type: 'text' },
            { key: 'businessTagline', label: 'Tagline / Alamat Singkat', type: 'text' },
            { section: 'Tanda Tangan Sah Admin', sectionHelp: 'Tanda tangan dicetak di bagian kanan bawah Bukti Transaksi.', key: 'signerName', label: 'Nama Penandatangan', type: 'text' },
            { key: 'signerTitle', label: 'Jabatan', type: 'text' },
            { key: 'signatureImage', label: 'Gambar Tanda Tangan', type: 'signature', help: 'Perhatian: file tanda tangan disimpan di repository GitHub Pages sehingga bisa diakses publik lewat URL-nya. Jangan unggah TTD yang dipakai untuk dokumen bank/hukum.' },
            { section: 'Teks Bawah', key: 'terms', label: 'Syarat / Keterangan di Bukti', type: 'textarea', rows: 3 },
            { key: 'footerNote', label: 'Catatan Kaki (opsional)', type: 'text' }
        ],
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
            { key: 'qrImageUrl', label: 'Gambar QRIS', type: 'image', spec: 'qris' },
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

function cmsAfterFormRender(container) {
    container.querySelectorAll('.cms-rep').forEach(cmsRepRenumber);
    if (window.lucide) lucide.createIcons();
    container.scrollTop = 0;
}

function renderObjectEditor(container, schema, data, schemaKey) {
    data = data || {};
    window.cmsEditCtx = { schemaKey, index: null, base: data, isNew: false };
    container.innerHTML = `
        <div class="space-y-3">
            <h4 class="font-bold text-xs text-slate-900 border-b pb-1.5">${cmsEsc(schema.label)}</h4>
            ${schema.intro ? `<p class="text-[10px] text-slate-500 leading-relaxed">${cmsEsc(schema.intro)}</p>` : ''}
            <form onsubmit="saveObjectForm(event, '${schemaKey}')" class="space-y-2.5">
                ${cmsFormFieldsHtml(schema.fields, data)}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors disabled:opacity-60">
                    Simpan Perubahan
                </button>
            </form>
        </div>
    `;
    cmsAfterFormRender(container);
}

function renderListEditor(container, schema, list, schemaKey) {
    let itemsHtml = list.map((item, index) => `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            <span class="text-xs font-medium text-slate-800 truncate min-w-0 flex-1 basis-32">${cmsEsc(schema.itemLabel(item))}</span>
            <div class="flex flex-wrap items-center gap-1 ${schema.rowActions ? 'basis-full' : 'shrink-0'}">
                <button onclick="cmsMoveListItem('${schemaKey}', ${index}, -1)" title="Naik" class="px-1.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">↑</button>
                <button onclick="cmsMoveListItem('${schemaKey}', ${index}, 1)" title="Turun" class="px-1.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">↓</button>
                ${schema.rowActions ? schema.rowActions(item, index) : ''}
                <button onclick="editListItem('${schemaKey}', ${index})" class="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600">Edit</button>
                <button onclick="deleteListItem('${schemaKey}', ${index})" class="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700">Hapus</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">${cmsEsc(schema.label)}</h4>
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
    await cmsRunSave(form, async (setStatus) => {
        try { await cmsFlushUploads(form, setStatus); }
        catch (err) { cmsToast('Gagal mengunggah file: ' + err.message, true); return; }
        setStatus('Menyimpan…');
        const targetObj = cmsGetValueByPath(SITE_DATA, schema.path) || {};
        const backup = JSON.parse(JSON.stringify(targetObj));
        cmsApplyValues(targetObj, cmsCollectForm(form));
        cmsSetValueByPath(SITE_DATA, schema.path, targetObj);
        const ok = await cmsSaveAndSync(schemaKey);
        if (!ok) cmsSetValueByPath(SITE_DATA, schema.path, backup);
    });
}

/** Buka form "tambah data". Item baru baru masuk ke daftar saat tombol Simpan ditekan
 *  (kalau dibatalkan, tidak ada data kosong yang tertinggal). */
function addListItem(schemaKey) {
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];
    editListItem(schemaKey, list.length, schema.emptyItem());
}

function editListItem(schemaKey, index, draft) {
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const list = cmsGetValueByPath(SITE_DATA, schema.path) || [];
    const isNew = index >= list.length;
    const item = isNew ? (draft || schema.emptyItem()) : list[index];
    const content = document.getElementById('adminPanelContent');
    if (!item || !content) return;
    window.cmsEditCtx = { schemaKey, index, base: item, isNew };

    content.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">${isNew ? 'Tambah Data Baru' : 'Edit Item #' + (index + 1)}</h4>
                <button onclick="renderAdminPanelContent('${schemaKey}')" class="text-[10px] text-slate-500 hover:underline">Kembali</button>
            </div>
            <form onsubmit="saveListItemForm(event, '${schemaKey}', ${index})" class="space-y-2.5">
                ${cmsFormFieldsHtml(schema.fields, item)}
                ${schema.formActions ? schema.formActions(item, index) : ''}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors disabled:opacity-60">
                    Simpan Item
                </button>
            </form>
        </div>
    `;
    cmsAfterFormRender(content);
}

async function saveListItemForm(e, schemaKey, index) {
    e.preventDefault();
    const schema = CMS_SCHEMA[schemaKey];
    if (!schema) return;
    const form = e.target;
    await cmsRunSave(form, async (setStatus) => {
        try { await cmsFlushUploads(form, setStatus); }
        catch (err) { cmsToast('Gagal mengunggah file: ' + err.message, true); return; }
        setStatus('Menyimpan…');
        let list = cmsGetValueByPath(SITE_DATA, schema.path);
        if (!Array.isArray(list)) { list = []; cmsSetValueByPath(SITE_DATA, schema.path, list); }
        const vals = cmsCollectForm(form);
        const ctx = window.cmsEditCtx || {};
        const isNew = index >= list.length;
        let backup = null;
        if (isNew) {
            list.push(cmsApplyValues(Object.assign({}, ctx.base || schema.emptyItem()), vals));
        } else {
            backup = JSON.parse(JSON.stringify(list[index]));
            cmsApplyValues(list[index], vals);
        }
        const ok = await cmsSaveAndSync(schemaKey);
        if (!ok) { if (isNew) list.pop(); else list[index] = backup; }
    });
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
        cmsToast('Data berhasil disimpan ke GitHub (data.json)!');

        const schema = CMS_SCHEMA[schemaKey];
        if (schema && typeof schema.onSave === 'function') schema.onSave();

        const panel = document.getElementById('adminPanelModal');
        if (panel && panel.classList.contains('modal-active')) {
            cmsActiveSection = schemaKey;
            renderAdminPanelSidebar();
            renderAdminPanelContent(schemaKey);
        }
        if (window.lucide) lucide.createIcons();
        return true;
    } catch (err) {
        cmsToast('Gagal menyimpan: ' + err.message, true);
        return false;
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
// list/array seperti listItems & tags). Gambar & video bisa
// diunggah dari Local Drive (klik / drag & drop).
// ----------------------------------------------------------
function cmsBlogFormFields() {
    const cats = Array.from(new Set([
        ...Object.keys(SITE_DATA.categoryColors || {}),
        ...(SITE_DATA.blogPosts || []).map(p => p.category).filter(Boolean)
    ]));
    return [
        { key: 'title', label: 'Judul Artikel', type: 'text' },
        { key: 'category', label: 'Kategori', type: 'text', suggest: cats },
        { key: 'excerpt', label: 'Ringkasan (tampil di list)', type: 'textarea' },
        { section: 'Gambar & Video', sectionHelp: 'Klik kotak unggah atau tarik file dari komputer.', key: 'image', label: 'Gambar Utama', type: 'image', spec: 'blogMain' },
        { key: 'secondaryImage', label: 'Gambar Kedua (di dalam artikel)', type: 'image', spec: 'blogSecond' },
        { key: 'video', label: 'Video Artikel (opsional)', type: 'video', spec: 'blogVideo', help: 'Jika video diisi, artikel menampilkan pemutar video (Gambar Kedua menjadi poster). Kosongkan untuk artikel tanpa video.' },
        { section: 'Informasi Artikel', key: 'author', label: 'Penulis', type: 'text' },
        { key: 'date', label: 'Tanggal', type: 'text' },
        { key: 'readTime', label: 'Estimasi Waktu Baca', type: 'text' },
        { section: 'Isi Artikel', key: 'intro', label: 'Paragraf Pembuka', type: 'textarea' },
        { key: 'body1', label: 'Isi Paragraf 1', type: 'textarea' },
        { key: 'body2', label: 'Isi Paragraf 2', type: 'textarea' },
        { key: 'listTitle', label: 'Judul Daftar Poin', type: 'text' },
        { key: 'listItems', label: 'Daftar Poin (1 poin per baris)', type: 'lines' },
        { key: 'closing', label: 'Paragraf Penutup', type: 'textarea' },
        { key: 'tags', label: 'Tags (pisahkan dengan koma)', type: 'tags' }
    ];
}

function cmsOpenBlogForm(id) {
    if (!cmsIsLoggedIn()) { openAdminLoginModal(); return; }
    const isNew = (id === null || id === undefined);
    const list = SITE_DATA.blogPosts || (SITE_DATA.blogPosts = []);
    const index = isNew ? -1 : list.findIndex(p => p.id === id);
    if (!isNew && index === -1) { cmsToast('Artikel tidak ditemukan.', true); return; }
    const maxId = list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
    const nextId = Math.max(Number(SITE_DATA.blogNextId) || 1, maxId + 1);
    const post = !isNew ? list[index] : {
        id: nextId,
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

    const panel = document.getElementById('adminPanelModal');
    const fromPanel = panel.classList.contains('modal-active');
    panel.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    cmsActiveSection = 'blogPosts';
    renderAdminPanelSidebar();
    window.cmsEditCtx = { schemaKey: 'blogPosts', index, base: post, isNew, fromPanel };

    const content = document.getElementById('adminPanelContent');
    content.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between border-b pb-1.5">
                <h4 class="font-bold text-xs text-slate-900">${isNew ? 'Tambah Artikel Baru' : 'Edit Artikel'}</h4>
                <button onclick="${fromPanel ? "renderAdminPanelContent('blogPosts')" : 'closeAdminPanel()'}" class="text-[10px] text-slate-500 hover:underline">${fromPanel ? 'Kembali' : 'Tutup'}</button>
            </div>
            <form onsubmit="cmsSaveBlogForm(event, ${post.id})" class="space-y-2.5">
                ${cmsFormFieldsHtml(cmsBlogFormFields(), post)}
                <button type="submit" class="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-darkblue transition-colors disabled:opacity-60">
                    Simpan Artikel
                </button>
            </form>
        </div>
    `;
    cmsAfterFormRender(content);
}

async function cmsSaveBlogForm(e, id) {
    e.preventDefault();
    const form = e.target;
    await cmsRunSave(form, async (setStatus) => {
        try { await cmsFlushUploads(form, setStatus); }
        catch (err) { cmsToast('Gagal mengunggah file: ' + err.message, true); return; }
        setStatus('Menyimpan…');
        const ctx = window.cmsEditCtx || {};
        const list = SITE_DATA.blogPosts || (SITE_DATA.blogPosts = []);
        const index = list.findIndex(p => p.id === id);
        const isNew = index === -1;
        const prevNextId = SITE_DATA.blogNextId;
        const backup = isNew ? null : JSON.parse(JSON.stringify(list[index]));
        const vals = cmsCollectForm(form);
        const post = isNew ? Object.assign({}, ctx.base || { id }) : list[index];
        cmsApplyValues(post, vals);
        post.id = id;
        post.hasVideo = !!(post.video && String(post.video).trim());   // pemutar video tampil bila video diisi
        if (isNew) {
            list.push(post);
            SITE_DATA.blogNextId = Math.max(Number(SITE_DATA.blogNextId) || 1, id + 1);
        }
        try {
            await cmsPersist();
            cmsToast('Artikel berhasil disimpan ke GitHub!');
            if (typeof renderBlogChips === 'function') renderBlogChips();
            if (typeof filterBlogPosts === 'function') filterBlogPosts();
            if (typeof renderBlogAdminBar === 'function') renderBlogAdminBar();
            if (ctx.fromPanel) renderAdminPanelContent('blogPosts'); else closeAdminPanel();
        } catch (err) {
            cmsToast('Gagal menyimpan artikel: ' + err.message, true);
            if (isNew) { list.pop(); SITE_DATA.blogNextId = prevNextId; } else list[index] = backup;
        }
    });
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
    aboutUs:{
        label:'About Us', icon:'info', type:'object', path:['aboutUs'],
        intro:'Isi jendela "About Us". Tidak perlu mengedit JSON — cukup isi form di bawah. Gambar/Video opsional tampil di bawah kartu biru pengantar.',
        fields:[
            {key:'badgeText',label:'Teks Badge (kartu biru)',type:'text'},
            {key:'subtitle',label:'Subjudul Jendela',type:'text'},
            {key:'heroTitle',label:'Judul Utama',type:'text'},
            {key:'heroText',label:'Teks Pengantar',type:'textarea',rows:4},
            {section:'Gambar / Video About Us',sectionHelp:'Opsional. Kosongkan jika tidak ingin menampilkan media.',key:'media',label:'Unggah Gambar atau Video',type:'media',folder:'about'},
            {section:'Siapa Kami',key:'sectionTitle',label:'Judul Bagian',type:'text'},
            {key:'paragraph1',label:'Paragraf 1',type:'textarea',rows:5},
            {key:'paragraph2',label:'Paragraf 2',type:'textarea',rows:4},
            {section:'Komitmen Kami',key:'commitments',label:'Daftar Komitmen',type:'repeater',itemName:'Komitmen',addLabel:'Tambah Komitmen',
                fields:[{key:'icon',label:'Ikon Lucide',type:'text',suggest:CMS_ICON_SUGGEST},{key:'title',label:'Judul',type:'text'},{key:'desc',label:'Deskripsi',type:'textarea',rows:2}],
                empty:()=>({icon:'zap',title:'',desc:''}),help:CMS_ICON_HELP},
            {section:'Informasi Singkat',key:'quickInfo',label:'Daftar Informasi',type:'repeater',itemName:'Info',addLabel:'Tambah Informasi',
                fields:[{key:'label',label:'Label',type:'text'},{key:'value',label:'Isi',type:'text'}],empty:()=>({label:'',value:''})},
            {section:'Ajakan (kotak biru bawah)',key:'ctaTitle',label:'Judul Ajakan',type:'text'},
            {key:'ctaText',label:'Teks Ajakan',type:'textarea',rows:2}
        ],
        onSave:()=>{ if(typeof renderAboutUs==='function') renderAboutUs(); }},
    disclaimer:{
        label:'Disclaimer', icon:'shield-alert', type:'object', path:['disclaimer'],
        intro:'Isi jendela "Disclaimer". Semua bagian bisa ditambah, dihapus, dan diurutkan dengan tombol ↑ ↓.',
        fields:[
            {key:'intro',label:'Kalimat Pembuka (kotak kuning)',type:'textarea',rows:3},
            {section:'Gambar / Video Disclaimer',sectionHelp:'Opsional. Tampil di bawah kalimat pembuka.',key:'media',label:'Unggah Gambar atau Video',type:'media',folder:'disclaimer'},
            {section:'Bagian Ketentuan',key:'sections',label:'Daftar Ketentuan',type:'repeater',itemName:'Ketentuan',addLabel:'Tambah Ketentuan',
                fields:[{key:'icon',label:'Ikon Lucide',type:'text',suggest:CMS_ICON_SUGGEST},{key:'title',label:'Judul',type:'text'},{key:'text',label:'Isi Ketentuan',type:'textarea',rows:4}],
                empty:()=>({icon:'shield',title:'',text:''}),help:CMS_ICON_HELP},
            {section:'Ringkasan Kebijakan',key:'policySummary',label:'Daftar Ringkasan',type:'repeater',itemName:'Ringkasan',addLabel:'Tambah Ringkasan',
                fields:[{key:'label',label:'Label',type:'text'},{key:'value',label:'Nilai',type:'text'},{key:'danger',label:'Tampilkan warna merah (peringatan)?',type:'bool'}],
                empty:()=>({label:'',value:'',danger:false})}
        ],
        onSave:()=>{ if(typeof renderDisclaimer==='function') renderDisclaimer(); }},
    footer:{
        label:'Footer & Sosial Media', icon:'panel-bottom', type:'object', path:['footer'],
        intro:'Isi bagian bawah halaman. Gambar/Video opsional (mis. logo atau banner) tampil di atas tombol sosial media.',
        fields:[
            {key:'socialTitle',label:'Judul Sosial Media',type:'text'},
            {key:'socialSubtitle',label:'Subjudul Sosial Media',type:'text'},
            {section:'Gambar / Video Footer',sectionHelp:'Opsional. Kosongkan jika tidak dipakai.',key:'media',label:'Unggah Gambar atau Video',type:'media',folder:'footer'},
            {section:'Tombol Sosial Media',key:'socialLinks',label:'Daftar Sosial Media',type:'repeater',itemName:'Sosial Media',addLabel:'Tambah Sosial Media',
                fields:[{key:'platform',label:'Nama Platform',type:'text'},{key:'url',label:'URL Profil (https://…)',type:'text'},{key:'icon',label:'Ikon Lucide',type:'text',suggest:CMS_ICON_SUGGEST}],
                empty:()=>({platform:'',url:'https://',icon:'link'}),help:CMS_ICON_HELP},
            {section:'Teks Hak Cipta',key:'line1',label:'Baris 1',type:'text'},
            {key:'line2',label:'Baris 2',type:'text'}
        ],
        onSave:()=>{ if(typeof renderFooter==='function') renderFooter(); }},
    bottomNav:{label:'Navigasi Bawah',icon:'navigation',type:'list',path:['bottomNav'],itemLabel:i=>i.label||'(kosong)',fields:[
        {key:'label',label:'Label',type:'text'},{key:'icon',label:'Ikon Lucide',type:'text'},{key:'actionType',label:'Tipe Aksi (scroll/modal/url/whatsapp)',type:'text'},{key:'target',label:'Target',type:'text'},{key:'active',label:'Tampil sebagai menu aktif?',type:'bool'}],
        emptyItem:()=>({label:'Menu Baru',icon:'circle',actionType:'scroll',target:'#beranda',active:false}),onSave:renderBottomNav},
    pricelist:{label:'Pricelist / Harga',icon:'badge-dollar-sign',type:'custom',path:['pricelist'],render:cmsRenderPricelistAdmin},
    calculatorOptions:{label:'Kalkulator Joki',icon:'calculator',type:'list',path:['calculator','rankOptions'],itemLabel:i=>`${i.name||'(kosong)'} - Rp ${Number(i.price||0).toLocaleString('id-ID')}`,fields:[
        {key:'name',label:'Nama Rank',type:'text'},{key:'price',label:'Harga per Bintang (angka)',type:'number'},{key:'label',label:'Label Harga',type:'text'}],
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

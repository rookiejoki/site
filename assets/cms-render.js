// ==========================================================
// ROOKIE JOKI - CMS RENDER LAYER
// ==========================================================
// Kumpulan fungsi yang membaca SITE_DATA dan menuliskannya ke
// elemen-elemen DOM. Dipakai oleh index.html (semua section)
// dan blog/*.html (khusus artikel detail + related posts).
// Setiap fungsi aman dipanggil meski elemen targetnya tidak
// ada di halaman (akan di-skip).
// ==========================================================

function cmsEsc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Escape untuk teks yang disisipkan ke dalam string JS ber-tanda-kutip-satu
// di dalam atribut onclick="..." (mis: onclick="fn('${cmsEscJs(text)}')").
// Berbeda dari cmsEsc: backslash & kutip satu di-escape untuk JS,
// sementara kutip dua tetap di-HTML-escape supaya atribut tidak pecah.
function cmsEscJs(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '\\n');
}

function cmsCategoryBadge(category) {
    const map = SITE_DATA.categoryColors || {};
    const pair = map[category] || ['bg-slate-100', 'text-slate-700'];
    return { bg: pair[0], text: pair[1] };
}

// ----------------------------------------------------------
// HEADER
// ----------------------------------------------------------
function renderHeader() {
    const t = document.getElementById('headerTitleText');
    const tag = document.getElementById('headerTaglineText');
    const cta = document.getElementById('headerCtaText');
    if (t) t.textContent = SITE_DATA.header.title;
    if (tag) tag.textContent = SITE_DATA.header.tagline;
    if (cta) cta.textContent = SITE_DATA.header.ctaLabel;
    const ctaLink = cta ? cta.closest('a') : null;
    if (ctaLink) ctaLink.href = SITE_DATA.header.ctaTarget || '#pricelist';
    const search = document.getElementById('searchInput');
    if (search) search.placeholder = (SITE_DATA.search && SITE_DATA.search.placeholder) || search.placeholder;
    document.title && (document.title = document.title.includes(' - ')
        ? document.title
        : `${SITE_DATA.header.title} - ${SITE_DATA.header.tagline}`);
}

// ----------------------------------------------------------
// TICKER / RUNNING TEXT
// ----------------------------------------------------------
function renderTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const items = SITE_DATA.ticker || [];
    const groupHtml = items.map(item => `
        <span class="flex items-center gap-1 ${cmsEsc(item.color || 'text-white')}">
            ${item.icon ? `<i data-lucide="${cmsEsc(item.icon)}" class="w-3.5 h-3.5"></i>` : ''}
            <span>${cmsEsc(item.text)}</span>
        </span>
        <span class="text-slate-500">&bull;</span>
    `).join('');
    // digandakan 2x supaya animasi marquee (translateX -50%) terlihat seamless/loop
    track.innerHTML = `
        <div class="flex items-center space-x-5 mx-3">${groupHtml}</div>
        <div class="flex items-center space-x-5 mx-3" aria-hidden="true">${groupHtml}</div>
    `;
}

// ----------------------------------------------------------
// SLIDER / BANNER
// ----------------------------------------------------------
let cmsSwiperInstance = null;
function renderSlider() {
    const wrapper = document.getElementById('sliderWrapper');
    if (!wrapper) return;
    const slides = SITE_DATA.slider || [];
    wrapper.innerHTML = slides.map(s => `
        <div class="swiper-slide relative aspect-[2/1] bg-slate-900">
            <img src="${cmsEsc(s.image)}" alt="${cmsEsc(s.title)}" class="w-full h-full object-cover opacity-60">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3.5 flex flex-col justify-end">
                <span class="inline-block px-2 py-0.5 ${cmsEsc(s.badgeColor || 'bg-brand-blue')} text-white text-[9px] font-bold rounded w-max mb-1">
                    ${cmsEsc(s.badgeText)}
                </span>
                <h2 class="text-sm font-extrabold text-white leading-tight">${cmsEsc(s.title)}</h2>
                <p class="text-[11px] text-slate-300 line-clamp-1 mt-0.5">${cmsEsc(s.desc)}</p>
            </div>
        </div>
    `).join('');

    if (typeof Swiper !== 'undefined') {
        if (cmsSwiperInstance) {
            cmsSwiperInstance.destroy(true, true);
            cmsSwiperInstance = null;
        }
        cmsSwiperInstance = new Swiper('.heroSlider', {
            loop: slides.length > 1,
            autoplay: { delay: 3500, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            effect: 'fade',
            fadeEffect: { crossFade: true },
        });
    }
}

// ----------------------------------------------------------
// PORTFOLIO GALLERY
// ----------------------------------------------------------
function renderPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;
    const items = SITE_DATA.portfolio || [];
    grid.innerHTML = items.map((item, idx) => `
        <div onclick="openGalleryModal(${idx})" class="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-brand-blue cursor-pointer transition-all flex flex-col">
            <div class="relative aspect-[4/3] overflow-hidden bg-slate-900">
                <img src="${cmsEsc(item.image)}" alt="${cmsEsc(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90">
                <span class="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm text-brand-accent text-[8px] font-bold px-1.5 py-0.5 rounded">
                    ${cmsEsc(item.tag)}
                </span>
            </div>
            <div class="p-2.5 flex flex-col justify-between flex-1">
                <div>
                    <h4 class="font-bold text-slate-900 text-[11px] leading-tight">${cmsEsc(item.title)}</h4>
                    <p class="text-[9px] text-slate-500 mt-0.5 leading-relaxed">${cmsEsc(item.desc)}</p>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px]">
                    <span class="text-emerald-600 font-bold">${cmsEsc(item.status)}</span>
                    <span class="text-slate-400">${cmsEsc(item.worker)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ----------------------------------------------------------
// PRICELIST
// ----------------------------------------------------------
let cmsActivePricelistTab = null;

function renderPricelistTabs() {
    const container = document.getElementById('pricelistTabs');
    if (!container) return;
    const tabs = (SITE_DATA.pricelist && SITE_DATA.pricelist.tabs) || [];
    if (!cmsActivePricelistTab && tabs.length) cmsActivePricelistTab = tabs[0].key;

    container.innerHTML = tabs.map(tab => {
        const isActive = tab.key === cmsActivePricelistTab;
        const cls = isActive
            ? 'bg-brand-blue text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
        return `<button onclick="switchPricelistCategory('${cmsEsc(tab.key)}')" data-cat-key="${cmsEsc(tab.key)}" class="pricelist-main-tab inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold ${cls} shrink-0 transition-all">${cmsEsc(tab.label)}</button>`;
    }).join('');
}

function renderPricelistCategory(catKey) {
    const container = document.getElementById('pricelistCardsContainer');
    if (!container) return;
    cmsActivePricelistTab = catKey;
    const items = (SITE_DATA.pricelist && SITE_DATA.pricelist.categories[catKey]) || [];

    container.innerHTML = items.map(item => {
        const borderClass = item.popular ? 'border-2 border-brand-blue bg-blue-50/40 relative' : 'border border-slate-200 bg-slate-50 hover:border-brand-blue';
        const badgeTag = item.popular ? `<span class="absolute -top-2.5 right-3 bg-brand-blue text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">MOST POPULAR</span>` : '';
        const tagBg = item.popular ? 'bg-blue-100 text-brand-blue' : 'bg-slate-200 text-slate-700';
        return `
            <div class="pricelist-card ${borderClass} p-3 rounded-xl transition-all flex items-center justify-between">
                ${badgeTag}
                <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                        <span class="font-extrabold text-slate-900">${cmsEsc(item.name)}</span>
                        <span class="text-[9px] px-1.5 py-0.5 ${tagBg} font-bold rounded">${cmsEsc(item.tag)}</span>
                    </div>
                    <div class="text-brand-blue font-extrabold text-sm font-mono pt-0.5">${cmsEsc(item.price)}</div>
                </div>
                <button onclick="orderViaWA('${cmsEscJs(item.name)}', '${cmsEscJs(item.price)}')" class="px-3 py-2 bg-slate-900 hover:bg-brand-blue text-white font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 shadow-sm">
                    <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                    <span>Pesan</span>
                </button>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function switchPricelistCategory(catKey) {
    renderPricelistTabs();
    cmsActivePricelistTab = catKey;
    renderPricelistTabs();
    renderPricelistCategory(catKey);
    const activeTab = document.querySelector(`.pricelist-main-tab[data-cat-key="${catKey}"]`);
    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// ABOUT US MODAL
// ----------------------------------------------------------
function renderAboutUs() {
    const body = document.getElementById('aboutUsBody');
    if (!body) return;
    const d = SITE_DATA.aboutUs;

    body.innerHTML = `
        <div class="rounded-2xl bg-gradient-to-br from-brand-blue to-brand-darkblue p-4 text-white shadow-md">
            <div class="flex items-center gap-2 mb-2">
                <span class="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                    <i data-lucide="gamepad-2" class="w-4 h-4"></i>
                </span>
                <span class="text-[9px] font-extrabold uppercase tracking-wider text-blue-100">${cmsEsc(d.badgeText)}</span>
            </div>
            <h4 class="text-base font-black leading-tight">${cmsEsc(d.heroTitle)}</h4>
            <p class="text-[10px] text-blue-100 mt-1.5 leading-relaxed">${cmsEsc(d.heroText)}</p>
        </div>

        <div class="space-y-2 text-[11px] text-slate-600 leading-relaxed">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                    <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
                </div>
                <h4 class="font-bold text-xs text-slate-900">${cmsEsc(d.sectionTitle)}</h4>
            </div>
            <p>${cmsEsc(d.paragraph1)}</p>
            <p>${cmsEsc(d.paragraph2)}</p>
        </div>

        <div>
            <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                </div>
                <h4 class="font-bold text-xs text-slate-900">Komitmen Kami</h4>
            </div>
            <div class="grid grid-cols-2 gap-2">
                ${(d.commitments || []).map(c => `
                    <div class="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                        <i data-lucide="${cmsEsc(c.icon)}" class="w-4 h-4 text-brand-blue mb-1.5"></i>
                        <h5 class="font-bold text-[10px] text-slate-900">${cmsEsc(c.title)}</h5>
                        <p class="text-[9px] text-slate-500 mt-0.5 leading-relaxed">${cmsEsc(c.desc)}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <span class="text-[10px] font-bold text-slate-900">Informasi Singkat</span>
            </div>
            <div class="divide-y divide-slate-100">
                ${(d.quickInfo || []).map(q => `
                    <div class="flex items-center justify-between px-3 py-2.5">
                        <span class="text-[10px] text-slate-500">${cmsEsc(q.label)}</span>
                        <span class="text-[10px] font-bold text-slate-900">${cmsEsc(q.value)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <div class="flex gap-2.5 items-start">
                <i data-lucide="message-circle" class="w-4 h-4 text-brand-blue mt-0.5 shrink-0"></i>
                <div>
                    <h4 class="font-bold text-[10px] text-slate-900">${cmsEsc(d.ctaTitle)}</h4>
                    <p class="text-[9px] text-slate-600 mt-0.5 leading-relaxed">${cmsEsc(d.ctaText)}</p>
                </div>
            </div>
        </div>
    `;

    const subtitleEl = document.getElementById('aboutUsSubtitle');
    if (subtitleEl) subtitleEl.textContent = d.subtitle;

    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// DISCLAIMER MODAL
// ----------------------------------------------------------
function renderDisclaimer() {
    const body = document.getElementById('disclaimerBody');
    if (!body) return;
    const d = SITE_DATA.disclaimer;

    body.innerHTML = `
        <div class="rounded-xl bg-amber-50 border border-amber-100 p-3 flex gap-2.5 items-start">
            <i data-lucide="info" class="w-4 h-4 text-amber-600 mt-0.5 shrink-0"></i>
            <p class="text-[10px] text-amber-800 leading-relaxed">${cmsEsc(d.intro)}</p>
        </div>

        ${(d.sections || []).map(s => `
            <div class="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <i data-lucide="${cmsEsc(s.icon)}" class="w-3.5 h-3.5"></i>
                    </div>
                    <h4 class="font-bold text-xs text-slate-900">${cmsEsc(s.title)}</h4>
                </div>
                <p>${cmsEsc(s.text)}</p>
            </div>
        `).join('')}

        <div class="rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <span class="text-[10px] font-bold text-slate-900">Ringkasan Kebijakan</span>
            </div>
            <div class="divide-y divide-slate-100">
                ${(d.policySummary || []).map(p => `
                    <div class="flex items-center justify-between px-3 py-2.5">
                        <span class="text-[10px] text-slate-500">${cmsEsc(p.label)}</span>
                        <span class="text-[10px] font-bold ${p.danger ? 'text-rose-600' : 'text-slate-900'}">${cmsEsc(p.value)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// FOOTER
// ----------------------------------------------------------
function renderFooter() {
    const titleEl = document.getElementById('footerSocialTitle');
    const subtitleEl = document.getElementById('footerSocialSubtitle');
    const linksEl = document.getElementById('footerSocialLinks');
    const line1El = document.getElementById('footerLine1');
    const line2El = document.getElementById('footerLine2');
    const f = SITE_DATA.footer;
    if (!f) return;

    if (titleEl) titleEl.textContent = f.socialTitle;
    if (subtitleEl) subtitleEl.textContent = f.socialSubtitle;
    if (line1El) line1El.textContent = f.line1;
    if (line2El) line2El.textContent = f.line2;

    if (linksEl) {
        linksEl.innerHTML = (f.socialLinks || []).map(s => `
            <a href="${cmsEsc(s.url)}" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-xl bg-slate-50 hover:bg-brand-blue hover:text-white border border-slate-200 flex items-center justify-center text-slate-700 transition-all shadow-sm" title="${cmsEsc(s.platform)}">
                <i data-lucide="${cmsEsc(s.icon)}" class="w-4 h-4"></i>
            </a>
        `).join('');
    }
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// BLOG - helper umum
// ----------------------------------------------------------
function cmsGetPostById(id) {
    id = parseInt(id, 10);
    return (SITE_DATA.blogPosts || []).find(p => p.id === id) || null;
}

function cmsGetRelatedPosts(currentId, n = 3) {
    const all = SITE_DATA.blogPosts || [];
    const others = all.filter(p => p.id !== currentId);
    if (others.length <= n) return others;
    // pilih deterministik berbasis id supaya konsisten tiap render
    const start = currentId % others.length;
    const picks = [];
    for (let i = 0; i < n; i++) {
        picks.push(others[(start + i) % others.length]);
    }
    return picks;
}

function cmsBlogSlug(post) {
    return `post.html?id=${post.id}`;
}

// ----------------------------------------------------------
// BLOG - modal list (index.html)
// ----------------------------------------------------------
let cmsActiveBlogCategory = 'Semua';

function renderBlogChips() {
    const chipsContainer = document.getElementById('blogCategoryChips');
    if (!chipsContainer) return;
    const posts = SITE_DATA.blogPosts || [];
    const categories = ['Semua', ...new Set(posts.map(p => p.category))];
    chipsContainer.innerHTML = categories.map(cat => {
        const isActive = cat === cmsActiveBlogCategory;
        const style = isActive ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
        return `<button onclick="setBlogCategory('${cmsEscJs(cat)}')" class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${style}">${cmsEsc(cat)}</button>`;
    }).join('');
}

function setBlogCategory(cat) {
    cmsActiveBlogCategory = cat;
    renderBlogChips();
    filterBlogPosts();
}

function renderBlogList(posts) {
    const container = document.getElementById('blogListContainer');
    const countLabel = document.getElementById('blogCountLabel');
    if (!container) return;
    const total = (SITE_DATA.blogPosts || []).length;
    if (countLabel) countLabel.textContent = `${posts.length} dari ${total} Artikel`;

    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i data-lucide="search-x" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                <p class="text-xs text-slate-400 font-semibold">Artikel tidak ditemukan</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Coba kata kunci atau kategori lain.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = posts.map(p => {
        const badge = cmsCategoryBadge(p.category);
        const adminControls = isAdmin ? `
            <div class="flex flex-col gap-1 shrink-0 pl-1" onclick="event.preventDefault(); event.stopPropagation();">
                <button onclick="cmsOpenBlogForm(${p.id})" title="Edit" class="w-6 h-6 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100 flex items-center justify-center">
                    <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button onclick="cmsDeleteBlogPost(${p.id})" title="Hapus" class="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>` : '';

        return `
        <a href="${cmsBlogSlug(p)}" target="_blank" rel="noopener"
           class="flex gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-brand-blue hover:bg-white transition-all group">
            <div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                <img src="${cmsEsc(p.image)}" alt="${cmsEsc(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90">
                ${p.hasVideo ? `<span class="absolute inset-0 flex items-center justify-center bg-slate-950/30"><i data-lucide="play-circle" class="w-5 h-5 text-white"></i></span>` : ''}
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <span class="text-[8px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} inline-block mb-1">${cmsEsc(p.category)}</span>
                    <h4 class="font-bold text-slate-900 text-[11px] leading-snug line-clamp-2 group-hover:text-brand-blue">${cmsEsc(p.title)}</h4>
                </div>
                <div class="flex items-center gap-2 text-[9px] text-slate-400 mt-1">
                    <span class="flex items-center gap-0.5"><i data-lucide="calendar" class="w-2.5 h-2.5"></i>${cmsEsc(p.date)}</span>
                    <span class="flex items-center gap-0.5"><i data-lucide="clock" class="w-2.5 h-2.5"></i>${cmsEsc(p.readTime)}</span>
                </div>
            </div>
            ${adminControls}
        </a>
    `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function filterBlogPosts() {
    const searchInput = document.getElementById('blogSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const posts = SITE_DATA.blogPosts || [];
    const filtered = posts.filter(p => {
        const matchCategory = cmsActiveBlogCategory === 'Semua' || p.category === cmsActiveBlogCategory;
        const matchQuery = !query ||
            p.title.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.excerpt.toLowerCase().includes(query);
        return matchCategory && matchQuery;
    });
    renderBlogList(filtered);
}

function openBlogModal() {
    const searchInput = document.getElementById('blogSearchInput');
    if (searchInput) searchInput.value = '';
    cmsActiveBlogCategory = 'Semua';
    renderBlogChips();
    renderBlogList(SITE_DATA.blogPosts || []);
    renderBlogAdminBar();

    const blogModal = document.getElementById('blogModal');
    blogModal.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const closeBtn = blogModal.querySelector('button[aria-label="Tutup Blog"]');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

function closeBlogModal() {
    document.getElementById('blogModal').classList.remove('modal-active');
    document.body.style.overflow = '';
}

function renderBlogAdminBar() {
    const bar = document.getElementById('blogAdminBar');
    if (!bar) return;
    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();
    bar.innerHTML = isAdmin ? `
        <button onclick="cmsOpenBlogForm(null)" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Artikel Baru
        </button>` : '';
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// BLOG - halaman detail (blog/blog-N.html & blog/post.html)
// ----------------------------------------------------------
function renderBlogDetailPage(fixedId) {
    let id = fixedId;
    if (!id) {
        const params = new URLSearchParams(window.location.search);
        id = parseInt(params.get('id'), 10);
    }
    const post = cmsGetPostById(id);
    const root = document.getElementById('blogDetailRoot');
    if (!root) return;

    if (!post) {
        root.innerHTML = `
            <div class="px-4 py-16 text-center">
                <i data-lucide="file-question" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                <h2 class="font-bold text-slate-800 text-sm">Artikel tidak ditemukan</h2>
                <p class="text-xs text-slate-400 mt-1">Artikel ini mungkin sudah dihapus oleh admin.</p>
                <a href="index.html#beranda" class="inline-flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-brand-blue">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Kembali ke Beranda
                </a>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    document.title = `${post.title} - Rookie Joki Blog`;
    const badge = cmsCategoryBadge(post.category);
    const related = cmsGetRelatedPosts(post.id, 3);
    const adminPhone = SITE_DATA.meta.adminPhone;

    const mediaBlock = post.hasVideo ? `
        <figure class="my-4 -mx-0.5">
            <video controls preload="metadata" poster="${cmsEsc(post.secondaryImage)}" class="w-full rounded-xl aspect-video bg-slate-900">
                <source src="${cmsEsc(post.video)}" type="video/mp4">
                Browser Anda tidak mendukung pemutar video.
            </video>
            <figcaption class="text-[10px] text-slate-400 mt-1.5 text-center">Video ilustrasi seputar topik ini (konten dummy demo).</figcaption>
        </figure>` : `
        <figure class="my-4 -mx-0.5">
            <img src="${cmsEsc(post.secondaryImage)}" alt="${cmsEsc(post.title)}" class="w-full rounded-xl object-cover aspect-[16/10]">
            <figcaption class="text-[10px] text-slate-400 mt-1.5 text-center">Ilustrasi pendukung artikel.</figcaption>
        </figure>`;

    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();

    root.innerHTML = `
        <div class="relative aspect-[4/3] bg-slate-900">
            <img src="${cmsEsc(post.image)}" alt="${cmsEsc(post.title)}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent"></div>
            <span class="absolute top-3 left-3.5 ${badge.bg} ${badge.text} text-[10px] font-bold px-2.5 py-1 rounded-full">${cmsEsc(post.category)}</span>
            ${isAdmin ? `<button onclick="location.href='index.html?editBlog=${post.id}'" class="absolute top-3 right-3.5 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md" title="Edit Artikel Ini">
                <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>` : ''}
        </div>
        <div class="px-4 pt-4 space-y-4">
            <div class="space-y-2">
                <h2 class="text-lg font-extrabold text-slate-900 leading-snug">${cmsEsc(post.title)}</h2>
                <div class="flex items-center gap-3 text-[11px] text-slate-500">
                    <span class="flex items-center gap-1"><i data-lucide="user-round" class="w-3.5 h-3.5"></i>${cmsEsc(post.author)}</span>
                    <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i>${cmsEsc(post.date)}</span>
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i>${cmsEsc(post.readTime)}</span>
                </div>
            </div>

            <p class="text-[13px] text-slate-600 leading-relaxed font-medium border-l-4 border-brand-blue pl-3">${cmsEsc(post.excerpt)}</p>

            <article class="prose-blog text-[13px] text-slate-700 leading-relaxed">
                <p>${cmsEsc(post.intro)}</p>
                <p>${cmsEsc(post.body1)}</p>
                ${mediaBlock}
                <p>${cmsEsc(post.body2)}</p>
                <div class="bg-white border border-slate-200 rounded-xl p-3.5 my-4 space-y-2">
                    <h3 class="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                        <i data-lucide="list-checks" class="w-4 h-4 text-brand-blue"></i>
                        ${cmsEsc(post.listTitle)}
                    </h3>
                    <ul class="space-y-1.5 text-[12.5px] text-slate-600">
                        ${(post.listItems || []).map(li => `<li class="flex items-start gap-2"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0"></i><span>${cmsEsc(li)}</span></li>`).join('')}
                    </ul>
                </div>
                <p>${cmsEsc(post.closing)}</p>
            </article>

            <div class="flex flex-wrap gap-1.5 pt-1">
                ${(post.tags || []).map(t => `<span class="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-500">#${cmsEsc(t)}</span>`).join('')}
            </div>

            <div class="rounded-2xl bg-slate-900 p-4 flex items-center gap-3 shadow-sm">
                <div class="w-10 h-10 shrink-0 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-accent">
                    <i data-lucide="rocket" class="w-5 h-5"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-white font-bold text-xs">Mau Push Rank Tanpa Ribet?</h4>
                    <p class="text-slate-400 text-[10px] mt-0.5">Serahkan ke worker profesional Rookie Joki.</p>
                </div>
                <a href="https://wa.me/${cmsEsc(adminPhone)}?text=${encodeURIComponent(`Halo Admin Rookie Joki, saya tertarik setelah baca artikel "${post.title}". Boleh info paketnya?`)}"
                   target="_blank" rel="noopener"
                   class="shrink-0 px-3 py-2 bg-brand-blue hover:bg-brand-darkblue text-white text-[11px] font-bold rounded-xl transition-colors">
                    Pesan
                </a>
            </div>

            <div class="pt-2">
                <h3 class="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
                    <i data-lucide="newspaper" class="w-4 h-4 text-slate-400"></i> Artikel Terkait
                </h3>
                <div class="space-y-2.5">
                    ${related.map(r => {
                        const rb = cmsCategoryBadge(r.category);
                        return `<a href="${cmsBlogSlug(r)}" class="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-2 hover:border-brand-blue transition-colors group">
                            <img src="${cmsEsc(r.image)}" alt="${cmsEsc(r.title)}" class="w-14 h-14 rounded-lg object-cover shrink-0">
                            <div class="min-w-0">
                                <span class="inline-block ${rb.bg} ${rb.text} text-[8px] font-bold px-1.5 py-0.5 rounded mb-0.5">${cmsEsc(r.category)}</span>
                                <h4 class="text-[11px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-blue">${cmsEsc(r.title)}</h4>
                            </div>
                        </a>`;
                    }).join('')}
                </div>
            </div>

            <div class="pt-4 pb-2 text-center">
                <a href="index.html#beranda" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-blue hover:text-brand-darkblue">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Kembali ke Beranda Rookie Joki
                </a>
            </div>
            <div class="pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 pb-2">
                Rookie Joki Official &copy; 2021-2026. All Rights Reserved.
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// RENDER SEMUA (dipanggil saat index.html dimuat)
// ----------------------------------------------------------
function cmsRenderAllIndexSections() {
    renderHeader();
    renderCalculatorOptions();
    renderTicker();
    renderSlider();
    renderPortfolio();
    renderPricelistTabs();
    renderPricelistCategory(cmsActivePricelistTab || (SITE_DATA.pricelist.tabs[0] && SITE_DATA.pricelist.tabs[0].key));
    renderAboutUs();
    renderDisclaimer();
    renderFooter();
    renderPaymentMethods();
    renderBottomNav();
    renderFaqs();
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// TESTIMONI / ULASAN PELANGGAN
// ----------------------------------------------------------
let cmsFilteredTestimonials = [];
let cmsTestimonialsDisplayedCount = 0;
const CMS_TESTIMONIALS_BATCH_SIZE = 15;

function cmsRenderStars(rating) {
    let stars = '';
    for (let s = 1; s <= 5; s++) {
        stars += s <= rating
            ? '<span class="text-amber-400">★</span>'
            : '<span class="text-slate-200">★</span>';
    }
    return stars;
}

function renderTestimonialsNextBatch() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    const nextItems = cmsFilteredTestimonials.slice(cmsTestimonialsDisplayedCount, cmsTestimonialsDisplayedCount + CMS_TESTIMONIALS_BATCH_SIZE);

    if (nextItems.length === 0 && cmsTestimonialsDisplayedCount === 0) {
        container.innerHTML = `<p class="text-center text-slate-400 py-4">Ulasan tidak ditemukan.</p>`;
        return;
    }

    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();
    let html = '';
    nextItems.forEach(item => {
        const initial = (item.name || '?').charAt(0).toUpperCase();
        const adminControls = isAdmin ? `
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="cmsOpenListItemForm('testimonials', ${SITE_DATA.testimonials.findIndex(t => t.id === item.id)})" class="w-5.5 h-5.5 rounded-md bg-blue-50 text-brand-blue hover:bg-blue-100 flex items-center justify-center"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                <button onclick="cmsDeleteListItem('testimonials', ${SITE_DATA.testimonials.findIndex(t => t.id === item.id)})" class="w-5.5 h-5.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>` : '';
        html += `
            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="w-7 h-7 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center text-[11px] shrink-0">
                            ${cmsEsc(initial)}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-slate-900 text-[11px] truncate">${cmsEsc(item.name)}</span>
                                <i data-lucide="badge-check" class="w-3 h-3 text-emerald-500 shrink-0"></i>
                            </div>
                            <span class="text-[9px] text-slate-400">${cmsEsc(item.badge)} • ${cmsEsc(item.date)}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <div class="text-[11px] leading-none">${cmsRenderStars(item.rating)}</div>
                        ${adminControls}
                    </div>
                </div>
                <p class="text-[10.5px] text-slate-600 leading-relaxed">${cmsEsc(item.comment)}</p>
                <span class="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue">${cmsEsc(item.service)}</span>
            </div>
        `;
    });

    if (cmsTestimonialsDisplayedCount === 0) {
        container.innerHTML = html;
    } else {
        container.insertAdjacentHTML('beforeend', html);
    }
    cmsTestimonialsDisplayedCount += nextItems.length;
    if (window.lucide) lucide.createIcons();
}

function handleReviewsScroll(element) {
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 30) {
        if (cmsTestimonialsDisplayedCount < cmsFilteredTestimonials.length) {
            renderTestimonialsNextBatch();
        }
    }
}

function filterReviews() {
    const query = document.getElementById('reviewsSearchInput').value.toLowerCase().trim();
    const all = SITE_DATA.testimonials || [];
    cmsFilteredTestimonials = all.filter(item =>
        item.name.toLowerCase().includes(query) || item.service.toLowerCase().includes(query) || item.comment.toLowerCase().includes(query)
    );
    cmsTestimonialsDisplayedCount = 0;
    renderTestimonialsNextBatch();
}

function openTestimonialsModal() {
    const all = SITE_DATA.testimonials || [];
    document.getElementById('reviewsSearchInput').value = '';
    cmsFilteredTestimonials = [...all];
    cmsTestimonialsDisplayedCount = 0;
    renderTestimonialsNextBatch();
    renderTestimonialsAdminBar();

    const avg = all.length ? (all.reduce((sum, r) => sum + r.rating, 0) / all.length).toFixed(1) : '0.0';
    document.getElementById('reviewsAvgScore').textContent = avg;
    document.getElementById('reviewsTotalCount').textContent = `${all.length} Ulasan`;

    const testimonialsModal = document.getElementById('testimonialsModal');
    testimonialsModal.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        const closeBtn = testimonialsModal.querySelector('button[aria-label="Tutup Testimoni"]');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

function closeTestimonialsModal() {
    document.getElementById('testimonialsModal').classList.remove('modal-active');
    document.body.style.overflow = '';
}

function renderTestimonialsAdminBar() {
    const bar = document.getElementById('testimonialsAdminBar');
    if (!bar) return;
    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();
    bar.innerHTML = isAdmin ? `
        <button onclick="cmsOpenListItemForm('testimonials', -1)" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Ulasan
        </button>` : '';
    if (window.lucide) lucide.createIcons();
}

function cmsRefreshTestimonialsView() {
    filterReviews();
    const totalEl = document.getElementById('reviewsTotalCount');
    const avgEl = document.getElementById('reviewsAvgScore');
    if (totalEl && avgEl) {
        const all = SITE_DATA.testimonials || [];
        avgEl.textContent = all.length ? (all.reduce((sum, r) => sum + r.rating, 0) / all.length).toFixed(1) : '0.0';
        totalEl.textContent = `${all.length} Ulasan`;
    }
}

// ----------------------------------------------------------
// LEADERBOARD WORKER
// ----------------------------------------------------------
let cmsFilteredLeaderboard = [];
let cmsLeaderboardDisplayedCount = 0;
const CMS_LEADERBOARD_BATCH_SIZE = 20;

function renderLeaderboardNextBatch() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    const nextItems = cmsFilteredLeaderboard.slice(cmsLeaderboardDisplayedCount, cmsLeaderboardDisplayedCount + CMS_LEADERBOARD_BATCH_SIZE);

    if (nextItems.length === 0 && cmsLeaderboardDisplayedCount === 0) {
        container.innerHTML = `<p class="text-center text-slate-400 py-4">Data worker tidak ditemukan.</p>`;
        return;
    }

    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();
    let html = '';
    nextItems.forEach(item => {
        let rankStyle = 'bg-slate-50 border-slate-200';
        let rankNumStyle = 'text-slate-500';
        let badgeStyle = 'bg-slate-100 text-slate-700';

        if (item.rank === 1) {
            rankStyle = 'bg-amber-50/80 border-amber-300';
            rankNumStyle = 'text-amber-600 font-black';
            badgeStyle = 'bg-amber-200 text-amber-800 font-bold';
        } else if (item.rank === 2) {
            rankStyle = 'bg-slate-100/90 border-slate-300';
            rankNumStyle = 'text-slate-600 font-black';
            badgeStyle = 'bg-slate-200 text-slate-800 font-bold';
        } else if (item.rank === 3) {
            rankStyle = 'bg-orange-50/70 border-orange-200';
            rankNumStyle = 'text-orange-600 font-black';
            badgeStyle = 'bg-orange-200 text-orange-800 font-bold';
        }

        const adminControls = isAdmin ? `
            <div class="flex items-center gap-1 shrink-0 ml-1.5">
                <button onclick="cmsOpenListItemForm('leaderboard', ${SITE_DATA.leaderboard.findIndex(l => l.rank === item.rank && l.name === item.name)})" class="w-5.5 h-5.5 rounded-md bg-blue-50 text-brand-blue hover:bg-blue-100 flex items-center justify-center"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                <button onclick="cmsDeleteListItem('leaderboard', ${SITE_DATA.leaderboard.findIndex(l => l.rank === item.rank && l.name === item.name)})" class="w-5.5 h-5.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>` : '';

        html += `
            <div class="flex items-center justify-between p-2.5 border rounded-xl ${rankStyle}">
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-7 text-center ${rankNumStyle}">#${item.rank}</span>
                    <div class="min-w-0">
                        <span class="font-bold text-slate-900 block truncate">${cmsEsc(item.name)}</span>
                        <span class="text-[10px] text-slate-500">Winrate ${cmsEsc(item.wr)}% (${cmsEsc(item.match)} Match)</span>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <span class="px-2 py-0.5 rounded text-[9px] ${badgeStyle}">${cmsEsc(item.badge)}</span>
                    ${adminControls}
                </div>
            </div>
        `;
    });

    if (cmsLeaderboardDisplayedCount === 0) {
        container.innerHTML = html;
    } else {
        container.insertAdjacentHTML('beforeend', html);
    }
    cmsLeaderboardDisplayedCount += nextItems.length;
    if (window.lucide) lucide.createIcons();
}

function handleLeaderboardScroll(element) {
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 30) {
        if (cmsLeaderboardDisplayedCount < cmsFilteredLeaderboard.length) {
            renderLeaderboardNextBatch();
        }
    }
}

function filterLeaderboard() {
    const query = document.getElementById('leaderboardSearchInput').value.toLowerCase().trim();
    const all = SITE_DATA.leaderboard || [];
    cmsFilteredLeaderboard = all.filter(item => item.name.toLowerCase().includes(query));
    cmsLeaderboardDisplayedCount = 0;
    renderLeaderboardNextBatch();
}

function openLeaderboardModal() {
    const all = SITE_DATA.leaderboard || [];
    document.getElementById('leaderboardSearchInput').value = '';
    cmsFilteredLeaderboard = [...all];
    cmsLeaderboardDisplayedCount = 0;
    renderLeaderboardNextBatch();
    renderLeaderboardAdminBar();

    const leaderboardModal = document.getElementById('leaderboardModal');
    leaderboardModal.classList.add('modal-active');
    document.body.style.overflow = 'hidden';
}

function closeLeaderboardModal() {
    document.getElementById('leaderboardModal').classList.remove('modal-active');
    document.body.style.overflow = '';
}

function renderLeaderboardAdminBar() {
    const bar = document.getElementById('leaderboardAdminBar');
    if (!bar) return;
    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();
    bar.innerHTML = isAdmin ? `
        <button onclick="cmsOpenListItemForm('leaderboard', -1)" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Worker
        </button>` : '';
    if (window.lucide) lucide.createIcons();
}

function cmsRefreshLeaderboardView() {
    filterLeaderboard();
}

// ----------------------------------------------------------
// STATUS PESANAN JOKI
// ----------------------------------------------------------
function trackOrder() {
    const inputEl = document.getElementById('orderTrackInput');
    const input = inputEl.value.trim().toUpperCase();
    const container = document.getElementById('trackResultContainer');
    const orders = SITE_DATA.orders || [];

    if (!input) {
        container.classList.remove('hidden');
        container.innerHTML = `<p class="text-rose-500 font-semibold text-center">Silakan masukkan ID Transaksi atau No HP!</p>`;
        return;
    }

    const match = orders.find(o => o.id.toUpperCase() === input || o.phone === input.replace(/\s/g, ''));
    container.classList.remove('hidden');

    if (match) {
        let statusBadge = 'bg-amber-100 text-amber-700';
        if (match.status === 'On Process') statusBadge = 'bg-blue-100 text-blue-700';
        if (match.status === 'Done') statusBadge = 'bg-emerald-100 text-emerald-700';
        if (match.status === 'Dibatalkan') statusBadge = 'bg-rose-100 text-rose-700';

        container.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span class="font-mono font-bold text-slate-800">${cmsEsc(match.id)}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold ${statusBadge}">${cmsEsc(match.status)}</span>
            </div>
            <div class="space-y-1 text-[11px] text-slate-600">
                <div class="flex justify-between"><span>Pelanggan:</span><span class="font-semibold text-slate-800">${cmsEsc(match.customer)}</span></div>
                <div class="flex justify-between"><span>Layanan:</span><span class="font-semibold text-slate-800">${cmsEsc(match.service)}</span></div>
                <div class="flex justify-between"><span>Worker:</span><span class="font-semibold text-slate-800">${cmsEsc(match.worker)}</span></div>
                <div class="flex justify-between"><span>Progres:</span><span class="font-semibold text-emerald-600">${cmsEsc(match.progress)}</span></div>
                <div class="flex justify-between"><span>Tanggal:</span><span class="text-slate-400">${cmsEsc(match.date)}</span></div>
            </div>
        `;
    } else {
        const sample = orders[0];
        container.innerHTML = `
            <div class="text-center py-1">
                <p class="text-rose-500 font-semibold">Data pesanan tidak ditemukan!</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Coba gunakan ID contoh: <span class="font-mono text-slate-600 font-bold">${cmsEsc(sample ? sample.id : 'RK-1001')}</span> atau <span class="font-mono text-slate-600 font-bold">${cmsEsc(sample ? sample.phone : '')}</span></p>
            </div>
        `;
    }
}

// ----------------------------------------------------------
// METODE PEMBAYARAN
// ----------------------------------------------------------
const CMS_PAYMENT_CATEGORY_LABEL = {
    ewallet: { num: '2', title: 'E-Wallet', icon: 'smartphone' },
    bank: { num: '3', title: 'Bank Transfer', icon: 'building-2' },
    paylater: { num: '4', title: 'PayLater & ShopeePay', icon: 'wallet' },
};

function renderPaymentMethods() {
    const body = document.getElementById('paymentModalBody');
    if (!body) return;
    const data = SITE_DATA.paymentMethods || { qris: {}, accounts: [] };
    const qris = data.qris || {};
    const accounts = data.accounts || [];
    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();

    const renderAccountRow = (acc) => {
        const realIdx = accounts.indexOf(acc);
        const digitsOnly = String(acc.number || '').replace(/\D/g, '');
        const adminControls = isAdmin ? `
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="cmsOpenListItemForm('paymentAccounts', ${realIdx})" class="w-6 h-6 rounded-md bg-blue-50 text-brand-blue hover:bg-blue-100 flex items-center justify-center"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                <button onclick="cmsDeleteListItem('paymentAccounts', ${realIdx})" class="w-6 h-6 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>` : '';
        return `
            <div class="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div class="min-w-0">
                    <span class="font-bold text-slate-800 block truncate">${cmsEsc(acc.label)}</span>
                    <span class="font-mono text-slate-600 select-all">${cmsEsc(acc.number)}</span>
                    ${acc.note ? `<span class="text-[9px] text-slate-400 block">${cmsEsc(acc.note)}</span>` : ''}
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="copyText('${cmsEscJs(digitsOnly)}')" class="px-2 py-1 text-[9px] font-semibold bg-slate-100 hover:bg-brand-blue hover:text-white rounded transition-colors">Salin</button>
                    ${adminControls}
                </div>
            </div>`;
    };

    const renderCategoryBlock = (catKey) => {
        const meta = CMS_PAYMENT_CATEGORY_LABEL[catKey];
        const items = accounts.filter(a => a.category === catKey);
        return `
            <div id="section-${catKey}" class="bg-slate-50 rounded-xl p-3 border border-slate-200 transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900 text-xs">${meta.num}. ${meta.title}</span>
                    <i data-lucide="${meta.icon}" class="w-3.5 h-3.5 text-brand-blue"></i>
                </div>
                <div class="space-y-1.5">
                    ${items.length === 0 ? '<p class="text-[10px] text-slate-400 text-center py-2">Belum ada rekening/akun.</p>' : items.map(renderAccountRow).join('')}
                </div>
            </div>`;
    };

    const qrisAdminControls = isAdmin ? `
        <button onclick="cmsSwitchAdminSection('paymentQris'); openAdminPanel();" class="px-2 py-1 text-[9px] font-semibold bg-slate-100 hover:bg-brand-blue hover:text-white rounded transition-colors">Edit QRIS</button>` : '';

    body.innerHTML = `
        <div id="section-qris" class="bg-slate-50 rounded-xl p-3 border border-slate-200 transition-all">
            <div class="flex items-center justify-between mb-1.5">
                <span class="font-bold text-slate-900 text-xs">1. QRIS (Instant All Payment)</span>
                <span class="px-1 py-0.5 rounded text-[8px] font-extrabold bg-emerald-100 text-emerald-700">${cmsEsc(qris.badge || 'Otomatis')}</span>
            </div>
            <p class="text-[11px] text-slate-600 leading-relaxed mb-2.5">${cmsEsc(qris.description)}</p>
            <div class="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
                <img src="${cmsEsc(qris.qrImageUrl)}" alt="QRIS Code" class="w-28 h-28 rounded border border-slate-100 p-1 mb-1.5">
                <span class="font-semibold text-slate-700 text-[10px]">${cmsEsc(qris.merchantName)}</span>
                ${qrisAdminControls ? `<div class="mt-1.5">${qrisAdminControls}</div>` : ''}
            </div>
        </div>

        ${renderCategoryBlock('ewallet')}
        ${renderCategoryBlock('bank')}
        ${renderCategoryBlock('paylater')}

        ${isAdmin ? `
        <button onclick="cmsOpenListItemForm('paymentAccounts', -1)" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Rekening / Akun Pembayaran
        </button>` : ''}
    `;
    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// NAVIGASI MENU (BOTTOM NAV)
// ----------------------------------------------------------
const CMS_NAV_MODAL_WHITELIST = [
    'openAboutUsModal', 'openTestimonialsModal', 'openDisclaimerModal',
    'openBlogModal', 'openLeaderboardModal', 'openCalcModal', 'openPaymentModal',
];

function cmsNavGridClass(count) {
    const map = { 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' };
    return map[count] || null;
}

function renderBottomNav() {
    const container = document.getElementById('bottomNavList');
    if (!container) return;
    const items = SITE_DATA.bottomNav || [];
    const count = items.length;
    const gridClass = cmsNavGridClass(count);

    container.className = gridClass
        ? `grid ${gridClass} w-full gap-1`
        : `flex w-full gap-1 overflow-x-auto scrollbar-none`;

    container.innerHTML = items.map(item => {
        let hrefAttr = '#';
        let onclickAttr = '';
        let targetAttr = '';
        let relAttr = '';

        if (item.actionType === 'modal') {
            hrefAttr = '#';
            if (CMS_NAV_MODAL_WHITELIST.includes(item.target)) {
                onclickAttr = ` onclick="event.preventDefault(); ${item.target}();"`;
            }
        } else if (item.actionType === 'whatsapp') {
            const digits = String(item.target || '').replace(/\D/g, '');
            hrefAttr = `https://wa.me/${digits}`;
            targetAttr = ' target="_blank"';
            relAttr = ' rel="noopener"';
        } else if (item.actionType === 'url') {
            hrefAttr = item.target || '#';
            targetAttr = ' target="_blank"';
            relAttr = ' rel="noopener"';
        } else {
            // scroll (default)
            hrefAttr = item.target || '#beranda';
        }

        const colorClass = item.active ? 'text-brand-blue' : 'text-slate-500 hover:text-brand-blue';
        const liClass = gridClass ? '' : ' class="shrink-0 w-16"';

        return `<li${liClass}>
            <a href="${cmsEsc(hrefAttr)}"${onclickAttr}${targetAttr}${relAttr}
               class="flex flex-col items-center justify-center gap-0.5 py-1 ${colorClass} rounded-xl transition-colors" aria-label="${cmsEsc(item.label)}">
                <i data-lucide="${cmsEsc(item.icon || 'circle')}" class="w-5 h-5"></i>
                <span class="text-[10px] font-semibold leading-tight">${cmsEsc(item.label)}</span>
            </a>
        </li>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// FAQ (ACCORDION)
// ----------------------------------------------------------
function renderFaqs() {
    const container = document.getElementById('faqContainer');
    if (!container) return;
    const faqs = SITE_DATA.faqs || [];
    const isAdmin = typeof cmsIsLoggedIn === 'function' && cmsIsLoggedIn();

    container.innerHTML = faqs.map((item, idx) => {
        const adminControls = isAdmin ? `
            <div class="flex items-center gap-1 shrink-0 px-3 pb-2" onclick="event.stopPropagation();">
                <button onclick="cmsOpenListItemForm('faqs', ${idx})" class="w-6 h-6 rounded-md bg-blue-50 text-brand-blue hover:bg-blue-100 flex items-center justify-center"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                <button onclick="cmsDeleteListItem('faqs', ${idx})" class="w-6 h-6 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>` : '';

        return `
            <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button onclick="toggleAccordion(${item.id})" class="w-full p-3 text-left font-bold text-slate-900 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors">
                    <span>${idx + 1}. ${cmsEsc(item.question)}</span>
                    <i data-lucide="chevron-down" id="faqIcon-${item.id}" class="w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0"></i>
                </button>
                <div id="faqContent-${item.id}" class="hidden px-3 pb-3 pt-0 text-slate-600 leading-relaxed text-[11px] border-t border-slate-200/60 mt-1 pt-2">
                    ${item.answer}
                </div>
                ${adminControls}
            </div>
        `;
    }).join('');

    if (isAdmin) {
        container.insertAdjacentHTML('beforeend', `
            <button onclick="cmsOpenListItemForm('faqs', -1)" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Pertanyaan FAQ
            </button>
        `);
    }

    if (window.lucide) lucide.createIcons();
}

function renderCalculatorOptions(){
 const sel=document.getElementById('tierSelect'); if(!sel) return;
 const opts=SITE_DATA.calculator?.rankOptions || [];
 const current=sel.value;
 sel.innerHTML=opts.map(o=>`<option value="${Number(o.price)||0}" data-name="${cmsEsc(o.name)}">${cmsEsc(o.name)} (${cmsEsc(o.label||('Rp '+Number(o.price||0).toLocaleString('id-ID')+' / Bintang'))})</option>`).join('');
 if(current && Array.from(sel.options).some(o=>o.value===current)) sel.value=current;
 if(!sel.value && opts.length) sel.value=String(opts[Math.min(1,opts.length-1)].price||0);
 if(typeof calculateRankCost==='function') calculateRankCost();
}

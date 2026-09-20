// ==========================================================
// ROOKIE JOKI - FORM ENGINE + UPLOAD MEDIA (DRAG & DROP)
// ==========================================================
// Dipakai oleh Panel Admin (assets/cms-admin.js).
//
//  1. Mesin form: satu definisi field -> HTML form -> nilai kembali.
//     Tipe field: text, textarea, select, bool, number, lines, tags,
//                 image, video, media (gambar ATAU video), signature,
//                 repeater (daftar baris yang bisa ditambah/dihapus).
//  2. Uploader: pilih file dari drive lokal ATAU drag & drop.
//     Gambar dioptimasi di browser (resize + kompres) lalu file
//     di-commit ke folder  uploads/<jenis>/  lewat GitHub Contents
//     API SAAT tombol "Simpan" ditekan. Yang disimpan di data.json
//     hanya path relatifnya, mis.  uploads/banner/promo-lx9a.jpg
// ==========================================================

const CMS_MB = 1024 * 1024;
const CMS_RAW_IMAGE_LIMIT_MB = 12;   // batas file asli sebelum dioptimasi
const CMS_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CMS_VID_TYPES = ['video/mp4', 'video/webm'];
const CMS_INPUT_CLS = 'w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-blue bg-white';

// ----------------------------------------------------------
// SPESIFIKASI UPLOAD PER BAGIAN (ditampilkan sebagai keterangan)
// ----------------------------------------------------------
const CMS_UPLOAD_SPECS = {
    banner:     { folder: 'banner',    kind: 'image', title: 'Slide Banner',            maxW: 1200, maxH: 600,  dim: '1200 × 600 px', ratio: '2:1 (landscape)', maxMB: 2,
                  tip: 'Tampil selebar layar dengan rasio 2:1 dan otomatis dipotong di tepi — taruh objek/teks penting di tengah gambar.' },
    portfolio:  { folder: 'portfolio', kind: 'image', title: 'Galeri Portofolio',       maxW: 1000, maxH: 750,  dim: '800 × 600 px',  ratio: '4:3',             maxMB: 1.5,
                  tip: 'Thumbnail rasio 4:3 (dipotong di tepi), lalu dibuka penuh saat gambar diklik. Screenshot hasil joki paling jelas jika tidak diburamkan.' },
    qris:       { folder: 'qris',      kind: 'image', title: 'QRIS Pembayaran',         maxW: 800,  maxH: 800,  dim: '600 × 600 px',  ratio: '1:1 (persegi)',   maxMB: 1,   keepPng: true,
                  tip: 'Gunakan PNG dengan latar putih dan JANGAN dipotong/diedit agar kode QR tetap terbaca oleh aplikasi pembayaran.' },
    blogMain:   { folder: 'blog',      kind: 'image', title: 'Gambar Utama Blog',       maxW: 1200, maxH: 900,  dim: '1200 × 900 px', ratio: '4:3',             maxMB: 2,
                  tip: 'Jadi header halaman artikel (4:3) sekaligus thumbnail kotak di daftar artikel.' },
    blogSecond: { folder: 'blog',      kind: 'image', title: 'Gambar Kedua Blog',       maxW: 1200, maxH: 750,  dim: '1200 × 750 px', ratio: '16:10',           maxMB: 2,
                  tip: 'Tampil di tengah isi artikel. Juga menjadi poster (cover) jika artikel memakai video.' },
    blogVideo:  { folder: 'blog',      kind: 'video', title: 'Video Blog',              dim: '1280 × 720 px (720p)', ratio: '16:9', maxMB: 20,
                  tip: 'Gunakan MP4 (H.264 + AAC) agar bisa diputar di semua perangkat. Durasi ideal di bawah 60 detik.' },
    mediaImage: { folder: 'media',     kind: 'image', title: 'Gambar',                  maxW: 1200, maxH: 800,  dim: '1200 × 675 px', ratio: '16:9',            maxMB: 2,
                  tip: 'Tampil selebar konten dengan tinggi menyesuaikan gambar.' },
    mediaVideo: { folder: 'media',     kind: 'video', title: 'Video',                   dim: '1280 × 720 px (720p)', ratio: '16:9', maxMB: 20,
                  tip: 'Gunakan MP4 (H.264 + AAC). Video tampil dengan tombol play (tidak autoplay).' },
    signature:  { folder: 'signature', kind: 'image', title: 'Tanda Tangan Admin',      maxW: 600,  maxH: 240,  dim: '600 × 240 px',  ratio: '5:2',             maxMB: 0.5, keepPng: true,
                  tip: 'Tanda tangan di atas kertas putih lalu difoto/scan, atau gambar langsung memakai tombol di bawah. PNG transparan paling rapi saat dicetak.' }
};

function cmsSpecFormats(kind) { return kind === 'video' ? 'MP4 (H.264/AAC) atau WebM' : 'JPG, PNG, atau WebP'; }
function cmsSizeLabel(mb) { return mb < 1 ? Math.round(mb * 1024) + ' KB' : mb + ' MB'; }

function cmsSpecInfoHtml(spec, label) {
    const rows = [
        ['Ukuran ideal', spec.dim + ' · rasio ' + spec.ratio],
        ['Format', cmsSpecFormats(spec.kind)],
        ['Ukuran file', 'maks. ' + cmsSizeLabel(spec.maxMB) + (spec.kind === 'image' ? ' (gambar besar otomatis diperkecil & dikompres)' : '')]
    ];
    return `
        <div class="rounded-lg bg-blue-50/70 border border-blue-100 px-2.5 py-2 space-y-0.5">
            <p class="text-[9px] font-extrabold text-brand-blue uppercase tracking-wide">${cmsEsc(label || spec.title)}</p>
            ${rows.map(r => `<p class="text-[9px] text-slate-600 leading-snug"><b class="text-slate-700">${r[0]}:</b> ${cmsEsc(r[1])}</p>`).join('')}
            <p class="text-[9px] text-slate-500 leading-snug italic">${cmsEsc(spec.tip)}</p>
        </div>`;
}

// ----------------------------------------------------------
// PENGOLAHAN GAMBAR DI BROWSER (resize + kompres)
// ----------------------------------------------------------
function cmsLoadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak dapat dibaca atau file rusak.')); };
        img.src = url;
    });
}
function cmsCanvasToBlob(canvas, type, q) {
    return new Promise(resolve => canvas.toBlob(resolve, type, q));
}
async function cmsProcessImage(file, spec) {
    const img = await cmsLoadImage(file);
    const w0 = img.naturalWidth, h0 = img.naturalHeight;
    if (!w0 || !h0) throw new Error('Dimensi gambar tidak valid.');
    const scale = Math.min(1, spec.maxW / w0, spec.maxH / h0);
    const asPng = !!spec.keepPng;
    const type = asPng ? 'image/png' : 'image/jpeg';
    const maxBytes = spec.maxMB * CMS_MB;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const draw = (k) => {
        canvas.width = Math.max(1, Math.round(w0 * scale * k));
        canvas.height = Math.max(1, Math.round(h0 * scale * k));
        if (!asPng) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    draw(1);
    let q = 0.88;
    let blob = await cmsCanvasToBlob(canvas, type, q);
    if (!blob) throw new Error('Browser gagal memproses gambar.');
    while (!asPng && blob.size > maxBytes && q > 0.5) {
        q -= 0.1;
        blob = await cmsCanvasToBlob(canvas, type, q);
    }
    let k = 1;
    while (blob && blob.size > maxBytes && k > 0.4) {
        k *= 0.8;
        draw(k);
        blob = await cmsCanvasToBlob(canvas, type, q);
    }
    if (!blob || blob.size > maxBytes) {
        throw new Error('Ukuran gambar masih di atas ' + cmsSizeLabel(spec.maxMB) + '. Gunakan gambar yang lebih sederhana/kecil.');
    }
    // Jika file asli sudah sesuai (tidak perlu diperkecil) dan lebih kecil, pakai file asli.
    if (scale === 1 && file.type === type && file.size <= blob.size) return { blob: file, ext: asPng ? 'png' : 'jpg' };
    return { blob, ext: asPng ? 'png' : 'jpg' };
}

function cmsSlugFileName(name, ext) {
    const base = String(name || 'file').replace(/\.[^.]+$/, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'file';
    return base + '-' + Date.now().toString(36) + '.' + ext;
}
function cmsFmtBytes(n) {
    if (n >= CMS_MB) return (n / CMS_MB).toFixed(2).replace(/\.?0+$/, '') + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' KB';
}
function cmsGuessKind(src, hint) {
    if (hint === 'video' || hint === 'image') return hint;
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(src || '')) ? 'video' : 'image';
}

// ----------------------------------------------------------
// UPLOADER (dropzone + preview)
// ----------------------------------------------------------
const CMS_UP_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>';

function cmsAcceptFor(mode) {
    const img = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
    const vid = 'video/mp4,video/webm,.mp4,.webm';
    return mode === 'media' ? img + ',' + vid : mode === 'video' ? vid : img;
}
function cmsUpSpecFor(wrap, kind) {
    const mode = wrap.dataset.mode;
    if (mode === 'media') {
        const spec = Object.assign({}, CMS_UPLOAD_SPECS[kind === 'video' ? 'mediaVideo' : 'mediaImage']);
        if (wrap.dataset.folder) spec.folder = wrap.dataset.folder;
        return spec;
    }
    return CMS_UPLOAD_SPECS[wrap.dataset.spec];
}

/** HTML uploader. mode: image | video | media | signature */
function cmsUploaderHtml(f, value) {
    const mode = f.type === 'signature' ? 'signature' : f.type;
    const isMedia = mode === 'media';
    const src = isMedia ? ((value && value.src) || '') : (value || '');
    const mtype = isMedia ? ((value && value.type) || '') : '';
    const caption = isMedia ? ((value && value.caption) || '') : '';
    const specKey = f.spec || (mode === 'signature' ? 'signature' : '');
    let infoHtml = '';
    if (isMedia) {
        infoHtml = cmsSpecInfoHtml(CMS_UPLOAD_SPECS.mediaImage, 'Jika Gambar') + '<div class="h-1"></div>' + cmsSpecInfoHtml(CMS_UPLOAD_SPECS.mediaVideo, 'Jika Video');
    } else if (CMS_UPLOAD_SPECS[specKey]) {
        infoHtml = cmsSpecInfoHtml(CMS_UPLOAD_SPECS[specKey], 'Rekomendasi ' + CMS_UPLOAD_SPECS[specKey].title);
    }
    const dropText = mode === 'media' ? 'gambar atau video' : mode === 'video' ? 'video' : 'gambar';
    return `
        <div class="cms-up space-y-1.5" data-mode="${mode}" data-spec="${cmsEsc(specKey)}" data-folder="${cmsEsc(f.folder || '')}">
            <div class="cms-up-drop cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-brand-blue hover:bg-blue-50/40 transition-colors px-3 py-3.5 text-center" tabindex="0" role="button" aria-label="Pilih ${dropText} dari perangkat">
                <div class="text-brand-blue flex justify-center">${CMS_UP_ICON}</div>
                <p class="text-[10px] font-bold text-slate-700 mt-1">Tarik &amp; lepas ${dropText} ke sini</p>
                <p class="text-[9px] text-slate-500">atau <span class="text-brand-blue font-semibold underline">klik untuk memilih file</span> dari Local Drive</p>
            </div>
            <input type="file" class="cms-up-file hidden" accept="${cmsAcceptFor(mode)}">
            <div class="cms-up-preview hidden items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white">
                <div class="cms-up-thumb w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center"></div>
                <div class="min-w-0 flex-1">
                    <p class="cms-up-status text-[10px] font-bold text-slate-700"></p>
                    <p class="cms-up-name text-[9px] text-slate-400 break-all leading-snug"></p>
                </div>
                <button type="button" data-up-clear class="shrink-0 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[9px] font-bold">Hapus</button>
            </div>
            <input type="text" data-input data-role="src" value="${cmsEsc(src)}" placeholder="atau tempel URL / path file (opsional)" class="${CMS_INPUT_CLS}">
            ${isMedia ? `<input type="hidden" data-role="type" value="${cmsEsc(mtype)}">
            <input type="text" data-role="caption" value="${cmsEsc(caption)}" placeholder="Keterangan / caption (opsional)" class="${CMS_INPUT_CLS}">` : ''}
            ${mode === 'signature' ? `
            <button type="button" data-sig-toggle class="w-full py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700">✍️ Gambar tanda tangan langsung di layar</button>
            <div class="cms-sig hidden space-y-1.5">
                <canvas class="cms-sig-canvas w-full border border-dashed border-slate-300 rounded-lg bg-white" width="600" height="240" style="touch-action:none;height:120px"></canvas>
                <div class="flex gap-1.5">
                    <button type="button" data-sig-clear class="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700">Bersihkan</button>
                    <button type="button" data-sig-use class="flex-1 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-darkblue text-white text-[10px] font-bold">Gunakan tanda tangan ini</button>
                </div>
            </div>` : ''}
            ${infoHtml}
        </div>`;
}

function cmsUpSrcInput(wrap) { return wrap.querySelector('[data-role="src"]'); }
function cmsUpTypeInput(wrap) { return wrap.querySelector('[data-role="type"]'); }

function cmsUpRefresh(wrap) {
    const preview = wrap.querySelector('.cms-up-preview');
    const thumb = wrap.querySelector('.cms-up-thumb');
    const statusEl = wrap.querySelector('.cms-up-status');
    const nameEl = wrap.querySelector('.cms-up-name');
    const p = wrap._pending;
    const value = (cmsUpSrcInput(wrap).value || '').trim();
    if (!p && !value) { preview.classList.add('hidden'); preview.classList.remove('flex'); thumb.innerHTML = ''; return; }
    const kind = p ? p.kind : cmsGuessKind(value, cmsUpTypeInput(wrap) ? cmsUpTypeInput(wrap).value : '');
    const url = p ? p.objectUrl : value;
    thumb.innerHTML = '';
    const el = document.createElement(kind === 'video' ? 'video' : 'img');
    if (kind === 'video') { el.muted = true; el.playsInline = true; el.preload = 'metadata'; }
    el.className = 'w-full h-full object-cover';
    el.setAttribute('src', url);
    thumb.appendChild(el);
    if (p) {
        statusEl.textContent = (kind === 'video' ? 'Video' : 'Gambar') + ' siap diunggah saat Anda menekan Simpan';
        statusEl.className = 'cms-up-status text-[10px] font-bold text-amber-600';
        nameEl.textContent = p.origName + ' · ' + cmsFmtBytes(p.blob.size) + ' → uploads/' + p.folder + '/';
    } else {
        statusEl.textContent = /^uploads\//.test(value) ? 'Tersimpan di repository' : 'Memakai URL / path yang diketik';
        statusEl.className = 'cms-up-status text-[10px] font-bold text-emerald-600';
        nameEl.textContent = value;
    }
    preview.classList.remove('hidden');
    preview.classList.add('flex');
}
function cmsUpClearPending(wrap) {
    if (wrap._pending && wrap._pending.objectUrl) URL.revokeObjectURL(wrap._pending.objectUrl);
    wrap._pending = null;
}
function cmsUpSetPending(wrap, p) {
    cmsUpClearPending(wrap);
    p.objectUrl = URL.createObjectURL(p.blob);
    wrap._pending = p;
    const typeInput = cmsUpTypeInput(wrap);
    if (typeInput) typeInput.value = p.kind;
    cmsUpRefresh(wrap);
}
function cmsUpError(wrap, message) {
    if (typeof cmsToast === 'function') cmsToast(message, true);
    const nameEl = wrap.querySelector('.cms-up-name');
    if (nameEl) nameEl.textContent = message;
}

async function cmsUpHandleFile(wrap, file) {
    if (!file) return;
    const mode = wrap.dataset.mode;
    const isVideo = CMS_VID_TYPES.includes(file.type) || /\.(mp4|webm)$/i.test(file.name);
    const isImage = CMS_IMG_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    const kind = isVideo ? 'video' : isImage ? 'image' : null;
    const allowed = mode === 'media' ? ['image', 'video'] : mode === 'video' ? ['video'] : ['image'];
    if (!kind || !allowed.includes(kind)) {
        return cmsUpError(wrap, 'Format tidak didukung. Gunakan ' + (mode === 'media' ? 'gambar (JPG/PNG/WebP) atau video (MP4/WebM)' : cmsSpecFormats(allowed[0])) + '.');
    }
    const spec = cmsUpSpecFor(wrap, kind);
    if (!spec) return cmsUpError(wrap, 'Spesifikasi upload tidak ditemukan.');
    const statusEl = wrap.querySelector('.cms-up-status');
    try {
        let blob = file, ext;
        if (kind === 'image') {
            if (file.size > CMS_RAW_IMAGE_LIMIT_MB * CMS_MB) throw new Error('File terlalu besar (maks. ' + CMS_RAW_IMAGE_LIMIT_MB + ' MB sebelum dioptimasi).');
            const out = await cmsProcessImage(file, spec);
            blob = out.blob; ext = out.ext;
        } else {
            if (file.size > spec.maxMB * CMS_MB) throw new Error('Ukuran video ' + cmsFmtBytes(file.size) + ' melebihi batas ' + cmsSizeLabel(spec.maxMB) + '. Kompres video terlebih dahulu.');
            ext = /\.webm$/i.test(file.name) || file.type === 'video/webm' ? 'webm' : 'mp4';
        }
        cmsUpSetPending(wrap, {
            blob, kind, ext, folder: spec.folder, origName: file.name,
            filename: cmsSlugFileName(file.name, ext)
        });
    } catch (err) {
        cmsUpError(wrap, err.message);
        if (statusEl) statusEl.textContent = '';
    }
}

/** Unggah semua file yang menunggu di dalam `root`. Dipanggil sebelum menyimpan form. */
async function cmsFlushUploads(root, onStatus) {
    const wraps = Array.from(root.querySelectorAll('.cms-up')).filter(w => w._pending);
    for (let i = 0; i < wraps.length; i++) {
        const w = wraps[i], p = w._pending;
        if (onStatus) onStatus('Mengunggah file ' + (i + 1) + '/' + wraps.length + '…');
        const path = CMS_UPLOAD_ROOT + '/' + p.folder + '/' + p.filename;
        await cmsUploadFile(path, p.blob);
        cmsUpSrcInput(w).value = path;
        const typeInput = cmsUpTypeInput(w);
        if (typeInput) typeInput.value = p.kind;
        cmsUpClearPending(w);
        cmsUpRefresh(w);
    }
    return wraps.length;
}

// ----------------------------------------------------------
// EVENT DELEGASI UPLOADER (dropzone, klik, hapus, tanda tangan)
// ----------------------------------------------------------
(function cmsInitUploaderEvents() {
    if (window.__cmsUploaderEvents) return;
    window.__cmsUploaderEvents = true;

    document.addEventListener('click', (e) => {
        const drop = e.target.closest && e.target.closest('.cms-up-drop');
        if (drop) { drop.closest('.cms-up').querySelector('.cms-up-file').click(); return; }
        const clear = e.target.closest && e.target.closest('[data-up-clear]');
        if (clear) {
            const wrap = clear.closest('.cms-up');
            cmsUpClearPending(wrap);
            cmsUpSrcInput(wrap).value = '';
            const t = cmsUpTypeInput(wrap); if (t) t.value = '';
            cmsUpRefresh(wrap);
            return;
        }
        const tog = e.target.closest && e.target.closest('[data-sig-toggle]');
        if (tog) { tog.closest('.cms-up').querySelector('.cms-sig').classList.toggle('hidden'); return; }
        const sigClear = e.target.closest && e.target.closest('[data-sig-clear]');
        if (sigClear) {
            const c = sigClear.closest('.cms-sig').querySelector('canvas');
            c.getContext('2d').clearRect(0, 0, c.width, c.height); c._dirty = false; return;
        }
        const sigUse = e.target.closest && e.target.closest('[data-sig-use]');
        if (sigUse) {
            const wrap = sigUse.closest('.cms-up');
            const c = wrap.querySelector('.cms-sig-canvas');
            if (!c._dirty) { cmsUpError(wrap, 'Gambar tanda tangan terlebih dahulu di kotak putih.'); return; }
            c.toBlob((blob) => {
                if (!blob) return cmsUpError(wrap, 'Gagal membuat gambar tanda tangan.');
                cmsUpSetPending(wrap, { blob, kind: 'image', ext: 'png', folder: 'signature', origName: 'tanda-tangan-gambar.png', filename: cmsSlugFileName('tanda-tangan', 'png') });
                wrap.querySelector('.cms-sig').classList.add('hidden');
            }, 'image/png');
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('cms-up-drop')) {
            e.preventDefault(); e.target.closest('.cms-up').querySelector('.cms-up-file').click();
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList && e.target.classList.contains('cms-up-file')) {
            const wrap = e.target.closest('.cms-up');
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            cmsUpHandleFile(wrap, file);
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.dataset && e.target.dataset.role === 'src') {
            const wrap = e.target.closest('.cms-up');
            if (wrap) {
                cmsUpClearPending(wrap);
                const t = cmsUpTypeInput(wrap); if (t) t.value = cmsGuessKind(e.target.value, '');
                cmsUpRefresh(wrap);
            }
        }
    });

    // Drag & drop
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    document.addEventListener('dragover', (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        const drop = e.target.closest && e.target.closest('.cms-up-drop');
        document.querySelectorAll('.cms-up-drop.cms-drag').forEach(d => { if (d !== drop) d.classList.remove('cms-drag', 'border-brand-blue', 'bg-blue-50'); });
        if (drop) { drop.classList.add('cms-drag', 'border-brand-blue', 'bg-blue-50'); e.dataTransfer.dropEffect = 'copy'; }
        else e.dataTransfer.dropEffect = 'none';
    });
    document.addEventListener('dragleave', (e) => {
        const drop = e.target.closest && e.target.closest('.cms-up-drop');
        if (drop && !drop.contains(e.relatedTarget)) drop.classList.remove('cms-drag', 'border-brand-blue', 'bg-blue-50');
    });
    document.addEventListener('drop', (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault(); // cegah browser membuka file bila dilepas di luar dropzone
        const drop = e.target.closest && e.target.closest('.cms-up-drop');
        document.querySelectorAll('.cms-up-drop.cms-drag').forEach(d => d.classList.remove('cms-drag', 'border-brand-blue', 'bg-blue-50'));
        if (!drop) return;
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (e.dataTransfer.files.length > 1) { if (typeof cmsToast === 'function') cmsToast('Hanya 1 file per kolom. File pertama yang dipakai.'); }
        cmsUpHandleFile(drop.closest('.cms-up'), file);
    });

    // Kanvas tanda tangan (mouse / sentuh / pen)
    let drawing = null;
    const pos = (c, e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    document.addEventListener('pointerdown', (e) => {
        const c = e.target.closest && e.target.closest('.cms-sig-canvas');
        if (!c) return;
        e.preventDefault();
        drawing = c;
        try { c.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
        const ctx = c.getContext('2d');
        ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f172a';
        const [x, y] = pos(c, e);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y + 0.01); ctx.stroke();
        c._dirty = true;
    });
    document.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const [x, y] = pos(drawing, e);
        const ctx = drawing.getContext('2d');
        ctx.lineTo(x, y); ctx.stroke();
    });
    const endDraw = () => { drawing = null; };
    document.addEventListener('pointerup', endDraw);
    document.addEventListener('pointercancel', endDraw);
})();

// ----------------------------------------------------------
// MESIN FORM
// ----------------------------------------------------------
let cmsUidSeq = 0;
const CMS_REP_DEFS = {};

function cmsLabelHtml(text) {
    return `<label class="block text-[10px] font-bold text-slate-600 mb-1">${cmsEsc(text)}</label>`;
}
function cmsNormOptions(options) {
    return (options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o === '' ? '— pilih —' : o }));
}

/** Kontrol input sederhana (dipakai field biasa & sub-field repeater). */
function cmsInputHtml(f, value) {
    const type = f.type || 'text';
    const v = (value === undefined || value === null) ? '' : value;
    if (type === 'textarea') {
        return `<textarea data-input class="${CMS_INPUT_CLS}" rows="${f.rows || 3}" placeholder="${cmsEsc(f.placeholder || '')}">${cmsEsc(v)}</textarea>`;
    }
    if (type === 'lines') {
        return `<textarea data-input class="${CMS_INPUT_CLS}" rows="${f.rows || 4}" placeholder="${cmsEsc(f.placeholder || '')}">${cmsEsc(Array.isArray(v) ? v.join('\n') : v)}</textarea>`;
    }
    if (type === 'tags') {
        return `<input type="text" data-input value="${cmsEsc(Array.isArray(v) ? v.join(', ') : v)}" placeholder="${cmsEsc(f.placeholder || '')}" class="${CMS_INPUT_CLS}">`;
    }
    if (type === 'select') {
        const opts = cmsNormOptions(f.options).map(o => `<option value="${cmsEsc(o.value)}" ${String(v) === String(o.value) ? 'selected' : ''}>${cmsEsc(o.label)}</option>`).join('');
        return `<select data-input class="${CMS_INPUT_CLS}">${opts}</select>`;
    }
    if (type === 'bool') {
        const on = v === true || v === 'true';
        return `<select data-input class="${CMS_INPUT_CLS}"><option value="true" ${on ? 'selected' : ''}>${cmsEsc(f.yes || 'Ya')}</option><option value="false" ${on ? '' : 'selected'}>${cmsEsc(f.no || 'Tidak')}</option></select>`;
    }
    // text / number
    let listAttr = '', dl = '';
    if (f.suggest && f.suggest.length) {
        const id = 'dl' + (++cmsUidSeq);
        listAttr = ` list="${id}"`;
        dl = `<datalist id="${id}">${f.suggest.map(s => `<option value="${cmsEsc(s)}"></option>`).join('')}</datalist>`;
    }
    return `<input type="text" data-input${type === 'number' ? ' inputmode="decimal"' : ''} value="${cmsEsc(v)}" placeholder="${cmsEsc(f.placeholder || '')}"${listAttr} class="${CMS_INPUT_CLS}">${dl}`;
}

function cmsRepRowHtml(f, item) {
    item = item || {};
    const subs = f.fields.map(sf => `
        <div class="cms-sub" data-sub="${sf.key}" data-subtype="${sf.type || 'text'}">
            <label class="block text-[9px] font-bold text-slate-500 mb-0.5">${cmsEsc(sf.label)}</label>
            ${cmsInputHtml(sf, item[sf.key])}
        </div>`).join('');
    return `
        <div class="cms-rep-row rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1.5">
            <div class="flex items-center justify-between gap-1">
                <span class="cms-rep-title text-[10px] font-extrabold text-slate-500"></span>
                <span class="flex items-center gap-1">
                    <button type="button" data-rep-up title="Naik" class="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">↑</button>
                    <button type="button" data-rep-down title="Turun" class="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">↓</button>
                    <button type="button" data-rep-del class="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[9px] font-bold">Hapus</button>
                </span>
            </div>
            ${subs}
        </div>`;
}
function cmsRepeaterHtml(f, list) {
    const id = 'rep' + (++cmsUidSeq);
    CMS_REP_DEFS[id] = f;
    const rows = (Array.isArray(list) ? list : []).map(it => cmsRepRowHtml(f, it)).join('');
    return `
        <div class="cms-rep space-y-2" data-rep="${id}">
            <div class="cms-rep-rows space-y-2">${rows}</div>
            <button type="button" data-rep-add class="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-100">+ ${cmsEsc(f.addLabel || 'Tambah baris')}</button>
        </div>`;
}
function cmsRepRenumber(rep) {
    const def = CMS_REP_DEFS[rep.dataset.rep] || {};
    rep.querySelectorAll('.cms-rep-row').forEach((row, i) => {
        row.querySelector('.cms-rep-title').textContent = (def.itemName || 'Item') + ' ' + (i + 1);
    });
}
document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-rep-add],[data-rep-del],[data-rep-up],[data-rep-down]');
    if (!t) return;
    const rep = t.closest('.cms-rep'); if (!rep) return;
    const rows = rep.querySelector('.cms-rep-rows');
    if (t.hasAttribute('data-rep-add')) {
        const def = CMS_REP_DEFS[rep.dataset.rep];
        rows.insertAdjacentHTML('beforeend', cmsRepRowHtml(def, def.empty ? def.empty() : {}));
    } else {
        const row = t.closest('.cms-rep-row');
        if (t.hasAttribute('data-rep-del')) row.remove();
        else if (t.hasAttribute('data-rep-up') && row.previousElementSibling) rows.insertBefore(row, row.previousElementSibling);
        else if (t.hasAttribute('data-rep-down') && row.nextElementSibling) rows.insertBefore(row.nextElementSibling, row);
    }
    cmsRepRenumber(rep);
});

function cmsFieldHtml(f, value) {
    const type = f.type || 'text';
    const help = f.help ? `<p class="text-[9px] text-slate-400 mt-1 leading-relaxed">${cmsEsc(f.help)}</p>` : '';
    let body;
    if (type === 'image' || type === 'video' || type === 'media' || type === 'signature') body = cmsUploaderHtml(f, value);
    else if (type === 'repeater') body = cmsRepeaterHtml(f, value);
    else body = cmsInputHtml(f, value);
    const head = f.section
        ? `<div class="pt-2 mt-1 border-t border-slate-200"><h5 class="text-[11px] font-extrabold text-slate-800">${cmsEsc(f.section)}</h5>${f.sectionHelp ? `<p class="text-[9px] text-slate-400">${cmsEsc(f.sectionHelp)}</p>` : ''}</div>`
        : '';
    return `${head}<div class="cms-field" data-field="${f.key}" data-type="${type}">${cmsLabelHtml(f.label)}${body}${help}</div>`;
}
function cmsFormFieldsHtml(fields, data) {
    data = data || {};
    return fields.map(f => cmsFieldHtml(f, data[f.key])).join('');
}

function cmsReadInput(el, type) {
    const v = el.value;
    if (type === 'number') {
        const t = String(v).trim().replace(',', '.');
        if (t === '') return '';
        const n = Number(t);
        return isNaN(n) ? v : n;
    }
    if (type === 'bool') return v === 'true';
    if (type === 'lines') return v.split('\n').map(s => s.trim()).filter(Boolean);
    if (type === 'tags') return v.split(',').map(s => s.trim()).filter(Boolean);
    return v;
}

/** Baca semua nilai field dari sebuah form. media kosong => null (dihapus dari data). */
function cmsCollectForm(form) {
    const out = {};
    form.querySelectorAll('.cms-field').forEach(field => {
        const key = field.dataset.field, type = field.dataset.type;
        if (type === 'repeater') {
            const rows = [];
            field.querySelectorAll('.cms-rep-row').forEach(row => {
                const obj = {}; let hasText = false;
                row.querySelectorAll('.cms-sub').forEach(sub => {
                    const el = sub.querySelector('[data-input]');
                    const val = cmsReadInput(el, sub.dataset.subtype);
                    obj[sub.dataset.sub] = val;
                    if (sub.dataset.subtype !== 'bool' && String(val).trim() !== '') hasText = true;
                });
                if (hasText) rows.push(obj);
            });
            out[key] = rows;
        } else if (type === 'media') {
            const wrap = field.querySelector('.cms-up');
            const src = cmsUpSrcInput(wrap).value.trim();
            if (!src) { out[key] = null; return; }
            const t = cmsUpTypeInput(wrap).value || cmsGuessKind(src, '');
            out[key] = { type: t, src, caption: wrap.querySelector('[data-role="caption"]').value.trim() };
        } else if (type === 'image' || type === 'video' || type === 'signature') {
            out[key] = cmsUpSrcInput(field.querySelector('.cms-up')).value.trim();
        } else {
            const el = field.querySelector('[data-input]');
            if (el) out[key] = cmsReadInput(el, type);
        }
    });
    return out;
}
function cmsApplyValues(target, vals) {
    Object.keys(vals).forEach(k => { if (vals[k] === null) delete target[k]; else target[k] = vals[k]; });
    return target;
}

/** Jalankan aksi simpan dengan status tombol (mengunggah → menyimpan). */
async function cmsRunSave(form, fn) {
    const btn = form.querySelector('button[type="submit"]');
    const label = btn ? btn.textContent : '';
    if (btn) btn.disabled = true;
    const setStatus = (t) => { if (btn) btn.textContent = t; };
    try {
        return await fn(setStatus);
    } finally {
        if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = label; }
    }
}

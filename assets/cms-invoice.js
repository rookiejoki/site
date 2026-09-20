// ==========================================================
// ROOKIE JOKI - BUKTI TRANSAKSI: PRATINJAU, PRINT, BARCODE, TTD
// ==========================================================
// - Barcode Code 128 (subset B) digambar sebagai SVG murni di browser,
//   berisi ID Transaksi (mis. RK-1001) sehingga bisa dipindai scanner.
// - Tanda tangan sah admin: gambar TTD + nama + jabatan dari menu
//   "Bukti Transaksi & TTD" di Panel Admin (SITE_DATA.invoice).
// - Pratinjau tampil di jendela dalam halaman (iframe), lalu bisa
//   di-print / disimpan sebagai PDF lewat dialog cetak browser.
// ==========================================================

// Pola bar/spasi Code 128 (indeks 0-106). Angka = lebar modul, selang-seling bar,spasi,...
const CMS_CODE128 = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];

/** Nilai simbol Code 128-B untuk sebuah teks: [START B, ...karakter, CHECKSUM, STOP]. */
function cmsCode128Values(text) {
    const safe = String(text == null ? '' : text).replace(/[^\x20-\x7e]/g, '-');
    const vals = [104];
    let sum = 104;
    for (let i = 0; i < safe.length; i++) {
        const code = safe.charCodeAt(i) - 32;
        vals.push(code);
        sum += code * (i + 1);
    }
    vals.push(sum % 103);
    vals.push(106);
    return vals;
}

/** SVG barcode Code 128. moduleW = lebar 1 modul (px), height = tinggi bar (px). */
function cmsCode128Svg(text, opts) {
    opts = opts || {};
    const mw = opts.moduleW || 2, height = opts.height || 56, quiet = 10 * mw;
    const vals = cmsCode128Values(text);
    let x = quiet, rects = '';
    vals.forEach(v => {
        const pat = CMS_CODE128[v];
        for (let i = 0; i < pat.length; i++) {
            const w = Number(pat[i]) * mw;
            if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="${height}"/>`;
            x += w;
        }
    });
    const total = x + quiet;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="${total}" height="${height}" shape-rendering="crispEdges" fill="#000" role="img" aria-label="Barcode ${cmsEsc(text)}"><rect x="0" y="0" width="${total}" height="${height}" fill="#fff"/>${rects}</svg>`;
}

// ----------------------------------------------------------
// FORMAT
// ----------------------------------------------------------
function cmsFormatRupiah(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return '-';
    if (typeof v === 'number' || /^[\d.,\s]+$/.test(s)) {
        const digits = s.replace(/[^\d]/g, '');
        if (digits) return 'Rp ' + Number(digits).toLocaleString('id-ID');
    }
    return s;
}
function cmsNowLabel() {
    return new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const CMS_INVOICE_STATUS_STYLE = {
    'Pending': ['#fef3c7', '#b45309'],
    'On Process': ['#dbeafe', '#1d4ed8'],
    'Done': ['#d1fae5', '#047857'],
    'Dibatalkan': ['#ffe4e6', '#be123c']
};
const CMS_INVOICE_PAPERS = {
    A4: { label: 'A4', page: 'A4', margin: '14mm', width: '720px', font: '13px' },
    A5: { label: 'A5', page: 'A5', margin: '10mm', width: '520px', font: '12px' },
    STRUK: { label: 'Struk 80 mm', page: '80mm auto', margin: '3mm', width: '72mm', font: '10.5px' }
};

// ----------------------------------------------------------
// HTML BUKTI TRANSAKSI (dokumen mandiri, siap print)
// ----------------------------------------------------------
function cmsBuildInvoiceHtml(order, opts) {
    opts = Object.assign({ paper: 'A4', signature: true, barcode: true, autoPrint: false }, opts || {});
    const paper = CMS_INVOICE_PAPERS[opts.paper] || CMS_INVOICE_PAPERS.A4;
    const site = (typeof SITE_DATA !== 'undefined' && SITE_DATA) || {};
    const inv = site.invoice || {};
    const header = site.header || {};
    const phone = (site.meta && site.meta.adminPhone) || '';
    const biz = inv.businessName || header.title || 'Rookie Joki';
    const tagline = inv.businessTagline || header.tagline || '';
    const st = CMS_INVOICE_STATUS_STYLE[order.status] || ['#f1f5f9', '#334155'];
    const id = String(order.id || '-');
    const sigUrl = inv.signatureImage ? cmsAbsoluteUrl(inv.signatureImage) : '';
    const sigFallback = inv.signatureImage && /^uploads\//.test(inv.signatureImage) ? cmsRawUrlFor(inv.signatureImage) : '';
    const isStruk = opts.paper === 'STRUK';

    const kv = (label, value, strong) => `<tr><td class="k">${cmsEsc(label)}</td><td class="v${strong ? ' strong' : ''}">${value}</td></tr>`;
    const rows = [
        kv('Nama Pelanggan', cmsEsc(order.customer || '-')),
        kv('No. WhatsApp', cmsEsc(order.phone || '-')),
        kv('Layanan Dipesan', cmsEsc(order.service || '-')),
        kv('Worker', cmsEsc(order.worker || '-')),
        kv('Progres', cmsEsc(order.progress || '-')),
        kv('Status', `<span class="badge" style="background:${st[0]};color:${st[1]}">${cmsEsc(order.status || '-')}</span>`),
        kv('Metode Pembayaran', cmsEsc(order.paymentMethod || '-'))
    ].join('');
    const notes = order.note ? `<div class="note"><b>Catatan:</b> ${cmsEsc(order.note)}</div>` : '';

    const barcodeBlock = opts.barcode ? `
        <div class="barcode">
            ${cmsCode128Svg(id, { moduleW: 2, height: isStruk ? 44 : 56 })}
            <div class="bc-text">${cmsEsc(id)}</div>
        </div>` : '';

    const sigImg = opts.signature && sigUrl
        ? `<img class="sig-img" src="${cmsEsc(sigUrl)}" ${sigFallback ? `data-fb="${cmsEsc(sigFallback)}"` : ''} alt="Tanda tangan admin" onerror="if(this.dataset.fb&&!this.dataset.done){this.dataset.done=1;this.src=this.dataset.fb}">`
        : '';
    const signBlock = opts.signature ? `
        <div class="sign">
            <div class="sign-city">Hormat kami,</div>
            <div class="sign-biz">${cmsEsc(biz)}</div>
            <div class="sig-box">${sigImg || '<span class="sig-empty">(tanda tangan belum diatur)</span>'}</div>
            <div class="sign-name">${cmsEsc(inv.signerName || 'Admin')}</div>
            <div class="sign-role">${cmsEsc(inv.signerTitle || 'Administrator')}</div>
        </div>` : '<div></div>';

    const autoPrintScript = opts.autoPrint
        ? `<script>window.addEventListener('load',function(){var imgs=[].slice.call(document.images);Promise.all(imgs.map(function(i){return i.complete?1:new Promise(function(r){i.onload=i.onerror=r})})).then(function(){setTimeout(function(){window.print()},250)})});<\/script>`
        : '';

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bukti Transaksi ${cmsEsc(id)}</title>
<style>
@page { size: ${paper.page}; margin: ${paper.margin}; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #e2e8f0; font-size: ${paper.font}; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { width: ${paper.width}; max-width: 100%; margin: 12px auto; background: #fff; padding: ${isStruk ? '10px 8px' : '28px 30px'}; box-shadow: 0 4px 18px rgba(15,23,42,.15); }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 3px solid #0066FF; padding-bottom: 10px; ${isStruk ? 'flex-direction: column; text-align: center; align-items: center;' : ''} }
.biz { font-size: ${isStruk ? '15px' : '20px'}; font-weight: 800; color: #0066FF; letter-spacing: .3px; }
.tag { font-size: .85em; color: #64748b; }
.doc { text-align: ${isStruk ? 'center' : 'right'}; }
.doc h1 { margin: 0; font-size: ${isStruk ? '12px' : '15px'}; letter-spacing: 1.5px; font-weight: 800; }
.doc .meta { font-size: .85em; color: #475569; margin-top: 3px; }
.idbox { margin: 12px 0 6px; display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; border-radius: 8px; padding: 8px 12px; ${isStruk ? 'flex-direction: column; gap: 2px;' : ''} }
.idbox .lbl { font-size: .8em; color: #64748b; text-transform: uppercase; letter-spacing: .8px; }
.idbox .id { font-family: "Courier New", monospace; font-size: 1.25em; font-weight: 800; }
table.kv { width: 100%; border-collapse: collapse; margin-top: 6px; }
table.kv td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
table.kv td.k { width: 38%; color: #64748b; }
table.kv td.v { font-weight: 600; }
.badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: .85em; font-weight: 700; }
.total { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; background: #0066FF; color: #fff; border-radius: 8px; padding: 10px 14px; font-weight: 800; }
.total .amt { font-size: 1.35em; }
.note { margin-top: 8px; font-size: .92em; color: #334155; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px; }
.foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 16px; ${isStruk ? 'flex-direction: column; align-items: center;' : ''} }
.barcode { text-align: center; }
.barcode svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
.bc-text { font-family: "Courier New", monospace; font-size: .95em; letter-spacing: 2px; margin-top: 2px; }
.sign { text-align: center; min-width: ${isStruk ? '0' : '190px'}; }
.sign-city { font-size: .9em; color: #475569; }
.sign-biz { font-weight: 700; font-size: .95em; }
.sig-box { height: ${isStruk ? '56px' : '76px'}; display: flex; align-items: center; justify-content: center; }
.sig-img { max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-mode: multiply; }
.sig-empty { font-size: .75em; color: #94a3b8; font-style: italic; }
.sign-name { font-weight: 800; border-top: 1px solid #0f172a; padding-top: 3px; display: inline-block; min-width: 150px; }
.sign-role { font-size: .85em; color: #64748b; }
.terms { margin-top: 14px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: .82em; color: #64748b; text-align: center; }
.printed { margin-top: 4px; font-size: .78em; color: #94a3b8; text-align: center; }
@media print { body { background: #fff; } .sheet { box-shadow: none; margin: 0 auto; padding-left: 0; padding-right: 0; width: 100%; max-width: 100%; } }
</style></head>
<body>
<div class="sheet">
    <div class="top">
        <div>
            <div class="biz">${cmsEsc(biz)}</div>
            ${tagline ? `<div class="tag">${cmsEsc(tagline)}</div>` : ''}
            ${phone ? `<div class="tag">WhatsApp: +${cmsEsc(String(phone).replace(/^\+/, ''))}</div>` : ''}
        </div>
        <div class="doc">
            <h1>BUKTI TRANSAKSI</h1>
            <div class="meta">Tanggal: ${cmsEsc(order.date || '-')}</div>
        </div>
    </div>
    <div class="idbox"><span class="lbl">ID Transaksi</span><span class="id">${cmsEsc(id)}</span></div>
    <table class="kv">${rows}</table>
    <div class="total"><span>TOTAL PEMBAYARAN</span><span class="amt">${cmsEsc(cmsFormatRupiah(order.amount))}</span></div>
    ${notes}
    <div class="foot">
        ${barcodeBlock || '<div></div>'}
        ${signBlock}
    </div>
    <div class="terms">${cmsEsc(inv.terms || 'Simpan bukti ini sebagai referensi. Cek status pesanan kapan saja di website menggunakan ID Transaksi.')}</div>
    <div class="printed">${inv.footerNote ? cmsEsc(inv.footerNote) + ' · ' : ''}Dicetak: ${cmsEsc(cmsNowLabel())}</div>
</div>
${autoPrintScript}
</body></html>`;
}

// ----------------------------------------------------------
// JENDELA PRATINJAU (di dalam halaman) + PRINT
// ----------------------------------------------------------
const cmsInvoiceState = { order: null, paper: 'A4', signature: true, barcode: true };

function cmsInvoiceEnsureModal() {
    let m = document.getElementById('cmsInvoiceModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'cmsInvoiceModal';
    m.className = 'fixed inset-0 z-[70] hidden items-center justify-center p-2 bg-slate-950/75 backdrop-blur-sm';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-[900px] h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
            <div class="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <h3 class="font-bold text-slate-900 text-sm">Pratinjau Bukti Transaksi</h3>
                    <p id="cmsInvoiceSub" class="text-[10px] text-slate-500 truncate"></p>
                </div>
                <button type="button" onclick="cmsInvoiceClose()" aria-label="Tutup Pratinjau" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 text-base leading-none">✕</button>
            </div>
            <div class="px-3.5 py-2 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label class="flex items-center gap-1 text-[10px] font-semibold text-slate-600">Kertas
                    <select id="cmsInvoicePaper" class="ml-1 p-1 border border-slate-200 rounded-md text-[10px] bg-white">
                        <option value="A4">A4</option><option value="A5">A5</option><option value="STRUK">Struk 80 mm</option>
                    </select>
                </label>
                <label class="flex items-center gap-1 text-[10px] font-semibold text-slate-600"><input type="checkbox" id="cmsInvoiceSig" checked> Tanda tangan</label>
                <label class="flex items-center gap-1 text-[10px] font-semibold text-slate-600"><input type="checkbox" id="cmsInvoiceBar" checked> Barcode</label>
                <span class="flex-1"></span>
                <button type="button" onclick="cmsInvoiceOpenTab()" class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700">Buka di Tab Baru</button>
                <button type="button" onclick="cmsInvoicePrint()" class="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-darkblue text-white text-[10px] font-bold">🖨 Print / Simpan PDF</button>
            </div>
            <div id="cmsInvoiceWarn" class="hidden px-3.5 py-1.5 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-800"></div>
            <iframe id="cmsInvoiceFrame" title="Pratinjau Bukti Transaksi" class="flex-1 w-full bg-slate-200 border-0"></iframe>
        </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m) cmsInvoiceClose(); });
    m.querySelector('#cmsInvoicePaper').addEventListener('change', (e) => { cmsInvoiceState.paper = e.target.value; cmsInvoiceRender(); });
    m.querySelector('#cmsInvoiceSig').addEventListener('change', (e) => { cmsInvoiceState.signature = e.target.checked; cmsInvoiceRender(); });
    m.querySelector('#cmsInvoiceBar').addEventListener('change', (e) => { cmsInvoiceState.barcode = e.target.checked; cmsInvoiceRender(); });
    // Esc menutup pratinjau lebih dulu (sebelum handler Esc milik panel admin)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !m.classList.contains('hidden')) { e.stopImmediatePropagation(); cmsInvoiceClose(); }
    }, true);
    return m;
}

function cmsInvoiceRender(autoPrintAfterLoad) {
    const m = cmsInvoiceEnsureModal();
    const frame = m.querySelector('#cmsInvoiceFrame');
    const o = cmsInvoiceState.order;
    m.querySelector('#cmsInvoiceSub').textContent = (o.id || '-') + ' · ' + (o.customer || '-');
    const inv = (typeof SITE_DATA !== 'undefined' && SITE_DATA && SITE_DATA.invoice) || {};
    const warn = m.querySelector('#cmsInvoiceWarn');
    if (cmsInvoiceState.signature && !inv.signatureImage) {
        warn.innerHTML = 'Tanda tangan admin belum diatur. <button type="button" onclick="cmsInvoiceGoSettings()" class="underline font-bold">Atur sekarang</button>';
        warn.classList.remove('hidden');
    } else warn.classList.add('hidden');
    frame.onload = () => { if (autoPrintAfterLoad) { frame.onload = null; cmsInvoicePrint(); } };
    frame.srcdoc = cmsBuildInvoiceHtml(o, { paper: cmsInvoiceState.paper, signature: cmsInvoiceState.signature, barcode: cmsInvoiceState.barcode });
}

/** Buka pratinjau untuk objek order. autoPrint = langsung buka dialog cetak. */
function cmsInvoiceOpen(order, autoPrint) {
    const m = cmsInvoiceEnsureModal();
    cmsInvoiceState.order = Object.assign({}, order);
    m.querySelector('#cmsInvoicePaper').value = cmsInvoiceState.paper;
    m.querySelector('#cmsInvoiceSig').checked = cmsInvoiceState.signature;
    m.querySelector('#cmsInvoiceBar').checked = cmsInvoiceState.barcode;
    m.classList.remove('hidden');
    m.classList.add('flex');
    cmsInvoiceRender(!!autoPrint);
}
function cmsInvoiceClose() {
    const m = document.getElementById('cmsInvoiceModal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); const f = m.querySelector('iframe'); if (f) f.srcdoc = ''; }
}
function cmsInvoiceGoSettings() {
    cmsInvoiceClose();
    if (typeof cmsSwitchAdminSection === 'function') cmsSwitchAdminSection('invoice');
    if (typeof openAdminPanel === 'function') openAdminPanel();
}
async function cmsInvoicePrint() {
    const frame = document.getElementById('cmsInvoiceFrame');
    if (!frame || !frame.contentWindow) return;
    const doc = frame.contentDocument;
    // tunggu gambar (tanda tangan) selesai dimuat, maks. 4 detik
    if (doc) {
        await Promise.race([
            Promise.all(Array.from(doc.images).map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))),
            new Promise(r => setTimeout(r, 4000))
        ]);
    }
    frame.contentWindow.focus();
    frame.contentWindow.print();
    try { window.focus(); } catch (_) { /* abaikan */ }
}
function cmsInvoiceOpenTab() {
    const html = cmsBuildInvoiceHtml(cmsInvoiceState.order, { paper: cmsInvoiceState.paper, signature: cmsInvoiceState.signature, barcode: cmsInvoiceState.barcode, autoPrint: true });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = window.open(url, '_blank');
    if (!w && typeof cmsToast === 'function') cmsToast('Pop-up diblokir browser. Izinkan pop-up atau pakai tombol Print di pratinjau.', true);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ----------------------------------------------------------
// TITIK MASUK DARI PANEL ADMIN
// ----------------------------------------------------------
function cmsInvoiceFromList(index, autoPrint) {
    const o = (SITE_DATA.orders || [])[index];
    if (!o) return;
    cmsInvoiceOpen(o, autoPrint);
}
/** Pratinjau/print memakai isi form yang sedang diedit (belum perlu disimpan). */
function cmsInvoiceFromForm(btn, autoPrint) {
    const form = btn.closest('form');
    const base = (window.cmsEditCtx && window.cmsEditCtx.base) || {};
    cmsInvoiceOpen(Object.assign({}, base, cmsCollectForm(form)), autoPrint);
}

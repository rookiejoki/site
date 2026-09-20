// ==========================================================
// ROOKIE JOKI - STATIC JSON + GITHUB CONTENTS API STORAGE
// ==========================================================
// Public data: data.json (no LocalStorage, no database).
// Admin writes: GitHub Contents API. A fine-grained GitHub token
// is kept only in RAM for the current page session.
// Upload media (gambar/video) dari Panel Admin juga di-commit lewat
// GitHub Contents API ke folder  uploads/<jenis>/  di repository,
// lalu path relatifnya (mis. uploads/banner/promo-abc.jpg) disimpan
// di data.json.
// ==========================================================
const CMS_CONFIG = window.CMS_CONFIG || {};
const CMS_DATA_URL = CMS_CONFIG.dataUrl || 'data.json';
function cmsResolvedRepo(){
    if(CMS_CONFIG.repo) return CMS_CONFIG.repo;
    const host=location.hostname; const parts=location.pathname.split('/').filter(Boolean);
    if(host.endsWith('.github.io')) return host.split('.')[0]+'/'+(parts[0]||host.split('.')[0]+'.github.io');
    return '';
}
function cmsResolvedDataUrl(){
    if(CMS_CONFIG.dataUrl) return CMS_CONFIG.dataUrl;
    const repo=cmsResolvedRepo();
    if(repo) return 'https://raw.githubusercontent.com/'+repo+'/'+(CMS_CONFIG.branch||'main')+'/'+(CMS_CONFIG.dataPath||'data.json');
    return 'data.json';
}
let CMS_GITHUB_TOKEN = null;

function cmsSetGitHubToken(token){ CMS_GITHUB_TOKEN = String(token || '').trim(); }
function cmsClearGitHubToken(){ CMS_GITHUB_TOKEN = null; }
function cmsHasWriteToken(){ return !!CMS_GITHUB_TOKEN; }

function cmsDeepMerge(base, override) {
    if (Array.isArray(override)) return override;
    if (override === null || typeof override !== 'object') return override === undefined ? base : override;
    const result = { ...base };
    for (const key of Object.keys(override)) {
        if (base && typeof base === 'object' && !Array.isArray(base) &&
            override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = cmsDeepMerge(base[key], override[key]);
        } else result[key] = override[key];
    }
    return result;
}
async function cmsFetchServerData(){
    const url = cmsResolvedDataUrl() + (CMS_DATA_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
}
function cmsBase64Encode(text){
    const bytes = new TextEncoder().encode(text);
    let binary='';
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
}
function cmsGitHubHeaders(){
    return {
        'Accept':'application/vnd.github+json',
        'Authorization':'Bearer '+CMS_GITHUB_TOKEN,
        'X-GitHub-Api-Version':'2022-11-28',
        'Content-Type':'application/json'
    };
}
async function cmsSaveData(data){
    if(!CMS_GITHUB_TOKEN) throw new Error('GitHub Token belum diisi. Login kembali dan masukkan Fine-grained PAT.');
    const repo=cmsResolvedRepo();
    const branch=CMS_CONFIG.branch || 'main';
    const path=CMS_CONFIG.dataPath || 'data.json';
    if(!repo || !repo.includes('/')) throw new Error('CMS_CONFIG.repo belum dikonfigurasi (contoh: username/nama-repo).');
    const api='https://api.github.com/repos/'+repo+'/contents/'+path;
    const get=await fetch(api+'?ref='+encodeURIComponent(branch),{headers:cmsGitHubHeaders(),cache:'no-store'});
    if(!get.ok) throw new Error('Tidak dapat membaca data.json dari GitHub (HTTP '+get.status+').');
    const current=await get.json();
    const body={
        message: 'CMS: update data.json',
        content: cmsBase64Encode(JSON.stringify(data,null,2)+'\n'),
        sha: current.sha,
        branch
    };
    const put=await fetch(api,{method:'PUT',headers:cmsGitHubHeaders(),body:JSON.stringify(body)});
    const result=await put.json().catch(()=>null);
    if(!put.ok) throw new Error(result?.message || 'GitHub menolak penyimpanan (HTTP '+put.status+').');
    return result;
}

// ----------------------------------------------------------
// UPLOAD FILE MEDIA KE REPOSITORY (GitHub Contents API)
// ----------------------------------------------------------
const CMS_UPLOAD_ROOT = 'uploads';

function cmsBlobToBase64(blob){
    return new Promise((resolve,reject)=>{
        const r=new FileReader();
        r.onload=()=>{ const s=String(r.result||''); resolve(s.slice(s.indexOf(',')+1)); };
        r.onerror=()=>reject(new Error('Gagal membaca file untuk diunggah.'));
        r.readAsDataURL(blob);
    });
}
function cmsGitHubErrorMessage(status,fallback){
    if(status===401) return 'Token GitHub tidak valid atau sudah kedaluwarsa. Login ulang dengan token baru.';
    if(status===403) return 'GitHub menolak akses (izin token kurang / rate limit). Pastikan token punya izin Contents: Read and write.';
    if(status===404) return 'Repository tidak ditemukan atau token tidak punya akses ke repository ini.';
    if(status===409) return 'Terjadi bentrok commit di GitHub. Coba simpan lagi.';
    if(status===413) return 'File terlalu besar untuk GitHub API. Kecilkan ukuran file.';
    return fallback||('GitHub menolak permintaan (HTTP '+status+').');
}
/** Upload satu file (Blob/File) ke  uploads/<folder>/<nama>  di repository. Mengembalikan path relatif. */
async function cmsUploadFile(path, blob){
    if(!CMS_GITHUB_TOKEN) throw new Error('GitHub Token belum diisi. Login kembali dan masukkan Fine-grained PAT.');
    const repo=cmsResolvedRepo();
    const branch=CMS_CONFIG.branch || 'main';
    if(!repo || !repo.includes('/')) throw new Error('CMS_CONFIG.repo belum dikonfigurasi (contoh: username/nama-repo).');
    const content=await cmsBlobToBase64(blob);
    const api='https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
    let lastErr=null;
    for(let attempt=0; attempt<3; attempt++){
        const res=await fetch(api,{method:'PUT',headers:cmsGitHubHeaders(),
            body:JSON.stringify({message:'CMS: upload '+path,content,branch})});
        if(res.ok) return path;
        const info=await res.json().catch(()=>null);
        lastErr=new Error(cmsGitHubErrorMessage(res.status, info && info.message));
        if(res.status!==409) break;
        await new Promise(r=>setTimeout(r,700*(attempt+1)));
    }
    throw lastErr;
}
/** URL raw GitHub untuk file di repo (dipakai sebagai cadangan selama GitHub Pages belum selesai rebuild). */
function cmsRawUrlFor(path){
    const repo=cmsResolvedRepo(); if(!repo) return '';
    return 'https://raw.githubusercontent.com/'+repo+'/'+(CMS_CONFIG.branch||'main')+'/'+String(path).replace(/^\.?\//,'');
}
/** Ubah path relatif upload menjadi URL absolut (untuk halaman cetak / tab baru). */
function cmsAbsoluteUrl(src){
    if(!src) return '';
    try{ return new URL(src, document.baseURI).href; }catch(e){ return src; }
}
// Setelah upload, GitHub Pages butuh sekitar 1-2 menit untuk rebuild. Selama itu file
// baru bisa 404 di domain Pages. Listener ini otomatis mencoba raw.githubusercontent.com
// (tersedia langsung) sekali saja untuk gambar/video yang berada di folder uploads/.
document.addEventListener('error',function(e){
    const el=e.target; if(!el || !el.tagName) return;
    const tag=el.tagName; if(tag!=='IMG' && tag!=='SOURCE' && tag!=='VIDEO') return;
    const src=el.getAttribute('src')||'';
    if(!/^uploads\//.test(src) || el.dataset.cmsRetry) return;
    const raw=cmsRawUrlFor(src); if(!raw) return;
    el.dataset.cmsRetry='1';
    el.setAttribute('src',raw);
    if(tag==='SOURCE' && el.parentElement && el.parentElement.load) el.parentElement.load();
},true);

let SITE_DATA=null;
async function cmsInitSiteData(){
    let serverData=null;
    try{ serverData=await cmsFetchServerData(); }
    catch(e){ console.warn('CMS: data.json gagal dimuat; memakai data bawaan.',e); }
    const has=serverData && typeof serverData==='object' && Object.keys(serverData).length;
    SITE_DATA=has?cmsDeepMerge(JSON.parse(JSON.stringify(DEFAULT_SITE_DATA)),serverData):JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
    return SITE_DATA;
}
async function cmsPersist(){ await cmsSaveData(SITE_DATA); }
function cmsExportData(data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='rookie-joki-data-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function cmsImportDataFromFile(file,onDone){
    const reader=new FileReader();
    reader.onload=async e=>{
        try{
            const parsed=JSON.parse(e.target.result);
            if(!parsed || typeof parsed!=='object') throw new Error('Format JSON tidak valid.');
            SITE_DATA=parsed; await cmsPersist(); onDone(true,'Data berhasil diimpor ke GitHub.');
        }catch(err){ onDone(false,'Gagal mengimpor: '+err.message); }
    };
    reader.onerror=()=>onDone(false,'Gagal membaca file.');
    reader.readAsText(file);
}

// ==========================================================
// ROOKIE JOKI - CLIENT AUTH FOR STATIC GITHUB PAGES
// ==========================================================
// Important: GitHub Pages cannot keep passwords secret or execute
// server-side authentication. Passwords are SHA-256 hashes in the
// public JSON and are therefore only a light browser gate.
// The GitHub PAT is never written to LocalStorage/sessionStorage;
// it lives only in RAM until logout/reload.
// ==========================================================
let CMS_CURRENT_ADMIN = null;
const CMS_DEFAULT_PASSWORD='rookiejoki2026';

async function cmsSha256(text){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function cmsGetAdmins(){
    if(Array.isArray(SITE_DATA?.admins)) return SITE_DATA.admins;
    if(SITE_DATA?.admin) return [{id:1,username:SITE_DATA.admin.username||'admin',passwordHash:SITE_DATA.admin.passwordHash||''}];
    return [];
}
async function cmsEnsureAdminInitialized(){
    if(!Array.isArray(SITE_DATA.admins) || !SITE_DATA.admins.length){
        SITE_DATA.admins=[{id:1,username:'admin',passwordHash:await cmsSha256(CMS_DEFAULT_PASSWORD)}];
        SITE_DATA.admin=SITE_DATA.admins[0];
        // Do not auto-save: on GitHub Pages an unconfigured token must not block public pages.
    }
}
function cmsIsLoggedIn(){ return !!CMS_CURRENT_ADMIN; }
function cmsCurrentAdmin(){ return CMS_CURRENT_ADMIN; }

async function cmsLogin(username,password,githubToken){
    await cmsEnsureAdminInitialized();
    const hash=await cmsSha256(password);
    const admin=cmsGetAdmins().find(a=>String(a.username).trim()===username.trim() && a.passwordHash===hash);
    if(!admin) return false;
    if(!githubToken || !String(githubToken).trim()) throw new Error('Masukkan GitHub Fine-grained Token agar Panel Admin dapat menyimpan perubahan ke data.json.');
    cmsSetGitHubToken(githubToken);
    CMS_CURRENT_ADMIN={id:admin.id,username:admin.username};
    return true;
}
function cmsLogout(){ CMS_CURRENT_ADMIN=null; cmsClearGitHubToken(); }
async function cmsChangeCredentials(currentPassword,newUsername,newPassword){
    const me=cmsCurrentAdmin();
    if(!me) return {ok:false,message:'Belum login.'};
    const hash=await cmsSha256(currentPassword);
    const admins=cmsGetAdmins();
    const idx=admins.findIndex(a=>a.id===me.id);
    if(idx<0 || admins[idx].passwordHash!==hash) return {ok:false,message:'Kata sandi saat ini salah.'};
    if(newUsername?.trim()) admins[idx].username=newUsername.trim();
    if(newPassword?.trim()) admins[idx].passwordHash=await cmsSha256(newPassword.trim());
    SITE_DATA.admins=admins;
    SITE_DATA.admin=admins[0];
    await cmsPersist();
    CMS_CURRENT_ADMIN={id:admins[idx].id,username:admins[idx].username};
    return {ok:true,message:'Kredensial berhasil diperbarui.'};
}
async function cmsAdminCreate(username,password){
    username=String(username||'').trim(); password=String(password||'');
    if(!username||!password) throw new Error('Username dan password wajib diisi.');
    const admins=cmsGetAdmins();
    if(admins.some(a=>a.username.toLowerCase()===username.toLowerCase())) throw new Error('Username sudah digunakan.');
    admins.push({id:Date.now(),username,passwordHash:await cmsSha256(password)});
    SITE_DATA.admins=admins; SITE_DATA.admin=admins[0];
    await cmsPersist(); return admins[admins.length-1];
}
async function cmsAdminUpdate(id,username,password){
    const admins=cmsGetAdmins(); const a=admins.find(x=>x.id===id);
    if(!a) throw new Error('Admin tidak ditemukan.');
    username=String(username||'').trim();
    if(!username) throw new Error('Username wajib diisi.');
    if(admins.some(x=>x.id!==id && x.username.toLowerCase()===username.toLowerCase())) throw new Error('Username sudah digunakan.');
    a.username=username;
    if(String(password||'').trim()) a.passwordHash=await cmsSha256(password.trim());
    SITE_DATA.admins=admins; SITE_DATA.admin=admins[0];
    await cmsPersist();
    if(CMS_CURRENT_ADMIN?.id===id) CMS_CURRENT_ADMIN={id,username};
    return a;
}
async function cmsAdminDelete(id){
    const admins=cmsGetAdmins();
    if(admins.length<=1) throw new Error('Minimal harus ada 1 admin.');
    const idx=admins.findIndex(x=>x.id===id); if(idx<0) throw new Error('Admin tidak ditemukan.');
    if(CMS_CURRENT_ADMIN?.id===id) throw new Error('Anda tidak dapat menghapus admin yang sedang login.');
    admins.splice(idx,1); SITE_DATA.admins=admins; SITE_DATA.admin=admins[0]; await cmsPersist();
}

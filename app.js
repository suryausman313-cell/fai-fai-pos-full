/* scripts/app.js */
const DB_KEY = 'fai_fai_full_v3';
const DEFAULT_DB = {
  settings:{storeName:'FAI FAI JUICE',currency:'AED'},
  categories:[{id:'c-juice',name:'Juice'},{id:'c-ice',name:'Ice Cream'}],
  products:[], // {id,name,cat,price}
  users:[{id:'u-admin', email:'admin@313', pass:'246800', role:'admin'}],
  orders:[], sales:[]
};

function loadDB(){ try{
  const raw = localStorage.getItem(DB_KEY);
  if(!raw){ localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB)); return structuredClone(DEFAULT_DB); }
  return JSON.parse(raw);
}catch(e){ localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB)); return structuredClone(DEFAULT_DB); } }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }
function fmtMoney(v){ const db = loadDB(); return (db.settings.currency||'AED') + ' ' + Number(v||0).toFixed(2); }

window.POSDB = {
  loadDB, saveDB, uid, fmtMoney
};

/* small helper to protect admin pages */
window.Protect = {
  requireAdmin: function(){
    const user = localStorage.getItem('pos_user');
    if(!user){ alert('Please Login First'); window.location.href='login.html'; return false; }
    try{ const u = JSON.parse(user); if(u.role!=='admin'){ alert('Admin only'); window.location.href='index.html'; return false; } }catch(e){ window.location.href='login.html'; return false;}
    return true;
  }
};

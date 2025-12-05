/* app.js - shared helpers + data model (localStorage) */
const DB_KEY = 'fai_fai_full_v2';
const SW_VERSION = 'v1';

const DEFAULT_DB = {
  products: [],   // {id,name,price,cat}
  orders: [],     // kitchen orders {id,items,table,status,created}
  sales: [],      // completed sales/receipts
  staff: [{id:'admin',name:'Admin',role:'admin',pass:'admin123'}],
  settings: {currency:'AED', storeName:'FAI FAI JUICE'},
  printers: {}
};

function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw){
      localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
      return structuredClone(DEFAULT_DB);
    }
    return JSON.parse(raw);
  }catch(e){
    console.error('loadDB err',e);
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return structuredClone(DEFAULT_DB);
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

/* products */
function getProducts(){ return loadDB().products; }
function setProducts(list){ const db=loadDB(); db.products=list; saveDB(db); }
function addProduct(p){ const db=loadDB(); db.products.push(p); saveDB(db); }

/* orders / kitchen */
function createKitchenOrder(order){
  const db = loadDB();
  db.orders.push(order);
  saveDB(db);
}
function updateKitchenOrder(id, patch){
  const db = loadDB();
  db.orders = db.orders.map(o=> o.id===id ? Object.assign({},o,patch) : o);
  saveDB(db);
}
function removeKitchenOrder(id){
  const db = loadDB();
  db.orders = db.orders.filter(o=>o.id!==id);
  saveDB(db);
}

/* sales */
function addSale(sale){
  const db = loadDB();
  db.sales.push(sale);
  saveDB(db);
}

/* utils */
function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }
function fmtMoney(v){ const db = loadDB(); return (db.settings.currency||'AED') + ' ' + Number(v).toFixed(2); }

/* Firebase placeholder: if you later add firebase-config.js with initFirebase() function,
   you can enable realtime mode. This file currently does nothing but is a ready hook.
*/
async function tryEnableFirebaseRealtime(){
  if(typeof initFirebase === 'function'){
    try{
      await initFirebase(); // user provided init
      console.log('Firebase init requested');
    }catch(e){ console.warn('firebase init failed',e); }
  }
}

/* expose */
window.POSDB = {
  loadDB, saveDB, getProducts, setProducts, addProduct,
  createKitchenOrder, updateKitchenOrder, removeKitchenOrder, addSale,
  uid, fmtMoney
};

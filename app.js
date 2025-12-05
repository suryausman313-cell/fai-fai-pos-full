/* FAI FAI POS — FULL APP ENGINE (Admin + Cashier + Waiter + Kitchen) */

/* ========== GLOBAL CONFIG ========== */
const DB_KEY = "fai_fai_pos_v3";

/* ========== DEFAULT DATABASE ========= */
const DEFAULT_DB = {
  products: [],
  orders: [],
  sales: [],
  expenses: [],
  registers: [],
  staff: [
    { id: "admin", name: "Admin", role: "admin", pass: "admin123" }
  ],
  settings: {
    storeName: "FAI FAI POS",
    currency: "AED"
  }
};

/* ========== ROLE PERMISSIONS ========== */
const ROLE_PERMISSIONS = {
  admin: {
    dashboard: true,
    products: true,
    orders: true,
    sales: true,
    staff: true,
    settings: true
  },
  cashier: {
    dashboard: true,
    products: false,
    orders: true,
    sales: true,
    staff: false,
    settings: false
  },
  waiter: {
    dashboard: true,
    products: false,
    orders: true,
    sales: false,
    staff: false,
    settings: false
  },
  kitchen: {
    dashboard: true,
    products: false,
    orders: true,
    sales: false,
    staff: false,
    settings: false
  }
};

function can(role, feature) {
  return ROLE_PERMISSIONS[role]?.[feature] === true;
}

/* ========== DATABASE FUNCTIONS ========== */
function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return structuredClone(DEFAULT_DB);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB load failed", e);
    return structuredClone(DEFAULT_DB);
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/* ========== UTILS ========== */
function uid(pre = "id") {
  return pre + "_" + Math.random().toString(36).substr(2, 9);
}

function fmtMoney(v) {
  const db = loadDB();
  return (db.settings.currency || "AED") + " " + Number(v).toFixed(2);
}

/* ========== AUTH SYSTEM ========== */
function loginUser(id, pass) {
  const db = loadDB();
  const u = db.staff.find(s => s.id === id && s.pass === pass);
  if (!u) return null;

  localStorage.setItem("pos_logged_user", JSON.stringify(u));
  return u;
}

function getLoggedUser() {
  try {
    return JSON.parse(localStorage.getItem("pos_logged_user"));
  } catch {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem("pos_logged_user");
}

function protectPage(feature) {
  const u = getLoggedUser();
  if (!u) {
    alert("Please Login First");
    location.href = "index.html";
    return;
  }
  if (!can(u.role, feature)) {
    alert("Access Denied");
    history.back();
  }
}

/* ========== PRODUCT FUNCTIONS ========== */
function getProducts() {
  return loadDB().products;
}

function addProduct(p) {
  const db = loadDB();
  db.products.push(p);
  saveDB(db);
}

function updateProduct(id, patch) {
  const db = loadDB();
  db.products = db.products.map(p => (p.id === id ? { ...p, ...patch } : p));
  saveDB(db);
}

function removeProduct(id) {
  const db = loadDB();
  db.products = db.products.filter(p => p.id !== id);
  saveDB(db);
}

/* ========== ORDER FUNCTIONS ========== */
function createOrder(o) {
  const db = loadDB();
  db.orders.push(o);
  saveDB(db);
}

function updateOrder(id, patch) {
  const db = loadDB();
  db.orders = db.orders.map(o => (o.id === id ? { ...o, ...patch } : o));
  saveDB(db);
}

function removeOrder(id) {
  const db = loadDB();
  db.orders = db.orders.filter(o => o.id !== id);
  saveDB(db);
}

/* ========== SALES ========== */
function addSale(s) {
  const db = loadDB();
  db.sales.push(s);
  saveDB(db);
}

/* ========== STAFF CRUD ========== */
function getStaff() {
  return loadDB().staff;
}

function addStaff(st) {
  const db = loadDB();
  db.staff.push(st);
  saveDB(db);
}

function updateStaff(id, patch) {
  const db = loadDB();
  db.staff = db.staff.map(s => (s.id === id ? { ...s, ...patch } : s));
  saveDB(db);
}

function removeStaff(id) {
  const db = loadDB();
  db.staff = db.staff.filter(s => s.id !== id);
  saveDB(db);
}

/* ========== SETTINGS ========== */
function saveSettings(obj) {
  const db = loadDB();
  db.settings = { ...db.settings, ...obj };
  saveDB(db);
}

/* ========== EXPORT TO WINDOW ========== */
window.POS = {
  loadDB,
  saveDB,
  uid,
  fmtMoney,

  // products
  getProducts,
  addProduct,
  updateProduct,
  removeProduct,

  // orders
  createOrder,
  updateOrder,
  removeOrder,

  // sales
  addSale,

  // staff
  getStaff,
  addStaff,
  updateStaff,
  removeStaff,

  // settings
  saveSettings,

  // auth
  loginUser,
  getLoggedUser,
  logoutUser,
  protectPage
};

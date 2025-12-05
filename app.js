/* ===============================================
   FAI FAI POS — FULL UPGRADED DATABASE ENGINE
   Admin + Cashier + Waiter Roles + Dashboard Data
   =============================================== */

const DB_KEY = "fai_fai_pos_v3";

/* DEFAULT DATABASE */
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
    storeName: "FAI FAI JUICE",
    currency: "AED",
    tax: 0,
    service: 0
  },
  printers: {
    kitchen: null,
    cashier: null
  }
};

/* ------------------ CORE DB ------------------ */
function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      saveDB(DEFAULT_DB);
      return structuredClone(DEFAULT_DB);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB Load Error", e);
    saveDB(DEFAULT_DB);
    return structuredClone(DEFAULT_DB);
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/* ------------------ STAFF SYSTEM ------------------ */
function addStaff(user) {
  const db = loadDB();
  db.staff.push(user);
  saveDB(db);
}

function loginStaff(id, pass) {
  const db = loadDB();
  return db.staff.find((u) => u.id === id && u.pass === pass) || null;
}

function updateStaffPassword(id, newPass) {
  const db = loadDB();
  db.staff = db.staff.map((x) =>
    x.id === id ? { ...x, pass: newPass } : x
  );
  saveDB(db);
}

/* ------------------ PRODUCTS ------------------ */
function getProducts() {
  return loadDB().products;
}

function addProduct(p) {
  const db = loadDB();
  db.products.push(p);
  saveDB(db);
}

function setProducts(list) {
  const db = loadDB();
  db.products = list;
  saveDB(db);
}

/* ------------------ ORDERS (Kitchen + Hold) ------------------ */
function createKitchenOrder(order) {
  const db = loadDB();
  db.orders.push(order);
  saveDB(db);
}

function updateKitchenOrder(id, patch) {
  const db = loadDB();
  db.orders = db.orders.map((o) =>
    o.id === id ? { ...o, ...patch } : o
  );
  saveDB(db);
}

function removeKitchenOrder(id) {
  const db = loadDB();
  db.orders = db.orders.filter((x) => x.id !== id);
  saveDB(db);
}

/* ------------------ SALES (Cashier Checkout) ------------------ */
function addSale(sale) {
  const db = loadDB();
  db.sales.push(sale);
  saveDB(db);
}

/* ------------------ EXPENSES ------------------ */
function addExpense(obj) {
  const db = loadDB();
  db.expenses.push(obj);
  saveDB(db);
}

/* ------------------ REGISTERS ------------------ */
function addRegister(day) {
  const db = loadDB();
  db.registers.push(day);
  saveDB(db);
}

/* ------------------ DASHBOARD HELPERS ------------------ */
function getTodaySalesTotal() {
  const today = new Date().toISOString().slice(0, 10);
  const db = loadDB();
  return db.sales
    .filter((s) => s.date.startsWith(today))
    .reduce((t, x) => t + Number(x.total), 0);
}

function getTodayOrdersCount() {
  const today = new Date().toISOString().slice(0, 10);
  return loadDB().orders.filter((o) =>
    o.created.startsWith(today)
  ).length;
}

function getMonthlyData() {
  const m = new Date().toISOString().slice(0, 7);
  const db = loadDB();
  return {
    sales: db.sales.filter((s) => s.date.startsWith(m)),
    expenses: db.expenses.filter((e) => e.date.startsWith(m))
  };
}

/* ------------------ TOOLS ------------------ */
function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function fmtMoney(val) {
  const db = loadDB();
  return (db.settings.currency || "AED") + " " + Number(val).toFixed(2);
}

/* -------------- EXPORT API -------------- */
window.POSDB = {
  loadDB,
  saveDB,

  getProducts,
  addProduct,
  setProducts,

  createKitchenOrder,
  updateKitchenOrder,
  removeKitchenOrder,

  addSale,

  addExpense,
  addRegister,

  addStaff,
  loginStaff,
  updateStaffPassword,

  getTodaySalesTotal,
  getTodayOrdersCount,
  getMonthlyData,

  uid,
  fmtMoney
};

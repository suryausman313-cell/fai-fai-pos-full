/* scripts/admin.js */
if(!window.Protect.requireAdmin()) throw new Error('Protected');

// helpers
function refreshCats(){ const db = POSDB.loadDB(); const el=document.getElementById('catList'); el.innerHTML = db.categories.map(c=>`<div>${c.name} <button data-id="${c.id}" class="delCat">Delete</button></div>`).join(''); 
const sel = document.getElementById('pcat'); sel.innerHTML = db.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); }
function refreshProducts(){ const db = POSDB.loadDB(); const el=document.getElementById('productList'); el.innerHTML = db.products.map(p=>`<div><b>${p.name}</b> (${db.categories.find(c=>c.id===p.cat)?.name||'?'}) - ${POSDB.fmtMoney(p.price)} <button data-id="${p.id}" class="delProd">Del</button></div>`).join(''); }
function refreshUsers(){ const db = POSDB.loadDB(); const el=document.getElementById('userList'); el.innerHTML = db.users.map(u=>`<div>${u.email} [${u.role}] <button data-id="${u.id}" class="delUser">Del</button></div>`).join(''); }

// events
document.getElementById('addCat').addEventListener('click', ()=>{
  const name = document.getElementById('catName').value.trim(); if(!name) return alert('Name'); const db = POSDB.loadDB();
  db.categories.push({id:POSDB.uid('c'),name}); POSDB.saveDB(db); document.getElementById('catName').value=''; refreshCats();
});

document.getElementById('addProd').addEventListener('click', ()=>{
  const name=document.getElementById('pname').value.trim(); const price=parseFloat(document.getElementById('pprice').value)||0; const cat=document.getElementById('pcat').value;
  if(!name) return alert('Name required'); const db = POSDB.loadDB(); db.products.push({id:POSDB.uid('p'),name,price,cat}); POSDB.saveDB(db); document.getElementById('pname').value=''; document.getElementById('pprice').value=''; refreshProducts();
});

document.getElementById('addUser').addEventListener('click', ()=>{
  const email=document.getElementById('uemail').value.trim(); const pass=document.getElementById('upass').value.trim(); const role=document.getElementById('urole').value;
  if(!email||!pass) return alert('enter'); const db = POSDB.loadDB(); db.users.push({id:POSDB.uid('u'),email,pass,role}); POSDB.saveDB(db); document.getElementById('uemail').value=''; document.getElementById('upass').value=''; refreshUsers();
});

document.getElementById('importSample').addEventListener('click', async ()=>{
  try{ const r = await fetch('products.json'); const data = await r.json(); const db = POSDB.loadDB();
    data.forEach(p=>{ if(!db.products.find(x=>x.name===p.name)) db.products.push(Object.assign({id:POSDB.uid('p')},p)); });
    POSDB.saveDB(db); alert('Imported'); refreshProducts();
  }catch(e){alert('Import failed');console.error(e)}
});

document.getElementById('saveSettings').addEventListener('click', ()=>{
  const db = POSDB.loadDB(); db.settings.storeName=document.getElementById('storeNameAdmin').value || db.settings.storeName; db.settings.currency=document.getElementById('currencyAdmin').value || db.settings.currency; POSDB.saveDB(db); alert('Saved');
});

// delegated delete handlers
document.addEventListener('click', (ev)=>{
  if(ev.target.classList.contains('delProd')){
    if(!confirm('Delete product?')) return; const id=ev.target.dataset.id; const db=POSDB.loadDB(); db.products=db.products.filter(p=>p.id!==id); POSDB.saveDB(db); refreshProducts();
  }
  if(ev.target.classList.contains('delUser')){ if(!confirm('Delete user?')) return; const id=ev.target.dataset.id; const db=POSDB.loadDB(); db.users=db.users.filter(u=>u.id!==id); POSDB.saveDB(db); refreshUsers();}
  if(ev.target.classList.contains('delCat')){ if(!confirm('Delete category?')) return; const id=ev.target.dataset.id; const db=POSDB.loadDB(); db.categories=db.categories.filter(c=>c.id!==id); POSDB.saveDB(db); refreshCats(); refreshProducts();}
});

document.getElementById('saveSettings').addEventListener('click', ()=>{
  const db=POSDB.loadDB(); db.settings.storeName = document.getElementById('storeNameAdmin').value || db.settings.storeName; db.settings.currency = document.getElementById('currencyAdmin').value || db.settings.currency; POSDB.saveDB(db); alert('Saved');
});

function logout(){ localStorage.removeItem('pos_user'); window.location.href='login.html'; }

// init
(function initAdmin(){
  const db=POSDB.loadDB(); document.getElementById('storeNameAdmin').value=db.settings.storeName || ''; document.getElementById('currencyAdmin').value=db.settings.currency || 'AED';
  refreshCats(); refreshProducts(); refreshUsers();
})();
window.logout = logout;

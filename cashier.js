/* scripts/cashier.js */
(function initCashier(){
  const db=POSDB.loadDB();
  const catEl = document.getElementById('categories');
  const itemsEl = document.getElementById('items');
  const cart = [];

  function renderCats(){
    const db=POSDB.loadDB();
    catEl.innerHTML = db.categories.map(c=>`<button class="catBtn" data-id="${c.id}">${c.name}</button>`).join('');
  }
  function renderItemsFor(catId){
    const db=POSDB.loadDB();
    const list = db.products.filter(p=>p.cat===catId);
    document.getElementById('catTitle').innerText = db.categories.find(x=>x.id===catId)?.name || 'Menu';
    itemsEl.innerHTML = list.map(p=>`<div class="item"><b>${p.name}</b><div>${POSDB.fmtMoney(p.price)}</div><button class="add" data-id="${p.id}">Add</button></div>`).join('');
  }
  function updateCartUI(){
    const el = document.getElementById('cartList'); if(!el) return;
    el.innerHTML = cart.map((it,idx)=>`<div>${it.name} x${it.qty} <span>${POSDB.fmtMoney(it.qty*it.price)}</span> <button data-i="${idx}" class="rm">-</button></div>`).join('');
    document.getElementById('cartCount').innerText = cart.reduce((s,i)=>s+i.qty,0);
    document.getElementById('grandTotal').innerText = POSDB.fmtMoney(cart.reduce((s,i)=>s+i.price*i.qty,0));
  }
  function addToCart(id){
    const db=POSDB.loadDB(); const p = db.products.find(x=>x.id===id); if(!p) return;
    const ex = cart.find(x=>x.id===id); if(ex) ex.qty++; else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
    updateCartUI();
  }
  document.addEventListener('click', (ev)=>{
    if(ev.target.classList.contains('catBtn')) renderItemsFor(ev.target.dataset.id);
    if(ev.target.classList.contains('add')) addToCart(ev.target.dataset.id);
    if(ev.target.classList.contains('rm')) { const idx = parseInt(ev.target.dataset.i); if(cart[idx].qty>1) cart[idx].qty--; else cart.splice(idx,1); updateCartUI(); }
  });

  document.getElementById('checkoutBtn').addEventListener('click', ()=>{
    if(cart.length===0) return alert('Cart empty');
    const db = POSDB.loadDB();
    const sale = {id:POSDB.uid('s'), items:cart.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty})), total:cart.reduce((s,i)=>s+i.price*i.qty,0), created: new Date().toISOString()};
    db.sales.push(sale); POSDB.saveDB(db);
    // Print receipt in new window (simple)
    const w = window.open('','_blank','width=300,height=600'); const html = generateReceiptHtml(sale, db.settings);
    w.document.write(html); w.document.close();
    cart.length=0; updateCartUI(); alert('Sale saved + printing window opened');
  });

  function generateReceiptHtml(sale, settings){
    const itemsHtml = sale.items.map(it=>`<div style="display:flex;justify-content:space-between"><div>${it.name} x${it.qty}</div><div>${POSDB.fmtMoney(it.price*it.qty)}</div></div>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>body{font-family:Arial;padding:10px} h2{text-align:center}</style></head><body>
      <h2>${settings.storeName||'Store'}</h2>
      <div>${new Date(sale.created).toLocaleString()}</div>
      <hr>${itemsHtml}<hr>
      <div style="display:flex;justify-content:space-between"><b>Total</b><b>${POSDB.fmtMoney(sale.total)}</b></div>
      <div style="margin-top:20px;text-align:center">Thank you</div>
    </body></html>`;
  }

  // initial render
  renderCats();
  if(db.categories.length) renderItemsFor(db.categories[0].id);

  // quick settings save
  document.getElementById('saveQuick').addEventListener('click', ()=>{
    const db=POSDB.loadDB(); db.settings.currency=document.getElementById('currency').value||db.settings.currency; db.settings.storeName=document.getElementById('storeName').value||db.settings.storeName; POSDB.saveDB(db); alert('Saved');
  });

})();

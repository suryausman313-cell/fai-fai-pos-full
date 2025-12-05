// script.js - core logic (single file for simplicity)

(function(){
  // --- helpers ---
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function toMoney(n){ return parseFloat(n).toFixed(2); }
  function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }

  // --- storage keys ---
  const KEY = { PRODUCTS:'ff_products_v1', ORDERS:'ff_orders_v1' };

  // --- seed products if empty ---
  function seedProducts(){
    const raw = localStorage.getItem(KEY.PRODUCTS);
    if(!raw){
      // load bundled products.json via fetch (if available), fallback to default
      fetch('products.json').then(r=>{
        if(r.ok) return r.json();
        return [
          {"id":"p-juice","name":"Juice","price":12,"category":"Drinks"},
          {"id":"p-ic","name":"Icecream","price":5,"category":"Snacks"}
        ];
      }).then(data=>{
        localStorage.setItem(KEY.PRODUCTS, JSON.stringify(data));
      }).catch(err=>{
        localStorage.setItem(KEY.PRODUCTS, JSON.stringify([
          {"id":"p-juice","name":"Juice","price":12,"category":"Drinks"},
          {"id":"p-ic","name":"Icecream","price":5,"category":"Snacks"}
        ]));
      });
    }
  }

  // --- products utilities ---
  function getProducts(){
    const raw = localStorage.getItem(KEY.PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  }
  function saveProducts(list){
    localStorage.setItem(KEY.PRODUCTS, JSON.stringify(list));
  }

  // --- orders utilities (cashier + waiter) ---
  function getOrders(){ return JSON.parse(localStorage.getItem(KEY.ORDERS)||'[]'); }
  function saveOrders(o){ localStorage.setItem(KEY.ORDERS, JSON.stringify(o)); }

  // --- ADMIN page ---
  function initAdmin(){
    const pList = qs('#productList');
    const name = qs('#pName'), price = qs('#pPrice'), cat = qs('#pCategory');
    const addBtn = qs('#addProductBtn'), exportBtn = qs('#exportBtn');
    const clearBtn = qs('#clearProducts');

    function render(){
      const arr = getProducts();
      pList.innerHTML = '';
      arr.forEach(p=>{
        const li = document.createElement('li');
        li.innerHTML = `<b>${p.name}</b> — ${toMoney(p.price)} <small>${p.category || ''}</small>
          <div class="tiny">
            <button class="edit" data-id="${p.id}">Edit</button>
            <button class="del" data-id="${p.id}">Delete</button>
          </div>`;
        pList.appendChild(li);
      });
      qsa('#productList .del').forEach(b=>{
        b.onclick = ()=>{ const id=b.dataset.id; const arr=getProducts().filter(x=>x.id!==id); saveProducts(arr); render(); };
      });
      qsa('#productList .edit').forEach(b=>{
        b.onclick = ()=>{
          const id=b.dataset.id;
          const arr=getProducts();
          const p = arr.find(x=>x.id===id);
          name.value = p.name; price.value = p.price; cat.value = p.category||'';
          addBtn.textContent = 'Update';
          addBtn.onclick = ()=>{
            p.name = name.value; p.price = parseFloat(price.value)||0; p.category = cat.value;
            saveProducts(arr); render();
            addBtn.textContent = 'Add'; name.value=''; price.value=''; cat.value='';
            addBtn.onclick = addNew;
          };
        };
      });
    }

    function addNew(){
      const n = name.value.trim(); const pr = parseFloat(price.value)||0;
      if(!n) return alert('Name required');
      const list = getProducts();
      list.push({ id:uid('p'), name:n, price:pr, category:cat.value });
      saveProducts(list);
      name.value=''; price.value=''; cat.value='';
      render();
    }

    addBtn.onclick = addNew;

    exportBtn.onclick = ()=>{
      alert('To download ZIP: Go to GitHub repo > Code > Download ZIP (or clone). For full backup clone repo locally.');
    };

    clearBtn.onclick = ()=>{
      if(!confirm('Reset to sample products?')) return;
      localStorage.removeItem(KEY.PRODUCTS); seedProducts(); setTimeout(render,300);
    };

    render();
  }

  // --- CASHIER page ---
  function initCashier(){
    const grid = qs('#productsGrid'), cartList = qs('#cartList');
    const itemCount = qs('#itemCount'), totalAmount = qs('#totalAmount');
    const checkoutBtn = qs('#checkoutBtn'), clearBtn = qs('#clearCartBtn');
    const paymentMode = qs('#paymentMode');

    let cart = [];

    function showProducts(){
      grid.innerHTML='';
      getProducts().forEach(p=>{
        const btn = document.createElement('button');
        btn.className = 'product';
        btn.innerHTML = `<div>${p.name}</div><div class="price">${toMoney(p.price)}</div>`;
        btn.onclick = ()=> { cart.push(Object.assign({},p)); renderCart(); };
        grid.appendChild(btn);
      });
    }

    function renderCart(){
      cartList.innerHTML='';
      cart.forEach((c,i)=>{
        const li=document.createElement('li');
        li.textContent = `${c.name} - ${toMoney(c.price)}`;
        const rem = document.createElement('button');
        rem.textContent = '✖';
        rem.onclick = ()=>{ cart.splice(i,1); renderCart(); };
        li.appendChild(rem);
        cartList.appendChild(li);
      });
      const total = cart.reduce((s,x)=>s+x.price,0);
      itemCount.textContent = cart.length;
      totalAmount.textContent = toMoney(total);
    }

    checkoutBtn.onclick = ()=>{
      if(cart.length===0) return alert('Cart empty');
      const order = {
        id: uid('o'),
        type: 'sale',
        created: new Date().toISOString(),
        items: cart,
        total: cart.reduce((s,x)=>s+x.price,0),
        payment: paymentMode.value,
        user: 'cashier'
      };
      const orders = getOrders();
      orders.push(order);
      saveOrders(orders);
      // Print simple receipt:
      const w = window.open('','receipt','width=400,height=600');
      w.document.write(`<pre style="font-family:monospace">
FAI FAI JUICE - Receipt
Time: ${new Date().toLocaleString()}

${order.items.map(it=>`${it.name}    ${toMoney(it.price)}`).join('\n')}

TOTAL: ${toMoney(order.total)}

Payment: ${order.payment}
Order ID: ${order.id}
</pre>`);
      w.print(); w.close();
      cart=[];
      renderCart();
      alert('Checkout done — order sent to reports & kitchen.');
    };

    clearBtn.onclick = ()=>{ cart=[]; renderCart(); };

    showProducts();
    renderCart();
  }

  // --- WAITER page ---
  function initWaiter(){
    const grid = qs('#waiterProducts'), cartEl = qs('#waiterCart'), tableNo = qs('#tableNo');
    const sendBtn = qs('#sendOrderBtn'), clearBtn = qs('#clearWaiterBtn');
    let cart = [];

    function showMenu(){
      grid.innerHTML='';
      getProducts().forEach(p=>{
        const b = document.createElement('button');
        b.className='product';
        b.innerHTML = `<div>${p.name}</div><div class="price">${toMoney(p.price)}</div>`;
        b.onclick = ()=>{ cart.push(Object.assign({},p)); render(); };
        grid.appendChild(b);
      });
    }
    function render(){
      cartEl.innerHTML='';
      cart.forEach((c,i)=>{
        const li = document.createElement('li');
        li.textContent = `${c.name} - ${toMoney(c.price)}`;
        const rm = document.createElement('button'); rm.textContent='✖';
        rm.onclick = ()=>{ cart.splice(i,1); render(); };
        li.appendChild(rm);
        cartEl.appendChild(li);
      });
    }

    sendBtn.onclick = ()=>{
      if(cart.length===0) return alert('Select items first');
      const t = tableNo.value.trim()||'Takeaway';
      const order = {
        id: uid('w'),
        type: 'kitchen',
        created: new Date().toISOString(),
        table: t,
        items: cart.slice(),
        status: 'open'
      };
      const orders = getOrders(); orders.push(order); saveOrders(orders);
      cart = []; render();
      alert('Order sent to kitchen');
    };

    clearBtn.onclick = ()=>{ cart=[]; render(); };

    showMenu();
    render();
  }

  // --- KITCHEN page ---
  function initKitchen(){
    const panel = qs('#kitchenOrders');
    const refresh = qs('#refreshKitchen'), clearBtn = qs('#clearCompleted');

    function render(){
      const orders = getOrders().filter(o=>o.type==='kitchen');
      panel.innerHTML='';
      orders.forEach(o=>{
        const li = document.createElement('li');
        li.innerHTML = `<b>${o.table}</b> — ${new Date(o.created).toLocaleTimeString()} 
          <div>${o.items.map(it=>it.name+' x1').join(', ')}</div>
          <div class="tiny">
            <button class="done" data-id="${o.id}">${o.status==='done' ? '✔ Done' : 'Mark Done'}</button>
            <button class="del" data-id="${o.id}">Delete</button>
          </div>`;
        panel.appendChild(li);
      });
      panel.querySelectorAll('.done').forEach(b=>{
        b.onclick = ()=>{
          const id=b.dataset.id;
          const arr = getOrders().map(x=> x.id===id ? Object.assign({},x,{status:'done'}) : x );
          saveOrders(arr); render();
        };
      });
      panel.querySelectorAll('.del').forEach(b=>{
        b.onclick = ()=>{
          const id=b.dataset.id;
          const arr = getOrders().filter(x=>x.id!==id);
          saveOrders(arr); render();
        };
      });
    }
    refresh.onclick = render;
    clearBtn.onclick = ()=> {
      const arr = getOrders().filter(x=>x.status!=='done');
      saveOrders(arr); render();
    };
    render();
  }

  // --- REPORTS page ---
  function initReports(){
    const dateInput = qs('#reportDate'), run = qs('#runReport'), area = qs('#reportArea'), exp = qs('#exportCSV');

    function formatDateKey(d){
      const dt = new Date(d);
      return dt.toISOString().slice(0,10);
    }

    run.onclick = ()=>{
      const date = dateInput.value || new Date().toISOString().slice(0,10);
      const orders = getOrders().filter(o=> o.created && o.created.slice(0,10) === date );
      // sales and kitchen orders
      const sales = orders.filter(o=>o.type==='sale');
      const sumTotal = sales.reduce((s,x)=>s + (x.total||0), 0);
      // group by payment:
      const byPay = {};
      sales.forEach(sale=> {
        const p = sale.payment || 'cash';
        byPay[p] = (byPay[p]||0) + (sale.total||0);
      });
      // profit% simple: assume profit = 30% of sales
      const profit = sumTotal * 0.30;
      area.innerHTML = `<h4>Report for ${date}</h4>
        <p>Total Sales: ${toMoney(sumTotal)}</p>
        <p>Profit (est 30%): ${toMoney(profit)}</p>
        <p>By Payment:</p>
        <ul>${Object.keys(byPay).map(k=>`<li>${k}: ${toMoney(byPay[k])}</li>`).join('')}</ul>
        <p>Orders Count: ${orders.length}</p>`;
    };

    exp.onclick = ()=>{
      const rows = getOrders().map(o=>{
        return {
          id:o.id,
          created:o.created,
          type:o.type,
          total: o.total || '',
          payment: o.payment || '',
          table: o.table || ''
        };
      });
      const csv = [
        ['id','created','type','total','payment','table'],
        ...rows.map(r => [r.id, r.created, r.type, r.total, r.payment, r.table])
      ].map(r => r.map(c=> `"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');

      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv';
      a.click(); URL.revokeObjectURL(url);
    };
  }

  // --- initialization logic decides which page to init ---
  function main(){
    seedProducts();
    const id = document.body.id;
    if(id==='admin') initAdmin();
    if(id==='cashier') initCashier();
    if(id==='waiter') initWaiter();
    if(id==='kitchen') initKitchen();
    if(id==='reports') initReports();
  }

  // start
  document.addEventListener('DOMContentLoaded', main);

  // --- service worker registration (optional) ---
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }

})();

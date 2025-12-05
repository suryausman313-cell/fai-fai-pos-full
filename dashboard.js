/* dashboard.js
   Full dashboard logic:
   - uses window.FFP helpers if present (FFP.getSales(), getOrders(), getProducts(), fmt())
   - otherwise reads from localStorage keys:
     ff_sales, ff_orders, ff_products, ff_expenses, ff_registers, ff_settings
   - renders charts: sales30, sales vs expenses, monthly, payment, source, top items
*/

(function(){
  // Chart instances
  let chartSales30, chartSalesVsExp, chartMonthly, chartPayment, chartSource, chartTopItems;

  // helpers
  function getLocal(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)||'null') || fallback; }catch(e){ return fallback; } }
  function fmtMoney(v){ if(window.FFP && FFP.fmt) return FFP.fmt(v); return 'AED ' + Number(v||0).toFixed(2); }
  function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }
  function dateISO(d){ return new Date(d).toISOString().slice(0,10); }
  function parseDateField(obj){ return obj.created || obj.createdAt || obj.date || obj.createdDate || new Date().toISOString(); }

  function readDB(){
    const sales = (window.FFP && FFP.getSales) ? FFP.getSales() : getLocal('ff_sales', []);
    const orders = (window.FFP && FFP.getOrders) ? FFP.getOrders() : getLocal('ff_orders', []);
    const products = (window.FFP && FFP.getProducts) ? FFP.getProducts() : getLocal('ff_products', []);
    const expenses = getLocal('ff_expenses', []);
    const registers = getLocal('ff_registers', []);
    const settings = getLocal('ff_settings', { profitPercent: 30, currency: 'AED' });
    return { sales, orders, products, expenses, registers, settings };
  }

  // basic inclusive filter by date (field key)
  function filterByRange(arr, field){
    const fromVal = document.getElementById('f_from').value;
    const toVal = document.getElementById('f_to').value;
    const from = fromVal ? new Date(fromVal + 'T00:00:00') : null;
    const to = toVal ? new Date(toVal + 'T23:59:59') : null;
    if(!from && !to) return arr;
    return arr.filter(item=>{
      const d = new Date(parseDateField(item));
      if(from && d < from) return false;
      if(to && d > to) return false;
      return true;
    });
  }

  // compute KPIs & aggregates
  function computeMetrics(){
    const db = readDB();
    const salesAll = db.sales || [];
    const expensesAll = db.expenses || [];
    const ordersAll = db.orders || [];

    // filtered sales & expenses for selected range
    const sales = filterByRange(salesAll, 'created');
    const expenses = filterByRange(expensesAll, 'created');

    // totals
    const totalOrders = sales.length;
    const gross = sales.reduce((s,x)=> s + Number(x.total || (x.items ? x.items.reduce((a,i)=> a + (Number(i.price||0) * Number(i.qty||1)),0) : 0)), 0);
    const totalExpenses = expenses.reduce((a,e)=> a + Number(e.amount||0), 0);

    // pending (orders not paid or kitchen)
    const pending = (ordersAll.filter(o=> o.status && ['new','in-progress','pending'].includes(o.status)).length) + (ordersAll.filter(o=> o.type==='sale' && !(o.status==='paid' || o.paid)).length);

    // payment split
    const payments = { cash:0, visa:0, talabat:0, noon:0, other:0 };
    sales.forEach(s=>{
      const p = (s.payment || s.paymentMethod || '').toString().toLowerCase();
      const val = Number(s.total || 0);
      if(p.includes('cash')) payments.cash += val;
      else if(p.includes('visa') || p.includes('card')) payments.visa += val;
      else if(p.includes('talabat')) payments.talabat += val;
      else if(p.includes('noon')) payments.noon += val;
      else payments.other += val;
    });

    // order sources
    const sources = { dinein:0, takeaway:0, talabat:0, noon:0, other:0 };
    sales.forEach(s=>{
      const src = (s.source || s.orderSource || s.channel || '').toString().toLowerCase();
      const val = Number(s.total || 0);
      if(src.includes('talabat')) sources.talabat += val;
      else if(src.includes('noon')) sources.noon += val;
      else if(src.includes('take') || src.includes('delivery')) sources.takeaway += val;
      else if(src.includes('dine') || src.includes('table')) sources.dinein += val;
      else sources.other += val;
    });

    // opening/closing: find register record for from date or today
    const regs = db.registers || [];
    const dateFrom = document.getElementById('f_from').value || new Date().toISOString().slice(0,10);
    const dateTo = document.getElementById('f_to').value || new Date().toISOString().slice(0,10);
    function findRegFor(dateStr){
      return regs.find(r=> (r.date||r.created||'').slice(0,10) === dateStr) || null;
    }
    const regFrom = findRegFor(dateFrom) || (regs.length? regs[regs.length-1] : null);
    const regTo = findRegFor(dateTo) || regFrom;
    const opening = regFrom ? Number(regFrom.opening||0) : 0;
    const closing = regTo ? Number(regTo.closing||0) : 0;

    return { sales, expenses, totalOrders, gross, totalExpenses, pending, payments, sources, opening, closing, settings: db.settings, products: db.products, ordersAll };
  }

  // Renders KPIs in UI
  function renderKPIs(m){
    document.getElementById('k_orders').textContent = m.totalOrders;
    document.getElementById('k_revenue').textContent = fmtMoney(m.gross);
    document.getElementById('k_expenses').textContent = fmtMoney(m.totalExpenses);
    document.getElementById('k_net').textContent = fmtMoney(m.gross - m.totalExpenses);
    document.getElementById('k_opening').textContent = fmtMoney(m.opening);
    document.getElementById('k_closing').textContent = fmtMoney(m.closing);
    document.getElementById('k_pending').textContent = m.pending;
    document.getElementById('k_profitpct').textContent = (document.getElementById('profitPct').value || m.settings.profitPercent || 30) + '%';
  }

  /* ---------- CHARTS ---------- */

  // Sales last 30 days line
  function renderSales30(m){
    const sales = m.sales || [];
    const labels = [];
    const now = new Date();
    for(let i=29;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
      labels.push(d.toISOString().slice(0,10));
    }
    const map = {}; labels.forEach(l=> map[l]=0);
    const expMap = {}; labels.forEach(l=> expMap[l]=0);

    sales.forEach(s=>{
      const d = (parseDateField(s)+'').slice(0,10);
      if(map.hasOwnProperty(d)) map[d] += Number(s.total || 0);
    });

    // map expenses by date
    (m.expenses||[]).forEach(e=>{
      const d = (parseDateField(e)+'').slice(0,10);
      if(expMap.hasOwnProperty(d)) expMap[d] += Number(e.amount || 0);
    });

    const dataSales = labels.map(l=> map[l] || 0);
    const dataExp = labels.map(l=> expMap[l] || 0);

    const ctx = document.getElementById('chartSales30').getContext('2d');
    if(chartSales30) chartSales30.destroy();
    chartSales30 = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[
        { label:'Sales', data:dataSales, fill:true, tension:0.2, borderColor:'#0b74de', backgroundColor:'rgba(11,116,222,0.08)' },
        { label:'Expenses', data:dataExp, fill:true, tension:0.2, borderColor:'#e05b5b', backgroundColor:'rgba(224,91,91,0.06)' }
      ]},
      options:{ responsive:true, plugins:{legend:{position:'top'}} }
    });
  }

  // Sales vs Expenses bar (30 days)
  function renderSalesVsExpenses(m){
    // reuse same data from sales30 for simplicity
    const sales = m.sales || [];
    const labels = [];
    const now = new Date();
    for(let i=29;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
      labels.push(d.toISOString().slice(0,10));
    }
    const map = {}; labels.forEach(l=> map[l]=0);
    const expMap = {}; labels.forEach(l=> expMap[l]=0);
    sales.forEach(s=>{ const d=(parseDateField(s)+'').slice(0,10); if(map[d]!==undefined) map[d]+=Number(s.total||0); });
    (m.expenses||[]).forEach(e=>{ const d=(parseDateField(e)+'').slice(0,10); if(expMap[d]!==undefined) expMap[d]+=Number(e.amount||0); });

    const data1 = labels.map(l=>map[l]||0);
    const data2 = labels.map(l=>expMap[l]||0);

    const ctx = document.getElementById('chartSalesVsExpenses').getContext('2d');
    if(chartSalesVsExp) chartSalesVsExp.destroy();
    chartSalesVsExp = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[
        { label:'Sales', data:data1, backgroundColor:'#0b74de' },
        { label:'Expenses', data:data2, backgroundColor:'#e05b5b' }
      ]},
      options:{ responsive:true, plugins:{legend:{position:'top'}}, scales:{ x:{ stacked:false }, y:{ stacked:false } } }
    });
  }

  // Monthly totals for current year
  function renderMonthly(m){
    const sales = (m.sales||[]);
    const now = new Date();
    const year = now.getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthMap = {}; for(let i=1;i<=12;i++){ const k = (i<10? '0'+i : ''+i); monthMap[k]=0; }
    // use all sales in dataset (filter by year)
    (m.sales||[]).forEach(s=>{
      const d = (parseDateField(s)+'').slice(0,10);
      if(!d || d.slice(0,4) != (''+year)) return;
      const mm = d.slice(5,7);
      monthMap[mm] += Number(s.total || 0);
    });
    const labels = Object.keys(monthMap).map(k => months[parseInt(k,10)-1]);
    const data = Object.keys(monthMap).map(k => monthMap[k]);

    const ctx = document.getElementById('chartMonthly').getContext('2d');
    if(chartMonthly) chartMonthly.destroy();
    chartMonthly = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[{ label: 'Monthly Sales', data, borderColor:'#0b74de', fill:true, backgroundColor:'rgba(11,116,222,0.06)'}] },
      options:{ responsive:true, plugins:{legend:{display:false}} }
    });
  }

  // Payment split pie
  function renderPayment(m){
    const payments = m.payments || { cash:0, visa:0, talabat:0, noon:0, other:0 };
    const ctx = document.getElementById('chartPayment').getContext('2d');
    if(chartPayment) chartPayment.destroy();
    chartPayment = new Chart(ctx, {
      type:'pie',
      data:{ labels:['Cash','Visa','Talabat','Noon','Other'], datasets:[{ data:[payments.cash, payments.visa, payments.talabat, payments.noon, payments.other] }] },
      options:{ responsive:true }
    });
  }

  // Order source donut
  function renderSource(m){
    const s = m.sources || { dinein:0, takeaway:0, talabat:0, noon:0, other:0 };
    const ctx = document.getElementById('chartSource').getContext('2d');
    if(chartSource) chartSource.destroy();
    chartSource = new Chart(ctx, {
      type:'doughnut',
      data:{ labels:['Dine-In','Takeaway','Talabat','Noon','Other'], datasets:[{ data:[s.dinein, s.takeaway, s.talabat, s.noon, s.other] }] },
      options:{ responsive:true }
    });
  }

  // Top items bar
  function renderTopItems(m){
    // aggregate item qty from sales in range
    const counts = {};
    (m.sales||[]).forEach(s=>{
      (s.items||[]).forEach(it=>{
        const id = it.id || it.name;
        if(!counts[id]) counts[id] = { name: it.name || id, qty:0, rev:0 };
        counts[id].qty += Number(it.qty||1);
        counts[id].rev += Number(it.price||0) * Number(it.qty||1);
      });
    });
    const arr = Object.keys(counts).map(k=> counts[k]).sort((a,b)=> b.qty - a.qty).slice(0,10);
    const labels = arr.map(x=> x.name);
    const data = arr.map(x=> x.qty);

    const ctx = document.getElementById('chartTopItems').getContext('2d');
    if(chartTopItems) chartTopItems.destroy();
    chartTopItems = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{ label:'Qty', data, backgroundColor:'#f08a24' }]},
      options:{ responsive:true, plugins:{legend:{display:false}} }
    });
  }

  // recent lists render
  function renderRecentLists(m){
    const recentOrdersEl = document.getElementById('recentOrders');
    const recentExpEl = document.getElementById('recentExpenses');
    recentOrdersEl.innerHTML = '';
    recentExpEl.innerHTML = '';
    const recentOrders = (m.sales||[]).slice(-10).reverse();
    recentOrders.forEach(o=>{
      const li = document.createElement('li');
      li.innerHTML = `<div style="flex:1"><strong>${o.id||o.orderId||uid('ord')}</strong><div class="small">${new Date(parseDateField(o)).toLocaleString()}</div><div class="small">${(o.items||[]).map(it=>it.name+' x'+(it.qty||1)).join(', ')}</div></div><div style="min-width:70px;text-align:right">${fmtMoney(o.total||0)}</div>`;
      recentOrdersEl.appendChild(li);
    });
    (m.expenses||[]).slice(-10).reverse().forEach(e=>{
      const li = document.createElement('li');
      li.innerHTML = `<div style="flex:1"><strong>${e.id||uid('exp')}</strong><div class="small">${new Date(parseDateField(e)).toLocaleString()}</div><div class="small">${e.note||e.category||''}</div></div><div style="min-width:70px;text-align:right">${fmtMoney(e.amount||0)}</div>`;
      recentExpEl.appendChild(li);
    });
  }

  // export CSV
  function exportCSV(m){
    const rows = [];
    rows.push(['type','id','created','items_or_note','amount','payment','source']);
    (m.sales||[]).forEach(s=>{
      rows.push(['sale', s.id||'', parseDateField(s), (s.items||[]).map(i=>i.name+' x'+(i.qty||1)).join('; '), s.total||0, s.payment||'', s.source||'']);
    });
    (m.expenses||[]).forEach(e=>{
      rows.push(['expense', e.id||'', parseDateField(e), e.note||e.category||'', e.amount||0, '', '']);
    });
    const csv = rows.map(r=> r.map(c=> `"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pos_export.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // main refresh
  function refreshAll(){
    const metrics = computeMetrics();
    renderKPIs(metrics);
    renderSales30(metrics);
    renderSalesVsExpenses(metrics);
    renderMonthly(metrics);
    renderPayment(metrics);
    renderSource(metrics);
    renderTopItems(metrics);
    renderRecentLists(metrics);
  }

  // attach buttons & presets
  document.getElementById('btnRefresh').addEventListener('click', refreshAll);
  document.getElementById('btnExport').addEventListener('click', ()=> exportCSV(computeMetrics()));
  document.getElementById('presetToday').addEventListener('click', ()=>{
    const d = new Date().toISOString().slice(0,10);
    document.getElementById('f_from').value = d; document.getElementById('f_to').value = d; refreshAll();
  });
  document.getElementById('presetYesterday').addEventListener('click', ()=>{
    const d = new Date(); d.setDate(d.getDate()-1); const k = d.toISOString().slice(0,10);
    document.getElementById('f_from').value = k; document.getElementById('f_to').value = k; refreshAll();
  });
  document.getElementById('presetMonth').addEventListener('click', ()=>{
    const d = new Date(); document.getElementById('f_from').value = new Date(d.getFullYear(), d.getMonth(),1).toISOString().slice(0,10); document.getElementById('f_to').value = new Date().toISOString().slice(0,10); refreshAll();
  });
  document.getElementById('presetYear').addEventListener('click', ()=>{
    const d = new Date(); document.getElementById('f_from').value = new Date(d.getFullYear(),0,1).toISOString().slice(0,10); document.getElementById('f_to').value = new Date().toISOString().slice(0,10); refreshAll();
  });
  document.getElementById('profitPct').addEventListener('change', refreshAll);
  document.getElementById('f_from').addEventListener('change', refreshAll);
  document.getElementById('f_to').addEventListener('change', refreshAll);

  // initial render
  refreshAll();
  // auto refresh
  setInterval(refreshAll, 5000);

  // expose computeMetrics for debug if needed
  window.posDashboard = { computeMetrics, refreshAll };

})();

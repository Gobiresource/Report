const GRD = (() => {
  // ---------------- Тайлангийн төрлүүд ----------------
  const reportTypes = [
    {key:'production', name:'Үйлдвэрлэл / Лаб', desc:'Бүтээгдэхүүн, цахилгаан, түлш, лабораторийн үзүүлэлт'},
    {key:'transport', name:'Тээвэр', desc:'Шлам, хаягдал, богино рейс, бүтээгдэхүүн тээвэр, пүүний мэдээлэл'},
    {key:'fuel', name:'Түлш', desc:'Нэгтгэл түлш, техник тус бүр, түлш олголт'},
    {key:'equipment', name:'Техник', desc:'Ажилласан, засварт, парк'},
    {key:'camp', name:'Кемп / хүн хүч', desc:'Ажилтан, зочин, хоол'},
    {key:'hse', name:'ХАБЭА', desc:'Эмнэлгийн тусламж, зөрчил, цаг агаар'},
    {key:'issue', name:'Асуудал', desc:'Үйлдвэрийн үйл ажиллагаанд тулгарсан асуудал'}
  ];

  // ---------------- Form-ын талбарууд ----------------
  const forms = {
    production: [
      {name:'shift_day_product_ton', label:'Өдрийн ээлжийн бүтээгдэхүүн / тн', type:'number'},
      {name:'shift_night_product_ton', label:'Шөнийн ээлжийн бүтээгдэхүүн / тн', type:'number'},
      {name:'day_meter', label:'Өдрийн тоолуурын заалт', type:'number'},
      {name:'night_meter', label:'Шөнийн тоолуурын заалт', type:'number'},
      {name:'day_fuel_liter', label:'Өдрийн үйлдвэрийн түлш / л', type:'number'},
      {name:'night_fuel_liter', label:'Шөнийн үйлдвэрийн түлш / л', type:'number'},
      {name:'middling_ton', label:'Мидлинг / тн', type:'number'},
      {name:'lab_avg_luojing_ad', label:'Лаб дундаж: Лоожин Ad', type:'number'},
      {name:'lab_avg_fumei_ad', label:'Лаб дундаж: Фумэй Ad', type:'number'},
      {name:'lab_avg_caking_g', label:'Лаб дундаж: Барьцалдах G', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    transport: [
      {name:'sludge_trips', label:'Шлам рейс', type:'number'},
      {name:'sludge_ton', label:'Шлам тонн', type:'number'},
      {name:'waste_trips', label:'Хаягдал рейс', type:'number'},
      {name:'waste_ton', label:'Хаягдал тонн', type:'number'},
      {name:'short_waste_trips', label:'Богино дотор рейс', type:'number'},
      {name:'short_waste_ton', label:'Богино дотор рейс тонн', type:'number'},
      {name:'product_transport_trips', label:'Бүтээгдэхүүн тээвэр рейс', type:'number'},
      {name:'product_transport_ton', label:'Бүтээгдэхүүн тээвэр тонн', type:'number'},
      {name:'weighbridge_net_ton', label:'Пүүний бодит цэвэр жин / тн', type:'number'},
      {name:'weighbridge_trips', label:'Пүүний рейс', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    fuel: [
      {name:'fuel_truck_income_liter', label:'Түлшний машин орлого / л', type:'number'},
      {name:'fuel_truck_opening_liter', label:'Түлшний машин эхний үлдэгдэл / л', type:'number'},
      {name:'fuel_truck_machine_liter', label:'Машинд олгосон / л', type:'number'},
      {name:'fuel_truck_plant_liter', label:'Үйлдвэрт олгосон / л', type:'number'},
      {name:'fuel_truck_closing_liter', label:'Түлшний машин үлдэгдэл / л', type:'number'},
      {name:'reserve_tank_opening_liter', label:'Нөөцийн сав эхний үлдэгдэл / л', type:'number'},
      {name:'reserve_tank_expense_liter', label:'Нөөцийн сав зарлага / л', type:'number'},
      {name:'reserve_tank_closing_liter', label:'Нөөцийн сав үлдэгдэл / л', type:'number'},
      {name:'fuel_issue_total_liter', label:'Түлш олголтын нийт / л', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    equipment: [
      {name:'main_working_count', label:'Үндсэн техник ажилласан', type:'number'},
      {name:'rental_sludge_working_count', label:'Шлам тээврийн түрээс ажилласан', type:'number'},
      {name:'product_transport_working_count', label:'Бүтээгдэхүүн тээврийн түрээс ажилласан', type:'number'},
      {name:'repair_count', label:'Засвартай техник', type:'number'},
      {name:'parked_count', label:'Парк дээр', type:'number'},
      {name:'equipment_note', label:'Засвартай техникүүд / тайлбар', type:'textarea', full:true}
    ],
    camp: [
      {name:'mongolian_count', label:'Монгол ажилтан', type:'number'},
      {name:'chinese_count', label:'Хятад ажилтан', type:'number'},
      {name:'guard_count', label:'Харуул', type:'number'},
      {name:'guest_count', label:'Зочин', type:'number'},
      {name:'outside_meal_count', label:'Гаднаас хооллосон хүн', type:'number'},
      {name:'contractor_count', label:'Барилга / туслан гүйцэтгэгч', type:'number'},
      {name:'camp_staff_count', label:'Кемпийн ажилтан', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    hse: [
      {name:'medical_assistance_count', label:'Эмнэлгийн тусламж', type:'number'},
      {name:'hse_violation_count', label:'ХАБ зөрчил', type:'number'},
      {name:'day_temp_c', label:'Өдрийн хэм ℃', type:'number'},
      {name:'night_temp_c', label:'Шөнийн хэм ℃', type:'number'},
      {name:'humidity_percent', label:'Чийг %', type:'number'},
      {name:'wind_speed_ms', label:'Салхины хурд м/с', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    issue: [
      {name:'issue_text', label:'Асуудлын тайлбар', type:'textarea', full:true},
      {name:'severity', label:'Ноцтой байдал', type:'select', options:[['low','Бага'],['medium','Дунд'],['high','Өндөр']]},
      {name:'status', label:'Төлөв', type:'select', options:[['open','Нээлттэй'],['resolved','Шийдсэн']]},
      {name:'action_taken', label:'Авсан арга хэмжээ', type:'textarea', full:true},
      {name:'responsible_person', label:'Хариуцсан хүн', type:'text'}
    ]
  };

  // ---------------- Туслах функцууд ----------------
  function today(){ return new Date().toISOString().slice(0,10); }
  function thisMonth(){ return today().slice(0,7); }
  function qs(s,root=document){return root.querySelector(s)}
  function qsa(s,root=document){return Array.from(root.querySelectorAll(s))}
  function num(v){ const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function fmt(n, digits=1){
    if (n === null || n === undefined || isNaN(n)) return '—';
    const r = Math.round(n * 10) / 10;
    return r.toLocaleString('en-US', {maximumFractionDigits: digits});
  }
  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function setMessage(el, text, ok=false){ if(!el) return; el.innerHTML = text ? `<div class="alert ${ok?'alert-ok':'alert-error'}">${escapeHtml(text)}</div>` : ''; }

  function getSession(){ try{return JSON.parse(sessionStorage.getItem('grdSession')||localStorage.getItem('grdSession')||'null')}catch(e){return null} }
  function saveSession(session, remember=false){ const target=remember?localStorage:sessionStorage; target.setItem('grdSession', JSON.stringify(session)); if(remember) sessionStorage.removeItem('grdSession'); else localStorage.removeItem('grdSession'); }
  function clearSession(){ sessionStorage.removeItem('grdSession'); localStorage.removeItem('grdSession'); }
  function showUser(){
    const s=getSession();
    qsa('#userPill').forEach(el=>{el.textContent=s?`${s.name||s.username}`:''});
    qsa('#logoutBtn').forEach(btn=>{ if(s) btn.classList.remove('hidden'); btn.onclick=()=>{clearSession(); location.href='index.html'}; });
  }

  async function api(path, opts={}){
    const res = await fetch(path, {headers:{'Content-Type':'application/json'}, ...opts});
    let data=null;
    try{ data = await res.json(); }catch(e){ data = {ok:false,error:'JSON хариу ирсэнгүй'}; }
    if(!res.ok || data.ok===false) throw new Error(data.error || 'Серверийн алдаа');
    return data;
  }
  async function login(username,pin){
    return await api('/api/login', {method:'POST', body:JSON.stringify({username,pin})});
  }
  function authBody(extra={}){
    const s=getSession()||{};
    return JSON.stringify({username:s.username, pin:s.pin, ...extra});
  }

  // ================================================================
  // 1. НЭВТРЭХ ХУУДАС — ганц login, role-оор чиглүүлнэ
  // ================================================================
  function routeByRole(user){
    if (user.role === 'worker') location.href = 'report.html';
    else location.href = 'dashboard.html';
  }

  function initIndex(){
    const form=qs('#loginForm'); if(!form) return;
    const saved=getSession();
    if(saved){ routeByRole(saved); return; }
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const msg=qs('#loginMessage'); setMessage(msg,'');
      const btn=qs('button[type=submit]',form); btn.disabled=true;
      const username=qs('#username').value.trim(); const pin=qs('#pin').value.trim();
      try{
        const data=await login(username,pin);
        const remember=qs('#remember')?.checked;
        saveSession({...data.user, pin, permissions:data.permissions||[]}, remember);
        routeByRole(data.user);
      }catch(err){ setMessage(msg, err.message); btn.disabled=false; }
    });
  }

  // ================================================================
  // 2. ЗАХИРЛЫН DASHBOARD — нэвтрэнгүүт өнөөдрийн summary
  // ================================================================

  // Summary картын тодорхойлолт: аль тайлангаас ямар тоо гаргахыг заана
  const summaryCards = [
    {
      key:'production', label:'24 цагийн бүтээгдэхүүн', unit:'тн',
      calc: d => num(d.shift_day_product_ton) + num(d.shift_night_product_ton),
      sub: d => `Өдөр ${fmt(num(d.shift_day_product_ton))} + Шөнө ${fmt(num(d.shift_night_product_ton))}`
    },
    {
      key:'transport', label:'Тээвэрлэсэн нийт', unit:'тн',
      calc: d => num(d.sludge_ton) + num(d.waste_ton) + num(d.short_waste_ton) + num(d.product_transport_ton),
      sub: d => `Шлам ${fmt(num(d.sludge_ton))} · Хаягдал ${fmt(num(d.waste_ton)+num(d.short_waste_ton))} · Бүт. ${fmt(num(d.product_transport_ton))}`
    },
    {
      key:'fuel', label:'Түлшний зарлага', unit:'л',
      calc: d => num(d.fuel_truck_machine_liter) + num(d.fuel_truck_plant_liter) + num(d.reserve_tank_expense_liter),
      sub: d => `Үлдэгдэл ${fmt(num(d.fuel_truck_closing_liter)+num(d.reserve_tank_closing_liter))} л`
    },
    {
      key:'equipment', label:'Ажилласан техник', unit:'',
      calc: d => num(d.main_working_count) + num(d.rental_sludge_working_count) + num(d.product_transport_working_count),
      sub: d => `Засварт ${fmt(num(d.repair_count),0)} · Парк ${fmt(num(d.parked_count),0)}`
    },
    {
      key:'camp', label:'Нийт хүн хүч', unit:'',
      calc: d => num(d.mongolian_count) + num(d.chinese_count) + num(d.guard_count) + num(d.contractor_count) + num(d.camp_staff_count),
      sub: d => `Монгол ${fmt(num(d.mongolian_count),0)} · Хятад ${fmt(num(d.chinese_count),0)} · Зочин ${fmt(num(d.guest_count),0)}`
    },
    {
      key:'hse', label:'ХАБ зөрчил / Эмнэлэг', unit:'',
      calc: d => num(d.hse_violation_count) + num(d.medical_assistance_count),
      sub: d => `Зөрчил ${fmt(num(d.hse_violation_count),0)} · Эмнэлгийн тусламж ${fmt(num(d.medical_assistance_count),0)}`,
      warnIf: d => (num(d.hse_violation_count) + num(d.medical_assistance_count)) > 0
    },
    {
      key:'issue', label:'Асуудал', unit:'',
      calc: d => d.issue_text ? 1 : 0,
      sub: d => d.status === 'open' ? 'Нээлттэй асуудал байна' : (d.issue_text ? 'Шийдэгдсэн' : 'Асуудал бүртгэгдээгүй'),
      warnIf: d => d.status === 'open'
    }
  ];

  function initDashboard(){
    showUser();
    const s=getSession();
    if(!s){ location.href='index.html'; return; }
    // Dashboard-ыг бүх нэвтэрсэн хэрэглэгч харна (захирал ч, ажилтан ч)

    const dateInput=qs('#dashboardDate');
    if(dateInput){ dateInput.value=today(); dateInput.onchange=()=>loadDaily(dateInput.value); }
    const monthInput=qs('#dashboardMonth');
    if(monthInput){ monthInput.value=thisMonth(); monthInput.onchange=()=>loadMonthly(monthInput.value); }
    qs('#prevDayBtn')?.addEventListener('click',()=>shiftDay(-1));
    qs('#nextDayBtn')?.addEventListener('click',()=>shiftDay(1));

    function shiftDay(delta){
      const d=new Date(dateInput.value||today());
      d.setDate(d.getDate()+delta);
      dateInput.value=d.toISOString().slice(0,10);
      loadDaily(dateInput.value);
    }

    loadDaily(today());
    loadMonthly(thisMonth());
  }

  let dailyReportMap = {}; // report_type -> {data, submitted_by_name, updated_at}

  async function loadDaily(date){
    const cardsBox=qs('#summaryCards');
    const statusBox=qs('#statusRow');
    const msg=qs('#dashboardMessage');
    setMessage(msg,'');
    cardsBox.innerHTML='<div class="module-empty">Ачаалж байна…</div>';
    statusBox.innerHTML='';
    qs('#moduleDetail').innerHTML='';
    try{
      const res=await api('/api/daily',{method:'POST',body:authBody({date})});
      dailyReportMap={};
      (res.reports||[]).forEach(r=>{ dailyReportMap[r.report_type]=r; });
      renderSummary();
      renderStatus();
    }catch(err){
      if(/эрхгүй|нэвтрэлт/i.test(err.message)){ clearSession(); location.href='index.html'; return; }
      cardsBox.innerHTML='';
      setMessage(msg, err.message);
    }
  }

  function renderSummary(){
    const box=qs('#summaryCards');
    box.innerHTML=summaryCards.map(c=>{
      const r=dailyReportMap[c.key];
      if(!r){
        return `<div class="card card-missing"><div class="label">${escapeHtml(c.label)}</div><div class="value muted">—</div><div class="sub">Тайлан ороогүй</div></div>`;
      }
      const val=c.calc(r.data);
      const warn=c.warnIf ? c.warnIf(r.data) : false;
      return `<div class="card ${warn?'card-warn':''}"><div class="label">${escapeHtml(c.label)}</div><div class="value">${fmt(val)}${c.unit?' <span class="unit">'+c.unit+'</span>':''}</div><div class="sub">${escapeHtml(c.sub(r.data))}</div></div>`;
    }).join('');
  }

  function renderStatus(){
    const box=qs('#statusRow');
    box.innerHTML=reportTypes.map(t=>{
      const r=dailyReportMap[t.key];
      if(r){
        const time=(r.updated_at||'').slice(11,16);
        return `<button class="status-chip ok" data-key="${t.key}" title="Дэлгэрэнгүй харах">✓ ${escapeHtml(t.name)}<small>${escapeHtml(r.submitted_by_name||'')}${time?' · '+time:''}</small></button>`;
      }
      return `<span class="status-chip pending">○ ${escapeHtml(t.name)}<small>Хүлээгдэж байна</small></span>`;
    }).join('');
    qsa('.status-chip.ok',box).forEach(btn=>btn.onclick=()=>renderModuleDetail(btn.dataset.key));
  }

  function renderModuleDetail(key){
    const r=dailyReportMap[key];
    const type=reportTypes.find(t=>t.key===key);
    const box=qs('#moduleDetail');
    if(!r||!type){ box.innerHTML=''; return; }
    const fields=forms[key]||[];
    const rows=fields.map(f=>{
      let v=r.data[f.name];
      if(v===null||v===undefined||v===''){ v='—'; }
      else if(f.type==='select'){ const opt=(f.options||[]).find(o=>o[0]===v); v=opt?opt[1]:v; }
      return `<tr><td>${escapeHtml(f.label)}</td><td class="right"><strong>${escapeHtml(v)}</strong></td></tr>`;
    }).join('');
    box.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>${escapeHtml(type.name)} — дэлгэрэнгүй</h3><p>Илгээсэн: ${escapeHtml(r.submitted_by_name||'')} · ${escapeHtml((r.updated_at||'').replace('T',' ').slice(0,16))}</p></div><button class="btn btn-soft" id="closeDetail">Хаах</button></div><div class="table-wrap"><table class="table"><tbody>${rows}</tbody></table></div></section>`;
    qs('#closeDetail').onclick=()=>{ box.innerHTML=''; };
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  // ---------------- Сарын нэгтгэл ----------------
  async function loadMonthly(month){
    const box=qs('#monthlyCards');
    if(!box) return;
    box.innerHTML='<div class="module-empty">Ачаалж байна…</div>';
    try{
      const res=await api('/api/monthly',{method:'POST',body:authBody({month})});
      const byType={};
      (res.reports||[]).forEach(r=>{ (byType[r.report_type]=byType[r.report_type]||[]).push(r); });
      const sum=(key,field)=>(byType[key]||[]).reduce((a,r)=>a+num(r.data[field]),0);
      const daysOf=key=>(byType[key]||[]).length;
      const openIssues=(byType['issue']||[]).filter(r=>r.data.status==='open').length;

      const cards=[
        ['Бүтээгдэхүүн нийт', fmt(sum('production','shift_day_product_ton')+sum('production','shift_night_product_ton'))+' тн', daysOf('production')+' өдрийн тайлан'],
        ['Тээвэр нийт', fmt(sum('transport','sludge_ton')+sum('transport','waste_ton')+sum('transport','short_waste_ton')+sum('transport','product_transport_ton'))+' тн', daysOf('transport')+' өдрийн тайлан'],
        ['Түлшний зарлага нийт', fmt(sum('fuel','fuel_truck_machine_liter')+sum('fuel','fuel_truck_plant_liter')+sum('fuel','reserve_tank_expense_liter'))+' л', daysOf('fuel')+' өдрийн тайлан'],
        ['ХАБ зөрчил / Эмнэлэг', fmt(sum('hse','hse_violation_count'),0)+' / '+fmt(sum('hse','medical_assistance_count'),0), daysOf('hse')+' өдрийн тайлан'],
        ['Пүүний нийт жин', fmt(sum('transport','weighbridge_net_ton'))+' тн', 'тээврийн тайлангаас'],
        ['Нээлттэй асуудал', String(openIssues), daysOf('issue')+' бүртгэл']
      ];
      box.innerHTML=cards.map(c=>`<div class="card"><div class="label">${escapeHtml(c[0])}</div><div class="value">${escapeHtml(c[1])}</div><div class="sub">${escapeHtml(c[2])}</div></div>`).join('');
    }catch(err){
      box.innerHTML=`<div class="module-empty">${escapeHtml(err.message)}</div>`;
    }
  }

  // ================================================================
  // 3. АЖИЛТНЫ ТАЙЛАН — нэвтрэнгүүт зөвхөн өөрийн form
  // ================================================================
  function initReport(){
    showUser();
    const session=getSession();
    if(!session){ location.href='index.html'; return; }
    qs('#reportDate') && (qs('#reportDate').value=today());
    showReportWorkspace(session);
  }

  function showReportWorkspace(session){
    qs('#reportWorkspace')?.classList.remove('hidden');
    const allowedKeys = session.role==='admin' || session.role==='viewer' ? reportTypes.map(t=>t.key) : (session.permissions||[]);
    const allowed = reportTypes.filter(t=>allowedKeys.includes(t.key));
    const box=qs('#allowedReports');
    if(!allowed.length){ box.innerHTML='<div class="module-empty">Танд тайлан оруулах эрх тохируулагдаагүй байна. Админд хандана уу.</div>'; return; }
    box.innerHTML=allowed.map((t,i)=>`<button class="permission-card ${i===0?'active':''}" data-key="${t.key}"><span>${escapeHtml(t.name)}</span><small>${escapeHtml(t.desc)}</small></button>`).join('');
    qsa('.permission-card',box).forEach(btn=>btn.onclick=()=>selectReport(btn.dataset.key));
    // Ганцхан эрхтэй бол сонголтын хэсгийг нуугаад шууд form руу
    if(allowed.length===1){ qs('#reportPicker')?.classList.add('hidden'); }
    selectReport(allowed[0].key);
  }

  function selectReport(key){
    qsa('.permission-card').forEach(b=>b.classList.toggle('active',b.dataset.key===key));
    const type=reportTypes.find(t=>t.key===key);
    qs('#formPanel')?.classList.remove('hidden');
    qs('#formTitle').textContent=type?.name||'Тайлан';
    qs('#formDesc').textContent=type?.desc||'';
    setMessage(qs('#submitMessage'),'');
    const fields=forms[key]||[]; const form=qs('#dynamicReportForm');
    form.dataset.reportType=key;
    form.innerHTML = fields.map(f=>renderField(f)).join('') + `<div class="full" style="display:flex;gap:10px;justify-content:flex-end"><button type="reset" class="btn btn-soft">Цэвэрлэх</button><button type="submit" class="btn btn-primary">Илгээх</button></div>`;
    form.onsubmit=submitReport;
  }

  function renderField(f){
    const cls=f.full?'field full':'field';
    if(f.type==='textarea') return `<div class="${cls}"><label>${escapeHtml(f.label)}</label><textarea name="${f.name}" placeholder="Тайлбар"></textarea></div>`;
    if(f.type==='select') return `<div class="${cls}"><label>${escapeHtml(f.label)}</label><select name="${f.name}">${(f.options||[]).map(o=>`<option value="${escapeHtml(o[0])}">${escapeHtml(o[1])}</option>`).join('')}</select></div>`;
    return `<div class="${cls}"><label>${escapeHtml(f.label)}</label><input name="${f.name}" type="${f.type||'text'}" ${f.type==='number'?'step="any"':''}></div>`;
  }

  async function submitReport(e){
    e.preventDefault(); const session=getSession(); const msg=qs('#submitMessage'); setMessage(msg,'');
    if(!session){ location.href='index.html'; return; }
    const fd=new FormData(e.currentTarget); const data={};
    for(const [k,v] of fd.entries()){ data[k]=v===''?null:v; }
    try{
      await api('/api/submit',{method:'POST',body:JSON.stringify({username:session.username,pin:session.pin,report_type:e.currentTarget.dataset.reportType,date:qs('#reportDate').value||today(),data})});
      setMessage(msg,'Тайлан амжилттай хадгалагдлаа. Баярлалаа!',true);
      e.currentTarget.reset();
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(err){ setMessage(msg,err.message); }
  }

  // ================================================================
  document.addEventListener('DOMContentLoaded',()=>{
    initIndex();
    if(document.body.dataset.page==='dashboard') initDashboard();
    if(document.body.dataset.page==='report') initReport();
  });

  return {reportTypes, forms};
})();

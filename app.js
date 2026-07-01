const GRD = (() => {
  const reportTypes = [
    {key:'production', name:'Үйлдвэрлэл / Лаб', desc:'Бүтээгдэхүүн, цахилгаан, түлш, лабораторийн үзүүлэлт'},
    {key:'transport', name:'Тээвэр', desc:'Шлам, хаягдал, богино рейс, бүтээгдэхүүн тээвэр, пүүний мэдээлэл'},
    {key:'fuel', name:'Түлш', desc:'Нэгтгэл түлш, техник тус бүр, түлш олголт'},
    {key:'equipment', name:'Техник', desc:'Ажилласан, засварт, парк'},
    {key:'camp', name:'Кемп / хүн хүч', desc:'Ажилтан, зочин, хоол'},
    {key:'hse', name:'ХАБЭА', desc:'Эмнэлгийн тусламж, зөрчил, цаг агаар'},
    {key:'issue', name:'Асуудал', desc:'Үйлдвэрийн үйл ажиллагаанд тулгарсан асуудал'}
  ];

  const moduleViews = {
    production: {
      title:'Үйлдвэрлэл / Лаб',
      cards:[['24 цагийн бүтээгдэхүүн','— тн','Өдөр + шөнө'],['Цахилгаан','— кВ','тоолуурын хэрэглээ'],['Үйлдвэрийн түлш','— л','24 цагийн нийлбэр'],['Лаб дундаж','—','Ad / G үзүүлэлт']],
      note:'Эхний ээлжинд бүх label Монгол хэлээр байна. Хятад ажилчны form дараа bilingual болгож болно.'
    },
    transport: {
      title:'Тээвэр',
      cards:[['Шлам','— тн','рейс / тонн'],['Хаягдал','— тн','үндсэн хаягдал'],['Богино рейс','— тн','хаягдалд нэмэгдэнэ'],['Пүүний бодит жин','— тн','тээвэр дотор']],
      note:'Пүүний мэдээлэл тусдаа module биш, Тээвэр дотор харагдана.'
    },
    fuel: {
      title:'Түлш',
      cards:[['Орлого','— л','түлшний машин + сав'],['Зарлага','— л','нийт хөдөлгөөн'],['Үлдэгдэл','— л','нийт нөөц'],['Зөрүү','—','нэгтгэл vs техник']],
      note:'Нэгтгэл түлш, техник тус бүрийн түлш, түлш олголтын form хоорондын тулгалт дараагийн шатанд идэвхжинэ.'
    },
    equipment: {
      title:'Техник',
      cards:[['Ажилласан','—','үндсэн + түрээс'],['Засварт','—','эвдрэл / засвар'],['Парк','—','ажиллаагүй'],['Ашиглалт','— %','ажилласан хувь']],
      note:'Парк болон засварт гэсэн төлөвүүдийг тус тусад нь хадгална.'
    },
    camp: {
      title:'Кемп / хүн хүч',
      cards:[['Нийт хүн','—','Монгол + Хятад + бусад'],['Хятад ажилтан','—','тоо'],['Гаднаас хооллосон','—','тоо'],['Зочин','—','тоо']],
      note:'Кемп менежер бүх тайланг нэгтгэхгүй, зөвхөн өөрийн хэсгээ оруулна.'
    },
    hse: {
      title:'ХАБЭА',
      cards:[['Эмнэлгийн тусламж','—','тоо'],['ХАБ зөрчил','—','тоо'],['Өдрийн хэм','— ℃','цаг агаар'],['Салхи','— м/с','цаг агаар']],
      note:'ХАБЭА болон цаг агаарын мэдээллийг өдөр тутмын dashboard module болгон харуулна.'
    },
    issue: {
      title:'Асуудал',
      cards:[['Нээлттэй асуудал','—','шийдээгүй'],['Шийдсэн','—','хаагдсан'],['Ноцтой','—','high'],['Нийт','—','тухайн өдөр']],
      note:'Үйлдвэрийн үйл ажиллагаанд тулгарсан асуудлыг issue log хэлбэрээр хадгална.'
    }
  };

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

  function today(){ return new Date().toISOString().slice(0,10); }
  function qs(s,root=document){return root.querySelector(s)}
  function qsa(s,root=document){return Array.from(root.querySelectorAll(s))}
  function setMessage(el, text, ok=false){ if(!el) return; el.innerHTML = text ? `<div class="alert ${ok?'alert-ok':'alert-error'}">${escapeHtml(text)}</div>` : ''; }
  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function getSession(){ try{return JSON.parse(sessionStorage.getItem('grdSession')||localStorage.getItem('grdSession')||'null')}catch(e){return null} }
  function saveSession(session, remember=false){ const target=remember?localStorage:sessionStorage; target.setItem('grdSession', JSON.stringify(session)); if(remember) sessionStorage.removeItem('grdSession'); else localStorage.removeItem('grdSession'); }
  function clearSession(){ sessionStorage.removeItem('grdSession'); localStorage.removeItem('grdSession'); }
  function showUser(){ const s=getSession(); qsa('#userPill').forEach(el=>{el.textContent=s?`${s.name||s.username} · ${s.role}`:''}); qsa('#logoutBtn').forEach(btn=>{ if(s) btn.classList.remove('hidden'); btn.onclick=()=>{clearSession(); location.href='index.html'}; }); }

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

  function initIndex(){
    const form=qs('#loginForm'); if(!form) return;
    const saved=getSession();
    if(saved){ if(saved.role==='worker') location.href='report.html'; else location.href='dashboard.html'; return; }
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const msg=qs('#loginMessage'); setMessage(msg,'');
      const username=qs('#username').value.trim(); const pin=qs('#pin').value.trim();
      try{
        const data=await login(username,pin);
        const remember=qs('#remember')?.checked;
        saveSession({...data.user, pin, permissions:data.permissions||[]}, remember);
        location.href = data.user.role==='worker' ? 'report.html' : 'dashboard.html';
      }catch(err){ setMessage(msg, err.message); }
    });
  }

  function initDashboard(){
    showUser();
    const s=getSession();
    if(!s){ location.href='index.html'; return; }
    if(s.role==='worker'){ location.href='report.html'; return; }
    const nav=qs('#moduleNav'); const panel=qs('#modulePanel');
    function renderNav(activeKey='production'){
      nav.innerHTML=reportTypes.map(t=>`<button class="nav-btn ${t.key===activeKey?'active':''}" data-key="${t.key}">${escapeHtml(t.name)}</button>`).join('');
      qsa('.nav-btn',nav).forEach(btn=>btn.onclick=()=>renderModule(btn.dataset.key));
    }
    function renderModule(key){
      renderNav(key);
      const m=moduleViews[key];
      panel.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.note)}</p></div><span class="badge badge-muted">Module view</span></div><div class="cards">${m.cards.map(c=>`<div class="card"><div class="label">${escapeHtml(c[0])}</div><div class="value">${escapeHtml(c[1])}</div><div class="sub">${escapeHtml(c[2])}</div></div>`).join('')}</div><div class="module-empty" style="margin-top:16px">Энэ module-ийн нарийвчилсан хүснэгт, chart, validation-г дараагийн алхмаар нэг бүрчлэн нэмнэ.</div></section>`;
    }
    function openMonth(){ qs('#monthHome')?.classList.add('hidden'); qs('#monthDashboard')?.classList.remove('hidden'); renderModule('production'); }
    qs('#openMonthBtn')?.addEventListener('click',openMonth);
    qsa('.month-card[data-month]').forEach(card=>card.addEventListener('click',openMonth));
  }

  function initReport(){
    showUser();
    qs('#reportDate') && (qs('#reportDate').value=today());
    const existing=getSession();
    if(existing && existing.role){ showReportWorkspace(existing); }
    const form=qs('#reportLoginForm');
    if(form){
      form.addEventListener('submit', async e=>{
        e.preventDefault(); const msg=qs('#reportLoginMessage'); setMessage(msg,'');
        const username=qs('#reportUsername').value.trim(); const pin=qs('#reportPin').value.trim();
        try{ const data=await login(username,pin); const session={...data.user,pin,permissions:data.permissions||[]}; saveSession(session,false); showReportWorkspace(session); }
        catch(err){ setMessage(msg,err.message); }
      });
    }
  }

  function showReportWorkspace(session){
    showUser();
    qs('#reportLogin')?.classList.add('hidden'); qs('#reportWorkspace')?.classList.remove('hidden'); qs('#logoutBtn')?.classList.remove('hidden');
    const allowedKeys = session.role==='admin' || session.role==='viewer' ? reportTypes.map(t=>t.key) : (session.permissions||[]);
    const allowed = reportTypes.filter(t=>allowedKeys.includes(t.key));
    const box=qs('#allowedReports');
    if(!allowed.length){ box.innerHTML='<div class="module-empty">Танд тайлан оруулах эрх тохируулагдаагүй байна.</div>'; return; }
    box.innerHTML=allowed.map((t,i)=>`<button class="permission-card ${i===0?'active':''}" data-key="${t.key}"><span>${escapeHtml(t.name)}</span><small>${escapeHtml(t.desc)}</small></button>`).join('');
    qsa('.permission-card',box).forEach(btn=>btn.onclick=()=>selectReport(btn.dataset.key));
    selectReport(allowed[0].key);
  }

  function selectReport(key){
    qsa('.permission-card').forEach(b=>b.classList.toggle('active',b.dataset.key===key));
    const type=reportTypes.find(t=>t.key===key);
    qs('#formPanel')?.classList.remove('hidden'); qs('#formTitle').textContent=type?.name||'Тайлан'; qs('#formDesc').textContent=type?.desc||''; setMessage(qs('#submitMessage'),'');
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
    if(!session){ setMessage(msg,'Дахин нэвтэрнэ үү.'); return; }
    const fd=new FormData(e.currentTarget); const data={};
    for(const [k,v] of fd.entries()){ data[k]=v===''?null:v; }
    try{
      await api('/api/submit',{method:'POST',body:JSON.stringify({username:session.username,pin:session.pin,report_type:e.currentTarget.dataset.reportType,date:qs('#reportDate').value||today(),data})});
      setMessage(msg,'Тайлан амжилттай хадгалагдлаа.',true); e.currentTarget.reset();
    }catch(err){ setMessage(msg,err.message); }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    initIndex();
    if(document.body.dataset.page==='dashboard') initDashboard();
    if(document.body.dataset.page==='report') initReport();
  });

  return {reportTypes, forms};
})();

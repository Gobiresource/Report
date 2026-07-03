/**
 * ГОВЬ РЕСУРС ДЕВЕЛОПМЕНТ ХХК — Dashboard
 * ---------------------------------------------------------------
 * Нэг файлд бүх хуудасны логик. Аль хуудсан дээр ажиллаж байгааг
 * <body data-page="..."> attribute-аар мэдэж, тохирох init() функцээ
 * дуудна.
 *
 * Модулиуд:
 *   CONFIG   — тайлангийн төрөл, form-ын талбар, KPI тооцоолол
 *   SESSION  — нэвтэрсэн хэрэглэгчийн мэдээллийг browser-т хадгалах
 *   API      — сервертэй харилцах цорын ганц цэг
 *   UI       — DOM туслах функцууд
 *   PAGE.*   — хуудас бүрийн init логик
 * ---------------------------------------------------------------
 */

/* ================================================================
   CONFIG — тайлангийн 7 модуль, тэдгээрийн form болон KPI тооцоолол
   ================================================================ */
const CONFIG = (() => {
  // Модуль бүрийн icon (16px stroke SVG, currentColor)
  const I = {
    factory:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l6 4V9l6 4V9l6 4v8H3z"/><path d="M7 21v-3M12 21v-3M17 21v-3"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h13v9H1zM14 11h4l4 3v3h-8z"/><circle cx="6" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/></svg>',
    drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
    people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/><path d="M16 5.5a3 3 0 0 1 0 5.6M18.5 15.5c1.8.7 2.8 2.2 3 4.5"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4.5 5v6c0 5 3.2 8.7 7.5 11 4.3-2.3 7.5-6 7.5-11V5L12 2z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></svg>',
    alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 1.8 20.5h20.4L12 3z"/><path d="M12 10v4.5M12 18h.01"/></svg>'
  };

  const reportTypes = [
    {key:'production', tag:'PRD', name:'Үйлдвэрлэл / Лаб', desc:'Бүтээгдэхүүн, цахилгаан, түлш, лабораторийн үзүүлэлт', color:'var(--c-production)', icon:I.factory},
    {key:'transport',  tag:'TRN', name:'Тээвэр',            desc:'Шлам, хаягдал, богино рейс, бүтээгдэхүүн тээвэр, пүү', color:'var(--c-transport)', icon:I.truck},
    {key:'fuel',       tag:'FUE', name:'Түлш',              desc:'Нэгтгэл түлш, техник тус бүр, түлш олголт', color:'var(--c-fuel)', icon:I.drop},
    {key:'equipment',  tag:'EQP', name:'Техник',            desc:'Ажилласан, засварт, парк', color:'var(--c-equipment)', icon:I.gear},
    {key:'camp',       tag:'CMP', name:'Кемп / хүн хүч',    desc:'Ажилтан, зочин, хоол', color:'var(--c-camp)', icon:I.people},
    {key:'hse',        tag:'HSE', name:'ХАБЭА',             desc:'Эмнэлгийн тусламж, зөрчил, цаг агаар', color:'var(--c-hse)', icon:I.shield},
    {key:'issue',      tag:'ISU', name:'Асуудал',           desc:'Үйлдвэрийн үйл ажиллагаанд тулгарсан асуудал', color:'var(--c-issue)', icon:I.alert}
  ];

  const forms = {
    production: [
      {name:'shift_day_product_ton',   label:'Өдрийн ээлжийн бүтээгдэхүүн / тн', type:'number'},
      {name:'shift_night_product_ton', label:'Шөнийн ээлжийн бүтээгдэхүүн / тн', type:'number'},
      {name:'day_meter',   label:'Өдрийн тоолуурын заалт',    type:'number'},
      {name:'night_meter', label:'Шөнийн тоолуурын заалт',    type:'number'},
      {name:'day_fuel_liter',   label:'Өдрийн үйлдвэрийн түлш / л', type:'number'},
      {name:'night_fuel_liter', label:'Шөнийн үйлдвэрийн түлш / л', type:'number'},
      {name:'middling_ton', label:'Мидлинг / тн', type:'number'},
      {name:'lab_avg_luojing_ad', label:'Лаб дундаж: Лоожин Ad',   type:'number'},
      {name:'lab_avg_fumei_ad',   label:'Лаб дундаж: Фумэй Ad',    type:'number'},
      {name:'lab_avg_caking_g',   label:'Лаб дундаж: Барьцалдах G',type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    transport: [
      {name:'sludge_trips', label:'Шлам рейс', type:'number'},
      {name:'sludge_ton',   label:'Шлам тонн', type:'number'},
      {name:'waste_trips',  label:'Хаягдал рейс', type:'number'},
      {name:'waste_ton',    label:'Хаягдал тонн', type:'number'},
      {name:'short_waste_trips', label:'Богино дотор рейс', type:'number'},
      {name:'short_waste_ton',   label:'Богино дотор рейс тонн', type:'number'},
      {name:'product_transport_trips', label:'Бүтээгдэхүүн тээвэр рейс', type:'number'},
      {name:'product_transport_ton',   label:'Бүтээгдэхүүн тээвэр тонн', type:'number'},
      {name:'weighbridge_net_ton', label:'Пүүний бодит цэвэр жин / тн', type:'number'},
      {name:'weighbridge_trips',   label:'Пүүний рейс', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    fuel: [
      {name:'fuel_truck_income_liter',  label:'Түлшний машин орлого / л', type:'number'},
      {name:'fuel_truck_opening_liter', label:'Түлшний машин эхний үлдэгдэл / л', type:'number'},
      {name:'fuel_truck_machine_liter', label:'Машинд олгосон / л', type:'number'},
      {name:'fuel_truck_plant_liter',   label:'Үйлдвэрт олгосон / л', type:'number'},
      {name:'fuel_truck_closing_liter', label:'Түлшний машин үлдэгдэл / л', type:'number'},
      {name:'reserve_tank_opening_liter', label:'Нөөцийн сав эхний үлдэгдэл / л', type:'number'},
      {name:'reserve_tank_expense_liter', label:'Нөөцийн сав зарлага / л', type:'number'},
      {name:'reserve_tank_closing_liter', label:'Нөөцийн сав үлдэгдэл / л', type:'number'},
      {name:'fuel_issue_total_liter', label:'Түлш олголтын нийт / л', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    equipment: [
      {name:'main_working_count', label:'Үндсэн техник ажилласан', type:'number'},
      {name:'rental_sludge_working_count',   label:'Шлам тээврийн түрээс ажилласан', type:'number'},
      {name:'product_transport_working_count', label:'Бүтээгдэхүүн тээврийн түрээс ажилласан', type:'number'},
      {name:'repair_count', label:'Засвартай техник', type:'number'},
      {name:'parked_count', label:'Парк дээр', type:'number'},
      {name:'equipment_note', label:'Засвартай техникүүд / тайлбар', type:'textarea', full:true}
    ],
    camp: [
      {name:'mongolian_count', label:'Монгол ажилтан', type:'number'},
      {name:'chinese_count',   label:'Хятад ажилтан', type:'number'},
      {name:'guard_count',     label:'Харуул', type:'number'},
      {name:'guest_count',     label:'Зочин', type:'number'},
      {name:'outside_meal_count', label:'Гаднаас хооллосон хүн', type:'number'},
      {name:'contractor_count',   label:'Барилга / туслан гүйцэтгэгч', type:'number'},
      {name:'camp_staff_count',   label:'Кемпийн ажилтан', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    hse: [
      {name:'medical_assistance_count', label:'Эмнэлгийн тусламж', type:'number'},
      {name:'hse_violation_count', label:'ХАБ зөрчил', type:'number'},
      {name:'day_temp_c',   label:'Өдрийн хэм ℃', type:'number'},
      {name:'night_temp_c', label:'Шөнийн хэм ℃', type:'number'},
      {name:'humidity_percent', label:'Чийг %', type:'number'},
      {name:'wind_speed_ms',    label:'Салхины хурд м/с', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    issue: [
      {name:'issue_text', label:'Асуудлын тайлбар', type:'textarea', full:true},
      {name:'severity', label:'Ноцтой байдал', type:'select', options:[['low','Бага'],['medium','Дунд'],['high','Өндөр']]},
      {name:'status',   label:'Төлөв', type:'select', options:[['open','Нээлттэй'],['resolved','Шийдсэн']]},
      {name:'action_taken', label:'Авсан арга хэмжээ', type:'textarea', full:true},
      {name:'responsible_person', label:'Хариуцсан хүн', type:'text'}
    ]
  };

  // Захирлын dashboard дээр харагдах KPI карт бүрийн тооцоолол
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const summaryCards = [
    {
      key:'production', label:'24 цагийн бүтээгдэхүүн', unit:'тн',
      calc: d => num(d.shift_day_product_ton) + num(d.shift_night_product_ton),
      sub: d => `Өдөр ${num(d.shift_day_product_ton)} + Шөнө ${num(d.shift_night_product_ton)}`
    },
    {
      key:'transport', label:'Тээвэрлэсэн нийт', unit:'тн',
      calc: d => num(d.sludge_ton) + num(d.waste_ton) + num(d.short_waste_ton) + num(d.product_transport_ton),
      sub: d => `Шлам ${num(d.sludge_ton)} · Хаягдал ${num(d.waste_ton)+num(d.short_waste_ton)} · Бүт. ${num(d.product_transport_ton)}`
    },
    {
      key:'fuel', label:'Түлшний зарлага', unit:'л',
      calc: d => num(d.fuel_truck_machine_liter) + num(d.fuel_truck_plant_liter) + num(d.reserve_tank_expense_liter),
      sub: d => `Үлдэгдэл ${num(d.fuel_truck_closing_liter)+num(d.reserve_tank_closing_liter)} л`
    },
    {
      key:'equipment', label:'Ажилласан техник', unit:'',
      calc: d => num(d.main_working_count) + num(d.rental_sludge_working_count) + num(d.product_transport_working_count),
      sub: d => `Засварт ${num(d.repair_count)} · Парк ${num(d.parked_count)}`
    },
    {
      key:'camp', label:'Нийт хүн хүч', unit:'',
      calc: d => num(d.mongolian_count) + num(d.chinese_count) + num(d.guard_count) + num(d.contractor_count) + num(d.camp_staff_count),
      sub: d => `Монгол ${num(d.mongolian_count)} · Хятад ${num(d.chinese_count)} · Зочин ${num(d.guest_count)}`
    },
    {
      key:'hse', label:'ХАБ зөрчил / Эмнэлэг', unit:'',
      calc: d => num(d.hse_violation_count) + num(d.medical_assistance_count),
      sub: d => `Зөрчил ${num(d.hse_violation_count)} · Тусламж ${num(d.medical_assistance_count)}`,
      warnIf: d => (num(d.hse_violation_count) + num(d.medical_assistance_count)) > 0
    },
    {
      key:'issue', label:'Асуудал', unit:'',
      calc: d => d.issue_text ? 1 : 0,
      sub: d => d.status === 'open' ? 'Нээлттэй асуудал байна' : (d.issue_text ? 'Шийдэгдсэн' : 'Бүртгэл алга'),
      warnIf: d => d.status === 'open'
    }
  ];

  return {reportTypes, forms, summaryCards, num};
})();

/* ================================================================
   SESSION — нэвтэрсэн хэрэглэгчийн мэдээлэл
   ================================================================ */
const SESSION = (() => {
  const KEY = 'grd_session';
  function get(){ try{ return JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || 'null'); }catch(e){ return null; } }
  function save(session, remember){
    const target = remember ? localStorage : sessionStorage;
    target.setItem(KEY, JSON.stringify(session));
    (remember ? sessionStorage : localStorage).removeItem(KEY);
  }
  function clear(){ sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); }
  return {get, save, clear};
})();

/* ================================================================
   API — серверийн /api/* endpoint-үүдтэй харилцах
   ================================================================ */
const API = (() => {
  async function call(path, body){
    const res = await fetch(path, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body || {})
    });
    let data;
    try{ data = await res.json(); }catch(e){ data = {ok:false, error:'Серверээс буруу хариу ирлээ.'}; }
    if(!res.ok || data.ok === false) throw new Error(data.error || 'Серверийн алдаа гарлаа.');
    return data;
  }
  function withAuth(extra){
    const s = SESSION.get() || {};
    return {username:s.username, pin:s.pin, ...extra};
  }
  return {
    login: (username, pin) => call('/api/login', {username, pin}),
    submit: (payload) => call('/api/submit', withAuth(payload)),
    daily: (date) => call('/api/daily', withAuth({date})),
    monthly: (month) => call('/api/monthly', withAuth({month}))
  };
})();

/* ================================================================
   UI — DOM туслах функцууд
   ================================================================ */
const UI = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const today = () => new Date().toISOString().slice(0,10);
  const thisMonth = () => today().slice(0,7);
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  function fmt(n){
    if(n === null || n === undefined || isNaN(n)) return '—';
    return (Math.round(n*10)/10).toLocaleString('en-US', {maximumFractionDigits:1});
  }
  function alertBox(el, text, ok=false){
    if(!el) return;
    el.innerHTML = text ? `<div class="alert ${ok?'alert-ok':'alert-error'}">${esc(text)}</div>` : '';
  }
  function paintUserChrome(){
    const s = SESSION.get();
    $$('#userPill').forEach(el => el.textContent = s ? (s.name || s.username) : '');
    $$('#logoutBtn').forEach(btn => {
      if(s) btn.classList.remove('hidden');
      btn.onclick = () => { SESSION.clear(); location.href = 'index.html'; };
    });
  }
  /** KPI тоог 0-ээс зорилтот утга руу зөөлөн гүйлгэж тоолно (ease-out). */
  function animateCounts(root){
    if(!root) return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.count[data-count]', root).forEach(el => {
      const target = parseFloat(el.dataset.count);
      if(isNaN(target) || target === 0) return;
      const dur = 650, t0 = performance.now();
      function tick(now){
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if(p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target);
      }
      requestAnimationFrame(tick);
    });
  }
  return {esc, today, thisMonth, $, $$, fmt, alertBox, paintUserChrome, animateCounts};
})();

/* ================================================================
   PAGE: НЭВТРЭХ (index.html)
   ================================================================ */
const PageLogin = () => {
  const form = UI.$('#loginForm');
  if(!form) return;

  const existing = SESSION.get();
  if(existing){ routeByRole(existing); return; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl = UI.$('#loginMessage');
    const btn = UI.$('button[type=submit]', form);
    UI.alertBox(msgEl, '');
    btn.disabled = true;
    const username = UI.$('#username').value.trim();
    const pin = UI.$('#pin').value.trim();
    try{
      const data = await API.login(username, pin);
      const remember = UI.$('#remember')?.checked;
      SESSION.save({...data.user, pin, permissions: data.permissions || []}, remember);
      routeByRole(data.user);
    }catch(err){
      UI.alertBox(msgEl, err.message);
      btn.disabled = false;
    }
  });

  function routeByRole(user){
    location.href = (user.role === 'worker') ? 'report.html' : 'dashboard.html';
  }
};

/* ================================================================
   PAGE: DASHBOARD (dashboard.html) — Захирал болон ажилтан хоёулаа
   энэ хуудсыг харах эрхтэй.
   ================================================================ */
const PageDashboard = () => {
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }

  let dailyMap = {}; // report_type -> {data, submitted_by_name, updated_at}

  const dateInput = UI.$('#dashboardDate');
  const monthInput = UI.$('#dashboardMonth');
  dateInput.value = UI.today();
  monthInput.value = UI.thisMonth();
  dateInput.onchange = () => loadDaily(dateInput.value);
  monthInput.onchange = () => loadMonthly(monthInput.value);
  UI.$('#prevDayBtn').onclick = () => shiftDay(-1);
  UI.$('#nextDayBtn').onclick = () => shiftDay(1);

  function shiftDay(delta){
    const d = new Date(dateInput.value || UI.today());
    d.setDate(d.getDate() + delta);
    dateInput.value = d.toISOString().slice(0,10);
    loadDaily(dateInput.value);
  }

  async function loadDaily(date){
    const msg = UI.$('#dashboardMessage');
    UI.alertBox(msg, '');
    UI.$('#statusRow').innerHTML = '';
    UI.$('#summaryCards').innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    UI.$('#moduleDetail').innerHTML = '';
    try{
      const res = await API.daily(date);
      dailyMap = {};
      (res.reports || []).forEach(r => { dailyMap[r.report_type] = r; });
      renderStatusRow();
      renderSummaryCards();
    }catch(err){
      if(/нэвтрэлт|эрхгүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.$('#summaryCards').innerHTML = '';
      UI.alertBox(msg, err.message);
    }
  }

  function renderStatusRow(){
    const submitted = CONFIG.reportTypes.filter(t => dailyMap[t.key]).length;
    const total = CONFIG.reportTypes.length;

    // Ирцийн дугуй заалт (progress ring)
    const ringBox = UI.$('#attendanceRing');
    if(ringBox){
      const R = 22, C = 2 * Math.PI * R;
      ringBox.innerHTML = `<div class="ring-wrap">
        <div class="ring-box">
          <svg class="ring" width="52" height="52" viewBox="0 0 52 52">
            <circle class="ring-bg" cx="26" cy="26" r="${R}" stroke-width="5"/>
            <circle class="ring-fg" cx="26" cy="26" r="${R}" stroke-width="5"
              stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/>
          </svg>
          <span class="ring-label">${submitted}/${total}</span>
        </div>
        <span class="ring-cap">тайлан<br>ирсэн</span>
      </div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const fg = UI.$('.ring-fg', ringBox);
        if(fg) fg.style.strokeDashoffset = (C * (1 - submitted/total)).toFixed(1);
      }));
    }

    UI.$('#statusRow').innerHTML = CONFIG.reportTypes.map(t => {
      const r = dailyMap[t.key];
      const chip = `<span class="mchip" style="background:${t.color}">${t.icon}</span>`;
      if(r){
        const time = (r.updated_at || '').slice(11,16);
        return `<button class="status-dial lit" data-key="${t.key}">
          ${chip}
          <span class="dial-text">
            <span class="dial-name">${UI.esc(t.name)}</span>
            <span class="dial-meta">${UI.esc(r.submitted_by_name || '')}${time ? ' · '+time : ''}</span>
          </span>
        </button>`;
      }
      return `<div class="status-dial pending">
        ${chip}
        <span class="dial-text">
          <span class="dial-name">${UI.esc(t.name)}</span>
          <span class="dial-meta">Хүлээгдэж байна</span>
        </span>
      </div>`;
    }).join('');
    UI.$$('.status-dial.lit').forEach(btn => btn.onclick = () => renderModuleDetail(btn.dataset.key));
  }

  function renderSummaryCards(){
    UI.$('#summaryCards').innerHTML = CONFIG.summaryCards.map(c => {
      const r = dailyMap[c.key];
      const type = CONFIG.reportTypes.find(t => t.key === c.key) || {};
      const chip = `<span class="mchip" style="background:${type.color}">${type.icon || ''}</span>`;
      if(!r){
        return `<div class="bezel card card-missing"><span class="tick-a"></span><span class="tick-b"></span>
          <div class="card-tag-row"><span class="label">${chip}${UI.esc(c.label)}</span></div>
          <div class="value">—</div><div class="sub">Тайлан ороогүй</div></div>`;
      }
      const val = c.calc(r.data);
      const warn = c.warnIf ? c.warnIf(r.data) : false;
      return `<div class="bezel card ${warn?'card-warn':''}"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${chip}${UI.esc(c.label)}</span></div>
        <div class="value"><span class="count" data-count="${val}">${UI.fmt(val)}</span>${c.unit ? ' <span class="unit">'+c.unit+'</span>' : ''}</div>
        <div class="sub">${UI.esc(c.sub(r.data))}</div></div>`;
    }).join('');
    UI.animateCounts(UI.$('#summaryCards'));
  }

  function renderModuleDetail(key){
    const r = dailyMap[key];
    const type = CONFIG.reportTypes.find(t => t.key === key);
    const box = UI.$('#moduleDetail');
    if(!r || !type){ box.innerHTML = ''; return; }
    const fields = CONFIG.forms[key] || [];
    const rows = fields.map(f => {
      let v = r.data[f.name];
      if(v === null || v === undefined || v === ''){ v = '—'; }
      else if(f.type === 'select'){ const opt = (f.options||[]).find(o => o[0] === v); v = opt ? opt[1] : v; }
      return `<tr><td>${UI.esc(f.label)}</td><td class="right">${UI.esc(v)}</td></tr>`;
    }).join('');
    box.innerHTML = `<section class="bezel panel"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="panel-head">
        <div class="label-row"><span class="mchip" style="background:${type.color}">${type.icon}</span><div><h3>${UI.esc(type.name)} — дэлгэрэнгүй</h3>
        <p>Илгээсэн: ${UI.esc(r.submitted_by_name || '')} · ${UI.esc((r.updated_at||'').replace('T',' ').slice(0,16))}</p></div></div>
        <button class="btn btn-soft" id="closeDetail">Хаах</button>
      </div>
      <div class="table-wrap"><table class="table"><tbody>${rows}</tbody></table></div>
    </section>`;
    UI.$('#closeDetail').onclick = () => { box.innerHTML = ''; };
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  async function loadMonthly(month){
    const box = UI.$('#monthlyCards');
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const res = await API.monthly(month);
      const byType = {};
      (res.reports || []).forEach(r => { (byType[r.report_type] = byType[r.report_type] || []).push(r); });
      const sum = (key, field) => (byType[key]||[]).reduce((a,r) => a + CONFIG.num(r.data[field]), 0);
      const count = key => (byType[key]||[]).length;
      const openIssues = (byType['issue']||[]).filter(r => r.data.status === 'open').length;

      const cards = [
        ['Бүтээгдэхүүн нийт', UI.fmt(sum('production','shift_day_product_ton')+sum('production','shift_night_product_ton'))+' тн', count('production')+' өдрийн тайлан'],
        ['Тээвэр нийт', UI.fmt(sum('transport','sludge_ton')+sum('transport','waste_ton')+sum('transport','short_waste_ton')+sum('transport','product_transport_ton'))+' тн', count('transport')+' өдрийн тайлан'],
        ['Түлшний зарлага нийт', UI.fmt(sum('fuel','fuel_truck_machine_liter')+sum('fuel','fuel_truck_plant_liter')+sum('fuel','reserve_tank_expense_liter'))+' л', count('fuel')+' өдрийн тайлан'],
        ['ХАБ зөрчил / Эмнэлэг', UI.fmt(sum('hse','hse_violation_count'))+' / '+UI.fmt(sum('hse','medical_assistance_count')), count('hse')+' өдрийн тайлан'],
        ['Пүүний нийт жин', UI.fmt(sum('transport','weighbridge_net_ton'))+' тн', 'тээврийн тайлангаас'],
        ['Нээлттэй асуудал', String(openIssues), count('issue')+' бүртгэл']
      ];
      box.innerHTML = cards.map(c => `<div class="bezel card"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${UI.esc(c[0])}</span></div>
        <div class="value">${UI.esc(c[1])}</div><div class="sub">${UI.esc(c[2])}</div></div>`).join('');
    }catch(err){
      box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`;
    }
  }

  loadDaily(UI.today());
  loadMonthly(UI.thisMonth());
};

/* ================================================================
   PAGE: ТАЙЛАН ОРУУЛАХ (report.html) — ажилтны form
   ================================================================ */
const PageReport = () => {
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }

  UI.$('#reportDate').value = UI.today();

  const roleKey = session.role;
  const dept = CONFIG.reportTypes.find(t => t.key === session.department);
  const confirmBox = UI.$('#accessConfirm');
  confirmBox.innerHTML = `<span class="tick-a"></span><span class="tick-b"></span><span class="lamp"></span><span class="txt">Хандалт баталгаажлаа — <b>${UI.esc(session.name || session.username)}</b>
    <span>${dept ? '· '+UI.esc(dept.name) : (roleKey==='admin' ? '· Бүх эрх' : '')}</span></span>`;

  // Зөвхөн admin бүх form-д хандана. viewer болон worker — өөрийн эрхээрээ.
  // (Сервер ч мөн адил шалгадаг тул UI-д илүү form үзүүлбэл submit нь 403 буцаана.)
  const allowedKeys = (roleKey === 'admin')
    ? CONFIG.reportTypes.map(t => t.key)
    : (session.permissions || []);
  const allowed = CONFIG.reportTypes.filter(t => allowedKeys.includes(t.key));

  const pickerBox = UI.$('#allowedReports');
  if(!allowed.length){
    pickerBox.innerHTML = '<div class="module-empty">Танд тайлан оруулах эрх тохируулагдаагүй байна. Админд хандана уу.</div>';
    return;
  }
  pickerBox.innerHTML = allowed.map((t,i) => `<button class="permission-card ${i===0?'active':''}" data-key="${t.key}">
    <span style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><span class="mchip" style="background:${t.color}">${t.icon}</span><span class="ptag">${t.tag}</span></span>
    <span class="pname">${UI.esc(t.name)}</span><small>${UI.esc(t.desc)}</small>
  </button>`).join('');
  UI.$$('.permission-card', pickerBox).forEach(btn => btn.onclick = () => selectReport(btn.dataset.key));

  // Ганцхан эрхтэй бол сонголтын хэсгийг нуугаад шууд form руу
  if(allowed.length === 1){ UI.$('#reportPicker').classList.add('hidden'); }
  selectReport(allowed[0].key);

  function selectReport(key){
    UI.$$('.permission-card').forEach(b => b.classList.toggle('active', b.dataset.key === key));
    const type = CONFIG.reportTypes.find(t => t.key === key);
    UI.$('#formPanel').classList.remove('hidden');
    const tagEl = UI.$('#formTag');
    tagEl.className = 'mchip';
    tagEl.style.background = type.color;
    tagEl.innerHTML = type.icon;
    UI.$('#formTitle').textContent = type.name;
    UI.$('#formDesc').textContent = type.desc;
    UI.alertBox(UI.$('#submitMessage'), '');

    const fields = CONFIG.forms[key] || [];
    const form = UI.$('#dynamicReportForm');
    form.dataset.reportType = key;
    form.innerHTML = fields.map(renderField).join('') +
      `<div class="form-actions"><button type="reset" class="btn btn-soft">Цэвэрлэх</button><button type="submit" class="btn btn-primary">Илгээх</button></div>`;
    form.onsubmit = submitReport;
  }

  function renderField(f){
    const cls = f.full ? 'field full' : 'field';
    if(f.type === 'textarea') return `<div class="${cls}"><label>${UI.esc(f.label)}</label><textarea name="${f.name}" placeholder="Тайлбар"></textarea></div>`;
    if(f.type === 'select') return `<div class="${cls}"><label>${UI.esc(f.label)}</label><select name="${f.name}">${(f.options||[]).map(o=>`<option value="${UI.esc(o[0])}">${UI.esc(o[1])}</option>`).join('')}</select></div>`;
    return `<div class="${cls}"><label>${UI.esc(f.label)}</label><input name="${f.name}" type="${f.type||'text'}" ${f.type==='number'?'step="any"':''}></div>`;
  }

  async function submitReport(e){
    e.preventDefault();
    const msg = UI.$('#submitMessage');
    UI.alertBox(msg, '');
    const fd = new FormData(e.currentTarget);
    const data = {};
    for(const [k,v] of fd.entries()){ data[k] = (v === '') ? null : v; }
    const submitBtn = UI.$('button[type=submit]', e.currentTarget);
    submitBtn.disabled = true;
    try{
      await API.submit({
        report_type: e.currentTarget.dataset.reportType,
        date: UI.$('#reportDate').value || UI.today(),
        data
      });
      UI.alertBox(msg, 'Тайлан амжилттай хадгалагдлаа. Баярлалаа!', true);
      e.currentTarget.reset();
      window.scrollTo({top:0, behavior:'smooth'});
    }catch(err){
      if(/нэвтрэлт хүчингүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.alertBox(msg, err.message);
    }finally{
      submitBtn.disabled = false;
    }
  }
};

/* ================================================================
   ROUTER
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if(page === 'login')     PageLogin();
  if(page === 'dashboard') PageDashboard();
  if(page === 'report')    PageReport();
});

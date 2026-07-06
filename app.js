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

  // Машины зориулалт ба өмчлөлийн нэршил
  const purposeLabels = {sludge:'Шлам', waste:'Хаягдал', short:'Богино рейс', product:'Бүтээгдэхүүн', support:'Туслах'};
  const ownershipLabels = {own:'Өөрийн', rental_product:'Бүт. түрээс', rental_sludge:'Шлам түрээс'};
  const ownershipColors = {own:'var(--c-camp)', rental_product:'var(--c-transport)', rental_sludge:'var(--c-fuel)'};

  /** Тээврийн машин-мөрүүдээс зориулалтаар нь нийлбэр гаргана (KPI-тай нийцүүлэх) */
  function transportTotals(rows){
    const t = {sludge_trips:0,sludge_ton:0,waste_trips:0,waste_ton:0,short_waste_trips:0,short_waste_ton:0,product_transport_trips:0,product_transport_ton:0};
    (rows||[]).forEach(r => {
      const trips = num(r.trips), ton = num(r.ton);
      if(r.purpose === 'sludge'){ t.sludge_trips += trips; t.sludge_ton += ton; }
      else if(r.purpose === 'waste'){ t.waste_trips += trips; t.waste_ton += ton; }
      else if(r.purpose === 'short'){ t.short_waste_trips += trips; t.short_waste_ton += ton; }
      else if(r.purpose === 'product'){ t.product_transport_trips += trips; t.product_transport_ton += ton; }
    });
    return t;
  }

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
      {name:'weighbridge_net_ton', label:'Пүүний бодит цэвэр жин / тн', type:'number'},
      {name:'weighbridge_trips',   label:'Пүүний рейс', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true}
    ],
    fuel: [
      {name:'fuel_opening_liter', label:'Эхний үлдэгдэл / л (өмнөх өдрөөс автоматаар)', type:'number'},
      {name:'fuel_income_liter',  label:'Орлого / л (татан авалт)', type:'number'},
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
      calc: d => d.fuel_expense_liter !== undefined && d.fuel_expense_liter !== null
        ? num(d.fuel_expense_liter)
        : num(d.fuel_truck_machine_liter) + num(d.fuel_truck_plant_liter) + num(d.reserve_tank_expense_liter),
      sub: d => {
        const closing = (d.fuel_closing_liter !== undefined && d.fuel_closing_liter !== null)
          ? num(d.fuel_closing_liter)
          : num(d.fuel_truck_closing_liter) + num(d.reserve_tank_closing_liter);
        return closing < 0 ? `⚠ Үлдэгдэл ${closing} л — СӨРӨГ` : `Үлдэгдэл ${closing} л`;
      },
      warnIf: d => {
        const closing = (d.fuel_closing_liter !== undefined && d.fuel_closing_liter !== null)
          ? num(d.fuel_closing_liter)
          : num(d.fuel_truck_closing_liter) + num(d.reserve_tank_closing_liter);
        return closing < 0;
      }
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

  return {reportTypes, forms, summaryCards, num, purposeLabels, ownershipLabels, ownershipColors, transportTotals};
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
    monthly: (month) => call('/api/monthly', withAuth({month})),
    vehicles: () => call('/api/vehicles', withAuth({})),
    vehicleSave: (vehicle) => call('/api/vehicles/save', withAuth({vehicle})),
    vehicleRemove: (id) => call('/api/vehicles/remove', withAuth({id})),
    plan: (month) => call('/api/plan', withAuth({month})),
    planSave: (month, plan) => call('/api/plan/save', withAuth({month, plan}))
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
  const MN_MONTHS = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
  const MN_DAYS = ['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'];
  /** '2026-07-06' -> '2026 оны 7-р сарын 6, Даваа' */
  function formatDateMn(iso){
    if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${d.getFullYear()} оны ${MN_MONTHS[d.getMonth()]}ын ${d.getDate()}, ${MN_DAYS[d.getDay()]} гараг`;
  }

  /** SVG donut chart: segments = [{label, value, color}] */
  function donutHtml(segments, centerTop, centerBottom){
    const total = segments.reduce((a,s) => a + s.value, 0);
    if(total <= 0) return '';
    const R = 40, C = 2 * Math.PI * R;
    let offset = 0;
    const arcs = segments.filter(s => s.value > 0).map(s => {
      const frac = s.value / total;
      const dash = frac * C;
      const el = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${s.color}" stroke-width="13"
        stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
        stroke-linecap="butt"/>`;
      offset += dash;
      return el;
    }).join('');
    const legend = segments.map(s => {
      const pct = total ? Math.round(s.value/total*100) : 0;
      return `<div class="donut-leg"><span class="donut-dot" style="background:${s.color}"></span>
        <span class="donut-leg-label">${esc(s.label)}</span>
        <span class="donut-leg-val">${fmt(s.value)} <small>(${pct}%)</small></span></div>`;
    }).join('');
    return `<div class="donut-wrap">
      <div class="donut-fig">
        <svg viewBox="0 0 100 100" class="donut-svg"><g transform="rotate(-90 50 50)">${arcs}</g></svg>
        <div class="donut-center"><b>${esc(centerTop)}</b><small>${esc(centerBottom||'')}</small></div>
      </div>
      <div class="donut-legend">${legend}</div>
    </div>`;
  }

  /** Хэвтээ bar жагсаалт: items = [{label, badge, value, sub, color}], value-гийн max-аар хэмжээсжинэ */
  function barListHtml(items, valueSuffix){
    const max = Math.max(...items.map(i => i.value), 1);
    return `<div class="bar-list">` + items.map(i => {
      const w = Math.max((i.value / max) * 100, 2);
      return `<div class="bar-row">
        <div class="bar-row-head">
          <span class="bar-label">${esc(i.label)} ${i.badge || ''}</span>
          <span class="bar-val"><b>${fmt(i.value)}</b> ${valueSuffix || ''}${i.sub ? ' <small>· '+i.sub+'</small>' : ''}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${w.toFixed(1)}%;background:${i.color || 'var(--brand)'}"></div></div>
      </div>`;
    }).join('') + `</div>`;
  }

  return {esc, today, thisMonth, $, $$, fmt, alertBox, paintUserChrome, animateCounts, formatDateMn, donutHtml, barListHtml};
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
    // Hero-д тухайн өдрийн он/сар/өдрийг Монголоор бичнэ
    const heroLine = UI.$('#heroDateLine');
    if(heroLine) heroLine.textContent = UI.formatDateMn(date) + ' — хэлтэс бүрийн тайлангийн нэгтгэл.';
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
        const who = UI.esc(r.submitted_by_name || '');
        const meta = time ? `Илгээсэн: ${time}${who ? ' · '+who : ''}` : who;
        return `<button class="status-dial lit" data-key="${t.key}">
          ${chip}
          <span class="dial-text">
            <span class="dial-name">${UI.esc(t.name)}</span>
            <span class="dial-meta">${meta}</span>
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

    let body;
    if(key === 'fuel' && Array.isArray(r.data.vehicle_rows)){
      body = fuelDetailHtml(r.data);
    } else if(key === 'transport' && Array.isArray(r.data.vehicle_rows)){
      body = transportDetailHtml(r.data);
    } else {
      const fields = CONFIG.forms[key] || [];
      const rows = fields.map(f => {
        let v = r.data[f.name];
        if(v === null || v === undefined || v === ''){ v = '—'; }
        else if(f.type === 'select'){ const opt = (f.options||[]).find(o => o[0] === v); v = opt ? opt[1] : v; }
        return `<tr><td>${UI.esc(f.label)}</td><td class="right">${UI.esc(v)}</td></tr>`;
      }).join('');
      body = `<div class="table-wrap"><table class="table"><tbody>${rows}</tbody></table></div>`;
    }

    box.innerHTML = `<section class="bezel panel"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="panel-head">
        <div class="label-row"><span class="mchip" style="background:${type.color}">${type.icon}</span><div><h3>${UI.esc(type.name)} — дэлгэрэнгүй</h3>
        <p>Илгээсэн: ${UI.esc(r.submitted_by_name || '')} · ${UI.esc((r.updated_at||'').replace('T',' ').slice(0,16))}</p></div></div>
        <button class="btn btn-soft" id="closeDetail">Хаах</button>
      </div>${body}</section>`;
    UI.$('#closeDetail').onclick = () => { box.innerHTML = ''; };
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function ownBadge(ownership){
    const label = CONFIG.ownershipLabels[ownership] || ownership || '—';
    const color = CONFIG.ownershipColors[ownership] || 'var(--ink-3)';
    return `<span class="own-badge" style="background:${color}">${UI.esc(label)}</span>`;
  }

  /** Түлшний дэлгэрэнгүй: баланс + машин бүрийн хэрэглээ, тээвэртэй холбож л/тонн */
  function fuelDetailHtml(d){
    const n = CONFIG.num;
    const opening = n(d.fuel_opening_liter), income = n(d.fuel_income_liter);
    const expense = n(d.fuel_expense_liter), closing = n(d.fuel_closing_liter);
    const neg = closing < 0;

    // Тухайн өдрийн тээврийн машин-мөрүүд (рейс/тонн)
    const trn = dailyMap['transport'];
    const trnByVid = {};
    if(trn && Array.isArray(trn.data.vehicle_rows)){
      trn.data.vehicle_rows.forEach(row => { trnByVid[row.vid] = row; });
    }

    const sorted = (d.vehicle_rows || []).slice().sort((a,b) => n(b.liter) - n(a.liter));

    // Машины зарцуулалтын bar chart (өмчлөлийн өнгөөр)
    const barItems = sorted.filter(row => n(row.liter) > 0).map(row => {
      const t = trnByVid[row.vid];
      const ton = t ? n(t.ton) : 0;
      const lpt = (ton && n(row.liter)) ? (n(row.liter)/ton).toFixed(2) + ' л/тн' : '';
      return {
        label: row.name || '—',
        badge: ownBadge(row.ownership),
        value: n(row.liter),
        sub: lpt,
        color: CONFIG.ownershipColors[row.ownership] || 'var(--brand)'
      };
    });
    const barsBlock = barItems.length
      ? `<div class="viz-block"><div class="viz-title">Түлш зарцуулалт — машинаар</div>${UI.barListHtml(barItems, 'л')}</div>`
      : '';

    const rows = sorted.map(row => {
        const t = trnByVid[row.vid];
        const trips = t ? n(t.trips) : null;
        const ton = t ? n(t.ton) : null;
        const lpt = (ton && n(row.liter)) ? (n(row.liter)/ton) : null;
        return `<tr>
          <td>${UI.esc(row.name || '—')} ${ownBadge(row.ownership)}</td>
          <td class="right">${UI.fmt(n(row.liter))}</td>
          <td class="right">${row.moto ? UI.fmt(n(row.moto)) : '—'}</td>
          <td class="right">${row.remain !== '' && row.remain != null ? UI.fmt(n(row.remain)) : '—'}</td>
          <td class="right">${trips !== null ? UI.fmt(trips) : '—'}</td>
          <td class="right">${ton !== null ? UI.fmt(ton) : '—'}</td>
          <td class="right"><b>${lpt !== null ? lpt.toFixed(2) : '—'}</b></td>
        </tr>`;
      }).join('');

    return `
      <div class="fuel-calc detail-chips ${neg?'fuel-neg':''}">
        <span>Эхний үлдэгдэл: <b>${UI.fmt(opening)} л</b></span>
        <span>Орлого: <b>${UI.fmt(income)} л</b></span>
        <span>Зарлага: <b>${UI.fmt(expense)} л</b></span>
        <span>Үлдэгдэл: <b>${UI.fmt(closing)} л</b></span>
        ${neg ? '<span class="fuel-warn-txt">⚠ Сөрөг үлдэгдэл</span>' : ''}
      </div>
      ${barsBlock}
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Машин</th><th>Олгосон / л</th><th>Мото цаг</th><th>Машинд үлдсэн / л</th><th>Рейс</th><th>Тонн</th><th>л/тонн</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" class="muted">Машины мөр байхгүй</td></tr>'}</tbody>
      </table></div>
      ${d.note ? `<p class="muted" style="margin:12px 2px 0;font-size:13px">Тайлбар: ${UI.esc(d.note)}</p>` : ''}`;
  }

  /** Тээврийн дэлгэрэнгүй: donut + зориулалтын нийлбэр + машин бүрийн рейс/тонн */
  function transportDetailHtml(d){
    const n = CONFIG.num;
    const donut = UI.donutHtml([
      {label:'Шлам', value:n(d.sludge_ton), color:'var(--c-fuel)'},
      {label:'Хаягдал', value:n(d.waste_ton)+n(d.short_waste_ton), color:'var(--c-issue)'},
      {label:'Бүтээгдэхүүн', value:n(d.product_transport_ton), color:'var(--c-transport)'}
    ], UI.fmt(n(d.sludge_ton)+n(d.waste_ton)+n(d.short_waste_ton)+n(d.product_transport_ton)), 'нийт тн');
    const donutBlock = donut ? `<div class="viz-block"><div class="viz-title">Тээврийн бүтэц — тонноор</div>${donut}</div>` : '';
    const rows = (d.vehicle_rows || [])
      .slice()
      .sort((a,b) => n(b.ton) - n(a.ton))
      .map(row => `<tr>
        <td>${UI.esc(row.name || '—')} ${ownBadge(row.ownership)}</td>
        <td>${UI.esc(CONFIG.purposeLabels[row.purpose] || row.purpose || '—')}</td>
        <td class="right">${UI.fmt(n(row.trips))}</td>
        <td class="right">${UI.fmt(n(row.ton))}</td>
      </tr>`).join('');
    return `
      <div class="fuel-calc detail-chips">
        <span>Шлам: <b>${UI.fmt(n(d.sludge_ton))} тн / ${UI.fmt(n(d.sludge_trips))} рейс</b></span>
        <span>Хаягдал: <b>${UI.fmt(n(d.waste_ton)+n(d.short_waste_ton))} тн</b></span>
        <span>Бүтээгдэхүүн: <b>${UI.fmt(n(d.product_transport_ton))} тн / ${UI.fmt(n(d.product_transport_trips))} рейс</b></span>
        <span>Пүү: <b>${UI.fmt(n(d.weighbridge_net_ton))} тн / ${UI.fmt(n(d.weighbridge_trips))} рейс</b></span>
      </div>
      ${donutBlock}
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Машин</th><th>Зориулалт</th><th>Рейс</th><th>Тонн</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Машины мөр байхгүй</td></tr>'}</tbody>
      </table></div>
      ${d.note ? `<p class="muted" style="margin:12px 2px 0;font-size:13px">Тайлбар: ${UI.esc(d.note)}</p>` : ''}`;
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

      const fuelIncome = (byType['fuel']||[]).reduce((a,r)=>a+CONFIG.num(r.data.fuel_income_liter!=null?r.data.fuel_income_liter:r.data.fuel_truck_income_liter),0);
      const cards = [
        ['Түлшний орлого нийт', UI.fmt(fuelIncome)+' л', count('fuel')+' өдрийн тайлан'],
        ['Бүтээгдэхүүн нийт', UI.fmt(sum('production','shift_day_product_ton')+sum('production','shift_night_product_ton'))+' тн', count('production')+' өдрийн тайлан'],
        ['Тээвэр нийт', UI.fmt(sum('transport','sludge_ton')+sum('transport','waste_ton')+sum('transport','short_waste_ton')+sum('transport','product_transport_ton'))+' тн', count('transport')+' өдрийн тайлан'],
        ['Түлшний зарлага нийт', UI.fmt((byType['fuel']||[]).reduce((a,r)=>a+(r.data.fuel_expense_liter!=null?CONFIG.num(r.data.fuel_expense_liter):CONFIG.num(r.data.fuel_truck_machine_liter)+CONFIG.num(r.data.fuel_truck_plant_liter)+CONFIG.num(r.data.reserve_tank_expense_liter)),0))+' л', count('fuel')+' өдрийн тайлан'],
        ['ХАБ зөрчил / Эмнэлэг', UI.fmt(sum('hse','hse_violation_count'))+' / '+UI.fmt(sum('hse','medical_assistance_count')), count('hse')+' өдрийн тайлан'],
        ['Пүүний нийт жин', UI.fmt(sum('transport','weighbridge_net_ton'))+' тн', 'тээврийн тайлангаас'],
        ['Нээлттэй асуудал', String(openIssues), count('issue')+' бүртгэл']
      ];
      box.innerHTML = cards.map(c => `<div class="bezel card"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${UI.esc(c[0])}</span></div>
        <div class="value">${UI.esc(c[1])}</div><div class="sub">${UI.esc(c[2])}</div></div>`).join('');

      // Бодит гүйцэтгэлийг хадгалж, төлөвлөгөөтэй харьцуулна
      const actual = {
        production_ton: sum('production','shift_day_product_ton') + sum('production','shift_night_product_ton'),
        sludge_ton: sum('transport','sludge_ton'),
        sludge_trips: sum('transport','sludge_trips'),
        product_transport_ton: sum('transport','product_transport_ton'),
        product_transport_trips: sum('transport','product_transport_trips'),
        fuel_expense_liter: (byType['fuel']||[]).reduce((a,r)=>a+(r.data.fuel_expense_liter!=null?CONFIG.num(r.data.fuel_expense_liter):CONFIG.num(r.data.fuel_truck_machine_liter)+CONFIG.num(r.data.fuel_truck_plant_liter)+CONFIG.num(r.data.reserve_tank_expense_liter)),0)
      };
      renderPlanVsActual(month, actual);
      renderMonthlyMachines(byType);
    }catch(err){
      box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`;
    }
  }

  // Төлөвлөгөөний үзүүлэлтүүд — компанийн сарын төлөвлөгөөний бодит бүтцээр
  // (Бүтээгдэхүүн үйлдвэрлэлт тн, Шлам олборлолт тн + рейс, Бүтээгдэхүүн тээвэр тн + рейс, Түлш л)
  const PLAN_METRICS = [
    {key:'production_ton', label:'Бүтээгдэхүүн үйлдвэрлэлт', unit:'тн', higherBetter:true},
    {key:'sludge_ton', label:'Шлам олборлолт / тээвэрлэлт', unit:'тн', higherBetter:true},
    {key:'sludge_trips', label:'Шлам тээвэрлэлт', unit:'рейс', higherBetter:true},
    {key:'product_transport_ton', label:'Бүтээгдэхүүн тээвэрлэлт', unit:'тн', higherBetter:true},
    {key:'product_transport_trips', label:'Бүтээгдэхүүн тээвэрлэлт', unit:'рейс', higherBetter:true},
    {key:'fuel_expense_liter', label:'Түлшний зарлага', unit:'л', higherBetter:false}
  ];
  let currentPlan = {};
  let currentActual = {};

  async function renderPlanVsActual(month, actual){
    currentActual = actual;
    const box = UI.$('#planSection');
    if(!box) return;
    try{
      const res = await API.plan(month);
      currentPlan = res.plan || {};
    }catch(e){ currentPlan = {}; }

    const isAdmin = (SESSION.get() || {}).role === 'admin';
    const rows = PLAN_METRICS.map(m => {
      const plan = CONFIG.num(currentPlan[m.key]);
      const act = CONFIG.num(actual[m.key]);
      const hasPlan = plan > 0;
      const pct = hasPlan ? Math.round((act / plan) * 100) : null;
      // Түлш зарлага бол бага нь сайн — 100%-иас доош байвал ногоон
      const good = pct === null ? '' : (m.higherBetter ? (pct >= 100 ? 'plan-good' : (pct >= 80 ? 'plan-mid' : 'plan-low'))
                                                       : (pct <= 100 ? 'plan-good' : 'plan-low'));
      const barPct = pct === null ? 0 : Math.min(pct, 100);
      return `<div class="plan-row">
        <div class="plan-row-head">
          <span class="plan-name">${UI.esc(m.label)}</span>
          <span class="plan-nums">${UI.fmt(act)} / ${hasPlan ? UI.fmt(plan) : '—'} ${m.unit} ${pct!==null?`<b class="${good}">${pct}%</b>`:''}</span>
        </div>
        <div class="plan-bar"><div class="plan-bar-fill ${good}" style="width:${barPct}%"></div></div>
      </div>`;
    }).join('');

    box.innerHTML = `<section class="bezel panel"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="panel-head">
        <div><h3>Сарын төлөвлөгөө — гүйцэтгэл</h3><p>Тухайн сарын бодит дүнг төлөвлөгөөтэй харьцуулсан биелэлт.</p></div>
        ${isAdmin ? '<button class="btn btn-soft" id="editPlanBtn">Төлөвлөгөө засах</button>' : ''}
      </div>
      <div id="planBody">${rows}</div>
    </section>`;

    if(isAdmin){
      UI.$('#editPlanBtn').onclick = () => renderPlanEditor(month);
    }
  }

  function renderPlanEditor(month){
    const body = UI.$('#planBody');
    if(!body) return;
    body.innerHTML = PLAN_METRICS.map(m => `<div class="plan-edit-row">
      <label>${UI.esc(m.label)} (${m.unit})</label>
      <input type="number" step="any" min="0" data-key="${m.key}" value="${currentPlan[m.key] ?? ''}" placeholder="Төлөвлөгөө оруулах">
    </div>`).join('') +
    `<div class="form-actions"><button class="btn btn-soft" id="cancelPlanBtn">Болих</button><button class="btn btn-primary" id="savePlanBtn">Хадгалах</button></div>`;

    UI.$('#cancelPlanBtn').onclick = () => renderPlanVsActual(month, currentActual);
    UI.$('#savePlanBtn').onclick = async () => {
      const plan = {};
      UI.$$('[data-key]', body).forEach(inp => { if(inp.value !== '') plan[inp.dataset.key] = parseFloat(inp.value); });
      try{
        await API.planSave(month, plan);
        currentPlan = plan;
        renderPlanVsActual(month, currentActual);
      }catch(err){ alert(err.message); }
    };
  }

  /** Сарын машин тус бүрийн үр ашиг: түлш + тээврийг машинаар нэгтгэж л/тонн */
  function renderMonthlyMachines(byType){
    const box = UI.$('#monthlyMachines');
    if(!box) return;
    const n = CONFIG.num;
    const agg = {}; // vid -> {name, ownership, liter, trips, ton}
    const touch = row => {
      const k = row.vid || row.name;
      if(!k) return null;
      if(!agg[k]) agg[k] = {name: row.name || '—', ownership: row.ownership || '', liter:0, trips:0, ton:0};
      return agg[k];
    };
    (byType['fuel'] || []).forEach(r => (r.data.vehicle_rows || []).forEach(row => {
      const a = touch(row); if(a) a.liter += n(row.liter);
    }));
    (byType['transport'] || []).forEach(r => (r.data.vehicle_rows || []).forEach(row => {
      const a = touch(row); if(a){ a.trips += n(row.trips); a.ton += n(row.ton); }
    }));

    const list = Object.values(agg).filter(a => a.liter || a.ton || a.trips)
      .sort((a,b) => b.liter - a.liter);
    if(!list.length){ box.innerHTML = ''; return; }

    // Bar chart: машин бүрийн түлш зарцуулалт (өмчлөлийн өнгөөр, л/тонн-той)
    const barItems = list.filter(a => a.liter > 0).map(a => {
      const lpt = (a.ton && a.liter) ? (a.liter/a.ton).toFixed(2) + ' л/тн' : '';
      const parts = [];
      if(a.trips) parts.push(UI.fmt(a.trips)+' рейс');
      if(a.ton) parts.push(UI.fmt(a.ton)+' тн');
      if(lpt) parts.push(lpt);
      return {
        label: a.name,
        badge: ownBadge(a.ownership),
        value: a.liter,
        sub: parts.join(' · '),
        color: CONFIG.ownershipColors[a.ownership] || 'var(--brand)'
      };
    });
    const barsBlock = barItems.length
      ? `<div class="viz-block"><div class="viz-title">Сарын түлш зарцуулалт — машинаар</div>${UI.barListHtml(barItems, 'л')}</div>`
      : '';

    const rows = list.map(a => {
      const lpt = (a.ton && a.liter) ? (a.liter / a.ton) : null;
      return `<tr>
        <td>${UI.esc(a.name)} ${ownBadge(a.ownership)}</td>
        <td class="right">${UI.fmt(a.liter)}</td>
        <td class="right">${UI.fmt(a.trips)}</td>
        <td class="right">${UI.fmt(a.ton)}</td>
        <td class="right"><b>${lpt !== null ? lpt.toFixed(2) : '—'}</b></td>
      </tr>`;
    }).join('');

    box.innerHTML = `<section class="bezel panel"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="panel-head"><div><h3>Машин тус бүрийн үр ашиг</h3>
      <p>Сарын нийт түлш (шлам + бүтээгдэхүүн бүх тээвэр нэгтгэсэн), 1 тонн тутамд зарцуулсан литр.</p></div></div>
      ${barsBlock}
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Машин</th><th>Түлш / л</th><th>Рейс</th><th>Тонн</th><th>л/тонн</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>`;
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

  // Машины бүртгэлийг ачаална (тээвэр/түлш form-д хэрэгтэй). Ирсний дараа тухайн
  // form-ыг дахин зурж, машинуудыг гаргана. selectReport энэ үед аль хэдийн бэлэн.
  loadVehicles().then(() => {
    const canManage = roleKey === 'admin' || (session.permissions || []).includes('transport');
    if(canManage) renderVehicleManager();
    const form = UI.$('#dynamicReportForm');
    const key = form && form.dataset.reportType;
    if(key === 'fuel' || key === 'transport') selectReport(key);
  });

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

    if(key === 'fuel'){
      buildFuelForm(form, fields);
    } else if(key === 'transport'){
      buildTransportForm(form, fields);
    } else {
      form.innerHTML = fields.map(renderField).join('') +
        `<div class="form-actions"><button type="reset" class="btn btn-soft">Цэвэрлэх</button><button type="submit" class="btn btn-primary">Илгээх</button></div>`;
    }
    form.onsubmit = submitReport;
  }

  /* ---------------- Машины бүртгэл (registry) ---------------- */
  let VEHICLES = [];
  async function loadVehicles(){
    try{ VEHICLES = (await API.vehicles()).vehicles || []; }
    catch(e){ VEHICLES = []; }
  }
  function vehicleById(id){ return VEHICLES.find(v => String(v.id) === String(id)); }
  function vehicleOptions(selectedId, filter){
    const groups = {};
    VEHICLES.filter(v => !filter || filter(v)).forEach(v => {
      const g = CONFIG.ownershipLabels[v.ownership] || v.ownership;
      (groups[g] = groups[g] || []).push(v);
    });
    return '<option value="">— Машин сонгох —</option>' + Object.entries(groups).map(([g, vs]) =>
      `<optgroup label="${UI.esc(g)}">` +
      vs.map(v => `<option value="${v.id}" ${String(v.id)===String(selectedId)?'selected':''}>${UI.esc(v.name)}</option>`).join('') +
      `</optgroup>`).join('');
  }

  /* ---------------- Түлшний тусгай form (3 баганаар) ---------------- */
  function buildFuelForm(form, fields){
    if(!VEHICLES.length){
      form.innerHTML = '<div class="module-empty">Машины бүртгэл ачаалж байна… Хэрэв удаж байвал хуудсаа сэргээнэ үү.</div>';
      return;
    }
    const columns = OWNERSHIP_ORDER.map(o => {
      const vs = VEHICLES.filter(v => v.ownership === o.key);
      if(!vs.length) return '';
      const rows = vs.map(v => `<div class="mrow fuel" data-vid="${v.id}">
        <span class="mrow-name">${UI.esc(v.name)}</span>
        <input class="f-liter" type="number" step="any" min="0" placeholder="олгосон л">
        <input class="f-moto" type="number" step="any" min="0" placeholder="мото">
        <input class="f-remain" type="number" step="any" min="0" placeholder="үлдсэн л">
      </div>`).join('');
      return `<div class="own-col">
        <div class="own-col-head"><span class="own-dot" style="background:${o.color}"></span>${o.label} <small>(${vs.length})</small></div>
        <div class="mrow fuel head"><span class="mrow-name"></span><span>Олгосон</span><span>Мото</span><span>Үлдсэн</span></div>
        ${rows}
      </div>`;
    }).join('');

    form.innerHTML =
      fields.filter(f => f.name !== 'note').map(renderField).join('') +
      `<div class="full">
        <label class="block-label">Машин тус бүрийн олголт (олгосон / мото цаг / машинд үлдсэн, литрээр)</label>
        <div class="own-cols">${columns}</div>
      </div>
      <div class="full fuel-summary" id="fuelSummary"></div>` +
      fields.filter(f => f.name === 'note').map(renderField).join('') +
      `<div class="form-actions"><button type="reset" class="btn btn-soft">Цэвэрлэх</button><button type="submit" class="btn btn-primary">Илгээх</button></div>`;

    form.addEventListener('input', () => updateFuelSummary(form));
    form.addEventListener('reset', () => setTimeout(() => updateFuelSummary(form), 0));
    prefillFuelOpening(form);
    updateFuelSummary(form);
  }

  function collectFuelRows(form){
    return UI.$$('.own-col .mrow[data-vid]', form).map(row => {
      const v = vehicleById(row.dataset.vid);
      return {
        vid: row.dataset.vid,
        name: v ? v.name : '',
        ownership: v ? v.ownership : '',
        liter: row.querySelector('.f-liter').value,
        moto: row.querySelector('.f-moto').value,
        remain: row.querySelector('.f-remain').value
      };
    }).filter(r => r.liter || r.moto || r.remain);
  }

  function updateFuelSummary(form){
    const box = UI.$('#fuelSummary', form);
    if(!box) return;
    const opening = parseFloat(form.querySelector('[name=fuel_opening_liter]')?.value) || 0;
    const income  = parseFloat(form.querySelector('[name=fuel_income_liter]')?.value) || 0;
    const expense = collectFuelRows(form).reduce((a,r) => a + (parseFloat(r.liter)||0), 0);
    const closing = opening + income - expense;
    const neg = closing < 0;
    box.innerHTML = `<div class="fuel-calc ${neg?'fuel-neg':''}">
      <span>Орлого: <b>${UI.fmt(income)} л</b></span>
      <span>Зарлага: <b>${UI.fmt(expense)} л</b></span>
      <span>Үлдэгдэл: <b>${UI.fmt(closing)} л</b></span>
      ${neg ? '<span class="fuel-warn-txt">⚠ Сөрөг үлдэгдэл — орлого эсвэл олголтын тоо алдаатай байж магадгүй. Шалгаад илгээнэ үү.</span>' : ''}
    </div>`;
  }

  /** Өмнөх өдрийн түлшний үлдэгдлийг автоматаар эхний үлдэгдэлд тавина */
  async function prefillFuelOpening(form){
    const input = form.querySelector('[name=fuel_opening_liter]');
    if(!input || input.value) return;
    try{
      const d = new Date(UI.$('#reportDate').value || UI.today());
      d.setDate(d.getDate() - 1);
      const res = await API.daily(d.toISOString().slice(0,10));
      const fuel = (res.reports || []).find(r => r.report_type === 'fuel');
      if(fuel && fuel.data){
        const prev = fuel.data.fuel_closing_liter ?? fuel.data.fuel_truck_closing_liter;
        if(prev !== undefined && prev !== null && input.value === ''){
          input.value = prev;
          updateFuelSummary(form);
        }
      }
    }catch(e){ /* өмнөх өдрийн тайлан байхгүй бол хоосон үлдээнэ */ }
  }

  /* ---------------- Тээврийн тусгай form (3 баганаар) ---------------- */
  const OWNERSHIP_ORDER = [
    {key:'own', label:'Өөрийн', color:'var(--c-camp)'},
    {key:'rental_product', label:'Бүтээгдэхүүн түрээс', color:'var(--c-transport)'},
    {key:'rental_sludge', label:'Шлам түрээс', color:'var(--c-fuel)'}
  ];

  function buildTransportForm(form, fields){
    if(!VEHICLES.length){
      form.innerHTML = '<div class="module-empty">Машины бүртгэл ачаалж байна… Хэрэв удаж байвал хуудсаа сэргээнэ үү.</div>';
      return;
    }
    const columns = OWNERSHIP_ORDER.map(o => {
      const vs = VEHICLES.filter(v => v.ownership === o.key);
      if(!vs.length) return '';
      const rows = vs.map(v => `<div class="mrow" data-vid="${v.id}">
        <span class="mrow-name">${UI.esc(v.name)}</span>
        <input class="t-trips" type="number" step="1" min="0" placeholder="рейс">
        <input class="t-ton" type="number" step="any" min="0" placeholder="тонн">
      </div>`).join('');
      return `<div class="own-col">
        <div class="own-col-head"><span class="own-dot" style="background:${o.color}"></span>${o.label} <small>(${vs.length})</small></div>
        <div class="mrow head"><span class="mrow-name"></span><span>Рейс</span><span>Тонн</span></div>
        ${rows}
      </div>`;
    }).join('');

    form.innerHTML =
      `<div class="full">
        <label class="block-label">Машин тус бүрийн тээвэрлэлт</label>
        <div class="own-cols">${columns}</div>
      </div>
      <div class="full fuel-summary" id="trnSummary"></div>` +
      fields.map(renderField).join('') +
      `<div class="form-actions"><button type="reset" class="btn btn-soft">Цэвэрлэх</button><button type="submit" class="btn btn-primary">Илгээх</button></div>`;

    form.addEventListener('input', () => updateTransportSummary(form));
    form.addEventListener('reset', () => setTimeout(() => updateTransportSummary(form), 0));
    updateTransportSummary(form);
  }

  function collectTransportRows(form){
    return UI.$$('.own-col .mrow[data-vid]', form).map(row => {
      const v = vehicleById(row.dataset.vid);
      const trips = row.querySelector('.t-trips').value;
      const ton = row.querySelector('.t-ton').value;
      return {
        vid: row.dataset.vid,
        name: v ? v.name : '',
        purpose: v ? v.purpose : '',
        ownership: v ? v.ownership : '',
        trips, ton
      };
    }).filter(r => r.trips || r.ton);
  }

  function updateTransportSummary(form){
    const box = UI.$('#trnSummary', form);
    if(!box) return;
    const t = CONFIG.transportTotals(collectTransportRows(form));
    box.innerHTML = `<div class="fuel-calc">
      <span>Шлам: <b>${UI.fmt(t.sludge_ton)} тн / ${UI.fmt(t.sludge_trips)} рейс</b></span>
      <span>Хаягдал: <b>${UI.fmt(t.waste_ton + t.short_waste_ton)} тн</b></span>
      <span>Бүтээгдэхүүн: <b>${UI.fmt(t.product_transport_ton)} тн / ${UI.fmt(t.product_transport_trips)} рейс</b></span>
    </div>`;
  }

  /* ---------------- Машин нэмэх / хасах хэсэг ---------------- */
  function renderVehicleManager(){
    const panel = UI.$('#vehiclePanel');
    if(!panel) return;
    panel.classList.remove('hidden');
    const listBox = UI.$('#vehicleList');
    listBox.innerHTML = `<div class="table-wrap"><table class="table">
      <thead><tr><th>Машины дугаар / нэр</th><th>Зориулалт</th><th>Өмчлөл</th><th></th></tr></thead>
      <tbody>` + VEHICLES.map(v => `<tr>
        <td>${UI.esc(v.name)}</td>
        <td>${UI.esc(CONFIG.purposeLabels[v.purpose] || v.purpose)}</td>
        <td><span class="own-badge" style="background:${CONFIG.ownershipColors[v.ownership]||'var(--ink-3)'}">${UI.esc(CONFIG.ownershipLabels[v.ownership] || v.ownership)}</span></td>
        <td class="right"><button type="button" class="btn btn-soft btn-icon v-del" data-id="${v.id}" title="Идэвхгүй болгох">✕</button></td>
      </tr>`).join('') + `</tbody></table></div>`;

    UI.$$('.v-del', listBox).forEach(btn => btn.onclick = async () => {
      if(!confirm('Энэ машиныг бүртгэлээс хасах уу? (Түүх устахгүй, зөвхөн идэвхгүй болно)')) return;
      try{
        const res = await API.vehicleRemove(btn.dataset.id);
        VEHICLES = res.vehicles || [];
        renderVehicleManager();
      }catch(err){ alert(err.message); }
    });

    const addForm = UI.$('#vehicleAddForm');
    addForm.onsubmit = async e => {
      e.preventDefault();
      const name = UI.$('#vNewName').value.trim();
      if(!name) return;
      try{
        const res = await API.vehicleSave({name, purpose: UI.$('#vNewPurpose').value, ownership: UI.$('#vNewOwnership').value});
        VEHICLES = res.vehicles || [];
        UI.$('#vNewName').value = '';
        renderVehicleManager();
      }catch(err){ alert(err.message); }
    };
  }

  function renderField(f){
    const cls = f.full ? 'field full' : 'field';
    if(f.type === 'textarea') return `<div class="${cls}"><label>${UI.esc(f.label)}</label><textarea name="${f.name}" placeholder="Тайлбар"></textarea></div>`;
    if(f.type === 'select') return `<div class="${cls}"><label>${UI.esc(f.label)}</label><select name="${f.name}">${(f.options||[]).map(o=>`<option value="${UI.esc(o[0])}">${UI.esc(o[1])}</option>`).join('')}</select></div>`;
    return `<div class="${cls}"><label>${UI.esc(f.label)}</label><input name="${f.name}" type="${f.type||'text'}" ${f.type==='number'?'step="any"':''}></div>`;
  }

  async function submitReport(e){
    e.preventDefault();
    const formEl = e.currentTarget || e.target;
    const reportType = formEl.dataset.reportType;
    const msg = UI.$('#submitMessage');
    UI.alertBox(msg, '');
    const fd = new FormData(formEl);
    const data = {};
    for(const [k,v] of fd.entries()){ data[k] = (v === '') ? null : v; }

    // Түлшний тайлан: машин тус бүрийн мөр + автомат орлого/зарлага/үлдэгдэл
    if(reportType === 'fuel'){
      const rows = collectFuelRows(formEl);
      const opening = parseFloat(data.fuel_opening_liter) || 0;
      const income  = parseFloat(data.fuel_income_liter) || 0;
      const expense = rows.reduce((a,r) => a + (parseFloat(r.liter)||0), 0);
      data.vehicle_rows = rows;
      data.fuel_expense_liter = expense;
      data.fuel_closing_liter = Math.round((opening + income - expense) * 100) / 100;
    }

    // Тээврийн тайлан: машин тус бүрийн мөр + зориулалтаар нь нийлбэр
    if(reportType === 'transport'){
      const rows = collectTransportRows(formEl);
      data.vehicle_rows = rows;
      Object.assign(data, CONFIG.transportTotals(rows));
    }

    const submitBtn = UI.$('button[type=submit]', formEl);
    if(submitBtn) submitBtn.disabled = true;
    try{
      await API.submit({
        report_type: reportType,
        date: UI.$('#reportDate').value || UI.today(),
        data
      });
      UI.alertBox(msg, 'Тайлан амжилттай хадгалагдлаа. Баярлалаа!', true);
      // Form-ыг дахин зурснаар цэвэрлэнэ (reset() null-д унахгүй)
      selectReport(reportType);
      window.scrollTo({top:0, behavior:'smooth'});
      UI.alertBox(UI.$('#submitMessage'), 'Тайлан амжилттай хадгалагдлаа. Баярлалаа!', true);
    }catch(err){
      if(/нэвтрэлт хүчингүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.alertBox(msg, err.message);
    }finally{
      if(submitBtn) submitBtn.disabled = false;
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

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
  const OWNERSHIP_ORDER = [
    {key:'own', label:'Өөрийн техник', color:'var(--c-camp)'},
    {key:'rental_product', label:'Бүтээгдэхүүн тээврийн түрээс', color:'var(--c-transport)'},
    {key:'rental_sludge', label:'Шлам тээврийн түрээс', color:'var(--c-fuel)'}
  ];

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
      key:'production', label:'24 цагийн бүтээгдэхүүн', unit:'тн', featured:true, vizReplacesValue:true,
      calc: d => num(d.shift_day_product_ton) + num(d.shift_night_product_ton),
      sub: d => `Өдөр ${num(d.shift_day_product_ton)} + Шөнө ${num(d.shift_night_product_ton)}`,
      mini: d => [
        {label:'Өдөр', value:num(d.shift_day_product_ton)},
        {label:'Шөнө', value:num(d.shift_night_product_ton)}
      ],
      viz: (d, ctx) => {
        const val = num(d.shift_day_product_ton) + num(d.shift_night_product_ton);
        const planMonth = ctx && ctx.plan ? num(ctx.plan.production_ton) : 0;
        let target = null, label = 'Баяжуулсан бүтээгдэхүүн';
        if(planMonth > 0 && ctx.date){
          const dt = new Date(ctx.date + 'T00:00:00');
          const days = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
          target = planMonth / days;
          label = 'Төлөвлөгөөний дундаж ' + UI.fmt(target) + ' тн/өдөр';
        }
        return UI.gaugeHtml(val, target, label, 'тн');
      }
    },
    {
      key:'transport', label:'Тээвэр', unit:'тн', vizReplacesValue:true,
      calc: d => num(d.sludge_ton) + num(d.waste_ton) + num(d.short_waste_ton) + num(d.product_transport_ton),
      sub: d => `Шлам ${num(d.sludge_ton)} · Хаягдал ${num(d.waste_ton)+num(d.short_waste_ton)} · Бүт. ${num(d.product_transport_ton)}`,
      viz: d => UI.donutHtml([
        {label:'Шлам', value:num(d.sludge_ton), color:'var(--c-fuel)'},
        {label:'Хаягдал', value:num(d.waste_ton)+num(d.short_waste_ton), color:'var(--c-issue)'},
        {label:'Бүтээгдэхүүн', value:num(d.product_transport_ton), color:'var(--c-transport)'}
      ], UI.fmt(num(d.sludge_ton)+num(d.waste_ton)+num(d.short_waste_ton)+num(d.product_transport_ton)), 'Нийт тн', {compact:true, badges:true})
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
      },
      lowerBetter:true,
      mini: d => {
        const closing = (d.fuel_closing_liter !== undefined && d.fuel_closing_liter !== null)
          ? num(d.fuel_closing_liter)
          : num(d.fuel_truck_closing_liter) + num(d.reserve_tank_closing_liter);
        return [
          {label:'Орлого', value:num(d.fuel_income_liter !== undefined ? d.fuel_income_liter : d.fuel_truck_income_liter), color:'var(--c-camp)'},
          {label:'Зарлага', value:(d.fuel_expense_liter != null) ? num(d.fuel_expense_liter) : num(d.fuel_truck_machine_liter)+num(d.fuel_truck_plant_liter)+num(d.reserve_tank_expense_liter), color:'var(--c-transport)'},
          {label:'Үлдэгдэл', value:Math.max(closing,0), color: closing < 0 ? 'var(--warn)' : 'var(--c-production)'}
        ];
      }
    },
    {
      key:'equipment', label:'Ажилласан техник', unit:'',
      calc: d => num(d.main_working_count) + num(d.rental_sludge_working_count) + num(d.product_transport_working_count),
      sub: d => `Засварт ${num(d.repair_count)} · Парк ${num(d.parked_count)}`,
      mini: d => [
        {label:'Ажилласан', value:num(d.main_working_count)+num(d.rental_sludge_working_count)+num(d.product_transport_working_count), color:'var(--c-camp)'},
        {label:'Засварт', value:num(d.repair_count), color:'var(--warn)'},
        {label:'Парк', value:num(d.parked_count), color:'var(--c-issue)'}
      ]
    },
    {
      key:'camp', label:'Нийт хүн хүч', unit:'',
      calc: d => num(d.mongolian_count) + num(d.chinese_count) + num(d.guard_count) + num(d.contractor_count) + num(d.camp_staff_count),
      sub: d => `Монгол ${num(d.mongolian_count)} · Хятад ${num(d.chinese_count)} · Зочин ${num(d.guest_count)}`,
      mini: d => [
        {label:'Монгол', value:num(d.mongolian_count), color:'var(--c-production)'},
        {label:'Хятад', value:num(d.chinese_count), color:'var(--c-hse)'},
        {label:'Бусад', value:num(d.guard_count)+num(d.contractor_count)+num(d.camp_staff_count), color:'var(--c-issue)'}
      ]
    },
    {
      key:'hse', label:'ХАБ зөрчил / Эмнэлэг', unit:'', lowerBetter:true,
      calc: d => num(d.hse_violation_count) + num(d.medical_assistance_count),
      sub: d => `Зөрчил ${num(d.hse_violation_count)} · Тусламж ${num(d.medical_assistance_count)}`,
      warnIf: d => (num(d.hse_violation_count) + num(d.medical_assistance_count)) > 0,
      mini: d => [
        {label:'Зөрчил', value:num(d.hse_violation_count), color:'var(--c-hse)'},
        {label:'Эмнэлэг', value:num(d.medical_assistance_count), color:'var(--c-camp)'}
      ]
    },
    {
      key:'issue', label:'Асуудал', unit:'', lowerBetter:true, fullRow:true,
      calc: d => d.issue_text ? 1 : 0,
      sub: d => d.status === 'open' ? 'Нээлттэй асуудал байна' : (d.issue_text ? 'Шийдэгдсэн' : 'Бүртгэл алга'),
      warnIf: d => d.status === 'open'
    }
  ];

  return {reportTypes, forms, summaryCards, num, purposeLabels, ownershipLabels, ownershipColors, OWNERSHIP_ORDER, transportTotals};
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
    users: () => call('/api/users', withAuth({})),
    userSetPin: (user_id, new_pin) => call('/api/users/setpin', withAuth({user_id, new_pin})),
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
  /** Багтахгүй жижиг зайд тоог товчилно: 25048 -> 25k, 1500 -> 1.5k */
  function fmtShort(n){
    if(n === null || n === undefined || isNaN(n)) return '—';
    const abs = Math.abs(n);
    if(abs >= 1000000) return (n/1000000).toFixed(abs >= 10000000 ? 0 : 1).replace(/\.0$/,'') + 'сая';
    if(abs >= 10000) return Math.round(n/1000) + 'k';
    if(abs >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'k';
    return fmt(n);
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
    // Хэрэглэгчийн удирдлагын холбоос — зөвхөн админд харагдана
    $$('#adminLink').forEach(el => { if(s && s.role === 'admin') el.classList.remove('hidden'); });
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

  /** SVG donut chart: segments = [{label, value, color}]; opts = {compact, badges} */
  function donutHtml(segments, centerTop, centerBottom, opts = {}){
    const total = segments.reduce((a,s) => a + s.value, 0);
    if(total <= 0) return '';
    const R = 40, C = 2 * Math.PI * R;
    let offset = 0;
    let badges = '';
    const arcs = segments.filter(s => s.value > 0).map(s => {
      const frac = s.value / total;
      const dash = frac * C;
      const el = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${s.color}" stroke-width="13"
        stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
        stroke-linecap="butt"/>`;
      // Сегментийн голд хувь заасан badge (лавлагааны 63/19/41 загвар)
      if(opts.badges && frac >= 0.07){
        const midFrac = (offset + dash/2) / C;
        const ang = midFrac * 2 * Math.PI - Math.PI/2;
        const bx = 50 + 47 * Math.cos(ang), by = 50 + 47 * Math.sin(ang);
        badges += `<g><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="9" fill="${s.color}" class="donut-badge-c"/>
          <text x="${bx.toFixed(1)}" y="${by.toFixed(1)}" class="donut-badge-t" text-anchor="middle" dominant-baseline="central">${Math.round(frac*100)}%</text></g>`;
      }
      offset += dash;
      return el;
    }).join('');
    const legend = segments.map(s => {
      const pct = total ? Math.round(s.value/total*100) : 0;
      return `<div class="donut-leg"><span class="donut-dot" style="background:${s.color}"></span>
        <span class="donut-leg-label">${esc(s.label)}</span>
        <span class="donut-leg-val">${fmt(s.value)} <small>(${pct}%)</small></span></div>`;
    }).join('');
    return `<div class="donut-wrap ${opts.compact ? 'donut-compact' : ''}">
      <div class="donut-fig">
        <svg viewBox="-8 -8 116 116" class="donut-svg"><g transform="rotate(-90 50 50)">${arcs}</g>${badges}</svg>
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

  /** Хагас дугуй gauge: гэрэлтсэн хуваарь + богино заагч нь value-г, алтан хуваарь нь target-ыг заана.
      Тоо нуман дотроо, тайлбар нь графикийн ДООР тусдаа мөрөнд — хэзээ ч давхарлахгүй. */
  function gaugeHtml(value, target, caption, unit){
    const max = Math.max(target ? target * 2 : 0, value * 1.15, 1);
    const frac = Math.min(Math.max(value / max, 0), 1);
    const tFrac = target ? Math.min(target / max, 1) : null;
    const N = 29, cx = 100, cy = 92, r1 = 66, r2 = 88;
    let ticks = '';
    for(let i = 0; i < N; i++){
      const f = i / (N - 1);
      const a = Math.PI * (1 - f); // 180° -> 0°
      const x1 = cx + r1 * Math.cos(a), y1 = cy - r1 * Math.sin(a);
      const x2 = cx + r2 * Math.cos(a), y2 = cy - r2 * Math.sin(a);
      const on = f <= frac;
      const isTarget = tFrac !== null && Math.abs(f - tFrac) < (0.5 / (N - 1));
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
        class="gauge-tick ${on ? 'on' : ''} ${isTarget ? 'target' : ''}"/>`;
    }
    // Богино заагч — хуваарийн дотоод захад (r 50–61), голын тоотой огтлолцохгүй
    const na = Math.PI * (1 - frac);
    const px1 = cx + 50 * Math.cos(na), py1 = cy - 50 * Math.sin(na);
    const px2 = cx + 61 * Math.cos(na), py2 = cy - 61 * Math.sin(na);
    return `<div class="gauge-wrap">
      <div class="gauge-fig">
        <svg viewBox="0 0 200 96" class="gauge-svg">
          ${ticks}
          <line x1="${px1.toFixed(1)}" y1="${py1.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" class="gauge-needle"/>
        </svg>
        <div class="gauge-center"><b class="count" data-count="${value}">${fmt(value)}</b>${unit ? `<span class="gauge-unit">${esc(unit)}</span>` : ''}</div>
      </div>
      ${caption ? `<div class="gauge-caption">${esc(caption)}</div>` : ''}
    </div>`;
  }

  /** Урсгал шугаман график: points = [{label, value}] — цэг бүрт тасархай шугам + нэр + тоо */
  let waveId = 0;
  function waveChartHtml(points, color){
    if(!points.length) return '';
    // Цэг цөөхөн үед алхмыг өргөсгөж графикийг картын бүтэн өргөнд ойртуулна (86–150px).
    // Захын шошго таслагдахгүйн тулд padL/padR = 46.
    const stepX = points.length > 1 ? Math.min(Math.max(908 / (points.length - 1), 86), 150) : 0;
    const padL = 46, padR = 46, topPad = 40, H = 150, chartH = H - topPad - 16;
    const W = padL + padR + Math.max((points.length - 1) * stepX, 40);
    const maxV = Math.max(...points.map(p => p.value), 1);
    const xy = points.map((p, i) => ({
      x: padL + (points.length === 1 ? (W - padL - padR) / 2 : i * stepX),
      y: topPad + chartH - (p.value / maxV) * chartH,
      ...p
    }));
    // Зөөлөн муруй (cubic)
    let path = `M ${xy[0].x} ${xy[0].y}`;
    for(let i = 1; i < xy.length; i++){
      const p0 = xy[i-1], p1 = xy[i];
      const dx = (p1.x - p0.x) / 2;
      path += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const gid = 'wg' + (++waveId);
    const guides = xy.map(p => `
      <line x1="${p.x}" y1="${topPad - 6}" x2="${p.x}" y2="${H - 14}" class="wave-guide"/>
      <text x="${p.x}" y="14" class="wave-label" text-anchor="middle">${esc(String(p.label).length > 12 ? String(p.label).slice(0, 11) + '…' : String(p.label))}</text>
      <text x="${p.x}" y="30" class="wave-value" text-anchor="middle">${fmt(p.value)}</text>
      <circle cx="${p.x}" cy="${p.y}" r="4" class="wave-dot" style="fill:${color}"/>`).join('');
    return `<div class="wave-scroll"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="wave-svg">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity=".25"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${guides}
      <path d="${path} L ${xy[xy.length-1].x} ${H-14} L ${xy[0].x} ${H-14} Z" fill="url(#${gid})"/>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" class="wave-line"/>
    </svg></div>`;
  }

  return {esc, today, thisMonth, $, $$, fmt, fmtShort, alertBox, paintUserChrome, animateCounts, formatDateMn, donutHtml, barListHtml, gaugeHtml, waveChartHtml};
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
  let dailyPrevMap = {}; // өмнөх өдрийн тайлан — өсөлт/бууралтын хувь бодоход
  let dashPlan = {}; // тухайн сарын төлөвлөгөө (gauge-д хэрэгтэй)
  let dashDate = UI.today();

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
      const prevD = new Date(date + 'T00:00:00');
      prevD.setDate(prevD.getDate() - 1);
      const prevIso = prevD.toISOString().slice(0,10);
      const [res, prevRes, planRes] = await Promise.all([
        API.daily(date),
        API.daily(prevIso).catch(() => ({reports: []})),
        API.plan(date.slice(0,7)).catch(() => ({plan: {}}))
      ]);
      dashPlan = planRes.plan || {};
      dashDate = date;
      dailyMap = {};
      (res.reports || []).forEach(r => { dailyMap[r.report_type] = r; });
      dailyPrevMap = {};
      (prevRes.reports || []).forEach(r => { dailyPrevMap[r.report_type] = r; });
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
      const featured = c.featured ? 'card-featured' : '';
      const fullRow = c.fullRow ? 'card-full' : '';

      if(!r){
        return `<div class="bezel card card-missing ${featured} ${fullRow}"><span class="tick-a"></span><span class="tick-b"></span>
          <div class="card-tag-row"><span class="label">${chip}${UI.esc(c.label)}</span></div>
          <div class="value">—</div><div class="sub">Тайлан ороогүй</div></div>`;
      }

      const val = c.calc(r.data);
      const warn = c.warnIf ? c.warnIf(r.data) : false;

      // Өмнөх өдрөөс өссөн/буурсан хувь (▲/▼ chip). Бага нь сайн үзүүлэлтэд өнгө урвуулна.
      let trendChip = '';
      const prev = dailyPrevMap[c.key];
      if(prev){
        const prevVal = c.calc(prev.data);
        if(prevVal > 0){
          const pct = Math.round(((val - prevVal) / prevVal) * 100);
          if(pct !== 0){
            const up = pct > 0;
            const good = c.lowerBetter ? !up : up;
            trendChip = `<span class="trend-chip ${good ? 'trend-good' : 'trend-bad'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%<small>өчигдрөөс</small></span>`;
          } else {
            trendChip = `<span class="trend-chip trend-flat">— 0%<small>өчигдрөөс</small></span>`;
          }
        }
      }

      // Карт доторх визуал: viz hook (gauge/donut) байвал түүнийг, үгүй бол мини bar
      let miniHtml = '';
      if(c.viz){
        miniHtml = c.viz(r.data, {plan: dashPlan, date: dashDate}) || '';
      } else if(c.mini){
        const items = c.mini(r.data).filter(i => i.value > 0 || true);
        const max = Math.max(...items.map(i => i.value), 1);
        miniHtml = `<div class="mini-bars">` + items.map(i => {
          const h = Math.max((i.value / max) * 100, 4);
          return `<div class="mini-bar-col" title="${UI.esc(i.label)}: ${UI.fmt(i.value)}">
            <span class="mini-bar-val">${UI.fmtShort(i.value)}</span>
            <span class="mini-bar-track"><span class="mini-bar" style="height:${h.toFixed(0)}%;${i.color ? 'background:'+i.color : ''}"></span></span>
            <span class="mini-bar-label">${UI.esc(i.label)}</span>
          </div>`;
        }).join('') + `</div>`;
      }

      const valueRow = c.vizReplacesValue && miniHtml
        ? ''
        : `<div class="value"><span class="count" data-count="${val}">${UI.fmt(val)}</span>${c.unit ? ' <span class="unit">'+c.unit+'</span>' : ''}</div>`;
      const wide = (c.viz && miniHtml) ? 'card-wide' : '';
      return `<div class="bezel card ${warn?'card-warn':''} ${featured} ${wide} ${fullRow}"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${chip}${UI.esc(c.label)}</span>${trendChip}</div>
        ${valueRow}
        ${miniHtml}
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

      // Өдөр тутмын цуваа: харагдах өдрийн тоо = энэ сар бол өнөөдрийн өдөр, өнгөрсөн сар бол сарын бүтэн өдрүүд
      const [my, mm] = month.split('-').map(Number);
      const dim = new Date(my, mm, 0).getDate();
      const nowD = new Date();
      const ND = (my === nowD.getFullYear() && mm === nowD.getMonth() + 1) ? nowD.getDate() : dim;
      const mkSer = () => Array(ND).fill(0);
      const ser = {inc:mkSer(), prod:mkSer(), trans:mkSer(), exp:mkSer(), hse:mkSer(), weigh:mkSer(), iss:mkSer()};
      (res.reports||[]).forEach(r => {
        const day = parseInt((r.date||'').slice(8), 10);
        if(!day || day > ND) return;
        const d = r.data || {}, i = day - 1;
        if(r.report_type === 'fuel'){
          ser.inc[i] += CONFIG.num(d.fuel_income_liter != null ? d.fuel_income_liter : d.fuel_truck_income_liter);
          ser.exp[i] += d.fuel_expense_liter != null ? CONFIG.num(d.fuel_expense_liter)
            : CONFIG.num(d.fuel_truck_machine_liter) + CONFIG.num(d.fuel_truck_plant_liter) + CONFIG.num(d.reserve_tank_expense_liter);
        }
        if(r.report_type === 'production') ser.prod[i] += CONFIG.num(d.shift_day_product_ton) + CONFIG.num(d.shift_night_product_ton);
        if(r.report_type === 'transport'){
          ser.trans[i] += CONFIG.num(d.sludge_ton) + CONFIG.num(d.waste_ton) + CONFIG.num(d.short_waste_ton) + CONFIG.num(d.product_transport_ton);
          ser.weigh[i] += CONFIG.num(d.weighbridge_net_ton);
        }
        if(r.report_type === 'hse') ser.hse[i] += CONFIG.num(d.hse_violation_count) + CONFIG.num(d.medical_assistance_count);
        if(r.report_type === 'issue' && d.status === 'open') ser.iss[i] += 1;
      });

      // Pill баганан мини график: өдөр бүр нэг суваг, өгөгдөлтэй өдөр өнгөтэй
      const colsHtml = (arr, color) => {
        const mx = Math.max(...arr, 1);
        const dense = arr.length > 14 ? ' m-dense' : '';
        const showLbl = i => arr.length <= 10 || i === 0 || i === arr.length - 1 || (i + 1) % 5 === 0;
        return `<div class="m-cols${dense}">` + arr.map(v =>
          `<span class="m-col"><span class="m-fill" style="height:${Math.max(v/mx*100, 4).toFixed(0)}%;${v > 0 ? 'background:'+color : ''}"></span></span>`
        ).join('') + `</div>
        <div class="m-days${dense}">` + arr.map((_, i) => `<span>${showLbl(i) ? i + 1 : ''}</span>`).join('') + `</div>`;
      };

      const GREEN = 'var(--green)', RED = 'var(--brand)', AMBER = 'var(--c-transport)';
      const cards = [
        ['Түлшний орлого нийт', UI.fmt(fuelIncome)+' л', count('fuel')+' өдрийн тайлан', ser.inc, GREEN],
        ['Бүтээгдэхүүн нийт', UI.fmt(sum('production','shift_day_product_ton')+sum('production','shift_night_product_ton'))+' тн', count('production')+' өдрийн тайлан', ser.prod, RED],
        ['Тээвэр нийт', UI.fmt(sum('transport','sludge_ton')+sum('transport','waste_ton')+sum('transport','short_waste_ton')+sum('transport','product_transport_ton'))+' тн', count('transport')+' өдрийн тайлан', ser.trans, RED],
        ['Түлшний зарлага нийт', UI.fmt((byType['fuel']||[]).reduce((a,r)=>a+(r.data.fuel_expense_liter!=null?CONFIG.num(r.data.fuel_expense_liter):CONFIG.num(r.data.fuel_truck_machine_liter)+CONFIG.num(r.data.fuel_truck_plant_liter)+CONFIG.num(r.data.reserve_tank_expense_liter)),0))+' л', count('fuel')+' өдрийн тайлан', ser.exp, RED],
        ['ХАБ зөрчил / Эмнэлэг', UI.fmt(sum('hse','hse_violation_count'))+' / '+UI.fmt(sum('hse','medical_assistance_count')), count('hse')+' өдрийн тайлан', ser.hse, AMBER],
        ['Пүүний нийт жин', UI.fmt(sum('transport','weighbridge_net_ton'))+' тн', 'тээврийн тайлангаас', ser.weigh, GREEN],
        ['Нээлттэй асуудал', String(openIssues), count('issue')+' бүртгэл', ser.iss, AMBER]
      ];
      box.innerHTML = cards.map(c => `<div class="bezel card"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${UI.esc(c[0])}</span></div>
        <div class="value">${UI.esc(c[1])}</div>
        ${colsHtml(c[3], c[4])}
        <div class="sub">${UI.esc(c[2])}</div></div>`).join('');

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

  // Төлөвлөгөөний үзүүлэлтүүд — компанийн сарын төлөвлөгөөний БОДИТ бүтэц:
  // Бүтээгдэхүүн үйлдвэрлэлт /тн/ · Шлам олборлолт /тн/ ·
  // Бүтээгдэхүүн тээвэрлэлт /машин, рейс/ · Шлам тээвэрлэлт /машин, рейс/
  const PLAN_METRICS = [
    {key:'production_ton', label:'Бүтээгдэхүүн үйлдвэрлэлт', unit:'тн'},
    {key:'sludge_ton', label:'Шлам олборлолт', unit:'тн'},
    {key:'product_transport_trips', label:'Бүтээгдэхүүн тээвэрлэлт', unit:'рейс', vehiclesKey:'product_transport_vehicles'},
    {key:'sludge_trips', label:'Шлам тээвэрлэлт', unit:'рейс', vehiclesKey:'sludge_vehicles'}
  ];
  let currentPlan = {};
  let currentActual = {};

  /** Сарын явц: харагдаж буй сар өнгөрсөн бол 1, ирээдүйн сар бол 0, энэ сар бол өдрийн харьцаа */
  function monthElapsedFrac(month){
    const now = new Date();
    const [yy, mm] = month.split('-').map(Number);
    if(!yy || !mm) return 1;
    if(yy === now.getFullYear() && mm === now.getMonth() + 1){
      const days = new Date(yy, mm, 0).getDate();
      return Math.min(now.getDate() / days, 1);
    }
    return new Date(yy, mm - 1, 1) < now ? 1 : 0;
  }

  async function renderPlanVsActual(month, actual){
    currentActual = actual;
    const box = UI.$('#planSection');
    if(!box) return;
    try{
      const res = await API.plan(month);
      currentPlan = res.plan || {};
    }catch(e){ currentPlan = {}; }

    const isAdmin = (SESSION.get() || {}).role === 'admin';
    const elapsed = monthElapsedFrac(month);
    const paceLeft = Math.round(elapsed * 100);

    // Activity ring: биелэлтийг цагирагаар, өнөөдрийн явцыг цагираг дээрх зураасаар
    let ringId = 0;
    const ring = (pct, tone, paceFrac) => {
      const R = 40, C = 2 * Math.PI * R;
      const fill = pct === null ? 0 : Math.min(pct, 100) / 100;
      const colors = tone === 'plan-good' ? ['#5AD97C', '#28B14C']
                   : tone === 'plan-low'  ? ['#FF8A7A', '#E44332']
                   : ['#FFCF4D', '#F5920B'];
      const gid = 'prg' + (++ringId) + month.replace('-', '');
      let pace = '';
      if(paceFrac > 0 && paceFrac < 1){
        const a = paceFrac * 2 * Math.PI - Math.PI / 2;
        const x1 = 50 + 33 * Math.cos(a), y1 = 50 + 33 * Math.sin(a);
        const x2 = 50 + 47 * Math.cos(a), y2 = 50 + 47 * Math.sin(a);
        pace = `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="plan-ring-pace"/>`;
      }
      const pctText = pct === null ? '—' : (pct > 999 ? '>999%' : pct + '%');
      return `<div class="plan-ring">
        <svg viewBox="0 0 100 100">
          <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/>
          </linearGradient></defs>
          <circle cx="50" cy="50" r="${R}" fill="none" class="plan-ring-track" stroke-width="9"/>
          ${fill > 0 ? `<circle cx="50" cy="50" r="${R}" fill="none" stroke="url(#${gid})" stroke-width="9" stroke-linecap="round"
            stroke-dasharray="${(fill * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)" class="plan-ring-fill"/>` : ''}
          ${pace}
        </svg>
        <div class="plan-ring-center"><b class="${tone}">${pctText}</b></div>
      </div>`;
    };

    const cards = PLAN_METRICS.map(m => {
      const plan = CONFIG.num(currentPlan[m.key]);
      const act = CONFIG.num(actual[m.key]);
      const vehicles = m.vehiclesKey ? CONFIG.num(currentPlan[m.vehiclesKey]) : 0;
      const hasPlan = plan > 0;
      const pct = hasPlan ? Math.round((act / plan) * 100) : null;
      // Үнэлгээг сарын бүтэн дүнгээр бус ӨНӨӨДРИЙН явцтай харьцуулж өгнө —
      // сарын дундуур 40% биелэлт "муу" биш, явцаасаа түрүүлж байвал ногоон.
      const paceTarget = hasPlan ? plan * elapsed : 0;
      let tone = '';
      if(hasPlan){
        if(paceTarget <= 0) tone = 'plan-mid';
        else if(act >= paceTarget) tone = 'plan-good';
        else if(act >= paceTarget * 0.8) tone = 'plan-mid';
        else tone = 'plan-low';
      }
      const showPace = hasPlan && elapsed > 0 && elapsed < 1;
      const foot = !hasPlan
        ? 'Төлөвлөгөө оруулаагүй'
        : showPace
          ? `Сарын явц ${paceLeft}% · Өнөөдрийн зорилт ${UI.fmt(Math.round(paceTarget))} ${m.unit}`
          : (elapsed >= 1 ? 'Сар дууссан — эцсийн гүйцэтгэл' : 'Сар эхлээгүй');
      return `<div class="plan-card">
        ${ring(pct, tone || 'plan-mid', showPace ? elapsed : 0)}
        <div class="plan-info">
          <div class="plan-name">${UI.esc(m.label)}${vehicles ? `<span class="plan-veh">${UI.fmt(vehicles)} машин</span>` : ''}</div>
          <div class="plan-card-nums"><b class="count" data-count="${act}">${UI.fmt(act)}</b><span class="plan-target">/ ${hasPlan ? UI.fmt(plan) : '—'} ${m.unit}</span></div>
          <div class="plan-foot">${foot}</div>
        </div>
      </div>`;
    }).join('');

    box.innerHTML = `<section class="bezel panel"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="panel-head">
        <div><h3>Сарын төлөвлөгөө — гүйцэтгэл</h3><p>Компанийн сарын төлөвлөгөөний биелэлт. Цагираг дээрх зураас нь өнөөдрийн явцын түвшин.</p></div>
        ${isAdmin ? '<button class="btn btn-soft" id="editPlanBtn">Төлөвлөгөө засах</button>' : ''}
      </div>
      <div id="planBody" class="plan-grid">${cards}</div>
    </section>`;
    UI.animateCounts(UI.$('#planBody'));

    if(isAdmin){
      UI.$('#editPlanBtn').onclick = () => renderPlanEditor(month);
    }
  }

  function renderPlanEditor(month){
    const body = UI.$('#planBody');
    if(!body) return;
    body.classList.remove('plan-grid');
    body.innerHTML = PLAN_METRICS.map(m => `<div class="plan-edit-row">
      <label>${UI.esc(m.label)} (${m.unit})</label>
      <input type="number" step="any" min="0" data-key="${m.key}" value="${currentPlan[m.key] ?? ''}" placeholder="Төлөвлөгөө оруулах">
    </div>` + (m.vehiclesKey ? `<div class="plan-edit-row plan-edit-sub">
      <label>${UI.esc(m.label)} — машины тоо</label>
      <input type="number" step="1" min="0" data-key="${m.vehiclesKey}" value="${currentPlan[m.vehiclesKey] ?? ''}" placeholder="машин">
    </div>` : '')).join('') +
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

    // Wave график: өмчлөлийн бүлэг тус бүрээр машин бүрийн түлш зарцуулалт
    const waveBlocks = CONFIG.OWNERSHIP_ORDER.map(o => {
      const points = list.filter(a => a.ownership === o.key && a.liter > 0)
        .map(a => ({label: a.name, value: a.liter}));
      if(!points.length) return '';
      const color = o.color.startsWith('var') ? getComputedStyle(document.documentElement).getPropertyValue(o.color.slice(4,-1)).trim() || '#BC2029' : o.color;
      return `<div class="viz-block"><div class="viz-title"><span class="own-dot" style="background:${o.color};display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px"></span>${UI.esc(o.label)} — түлш зарцуулалт / л</div>${UI.waveChartHtml(points, color)}</div>`;
    }).join('');

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
      ${waveBlocks}
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
    const columns = CONFIG.OWNERSHIP_ORDER.map(o => {
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

  function buildTransportForm(form, fields){
    if(!VEHICLES.length){
      form.innerHTML = '<div class="module-empty">Машины бүртгэл ачаалж байна… Хэрэв удаж байвал хуудсаа сэргээнэ үү.</div>';
      return;
    }
    const columns = CONFIG.OWNERSHIP_ORDER.map(o => {
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
   PAGE: ADMIN — хэрэглэгчийн удирдлага (PIN солих)
   ================================================================ */
const PageAdmin = () => {
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }
  if(session.role !== 'admin'){ location.href = 'dashboard.html'; return; }

  const box = UI.$('#userList');
  const msg = UI.$('#adminMessage');
  if(!box) return;

  const ROLE_LABELS = {admin:'Админ', worker:'Ажилтан', viewer:'Захирал / үзэгч'};
  let USERS = [];

  async function load(){
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const res = await API.users();
      USERS = res.users || [];
      render();
    }catch(err){ box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`; }
  }

  function render(){
    box.innerHTML = `<div class="table-wrap"><table class="table">
      <thead><tr><th>Нэвтрэх нэр</th><th>Нэр</th><th>Эрх</th><th>Төлөв</th><th class="right">PIN</th></tr></thead>
      <tbody>` + USERS.map(u => `<tr data-uid="${u.id}">
        <td><b>${UI.esc(u.username)}</b></td>
        <td>${UI.esc(u.name || '—')}</td>
        <td>${UI.esc(ROLE_LABELS[u.role] || u.role)}${u.department ? ' · ' + UI.esc(u.department) : ''}</td>
        <td>${u.active ? '<span class="pin-badge pin-on">Идэвхтэй</span>' : '<span class="pin-badge pin-off">Идэвхгүй</span>'}</td>
        <td class="right">
          <span class="pin-edit hidden">
            <input class="pin-input" type="password" inputmode="numeric" maxlength="8" placeholder="Шинэ PIN" autocomplete="new-password">
            <button type="button" class="btn btn-primary btn-sm pin-save">Хадгалах</button>
            <button type="button" class="btn btn-soft btn-sm pin-cancel">Болих</button>
          </span>
          <button type="button" class="btn btn-soft btn-sm pin-toggle">PIN солих</button>
        </td>
      </tr>`).join('') + `</tbody></table></div>`;

    UI.$$('.pin-toggle', box).forEach(btn => btn.onclick = () => {
      const tr = btn.closest('tr');
      btn.classList.add('hidden');
      tr.querySelector('.pin-edit').classList.remove('hidden');
      tr.querySelector('.pin-input').focus();
    });
    UI.$$('.pin-cancel', box).forEach(btn => btn.onclick = () => render());
    UI.$$('.pin-save', box).forEach(btn => btn.onclick = () => savePin(btn));
    UI.$$('.pin-input', box).forEach(inp => inp.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); savePin(inp); }
    }));
  }

  async function savePin(el){
    const tr = el.closest('tr');
    const uid = tr.dataset.uid;
    const inp = tr.querySelector('.pin-input');
    const pin = inp.value.trim();
    if(!/^\d{4,8}$/.test(pin)){ UI.alertBox(msg, 'PIN 4-8 оронтой тоо байх ёстой.'); inp.focus(); return; }
    const target = USERS.find(u => String(u.id) === String(uid));
    if(!confirm(`«${target ? target.username : uid}» хэрэглэгчийн PIN-ийг солих уу?`)) return;
    try{
      const res = await API.userSetPin(uid, pin);
      USERS = res.users || USERS;
      // Админ ӨӨРИЙН PIN-ээ сольсон бол одоогийн session хүчингүй болно — дахин нэвтрүүлнэ
      if(target && target.username === session.username){
        alert('Та өөрийн PIN-ээ сольсон тул шинэ PIN-ээрээ дахин нэвтэрнэ үү.');
        SESSION.clear(); location.href = 'index.html'; return;
      }
      render();
      UI.alertBox(msg, `«${target ? target.username : ''}» хэрэглэгчийн PIN амжилттай солигдлоо.`, true);
    }catch(err){
      if(/нэвтрэлт хүчингүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.alertBox(msg, err.message);
    }
  }

  load();
};

/* ================================================================
   ROUTER — хуудас бүрийн эхлүүлэгч
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if(page === 'login')     PageLogin();
  if(page === 'dashboard') PageDashboard();
  if(page === 'report')    PageReport();
  if(page === 'admin')     PageAdmin();
});

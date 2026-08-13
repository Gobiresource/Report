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

  /* Хэлтэс бүрийн тайланд нэмэгдэх нийтлэг "асуудал" талбарууд.
     Самбарын Асуудал хэсэгт эдгээрийг хэлтсээр нь ялган нэг дор нэгтгэж харуулна.
     reports.data_json чөлөөт JSON тул нэмэлт талбарт migration хэрэггүй. */
  const ISSUE_FIELDS = [
    {type:'sep', group:'issue', full:true, label:'Асуудлын бүртгэл',
      hint:'Бичсэн асуудал самбарын «Асуудал» хэсэгт хэлтсээрээ ялгарч харагдана. Асуудал байхгүй бол хоосон үлдээнэ.'},
    {name:'issue_text', label:'Тухайн өдрийн асуудал', type:'textarea', full:true, group:'issue',
      placeholder:'Юу тохиолдсон, ямар нөлөө үзүүлсэн бэ?'},
    {name:'issue_severity', label:'Асуудлын ноцтой байдал', type:'select', group:'issue',
      options:[['','— Асуудалгүй —'],['low','Бага'],['medium','Дунд'],['high','Өндөр']]}
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
      {name:'note', label:'Тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
    ],
    transport: [
      {name:'weighbridge_net_ton', label:'Пүүний бодит цэвэр жин / тн', type:'number'},
      {name:'weighbridge_trips',   label:'Пүүний рейс', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
    ],
    fuel: [
      {name:'fuel_opening_liter', label:'Эхний үлдэгдэл / л (өмнөх өдрөөс автоматаар)', type:'number'},
      {name:'fuel_income_liter',  label:'Орлого / л (татан авалт)', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
    ],
    equipment: [
      {name:'main_working_count', label:'Үндсэн техник ажилласан', type:'number'},
      {name:'rental_sludge_working_count',   label:'Шлам тээврийн түрээс ажилласан', type:'number'},
      {name:'product_transport_working_count', label:'Бүтээгдэхүүн тээврийн түрээс ажилласан', type:'number'},
      {name:'repair_count', label:'Засвартай техник', type:'number'},
      {name:'parked_count', label:'Парк дээр', type:'number'},
      {name:'equipment_note', label:'Засвартай техникүүд / тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
    ],
    camp: [
      {name:'mongolian_count', label:'Монгол ажилтан', type:'number'},
      {name:'chinese_count',   label:'Хятад ажилтан', type:'number'},
      {name:'guard_count',     label:'Харуул', type:'number'},
      {name:'guest_count',     label:'Зочин', type:'number'},
      {name:'outside_meal_count', label:'Гаднаас хооллосон хүн', type:'number'},
      {name:'contractor_count',   label:'Барилга / туслан гүйцэтгэгч', type:'number'},
      {name:'camp_staff_count',   label:'Кемпийн ажилтан', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
    ],
    hse: [
      {name:'medical_assistance_count', label:'Эмнэлгийн тусламж', type:'number'},
      {name:'hse_violation_count', label:'ХАБ зөрчил', type:'number'},
      {name:'day_temp_c',   label:'Өдрийн хэм ℃', type:'number'},
      {name:'night_temp_c', label:'Шөнийн хэм ℃', type:'number'},
      {name:'humidity_percent', label:'Чийг %', type:'number'},
      {name:'wind_speed_ms',    label:'Салхины хурд м/с', type:'number'},
      {name:'note', label:'Тайлбар', type:'textarea', full:true},
      ...ISSUE_FIELDS
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
      // Ээлжийн задаргаа нь заалтын доорх мөрөнд шингэсэн тул давхардуулахгүй
      sub: d => '',
      mini: d => [
        {label:'Өдөр', value:num(d.shift_day_product_ton)},
        {label:'Шөнө', value:num(d.shift_night_product_ton)}
      ],
      viz: (d, ctx) => {
        const val = num(d.shift_day_product_ton) + num(d.shift_night_product_ton);
        const planMonth = ctx && ctx.plan ? num(ctx.plan.production_ton) : 0;
        const span = (ctx && ctx.span) ? ctx.span : 1;   // сонгосон хугацааны хоног
        let target = null;
        if(planMonth > 0 && ctx.date){
          const dt = new Date(ctx.date + 'T00:00:00');
          const days = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
          target = (planMonth / days) * span;   // өдрийн норм × хоног
        }
        // Нумын доорх мөр: зүүн талд зорилт, баруун талд биелэлтийн хувь
        const opts = target > 0
          ? {
              leftText: (span > 1 ? 'Хугацааны зорилт · ' : 'Өдрийн зорилт · ') + UI.fmt(Math.round(target)) + ' т',
              rightText: 'Биелэлт <b>' + Math.round(val / target * 100) + '%</b>'
            }
          : {
              leftText: 'Өдөр ' + UI.fmt(num(d.shift_day_product_ton)) + ' + Шөнө ' + UI.fmt(num(d.shift_night_product_ton)),
              rightText: 'Төлөвлөгөө оруулаагүй'
            };
        return UI.gaugeHtml(val, target, '', 'тонн', opts);
      }
    },
    {
      key:'transport', label:'Тээвэр', unit:'тн', vizReplacesValue:true,
      // Богино рейс нь Бүтээгдэхүүн тээврийн хэсэг (хашаан доторх), Хаягдал тусдаа
      calc: d => num(d.sludge_ton) + num(d.waste_ton) + num(d.short_waste_ton) + num(d.product_transport_ton),
      // Задаргаа legend дээр бүрэн харагдана — доор давхардуулахгүй
      sub: d => '',
      viz: d => UI.donutHtml([
        {label:'Шлам', value:num(d.sludge_ton), color:'#3B2FE0', icon:UI.MAT_ICONS.sludge},
        {label:'Хаягдал', value:num(d.waste_ton), color:'#9BA3A9', icon:UI.MAT_ICONS.waste},
        {label:'Бүтээгдэхүүн', value:num(d.product_transport_ton)+num(d.short_waste_ton), color:'#FF9500', icon:UI.MAT_ICONS.product}
      ], UI.fmt(num(d.sludge_ton)+num(d.waste_ton)+num(d.short_waste_ton)+num(d.product_transport_ton)),
         '', {unit:'тн'})
    },
    {
      key:'fuel', label:'Түлшний зарлага', unit:'л', miniStyle:'stats',
      calc: d => d.fuel_expense_liter !== undefined && d.fuel_expense_liter !== null
        ? num(d.fuel_expense_liter)
        : num(d.fuel_truck_machine_liter) + num(d.fuel_truck_plant_liter) + num(d.reserve_tank_expense_liter),
      sub: d => {
        const closing = (d.fuel_closing_liter !== undefined && d.fuel_closing_liter !== null)
          ? num(d.fuel_closing_liter)
          : num(d.fuel_truck_closing_liter) + num(d.reserve_tank_closing_liter);
        // Үлдэгдэл нь барын мөрөнд харагдана — зөвхөн сөрөг үед анхааруулна
        return closing < 0 ? `⚠ Үлдэгдэл ${UI.fmt(closing)} л — СӨРӨГ` : '';
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
        const income = num(d.fuel_income_liter !== undefined ? d.fuel_income_liter : d.fuel_truck_income_liter);
        const expense = (d.fuel_expense_liter != null) ? num(d.fuel_expense_liter)
          : num(d.fuel_truck_machine_liter) + num(d.fuel_truck_plant_liter) + num(d.reserve_tank_expense_liter);
        return [
          {label:'Орлого',   value:income,  unit:'л'},
          {label:'Зарлага',  value:expense, unit:'л'},
          {label:'Үлдэгдэл', value:closing, unit:'л', warn: closing < 0}
        ];
      }
    },
    {
      key:'equipment', label:'Ажилласан техник', unit:'', miniStyle:'segments',
      calc: d => num(d.main_working_count) + num(d.rental_sludge_working_count) + num(d.product_transport_working_count),
      sub: d => '', // хуваарилалт legend-д бүрэн харагдана
      mini: d => [
        {label:'Ажилласан', value:num(d.main_working_count)+num(d.rental_sludge_working_count)+num(d.product_transport_working_count), color:'var(--c-camp)'},
        {label:'Засварт', value:num(d.repair_count), color:'var(--warn)'},
        {label:'Парк', value:num(d.parked_count), color:'var(--c-issue)'}
      ]
    },
    {
      key:'camp', label:'Нийт хүн хүч', unit:'', miniStyle:'segments',
      calc: d => num(d.mongolian_count) + num(d.chinese_count) + num(d.guard_count) + num(d.contractor_count) + num(d.camp_staff_count),
      sub: d => num(d.guest_count) > 0 ? `Зочин ${num(d.guest_count)}` : '',
      mini: d => [
        {label:'Монгол', value:num(d.mongolian_count), color:'var(--c-production)'},
        {label:'Хятад', value:num(d.chinese_count), color:'var(--c-hse)'},
        {label:'Бусад', value:num(d.guard_count)+num(d.contractor_count)+num(d.camp_staff_count), color:'var(--c-issue)'}
      ]
    },
    {
      key:'hse', label:'ХАБ зөрчил / Эмнэлэг', unit:'', lowerBetter:true, miniStyle:'chips',
      calc: d => num(d.hse_violation_count) + num(d.medical_assistance_count),
      sub: d => '', // chip-үүд бүрэн мэдээллийг агуулна
      warnIf: d => (num(d.hse_violation_count) + num(d.medical_assistance_count)) > 0,
      mini: d => [
        {label:'Зөрчил', value:num(d.hse_violation_count), tone:'bad'},
        {label:'Эмнэлэг', value:num(d.medical_assistance_count), tone:'mid'}
      ]
    }
    // Асуудлын карт нь бүх хэлтсийн тайланг нэгтгэдэг тул энд биш,
    // renderSummaryCards доторх issuesCard()-аар тусад нь үүснэ.
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
    userRename: (user_id, new_username, new_name) => call('/api/users/rename', withAuth({user_id, new_username, new_name})),
    userCreate: (new_username, new_name, new_pin, permissions) => call('/api/users/create', withAuth({new_username, new_name, new_pin, permissions})),
    userToggle: (user_id) => call('/api/users/toggle', withAuth({user_id})),
    meetings: () => call('/api/meetings', withAuth({})),
    meeting: (date) => call('/api/meeting', withAuth({date})),
    meetingSave: (date, notes, tasks) => call('/api/meeting/save', withAuth({date, notes, tasks})),
    myTasks: () => call('/api/tasks/mine', withAuth({})),
    taskStatus: (task_id, status, worker_note) => call('/api/tasks/status', withAuth({task_id, status, worker_note})),
    range: (from, to) => call('/api/range', withAuth({from, to})),
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

  /** Тээврийн төрлүүдийн дүрс — transport-icons/ доторх бэлэн SVG asset-ууд.
      Эдгээрийг өөр дүрсээр солихгүй, SVG-ийн дотор талд хүрэхгүй. */
  const MAT_ICONS = {
    sludge:  '<img class="transport-type-icon" src="transport-icons/sludge-bed.svg" alt="" aria-hidden="true">',
    waste:   '<img class="transport-type-icon" src="transport-icons/waste-pile.svg" alt="" aria-hidden="true">',
    product: '<img class="transport-type-icon" src="transport-icons/product-coal.svg" alt="" aria-hidden="true">'
  };

  /** V18 — Материалын урсгалын donut: сегмент бүр дээр хувийн badge,
      баруун талд дүрслэлтэй legend. segments = [{label, value, color, icon}]
      opts = {unit, plain} — plain=true бол хуучин энгийн (badge-гүй) хэлбэр. */
  function donutHtml(segments, centerTop, centerBottom, opts = {}){
    const total = segments.reduce((a,s) => a + s.value, 0);
    if(total <= 0) return '';
    const CX = 108, CY = 108, R = 75, SW = 28, C = 2 * Math.PI * R;
    const GAP = total > 0 ? 5 : 0;   // сегмент хоорондын завсар (нумын нэгжээр)
    let offset = 0, arcs = '', badges = '';
    segments.filter(s => s.value > 0).forEach(s => {
      const frac = s.value / total;
      const dash = Math.max(frac * C - GAP, 1.5);
      arcs += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${SW}"
        stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
        stroke-linecap="butt"/>`;
      if(frac >= 0.06){
        const ang = ((offset + frac * C / 2) / C) * 2 * Math.PI - Math.PI / 2;
        const bx = CX + R * Math.cos(ang), by = CY + R * Math.sin(ang);
        badges += `<g><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="18.5" fill="${s.color}" stroke="#fff" stroke-width="3.4"/>
          <text x="${bx.toFixed(1)}" y="${by.toFixed(1)}" class="donut-badge-t" text-anchor="middle" dominant-baseline="central">${Math.round(frac*100)}%</text></g>`;
      }
      offset += frac * C;
    });
    // Голын тоо — нүхэнд багтах фонтын хэмжээг тоон уртаас нь тооцно.
    // Нүхний диаметр = 2*(R - SW/2); тоо ихсэх тусам үсэг автоматаар багасна.
    const numTxt = String(centerTop);
    const nDigits = (numTxt.match(/[0-9]/g) || []).length;
    const nSeps = numTxt.length - nDigits;
    const emW = nDigits * 0.60 + nSeps * 0.30 || 1;
    const holeW = (2 * (R - SW / 2)) * 0.88;
    const fitFs = Math.max(16, Math.min(44, Math.floor(holeW / emW)));

    const legend = segments.map(s => {
      const pct = total ? Math.round(s.value/total*100) : 0;
      const ic = s.icon
        ? `<span class="donut-ic">${s.icon}</span>`
        : `<span class="donut-dot" style="background:${s.color}"></span>`;
      return `<div class="donut-leg">${ic}
        <span class="donut-leg-label">${esc(s.label)}</span>
        <span class="donut-leg-val">${fmt(s.value)} <small>(${pct}%)</small></span></div>`;
    }).join('');
    return `<div class="donut-wrap ${opts.plain ? 'donut-plain' : ''}">
      <div class="donut-fig">
        <svg width="216" height="216" viewBox="0 0 216 216" class="donut-svg" role="img"
             aria-label="${esc(String(centerTop) + ' ' + (centerBottom || ''))}">
          <g transform="rotate(-90 ${CX} ${CY})">${arcs}</g>${opts.plain ? '' : badges}
        </svg>
        <div class="donut-center" style="--dn-fs:${fitFs}px">
          <b class="donut-num">${esc(centerTop)}</b>
          ${(centerBottom || opts.unit) ? `<div class="donut-sub">
            ${centerBottom ? `<span>${esc(centerBottom)}</span>` : ''}
            ${opts.unit ? `<small>${esc(opts.unit)}</small>` : ''}
          </div>` : ''}
        </div>
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

  /** V18 — Спидометр заалт.
      Өдрийн норм = сарын төлөвлөгөө / сарын хоногийн тоо (target аргумент).
      Нум нормын биелэлтээр дүүрч, өнгө нь УЛААНААС НОГООН руу шилжинэ —
      100%-д хүрэхэд нум бүтэн, үзүүр нь ногоон болно. Давсан үед нум дүүрэн
      хэвээр, харин «Биелэлт» тоо давсан хувиараа (105% г.м.) гарна.
      opts: {goalLabel, leftText, rightText} — нумын доорх мөрийн текст. */
  let gaugeSeq = 0;
  function gaugeHtml(value, target, caption, unit, opts){
    const o = opts || {};
    const CX = 115, CY = 118, R = 92, L = Math.PI * R;
    const frac = target > 0 ? Math.min(Math.max(value / target, 0), 1) : 0;
    const pct = target > 0 ? Math.round((value / target) * 100) : null;
    const gid = 'ggr' + (++gaugeSeq);

    // Хуваарийн зураас — 13 ширхэг, 3 дахь бүр нь урт
    let ticks = '';
    for(let i = 0; i <= 12; i++){
      const a = Math.PI * (1 - i / 12);
      const major = (i % 3 === 0);
      const r1 = major ? 64 : 69, r2 = 78;
      ticks += `<line x1="${(CX + r1 * Math.cos(a)).toFixed(1)}" y1="${(CY - r1 * Math.sin(a)).toFixed(1)}"
        x2="${(CX + r2 * Math.cos(a)).toFixed(1)}" y2="${(CY - r2 * Math.sin(a)).toFixed(1)}"
        class="gauge-tick ${major ? 'major' : ''}"/>`;
    }
    // Одоогийн байрлалыг заах цагаан цагираг
    const na = Math.PI * (1 - frac);
    const dotX = (CX + R * Math.cos(na)).toFixed(1), dotY = (CY - R * Math.sin(na)).toFixed(1);

    const arc = 'M23 118 A92 92 0 0 1 207 118';
    const foot = (o.leftText || o.rightText)
      ? `<div class="gauge-foot">
           <span>${esc(o.leftText || '')}</span>
           <span>${o.rightText || ''}</span>
         </div>`
      : '';

    return `<div class="gauge-wrap">
      <div class="gauge-fig">
        <svg viewBox="0 0 230 134" class="gauge-svg" role="img"
             aria-label="${esc(fmt(value) + ' ' + (unit || '') + (pct !== null ? ', өдрийн нормын ' + pct + ' хувь' : ''))}">
          <defs>
            <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#FF6A5A"/>
              <stop offset="32%"  stop-color="#FF9F1C"/>
              <stop offset="64%"  stop-color="#F5DA3E"/>
              <stop offset="100%" stop-color="#3DDC6B"/>
            </linearGradient>
          </defs>
          <path d="${arc}" fill="none" class="gauge-track" stroke-width="11" stroke-linecap="round"/>
          ${ticks}
          ${frac > 0 ? `<path d="${arc}" fill="none" stroke="url(#${gid})" stroke-width="11" stroke-linecap="round"
              stroke-dasharray="${(frac * L).toFixed(1)} ${(L + 20).toFixed(1)}"/>` : ''}
          ${target > 0 ? `<circle cx="${dotX}" cy="${dotY}" r="7" class="gauge-dot" stroke-width="4.5"/>` : ''}
        </svg>
        <div class="gauge-center"><b class="count" data-count="${value}">${fmt(value)}</b>${unit ? `<span class="gauge-unit">${esc(unit)}</span>` : ''}</div>
      </div>
      ${foot}
      ${caption ? `<div class="gauge-caption">${esc(caption)}</div>` : ''}
    </div>`;
  }

  /** Жижиг картын визуал. style:
      'segments' — бүхлийн хуваарилалтыг нэг зурваст (завсартай дугуй сегмент + legend),
      'hbars'    — хэвтээ харьцуулалтын бар (хэмжээс эрс зөрүүтэй үед),
      'chips'    — цөөн тоог өнгөт chip-ээр (0 үед "Зөрчилгүй өдөр"),
      default    — босоо pill багана. */
  function miniViz(items, style){
    if(!items || !items.length) return '';
    if(style === 'segments'){
      const d = items.filter(i => i.value > 0);
      if(!d.length) return '';
      const tot = d.reduce((a, i) => a + i.value, 0) || 1;
      return `<div class="seg-bar">${d.map(i =>
        `<span style="width:${(i.value/tot*100).toFixed(1)}%;background:${i.color || 'var(--brand)'}"></span>`).join('')}</div>
      <div class="seg-legend">${d.map(i =>
        `<span class="sl"><i style="background:${i.color || 'var(--brand)'}"></i>${esc(i.label)} <b>${fmt(i.value)}</b></span>`).join('')}</div>`;
    }
    if(style === 'stats'){
      // Харьцуулах суурь (норм/дундаж) байхгүй үзүүлэлтүүд — зөвхөн тоо, баргүй
      return `<div class="stat-rows">${items.map(i =>
        `<div class="stat-row${i.warn ? ' neg' : ''}">
          <span class="sr-l">${esc(i.label)}</span>
          <span class="sr-v">${fmt(i.value)}${i.unit ? ` <small>${esc(i.unit)}</small>` : ''}</span>
        </div>`).join('')}</div>`;
    }
    if(style === 'hbars'){
      // V18 — өнгөний шилжилттэй pill бар, үзүүрт нь цагаан товгор.
      // item: {label, value, unit, grad:[a,b], frac} — frac өгөгдвөл өөрийн хуваарь.
      const mx = Math.max(...items.map(i => i.value), 1);
      return `<div class="hbar-list">${items.map(i => {
        const f = (i.frac !== undefined && i.frac !== null) ? i.frac : (i.value / mx);
        const w = Math.max(Math.min(f, 1) * 100, 4);
        const bg = i.grad
          ? `linear-gradient(90deg, ${i.grad[0]} 0%, ${i.grad[1]} 100%)`
          : (i.color || 'var(--brand)');
        return `<div class="hbar-row">
          <span class="hl">${esc(i.label)}</span>
          <span class="hbar-track"><span class="hbar-fill" style="width:${w.toFixed(1)}%;background:${bg}"><i class="hbar-knob"></i></span></span>
          <span class="hbar-val">${fmt(i.value)}${i.unit ? ` <small>${esc(i.unit)}</small>` : ''}</span>
        </div>`;
      }).join('')}</div>`;
    }
    if(style === 'chips'){
      const active = items.filter(i => i.value > 0);
      if(!active.length) return `<div class="kpi-chips"><span class="kpi-chip ok">Зөрчилгүй өдөр</span></div>`;
      return `<div class="kpi-chips">${active.map(i =>
        `<span class="kpi-chip ${i.tone || 'bad'}">${esc(i.label)} ${fmt(i.value)}</span>`).join('')}</div>`;
    }
    const max = Math.max(...items.map(i => i.value), 1);
    return `<div class="mini-bars">` + items.map(i => {
      const h = Math.max((i.value / max) * 100, 4);
      return `<div class="mini-bar-col" title="${esc(i.label)}: ${fmt(i.value)}">
        <span class="mini-bar-val">${fmtShort(i.value)}</span>
        <span class="mini-bar-track"><span class="mini-bar" style="height:${h.toFixed(0)}%;${i.color ? 'background:'+i.color : ''}"></span></span>
        <span class="mini-bar-label">${esc(i.label)}</span>
      </div>`;
    }).join('') + `</div>`;
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

  return {esc, today, thisMonth, $, $$, fmt, fmtShort, alertBox, paintUserChrome, animateCounts, formatDateMn, donutHtml, barListHtml, gaugeHtml, waveChartHtml, miniViz, MAT_ICONS};
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
   KPI КАРТУУД — самбар болон хурлын хуудсанд ижилхэн харагдац.
   KpiCards.render(box, curMap, prevMap, {plan, date, span})
   curMap/prevMap = Aggregate.byType(...) буюу нэг өдрийн map.
   ================================================================ */
const KpiCards = (() => {
  const SEV_RANK  = {high:0, medium:1, low:2};
  // Ноцтой байдлын монгол нэршил. ЭНД байх ёстой — асуудлын жагсаалтыг
  // KpiCards зурдаг тул PageDashboard дотор байвал «SEV_LABEL is not defined» гэж унана.
  const SEV_LABEL = {low:'Бага', medium:'Дунд', high:'Өндөр'};

  function collectIssues(dailyMap){
    const out = [];
    CONFIG.reportTypes.forEach(t => {
      const r = dailyMap[t.key];
      if(!r || !r.data) return;
      const text = String(r.data.issue_text || '').trim();
      if(!text) return;
      const isIssueModule = t.key === 'issue';
      out.push({
        key: t.key,
        name: isIssueModule ? 'Ерөнхий асуудал' : t.name,
        color: t.color,
        icon: t.icon,
        text: text,
        sev: r.data.issue_severity || r.data.severity || '',
        status: isIssueModule ? (r.data.status || '') : '',
        action: isIssueModule ? String(r.data.action_taken || '').trim() : '',
        person: isIssueModule ? String(r.data.responsible_person || '').trim() : ''
      });
    });
    return out.sort((a, b) => {
      const ra = SEV_RANK[a.sev] === undefined ? 3 : SEV_RANK[a.sev];
      const rb = SEV_RANK[b.sev] === undefined ? 3 : SEV_RANK[b.sev];
      return ra - rb;
    });
  }

  function issuesCard(dailyMap){
    const type = CONFIG.reportTypes.find(t => t.key === 'issue') || {};
    const chip = `<span class="mchip" style="background:${type.color}">${type.icon || ''}</span>`;
    const items = collectIssues(dailyMap);
    const arrived = CONFIG.reportTypes.filter(t => dailyMap[t.key]).length;

    if(!items.length){
      return `<div class="bezel card card-full card-issues"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${chip}Асуудал</span>
          <span class="issue-tally ok">Асуудалгүй</span></div>
        <div class="issue-none">Ирсэн ${arrived} тайлангийн аль нь ч асуудал тэмдэглээгүй байна.</div>
      </div>`;
    }

    const high = items.filter(i => i.sev === 'high').length;
    const rows = items.map(i => {
      const sevTag = i.sev
        ? `<span class="issue-sev sev-${UI.esc(i.sev)}">${UI.esc(SEV_LABEL[i.sev] || i.sev)}</span>` : '';
      const stTag = i.status
        ? `<span class="issue-st ${i.status === 'open' ? 'st-open' : 'st-done'}">${i.status === 'open' ? 'Нээлттэй' : 'Шийдсэн'}</span>` : '';
      const meta = [];
      if(i.action) meta.push('Авсан арга хэмжээ: ' + i.action);
      if(i.person) meta.push('Хариуцсан: ' + i.person);
      return `<div class="issue-item" style="--iss:${i.color}">
        <div class="issue-top">
          <span class="issue-dept"><span class="mchip mchip-sm" style="background:${i.color}">${i.icon || ''}</span>${UI.esc(i.name)}</span>
          <span class="issue-tags">${sevTag}${stTag}</span>
        </div>
        <div class="issue-text">${UI.esc(i.text)}</div>
        ${meta.length ? `<div class="issue-meta">${UI.esc(meta.join(' · '))}</div>` : ''}
      </div>`;
    }).join('');

    return `<div class="bezel card card-full card-issues${high ? ' card-warn' : ''}"><span class="tick-a"></span><span class="tick-b"></span>
      <div class="card-tag-row"><span class="label">${chip}Асуудал</span>
        <span class="issue-tally${high ? ' bad' : ''}">${items.length} асуудал${high ? ' · ' + high + ' өндөр' : ''}</span></div>
      <div class="issue-list">${rows}</div>
    </div>`;
  }

  function render(box, dailyMap, dailyPrevMap, opts){
    if(!box) return;
    opts = opts || {};
    const dashPlan = opts.plan || {}, dashDate = opts.date || UI.today(), dashSpan = opts.span || 1;
    const trendFrom = dashSpan > 1 ? 'өмнөх хугацаанаас' : 'өчигдрөөс';
    box.innerHTML = CONFIG.summaryCards.map(c => {
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
            trendChip = `<span class="trend-chip ${good ? 'trend-good' : 'trend-bad'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%<small>${trendFrom}</small></span>`;
          } else {
            trendChip = `<span class="trend-chip trend-flat">— 0%<small>${trendFrom}</small></span>`;
          }
        }
      }

      // Карт доторх визуал: viz hook (gauge/donut) байвал түүнийг,
      // үгүй бол картын төрөлд тохирсон мини визуал (segments/hbars/chips/pill)
      let miniHtml = '';
      if(c.viz){
        miniHtml = c.viz(r.data, {plan: dashPlan, date: dashDate, span: dashSpan}) || '';
      } else if(c.mini){
        miniHtml = UI.miniViz(c.mini(r.data), c.miniStyle);
      }

      const isViz = c.vizReplacesValue && miniHtml;
      // Trend chip: энгийн картад том тооны хажууд, viz картад гарчгийн мөрөнд
      const valueRow = isViz
        ? ''
        : `<div class="value-row"><div class="value"><span class="count" data-count="${val}">${UI.fmt(val)}</span>${c.unit ? ' <span class="unit">'+c.unit+'</span>' : ''}</div>${trendChip}</div>`;
      const wide = (c.viz && miniHtml) ? 'card-wide' : '';
      const subTxt = c.sub(r.data);
      return `<div class="bezel card ${warn?'card-warn':''} ${featured} ${wide} ${fullRow}"><span class="tick-a"></span><span class="tick-b"></span>
        <div class="card-tag-row"><span class="label">${chip}${UI.esc(c.label)}</span>${isViz ? trendChip : ''}</div>
        ${valueRow}
        ${miniHtml}
        ${subTxt ? `<div class="sub">${UI.esc(subTxt)}</div>` : ''}</div>`;
    }).join('') + issuesCard(dailyMap);
    UI.animateCounts(box);
  }

  return {render};
})();

/* ================================================================
   ХУГАЦААНЫ АГРЕГАЦИ — олон өдрийн тайланг НЭГ өдрийн хэлбэрт хувиргана.
   Ингэснээр самбарын gauge/donut/картууд ямар ч хугацаанд ажиллана.

   Дүрэм: тонн/литр/рейс/зөрчил = НИЙЛБЭР; машин, хүний тоо = ДУНДАЖ
   (12 өдрийн 32 машиныг нэмбэл 384 болно — утгагүй); түлшний эхний
   үлдэгдэл = ЭХНИЙ өдрийнх, эцсийн үлдэгдэл = СҮҮЛИЙН өдрийнх;
   тоолуур, лаб, цаг агаар = ДУНДАЖ.
   ================================================================ */
const Aggregate = (() => {
  const SUM = 'sum', AVG = 'avg', FIRST = 'first', LAST = 'last';
  const RULES = {
    production: {
      shift_day_product_ton:SUM, shift_night_product_ton:SUM,
      day_fuel_liter:SUM, night_fuel_liter:SUM, middling_ton:SUM,
      day_meter:LAST, night_meter:LAST,
      lab_avg_luojing_ad:AVG, lab_avg_fumei_ad:AVG, lab_avg_caking_g:AVG
    },
    transport: {
      sludge_trips:SUM, sludge_ton:SUM, waste_trips:SUM, waste_ton:SUM,
      short_waste_trips:SUM, short_waste_ton:SUM,
      product_transport_trips:SUM, product_transport_ton:SUM,
      weighbridge_net_ton:SUM, weighbridge_trips:SUM
    },
    fuel: {
      fuel_opening_liter:FIRST, fuel_income_liter:SUM,
      fuel_expense_liter:SUM, fuel_closing_liter:LAST,
      fuel_truck_income_liter:SUM, fuel_truck_machine_liter:SUM,
      fuel_truck_plant_liter:SUM, reserve_tank_expense_liter:SUM,
      fuel_truck_closing_liter:LAST, reserve_tank_closing_liter:LAST
    },
    equipment: {
      main_working_count:AVG, rental_sludge_working_count:AVG,
      product_transport_working_count:AVG, repair_count:AVG, parked_count:AVG
    },
    camp: {
      mongolian_count:AVG, chinese_count:AVG, guard_count:AVG, guest_count:AVG,
      outside_meal_count:AVG, contractor_count:AVG, camp_staff_count:AVG
    },
    hse: {
      hse_violation_count:SUM, medical_assistance_count:SUM,
      day_temp_c:AVG, night_temp_c:AVG, humidity_percent:AVG, wind_speed_ms:AVG
    },
    issue: {}
  };
  const n = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };

  /** reports → {report_type: {data, submitted_by_name, updated_at, _days}} */
  function byType(reports){
    const groups = {};
    (reports || []).forEach(r => { (groups[r.report_type] = groups[r.report_type] || []).push(r); });
    const out = {};
    Object.keys(groups).forEach(key => {
      const list = groups[key].slice().sort((a,b) => (a.date||'').localeCompare(b.date||''));
      const rules = RULES[key] || {};
      const data = {};
      // Бүх талбарыг дүрмээр нь нэгтгэнэ
      const fields = new Set();
      list.forEach(r => Object.keys(r.data || {}).forEach(f => fields.add(f)));
      fields.forEach(f => {
        const rule = rules[f];
        if(rule === AVG){
          const vals = list.map(r => n((r.data||{})[f])).filter((_, i) => (list[i].data||{})[f] != null);
          data[f] = vals.length ? Math.round((vals.reduce((a,b)=>a+b,0) / vals.length) * 10) / 10 : 0;
        } else if(rule === FIRST){
          const hit = list.find(r => (r.data||{})[f] != null);
          data[f] = hit ? n(hit.data[f]) : 0;
        } else if(rule === LAST){
          const hit = [...list].reverse().find(r => (r.data||{})[f] != null);
          data[f] = hit ? n(hit.data[f]) : 0;
        } else if(rule === SUM){
          data[f] = Math.round(list.reduce((a,r) => a + n((r.data||{})[f]), 0) * 10) / 10;
        }
      });
      // Машины мөрүүд — машин бүрээр нэгтгэнэ (үр бүтээмжийн хэсэгт хэрэгтэй)
      const rowsAll = [];
      list.forEach(r => (r.data && r.data.vehicle_rows || []).forEach(row => rowsAll.push(row)));
      if(rowsAll.length){
        const agg = {};
        rowsAll.forEach(row => {
          const k = row.vid || row.name;
          if(!agg[k]) agg[k] = {...row, trips:0, ton:0, liter:0};
          agg[k].trips = n(agg[k].trips) + n(row.trips);
          agg[k].ton = n(agg[k].ton) + n(row.ton);
          agg[k].liter = n(agg[k].liter) + n(row.liter);
        });
        data.vehicle_rows = Object.values(agg);
      }
      // Асуудлын текстүүдийг нэгтгэнэ (сүүлийн 5)
      const issues = list.filter(r => (r.data||{}).issue_text).map(r => r.data.issue_text);
      if(issues.length) data.issue_text = issues.slice(-5).join(' · ');
      const lastRep = list[list.length - 1] || {};
      if(key === 'issue'){
        data.status = (lastRep.data||{}).status || '';
        data.severity = (lastRep.data||{}).severity || '';
      }
      out[key] = {data, submitted_by_name: lastRep.submitted_by_name, updated_at: lastRep.updated_at,
                  _count: list.length, _days: new Set(list.map(r => r.date)).size};
    });
    return out;
  }
  return {byType};
})();

/* ================================================================
   ХУГАЦААНЫ ТАЙЛАН — сонгосон интервалын нэгтгэл, даалгавар, асуудал.
   Хяналтын самбар болон бусад хуудсаас дуудагдана.
   RangeReport.render(box, from, to) → Promise
   ================================================================ */
const RangeReport = (() => {
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  let rangeFilter = {status:null, person:null};

  function aggregate(reports){
    const n = CONFIG.num;
    const a = {prod:0, sludge:0, waste:0, product:0, shortT:0, weigh:0,
               fuelIn:0, fuelOut:0, hseV:0, hseM:0, issues:[], days:new Set(), count:0};
    (reports || []).forEach(r => {
      const d = r.data || {};
      a.days.add(r.date); a.count++;
      if(r.report_type === 'production') a.prod += n(d.shift_day_product_ton) + n(d.shift_night_product_ton);
      if(r.report_type === 'transport'){
        a.sludge += n(d.sludge_ton); a.waste += n(d.waste_ton);
        a.product += n(d.product_transport_ton); a.shortT += n(d.short_waste_ton);
        a.weigh += n(d.weighbridge_net_ton);
      }
      if(r.report_type === 'fuel'){
        a.fuelIn += n(d.fuel_income_liter != null ? d.fuel_income_liter : d.fuel_truck_income_liter);
        a.fuelOut += d.fuel_expense_liter != null ? n(d.fuel_expense_liter)
          : n(d.fuel_truck_machine_liter) + n(d.fuel_truck_plant_liter) + n(d.reserve_tank_expense_liter);
      }
      if(r.report_type === 'hse'){ a.hseV += n(d.hse_violation_count); a.hseM += n(d.medical_assistance_count); }
      if(d.issue_text) a.issues.push({date:r.date, text:d.issue_text, type:r.report_type, sev:d.issue_severity || d.severity || ''});
    });
    return a;
  }

  function trendChip(cur, prev, lowerBetter){
    if(!prev || prev === 0) return '';
    const pct = Math.round(((cur - prev) / prev) * 100);
    if(pct === 0) return `<span class="trend-chip trend-flat">— 0%<small>өмнөхөөс</small></span>`;
    const up = pct > 0, good = lowerBetter ? !up : up;
    return `<span class="trend-chip ${good ? 'trend-good' : 'trend-bad'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%<small>өмнөхөөс</small></span>`;
  }

  async function render(box, from, to){
    if(!box) return;
    if(!from || !to){ box.innerHTML = '<div class="module-empty">Хугацаа сонгоно уу.</div>'; return; }
    if(from > to){ box.innerHTML = '<div class="module-empty">Эхлэх огноо дуусах огнооноос хойш байна.</div>'; return; }
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const span = daysBetween(from, to) + 1;
      const pFrom = addDays(from, -span), pTo = addDays(from, -1);
      const [cur, prev] = await Promise.all([API.range(from, to), API.range(pFrom, pTo)]);
      const a = aggregate(cur.reports), p = aggregate(prev.reports);

      const modules = CONFIG.reportTypes.length;
      const expected = span * modules;
      const attend = expected ? Math.round(a.count / expected * 100) : 0;

      const card = (label, val, unit, cur2, prev2, lower) => `<div class="rs-card">
        <div class="rs-label">${UI.esc(label)}</div>
        <div class="rs-val"><b>${val}</b>${unit ? `<span>${unit}</span>` : ''}</div>
        ${trendChip(cur2, prev2, lower)}
      </div>`;

      const ISSUE_LIMIT = 12;
      const issueRow = i => {
        const t = CONFIG.reportTypes.find(x => x.key === i.type);
        const sevTone = i.sev === 'high' ? 'st-post' : (i.sev === 'medium' ? 'st-open' : '');
        return `<div class="rs-issue">
          <span class="rs-issue-dot" style="background:${t ? t.color : 'var(--ink-3)'}"></span>
          <span class="rs-issue-day">${i.date.slice(5).replace('-', '/')}</span>
          <span class="rs-issue-dep">${t ? UI.esc(t.name) : ''}</span>
          <span class="rs-issue-txt">${UI.esc(i.text)}</span>
          ${i.sev ? `<span class="task-status ${sevTone}">${i.sev === 'high' ? 'Өндөр' : (i.sev === 'medium' ? 'Дунд' : 'Бага')}</span>` : ''}
        </div>`;
      };
      const issueRows = a.issues.length
        ? a.issues.slice(0, ISSUE_LIMIT).map(issueRow).join('')
          + (a.issues.length > ISSUE_LIMIT
              ? `<div class="rs-more"><button type="button" class="btn btn-soft btn-sm" id="moreIssuesBtn">Бүгдийг харах (${a.issues.length})</button></div>`
              : '')
        : '<div class="module-empty">Энэ хугацаанд бүртгэгдсэн асуудал алга.</div>';

      // Тухайн хугацаанд ӨГСӨН даалгаврууд — хурлын огноогоор шүүгдсэн
      const tasks = cur.tasks || [];
      const today = UI.today();
      const tDone = tasks.filter(t => t.status === 'done').length;
      const tPost = tasks.filter(t => t.status === 'postponed').length;
      const tOpen = tasks.filter(t => t.status === 'open').length;
      const tLate = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length;

      // Хариуцагчаар задаргаа
      const byPerson = {};
      tasks.forEach(t => {
        const k = t.assignee_name || 'Хариуцагчгүй';
        if(!byPerson[k]) byPerson[k] = {done:0, total:0};
        byPerson[k].total++;
        if(t.status === 'done') byPerson[k].done++;
      });
      const personChips = Object.keys(byPerson).sort().map(k => {
        const v = byPerson[k];
        const full = v.done === v.total;
        return `<button type="button" class="pr-chip ${full ? 'pr-full' : ''}" data-person="${UI.esc(k)}">${UI.esc(k)} <b>${v.done}/${v.total}</b></button>`;
      }).join('');

      // Даалгаврын жагсаалтыг шүүлтүүртэйгээр зурна (chip дарахад дуудагдана)
      const isLate = t => t.status !== 'done' && t.due_date && t.due_date < today;
      function drawTaskList(){
        const sel = rangeFilter;
        const list = tasks.filter(t => {
          if(sel.status === 'late' ? !isLate(t) : (sel.status && t.status !== sel.status)) return false;
          if(sel.person && (t.assignee_name || 'Хариуцагчгүй') !== sel.person) return false;
          return true;
        });
        const box2 = UI.$('#rangeTaskList');
        if(!box2) return;
        if(!list.length){ box2.innerHTML = '<div class="module-empty">Энэ шүүлтүүрт тохирох даалгавар алга.</div>'; return; }
        const groups = {};
        list.forEach(t => { (groups[t.meeting_date] = groups[t.meeting_date] || []).push(t); });
        box2.innerHTML = Object.keys(groups).sort().reverse().map(md => {
          const rows = groups[md].map(t => `<div class="task-view">
            <span class="task-status ${TASK_STATUS_TONE[t.status] || ''}">${TASK_STATUS_LABELS[t.status] || t.status}</span>
            <div class="task-body">
              <div class="task-txt">${UI.esc(t.task_text)}</div>
              <div class="task-meta-row">
                <span class="task-who">${t.assignee_name ? UI.esc(t.assignee_name) : 'Хариуцагчгүй'}</span>
                <span class="tdates">${dateChips(t, md)}</span>
              </div>
              ${t.worker_note ? `<div class="task-note">${UI.esc(t.worker_note)}</div>` : ''}
            </div>
          </div>`).join('');
          return `<div class="tg"><div class="tg-head">${md} хурал <span>${groups[md].length}</span></div>${rows}</div>`;
        }).join('');
      }

      const taskBlock = tasks.length ? `
        <div class="rs-issues-head">Энэ хугацаанд өгсөн даалгавар <span>${tasks.length}</span></div>
        <div class="tsum">
          <button type="button" class="tsum-chip st-done" data-status="done">Биелсэн ${tDone}</button>
          <button type="button" class="tsum-chip st-open" data-status="open">Хийгдэж байна ${tOpen}</button>
          <button type="button" class="tsum-chip st-post" data-status="postponed">Хойшилсон ${tPost}</button>
          ${tLate ? `<button type="button" class="tsum-chip st-late" data-status="late">⚠ Хугацаа хэтэрсэн ${tLate}</button>` : ''}
          <button type="button" class="btn btn-soft btn-sm" id="toggleTasksBtn">Дэлгэрэнгүй</button>
        </div>
        <div class="pr-chips">${personChips}</div>
        <div id="rangeTaskList" class="hidden"></div>` : '';

      box.innerHTML = `
        <div class="rs-head">${span} хоног · ${a.days.size} өдөр тайлан ирсэн · ирц ${attend}%</div>
        <div class="rs-grid">
          ${card('Бүтээгдэхүүн үйлдвэрлэлт', UI.fmt(a.prod), 'тн', a.prod, p.prod)}
          ${card('Шлам (ER-ээс)', UI.fmt(a.sludge), 'тн', a.sludge, p.sludge)}
          ${card('Хаягдал', UI.fmt(a.waste), 'тн', a.waste, p.waste)}
          ${card('Бүтээгдэхүүн тээвэр', UI.fmt(a.product + a.shortT), 'тн', a.product + a.shortT, p.product + p.shortT)}
          ${card('Пүүний жин', UI.fmt(a.weigh), 'тн', a.weigh, p.weigh)}
          ${card('Түлш зарлага', UI.fmt(a.fuelOut), 'л', a.fuelOut, p.fuelOut, true)}
          ${card('ХАБ зөрчил', UI.fmt(a.hseV), '', a.hseV, p.hseV, true)}
        </div>
        ${taskBlock}
        <div class="rs-issues-wrap">
          <button type="button" class="sec-toggle" id="issuesToggle">
            <span>Тухайн хугацааны асуудлууд <span class="sec-count">${a.issues.length}</span></span>
            <span class="sec-caret">▾</span>
          </button>
          <div class="rs-issues" id="rsIssues">${issueRows}</div>
        </div>`;

      // ---- Шүүлтүүрийн удирдлага ----
      const listEl = UI.$('#rangeTaskList');
      const tBtn = UI.$('#toggleTasksBtn');
      function openList(){ if(listEl){ listEl.classList.remove('hidden'); if(tBtn) tBtn.textContent = 'Хураах'; } }
      function syncChips(){
        UI.$$('.tsum-chip').forEach(c => c.classList.toggle('chip-on', c.dataset.status === rangeFilter.status));
        UI.$$('.pr-chip').forEach(c => c.classList.toggle('chip-on', c.dataset.person === rangeFilter.person));
      }
      if(tasks.length){
        rangeFilter = {status:null, person:null};
        drawTaskList();
        UI.$$('.tsum-chip').forEach(chip => chip.onclick = () => {
          rangeFilter.status = (rangeFilter.status === chip.dataset.status) ? null : chip.dataset.status;
          syncChips(); drawTaskList(); openList();
        });
        UI.$$('.pr-chip').forEach(chip => chip.onclick = () => {
          rangeFilter.person = (rangeFilter.person === chip.dataset.person) ? null : chip.dataset.person;
          syncChips(); drawTaskList(); openList();
        });
      }
      if(tBtn) tBtn.onclick = () => {
        const hidden = listEl.classList.toggle('hidden');
        tBtn.textContent = hidden ? 'Дэлгэрэнгүй' : 'Хураах';
      };
      const iBtn = UI.$('#moreIssuesBtn');
      if(iBtn) iBtn.onclick = () => {
        UI.$('#rsIssues').innerHTML = a.issues.map(issueRow).join('');
      };
      // Асуудлын хэсгийг хураах / дэлгэх
      const isToggle = UI.$('#issuesToggle');
      if(isToggle) isToggle.onclick = () => {
        const hid = UI.$('#rsIssues').classList.toggle('hidden');
        isToggle.classList.toggle('sec-closed', hid);
      };
    }catch(err){
      box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`;
    }
  }

  return {render, addDays, daysBetween};
})();

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
  let dashSpan = 1;      // сонгосон хугацааны хоногийн тоо (gauge-ийн зорилтод)
  let periodDays = 0;    // тайлан ирсэн өдрийн тоо

  const dateInput = UI.$('#dashboardDate');
  const monthInput = UI.$('#dashboardMonth');   // ТҮР ХАССАН хэсэгт хамаарна (байхгүй бол алгасна)
  dateInput.value = UI.today();
  if(monthInput){ monthInput.value = UI.thisMonth(); monthInput.onchange = () => loadMonthly(monthInput.value); }
  dateInput.onchange = () => loadDaily(dateInput.value);
  UI.$('#prevDayBtn').onclick = () => shiftDay(-1);
  UI.$('#nextDayBtn').onclick = () => shiftDay(1);

  /* ---------------- Хугацааны удирдлага ----------------
     Hero-гийн огноо = тулгуур өдөр, preset = цонхны урт.
     «Өдөр» бол ганц өдөр — өмнөх бүх зан төлөв хэвээр. */
  let periodKind = 'day';
  let periodFrom = UI.today(), periodTo = UI.today();
  const PERIOD_LABELS = {day:'Өдөр', week:'7 хоног', month:'Сар', q:'3 сар'};

  function computePeriod(kind, anchor){
    const d = new Date(anchor + 'T00:00:00');
    if(kind === 'week') return [RangeReport.addDays(anchor, -6), anchor];
    if(kind === 'month') return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`, anchor];
    if(kind === 'q'){ const q = new Date(d); q.setMonth(q.getMonth() - 3); q.setDate(q.getDate() + 1);
                      return [q.toISOString().slice(0,10), anchor]; }
    return [anchor, anchor];
  }
  function setPeriod(kind){
    periodKind = kind;
    [periodFrom, periodTo] = computePeriod(kind, dateInput.value || UI.today());
    UI.$$('.preset-btn').forEach(b => b.classList.toggle('preset-on', b.dataset.preset === kind));
    const info = UI.$('#heroRangeInfo');
    if(info) info.textContent = (kind === 'day') ? '' : `${periodFrom} — ${periodTo}`;
    loadPeriod();
  }
  UI.$$('.preset-btn').forEach(b => b.onclick = () => setPeriod(b.dataset.preset));

  function shiftDay(delta){
    const d = new Date(dateInput.value || UI.today());
    d.setDate(d.getDate() + delta);
    dateInput.value = d.toISOString().slice(0,10);
    setPeriod(periodKind);
  }

  /** Сонгосон хугацааны тайланг татаж, нэг өдрийн хэлбэрт хувиргаад зурна */
  async function loadPeriod(){
    const msg = UI.$('#dashboardMessage');
    UI.alertBox(msg, '');
    const single = (periodFrom === periodTo);
    const spanDays = RangeReport.daysBetween(periodFrom, periodTo) + 1;

    const heroDate = UI.$('#heroDate');
    if(heroDate) heroDate.textContent = single
      ? UI.formatDateMn(periodTo)
      : `${UI.formatDateMn(periodFrom).replace(' гараг','')} — ${UI.formatDateMn(periodTo).replace(' гараг','')}`;
    const heroLine = UI.$('#heroDateLine');
    if(heroLine) heroLine.textContent = single ? 'Тайлангийн нэгтгэл'
      : `${PERIOD_LABELS[periodKind] || ''} · ${spanDays} хоногийн нэгтгэл`;

    UI.$('#statusRow').innerHTML = '';
    UI.$('#summaryCards').innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    UI.$('#moduleDetail').innerHTML = '';
    try{
      // Өмнөх ижил урттай хугацаа — харьцуулалтад
      const pTo = RangeReport.addDays(periodFrom, -1);
      const pFrom = RangeReport.addDays(periodFrom, -spanDays);
      const [cur, prev, planRes] = await Promise.all([
        API.range(periodFrom, periodTo),
        API.range(pFrom, pTo).catch(() => ({reports: []})),
        API.plan(periodTo.slice(0,7)).catch(() => ({plan: {}}))
      ]);
      dashPlan = planRes.plan || {};
      dashDate = periodTo;
      dashSpan = spanDays;
      dailyMap = Aggregate.byType(cur.reports);
      dailyPrevMap = Aggregate.byType(prev.reports);
      periodDays = new Set((cur.reports||[]).map(r => r.date)).size;
      renderStatusRow();
      KpiCards.render(UI.$('#summaryCards'), dailyMap, dailyPrevMap,
                      {plan: dashPlan, date: dashDate, span: dashSpan});
      renderWeather(dailyMap.hse);
      renderSafety(periodTo);
      renderPeriodExtras(cur);
    }catch(err){
      if(/нэвтрэлт|эрхгүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.$('#summaryCards').innerHTML = '';
      UI.alertBox(msg, err.message);
    }
  }
  const loadDaily = () => setPeriod(periodKind);   // хуучин дуудлагатай нийцүүлэх

  /* ---------------- Осол гэмтэлгүй ажилласан хоног ----------------
     Сүүлийн 45 хоногийн ХАБЭА тайлангаас зөрчил/эмнэлгийн тусламж бүртгэгдсэн
     хамгийн сүүлийн өдрийг олж, түүнээс хойшхи хоногийг тоолно.
     Тайлан бүрэн болсны дараа энэ тоог ХАБЭА-гийн form өөрөө өгнө. */
  let safetyCache = {key:null, value:null};
  async function renderSafety(anchor){
    const box = UI.$('#safetyBlock');
    if(!box) return;
    if(safetyCache.key !== anchor){
      safetyCache.key = anchor;
      try{
        const from = RangeReport.addDays(anchor, -45);
        const res = await API.range(from, anchor);
        const bad = (res.reports || [])
          .filter(r => r.report_type === 'hse')
          .filter(r => (parseFloat((r.data||{}).hse_violation_count) || 0) > 0
                    || (parseFloat((r.data||{}).medical_assistance_count) || 0) > 0)
          .map(r => r.date).sort();
        safetyCache.value = bad.length ? bad[bad.length - 1] : null;
      }catch(e){ safetyCache.value = undefined; }
    }
    const last = safetyCache.value;
    if(last === undefined){ box.classList.add('hidden'); return; }
    const days = (last === null) ? 45 : RangeReport.daysBetween(last, anchor);
    const shield = '<span class="sb-ico"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" '
      + 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M12 2 4.5 5v6c0 5 3.2 8.7 7.5 11 4.3-2.3 7.5-6 7.5-11V5L12 2z"/>'
      + '<path d="m8.8 12 2.2 2.2 4.2-4.4"/></svg></span>';
    box.classList.remove('hidden');
    box.classList.toggle('warn', days === 0);
    box.innerHTML = shield + `<div>
      <div class="sb-l">Осол гэмтэлгүй ажилласан</div>
      <div class="sb-v">${last === null ? days + '+' : days}<small>хоног</small></div>
    </div>
    <div class="sb-sub">${last === null ? 'Сүүлийн 45 хоногт зөрчил, эмнэлгийн тусламж бүртгэгдээгүй'
      : (days === 0 ? 'Өнөөдөр тохиолдол бүртгэгдлээ' : 'Сүүлийн тохиолдол · ' + last)}</div>`;
  }

  /* ---------------- Цаг агаарын карт ----------------
     ХАБЭА тайлангийн 4 утгыг dashboard.html дахь SVG-д суулгана.
     Тайлан ирээгүй бол картыг бүрэн нуух. */
  function renderWeather(hse){
    const wrap = UI.$('#weatherCard');
    if(!wrap) return;
    const d = (hse && hse.data) || {};
    const has = ['day_temp_c','night_temp_c','humidity_percent','wind_speed_ms']
      .some(k => d[k] !== undefined && d[k] !== null && d[k] !== '');
    wrap.classList.toggle('hidden', !has);
    if(!has) return;

    const num = v => { const x = parseFloat(v); return isNaN(x) ? null : Math.round(x * 10) / 10; };
    const txt = (id, v) => { const el = UI.$('#' + id); if(el) el.textContent = v; };
    const day = num(d.day_temp_c), night = num(d.night_temp_c),
          hum = num(d.humidity_percent), wind = num(d.wind_speed_ms);
    const dash = v => (v === null ? '—' : v);

    txt('location-text', 'Үйлдвэрийн талбай');
    txt('temperature', dash(day));
    txt('weather-condition', 'Өдрийн ээлжийн хэм');
    txt('date-text', 'ХАБЭА-гийн тайлангаас');
    txt('night-temperature', night === null ? '—' : night + '°');
    txt('humidity', hum === null ? '—' : hum + '%');
    // wind-speed доторх tspan (нэгж) хэвээр үлдэх ёстой тул зөвхөн эхний текст зангилааг солино
    const w = UI.$('#wind-speed');
    if(w && w.firstChild) w.firstChild.nodeValue = (wind === null ? '— ' : wind + ' ');

    const desc = UI.$('#weather-card-description');
    if(desc) desc.textContent =
      `Өдрийн ээлж ${dash(day)} хэм, шөнийн ээлж ${dash(night)} хэм, чийг ${dash(hum)} хувь, салхи ${dash(wind)} метр секунд.`;
  }

  /** Хугацааны нэмэлт хэсгүүд: хурлын даалгавар ба асуудлын жагсаалт.
      Хоёулаа тусдаа панелд, өгөгдөлгүй бол нуугдана. */
  let taskFilter = {status:null, person:null};
  function renderPeriodExtras(cur){
    const tasks = cur.tasks || [];
    const today = UI.today();
    const isLate = t => t.status !== 'done' && t.due_date && t.due_date < today;

    /* ---- Даалгавар ---- */
    const tPanel = UI.$('#tasksPanel'), tBox = UI.$('#periodTasks');
    if(tPanel && tBox){
      if(!tasks.length){ tPanel.classList.add('hidden'); }
      else {
        tPanel.classList.remove('hidden');
        const done = tasks.filter(t => t.status === 'done').length;
        const open = tasks.filter(t => t.status === 'open').length;
        const post = tasks.filter(t => t.status === 'postponed').length;
        const late = tasks.filter(isLate).length;
        const sub = UI.$('#tasksSub');
        if(sub) sub.textContent = `${periodFrom} — ${periodTo} · нийт ${tasks.length} даалгавар`;

        const byPerson = {};
        tasks.forEach(t => {
          const k = t.assignee_name || 'Хариуцагчгүй';
          if(!byPerson[k]) byPerson[k] = {done:0, total:0};
          byPerson[k].total++; if(t.status === 'done') byPerson[k].done++;
        });
        const personChips = Object.keys(byPerson).sort().map(k => {
          const v = byPerson[k];
          return `<button type="button" class="pr-chip ${v.done === v.total ? 'pr-full' : ''}" data-person="${UI.esc(k)}">${UI.esc(k)} <b>${v.done}/${v.total}</b></button>`;
        }).join('');

        taskFilter = {status:null, person:null};
        tBox.innerHTML = `
          <div class="tsum">
            <button type="button" class="tsum-chip st-done" data-status="done">Биелсэн ${done}</button>
            <button type="button" class="tsum-chip st-open" data-status="open">Хийгдэж байна ${open}</button>
            <button type="button" class="tsum-chip st-post" data-status="postponed">Хойшилсон ${post}</button>
            ${late ? `<button type="button" class="tsum-chip st-late" data-status="late">⚠ Хугацаа хэтэрсэн ${late}</button>` : ''}
          </div>
          <div class="pr-chips">${personChips}</div>
          <div id="periodTaskList"></div>`;

        const drawTasks = () => {
          const list = tasks.filter(t => {
            if(taskFilter.status === 'late' ? !isLate(t) : (taskFilter.status && t.status !== taskFilter.status)) return false;
            if(taskFilter.person && (t.assignee_name || 'Хариуцагчгүй') !== taskFilter.person) return false;
            return true;
          });
          const el = UI.$('#periodTaskList');
          if(!list.length){ el.innerHTML = '<div class="module-empty">Энэ шүүлтүүрт тохирох даалгавар алга.</div>'; return; }
          const groups = {};
          list.forEach(t => { (groups[t.meeting_date] = groups[t.meeting_date] || []).push(t); });
          el.innerHTML = Object.keys(groups).sort().reverse().map(md => {
            const rows = groups[md].map(t => `<div class="task-view">
              <span class="task-status ${TASK_STATUS_TONE[t.status] || ''}">${TASK_STATUS_LABELS[t.status] || t.status}</span>
              <div class="task-body">
                <div class="task-txt">${UI.esc(t.task_text)}</div>
                <div class="task-meta-row">
                  <span class="task-who">${t.assignee_name ? UI.esc(t.assignee_name) : 'Хариуцагчгүй'}</span>
                  <span class="tdates">${dateChips(t, md)}</span>
                </div>
                ${t.worker_note ? `<div class="task-note">${UI.esc(t.worker_note)}</div>` : ''}
              </div>
            </div>`).join('');
            return `<div class="tg"><div class="tg-head">${md} хурал <span>${groups[md].length}</span></div>${rows}</div>`;
          }).join('');
        };
        const sync = () => {
          UI.$$('.tsum-chip', tBox).forEach(c => c.classList.toggle('chip-on', c.dataset.status === taskFilter.status));
          UI.$$('.pr-chip', tBox).forEach(c => c.classList.toggle('chip-on', c.dataset.person === taskFilter.person));
        };
        UI.$$('.tsum-chip', tBox).forEach(c => c.onclick = () => {
          taskFilter.status = (taskFilter.status === c.dataset.status) ? null : c.dataset.status;
          sync(); drawTasks();
        });
        UI.$$('.pr-chip', tBox).forEach(c => c.onclick = () => {
          taskFilter.person = (taskFilter.person === c.dataset.person) ? null : c.dataset.person;
          sync(); drawTasks();
        });
        drawTasks();
      }
    }

    /* ---- Асуудлууд ---- */
    const iPanel = UI.$('#issuesPanel'), iBox = UI.$('#periodIssues');
    if(iPanel && iBox){
      const issues = [];
      (cur.reports || []).forEach(r => {
        const d = r.data || {};
        if(d.issue_text) issues.push({date:r.date, text:d.issue_text, type:r.report_type,
                                      sev:d.issue_severity || d.severity || ''});
      });
      issues.sort((a,b) => b.date.localeCompare(a.date));
      if(!issues.length){ iPanel.classList.add('hidden'); return; }
      iPanel.classList.remove('hidden');
      const sub = UI.$('#issuesSub');
      if(sub) sub.textContent = `${periodFrom} — ${periodTo} · нийт ${issues.length}`;
      const row = i => {
        const t = CONFIG.reportTypes.find(x => x.key === i.type);
        const tone = i.sev === 'high' ? 'st-post' : (i.sev === 'medium' ? 'st-open' : '');
        return `<div class="rs-issue">
          <span class="rs-issue-dot" style="background:${t ? t.color : 'var(--ink-3)'}"></span>
          <span class="rs-issue-day">${i.date.slice(5).replace('-','/')}</span>
          <span class="rs-issue-dep">${t ? UI.esc(t.name) : ''}</span>
          <span class="rs-issue-txt">${UI.esc(i.text)}</span>
          ${i.sev ? `<span class="task-status ${tone}">${i.sev === 'high' ? 'Өндөр' : (i.sev === 'medium' ? 'Дунд' : 'Бага')}</span>` : ''}
        </div>`;
      };
      const LIM = 10;
      iBox.innerHTML = `<div class="rs-issues" id="dashIssues">${issues.slice(0, LIM).map(row).join('')}</div>`
        + (issues.length > LIM ? `<div class="rs-more"><button type="button" class="btn btn-soft btn-sm" id="dashMoreIssues">Бүгдийг харах (${issues.length})</button></div>` : '');
      const mb = UI.$('#dashMoreIssues');
      if(mb) mb.onclick = () => { UI.$('#dashIssues').innerHTML = issues.map(row).join(''); mb.remove(); };
    }
  }

  function renderStatusRow(){
    const submitted = CONFIG.reportTypes.filter(t => dailyMap[t.key]).length;
    const total = CONFIG.reportTypes.length;
    // Олон өдрийн хугацаанд ирцийг «ирсэн тайлан / байх ёстой тайлан»-аар үзүүлнэ
    const multi = dashSpan > 1;
    const gotAll = CONFIG.reportTypes.reduce((a,t) => a + ((dailyMap[t.key] || {})._count || 0), 0);
    const expAll = dashSpan * total;
    const sub = UI.$('#statusSub');
    if(sub) sub.textContent = multi
      ? `${dashSpan} хоногт ${gotAll}/${expAll} тайлан · ${periodDays} өдөр бүртгэгдсэн`
      : '';

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

  /* ---------------- Асуудлын нэгтгэл ----------------
     Хэлтэс бүрийн тайлангийн issue_text-ийг цуглуулж, ноцтой байдлаар нь
     эрэмбэлэн, хэлтсийн өнгө/icon-оор ялгаж нэг картад харуулна.
     Энэ ажлыг одоо KpiCards модуль гүйцэтгэдэг — SEV_LABEL мөн тийшээ шилжсэн. */

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
      // Асуудлын талбарууд хоосон бол дэлгэрэнгүйд харуулахгүй (нэгтгэсэн картад аль хэдийн харагдана)
      const hasIssue = String((r.data && r.data.issue_text) || '').trim() !== '';
      const fields = (CONFIG.forms[key] || []).filter(f => f.type !== 'sep' && (f.group !== 'issue' || hasIssue));
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
      ${d.note ? `<p class="muted" style="margin:12px 2px 0;font-size:13px">Тайлбар: ${UI.esc(d.note)}</p>` : ''}
      ${d.issue_text ? `<p class="detail-issue">Асуудал: ${UI.esc(d.issue_text)}</p>` : ''}`;
  }

  /** Тээврийн дэлгэрэнгүй: donut + зориулалтын нийлбэр + машин бүрийн рейс/тонн */
  function transportDetailHtml(d){
    const n = CONFIG.num;
    const donut = UI.donutHtml([
      {label:'Шлам', value:n(d.sludge_ton), color:'#3B2FE0', icon:UI.MAT_ICONS.sludge},
      {label:'Хаягдал', value:n(d.waste_ton), color:'#9BA3A9', icon:UI.MAT_ICONS.waste},
      {label:'Бүтээгдэхүүн', value:n(d.product_transport_ton)+n(d.short_waste_ton), color:'#FF9500', icon:UI.MAT_ICONS.product}
    ], UI.fmt(n(d.sludge_ton)+n(d.waste_ton)+n(d.short_waste_ton)+n(d.product_transport_ton)),
       '', {unit:'тн'});
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
        <span>Хаягдал: <b>${UI.fmt(n(d.waste_ton))} тн</b></span>
        <span>Бүтээгдэхүүн: <b>${UI.fmt(n(d.product_transport_ton)+n(d.short_waste_ton))} тн / ${UI.fmt(n(d.product_transport_trips)+n(d.short_waste_trips))} рейс</b> <small>(богино ${UI.fmt(n(d.short_waste_ton))} тн)</small></span>
        <span>Пүү: <b>${UI.fmt(n(d.weighbridge_net_ton))} тн / ${UI.fmt(n(d.weighbridge_trips))} рейс</b></span>
      </div>
      ${donutBlock}
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Машин</th><th>Зориулалт</th><th>Рейс</th><th>Тонн</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Машины мөр байхгүй</td></tr>'}</tbody>
      </table></div>
      ${d.note ? `<p class="muted" style="margin:12px 2px 0;font-size:13px">Тайлбар: ${UI.esc(d.note)}</p>` : ''}
      ${d.issue_text ? `<p class="detail-issue">Асуудал: ${UI.esc(d.issue_text)}</p>` : ''}`;
  }

  async function loadMonthly(month){
    const box = UI.$('#monthlyCards');
    const planArea = UI.$('#planArea');
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    if(planArea) planArea.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const res = await API.monthly(month);
      const byType = {};
      (res.reports || []).forEach(r => { (byType[r.report_type] = byType[r.report_type] || []).push(r); });
      const sum = (key, field) => (byType[key]||[]).reduce((a,r) => a + CONFIG.num(r.data[field]), 0);
      const count = key => (byType[key]||[]).length;
      const openIssues = (byType['issue']||[]).filter(r => r.data.status === 'open').length;
      // Асуудлыг бүх хэлтсийн тайлангаас нэгтгэж тоолно (зөвхөн Асуудлын модулиас биш)
      const monthIssues = (res.reports || []).filter(r => String((r.data && r.data.issue_text) || '').trim() !== '').length;

      const fuelIncome = (byType['fuel']||[]).reduce((a,r)=>a+CONFIG.num(r.data.fuel_income_liter!=null?r.data.fuel_income_liter:r.data.fuel_truck_income_liter),0);

      // Өдөр тутмын цуваа: харагдах өдрийн тоо = энэ сар бол өнөөдрийн өдөр, өнгөрсөн сар бол сарын бүтэн өдрүүд
      const [my, mm] = month.split('-').map(Number);
      const dim = new Date(my, mm, 0).getDate();
      const nowD = new Date();
      const ND = (my === nowD.getFullYear() && mm === nowD.getMonth() + 1) ? nowD.getDate() : dim;
      const mkSer = () => Array(ND).fill(0);
      const ser = {inc:mkSer(), prod:mkSer(), trans:mkSer(), exp:mkSer(), hse:mkSer(),
                   sludge:mkSer(), strips:mkSer(), ptrips:mkSer()};
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
          ser.sludge[i] += CONFIG.num(d.sludge_ton);
          ser.strips[i] += CONFIG.num(d.sludge_trips);
          ser.ptrips[i] += CONFIG.num(d.product_transport_trips);
        }
        if(r.report_type === 'hse') ser.hse[i] += CONFIG.num(d.hse_violation_count) + CONFIG.num(d.medical_assistance_count);
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

      // Төлөвлөгөө татах — сэдэвчилсэн блокуудад цагирагаар харуулна
      try{ currentPlan = (await API.plan(month)).plan || {}; }catch(e){ currentPlan = {}; }

      const fuelExpense = (byType['fuel']||[]).reduce((a,r)=>a+(r.data.fuel_expense_liter!=null?CONFIG.num(r.data.fuel_expense_liter):CONFIG.num(r.data.fuel_truck_machine_liter)+CONFIG.num(r.data.fuel_truck_plant_liter)+CONFIG.num(r.data.reserve_tank_expense_liter)),0);
      const prodTon = sum('production','shift_day_product_ton') + sum('production','shift_night_product_ton');
      const transTotal = sum('transport','sludge_ton')+sum('transport','waste_ton')+sum('transport','short_waste_ton')+sum('transport','product_transport_ton');
      const sludgeTon = sum('transport','sludge_ton');
      const sludgeTrips = sum('transport','sludge_trips');
      const prodTrips = sum('transport','product_transport_trips');
      const weigh = sum('transport','weighbridge_net_ton');
      const hseV = sum('hse','hse_violation_count'), hseM = sum('hse','medical_assistance_count');

      const elapsed = monthElapsedFrac(month);
      const paceLeft = Math.round(elapsed * 100);
      const isAdmin = (SESSION.get() || {}).role === 'admin';
      const n = CONFIG.num;

      /* ---------- ХЭСЭГ 1: Сарын төлөвлөгөөний биелэлт ---------- */
      // Статус: сарын явцтай харьцуулсан зөрүүг текстээр (Түрүүлсэн +7% г.м.)
      const plStatus = (pct, planV) => {
        if(!(planV > 0)) return {tone:'mid', txt:'Төлөвлөгөө оруулаагүй'};
        if(elapsed <= 0) return {tone:'mid', txt:'Сар эхлээгүй'};
        const diff = pct - paceLeft;
        if(diff >= 0) return {tone:'good', txt:'Түрүүлсэн +' + diff + '%'};
        if(diff >= -20) return {tone:'mid', txt:'Ойролцоо ' + diff + '%'};
        return {tone:'low', txt:'Хоцорсон ' + diff + '%'};
      };
      const plCard = (title, act, planV, unit, veh, dailyArr, color) => {
        const pct = planV > 0 ? Math.round((act / planV) * 100) : 0;
        const s = plStatus(pct, planV);
        return `<div class="pl-card">
          <div class="pl-top"><span class="pl-name">${UI.esc(title)}</span><span class="pl-pct t-${s.tone}">${planV > 0 ? pct + '%' : '—'}</span></div>
          <div class="pl-nums"><b class="count" data-count="${act}">${UI.fmt(act)}</b><span>/ ${planV > 0 ? UI.fmt(planV) : '—'} ${unit}</span></div>
          <div class="pl-bar"><span class="pl-fill f-${s.tone}" style="width:${Math.min(pct, 100)}%"></span>${elapsed > 0 && elapsed < 1 ? `<span class="pl-pace" style="left:${paceLeft}%" title="Сарын явц ${paceLeft}%"></span>` : ''}</div>
          <div class="pl-foot"><span>Өнөөдрийн зорилт · <b>${planV > 0 ? UI.fmt(Math.round(planV * elapsed)) : '—'}</b> ${unit}</span><span class="pl-status s-${s.tone}">${s.txt}</span></div>
          ${dailyArr ? colsHtml(dailyArr, color) : ''}
          ${veh ? `<div class="pl-note">Ажиллаж буй: ${UI.fmt(veh)} машин</div>` : ''}
        </div>`;
      };

      if(planArea){
        planArea.innerHTML = `
          <div class="pl-toolbar">
            <div class="lg-chips">
              <span class="lg-chip lg-good">● Түрүүлсэн</span>
              <span class="lg-chip lg-mid">● Ойролцоо</span>
              <span class="lg-chip lg-low">● Хоцорсон</span>
            </div>
            <div class="pl-tools">
              <span class="mp-pill">Сарын явц <span class="mp-track"><span class="mp-fill" style="width:${paceLeft}%"></span></span> <b>${paceLeft}%</b></span>
              ${isAdmin ? '<button id="editPlanBtn" class="btn btn-soft">Төлөвлөгөө засах</button>' : ''}
            </div>
          </div>
          <div id="planEditorBox" class="hidden"></div>
          <div class="pl-grid">
            ${plCard('Бүтээгдэхүүн үйлдвэрлэлт', prodTon, n(currentPlan.production_ton), 'тн', 0, ser.prod, 'var(--c-production)')}
            ${plCard('Хаягдал', sludgeTon, n(currentPlan.sludge_ton), 'тн', 0, ser.sludge, 'var(--c-fuel)')}
            ${plCard('Шлам', sludgeTrips, n(currentPlan.sludge_trips), 'рейс', n(currentPlan.sludge_vehicles), ser.strips, 'var(--c-equipment)')}
            ${plCard('Бүтээгдэхүүн', prodTrips, n(currentPlan.product_transport_trips), 'рейс', n(currentPlan.product_transport_vehicles), ser.ptrips, 'var(--c-transport)')}
          </div>`;
        UI.animateCounts(planArea);
        if(isAdmin){ const b = UI.$('#editPlanBtn'); if(b) b.onclick = () => renderPlanEditor(month); }
      }

      /* ---------- ХЭСЭГ 2: Сарын нэгтгэл (төлөвлөгөөнд ороогүй үзүүлэлтүүд) ---------- */
      const statItem = (title, valTxt, unit, dailyArr, color, subTxt) => `<div class="g-item g-stat"><div class="g-info">
        <div class="g-name">${UI.esc(title)}</div>
        <div class="g-nums"><b>${valTxt}</b><span class="plan-target">${unit}</span></div>
        ${dailyArr ? colsHtml(dailyArr, color) : ''}
        ${subTxt ? `<div class="plan-foot">${UI.esc(subTxt)}</div>` : ''}
      </div></div>`;
      const typeIcon = k => { const t = CONFIG.reportTypes.find(x => x.key === k); return t ? `<span class="mchip" style="background:${t.color}">${t.icon}</span>` : ''; };

      box.innerHTML = `
        <div class="theme-grid theme-grid-3">
          <div class="theme-block">
            <div class="tb-head">${typeIcon('fuel')}<b>Түлш</b></div>
            ${statItem('Орлого нийт', UI.fmt(fuelIncome), 'л', ser.inc, 'var(--green)')}
            ${statItem('Зарлага нийт', UI.fmt(fuelExpense), 'л', ser.exp, 'var(--brand)', count('fuel') + ' өдрийн тайлан')}
          </div>
          <div class="theme-block">
            <div class="tb-head">${typeIcon('transport')}<b>Тээвэр</b></div>
            ${statItem('Тээвэр нийт', UI.fmt(transTotal), 'тн', ser.trans, 'var(--c-transport)', count('transport') + ' өдрийн тайлан')}
            ${statItem('Пүүний нийт жин (ER-ээс ирсэн шлам)', UI.fmt(weigh), 'тн', null, null, 'пүүний хэмжилтээр')}
          </div>
          <div class="theme-block">
            <div class="tb-head">${typeIcon('hse')}<b>ХАБЭА ба Асуудал</b></div>
            <div class="kpi-chips" style="margin-top:2px">
              <span class="kpi-chip ${hseV ? 'bad' : 'ok'}">Зөрчил ${UI.fmt(hseV)}</span>
              <span class="kpi-chip ${hseM ? 'mid' : 'ok'}">Эмнэлэг ${UI.fmt(hseM)}</span>
              <span class="kpi-chip ${monthIssues ? 'bad' : 'ok'}">Асуудал ${monthIssues}</span>
            </div>
            ${colsHtml(ser.hse, 'var(--c-transport)')}
            <div class="plan-foot tb-foot">${count('hse')} ХАБ · ${openIssues} нээлттэй асуудал</div>
          </div>
        </div>`;
      UI.animateCounts(box);

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
    {key:'sludge_ton', label:'Хаягдал', unit:'тн'},
    {key:'product_transport_trips', label:'Бүтээгдэхүүн', unit:'рейс', vehiclesKey:'product_transport_vehicles'},
    {key:'sludge_trips', label:'Шлам', unit:'рейс', vehiclesKey:'sludge_vehicles'}
  ];
  let currentPlan = {};

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

  /** Төлөвлөгөө засах — биелэлтийн хэсгийн дээр нээгддэг form */
  function renderPlanEditor(month){
    const box = UI.$('#planEditorBox');
    if(!box) return;
    box.classList.remove('hidden');
    box.innerHTML = `<div class="user-form">` + PLAN_METRICS.map(m => `<div class="user-form-row">
      <label>${UI.esc(m.label)} (${m.unit})</label>
      <input type="number" step="any" min="0" data-key="${m.key}" value="${currentPlan[m.key] ?? ''}" placeholder="Төлөвлөгөө оруулах">
    </div>` + (m.vehiclesKey ? `<div class="user-form-row">
      <label>${UI.esc(m.label)} — машины тоо</label>
      <input type="number" step="1" min="0" data-key="${m.vehiclesKey}" value="${currentPlan[m.vehiclesKey] ?? ''}" placeholder="машин">
    </div>` : '')).join('') +
    `<div class="form-actions"><button type="button" class="btn btn-soft" id="cancelPlanBtn">Болих</button><button type="button" class="btn btn-primary" id="savePlanBtn">Хадгалах</button></div></div>`;
    box.scrollIntoView({behavior:'smooth', block:'center'});

    UI.$('#cancelPlanBtn').onclick = () => { box.innerHTML = ''; box.classList.add('hidden'); };
    UI.$('#savePlanBtn').onclick = async () => {
      const plan = {};
      UI.$$('[data-key]', box).forEach(inp => { if(inp.value !== '') plan[inp.dataset.key] = parseFloat(inp.value); });
      try{
        await API.planSave(month, plan);
        currentPlan = plan;
        loadMonthly(month);
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

    // Өмчлөлийн бүлгүүдийн өнгө (статусын ногоон/улаантай андуурагдахгүй палитр)
    const GM = {
      own:            {label:'Өөрийн',                 color:'#3D4A63', bg:'rgba(61,74,99,.1)'},
      rental_product: {label:'Бүтээгдэхүүний түрээс',  color:'#D97A16', bg:'rgba(217,122,22,.12)'},
      rental_sludge:  {label:'Шламын түрээс',          color:'#1F8FA3', bg:'rgba(31,143,163,.12)'}
    };
    const gm = o => GM[o] || {label:'Бусад', color:'var(--ink-3)', bg:'rgba(60,60,80,.08)'};
    const initials = name => (String(name).replace(/[^A-Za-zА-ЯӨҮЁа-яөүё0-9]/g, '').slice(0, 2) || '•').toUpperCase();

    // Үр бүтээмж: түлш ба тонн хоёулаа бүртгэгдсэн машид л/тонн бодогдоно
    const effList = list.filter(a => a.liter > 0 && a.ton > 0).map(a => ({...a, eff: a.liter / a.ton}));
    const best = effList.length ? Math.min(...effList.map(e => e.eff)) : null;
    const worst = effList.length > 1 ? Math.max(...effList.map(e => e.eff)) : null;

    // Зүүн карт: л/тонн эрэмбэ (шилдэг нь дээрээ, ихдээ 10)
    const rankAll = effList.slice().sort((a,b) => a.eff - b.eff);
    const rank = rankAll.slice(0, 10);
    const rankMax = rankAll.length ? rankAll[rankAll.length - 1].eff * 1.08 : 1;
    const rankRows = rank.map(e => `<div class="eff-row">
      <div class="eff-row-top"><span class="eff-nm">${UI.esc(e.name)}${e.eff === best ? ' ★' : ''}</span><span class="eff-badge">${e.eff.toFixed(2)}</span></div>
      <div class="eff-track"><span class="eff-fill" style="width:${Math.max(e.eff / rankMax * 100, 3).toFixed(1)}%;background:${gm(e.ownership).color}"></span></div>
    </div>`).join('');
    const legend = CONFIG.OWNERSHIP_ORDER.map(o => {
      const g = gm(o.key);
      return `<span class="lg-chip" style="background:${g.bg};color:${g.color}">● ${g.label}</span>`;
    }).join('');

    // Баруун карт: машин бүр өмчлөлийн бүлгээрээ, шилдэг нь онцлогдоно
    const order = ['own', 'rental_product', 'rental_sludge'];
    const machRows = effList.slice()
      .sort((a,b) => (order.indexOf(a.ownership) - order.indexOf(b.ownership)) || (a.eff - b.eff))
      .map(e => {
        const g = gm(e.ownership);
        const effColor = e.eff === best ? '#2E9E52' : (e.eff === worst ? 'var(--warn)' : 'var(--ink)');
        return `<div class="mach-card${e.eff === best ? ' mach-best' : ''}">
          <div class="mach-ava" style="background:${g.color}">${UI.esc(initials(e.name))}</div>
          <div class="mach-info">
            <div class="mach-nm">${UI.esc(e.name)}
              <span class="mach-pill" style="background:${g.bg};color:${g.color}">${g.label}</span>
              ${e.eff === best ? '<span class="mach-pill mach-star">★ Шилдэг</span>' : ''}
            </div>
            <div class="mach-sub">${UI.fmt(e.liter)} л · ${UI.fmt(e.trips)} рейс · ${UI.fmt(e.ton)} тн</div>
          </div>
          <div class="mach-eff"><b style="color:${effColor}">${e.eff.toFixed(2)}</b><small>л/тонн</small></div>
        </div>`;
      }).join('');

    // Бүрэн хүснэгт (тонгүй туслах машинууд ч багтана)
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
      <div class="panel-head"><div><h3>Машин тус бүрийн үр бүтээмж</h3>
      <p>л/тонн — 1 тонн тутамд зарцуулсан түлш. Бага байх нь сайн.</p></div></div>
      ${effList.length ? `<div class="eff-grid">
        <div class="eff-card">
          <div class="eff-card-head"><b>Түлшний зарцуулалт</b><span class="eff-tag">л/тонн</span></div>
          <div class="eff-card-sub">Бага утга = өндөр үр бүтээмж${rankAll.length > 10 ? ' · шилдэг 10' : ''}</div>
          <div class="eff-rank">${rankRows}</div>
          <div class="lg-chips" style="margin-top:16px">${legend}</div>
        </div>
        <div class="eff-card">
          <div class="eff-card-head"><b>Машины жагсаалт</b><span class="eff-tag">${effList.length} машин</span></div>
          <div class="mach-list">${machRows}</div>
        </div>
      </div>` : ''}
      <div class="table-wrap" style="margin-top:14px"><table class="table">
        <thead><tr><th>Машин</th><th>Түлш / л</th><th>Рейс</th><th>Тонн</th><th>л/тонн</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>`;
  }

  setPeriod('day');   // эхэлж өдрийн харагдац
  // Сарын хэсгүүд ТҮР ХАСАГДСАН — DOM-д байгаа тохиолдолд л ачаална
  if(UI.$('#monthlyCards')) loadMonthly(UI.thisMonth());
};

/* ================================================================
   PAGE: ТАЙЛАН ОРУУЛАХ (report.html) — ажилтны form
   ================================================================ */
const PageReport = () => {
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }

  UI.$('#reportDate').value = UI.today();

  /* Машины жагсаалт. ЗААВАЛ энд (доор биш) зарлагдана — эхний selectReport()
     дуудлага үүнээс өмнө ажилладаг тул доор зарлавал зөвхөн Тээвэр/Түлш эрхтэй
     хэрэглэгчид «Cannot access 'VEHICLES' before initialization» гэж унана. */
  let VEHICLES = [];

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

  /* ---------------- Миний хийх ажил (хурлын даалгавар) ---------------- */
  async function loadMyTasks(){
    const panel = UI.$('#myTasksPanel');
    const box = UI.$('#myTasksList');
    if(!panel || !box) return;
    try{
      const res = await API.myTasks();
      renderMyTasks(res.tasks || []);
    }catch(e){ /* хурлын хүснэгт үүсээгүй бол чимээгүй өнгөрнө */ }
  }

  function renderMyTasks(tasks){
    const panel = UI.$('#myTasksPanel');
    const box = UI.$('#myTasksList');
    const open = tasks.filter(t => t.status !== 'done');
    if(!tasks.length){ panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    const today = UI.today();
    box.innerHTML = tasks.map(t => {
      const late = t.status !== 'done' && t.due_date && t.due_date < today;
      const statusOpts = Object.keys(TASK_STATUS_LABELS).map(k =>
        `<option value="${k}" ${t.status === k ? 'selected' : ''}>${TASK_STATUS_LABELS[k]}</option>`).join('');
      return `<div class="mytask ${t.status === 'done' ? 'mytask-done' : ''}" data-id="${t.id}">
        <div class="mytask-top">
          <span class="task-status ${TASK_STATUS_TONE[t.status] || ''}">${TASK_STATUS_LABELS[t.status] || t.status}</span>
          <span class="mytask-txt">${UI.esc(t.task_text)}</span>
          ${t.due_date ? `<span class="mytask-due ${late ? 'mytask-late' : ''}">${late ? '⚠ ' : ''}${t.due_date}</span>` : ''}
        </div>
        <div class="mytask-ctl">
          <select class="mt-status">${statusOpts}</select>
          <input class="mt-note" type="text" maxlength="200" placeholder="Тайлбар (жишээ: сэлбэг ирээгүй)" value="${UI.esc(t.worker_note || '')}">
          <button type="button" class="btn btn-soft btn-sm mt-save">Хадгалах</button>
        </div>
      </div>`;
    }).join('') + `<div class="plan-foot" style="margin-top:10px">Нийт ${tasks.length} даалгавар · ${open.length} хийгдээгүй</div>`;

    UI.$$('.mt-save', box).forEach(btn => btn.onclick = async () => {
      const row = btn.closest('.mytask');
      const id = row.dataset.id;
      const status = row.querySelector('.mt-status').value;
      const note = row.querySelector('.mt-note').value;
      btn.disabled = true;
      try{
        const res = await API.taskStatus(id, status, note);
        renderMyTasks(res.tasks || []);
        UI.alertBox(UI.$('#myTasksMessage'), 'Даалгаврын төлөв шинэчлэгдлээ.', true);
      }catch(err){ UI.alertBox(UI.$('#myTasksMessage'), err.message); }
      finally{ btn.disabled = false; }
    });
  }
  loadMyTasks();

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

  /* ---------------- Машины бүртгэл (registry) ----------------
     VEHICLES-ийг PageReport-ын эхэнд зарласан (дээрх тайлбарыг үз). */
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

    // Тайлбар ба асуудлын талбарууд машины хүснэгтийн ард, төгсгөлд байрлана
    const isTail = f => f.name === 'note' || f.group === 'issue';
    form.innerHTML =
      fields.filter(f => !isTail(f)).map(renderField).join('') +
      `<div class="full">
        <label class="block-label">Машин тус бүрийн олголт (олгосон / мото цаг / машинд үлдсэн, литрээр)</label>
        <div class="own-cols">${columns}</div>
      </div>
      <div class="full fuel-summary" id="fuelSummary"></div>` +
      fields.filter(isTail).map(renderField).join('') +
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
      <span>Хаягдал: <b>${UI.fmt(t.waste_ton)} тн</b></span>
      <span>Богино: <b>${UI.fmt(t.short_waste_ton)} тн</b></span>
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
    // Бүлгийн тусгаарлагч — талбар биш, зөвхөн гарчиг
    if(f.type === 'sep') return `<div class="full form-sep"><span>${UI.esc(f.label)}</span>${f.hint ? `<small>${UI.esc(f.hint)}</small>` : ''}</div>`;
    const cls = (f.full ? 'field full' : 'field') + (f.group ? ' field-' + f.group : '');
    if(f.type === 'textarea') return `<div class="${cls}"><label>${UI.esc(f.label)}</label><textarea name="${f.name}" placeholder="${UI.esc(f.placeholder || 'Тайлбар')}"></textarea></div>`;
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
   PAGE: ADMIN — хэрэглэгчийн удирдлага
   (нэмэх, нэр солих, нууц үг солих, идэвхгүй болгох)
   ================================================================ */
const PageAdmin = () => {
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }
  if(session.role !== 'admin'){ location.href = 'dashboard.html'; return; }

  const box = UI.$('#userList');
  const msg = UI.$('#adminMessage');
  const addBox = UI.$('#userAddBox');
  const addBtn = UI.$('#userAddBtn');
  if(!box) return;

  const ROLE_LABELS = {admin:'Админ', worker:'Ажилтан', viewer:'Захирал / үзэгч'};
  let USERS = [];

  const permName = k => { const t = CONFIG.reportTypes.find(r => r.key === k); return t ? t.name : k; };
  const kickIfExpired = err => {
    if(/нэвтрэлт хүчингүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return true; }
    return false;
  };

  async function load(){
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const res = await API.users();
      USERS = res.users || [];
      render();
    }catch(err){ box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`; }
  }

  /* ---------- Шинэ хэрэглэгч нэмэх form ---------- */
  function renderAddForm(){
    if(!addBox) return;
    addBox.innerHTML = `<div class="user-form">
      <div class="user-form-row">
        <label>Нэвтрэх нэр <small>(латин, 3-20)</small></label>
        <input id="uNewUsername" type="text" maxlength="20" placeholder="жишээ: teever2" autocomplete="off">
      </div>
      <div class="user-form-row">
        <label>Ажилтны нэр</label>
        <input id="uNewName" type="text" maxlength="60" placeholder="жишээ: Тээвэр Ууганбаяр">
      </div>
      <div class="user-form-row">
        <label>Нууц үг <small>(4-20 тэмдэгт)</small></label>
        <input id="uNewPw" type="password" maxlength="20" placeholder="Нууц үг" autocomplete="new-password">
      </div>
      <div class="user-form-row user-form-perms">
        <label>Ямар тайлан оруулах вэ?</label>
        <div class="perm-chips">${CONFIG.reportTypes.map(t =>
          `<label class="perm-chip"><input type="checkbox" value="${t.key}"><span>${UI.esc(t.name)}</span></label>`
        ).join('')}</div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-soft" id="uNewCancel">Болих</button>
        <button type="button" class="btn btn-primary" id="uNewSave">Бүртгэх</button>
      </div>
    </div>`;
    addBox.classList.remove('hidden');
    UI.$('#uNewCancel').onclick = () => { addBox.innerHTML = ''; addBox.classList.add('hidden'); };
    UI.$('#uNewSave').onclick = async () => {
      const username = UI.$('#uNewUsername').value.trim();
      const name = UI.$('#uNewName').value.trim();
      const pw = UI.$('#uNewPw').value.trim();
      const perms = UI.$$('.perm-chips input:checked', addBox).map(i => i.value);
      if(!/^[a-zA-Z0-9_.-]{3,20}$/.test(username)){ UI.alertBox(msg, 'Нэвтрэх нэр 3-20 тэмдэгт: латин үсэг, тоо, _ . - байна.'); return; }
      if(!name){ UI.alertBox(msg, 'Ажилтны нэрийг оруулна уу (жишээ: Тээвэр Ууганбаяр).'); return; }
      if(!/^\S{4,20}$/.test(pw)){ UI.alertBox(msg, 'Нууц үг 4-20 тэмдэгт байх ёстой (хоосон зайгүй).'); return; }
      if(!perms.length){ UI.alertBox(msg, 'Дор хаяж нэг тайлангийн эрх сонгоно уу.'); return; }
      try{
        const res = await API.userCreate(username, name, pw, perms);
        USERS = res.users || USERS;
        addBox.innerHTML = ''; addBox.classList.add('hidden');
        render();
        UI.alertBox(msg, `«${username}» хэрэглэгч амжилттай бүртгэгдлээ.`, true);
      }catch(err){ if(!kickIfExpired(err)) UI.alertBox(msg, err.message); }
    };
  }
  if(addBtn) addBtn.onclick = () => renderAddForm();

  /* ---------- Хэрэглэгчийн хүснэгт ---------- */
  function render(){
    box.innerHTML = `<div class="table-wrap"><table class="table">
      <thead><tr><th>Нэвтрэх нэр</th><th>Ажилтны нэр</th><th>Эрх</th><th>Төлөв</th><th class="right">Үйлдэл</th></tr></thead>
      <tbody>` + USERS.map(u => {
        const permsTxt = u.role === 'admin' ? 'Бүх эрх' :
          (u.permissions && u.permissions.length ? u.permissions.map(permName).join(', ') : '—');
        return `<tr data-uid="${u.id}" class="${u.active ? '' : 'user-inactive'}">
        <td><b>${UI.esc(u.username)}</b></td>
        <td>${UI.esc(u.name || '—')}</td>
        <td>${UI.esc(ROLE_LABELS[u.role] || u.role)} · ${UI.esc(permsTxt)}</td>
        <td>${u.active ? '<span class="pin-badge pin-on">Идэвхтэй</span>' : '<span class="pin-badge pin-off">Идэвхгүй</span>'}</td>
        <td class="right">
          <span class="pw-edit hidden">
            <input class="pw-input" type="password" maxlength="20" placeholder="Шинэ нууц үг" autocomplete="new-password">
            <button type="button" class="btn btn-primary btn-sm pw-save">Хадгалах</button>
            <button type="button" class="btn btn-soft btn-sm pw-cancel">Болих</button>
          </span>
          <span class="rn-edit hidden">
            <input class="rn-user" type="text" maxlength="20" placeholder="Нэвтрэх нэр" value="${UI.esc(u.username)}">
            <input class="rn-name" type="text" maxlength="60" placeholder="Ажилтны нэр" value="${UI.esc(u.name || '')}">
            <button type="button" class="btn btn-primary btn-sm rn-save">Хадгалах</button>
            <button type="button" class="btn btn-soft btn-sm rn-cancel">Болих</button>
          </span>
          <span class="row-actions">
            <button type="button" class="btn btn-soft btn-sm rn-toggle">Нэр солих</button>
            <button type="button" class="btn btn-soft btn-sm pw-toggle">Нууц үг</button>
            ${u.username === session.username ? '' :
              `<button type="button" class="btn btn-soft btn-sm act-toggle">${u.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>`}
          </span>
        </td>
      </tr>`; }).join('') + `</tbody></table></div>`;

    UI.$$('.pw-toggle', box).forEach(btn => btn.onclick = () => {
      const tr = btn.closest('tr');
      tr.querySelector('.row-actions').classList.add('hidden');
      tr.querySelector('.pw-edit').classList.remove('hidden');
      tr.querySelector('.pw-input').focus();
    });
    UI.$$('.rn-toggle', box).forEach(btn => btn.onclick = () => {
      const tr = btn.closest('tr');
      tr.querySelector('.row-actions').classList.add('hidden');
      tr.querySelector('.rn-edit').classList.remove('hidden');
      tr.querySelector('.rn-user').focus();
    });
    UI.$$('.pw-cancel, .rn-cancel', box).forEach(btn => btn.onclick = () => render());
    UI.$$('.pw-save', box).forEach(btn => btn.onclick = () => savePw(btn));
    UI.$$('.rn-save', box).forEach(btn => btn.onclick = () => saveRename(btn));
    UI.$$('.act-toggle', box).forEach(btn => btn.onclick = () => toggleActive(btn));
    UI.$$('.pw-input', box).forEach(inp => inp.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); savePw(inp); }
    }));
  }

  async function savePw(el){
    const tr = el.closest('tr');
    const uid = tr.dataset.uid;
    const pw = tr.querySelector('.pw-input').value.trim();
    if(!/^\S{4,20}$/.test(pw)){ UI.alertBox(msg, 'Нууц үг 4-20 тэмдэгт байх ёстой (хоосон зайгүй).'); return; }
    const target = USERS.find(u => String(u.id) === String(uid));
    if(!confirm(`«${target ? target.username : uid}» хэрэглэгчийн нууц үгийг солих уу?`)) return;
    try{
      const res = await API.userSetPin(uid, pw);
      USERS = res.users || USERS;
      if(target && target.username === session.username){
        alert('Та өөрийн нууц үгээ сольсон тул шинэ нууц үгээрээ дахин нэвтэрнэ үү.');
        SESSION.clear(); location.href = 'index.html'; return;
      }
      render();
      UI.alertBox(msg, `«${target ? target.username : ''}» хэрэглэгчийн нууц үг солигдлоо.`, true);
    }catch(err){ if(!kickIfExpired(err)) UI.alertBox(msg, err.message); }
  }

  async function saveRename(el){
    const tr = el.closest('tr');
    const uid = tr.dataset.uid;
    const newUser = tr.querySelector('.rn-user').value.trim();
    const newName = tr.querySelector('.rn-name').value.trim();
    if(!/^[a-zA-Z0-9_.-]{3,20}$/.test(newUser)){ UI.alertBox(msg, 'Нэвтрэх нэр 3-20 тэмдэгт: латин үсэг, тоо, _ . - байна.'); return; }
    const target = USERS.find(u => String(u.id) === String(uid));
    const isSelf = target && target.username === session.username;
    if(!confirm(`«${target ? target.username : uid}» → «${newUser}» болгож солих уу?${isSelf ? '' : ' (Тухайн ажилтан шинэ нэрээрээ дахин нэвтэрнэ.)'}`)) return;
    try{
      const res = await API.userRename(uid, newUser, newName);
      USERS = res.users || USERS;
      if(isSelf){
        // Өөрийн нэвтрэх нэр өөрчлөгдсөн — session-ий username-ийг шинэчилнэ
        session.username = newUser;
        if(newName) session.name = newName;
        SESSION.save(session, !!localStorage.getItem('grd_session'));
        UI.paintUserChrome();
      }
      render();
      UI.alertBox(msg, `Нэвтрэх нэр «${newUser}» болж солигдлоо.`, true);
    }catch(err){ if(!kickIfExpired(err)) UI.alertBox(msg, err.message); }
  }

  async function toggleActive(el){
    const tr = el.closest('tr');
    const uid = tr.dataset.uid;
    const target = USERS.find(u => String(u.id) === String(uid));
    if(!target) return;
    const q = target.active
      ? `«${target.username}» (${target.name || ''}) хэрэглэгчийг идэвхгүй болгох уу? Нэвтрэх боломжгүй болно, түүх хадгалагдана.`
      : `«${target.username}» хэрэглэгчийг идэвхжүүлэх үү?`;
    if(!confirm(q)) return;
    try{
      const res = await API.userToggle(uid);
      USERS = res.users || USERS;
      render();
      UI.alertBox(msg, `«${target.username}» ${target.active ? 'идэвхгүй боллоо' : 'идэвхжлээ'}.`, true);
    }catch(err){ if(!kickIfExpired(err)) UI.alertBox(msg, err.message); }
  }

  load();
};

/* ================================================================
   PAGE: ХУРЛЫН ТЭМДЭГЛЭЛ (meeting.html)
   Гүйцэтгэл (чөлөөт хугацаа) + өмнөх даалгавар + энэ хурлын
   даалгавар + тэмдэглэл. Бүх нэвтэрсэн хүн үзнэ, админ засна.
   ================================================================ */
const TASK_STATUS_LABELS = {open:'Хийгдэж байна', done:'Биелсэн', postponed:'Хойшилсон'};
const TASK_STATUS_TONE = {open:'st-open', done:'st-done', postponed:'st-post'};

/** Даалгаврын огнооны хос: эхэлсэн (хурлын огноо) ба дуусах (эцсийн хугацаа).
    Хугацаа хэтэрсэн, дуусаагүй бол улаанаар анхааруулна. */
function dateChips(t, meetingDate){
  const md = meetingDate || t.meeting_date || '';
  const today = new Date().toISOString().slice(0, 10);
  const late = t.status !== 'done' && t.due_date && t.due_date < today;
  return (md ? `<span class="tdate">Эхэлсэн <b>${md}</b></span>` : '')
    + (t.due_date
        ? `<span class="tdate ${late ? 'tdate-late' : ''}">${late ? '⚠ ' : ''}Дуусах <b>${t.due_date}</b></span>`
        : `<span class="tdate">Дуусах <b>—</b></span>`);
}

const PageMeeting = () => {
  const dateInput = UI.$('#meetingDate');
  if(!dateInput) return;                    // энэ хуудсанд хурлын хэсэг байхгүй
  UI.paintUserChrome();
  const session = SESSION.get();
  if(!session){ location.href = 'index.html'; return; }
  const isAdmin = session.role === 'admin';
  const msg = UI.$('#meetingMessage');
  let USERS = [];      // хариуцагчийн сонголт
  let TASKS = [];      // энэ хурлын даалгавар (client талд засагдана)
  let NOTES = '';

  /** Хамгийн сүүлийн Даваа гараг (өнөөдөр Даваа бол өнөөдөр) */
  function lastMonday(){
    const d = new Date();
    const shift = (d.getDay() + 6) % 7; // Дав=0 ... Ням=6
    d.setDate(d.getDate() - shift);
    return d.toISOString().slice(0, 10);
  }

  dateInput.value = lastMonday();

  /* ---------------- Гүйцэтгэл: самбартай ижил KPI картууд ----------------
     Хурлын огноо = төгсгөл, preset = буцах цонх. */
  let mKind = 'week', mFrom = '', mTo = '';
  function mCompute(){
    const anchor = dateInput.value || UI.today();
    mTo = RangeReport.addDays(anchor, -1);          // хурлын өмнөх өдөр хүртэл
    const d = new Date(mTo + 'T00:00:00');
    if(mKind === 'week') mFrom = RangeReport.addDays(mTo, -6);
    else if(mKind === 'month') mFrom = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
    else { const q = new Date(d); q.setMonth(q.getMonth() - 3); q.setDate(q.getDate() + 1); mFrom = q.toISOString().slice(0,10); }
  }
  async function loadKpi(){
    const box = UI.$('#summaryCards');
    if(!box) return;
    mCompute();
    const span = RangeReport.daysBetween(mFrom, mTo) + 1;
    UI.$$('.preset-btn').forEach(b => b.classList.toggle('preset-on', b.dataset.preset === mKind));
    const info = UI.$('#heroRangeInfo'); if(info) info.textContent = `${mFrom} — ${mTo}`;
    const sub = UI.$('#kpiSub');
    if(sub) sub.textContent = `${mFrom} — ${mTo} · ${span} хоног. Машин, хүн хүч = өдрийн дундаж.`;
    box.innerHTML = '<div class="module-empty">Ачаалж байна…</div>';
    try{
      const pTo = RangeReport.addDays(mFrom, -1), pFrom = RangeReport.addDays(mFrom, -span);
      const [cur, prev, planRes] = await Promise.all([
        API.range(mFrom, mTo),
        API.range(pFrom, pTo).catch(() => ({reports: []})),
        API.plan(mTo.slice(0,7)).catch(() => ({plan: {}}))
      ]);
      KpiCards.render(box, Aggregate.byType(cur.reports), Aggregate.byType(prev.reports),
                      {plan: planRes.plan || {}, date: mTo, span});
      renderMeetingExtras(cur, span);
    }catch(err){ box.innerHTML = `<div class="module-empty">${UI.esc(err.message)}</div>`; }
  }
  UI.$$('.preset-btn').forEach(b => b.onclick = () => { mKind = b.dataset.preset; loadKpi(); });

  /** Асуудлын жагсаалт + хугацааны бүх даалгавар */
  function renderMeetingExtras(cur, span){
    const iPanel = UI.$('#issuesPanel'), iBox = UI.$('#periodIssues');
    if(iPanel && iBox){
      const issues = [];
      (cur.reports || []).forEach(r => {
        const d = r.data || {};
        if(d.issue_text) issues.push({date:r.date, text:d.issue_text, type:r.report_type,
                                      sev:d.issue_severity || d.severity || ''});
      });
      issues.sort((a,b) => b.date.localeCompare(a.date));
      if(!issues.length) iPanel.classList.add('hidden');
      else {
        iPanel.classList.remove('hidden');
        const s = UI.$('#issuesSub'); if(s) s.textContent = `${mFrom} — ${mTo} · нийт ${issues.length}`;
        const row = i => {
          const t = CONFIG.reportTypes.find(x => x.key === i.type);
          const tone = i.sev === 'high' ? 'st-post' : (i.sev === 'medium' ? 'st-open' : '');
          return `<div class="rs-issue">
            <span class="rs-issue-dot" style="background:${t ? t.color : 'var(--ink-3)'}"></span>
            <span class="rs-issue-day">${i.date.slice(5).replace('-','/')}</span>
            <span class="rs-issue-dep">${t ? UI.esc(t.name) : ''}</span>
            <span class="rs-issue-txt">${UI.esc(i.text)}</span>
            ${i.sev ? `<span class="task-status ${tone}">${i.sev === 'high' ? 'Өндөр' : (i.sev === 'medium' ? 'Дунд' : 'Бага')}</span>` : ''}
          </div>`;
        };
        const LIM = 10;
        iBox.innerHTML = `<div class="rs-issues" id="mIssues">${issues.slice(0,LIM).map(row).join('')}</div>`
          + (issues.length > LIM ? `<div class="rs-more"><button type="button" class="btn btn-soft btn-sm" id="mMoreIssues">Бүгдийг харах (${issues.length})</button></div>` : '');
        const mb = UI.$('#mMoreIssues');
        if(mb) mb.onclick = () => { UI.$('#mIssues').innerHTML = issues.map(row).join(''); mb.remove(); };
      }
    }

    const tPanel = UI.$('#tasksPanel'), tBox = UI.$('#periodTasks');
    if(tPanel && tBox){
      const tasks = cur.tasks || [];
      if(!tasks.length){ tPanel.classList.add('hidden'); return; }
      tPanel.classList.remove('hidden');
      const s = UI.$('#tasksSub'); if(s) s.textContent = `${mFrom} — ${mTo} · нийт ${tasks.length} даалгавар`;
      const today = UI.today();
      const isLate = t => t.status !== 'done' && t.due_date && t.due_date < today;
      const groups = {};
      tasks.forEach(t => { (groups[t.meeting_date] = groups[t.meeting_date] || []).push(t); });
      tBox.innerHTML = Object.keys(groups).sort().reverse().map(md => {
        const rows = groups[md].map(t => `<div class="task-view">
          <span class="task-status ${TASK_STATUS_TONE[t.status] || ''}">${TASK_STATUS_LABELS[t.status] || t.status}</span>
          <div class="task-body">
            <div class="task-txt">${UI.esc(t.task_text)}</div>
            <div class="task-meta-row">
              <span class="task-who">${t.assignee_name ? UI.esc(t.assignee_name) : 'Хариуцагчгүй'}</span>
              <span class="tdates">${dateChips(t, md)}</span>
            </div>
            ${t.worker_note ? `<div class="task-note">${UI.esc(t.worker_note)}</div>` : ''}
          </div>
        </div>`).join('');
        return `<div class="tg"><div class="tg-head">${md} хурал <span>${groups[md].length}</span></div>${rows}</div>`;
      }).join('');
    }
  }


  /* ---------------- Даалгаврын хэсэг ---------------- */
  function taskRowHtml(t, idx){
    const opts = ['<option value="">— хариуцагч —</option>'].concat(
      USERS.filter(u => u.active).map(u =>
        `<option value="${u.id}" ${String(t.assignee_id) === String(u.id) ? 'selected' : ''}>${UI.esc(u.name || u.username)}</option>`)
    ).join('');
    const statusOpts = Object.keys(TASK_STATUS_LABELS).map(k =>
      `<option value="${k}" ${t.status === k ? 'selected' : ''}>${TASK_STATUS_LABELS[k]}</option>`).join('');
    return `<div class="task-row" data-idx="${idx}" data-id="${t.id || ''}">
      <textarea class="t-text" rows="2" placeholder="Хийгдэх ажил">${UI.esc(t.task_text || '')}</textarea>
      <select class="t-assignee">${opts}</select>
      <input class="t-due" type="date" value="${t.due_date || ''}">
      <select class="t-status">${statusOpts}</select>
      <button type="button" class="btn btn-soft btn-icon t-del" title="Устгах">✕</button>
      ${t.worker_note ? `<div class="task-note">Ажилтны тайлбар: ${UI.esc(t.worker_note)}</div>` : ''}
    </div>`;
  }

  function taskViewHtml(t, meetingDate){
    return `<div class="task-view">
      <span class="task-status ${TASK_STATUS_TONE[t.status] || ''}">${TASK_STATUS_LABELS[t.status] || t.status}</span>
      <div class="task-body">
        <div class="task-txt">${UI.esc(t.task_text)}</div>
        <div class="task-meta-row">
          <span class="task-who">${t.assignee_name ? UI.esc(t.assignee_name) : 'Хариуцагчгүй'}</span>
          <span class="tdates">${dateChips(t, meetingDate)}</span>
        </div>
        ${t.worker_note ? `<div class="task-note">${UI.esc(t.worker_note)}</div>` : ''}
      </div>
    </div>`;
  }

  function renderTasks(){
    const box = UI.$('#taskList');
    if(!TASKS.length){
      box.innerHTML = `<div class="module-empty">${isAdmin ? 'Ажил нэмээгүй байна. «+ Ажил нэмэх» дээр дарна уу.' : 'Даалгавар бүртгэгдээгүй байна.'}</div>`;
      return;
    }
    if(!isAdmin){ box.innerHTML = TASKS.map(t => taskViewHtml(t, dateInput.value)).join(''); return; }
    box.innerHTML = `<div class="task-head"><span>Хийгдэх ажил</span><span>Хариуцагч</span><span>Хугацаа</span><span>Төлөв</span><span></span></div>`
      + TASKS.map(taskRowHtml).join('');
    UI.$$('.t-del', box).forEach(btn => btn.onclick = () => {
      const idx = parseInt(btn.closest('.task-row').dataset.idx, 10);
      collectTasks();
      TASKS.splice(idx, 1);
      renderTasks();
    });
  }

  function collectTasks(){
    if(!isAdmin) return;
    UI.$$('#taskList .task-row').forEach(row => {
      const i = parseInt(row.dataset.idx, 10);
      if(!TASKS[i]) return;
      TASKS[i].task_text = row.querySelector('.t-text').value;
      TASKS[i].assignee_id = row.querySelector('.t-assignee').value || null;
      TASKS[i].due_date = row.querySelector('.t-due').value || null;
      TASKS[i].status = row.querySelector('.t-status').value;
    });
  }

  function renderNotes(){
    const box = UI.$('#notesBox');
    if(isAdmin){
      box.innerHTML = `<textarea id="meetingNotes" class="notes-area" rows="6" placeholder="Хурлын шийдвэр, оролцогчид, бусад тэмдэглэл…">${UI.esc(NOTES)}</textarea>`;
    } else {
      box.innerHTML = NOTES
        ? `<div class="notes-view">${UI.esc(NOTES).replace(/\n/g, '<br>')}</div>`
        : '<div class="module-empty">Тэмдэглэл бичигдээгүй байна.</div>';
    }
  }

  function renderPrev(res){
    const box = UI.$('#prevTasks');
    const sub = UI.$('#prevMeetingSub');
    if(!res.prev || !res.prev_tasks.length){
      sub.textContent = 'Өмнөх хурлын бүртгэл алга.';
      box.innerHTML = '<div class="module-empty">Өмнөх хурлын даалгавар байхгүй.</div>';
      return;
    }
    const done = res.prev_tasks.filter(t => t.status === 'done').length;
    sub.textContent = `${res.prev.meeting_date} · ${done}/${res.prev_tasks.length} биелсэн`;
    box.innerHTML = res.prev_tasks.map(t => taskViewHtml(t, res.prev.meeting_date)).join('');
  }

  async function loadMeeting(){
    const date = dateInput.value;
    if(!date) return;
    UI.alertBox(msg, '');
    UI.$('#meetingTitle').textContent = UI.formatDateMn(date);
    UI.$('#meetingSub').textContent = 'Долоо хоногийн хурал';
    try{
      const res = await API.meeting(date);
      TASKS = (res.tasks || []).map(t => ({...t}));
      NOTES = (res.meeting && res.meeting.notes) || '';
      renderPrev(res);
      renderTasks();
      renderNotes();
    }catch(err){ UI.alertBox(msg, err.message); }
  }

  async function save(){
    collectTasks();
    const notesEl = UI.$('#meetingNotes');
    const notes = notesEl ? notesEl.value : NOTES;
    const payload = TASKS.filter(t => (t.task_text || '').trim()).map(t => ({
      id: t.id || null, task_text: t.task_text, assignee_id: t.assignee_id,
      due_date: t.due_date, status: t.status || 'open', worker_note: t.worker_note || ''
    }));
    try{
      const res = await API.meetingSave(dateInput.value, notes, payload);
      TASKS = (res.tasks || []).map(t => ({...t}));
      NOTES = (res.meeting && res.meeting.notes) || '';
      renderTasks(); renderNotes();
      UI.alertBox(msg, 'Хурлын тэмдэглэл хадгалагдлаа.', true);
    }catch(err){
      if(/нэвтрэлт хүчингүй/i.test(err.message)){ SESSION.clear(); location.href = 'index.html'; return; }
      UI.alertBox(msg, err.message);
    }
  }

  // Админд зориулсан хяналтууд
  if(isAdmin){
    UI.$('#addTaskBtn').classList.remove('hidden');
    UI.$('#meetingActions').classList.remove('hidden');
    UI.$('#addTaskBtn').onclick = () => {
      collectTasks();
      TASKS.push({id:null, task_text:'', assignee_id:null, due_date:null, status:'open', worker_note:''});
      renderTasks();
    };
    UI.$('#saveMeetingBtn').onclick = save;
  }

  dateInput.onchange = () => { loadMeeting(); loadKpi(); };

  // Хариуцагчийн жагсаалт — зөвхөн админ авч чадна (users endpoint admin-only)
  (async () => {
    if(isAdmin){
      try{ USERS = (await API.users()).users || []; }catch(e){ USERS = []; }
    }
    loadMeeting();
    loadKpi();
  })();
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
  if(page === 'meeting')   PageMeeting();
});

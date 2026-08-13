/**
 * ТЕСТИЙН ӨГӨГДӨЛ ЦУТГАГЧ — production сайт руу хуурамч тайлан илгээнэ.
 * Хэрэглээ:  node seed_test.cjs
 * Цэвэрлэх бол D1 Console:
 *   DELETE FROM reports WHERE date = '2026-08-13';
 * АНХААР: нэг өдөр+төрөл+хэрэглэгчийн тайлан upsert тул дахин ажиллуулахад
 * давхардахгүй, дарж бичнэ. Бодит тайлан орсон өдрүүдийг DAYS-д БҮҮ оруул.
 */
const BASE = 'https://report-d3e.pages.dev';
const USERNAME = 'admin';
const PASSWORD = '9999';
const MONTH = '2026-08';
const DAYS = [13];                       // 8-р сарын 13 — БҮРЭН өгөгдөл
const SEED_PLAN = true;                  // сарын төлөвлөгөөг мөн оруулах уу

const ri = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = a => a[Math.floor(Math.random() * a.length)];
const auth = { username: USERNAME, pin: PASSWORD };

async function call(path, body){
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, ...body })
  });
  const data = await res.json().catch(() => ({}));
  if(!res.ok || data.ok === false) throw new Error(path + ' → ' + (data.error || res.status));
  return data;
}

async function main(){
  await call('/api/login', {});
  const vehicles = (await call('/api/vehicles', {})).vehicles || [];
  console.log('Нэвтэрлээ. Машин:', vehicles.length);
  if(!vehicles.length) console.log('АНХААР: машины бүртгэл хоосон — тээвэр/түлшний мөр үүсэхгүй.');

  if(SEED_PLAN){
    await call('/api/plan/save', { month: MONTH, plan: {
      production_ton: 13200, sludge_ton: 67200,
      sludge_trips: 1860, sludge_vehicles: 15,
      product_transport_trips: 336, product_transport_vehicles: 7
    }});
    console.log('Төлөвлөгөө орлоо:', MONTH);
  }

  for(const day of DAYS){
    const date = MONTH + '-' + String(day).padStart(2, '0');

    /* ---------- ТЭЭВЭР: машин бүрээр рейс + тонн ---------- */
    const t = {sludge_trips:0, sludge_ton:0, waste_trips:0, waste_ton:0,
               short_waste_trips:0, short_waste_ton:0,
               product_transport_trips:0, product_transport_ton:0};
    const trows = [];
    for(const v of vehicles){
      if(!['sludge','waste','short','product'].includes(v.purpose)) continue;
      const trips = ri(3, 9);
      const ton = trips * ri(9, 17);
      trows.push({vid: v.id, name: v.name, purpose: v.purpose, ownership: v.ownership, trips, ton});
      if(v.purpose === 'sludge'){ t.sludge_trips += trips; t.sludge_ton += ton; }
      else if(v.purpose === 'waste'){ t.waste_trips += trips; t.waste_ton += ton; }
      else if(v.purpose === 'short'){ t.short_waste_trips += trips; t.short_waste_ton += ton; }
      else { t.product_transport_trips += trips; t.product_transport_ton += ton; }
    }
    await call('/api/submit', { date, report_type: 'transport', data: {
      ...t, vehicle_rows: trows,
      weighbridge_net_ton: t.sludge_ton + ri(-35, 35),   // пүү = ER-ээс ирсэн шлам
      weighbridge_trips: t.sludge_trips,
      note: 'Бүх чиглэлд хэвийн. Замын нөхцөл сайн.',
      issue_text: '08-49-УНН Норд машины ар талын дугуй сэлбэг солиулсан, 2 цаг зогссон.',
      issue_severity: 'medium'
    }});

    /* ---------- ТҮЛШ: машин бүрд олгосон литр ---------- */
    const frows = vehicles.map(v => ({vid: v.id, name: v.name, ownership: v.ownership, liter: ri(60, 240)}));
    const expense = frows.reduce((a, r) => a + r.liter, 0);
    const opening = 14185, income = 6000;
    await call('/api/submit', { date, report_type: 'fuel', data: {
      fuel_opening_liter: opening, fuel_income_liter: income,
      vehicle_rows: frows, fuel_expense_liter: expense,
      fuel_closing_liter: opening + income - expense,
      note: 'Түлшний татан авалт 6,000 л хийгдсэн. Нөөц хэвийн.',
      issue_text: '', issue_severity: ''
    }});

    /* ---------- ҮЙЛДВЭРЛЭЛ / ЛАБ ---------- */
    await call('/api/submit', { date, report_type: 'production', data: {
      shift_day_product_ton: ri(280, 420),
      shift_night_product_ton: ri(190, 320),
      day_meter: ri(5200, 5900), night_meter: ri(4100, 4800),
      day_fuel_liter: ri(380, 560), night_fuel_liter: ri(300, 470),
      middling_ton: ri(35, 75),
      lab_avg_luojing_ad: ri(9, 12), lab_avg_fumei_ad: ri(10, 13), lab_avg_caking_g: ri(74, 88),
      note: 'Хоёр ээлж хэвийн ажилласан. Лабораторийн үзүүлэлт стандартын хүрээнд.',
      issue_text: 'Шөнийн ээлжид цахилгаан 25 минут тасарсан, үйлдвэрлэл түр зогссон.',
      issue_severity: 'medium'
    }});

    /* ---------- ТЕХНИК ---------- */
    const working = ri(16, 20), rentSl = ri(10, 14), rentPr = ri(5, 8);
    await call('/api/submit', { date, report_type: 'equipment', data: {
      main_working_count: working,
      rental_sludge_working_count: rentSl,
      product_transport_working_count: rentPr,
      repair_count: ri(1, 3), parked_count: ri(3, 7),
      equipment_note: 'LONKING 60 ковш засварт, гидравликийн шланг солиж байна. Бусад техник хэвийн.',
      issue_text: 'LONKING 60 ковшны гидравликийн шланг задарсан, сэлбэг захиалсан.',
      issue_severity: 'high'
    }});

    /* ---------- КЕМП / ХҮН ХҮЧ ---------- */
    await call('/api/submit', { date, report_type: 'camp', data: {
      mongolian_count: ri(22, 26), chinese_count: ri(19, 24),
      guard_count: 5, guest_count: ri(1, 4),
      outside_meal_count: ri(2, 6), contractor_count: ri(8, 12), camp_staff_count: ri(7, 9),
      note: 'Хоол, ус, дулаан хэвийн. Зочид ER-ийн төлөөлөгчид.',
      issue_text: '', issue_severity: ''
    }});

    /* ---------- ХАБЭА (цаг агаарын карт үүнээс тэжээгддэг) ---------- */
    await call('/api/submit', { date, report_type: 'hse', data: {
      hse_violation_count: 0,
      medical_assistance_count: 0,
      day_temp_c: 26, night_temp_c: 13,
      humidity_percent: 38, wind_speed_ms: 6,
      note: 'Осол, зөрчилгүй өдөр. Өглөөний ХАБ-ын товч хурал хийгдсэн.',
      issue_text: '', issue_severity: ''
    }});

    /* ---------- АСУУДАЛ (ерөнхий бүртгэл) ---------- */
    await call('/api/submit', { date, report_type: 'issue', data: {
      issue_text: 'Ковшны сэлбэг ирэх хугацаа тодорхойгүй байгаа нь хуваарьт нөлөөлж болзошгүй.',
      severity: 'medium',
      status: 'open',
      action_taken: 'Нийлүүлэгчтэй холбогдож, ирэх хугацааг тодруулж байна.',
      responsible_person: 'Техник Ганбат'
    }});

    console.log(date, '— 7 тайлан БҮРЭН орлоо');
  }
  console.log('ДУУСЛАА →', BASE + '/dashboard');
}

main().catch(e => { console.error('АЛДАА:', e.message); process.exit(1); });

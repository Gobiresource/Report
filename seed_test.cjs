/**
 * ТЕСТИЙН ӨГӨГДӨЛ ЦУТГАГЧ — production сайт руу хуурамч тайлан илгээнэ.
 * Хэрэглээ:
 *   1. Доорх PASSWORD-ыг админ нууц үгээрээ соль
 *   2. MONTH, DAYS-ээ тохируул
 *   3. terminal:  node seed_test.cjs
 * Цэвэрлэх бол D1 Console:
 *   DELETE FROM reports WHERE date LIKE '2026-08-%';
 * АНХААР: нэг өдөр+төрөл+хэрэглэгчийн тайлан upsert тул дахин ажиллуулахад
 * давхардахгүй, дарж бичнэ. Бодит тайлан орсон өдрүүдийг DAYS-д БҮҮ оруул.
 */
const BASE = 'https://report-d3e.pages.dev';
const USERNAME = 'admin';
const PASSWORD = '9999';   // <-- солино!
const MONTH = '2026-08';
const DAYS = [1, 2, 3, 4, 5, 6, 7, 8];   // аль өдрүүдийг бөглөх вэ
const SEED_PLAN = true;                  // сарын төлөвлөгөөг мөн оруулах уу

const ri = (min, max) => Math.round(min + Math.random() * (max - min));
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
  // Нэвтрэлт шалгах + машины жагсаалт авах
  await call('/api/login', {});
  const vehicles = (await call('/api/vehicles', {})).vehicles || [];
  console.log('Нэвтэрлээ. Машин:', vehicles.length);

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

    // ---- Тээвэр: машин бүрд зориулалтаар нь рейс+тонн ----
    const t = {sludge_trips:0, sludge_ton:0, waste_trips:0, waste_ton:0,
               short_waste_trips:0, short_waste_ton:0,
               product_transport_trips:0, product_transport_ton:0};
    const rows = [];
    for(const v of vehicles){
      if(!['sludge','waste','short','product'].includes(v.purpose)) continue;
      if(Math.random() < 0.2) continue; // зарим машин амарна
      const trips = ri(2, 8);
      const ton = trips * ri(8, 16);
      rows.push({vid: v.id, name: v.name, purpose: v.purpose, ownership: v.ownership, trips, ton});
      if(v.purpose === 'sludge'){ t.sludge_trips += trips; t.sludge_ton += ton; }
      else if(v.purpose === 'waste'){ t.waste_trips += trips; t.waste_ton += ton; }
      else if(v.purpose === 'short'){ t.short_waste_trips += trips; t.short_waste_ton += ton; }
      else { t.product_transport_trips += trips; t.product_transport_ton += ton; }
    }
    await call('/api/submit', { date, report_type: 'transport', data: {
      ...t, vehicle_rows: rows,
      weighbridge_net_ton: t.sludge_ton + ri(-40, 40),  // пүү = ER-ээс ирсэн шлам
      weighbridge_trips: t.sludge_trips
    }});

    // ---- Түлш: машин бүрд олгосон литр ----
    const frows = vehicles.filter(() => Math.random() < 0.7)
      .map(v => ({vid: v.id, name: v.name, ownership: v.ownership, liter: ri(40, 220)}));
    const expense = frows.reduce((a, r) => a + r.liter, 0);
    const opening = ri(12000, 16000), income = Math.random() < 0.3 ? ri(4000, 8000) : 0;
    await call('/api/submit', { date, report_type: 'fuel', data: {
      fuel_opening_liter: opening, fuel_income_liter: income,
      vehicle_rows: frows, fuel_expense_liter: expense,
      fuel_closing_liter: opening + income - expense
    }});

    // ---- Үйлдвэрлэл / Лаб ----
    await call('/api/submit', { date, report_type: 'production', data: {
      shift_day_product_ton: ri(220, 420), shift_night_product_ton: ri(150, 330),
      day_meter: ri(4000, 6000), night_meter: ri(3000, 5000),
      day_fuel_liter: ri(300, 600), night_fuel_liter: ri(250, 500),
      middling_ton: ri(20, 80),
      lab_avg_luojing_ad: ri(8, 12), lab_avg_fumei_ad: ri(9, 13), lab_avg_caking_g: ri(70, 90)
    }});

    // ---- Техник ----
    await call('/api/submit', { date, report_type: 'equipment', data: {
      main_working_count: ri(14, 20), rental_sludge_working_count: ri(8, 14),
      product_transport_working_count: ri(4, 8),
      repair_count: ri(0, 4), parked_count: ri(2, 8),
      equipment_note: 'Тест: хэвийн ажиллагаа'
    }});

    // ---- Кемп ----
    await call('/api/submit', { date, report_type: 'camp', data: {
      mongolian_count: ri(20, 26), chinese_count: ri(18, 24),
      guard_count: ri(4, 6), guest_count: ri(0, 4),
      outside_meal_count: ri(0, 6), contractor_count: ri(6, 12), camp_staff_count: ri(6, 9)
    }});

    // ---- ХАБЭА ----
    await call('/api/submit', { date, report_type: 'hse', data: {
      hse_violation_count: Math.random() < 0.2 ? 1 : 0,
      medical_assistance_count: Math.random() < 0.15 ? 1 : 0,
      day_temp_c: ri(18, 30), night_temp_c: ri(8, 16),
      humidity_percent: ri(30, 60), wind_speed_ms: ri(2, 12)
    }});

    // ---- Асуудал ----
    await call('/api/submit', { date, report_type: 'issue', data: {
      issue_text: Math.random() < 0.3 ? 'Тест: конвейерийн хөтлөгч халсан' : '',
      severity: 'low',
      status: Math.random() < 0.5 ? 'open' : 'resolved',
      action_taken: 'Тест бүртгэл', responsible_person: 'Тест'
    }});

    console.log(date, '— 7 тайлан орлоо');
  }
  console.log('ДУУСЛАА. Dashboard-оо шалгаарай:', BASE + '/dashboard');
}

main().catch(e => { console.error('АЛДАА:', e.message); process.exit(1); });

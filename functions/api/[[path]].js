const ALLOWED_DEPARTMENTS = new Set(['production','transport','fuel','equipment','camp','safety','issues']);

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  try {
    if (!env.DB) return json({ ok:false, error:'D1 binding DB олдсонгүй. Cloudflare Pages дээр DB binding тохируулна.' }, 500);
    if (request.method === 'GET' && path === 'daily-summary') return dailySummary(env.DB, url.searchParams.get('date'));
    if (request.method === 'GET' && path === 'monthly-summary') return monthlySummary(env.DB, url.searchParams.get('month'));
    if (request.method === 'GET' && path === 'options') return options(env.DB);
    if (request.method === 'POST' && path === 'validate-pin') return validatePin(env.DB, await request.json());
    if (request.method === 'POST' && path === 'submit') return submitReport(env.DB, await request.json());
    if (request.method === 'POST' && path === 'admin/monthly-actual') return saveMonthlyActual(env.DB, await request.json());
    return json({ ok:false, error:'API route олдсонгүй', path }, 404);
  } catch (err) {
    return json({ ok:false, error: err.message || String(err) }, 400);
  }
}

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8' } });
}
function cleanNum(v) { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/,/g,'')); return Number.isFinite(n) ? n : null; }
function asInt(v) { const n = cleanNum(v); return n === null ? null : Math.round(n); }
function requireDate(date) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Огноо YYYY-MM-DD форматтай байх ёстой.'); return date; }
function requireMonth(month) { if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('Сар YYYY-MM форматтай байх ёстой.'); return month; }
async function checkPin(db, department, pin, admin=false) {
  const dep = admin ? 'admin' : department;
  const user = await db.prepare('SELECT * FROM users WHERE department=? AND active=1').bind(dep).first();
  if (!user) throw new Error(`${dep} хэрэглэгч олдсонгүй.`);
  if (String(user.pin) !== String(pin || '')) throw new Error('PIN буруу байна.');
  return user;
}
async function insertSubmission(db, date, department, payload) {
  const r = await db.prepare('INSERT INTO report_submissions(date,department,raw_json) VALUES(?,?,?)').bind(date, department, JSON.stringify(payload || {})).run();
  return r.meta?.last_row_id || null;
}

async function validatePin(db, body) {
  const department = body.department;
  if (!ALLOWED_DEPARTMENTS.has(department)) throw new Error('Тайлангийн төрөл буруу байна.');
  const user = await checkPin(db, department, body.pin, false);
  return json({ ok:true, department, user:{ name:user.name, department:user.department, role:user.role } });
}

async function submitReport(db, body) {
  const date = requireDate(body.date);
  const department = body.department;
  if (!ALLOWED_DEPARTMENTS.has(department)) throw new Error('Тайлангийн төрөл буруу байна.');
  await checkPin(db, department, body.pin, false);
  const payload = body.payload || {};
  const submissionId = await insertSubmission(db, date, department, payload);
  if (department === 'production') await saveProduction(db, date, payload);
  if (department === 'transport') await saveTransport(db, date, payload);
  if (department === 'fuel') await saveFuel(db, date, payload);
  if (department === 'equipment') await saveEquipment(db, date, payload);
  if (department === 'camp') await saveCamp(db, date, payload);
  if (department === 'safety') await saveSafety(db, date, payload);
  if (department === 'issues') await saveIssues(db, date, payload);
  return json({ ok:true, submission_id: submissionId });
}

async function saveProduction(db, date, payload) {
  await db.prepare('DELETE FROM production_shift_records WHERE date=?').bind(date).run();
  await db.prepare('DELETE FROM lab_quality_samples WHERE date=?').bind(date).run();
  for (const r of payload.shifts || []) {
    if (!r.shift) continue;
    await db.prepare(`INSERT OR REPLACE INTO production_shift_records(date,shift,meter_value,product_ton,middling_ton,fuel_liter) VALUES(?,?,?,?,?,?)`)
      .bind(date, r.shift, cleanNum(r.meter_value), cleanNum(r.product_ton), cleanNum(r.middling_ton), cleanNum(r.fuel_liter)).run();
  }
  for (const r of payload.lab_samples || []) {
    if (!r.sample_time && cleanNum(r.luojing_ad) === null && cleanNum(r.fumei_ad) === null && cleanNum(r.caking_g) === null) continue;
    await db.prepare(`INSERT INTO lab_quality_samples(date,shift,sample_time,luojing_ad,fumei_ad,caking_g) VALUES(?,?,?,?,?,?)`)
      .bind(date, r.shift || null, String(r.sample_time || ''), cleanNum(r.luojing_ad), cleanNum(r.fumei_ad), cleanNum(r.caking_g)).run();
  }
}
async function saveTransport(db, date, payload) {
  await db.prepare('DELETE FROM transport_truck_records WHERE date=?').bind(date).run();
  await db.prepare('DELETE FROM transport_weighbridge_records WHERE date=?').bind(date).run();
  for (const r of payload.records || []) {
    const trips = cleanNum(r.trips), ton = cleanNum(r.ton_weight);
    if (!r.truck_no || (trips === null && ton === null)) continue;
    const avg = trips ? ton / trips : null;
    await db.prepare(`INSERT INTO transport_truck_records(date,transport_type,truck_no,trips,ton_weight,avg_ton_per_trip,roster,source_sheet) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(date, r.transport_type || 'shalaam', r.truck_no, trips, ton, avg, r.roster || null, 'ТЭЭВЭР').run();
  }
  for (const r of payload.weighbridge || []) {
    const tare = cleanNum(r.tare_weight_kg), gross = cleanNum(r.gross_weight_kg);
    if (!r.truck_no && tare === null && gross === null) continue;
    let valid = 0, note = '', netKg = null, netTon = null;
    if (gross !== null && tare !== null && gross > tare) { valid = 1; netKg = gross - tare; netTon = netKg / 1000; }
    else { note = 'Gross weight байхгүй эсвэл tare-аас бага/тэнцүү тул тооцоогүй.'; }
    await db.prepare(`INSERT INTO transport_weighbridge_records(date,truck_no,tare_weight_kg,gross_weight_kg,net_weight_kg,net_weight_ton,is_valid,validation_note) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(date, r.truck_no || '', tare, gross, netKg, netTon, valid, r.note || note).run();
  }
}
async function saveFuel(db, date, payload) {
  await db.prepare('DELETE FROM fuel_storage_movements WHERE date=?').bind(date).run();
  await db.prepare('DELETE FROM fuel_equipment_records WHERE date=?').bind(date).run();
  await db.prepare('DELETE FROM fuel_issue_records WHERE date=?').bind(date).run();
  for (const r of payload.storage || []) {
    if (!r.storage_type) continue;
    const machine = cleanNum(r.issued_to_machine_liter) || 0;
    const plant = cleanNum(r.issued_to_plant_liter) || 0;
    const station = cleanNum(r.issued_to_station_liter) || 0;
    const total = machine + plant + station;
    await db.prepare(`INSERT OR REPLACE INTO fuel_storage_movements(date,storage_type,income_liter,opening_stock_liter,issued_to_machine_liter,issued_to_plant_liter,issued_to_station_liter,total_expense_liter,closing_stock_liter,note) VALUES(?,?,?,?,?,?,?,?,?,?)`)
      .bind(date, r.storage_type, cleanNum(r.income_liter), cleanNum(r.opening_stock_liter), cleanNum(r.issued_to_machine_liter), cleanNum(r.issued_to_plant_liter), cleanNum(r.issued_to_station_liter), total || cleanNum(r.total_expense_liter), cleanNum(r.closing_stock_liter), r.note || null).run();
  }
  for (const r of payload.equipment || []) {
    const fuel = cleanNum(r.fuel_liter);
    if (!r.equipment_name || fuel === null) continue;
    await db.prepare(`INSERT INTO fuel_equipment_records(date,equipment_name,equipment_group,fuel_liter,meter_value) VALUES(?,?,?,?,?)`)
      .bind(date, r.equipment_name, r.equipment_group || null, fuel, cleanNum(r.meter_value)).run();
  }
  for (const r of payload.issues || []) {
    const issued = cleanNum(r.issued_liter);
    if (issued === null) continue;
    await db.prepare(`INSERT INTO fuel_issue_records(date,voucher_no,equipment_name,operator_name,issued_liter,meter_reading,confirmed,note) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(date, r.voucher_no || null, r.equipment_name || null, r.operator_name || null, issued, cleanNum(r.meter_reading), asInt(r.confirmed) || 0, r.note || null).run();
  }
}
async function saveEquipment(db, date, payload) {
  await db.prepare('DELETE FROM equipment_daily_status WHERE date=?').bind(date).run();
  for (const r of payload.statuses || []) {
    if (!r.equipment_name) continue;
    await db.prepare(`INSERT INTO equipment_daily_status(date,equipment_name,equipment_group,ownership_type,shift,status,status_text,note) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(date, r.equipment_name, r.equipment_group || null, r.ownership_type || null, r.shift || 'full_day', r.status || 'unknown', r.status_text || null, r.note || null).run();
  }
}
async function saveCamp(db, date, r) {
  await db.prepare(`INSERT OR REPLACE INTO camp_daily_records(date,mongolian_count,chinese_count,total_people,guard_count,guest_count,outside_meal_count,contractor_count,camp_staff_count,cook_count,cleaner_count,laundry_count,household_count,note,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(date, asInt(r.mongolian_count), asInt(r.chinese_count), asInt(r.total_people), asInt(r.guard_count), asInt(r.guest_count), asInt(r.outside_meal_count), asInt(r.contractor_count), asInt(r.camp_staff_count), asInt(r.cook_count), asInt(r.cleaner_count), asInt(r.laundry_count), asInt(r.household_count), r.note || null).run();
}
async function saveSafety(db, date, r) {
  await db.prepare(`INSERT OR REPLACE INTO safety_daily_records(date,medical_aid,hse_violation,day_temp_c,night_temp_c,humidity_pct,wind_speed_ms,note,updated_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(date, asInt(r.medical_aid), asInt(r.hse_violation), cleanNum(r.day_temp_c), cleanNum(r.night_temp_c), cleanNum(r.humidity_pct), cleanNum(r.wind_speed_ms), r.note || null).run();
}
async function saveIssues(db, date, payload) {
  await db.prepare('DELETE FROM operation_issues WHERE date=?').bind(date).run();
  for (const r of payload.issues || []) {
    if (!String(r.issue_text || '').trim()) continue;
    await db.prepare(`INSERT INTO operation_issues(date,department,issue_text,severity,status,responsible_person,action_taken) VALUES(?,?,?,?,?,?,?)`)
      .bind(date, r.department || 'production', String(r.issue_text).trim(), r.severity || 'medium', r.status || 'open', r.responsible_person || null, r.action_taken || null).run();
  }
}

async function dailySummary(db, rawDate) {
  const date = requireDate(rawDate);
  const month = date.slice(0,7);
  const shifts = (await db.prepare('SELECT * FROM production_shift_records WHERE date=? ORDER BY shift').bind(date).all()).results || [];
  const labs = (await db.prepare('SELECT * FROM lab_quality_samples WHERE date=? ORDER BY id').bind(date).all()).results || [];
  const transportRows = (await db.prepare('SELECT * FROM transport_truck_records WHERE date=?').bind(date).all()).results || [];
  const weighRows = (await db.prepare('SELECT * FROM transport_weighbridge_records WHERE date=?').bind(date).all()).results || [];
  const fuelStorage = (await db.prepare('SELECT * FROM fuel_storage_movements WHERE date=? ORDER BY storage_type').bind(date).all()).results || [];
  const fuelEq = (await db.prepare('SELECT * FROM fuel_equipment_records WHERE date=?').bind(date).all()).results || [];
  const fuelIssues = (await db.prepare('SELECT * FROM fuel_issue_records WHERE date=?').bind(date).all()).results || [];
  const equip = (await db.prepare('SELECT * FROM equipment_daily_status WHERE date=?').bind(date).all()).results || [];
  const camp = await db.prepare('SELECT * FROM camp_daily_records WHERE date=?').bind(date).first();
  const safety = await db.prepare('SELECT * FROM safety_daily_records WHERE date=?').bind(date).first();
  const issues = (await db.prepare('SELECT * FROM operation_issues WHERE date=? ORDER BY id').bind(date).all()).results || [];
  const submissions = (await db.prepare('SELECT department, COUNT(*) c FROM report_submissions WHERE date=? GROUP BY department').bind(date).all()).results || [];
  const reportStatus = {};
  for (const d of ALLOWED_DEPARTMENTS) reportStatus[d] = false;
  for (const s of submissions) reportStatus[s.department] = Number(s.c) > 0;

  const production = {
    shifts,
    totalProduct: sum(shifts, 'product_ton'),
    totalFuel: sum(shifts, 'fuel_liter'),
    totalMeter: sum(shifts, 'meter_value'),
    labAverages: {
      luojing_ad: avg(labs, 'luojing_ad'),
      fumei_ad: avg(labs, 'fumei_ad'),
      caking_g: avg(labs, 'caking_g')
    }
  };
  const byType = {};
  for (const r of transportRows) {
    const k = r.transport_type || 'unknown';
    byType[k] ||= { trips:0, ton:0 };
    byType[k].trips += Number(r.trips) || 0;
    byType[k].ton += Number(r.ton_weight) || 0;
  }
  const validWeigh = weighRows.filter(r => Number(r.is_valid) === 1);
  const transport = { byType, weighbridge: { trips: validWeigh.length, ton: sum(validWeigh, 'net_weight_ton'), invalid: weighRows.length - validWeigh.length } };

  const fuel = {
    storage: fuelStorage,
    totalClosingStock: sum(fuelStorage, 'closing_stock_liter'),
    totalExpense: sum(fuelStorage, 'total_expense_liter'),
    equipmentTotal: sum(fuelEq, 'fuel_liter'),
    issueTotal: sum(fuelIssues, 'issued_liter')
  };

  const counts = { working:0, repair:0, parked:0, unknown:0 };
  const byGroup = {};
  for (const r of equip) {
    const st = normalizeStatus(r.status);
    counts[st] = (counts[st] || 0) + 1;
    const g = r.equipment_group || 'unknown';
    byGroup[g] ||= { working:0, repair:0, parked:0, unknown:0 };
    byGroup[g][st] = (byGroup[g][st] || 0) + 1;
  }
  const equipment = { counts, byGroup, rows: equip };

  const warnings = [];
  for (const s of fuelStorage) if ((Number(s.closing_stock_liter) || 0) < 0) warnings.push(`${s.storage_type} түлшний үлдэгдэл сөрөг байна: ${s.closing_stock_liter} л`);
  if (transport.weighbridge.invalid > 0) warnings.push(`Пүүний ${transport.weighbridge.invalid} мөр gross/tare шалгалтад тэнцээгүй.`);
  for (const d of ['camp','transport','fuel','equipment','production','safety']) if (!reportStatus[d]) warnings.push(`${depLabel(d)} тайлан ирээгүй байна.`);

  return json({ ok:true, date, month, reportStatus, production, transport, fuel, equipment, camp: camp || {}, safety: safety || {}, issues, warnings });
}

async function monthlySummary(db, rawMonth) {
  const month = requireMonth(rawMonth || new Date().toISOString().slice(0,7));
  const like = `${month}-%`;
  const actual = await db.prepare('SELECT * FROM monthly_actuals WHERE month=?').bind(month).first();
  const params = await db.prepare('SELECT * FROM cost_parameters WHERE month=?').bind(month).first() || { fuel_price_mnt_l:4250, depreciation_per_vehicle_mnt:1500000, own_vehicle_count:4, usd_mnt:3576 };
  const daily = {
    production_ton: (await scalar(db, 'SELECT SUM(product_ton) FROM production_shift_records WHERE date LIKE ?', like)) || 0,
    plant_fuel_liter: (await scalar(db, 'SELECT SUM(fuel_liter) FROM production_shift_records WHERE date LIKE ?', like)) || 0,
    shlam_ton: (await scalar(db, `SELECT SUM(ton_weight) FROM transport_truck_records WHERE date LIKE ? AND transport_type='shalaam'`, like)) || 0,
    waste_ton: (await scalar(db, `SELECT SUM(ton_weight) FROM transport_truck_records WHERE date LIKE ? AND transport_type IN ('waste','short_waste')`, like)) || 0,
    fuel_expense_liter: (await scalar(db, 'SELECT SUM(total_expense_liter) FROM fuel_storage_movements WHERE date LIKE ?', like)) || 0
  };
  const base = actual || { month, clean_coal_ton: daily.production_ton, shlam_ton: daily.shlam_ton, waste_ton: daily.waste_ton, machine_fuel_liter: daily.fuel_expense_liter, generator_fuel_liter: daily.plant_fuel_liter, rental_transport_mnt: null };
  const cost = computeCost(base, params);
  const allActuals = (await db.prepare('SELECT * FROM monthly_actuals ORDER BY month').all()).results || [];
  const allParams = (await db.prepare('SELECT * FROM cost_parameters').all()).results || [];
  const paramMap = Object.fromEntries(allParams.map(p => [p.month, p]));
  const historical = allActuals.map(a => ({...a, ...computeCost(a, paramMap[a.month] || params)}));
  return json({ ok:true, month, daily, actual: base, params, cost, historical });
}
function computeCost(a, p) {
  const clean = Number(a.clean_coal_ton) || 0;
  const fuelPrice = Number(p.fuel_price_mnt_l) || 4250;
  const depreciation = (Number(p.depreciation_per_vehicle_mnt) || 0) * (Number(p.own_vehicle_count) || 0);
  const rental = Number(a.rental_transport_mnt) || 0;
  const machineFuel = Number(a.machine_fuel_liter) || 0;
  const genFuel = Number(a.generator_fuel_liter) || 0;
  if (!clean) return { fuel_price_mnt_l:fuelPrice, clean_coal_ton:a.clean_coal_ton || 0, cost_a_mnt_ton:null, cost_b_mnt_ton:null };
  return {
    fuel_price_mnt_l: fuelPrice,
    clean_coal_ton: Number(a.clean_coal_ton) || 0,
    cost_a_mnt_ton: (machineFuel * fuelPrice + rental + depreciation) / clean,
    cost_b_mnt_ton: ((machineFuel + genFuel) * fuelPrice + rental + depreciation) / clean
  };
}
async function saveMonthlyActual(db, body) {
  await checkPin(db, 'admin', body.pin, true);
  const month = requireMonth(body.month);
  const a = body.actual || {}, p = body.params || {};
  await db.prepare(`INSERT OR REPLACE INTO monthly_actuals(month,shlam_ton,waste_ton,clean_coal_ton,machine_fuel_liter,generator_fuel_liter,rental_transport_mnt,source_note,updated_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(month, cleanNum(a.shlam_ton), cleanNum(a.waste_ton), cleanNum(a.clean_coal_ton), cleanNum(a.machine_fuel_liter), cleanNum(a.generator_fuel_liter), cleanNum(a.rental_transport_mnt), a.source_note || null).run();
  await db.prepare(`INSERT OR REPLACE INTO cost_parameters(month,fuel_price_mnt_l,depreciation_per_vehicle_mnt,own_vehicle_count,usd_mnt,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(month, cleanNum(p.fuel_price_mnt_l) || 4250, cleanNum(p.depreciation_per_vehicle_mnt) || 1500000, asInt(p.own_vehicle_count) || 4, cleanNum(p.usd_mnt) || 3576).run();
  return json({ ok:true });
}
async function options(db) {
  const equipment = (await db.prepare('SELECT * FROM equipment_master WHERE active=1 ORDER BY equipment_group,equipment_name').all()).results || [];
  return json({ ok:true, equipment });
}
async function scalar(db, sql, bind) {
  const row = await db.prepare(sql).bind(bind).first();
  if (!row) return null;
  return row[Object.keys(row)[0]];
}
function sum(rows, key) { return (rows || []).reduce((s, r) => s + (Number(r[key]) || 0), 0); }
function avg(rows, key) { const vals = (rows || []).map(r => Number(r[key])).filter(Number.isFinite); return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null; }
function normalizeStatus(s) { if (s === 'working') return 'working'; if (s === 'repair') return 'repair'; if (s === 'parked') return 'parked'; return 'unknown'; }
function depLabel(d) { return ({production:'Үйлдвэрлэл',transport:'Тээвэр',fuel:'Түлш',equipment:'Техник',camp:'Кемп',safety:'ХАБЭА',issues:'Асуудал'}[d] || d); }

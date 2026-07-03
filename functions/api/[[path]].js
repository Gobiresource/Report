/**
 * ГОВЬ РЕСУРС ДЕВЕЛОПМЕНТ ХХК — API
 * ---------------------------------------------------------------
 * Cloudflare Pages Function. Бүх /api/* хүсэлтийг эндээс барина.
 * D1 binding нэр заавал "DB" байх ёстой (wrangler.toml болон Pages
 * dashboard дээрх Settings → Bindings хэсэгт тохируулна).
 *
 * Endpoint-ууд:
 *   GET  /api/options   — идэвхтэй тайлангийн төрлүүд (нэвтрэлт шаардахгүй)
 *   POST /api/login     — нэвтрэх, эрхийн жагсаалт буцаана
 *   POST /api/submit    — тайлан хадгалах (эрхтэй л бол)
 *   POST /api/daily     — тухайн өдрийн бүх тайлан (нэвтэрсэн хэн ч харна)
 *   POST /api/monthly   — тухайн сарын бүх тайлан (нэвтэрсэн хэн ч харна)
 * ---------------------------------------------------------------
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
  });
}
function fail(message, status = 400) { return jsonResponse({ok:false, error:message}, status); }
function ok(payload) { return jsonResponse({ok:true, ...payload}); }

async function readBody(request) {
  try { return await request.json(); } catch (e) { return {}; }
}
function routeOf(request) {
  return new URL(request.url).pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
}
function parseJsonColumn(raw) {
  try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
}

/* ---------------------------------------------------------------
   Database helpers
   --------------------------------------------------------------- */
async function findUser(db, username, pin) {
  if (!username || !pin) return null;
  return db.prepare(
    `SELECT id, username, name, role, department, active
     FROM users WHERE username = ? AND pin = ? LIMIT 1`
  ).bind(String(username).trim(), String(pin).trim()).first();
}

async function permissionsFor(db, userId) {
  const rows = await db.prepare(
    `SELECT report_type_key FROM user_report_permissions WHERE user_id = ? AND can_submit = 1`
  ).bind(userId).all();
  return (rows.results || []).map(row => row.report_type_key);
}

async function canSubmit(db, user, reportType) {
  if (!user || !user.active) return false;
  if (user.role === 'admin') return true;
  const row = await db.prepare(
    `SELECT 1 FROM user_report_permissions WHERE user_id = ? AND report_type_key = ? AND can_submit = 1 LIMIT 1`
  ).bind(user.id, reportType).first();
  return !!row;
}

async function logAction(db, userId, action, target, payload) {
  await db.prepare(
    `INSERT INTO audit_logs (user_id, action, target, new_data) VALUES (?, ?, ?, ?)`
  ).bind(userId, action, target, JSON.stringify(payload)).run();
}

/* ---------------------------------------------------------------
   Route handlers
   --------------------------------------------------------------- */
async function handleOptions(db) {
  const rows = await db.prepare(
    `SELECT key, name, sort_order FROM report_types WHERE active = 1 ORDER BY sort_order`
  ).all();
  return ok({report_types: rows.results || []});
}

async function handleLogin(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэх нэр эсвэл PIN буруу байна.', 401);
  const permissions = await permissionsFor(db, user.id);
  await logAction(db, user.id, 'login', 'session', {username:user.username, role:user.role});
  return ok({user, permissions});
}

async function handleSubmit(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.date || !DATE_RE.test(body.date)) return fail('Огноо буруу байна.');
  if (!body.report_type) return fail('Тайлангийн төрөл сонгогдоогүй байна.');

  const allowed = await canSubmit(db, user, body.report_type);
  if (!allowed) return fail('Танд энэ тайланг оруулах эрх байхгүй.', 403);

  const dataJson = JSON.stringify(body.data || {});
  await db.prepare(
    `INSERT INTO reports (date, report_type, data_json, submitted_by, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date, report_type, submitted_by)
     DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')`
  ).bind(body.date, body.report_type, dataJson, user.id).run();
  await logAction(db, user.id, 'submit_report', body.report_type, body.data || {});
  return ok({});
}

// Dashboard-ийн summary-г нэвтэрсэн ХЭН Ч (захирал болон ажилтан) харна —
// зөвхөн тайлан ОРУУЛАХ үйлдэл нь эрхийн шалгалттай.
async function handleDaily(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.date || !DATE_RE.test(body.date)) return fail('Огноо буруу байна.');

  const rows = await db.prepare(
    `SELECT r.date, r.report_type, r.data_json, r.updated_at, u.name AS submitted_by_name
     FROM reports r LEFT JOIN users u ON u.id = r.submitted_by
     WHERE r.date = ? ORDER BY r.report_type, r.updated_at DESC`
  ).bind(body.date).all();

  // Нэг төрлөөс хамгийн сүүлд шинэчлэгдсэнийг л авна (давхар илгээлт байвал)
  const seen = new Set();
  const reports = [];
  for (const row of (rows.results || [])) {
    if (seen.has(row.report_type)) continue;
    seen.add(row.report_type);
    reports.push({
      date: row.date,
      report_type: row.report_type,
      updated_at: row.updated_at,
      submitted_by_name: row.submitted_by_name,
      data: parseJsonColumn(row.data_json)
    });
  }
  return ok({date: body.date, reports});
}

async function handleMonthly(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.month || !MONTH_RE.test(body.month)) return fail('Сар буруу байна (YYYY-MM).');

  const rows = await db.prepare(
    `SELECT r.date, r.report_type, r.data_json, r.updated_at
     FROM reports r WHERE substr(r.date, 1, 7) = ?
     ORDER BY r.date, r.report_type, r.updated_at DESC`
  ).bind(body.month).all();

  const seen = new Set();
  const reports = [];
  for (const row of (rows.results || [])) {
    const key = row.date + '|' + row.report_type;
    if (seen.has(key)) continue;
    seen.add(key);
    reports.push({date: row.date, report_type: row.report_type, data: parseJsonColumn(row.data_json)});
  }
  return ok({month: body.month, reports});
}

// Машины бүртгэл удирдах эрх: admin эсвэл тээврийн тайлан оруулах эрхтэй хүн
async function canManageVehicles(db, user) {
  if (!user || !user.active) return false;
  if (user.role === 'admin') return true;
  return await canSubmit(db, user, 'transport');
}

async function handleVehiclesList(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  const rows = await db.prepare(
    `SELECT id, name, purpose, ownership FROM vehicles WHERE active = 1 ORDER BY ownership, sort_order, id`
  ).all();
  return ok({vehicles: rows.results || []});
}

async function handleVehicleSave(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!(await canManageVehicles(db, user))) return fail('Машины бүртгэл өөрчлөх эрх байхгүй.', 403);
  const v = body.vehicle || {};
  const name = String(v.name || '').trim();
  if (!name) return fail('Машины дугаар / нэр хоосон байна.');
  const purpose = ['sludge','waste','short','product','support'].includes(v.purpose) ? v.purpose : 'support';
  const ownership = ['own','rental_product','rental_sludge'].includes(v.ownership) ? v.ownership : 'own';
  if (v.id) {
    await db.prepare(`UPDATE vehicles SET name=?, purpose=?, ownership=? WHERE id=?`)
      .bind(name, purpose, ownership, v.id).run();
  } else {
    await db.prepare(`INSERT INTO vehicles (name, purpose, ownership, active) VALUES (?, ?, ?, 1)`)
      .bind(name, purpose, ownership).run();
  }
  await logAction(db, user.id, 'vehicle_save', name, {purpose, ownership, id: v.id || 'new'});
  return await handleVehiclesList(db, body);
}

async function handleVehicleRemove(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!(await canManageVehicles(db, user))) return fail('Машины бүртгэл өөрчлөх эрх байхгүй.', 403);
  if (!body.id) return fail('Машины ID байхгүй.');
  await db.prepare(`UPDATE vehicles SET active = 0 WHERE id = ?`).bind(body.id).run();
  await logAction(db, user.id, 'vehicle_remove', String(body.id), {});
  return await handleVehiclesList(db, body);
}

/* ---------------------------------------------------------------
   Entry point
   --------------------------------------------------------------- */
export async function onRequest(context) {
  const {request, env} = context;
  if (!env.DB) return fail('DB binding тохируулаагүй байна.', 500);

  const route = routeOf(request);
  const method = request.method;

  try {
    if (method === 'GET'  && route === 'options') return await handleOptions(env.DB);
    if (method === 'POST' && route === 'login')    return await handleLogin(env.DB, await readBody(request));
    if (method === 'POST' && route === 'submit')   return await handleSubmit(env.DB, await readBody(request));
    if (method === 'POST' && route === 'daily')    return await handleDaily(env.DB, await readBody(request));
    if (method === 'POST' && route === 'monthly')  return await handleMonthly(env.DB, await readBody(request));
    if (method === 'POST' && route === 'vehicles')        return await handleVehiclesList(env.DB, await readBody(request));
    if (method === 'POST' && route === 'vehicles/save')   return await handleVehicleSave(env.DB, await readBody(request));
    if (method === 'POST' && route === 'vehicles/remove') return await handleVehicleRemove(env.DB, await readBody(request));
    return fail('API endpoint олдсонгүй: ' + route, 404);
  } catch (err) {
    return fail(err.message || 'Серверийн алдаа гарлаа.', 500);
  }
}

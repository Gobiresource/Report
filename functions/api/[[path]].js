function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function readJson(request) {
  try { return await request.json(); } catch (e) { return {}; }
}

function splitPath(request) {
  const url = new URL(request.url);
  return url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
}

async function getUser(env, username, pin) {
  if (!username || !pin) return null;
  return await env.DB.prepare(
    `SELECT id, username, name, role, department, active FROM users WHERE username = ? AND pin = ? LIMIT 1`
  ).bind(String(username).trim(), String(pin).trim()).first();
}

async function getPermissions(env, userId) {
  const rows = await env.DB.prepare(
    `SELECT report_type_key FROM user_report_permissions WHERE user_id = ? AND can_submit = 1`
  ).bind(userId).all();
  return (rows.results || []).map(r => r.report_type_key);
}

async function validateSubmitPermission(env, user, reportType) {
  if (!user || !user.active) return false;
  if (user.role === 'admin') return true;
  const row = await env.DB.prepare(
    `SELECT 1 AS ok FROM user_report_permissions WHERE user_id = ? AND report_type_key = ? AND can_submit = 1 LIMIT 1`
  ).bind(user.id, reportType).first();
  return !!row;
}

function isDashboardUser(user) {
  // Summary-г захирал, ажилтан бүгд харна — нэвтэрсэн идэвхтэй хэрэглэгч л байхад хангалттай
  return !!user && !!user.active;
}

function safeJson(value) {
  try { return JSON.parse(value || '{}'); } catch (e) { return {}; }
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = splitPath(request);

  if (!env.DB) return json({ ok: false, error: 'DB binding тохируулаагүй байна.' }, 500);

  try {
    // ---------- Тайлангийн төрлүүд (нээлттэй, зөвхөн нэрс) ----------
    if (request.method === 'GET' && path === 'options') {
      const types = await env.DB.prepare(
        `SELECT key, name, sort_order FROM report_types WHERE active = 1 ORDER BY sort_order`
      ).all();
      return json({ ok: true, report_types: types.results || [] });
    }

    // ---------- Нэвтрэх ----------
    if (request.method === 'POST' && path === 'login') {
      const body = await readJson(request);
      const user = await getUser(env, body.username, body.pin);
      if (!user || !user.active) return json({ ok: false, error: 'Нэвтрэх нэр эсвэл PIN буруу байна.' }, 401);
      const permissions = await getPermissions(env, user.id);
      await env.DB.prepare(
        `INSERT INTO audit_logs (user_id, action, target, new_data) VALUES (?, 'login', 'session', ?)`
      ).bind(user.id, JSON.stringify({ username: user.username, role: user.role })).run();
      return json({ ok: true, user, permissions });
    }

    // ---------- Тайлан илгээх (ажилтан) ----------
    if (request.method === 'POST' && path === 'submit') {
      const body = await readJson(request);
      const user = await getUser(env, body.username, body.pin);
      if (!user || !user.active) return json({ ok: false, error: 'Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.' }, 401);
      if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return json({ ok: false, error: 'Огноо буруу байна.' }, 400);
      if (!body.report_type) return json({ ok: false, error: 'Тайлангийн төрөл сонгогдоогүй байна.' }, 400);
      const allowed = await validateSubmitPermission(env, user, body.report_type);
      if (!allowed) return json({ ok: false, error: 'Танд энэ тайланг оруулах эрх байхгүй.' }, 403);
      const dataJson = JSON.stringify(body.data || {});
      await env.DB.prepare(
        `INSERT INTO reports (date, report_type, data_json, submitted_by, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(date, report_type, submitted_by)
         DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')`
      ).bind(body.date, body.report_type, dataJson, user.id).run();
      await env.DB.prepare(
        `INSERT INTO audit_logs (user_id, action, target, new_data) VALUES (?, 'submit_report', ?, ?)`
      ).bind(user.id, body.report_type, dataJson).run();
      return json({ ok: true });
    }

    // ---------- Өдрийн нэгтгэл (зөвхөн удирдлага) ----------
    if (request.method === 'POST' && path === 'daily') {
      const body = await readJson(request);
      const user = await getUser(env, body.username, body.pin);
      if (!isDashboardUser(user)) return json({ ok: false, error: 'Dashboard харах эрхгүй байна.' }, 403);
      const date = body.date;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ ok: false, error: 'Огноо буруу байна.' }, 400);
      const rows = await env.DB.prepare(
        `SELECT r.date, r.report_type, r.data_json, r.updated_at, u.name AS submitted_by_name
         FROM reports r LEFT JOIN users u ON u.id = r.submitted_by
         WHERE r.date = ? ORDER BY r.report_type, r.updated_at DESC`
      ).bind(date).all();
      // Нэг төрлөөс хамгийн сүүлд шинэчлэгдсэнийг л авна
      const seen = new Set();
      const reports = [];
      for (const r of (rows.results || [])) {
        if (seen.has(r.report_type)) continue;
        seen.add(r.report_type);
        reports.push({ ...r, data: safeJson(r.data_json) });
      }
      return json({ ok: true, date, reports });
    }

    // ---------- Сарын нэгтгэл (зөвхөн удирдлага) ----------
    if (request.method === 'POST' && path === 'monthly') {
      const body = await readJson(request);
      const user = await getUser(env, body.username, body.pin);
      if (!isDashboardUser(user)) return json({ ok: false, error: 'Dashboard харах эрхгүй байна.' }, 403);
      const month = body.month;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) return json({ ok: false, error: 'Сар буруу байна (YYYY-MM).' }, 400);
      const rows = await env.DB.prepare(
        `SELECT r.date, r.report_type, r.data_json, r.updated_at
         FROM reports r
         WHERE substr(r.date, 1, 7) = ?
         ORDER BY r.date, r.report_type, r.updated_at DESC`
      ).bind(month).all();
      // Өдөр + төрөл бүрээс хамгийн сүүлийн хувилбарыг авна
      const seen = new Set();
      const reports = [];
      for (const r of (rows.results || [])) {
        const key = r.date + '|' + r.report_type;
        if (seen.has(key)) continue;
        seen.add(key);
        reports.push({ date: r.date, report_type: r.report_type, data: safeJson(r.data_json) });
      }
      return json({ ok: true, month, reports });
    }

    return json({ ok: false, error: 'API endpoint олдсонгүй.', path }, 404);
  } catch (err) {
    return json({ ok: false, error: err.message || 'Серверийн алдаа' }, 500);
  }
}

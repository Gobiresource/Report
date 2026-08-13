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

// ---------- Сарын төлөвлөгөө ----------
async function handlePlanGet(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.month || !MONTH_RE.test(body.month)) return fail('Сар буруу байна (YYYY-MM).');
  const row = await db.prepare(
    `SELECT plan_json FROM monthly_plans WHERE month = ? LIMIT 1`
  ).bind(body.month).first();
  return ok({month: body.month, plan: row ? parseJsonColumn(row.plan_json) : {}});
}

async function handlePlanSave(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  // Төлөвлөгөө оруулах эрх: admin
  if (user.role !== 'admin') return fail('Сарын төлөвлөгөө зөвхөн админ оруулна.', 403);
  if (!body.month || !MONTH_RE.test(body.month)) return fail('Сар буруу байна (YYYY-MM).');
  const planJson = JSON.stringify(body.plan || {});
  await db.prepare(
    `INSERT INTO monthly_plans (month, plan_json, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(month) DO UPDATE SET plan_json = excluded.plan_json, updated_at = datetime('now')`
  ).bind(body.month, planJson).run();
  await logAction(db, user.id, 'plan_save', body.month, body.plan || {});
  return ok({month: body.month, plan: body.plan || {}});
}

// ---------- Хэрэглэгчийн удирдлага (зөвхөн admin) ----------
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
const PASSWORD_RE = /^\S{4,20}$/; // Нууц үг: 4-20 тэмдэгт, хоосон зайгүй
const REPORT_KEYS = ['production','transport','fuel','equipment','camp','hse','issue'];

async function requireAdmin(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return {err: fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401)};
  if (user.role !== 'admin') return {err: fail('Хэрэглэгчийн удирдлага зөвхөн админд нээлттэй.', 403)};
  return {user};
}

async function handleUsersList(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  const rows = await db.prepare(
    `SELECT id, username, name, role, department, active FROM users ORDER BY role = 'admin' DESC, active DESC, username`
  ).all();
  const perms = await db.prepare(
    `SELECT user_id, report_type_key FROM user_report_permissions WHERE can_submit = 1`
  ).all();
  const byUser = {};
  (perms.results || []).forEach(p => { (byUser[p.user_id] = byUser[p.user_id] || []).push(p.report_type_key); });
  const users = (rows.results || []).map(u => ({...u, permissions: byUser[u.id] || []}));
  return ok({users});
}

async function handleUserSetPin(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  const newPin = String(body.new_pin || '').trim();
  if (!targetId) return fail('Хэрэглэгчийн ID байхгүй.');
  if (!PASSWORD_RE.test(newPin)) return fail('Нууц үг 4-20 тэмдэгт байх ёстой (хоосон зайгүй).');
  const target = await db.prepare(`SELECT id, username FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail('Хэрэглэгч олдсонгүй.', 404);
  await db.prepare(`UPDATE users SET pin = ? WHERE id = ?`).bind(newPin, targetId).run();
  // Аюулгүй байдлын үүднээс шинэ нууц үгийг audit log-д БИЧИХГҮЙ
  await logAction(db, user.id, 'user_set_pin', target.username, {user_id: targetId});
  return await handleUsersList(db, body);
}

async function handleUserRename(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  const newUsername = String(body.new_username || '').trim();
  const newName = body.new_name !== undefined ? String(body.new_name || '').trim() : null;
  if (!targetId) return fail('Хэрэглэгчийн ID байхгүй.');
  if (!USERNAME_RE.test(newUsername)) return fail('Нэвтрэх нэр 3-20 тэмдэгт: латин үсэг, тоо, _ . - байж болно.');
  const target = await db.prepare(`SELECT id, username FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail('Хэрэглэгч олдсонгүй.', 404);
  const dup = await db.prepare(`SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1`).bind(newUsername, targetId).first();
  if (dup) return fail('Энэ нэвтрэх нэр аль хэдийн ашиглагдаж байна.');
  if (newName !== null && newName !== '') {
    await db.prepare(`UPDATE users SET username = ?, name = ? WHERE id = ?`).bind(newUsername, newName, targetId).run();
  } else {
    await db.prepare(`UPDATE users SET username = ? WHERE id = ?`).bind(newUsername, targetId).run();
  }
  await logAction(db, user.id, 'user_rename', target.username, {user_id: targetId, new_username: newUsername});
  return await handleUsersList(db, body);
}

async function handleUserCreate(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  const username = String(body.new_username || '').trim();
  const name = String(body.new_name || '').trim();
  const password = String(body.new_pin || '').trim();
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter(k => REPORT_KEYS.includes(k)) : [];
  if (!USERNAME_RE.test(username)) return fail('Нэвтрэх нэр 3-20 тэмдэгт: латин үсэг, тоо, _ . - байж болно.');
  if (!name) return fail('Ажилтны нэрийг оруулна уу (жишээ: Тээвэр Ууганбаяр).');
  if (!PASSWORD_RE.test(password)) return fail('Нууц үг 4-20 тэмдэгт байх ёстой (хоосон зайгүй).');
  if (!permissions.length) return fail('Дор хаяж нэг тайлангийн эрх сонгоно уу.');
  const dup = await db.prepare(`SELECT id FROM users WHERE username = ? LIMIT 1`).bind(username).first();
  if (dup) return fail('Энэ нэвтрэх нэр аль хэдийн ашиглагдаж байна.');
  const ins = await db.prepare(
    `INSERT INTO users (username, pin, name, role, department, active) VALUES (?, ?, ?, 'worker', ?, 1)`
  ).bind(username, password, name, permissions[0]).run();
  const newId = ins.meta && ins.meta.last_row_id;
  for (const key of permissions) {
    await db.prepare(
      `INSERT INTO user_report_permissions (user_id, report_type_key, can_submit) VALUES (?, ?, 1)`
    ).bind(newId, key).run();
  }
  await logAction(db, user.id, 'user_create', username, {name, permissions});
  return await handleUsersList(db, body);
}

async function handleUserToggle(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  if (!targetId) return fail('Хэрэглэгчийн ID байхгүй.');
  if (targetId === user.id) return fail('Өөрийгөө идэвхгүй болгох боломжгүй.');
  const target = await db.prepare(`SELECT id, username, active FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail('Хэрэглэгч олдсонгүй.', 404);
  const next = target.active ? 0 : 1;
  await db.prepare(`UPDATE users SET active = ? WHERE id = ?`).bind(next, targetId).run();
  await logAction(db, user.id, next ? 'user_activate' : 'user_deactivate', target.username, {user_id: targetId});
  return await handleUsersList(db, body);
}

// ---------- Хурлын тэмдэглэл ба даалгавар ----------
const TASK_STATUSES = ['open', 'done', 'postponed'];

/** Хурлын жагсаалт (сүүлийн 30) — нэвтэрсэн хэн ч харна */
async function handleMeetingsList(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  const rows = await db.prepare(
    `SELECT m.id, m.meeting_date, m.notes,
            (SELECT COUNT(*) FROM meeting_tasks t WHERE t.meeting_id = m.id) AS task_count,
            (SELECT COUNT(*) FROM meeting_tasks t WHERE t.meeting_id = m.id AND t.status = 'done') AS done_count
     FROM meetings m ORDER BY m.meeting_date DESC LIMIT 30`
  ).all();
  return ok({meetings: rows.results || []});
}

/** Нэг хурал + түүний даалгаврууд. Хурал байхгүй бол хоосон буцаана. */
async function handleMeetingGet(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.date || !DATE_RE.test(body.date)) return fail('Хурлын огноо буруу байна.');
  const meeting = await db.prepare(
    `SELECT id, meeting_date, notes, updated_at FROM meetings WHERE meeting_date = ? LIMIT 1`
  ).bind(body.date).first();
  if (!meeting) return ok({meeting: null, tasks: [], prev: null, prev_tasks: []});

  const tasks = await db.prepare(
    `SELECT t.id, t.task_text, t.assignee_id, t.due_date, t.status, t.worker_note, t.sort_order,
            u.name AS assignee_name, u.username AS assignee_username
     FROM meeting_tasks t LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.meeting_id = ? ORDER BY t.sort_order, t.id`
  ).bind(meeting.id).all();

  // Өмнөх хурлын даалгавар — хурал дээр эргэж шалгах зорилгоор
  const prev = await db.prepare(
    `SELECT id, meeting_date FROM meetings WHERE meeting_date < ? ORDER BY meeting_date DESC LIMIT 1`
  ).bind(body.date).first();
  let prevTasks = [];
  if (prev) {
    const pt = await db.prepare(
      `SELECT t.id, t.task_text, t.assignee_id, t.due_date, t.status, t.worker_note,
              u.name AS assignee_name
       FROM meeting_tasks t LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.meeting_id = ? ORDER BY t.sort_order, t.id`
    ).bind(prev.id).all();
    prevTasks = pt.results || [];
  }
  return ok({meeting, tasks: tasks.results || [], prev: prev || null, prev_tasks: prevTasks});
}

/** Хурал үүсгэх/хадгалах — тэмдэглэл + бүх даалгавар (admin) */
async function handleMeetingSave(db, body) {
  const {user, err} = await requireAdmin(db, body);
  if (err) return err;
  if (!body.date || !DATE_RE.test(body.date)) return fail('Хурлын огноо буруу байна.');

  const notes = String(body.notes || '').slice(0, 8000);
  await db.prepare(
    `INSERT INTO meetings (meeting_date, notes, created_by, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(meeting_date) DO UPDATE SET notes = excluded.notes, updated_at = datetime('now')`
  ).bind(body.date, notes, user.id).run();

  const meeting = await db.prepare(`SELECT id FROM meetings WHERE meeting_date = ? LIMIT 1`)
    .bind(body.date).first();

  // Даалгаврууд: бүтнээр нь солино. Ажилтны сонгосон төлөв/тайлбарыг
  // хадгалахын тулд client нь id-тайгаа буцааж илгээдэг.
  if (Array.isArray(body.tasks)) {
    const incoming = body.tasks
      .map((t, i) => ({
        id: t.id ? parseInt(t.id, 10) : null,
        task_text: String(t.task_text || '').trim().slice(0, 1000),
        assignee_id: t.assignee_id ? parseInt(t.assignee_id, 10) : null,
        due_date: (t.due_date && DATE_RE.test(t.due_date)) ? t.due_date : null,
        status: TASK_STATUSES.includes(t.status) ? t.status : 'open',
        worker_note: String(t.worker_note || '').slice(0, 1000),
        sort_order: i
      }))
      .filter(t => t.task_text);

    const keepIds = incoming.filter(t => t.id).map(t => t.id);
    if (keepIds.length) {
      await db.prepare(
        `DELETE FROM meeting_tasks WHERE meeting_id = ? AND id NOT IN (${keepIds.map(() => '?').join(',')})`
      ).bind(meeting.id, ...keepIds).run();
    } else {
      await db.prepare(`DELETE FROM meeting_tasks WHERE meeting_id = ?`).bind(meeting.id).run();
    }

    for (const t of incoming) {
      if (t.id) {
        await db.prepare(
          `UPDATE meeting_tasks SET task_text=?, assignee_id=?, due_date=?, status=?,
                  worker_note=?, sort_order=?, updated_at=datetime('now')
           WHERE id=? AND meeting_id=?`
        ).bind(t.task_text, t.assignee_id, t.due_date, t.status, t.worker_note, t.sort_order, t.id, meeting.id).run();
      } else {
        await db.prepare(
          `INSERT INTO meeting_tasks (meeting_id, task_text, assignee_id, due_date, status, worker_note, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(meeting.id, t.task_text, t.assignee_id, t.due_date, t.status, t.worker_note, t.sort_order).run();
      }
    }
  }
  await logAction(db, user.id, 'meeting_save', body.date, {tasks: (body.tasks || []).length});
  return await handleMeetingGet(db, body);
}

/** Ажилтанд оногдсон даалгаврууд (өөрийн) */
async function handleMyTasks(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  const rows = await db.prepare(
    `SELECT t.id, t.task_text, t.due_date, t.status, t.worker_note, m.meeting_date
     FROM meeting_tasks t JOIN meetings m ON m.id = t.meeting_id
     WHERE t.assignee_id = ?
     ORDER BY (t.status = 'done') ASC, COALESCE(t.due_date, m.meeting_date) ASC
     LIMIT 60`
  ).bind(user.id).all();
  return ok({tasks: rows.results || []});
}

/** Ажилтан өөрийн даалгаврын төлөв + тайлбарыг шинэчилнэ */
async function handleTaskStatus(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  const taskId = parseInt(body.task_id, 10);
  if (!taskId) return fail('Даалгаврын ID байхгүй.');
  const status = TASK_STATUSES.includes(body.status) ? body.status : null;
  if (!status) return fail('Төлөв буруу байна.');
  const note = String(body.worker_note || '').slice(0, 1000);

  const task = await db.prepare(`SELECT id, assignee_id FROM meeting_tasks WHERE id = ? LIMIT 1`)
    .bind(taskId).first();
  if (!task) return fail('Даалгавар олдсонгүй.', 404);
  // Зөвхөн хариуцагч өөрөө эсвэл админ өөрчилнө
  if (user.role !== 'admin' && task.assignee_id !== user.id) {
    return fail('Энэ даалгаврыг өөрчлөх эрх байхгүй.', 403);
  }
  await db.prepare(
    `UPDATE meeting_tasks SET status = ?, worker_note = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(status, note, taskId).run();
  await logAction(db, user.id, 'task_status', String(taskId), {status});
  return await handleMyTasks(db, body);
}

/** Хугацааны интервалын тайлан (хурлын гүйцэтгэлийн хэсэгт) */
async function handleRange(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail('Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.', 401);
  if (!body.from || !DATE_RE.test(body.from)) return fail('Эхлэх огноо буруу байна.');
  if (!body.to || !DATE_RE.test(body.to)) return fail('Дуусах огноо буруу байна.');

  // submitted_by_name ба updated_at-ыг МӨН буцаана — самбарын «Тайлангийн ирц»
  // хэсэг «Илгээсэн: 09:05 · Тээвэр ажилтан» гэж бичихэд эдгээр шаардлагатай.
  const rows = await db.prepare(
    `SELECT r.date, r.report_type, r.data_json, r.updated_at, u.name AS submitted_by_name
     FROM reports r LEFT JOIN users u ON u.id = r.submitted_by
     WHERE r.date >= ? AND r.date <= ?
     ORDER BY r.date, r.report_type, r.updated_at DESC`
  ).bind(body.from, body.to).all();

  const seen = new Set();
  const reports = [];
  for (const row of (rows.results || [])) {
    const key = row.date + '|' + row.report_type;
    if (seen.has(key)) continue;
    seen.add(key);
    reports.push({date: row.date, report_type: row.report_type, updated_at: row.updated_at,
                  submitted_by_name: row.submitted_by_name, data: parseJsonColumn(row.data_json)});
  }

  // Тухайн хугацаанд ӨГСӨН даалгаврууд (хурлын огноогоор шүүнэ).
  // Хүснэгт үүсээгүй бол алдаа гаргалгүй хоосон буцаана.
  let tasks = [];
  try {
    const tr = await db.prepare(
      `SELECT t.id, t.task_text, t.due_date, t.status, t.worker_note,
              m.meeting_date, u.name AS assignee_name
       FROM meeting_tasks t
       JOIN meetings m ON m.id = t.meeting_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE m.meeting_date >= ? AND m.meeting_date <= ?
       ORDER BY m.meeting_date DESC, t.sort_order, t.id`
    ).bind(body.from, body.to).all();
    tasks = tr.results || [];
  } catch (e) { tasks = []; }

  return ok({from: body.from, to: body.to, reports, tasks});
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
    if (method === 'POST' && route === 'plan')       return await handlePlanGet(env.DB, await readBody(request));
    if (method === 'POST' && route === 'plan/save')  return await handlePlanSave(env.DB, await readBody(request));
    if (method === 'POST' && route === 'users')        return await handleUsersList(env.DB, await readBody(request));
    if (method === 'POST' && route === 'users/setpin') return await handleUserSetPin(env.DB, await readBody(request));
    if (method === 'POST' && route === 'users/rename') return await handleUserRename(env.DB, await readBody(request));
    if (method === 'POST' && route === 'users/create') return await handleUserCreate(env.DB, await readBody(request));
    if (method === 'POST' && route === 'users/toggle') return await handleUserToggle(env.DB, await readBody(request));
    if (method === 'POST' && route === 'meetings')       return await handleMeetingsList(env.DB, await readBody(request));
    if (method === 'POST' && route === 'meeting')        return await handleMeetingGet(env.DB, await readBody(request));
    if (method === 'POST' && route === 'meeting/save')   return await handleMeetingSave(env.DB, await readBody(request));
    if (method === 'POST' && route === 'tasks/mine')     return await handleMyTasks(env.DB, await readBody(request));
    if (method === 'POST' && route === 'tasks/status')   return await handleTaskStatus(env.DB, await readBody(request));
    if (method === 'POST' && route === 'range')          return await handleRange(env.DB, await readBody(request));
    return fail('API endpoint олдсонгүй: ' + route, 404);
  } catch (err) {
    return fail(err.message || 'Серверийн алдаа гарлаа.', 500);
  }
}

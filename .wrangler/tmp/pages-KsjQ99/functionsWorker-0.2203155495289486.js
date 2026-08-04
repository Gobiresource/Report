var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/[[path]].js
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var MONTH_RE = /^\d{4}-\d{2}$/;
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
__name(jsonResponse, "jsonResponse");
function fail(message, status = 400) {
  return jsonResponse({ ok: false, error: message }, status);
}
__name(fail, "fail");
function ok(payload) {
  return jsonResponse({ ok: true, ...payload });
}
__name(ok, "ok");
async function readBody(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}
__name(readBody, "readBody");
function routeOf(request) {
  return new URL(request.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
}
__name(routeOf, "routeOf");
function parseJsonColumn(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}
__name(parseJsonColumn, "parseJsonColumn");
async function findUser(db, username, pin) {
  if (!username || !pin) return null;
  return db.prepare(
    `SELECT id, username, name, role, department, active
     FROM users WHERE username = ? AND pin = ? LIMIT 1`
  ).bind(String(username).trim(), String(pin).trim()).first();
}
__name(findUser, "findUser");
async function permissionsFor(db, userId) {
  const rows = await db.prepare(
    `SELECT report_type_key FROM user_report_permissions WHERE user_id = ? AND can_submit = 1`
  ).bind(userId).all();
  return (rows.results || []).map((row) => row.report_type_key);
}
__name(permissionsFor, "permissionsFor");
async function canSubmit(db, user, reportType) {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  const row = await db.prepare(
    `SELECT 1 FROM user_report_permissions WHERE user_id = ? AND report_type_key = ? AND can_submit = 1 LIMIT 1`
  ).bind(user.id, reportType).first();
  return !!row;
}
__name(canSubmit, "canSubmit");
async function logAction(db, userId, action, target, payload) {
  await db.prepare(
    `INSERT INTO audit_logs (user_id, action, target, new_data) VALUES (?, ?, ?, ?)`
  ).bind(userId, action, target, JSON.stringify(payload)).run();
}
__name(logAction, "logAction");
async function handleOptions(db) {
  const rows = await db.prepare(
    `SELECT key, name, sort_order FROM report_types WHERE active = 1 ORDER BY sort_order`
  ).all();
  return ok({ report_types: rows.results || [] });
}
__name(handleOptions, "handleOptions");
async function handleLogin(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u0445 \u043D\u044D\u0440 \u044D\u0441\u0432\u044D\u043B PIN \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430.", 401);
  const permissions = await permissionsFor(db, user.id);
  await logAction(db, user.id, "login", "session", { username: user.username, role: user.role });
  return ok({ user, permissions });
}
__name(handleLogin, "handleLogin");
async function handleSubmit(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!body.date || !DATE_RE.test(body.date)) return fail("\u041E\u0433\u043D\u043E\u043E \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430.");
  if (!body.report_type) return fail("\u0422\u0430\u0439\u043B\u0430\u043D\u0433\u0438\u0439\u043D \u0442\u04E9\u0440\u04E9\u043B \u0441\u043E\u043D\u0433\u043E\u0433\u0434\u043E\u043E\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430.");
  const allowed = await canSubmit(db, user, body.report_type);
  if (!allowed) return fail("\u0422\u0430\u043D\u0434 \u044D\u043D\u044D \u0442\u0430\u0439\u043B\u0430\u043D\u0433 \u043E\u0440\u0443\u0443\u043B\u0430\u0445 \u044D\u0440\u0445 \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.", 403);
  const dataJson = JSON.stringify(body.data || {});
  await db.prepare(
    `INSERT INTO reports (date, report_type, data_json, submitted_by, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date, report_type, submitted_by)
     DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')`
  ).bind(body.date, body.report_type, dataJson, user.id).run();
  await logAction(db, user.id, "submit_report", body.report_type, body.data || {});
  return ok({});
}
__name(handleSubmit, "handleSubmit");
async function handleDaily(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!body.date || !DATE_RE.test(body.date)) return fail("\u041E\u0433\u043D\u043E\u043E \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430.");
  const rows = await db.prepare(
    `SELECT r.date, r.report_type, r.data_json, r.updated_at, u.name AS submitted_by_name
     FROM reports r LEFT JOIN users u ON u.id = r.submitted_by
     WHERE r.date = ? ORDER BY r.report_type, r.updated_at DESC`
  ).bind(body.date).all();
  const seen = /* @__PURE__ */ new Set();
  const reports = [];
  for (const row of rows.results || []) {
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
  return ok({ date: body.date, reports });
}
__name(handleDaily, "handleDaily");
async function handleMonthly(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!body.month || !MONTH_RE.test(body.month)) return fail("\u0421\u0430\u0440 \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430 (YYYY-MM).");
  const rows = await db.prepare(
    `SELECT r.date, r.report_type, r.data_json, r.updated_at
     FROM reports r WHERE substr(r.date, 1, 7) = ?
     ORDER BY r.date, r.report_type, r.updated_at DESC`
  ).bind(body.month).all();
  const seen = /* @__PURE__ */ new Set();
  const reports = [];
  for (const row of rows.results || []) {
    const key = row.date + "|" + row.report_type;
    if (seen.has(key)) continue;
    seen.add(key);
    reports.push({ date: row.date, report_type: row.report_type, data: parseJsonColumn(row.data_json) });
  }
  return ok({ month: body.month, reports });
}
__name(handleMonthly, "handleMonthly");
async function canManageVehicles(db, user) {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  return await canSubmit(db, user, "transport");
}
__name(canManageVehicles, "canManageVehicles");
async function handleVehiclesList(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  const rows = await db.prepare(
    `SELECT id, name, purpose, ownership FROM vehicles WHERE active = 1 ORDER BY ownership, sort_order, id`
  ).all();
  return ok({ vehicles: rows.results || [] });
}
__name(handleVehiclesList, "handleVehiclesList");
async function handleVehicleSave(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!await canManageVehicles(db, user)) return fail("\u041C\u0430\u0448\u0438\u043D\u044B \u0431\u04AF\u0440\u0442\u0433\u044D\u043B \u04E9\u04E9\u0440\u0447\u043B\u04E9\u0445 \u044D\u0440\u0445 \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.", 403);
  const v = body.vehicle || {};
  const name = String(v.name || "").trim();
  if (!name) return fail("\u041C\u0430\u0448\u0438\u043D\u044B \u0434\u0443\u0433\u0430\u0430\u0440 / \u043D\u044D\u0440 \u0445\u043E\u043E\u0441\u043E\u043D \u0431\u0430\u0439\u043D\u0430.");
  const purpose = ["sludge", "waste", "short", "product", "support"].includes(v.purpose) ? v.purpose : "support";
  const ownership = ["own", "rental_product", "rental_sludge"].includes(v.ownership) ? v.ownership : "own";
  if (v.id) {
    await db.prepare(`UPDATE vehicles SET name=?, purpose=?, ownership=? WHERE id=?`).bind(name, purpose, ownership, v.id).run();
  } else {
    await db.prepare(`INSERT INTO vehicles (name, purpose, ownership, active) VALUES (?, ?, ?, 1)`).bind(name, purpose, ownership).run();
  }
  await logAction(db, user.id, "vehicle_save", name, { purpose, ownership, id: v.id || "new" });
  return await handleVehiclesList(db, body);
}
__name(handleVehicleSave, "handleVehicleSave");
async function handleVehicleRemove(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!await canManageVehicles(db, user)) return fail("\u041C\u0430\u0448\u0438\u043D\u044B \u0431\u04AF\u0440\u0442\u0433\u044D\u043B \u04E9\u04E9\u0440\u0447\u043B\u04E9\u0445 \u044D\u0440\u0445 \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.", 403);
  if (!body.id) return fail("\u041C\u0430\u0448\u0438\u043D\u044B ID \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.");
  await db.prepare(`UPDATE vehicles SET active = 0 WHERE id = ?`).bind(body.id).run();
  await logAction(db, user.id, "vehicle_remove", String(body.id), {});
  return await handleVehiclesList(db, body);
}
__name(handleVehicleRemove, "handleVehicleRemove");
async function handlePlanGet(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (!body.month || !MONTH_RE.test(body.month)) return fail("\u0421\u0430\u0440 \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430 (YYYY-MM).");
  const row = await db.prepare(
    `SELECT plan_json FROM monthly_plans WHERE month = ? LIMIT 1`
  ).bind(body.month).first();
  return ok({ month: body.month, plan: row ? parseJsonColumn(row.plan_json) : {} });
}
__name(handlePlanGet, "handlePlanGet");
async function handlePlanSave(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401);
  if (user.role !== "admin") return fail("\u0421\u0430\u0440\u044B\u043D \u0442\u04E9\u043B\u04E9\u0432\u043B\u04E9\u0433\u04E9\u04E9 \u0437\u04E9\u0432\u0445\u04E9\u043D \u0430\u0434\u043C\u0438\u043D \u043E\u0440\u0443\u0443\u043B\u043D\u0430.", 403);
  if (!body.month || !MONTH_RE.test(body.month)) return fail("\u0421\u0430\u0440 \u0431\u0443\u0440\u0443\u0443 \u0431\u0430\u0439\u043D\u0430 (YYYY-MM).");
  const planJson = JSON.stringify(body.plan || {});
  await db.prepare(
    `INSERT INTO monthly_plans (month, plan_json, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(month) DO UPDATE SET plan_json = excluded.plan_json, updated_at = datetime('now')`
  ).bind(body.month, planJson).run();
  await logAction(db, user.id, "plan_save", body.month, body.plan || {});
  return ok({ month: body.month, plan: body.plan || {} });
}
__name(handlePlanSave, "handlePlanSave");
var USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;
var PASSWORD_RE = /^\S{4,20}$/;
var REPORT_KEYS = ["production", "transport", "fuel", "equipment", "camp", "hse", "issue"];
async function requireAdmin(db, body) {
  const user = await findUser(db, body.username, body.pin);
  if (!user || !user.active) return { err: fail("\u041D\u044D\u0432\u0442\u0440\u044D\u043B\u0442 \u0445\u04AF\u0447\u0438\u043D\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0414\u0430\u0445\u0438\u043D \u043D\u044D\u0432\u0442\u044D\u0440\u043D\u044D \u04AF\u04AF.", 401) };
  if (user.role !== "admin") return { err: fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u043D \u0443\u0434\u0438\u0440\u0434\u043B\u0430\u0433\u0430 \u0437\u04E9\u0432\u0445\u04E9\u043D \u0430\u0434\u043C\u0438\u043D\u0434 \u043D\u044D\u044D\u043B\u0442\u0442\u044D\u0439.", 403) };
  return { user };
}
__name(requireAdmin, "requireAdmin");
async function handleUsersList(db, body) {
  const { user, err } = await requireAdmin(db, body);
  if (err) return err;
  const rows = await db.prepare(
    `SELECT id, username, name, role, department, active FROM users ORDER BY role = 'admin' DESC, active DESC, username`
  ).all();
  const perms = await db.prepare(
    `SELECT user_id, report_type_key FROM user_report_permissions WHERE can_submit = 1`
  ).all();
  const byUser = {};
  (perms.results || []).forEach((p) => {
    (byUser[p.user_id] = byUser[p.user_id] || []).push(p.report_type_key);
  });
  const users = (rows.results || []).map((u) => ({ ...u, permissions: byUser[u.id] || [] }));
  return ok({ users });
}
__name(handleUsersList, "handleUsersList");
async function handleUserSetPin(db, body) {
  const { user, err } = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  const newPin = String(body.new_pin || "").trim();
  if (!targetId) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u043D ID \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.");
  if (!PASSWORD_RE.test(newPin)) return fail("\u041D\u0443\u0443\u0446 \u04AF\u0433 4-20 \u0442\u044D\u043C\u0434\u044D\u0433\u0442 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439 (\u0445\u043E\u043E\u0441\u043E\u043D \u0437\u0430\u0439\u0433\u04AF\u0439).");
  const target = await db.prepare(`SELECT id, username FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447 \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439.", 404);
  await db.prepare(`UPDATE users SET pin = ? WHERE id = ?`).bind(newPin, targetId).run();
  await logAction(db, user.id, "user_set_pin", target.username, { user_id: targetId });
  return await handleUsersList(db, body);
}
__name(handleUserSetPin, "handleUserSetPin");
async function handleUserRename(db, body) {
  const { user, err } = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  const newUsername = String(body.new_username || "").trim();
  const newName = body.new_name !== void 0 ? String(body.new_name || "").trim() : null;
  if (!targetId) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u043D ID \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.");
  if (!USERNAME_RE.test(newUsername)) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u0445 \u043D\u044D\u0440 3-20 \u0442\u044D\u043C\u0434\u044D\u0433\u0442: \u043B\u0430\u0442\u0438\u043D \u04AF\u0441\u044D\u0433, \u0442\u043E\u043E, _ . - \u0431\u0430\u0439\u0436 \u0431\u043E\u043B\u043D\u043E.");
  const target = await db.prepare(`SELECT id, username FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447 \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439.", 404);
  const dup = await db.prepare(`SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1`).bind(newUsername, targetId).first();
  if (dup) return fail("\u042D\u043D\u044D \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u043D\u044D\u0440 \u0430\u043B\u044C \u0445\u044D\u0434\u0438\u0439\u043D \u0430\u0448\u0438\u0433\u043B\u0430\u0433\u0434\u0430\u0436 \u0431\u0430\u0439\u043D\u0430.");
  if (newName !== null && newName !== "") {
    await db.prepare(`UPDATE users SET username = ?, name = ? WHERE id = ?`).bind(newUsername, newName, targetId).run();
  } else {
    await db.prepare(`UPDATE users SET username = ? WHERE id = ?`).bind(newUsername, targetId).run();
  }
  await logAction(db, user.id, "user_rename", target.username, { user_id: targetId, new_username: newUsername });
  return await handleUsersList(db, body);
}
__name(handleUserRename, "handleUserRename");
async function handleUserCreate(db, body) {
  const { user, err } = await requireAdmin(db, body);
  if (err) return err;
  const username = String(body.new_username || "").trim();
  const name = String(body.new_name || "").trim();
  const password = String(body.new_pin || "").trim();
  const permissions = Array.isArray(body.permissions) ? body.permissions.filter((k) => REPORT_KEYS.includes(k)) : [];
  if (!USERNAME_RE.test(username)) return fail("\u041D\u044D\u0432\u0442\u0440\u044D\u0445 \u043D\u044D\u0440 3-20 \u0442\u044D\u043C\u0434\u044D\u0433\u0442: \u043B\u0430\u0442\u0438\u043D \u04AF\u0441\u044D\u0433, \u0442\u043E\u043E, _ . - \u0431\u0430\u0439\u0436 \u0431\u043E\u043B\u043D\u043E.");
  if (!name) return fail("\u0410\u0436\u0438\u043B\u0442\u043D\u044B \u043D\u044D\u0440\u0438\u0439\u0433 \u043E\u0440\u0443\u0443\u043B\u043D\u0430 \u0443\u0443 (\u0436\u0438\u0448\u044D\u044D: \u0422\u044D\u044D\u0432\u044D\u0440 \u0423\u0443\u0433\u0430\u043D\u0431\u0430\u044F\u0440).");
  if (!PASSWORD_RE.test(password)) return fail("\u041D\u0443\u0443\u0446 \u04AF\u0433 4-20 \u0442\u044D\u043C\u0434\u044D\u0433\u0442 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439 (\u0445\u043E\u043E\u0441\u043E\u043D \u0437\u0430\u0439\u0433\u04AF\u0439).");
  if (!permissions.length) return fail("\u0414\u043E\u0440 \u0445\u0430\u044F\u0436 \u043D\u044D\u0433 \u0442\u0430\u0439\u043B\u0430\u043D\u0433\u0438\u0439\u043D \u044D\u0440\u0445 \u0441\u043E\u043D\u0433\u043E\u043D\u043E \u0443\u0443.");
  const dup = await db.prepare(`SELECT id FROM users WHERE username = ? LIMIT 1`).bind(username).first();
  if (dup) return fail("\u042D\u043D\u044D \u043D\u044D\u0432\u0442\u0440\u044D\u0445 \u043D\u044D\u0440 \u0430\u043B\u044C \u0445\u044D\u0434\u0438\u0439\u043D \u0430\u0448\u0438\u0433\u043B\u0430\u0433\u0434\u0430\u0436 \u0431\u0430\u0439\u043D\u0430.");
  const ins = await db.prepare(
    `INSERT INTO users (username, pin, name, role, department, active) VALUES (?, ?, ?, 'worker', ?, 1)`
  ).bind(username, password, name, permissions[0]).run();
  const newId = ins.meta && ins.meta.last_row_id;
  for (const key of permissions) {
    await db.prepare(
      `INSERT INTO user_report_permissions (user_id, report_type_key, can_submit) VALUES (?, ?, 1)`
    ).bind(newId, key).run();
  }
  await logAction(db, user.id, "user_create", username, { name, permissions });
  return await handleUsersList(db, body);
}
__name(handleUserCreate, "handleUserCreate");
async function handleUserToggle(db, body) {
  const { user, err } = await requireAdmin(db, body);
  if (err) return err;
  const targetId = parseInt(body.user_id, 10);
  if (!targetId) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447\u0438\u0439\u043D ID \u0431\u0430\u0439\u0445\u0433\u04AF\u0439.");
  if (targetId === user.id) return fail("\u04E8\u04E9\u0440\u0438\u0439\u0433\u04E9\u04E9 \u0438\u0434\u044D\u0432\u0445\u0433\u04AF\u0439 \u0431\u043E\u043B\u0433\u043E\u0445 \u0431\u043E\u043B\u043E\u043C\u0436\u0433\u04AF\u0439.");
  const target = await db.prepare(`SELECT id, username, active FROM users WHERE id = ? LIMIT 1`).bind(targetId).first();
  if (!target) return fail("\u0425\u044D\u0440\u044D\u0433\u043B\u044D\u0433\u0447 \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439.", 404);
  const next = target.active ? 0 : 1;
  await db.prepare(`UPDATE users SET active = ? WHERE id = ?`).bind(next, targetId).run();
  await logAction(db, user.id, next ? "user_activate" : "user_deactivate", target.username, { user_id: targetId });
  return await handleUsersList(db, body);
}
__name(handleUserToggle, "handleUserToggle");
async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return fail("DB binding \u0442\u043E\u0445\u0438\u0440\u0443\u0443\u043B\u0430\u0430\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430.", 500);
  const route = routeOf(request);
  const method = request.method;
  try {
    if (method === "GET" && route === "options") return await handleOptions(env.DB);
    if (method === "POST" && route === "login") return await handleLogin(env.DB, await readBody(request));
    if (method === "POST" && route === "submit") return await handleSubmit(env.DB, await readBody(request));
    if (method === "POST" && route === "daily") return await handleDaily(env.DB, await readBody(request));
    if (method === "POST" && route === "monthly") return await handleMonthly(env.DB, await readBody(request));
    if (method === "POST" && route === "vehicles") return await handleVehiclesList(env.DB, await readBody(request));
    if (method === "POST" && route === "vehicles/save") return await handleVehicleSave(env.DB, await readBody(request));
    if (method === "POST" && route === "vehicles/remove") return await handleVehicleRemove(env.DB, await readBody(request));
    if (method === "POST" && route === "plan") return await handlePlanGet(env.DB, await readBody(request));
    if (method === "POST" && route === "plan/save") return await handlePlanSave(env.DB, await readBody(request));
    if (method === "POST" && route === "users") return await handleUsersList(env.DB, await readBody(request));
    if (method === "POST" && route === "users/setpin") return await handleUserSetPin(env.DB, await readBody(request));
    if (method === "POST" && route === "users/rename") return await handleUserRename(env.DB, await readBody(request));
    if (method === "POST" && route === "users/create") return await handleUserCreate(env.DB, await readBody(request));
    if (method === "POST" && route === "users/toggle") return await handleUserToggle(env.DB, await readBody(request));
    return fail("API endpoint \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439: " + route, 404);
  } catch (err) {
    return fail(err.message || "\u0421\u0435\u0440\u0432\u0435\u0440\u0438\u0439\u043D \u0430\u043B\u0434\u0430\u0430 \u0433\u0430\u0440\u043B\u0430\u0430.", 500);
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-KsjQ99/functionsRoutes-0.279460356372655.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../AppData/Local/hermes/node/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../AppData/Local/hermes/node/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};

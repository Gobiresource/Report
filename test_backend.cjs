/* End-to-end тест: жинхэнэ schema.sql + жинхэнэ API кодыг SQLite дээр ажиллуулна */
const {DatabaseSync} = require('node:sqlite');
const fs = require('fs');
const path = require('path');

// ---- D1 mock (Cloudflare D1-ийн prepare/bind/first/all/run интерфэйс) ----
function makeD1(sqliteDb){
  return {
    prepare(sql){
      return {
        bind(...params){
          return {
            first(){
              const stmt = sqliteDb.prepare(sql);
              return stmt.get(...params) ?? null;
            },
            all(){
              const stmt = sqliteDb.prepare(sql);
              return {results: stmt.all(...params)};
            },
            run(){
              const stmt = sqliteDb.prepare(sql);
              stmt.run(...params);
              return {success:true};
            }
          };
        },
        all(){
          const stmt = sqliteDb.prepare(sql);
          return {results: stmt.all()};
        }
      };
    }
  };
}

// ---- Тестийн туслахууд ----
let passed = 0, failed = 0;
function check(name, cond, extra){
  if(cond){ passed++; console.log('  PASS  ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (extra ? '  -> ' + JSON.stringify(extra) : '')); }
}

async function callApi(onRequest, env, method, route, body){
  const request = new Request('https://example.com/api/' + route, {
    method,
    headers: {'content-type':'application/json'},
    body: method === 'GET' ? undefined : JSON.stringify(body || {})
  });
  const res = await onRequest({request, env});
  const data = JSON.parse(await res.text());
  return {status: res.status, data};
}

(async () => {
  // 1. Жинхэнэ schema.sql-г ачаална
  const db = new DatabaseSync(':memory:');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('schema.sql loaded OK');

  // 2. Жинхэнэ API кодыг import хийнэ
  const apiPath = path.join(__dirname, 'functions/api/[[path]].js');
  let apiSrc = fs.readFileSync(apiPath, 'utf8');
  apiSrc = apiSrc.replace(/export async function onRequest/,'async function onRequest')
    + '\nmodule.exports = {onRequest};';
  const tmp = path.join(__dirname, '.api_test_tmp.cjs');
  fs.writeFileSync(tmp, apiSrc);
  const {onRequest} = require(tmp);
  const env = {DB: makeD1(db)};

  console.log('\n== /api/options ==');
  let r = await callApi(onRequest, env, 'GET', 'options');
  check('options returns 200', r.status === 200);
  check('7 report types', r.data.report_types?.length === 7, r.data);

  console.log('\n== /api/login ==');
  r = await callApi(onRequest, env, 'POST', 'login', {username:'admin', pin:'9999'});
  check('admin login OK', r.status === 200 && r.data.user?.role === 'admin');
  r = await callApi(onRequest, env, 'POST', 'login', {username:'teever', pin:'2222'});
  check('teever login OK', r.status === 200 && r.data.user?.role === 'worker');
  check('teever permission = transport', JSON.stringify(r.data.permissions) === '["transport"]', r.data.permissions);
  const teever = r.data.user;
  r = await callApi(onRequest, env, 'POST', 'login', {username:'teever', pin:'0000'});
  check('wrong PIN rejected 401', r.status === 401);
  r = await callApi(onRequest, env, 'POST', 'login', {username:'', pin:''});
  check('empty login rejected', r.status === 401);

  console.log('\n== /api/submit ==');
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', report_type:'transport', date:'2026-07-02',
    data:{sludge_ton:'120', waste_ton:'80', short_waste_ton:'10', product_transport_ton:'300', sludge_trips:'12', weighbridge_net_ton:'295'}
  });
  check('teever submits transport OK', r.status === 200, r.data);
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', report_type:'fuel', date:'2026-07-02', data:{fuel_truck_machine_liter:'999'}
  });
  check('teever CANNOT submit fuel (403)', r.status === 403, r.data);
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', report_type:'transport', date:'02-07-2026', data:{}
  });
  check('bad date rejected', r.status === 400);
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', date:'2026-07-02', data:{}
  });
  check('missing report_type rejected', r.status === 400);
  // Давхар илгээлт: ON CONFLICT update ажиллах ёстой
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', report_type:'transport', date:'2026-07-02',
    data:{sludge_ton:'150', waste_ton:'80', short_waste_ton:'10', product_transport_ton:'300'}
  });
  check('resubmit same day updates (200)', r.status === 200, r.data);
  const rowCount = db.prepare("SELECT COUNT(*) c FROM reports WHERE date='2026-07-02' AND report_type='transport'").get().c;
  check('no duplicate row after resubmit', rowCount === 1, {rowCount});
  // admin can submit anything
  r = await callApi(onRequest, env, 'POST', 'submit', {
    username:'admin', pin:'9999', report_type:'hse', date:'2026-07-02',
    data:{hse_violation_count:'1', medical_assistance_count:'0', day_temp_c:'31'}
  });
  check('admin submits hse OK', r.status === 200, r.data);

  console.log('\n== /api/daily ==');
  r = await callApi(onRequest, env, 'POST', 'daily', {username:'admin', pin:'9999', date:'2026-07-02'});
  check('admin daily OK', r.status === 200);
  check('daily has 2 reports', r.data.reports?.length === 2, r.data.reports?.map(x=>x.report_type));
  const tr = r.data.reports.find(x=>x.report_type==='transport');
  check('resubmitted value visible (sludge=150)', tr?.data?.sludge_ton === '150', tr?.data);
  check('submitted_by_name present', !!tr?.submitted_by_name, tr);
  // ажилтан ч мөн харна (шинэ шаардлага)
  r = await callApi(onRequest, env, 'POST', 'daily', {username:'camp', pin:'5555', date:'2026-07-02'});
  check('worker (camp) can view daily', r.status === 200 && r.data.reports?.length === 2);
  r = await callApi(onRequest, env, 'POST', 'daily', {username:'camp', pin:'0000', date:'2026-07-02'});
  check('invalid auth daily rejected 401', r.status === 401);
  r = await callApi(onRequest, env, 'POST', 'daily', {username:'admin', pin:'9999', date:'2026/07/02'});
  check('bad date daily rejected', r.status === 400);

  console.log('\n== /api/monthly ==');
  // өөр өдрийн тайлан нэмж сарын нийлбэр шалгана
  await callApi(onRequest, env, 'POST', 'submit', {
    username:'teever', pin:'2222', report_type:'transport', date:'2026-07-03',
    data:{sludge_ton:'50', waste_ton:'20', short_waste_ton:'0', product_transport_ton:'100'}
  });
  r = await callApi(onRequest, env, 'POST', 'monthly', {username:'hse', pin:'6666', month:'2026-07'});
  check('worker monthly OK', r.status === 200);
  const transportRows = r.data.reports.filter(x=>x.report_type==='transport');
  check('monthly has 2 transport days', transportRows.length === 2, transportRows.map(x=>x.date));
  const totalSludge = transportRows.reduce((a,x)=>a+parseFloat(x.data.sludge_ton||0),0);
  check('monthly sludge total = 200', totalSludge === 200, {totalSludge});
  r = await callApi(onRequest, env, 'POST', 'monthly', {username:'admin', pin:'9999', month:'2026-7'});
  check('bad month rejected', r.status === 400);

  console.log('\n== 404 / DB binding ==');
  r = await callApi(onRequest, env, 'POST', 'unknown', {});
  check('unknown route 404', r.status === 404);
  r = await (async()=>{const req=new Request('https://x.com/api/daily',{method:'POST',body:'{}'});const res=await onRequest({request:req,env:{}});return {status:res.status}})();
  check('missing DB binding -> 500', r.status === 500);

  console.log('\n== /api/vehicles ==');
  r = await callApi(onRequest, env, 'POST', 'vehicles', {username:'camp', pin:'5555'});
  check('any auth user lists vehicles', r.status === 200 && r.data.vehicles.length === 36, {len:r.data.vehicles?.length});
  r = await callApi(onRequest, env, 'POST', 'vehicles/save', {username:'camp', pin:'5555', vehicle:{name:'Шинэ машин', purpose:'sludge', ownership:'own'}});
  check('camp CANNOT add vehicle (403)', r.status === 403);
  r = await callApi(onRequest, env, 'POST', 'vehicles/save', {username:'teever', pin:'2222', vehicle:{name:'11-22 АБВ шинэ', purpose:'product', ownership:'rental_product'}});
  check('teever adds vehicle', r.status === 200 && r.data.vehicles.length === 37, {len:r.data.vehicles?.length});
  const newV = r.data.vehicles.find(v=>v.name==='11-22 АБВ шинэ');
  check('new vehicle fields saved', newV && newV.purpose==='product' && newV.ownership==='rental_product', newV);
  r = await callApi(onRequest, env, 'POST', 'vehicles/remove', {username:'admin', pin:'9999', id:newV.id});
  check('admin removes vehicle', r.status === 200 && r.data.vehicles.length === 36);
  r = await callApi(onRequest, env, 'POST', 'vehicles/save', {username:'teever', pin:'2222', vehicle:{name:'  '}});
  check('empty name rejected', r.status === 400);

  console.log('\n== /api/plan ==');
  r = await callApi(onRequest, env, 'POST', 'plan', {username:'admin', pin:'9999', month:'2026-07'});
  check('empty plan returns {}', r.status === 200 && JSON.stringify(r.data.plan)==='{}', r.data);
  r = await callApi(onRequest, env, 'POST', 'plan/save', {username:'teever', pin:'2222', month:'2026-07', plan:{production_ton:5000}});
  check('non-admin CANNOT save plan (403)', r.status === 403);
  r = await callApi(onRequest, env, 'POST', 'plan/save', {username:'admin', pin:'9999', month:'2026-07', plan:{production_ton:5000, fuel_expense_liter:60000}});
  check('admin saves plan', r.status === 200 && r.data.plan.production_ton === 5000);
  r = await callApi(onRequest, env, 'POST', 'plan', {username:'camp', pin:'5555', month:'2026-07'});
  check('any user reads plan', r.status === 200 && r.data.plan.production_ton === 5000);
  r = await callApi(onRequest, env, 'POST', 'plan/save', {username:'admin', pin:'9999', month:'2026-07', plan:{production_ton:5500}});
  check('plan upsert overwrites', r.status === 200);
  r = await callApi(onRequest, env, 'POST', 'plan', {username:'admin', pin:'9999', month:'2026-07'});
  check('plan reflects update', r.data.plan.production_ton === 5500, r.data.plan);

  console.log('\n== audit_logs ==');
  const logs = db.prepare("SELECT action, COUNT(*) c FROM audit_logs GROUP BY action").all();
  console.log('  ', JSON.stringify(logs));
  check('login actions logged', logs.some(l=>l.action==='login' && l.c >= 2));
  check('submit actions logged', logs.some(l=>l.action==='submit_report' && l.c >= 3));

  fs.unlinkSync(tmp);
  console.log(`\n===== RESULT: ${passed} passed, ${failed} failed =====`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });

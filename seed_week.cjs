/**
 * БҮТЭН ДОЛОО ХОНОГИЙН ТЕСТ ДАТА — 2026-08-10 (Даваа) → 2026-08-17 (Даваа)
 * =====================================================================
 * Хэрэглээ:   node seed_week.cjs
 * Цэвэрлэх:   D1 Console дээр
 *   DELETE FROM reports WHERE date BETWEEN '2026-08-10' AND '2026-08-17';
 *   DELETE FROM meeting_tasks WHERE meeting_id IN
 *     (SELECT id FROM meetings WHERE meeting_date IN ('2026-08-10','2026-08-17'));
 *   DELETE FROM meetings WHERE meeting_date IN ('2026-08-10','2026-08-17');
 *
 * Юу цутгах вэ:
 *   • Дутуу зориулалтын машиныг бүртгэнэ (waste/short — донатын «Хаягдал»
 *     үргэлж 0 харагддаг байсан шалтгаан)
 *   • 8 өдөр × 7 модулийн тайлан — бүх талбар дүүрэн, өдөр бүр өөр
 *     «түүх»-тэй (шланг эвдрэх → сэлбэг ирэх → засагдах гэх мэт)
 *   • 2 хурал: 08-10 (өнгөрсөн, даалгаврууд нь биелсэн/хойшилсон төлөвтэй,
 *     ажилтны тайлбартай) ба 08-17 (шинэ даалгавар, open)
 *   • Сарын төлөвлөгөө (байгаа бол дарж бичнэ, өөрчлөгдөөгүй утгаараа)
 *
 * Тайлан admin-аар илгээгдэх тул «Илгээсэн» нэр бүгд админ гарна —
 * тестийн хязгаарлалт (ажилчдын нууц үгийг мэдэхгүй тул).
 */
const BASE = 'https://report-d3e.pages.dev';
const AUTH = { username: 'admin', pin: '9999' };
const MONTH = '2026-08';

async function call(path, body){
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...AUTH, ...body })
  });
  const data = await res.json().catch(() => ({}));
  if(!res.ok || data.ok === false) throw new Error(path + ' → ' + (data.error || res.status));
  return data;
}

/* =====================================================================
   1. МАШИНЫ ПАРК — дутууг нөхөж бүртгэнэ
   ===================================================================== */
const FLEET = [
  {name:'HOWO-371 80-40 ТТА', purpose:'sludge',  ownership:'own'},
  {name:'HOWO-371 80-43 ТТА', purpose:'sludge',  ownership:'own'},
  {name:'00-96 ММА МТ-86',    purpose:'sludge',  ownership:'rental_sludge'},
  {name:'08-49 УНН Норд',     purpose:'sludge',  ownership:'rental_sludge'},
  {name:'12-31 УБП Шакман',   purpose:'sludge',  ownership:'rental_sludge'},
  {name:'85-95 ОРБ 60т хөлт', purpose:'product', ownership:'rental_product'},
  {name:'38-59 ӨМЕ',          purpose:'product', ownership:'rental_product'},
  {name:'44-12 ХБН Хово',     purpose:'product', ownership:'rental_product'},
  {name:'23-77 АБВ самосвал', purpose:'waste',   ownership:'own'},
  {name:'23-78 АБВ самосвал', purpose:'waste',   ownership:'own'},
  {name:'11-05 ГРД дотоод',   purpose:'short',   ownership:'own'},
  {name:'XCMG 50 ковш',       purpose:'support', ownership:'own'},
  {name:'LONKING 60 ковш',    purpose:'support', ownership:'own'},
  {name:'Түлшний машин',      purpose:'support', ownership:'own'}
];

/* =====================================================================
   2. ӨДӨР БҮРИЙН «ТҮҮХ» — тоо биш, болсон явдал
   =====================================================================
   f    — өдрийн эрчим (үйлдвэрлэл, рейс бүгд үүгээр хэлбэлзэнэ)
   Түүхийн шугам:
     10: хэвийн Даваа, хурал болно
     11: конвейерийн бүсэнд элэгдэл илэрсэн (дунд)
     12: шөнө цахилгаан 40 мин тасарсан (өндөр), үйлдвэрлэл унасан
     13: сэлбэг ирж LONKING засвар эхэлсэн, салхи шуургатай
     14: бүс солигдож хэвийн болсон, өндөр гүйцэтгэл
     15: пүүний программ гацсан (бага), богино рейс ихэссэн
     16: Ням — цомхон бүрэлдэхүүн, бага эрчим
     17: шинэ Даваа — хурал, өндөр эрчимтэй эхэлсэн
*/
const DAYS = [
  { d:'2026-08-10', f:1.00, weather:{day:27, night:14, hum:34, wind:7},
    prodIssue:null,
    transIssue:null,
    eqIssue:null, eqNote:'Бүх техник хэвийн. Ээлжийн үзлэг хийгдсэн.',
    hse:{viol:0, med:0},
    genIssue:{text:'Хаягдлын талбайн зам борооны дараа зөөлөрсөн, тэгжээ шаардлагатай.',
      sev:'low', status:'open', action:'Грейдер захиалсан, мягмарт тэгжээ хийнэ.', resp:'Тээвэр Ууганбаяр'},
    prodNote:'Хоёр ээлж төлөвлөгөөт горимд ажилласан. Лаб үзүүлэлт стандартад.',
    transNote:'Бүх чиглэл хэвийн. ER-ийн зам сайн.',
    fuelIncome:0, fuelNote:'Татан авалтгүй өдөр. Нөөц хангалттай.',
    campNote:'Кемп хэвийн. Даваагийн хурлын зочид ирсэн.', guests:3,
    hseNote:'Өглөөний ХАБ-ын яриа 07:30-д хийгдсэн. Зөрчилгүй.' },

  { d:'2026-08-11', f:0.95, weather:{day:29, night:15, hum:28, wind:9},
    prodIssue:{text:'Хоёрдугаар шугамын конвейерийн бүсэнд элэгдэл илэрсэн, ажиглалтад авсан.', sev:'medium'},
    transIssue:null,
    eqIssue:null, eqNote:'Конвейерийн бүсийг ээлж бүр шалгаж байна.',
    hse:{viol:1, med:0},
    genIssue:{text:'Конвейерийн бүсний нөөц байхгүй — яаралтай захиалга шаардлагатай.',
      sev:'medium', status:'open', action:'УБ-ын нийлүүлэгчтэй холбогдсон, 13-нд ирнэ гэсэн.', resp:'Техник Ганбат'},
    prodNote:'Бүсний элэгдлээс болж хоёрдугаар шугамыг 80%-ийн хурдтай ажиллуулсан.',
    transNote:'Хаягдлын талбайн зам тэгжээ хийгдсэн, хэвийн.',
    fuelIncome:8000, fuelNote:'ММ Ойл-оос 8,000 л дизель татсан. Чанарын бичиг хавсаргасан.',
    campNote:'Хятад талын 2 инженер нэмж ирсэн (конвейерийн үзлэг).', guests:2,
    hseNote:'Дамжуургын хажуугаар хамгаалалтгүй зогссон 1 зөрчил тэмдэглэж, зааварчилгаа өгсөн.' },

  { d:'2026-08-12', f:0.72, weather:{day:26, night:13, hum:41, wind:5},
    prodIssue:{text:'Шөнийн ээлжид 02:10-02:50 цахилгаан тасарч үйлдвэрлэл бүрэн зогссон.', sev:'high'},
    transIssue:{text:'Цахилгаан тасарсан үед пүү ажиллаагүй тул 6 рейс жингүй бүртгэгдсэн.', sev:'medium'},
    eqIssue:null, eqNote:'Генераторын автомат сэлгэн залгагч ажиллаагүй — үзлэг хийж байна.',
    hse:{viol:0, med:1},
    genIssue:{text:'Генераторын АВР төхөөрөмж гэмтэлтэй — цахилгаан тасрахад гараар залгаж байна.',
      sev:'high', status:'open', action:'Мэргэжлийн байгууллага дуудсан, 14-нд ирж үзнэ.', resp:'Техник Ганбат'},
    prodNote:'40 минутын зогсолтын улмаас шөнийн ээлжийн гарц 35% буурсан.',
    transNote:'Жингүй 6 рейсийг дараагийн өдрийн пүүгээр нөхөж бүртгэсэн.',
    fuelIncome:0, fuelNote:'Генератор 40 мин ажилласан тул зарлага өссөн.',
    campNote:'Хэвийн.', guests:0,
    hseNote:'Тогооч гар халзалж эмнэлгийн анхны тусламж үзүүлсэн. Хөнгөн.' },

  { d:'2026-08-13', f:0.90, weather:{day:24, night:11, hum:52, wind:14},
    prodIssue:null,
    transIssue:{text:'Шуурганы улмаас ER-ийн зам 2 цаг хаагдаж, урт рейс саатсан.', sev:'medium'},
    eqIssue:{text:'LONKING 60 ковшны гидравлик шланг задарсан — сэлбэг ирсэн, засвар эхэлсэн.', sev:'medium'},
    eqNote:'LONKING засварт орсон. Конвейерийн шинэ бүс хүрч ирсэн.',
    hse:{viol:0, med:0},
    genIssue:{text:'Шуурга их үед богино рейсийн тоос ихсэж харагдац муудаж байна.',
      sev:'low', status:'open', action:'Усалгааны машин гаргах хуваарь гаргасан.', resp:'ХАБЭА Оюунаа'},
    prodNote:'Конвейерийн шинэ бүс ирсэн — маргааш шөнийн ээлжид сольно.',
    transNote:'Салхи 14 м/с хүрч богино рейсийг түр зогсоож байсан.',
    fuelIncome:0, fuelNote:'Хэвийн.',
    campNote:'Шуурганы улмаас гадуур хоолыг дотогш шилжүүлсэн.', guests:1,
    hseNote:'Шуурганы үед өндөр өртөөс ажиллахыг түр хориглосон.' },

  { d:'2026-08-14', f:1.12, weather:{day:25, night:12, hum:38, wind:6},
    prodIssue:null,
    transIssue:null,
    eqIssue:null, eqNote:'Конвейерийн бүс солигдсон. LONKING засвар дууссан — паркад бэлэн.',
    hse:{viol:0, med:0},
    genIssue:{text:'АВР-ийн мэргэжилтэн ирж үзлээ — удирдлагын хавтан солих шаардлагатай, үнийн санал ирүүлнэ.',
      sev:'medium', status:'open', action:'Үнийн санал хүлээж байна.', resp:'Техник Ганбат'},
    prodNote:'Шинэ бүстэй шугам бүрэн хүчээр ажиллаж долоо хоногийн дээд гарц гарлаа.',
    transNote:'Бүх чиглэл саадгүй. Пүү хэвийн.',
    fuelIncome:0, fuelNote:'Хэвийн.',
    campNote:'Хэвийн.', guests:0,
    hseNote:'Зөрчилгүй. Бүсний солилтын ажилд ХАБ-ын хяналт тавьсан.' },

  { d:'2026-08-15', f:0.98, weather:{day:28, night:14, hum:30, wind:8},
    prodIssue:null,
    transIssue:{text:'Пүүний программ 30 мин гацаж гараар бүртгэсэн — дараа нь тулгаж зассан.', sev:'low'},
    eqIssue:null, eqNote:'Хэвийн.',
    hse:{viol:1, med:0},
    genIssue:null,
    prodNote:'Хэвийн. Лабораторийн наалдац өссөн — түүхий эдийн чанар сайн.',
    transNote:'Богино рейс ихэссэн (хашаан доторх нүүлгэлт).',
    fuelIncome:6000, fuelNote:'6,000 л татан авалт. Нөөц дүүрэн.',
    campNote:'Амралтын өдрийн ээлжийн хуваарь гарсан.', guests:0,
    hseNote:'Хамгаалалтын малгайгүй явсан 1 зөрчил — сануулга өгсөн.' },

  { d:'2026-08-16', f:0.68, weather:{day:30, night:16, hum:25, wind:4},
    prodIssue:null,
    transIssue:null,
    eqIssue:null, eqNote:'Ням гараг — зөвхөн жижүүрийн техник ажилласан.',
    hse:{viol:0, med:0},
    genIssue:null,
    prodNote:'Ням гараг — цомхон бүрэлдэхүүнээр нэг шугам ажилласан.',
    transNote:'Зөвхөн шламын татан авалт хийгдсэн.',
    fuelIncome:0, fuelNote:'Хэвийн.',
    campNote:'Амралтын өдөр — хүн цөөн.', guests:0,
    hseNote:'Зөрчилгүй.' },

  { d:'2026-08-17', f:1.05, weather:{day:26, night:13, hum:36, wind:7},
    prodIssue:null,
    transIssue:null,
    eqIssue:{text:'АВР-ийн удирдлагын хавтангийн үнийн санал ирсэн — 4.2 сая ₮, шийдвэр хүлээж байна.', sev:'medium'},
    eqNote:'Бүрэн парк ажилд гарсан.',
    hse:{viol:0, med:0},
    genIssue:{text:'АВР-ийн хавтан солих зардлын шийдвэр удирдлагаас гарах хүлээлттэй.',
      sev:'medium', status:'open', action:'Өнөөдрийн хуралд танилцуулна.', resp:'Техник Ганбат'},
    prodNote:'Долоо хоног өндөр эрчимтэй эхэллээ. Хоёр шугам бүрэн хүчээр.',
    transNote:'Бүх чиглэл хэвийн.',
    fuelIncome:0, fuelNote:'Хэвийн. Лхагвад татан авалт төлөвлөсөн.',
    campNote:'Даваагийн хурлын өдөр.', guests:2,
    hseNote:'Осол гэмтэлгүй 5 дахь хоног. Өглөөний яриа хийгдсэн.' }
];

/* =====================================================================
   3. ХУРЛУУД
   ===================================================================== */
function meetingsFor(users){
  /* Нэрээр хайж олох — олдохгүй бол admin */
  const byName = frag => {
    const u = users.find(x => (x.name||'').includes(frag) || (x.username||'').includes(frag));
    return u ? u.id : users[0].id;
  };
  return [
    { date:'2026-08-10',
      notes:'Оролцогчид: захирал, ерөнхий инженер, хэлтсийн ахлахууд (7).\n' +
        'Хэлэлцсэн: өнгөрсөн 7 хоногийн гүйцэтгэл 96%, шламын нөөц хангалттай.\n' +
        'Шийдвэр: конвейерийн бүсний нөөцийг байнга 1 ширхэг байлгах журам гаргах. ' +
        'Хаягдлын талбайн замын асуудлыг мягмар дотор шийдэх.',
      tasks:[
        { task_text:'Конвейерийн нөөц бүсний захиалга өгч, агуулахад байршуулах',
          assignee_id:byName('Ганбат'), due_date:'2026-08-13',
          status:'done', worker_note:'Бүс 13-нд ирсэн, 14-нд сольсон. Нөөц 1ш агуулахад байгаа.' },
        { task_text:'Хаягдлын талбайн замыг грейдерээр тэгжээ хийлгэх',
          assignee_id:byName('Ууганбаяр'), due_date:'2026-08-11',
          status:'done', worker_note:'11-ний өглөө хийгдсэн.' },
        { task_text:'Түлшний долоо хоногийн зарцуулалтын тайланг маягтаар гаргах',
          assignee_id:byName('Сарантуяа'), due_date:'2026-08-14',
          status:'done', worker_note:'Тайлан гаргаж имэйлээр илгээсэн.' },
        { task_text:'Кемпийн өвлийн бэлтгэлийн төсөв боловсруулах',
          assignee_id:byName('Мөнхбат'), due_date:'2026-08-16',
          status:'postponed', worker_note:'Барилгын материалын үнийн судалгаа дутуу — ирэх 7 хоногт багтаана.' },
        { task_text:'Шинэ ажилчдын ХАБ-ын анхан шатны сургалт зохион байгуулах',
          assignee_id:byName('Оюун'), due_date:'2026-08-15',
          status:'done', worker_note:'5 ажилтанд 15-нд хийсэн, гарын үсэг авсан.' }
      ] },
    { date:'2026-08-17',
      notes:'Оролцогчид: захирал, ерөнхий инженер, хэлтсийн ахлахууд.\n' +
        'Хэлэлцсэн: 12-ны цахилгааны зогсолт ба АВР-ийн гэмтэл — гол эрсдэл. ' +
        'Долоо хоногийн гүйцэтгэл 93% (зогсолтын нөлөө). Конвейерийн бүс амжилттай солигдсон.\n' +
        'Шийдвэр: АВР-ийн хавтан солих 4.2 сая ₮-ийн зардлыг баталсан. ' +
        'Пүүний программын гацалтад нөөц бүртгэлийн журам гаргана.',
      tasks:[
        { task_text:'АВР-ийн удирдлагын хавтан захиалж, суурилуулалтын хуваарь гаргах',
          assignee_id:byName('Ганбат'), due_date:'2026-08-21', status:'open', worker_note:'' },
        { task_text:'Пүү гацсан үеийн гараар бүртгэх журмын төсөл боловсруулах',
          assignee_id:byName('Ууганбаяр'), due_date:'2026-08-20', status:'open', worker_note:'' },
        { task_text:'Кемпийн өвлийн бэлтгэлийн төсвийг дуусгаж танилцуулах (хойшилсон)',
          assignee_id:byName('Мөнхбат'), due_date:'2026-08-22', status:'open', worker_note:'' },
        { task_text:'Усалгааны машины хуваарийг шуургатай өдрүүдэд тогтмолжуулах',
          assignee_id:byName('Оюун'), due_date:'2026-08-19', status:'open', worker_note:'' },
        { task_text:'9-р сарын үйлдвэрлэлийн төлөвлөгөөний саналыг бэлтгэх',
          assignee_id:byName('Долгорсүрэн'), due_date:'2026-08-24', status:'open', worker_note:'' }
      ] }
  ];
}

/* =====================================================================
   4. ЦУТГАЛТ
   ===================================================================== */
const r = (x, spread=0.08) => Math.round(x * (1 - spread + Math.random()*spread*2));

async function main(){
  await call('/api/login', {});
  console.log('Нэвтэрлээ.');

  /* --- Машины парк: дутууг нөхөх --- */
  let vehicles = (await call('/api/vehicles', {})).vehicles || [];
  for(const v of FLEET){
    if(!vehicles.some(x => x.name === v.name)){
      await call('/api/vehicles/save', { vehicle: v });
      console.log('Машин бүртгэв:', v.name, '(' + v.purpose + ')');
    }
  }
  vehicles = (await call('/api/vehicles', {})).vehicles || [];
  console.log('Парк:', vehicles.length, 'машин');

  /* --- Төлөвлөгөө --- */
  await call('/api/plan/save', { month: MONTH, plan: {
    production_ton: 13200, sludge_ton: 67200,
    sludge_trips: 1860, sludge_vehicles: 15,
    product_transport_trips: 336, product_transport_vehicles: 7
  }});
  console.log('Төлөвлөгөө:', MONTH);

  /* --- Өдөр бүрийн тайлан --- */
  let fuelOpen = 13400;                    // 10-ны эхний үлдэгдэл
  for(const day of DAYS){
    const { d, f, weather } = day;

    /* ТЭЭВЭР — машин бүрээр */
    const t = {sludge_trips:0, sludge_ton:0, waste_trips:0, waste_ton:0,
               short_waste_trips:0, short_waste_ton:0,
               product_transport_trips:0, product_transport_ton:0};
    const trows = [];
    for(const v of vehicles){
      if(v.purpose === 'support') continue;
      /* Ням гарагт зөвхөн шлам явна */
      if(f < 0.7 && v.purpose !== 'sludge') continue;
      const baseTrips = {sludge:7, product:6, waste:2, short:5}[v.purpose] || 0;
      const trips = Math.max(1, r(baseTrips * f, 0.25));
      const tonPer = {sludge:10.5, product:11.5, waste:13, short:11}[v.purpose];
      const ton = Math.round(trips * tonPer * (0.92 + Math.random()*0.16));
      trows.push({vid:v.id, name:v.name, purpose:v.purpose, ownership:v.ownership, trips, ton});
      if(v.purpose==='sludge'){ t.sludge_trips+=trips; t.sludge_ton+=ton; }
      else if(v.purpose==='waste'){ t.waste_trips+=trips; t.waste_ton+=ton; }
      else if(v.purpose==='short'){ t.short_waste_trips+=trips; t.short_waste_ton+=ton; }
      else { t.product_transport_trips+=trips; t.product_transport_ton+=ton; }
    }
    await call('/api/submit', { date:d, report_type:'transport', data:{
      ...t, vehicle_rows:trows,
      weighbridge_net_ton: t.sludge_ton + Math.round((Math.random()-0.5)*40),
      weighbridge_trips: t.sludge_trips,
      note: day.transNote,
      issue_text: day.transIssue ? day.transIssue.text : '',
      issue_severity: day.transIssue ? day.transIssue.sev : ''
    }});

    /* ТҮЛШ */
    const frows = vehicles.map(v => ({vid:v.id, name:v.name, ownership:v.ownership,
      liter: v.purpose==='support' ? r(90*f,0.3) : r(165*f,0.3)}));
    const expense = frows.reduce((a,x)=>a+x.liter,0) + (d==='2026-08-12' ? 380 : 0);
    await call('/api/submit', { date:d, report_type:'fuel', data:{
      fuel_opening_liter: fuelOpen,
      fuel_income_liter: day.fuelIncome,
      vehicle_rows: frows,
      fuel_expense_liter: expense,
      fuel_closing_liter: fuelOpen + day.fuelIncome - expense,
      note: day.fuelNote, issue_text:'', issue_severity:''
    }});
    fuelOpen = fuelOpen + day.fuelIncome - expense;

    /* ҮЙЛДВЭРЛЭЛ / ЛАБ */
    await call('/api/submit', { date:d, report_type:'production', data:{
      shift_day_product_ton: r(245*f), shift_night_product_ton: r(200*f),
      day_meter: r(5600), night_meter: r(4500),
      day_fuel_liter: r(480*f), night_fuel_liter: r(400*f),
      middling_ton: r(52*f),
      lab_avg_luojing_ad: (9.8+Math.random()*2).toFixed(1),
      lab_avg_fumei_ad: (10.6+Math.random()*2).toFixed(1),
      lab_avg_caking_g: r(80),
      note: day.prodNote,
      issue_text: day.prodIssue ? day.prodIssue.text : '',
      issue_severity: day.prodIssue ? day.prodIssue.sev : ''
    }});

    /* ТЕХНИК */
    const rep = (d==='2026-08-13') ? 2 : 1;
    await call('/api/submit', { date:d, report_type:'equipment', data:{
      main_working_count: f<0.7 ? 6 : r(18,0.1),
      rental_sludge_working_count: f<0.7 ? 3 : r(12,0.15),
      product_transport_working_count: f<0.7 ? 0 : r(6,0.2),
      repair_count: rep, parked_count: f<0.7 ? 14 : r(5,0.3),
      equipment_note: day.eqNote,
      issue_text: day.eqIssue ? day.eqIssue.text : '',
      issue_severity: day.eqIssue ? day.eqIssue.sev : ''
    }});

    /* КЕМП */
    await call('/api/submit', { date:d, report_type:'camp', data:{
      mongolian_count: f<0.7 ? 14 : r(24,0.08),
      chinese_count: f<0.7 ? 12 : r(21,0.08),
      guard_count: 5, guest_count: day.guests,
      outside_meal_count: f<0.7 ? 0 : r(4,0.4),
      contractor_count: f<0.7 ? 2 : r(10,0.2),
      camp_staff_count: 8,
      note: day.campNote, issue_text:'', issue_severity:''
    }});

    /* ХАБЭА + цаг агаар */
    await call('/api/submit', { date:d, report_type:'hse', data:{
      hse_violation_count: day.hse.viol,
      medical_assistance_count: day.hse.med,
      day_temp_c: weather.day, night_temp_c: weather.night,
      humidity_percent: weather.hum, wind_speed_ms: weather.wind,
      note: day.hseNote, issue_text:'', issue_severity:''
    }});

    /* ЕРӨНХИЙ АСУУДАЛ */
    if(day.genIssue){
      await call('/api/submit', { date:d, report_type:'issue', data:{
        issue_text: day.genIssue.text, severity: day.genIssue.sev,
        status: day.genIssue.status, action_taken: day.genIssue.action,
        responsible_person: day.genIssue.resp
      }});
    }
    console.log(d, '— 7 тайлан орлоо (эрчим ' + f + ')');
  }

  /* --- Хурлууд --- */
  const users = (await call('/api/users', {})).users || [];
  for(const m of meetingsFor(users)){
    await call('/api/meeting/save', { date:m.date, notes:m.notes, tasks:m.tasks });
    console.log('Хурал:', m.date, '—', m.tasks.length, 'даалгавар');
  }

  console.log('\nДУУСЛАА →', BASE + '/dashboard.html');
  console.log('Хурлын хуудсанд 08-17-г сонгоод «7 хоног» дарвал бүтэн зураг гарна.');
}

main().catch(e => { console.error('АЛДАА:', e.message); process.exit(1); });

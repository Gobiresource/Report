// =====================================================================
// GRD — Өдрийн үзүүлэлтийн iOS widget v2 (Scriptable)
// Самбарын дизайныг давтсан: улаан карт + gradient заалт | цагаан карт + донат
// =====================================================================
// СУУЛГАХ:
//   1. App Store-оос «Scriptable» (үнэгүй) суулгана.
//   2. Scriptable → [+] → энэ файлыг бүтнээр хуулж тавина. Нэр: GRD.
//   3. Доорх WIDGET_KEY-г өөрийн түлхүүрээр солино.
//   4. Нүүр дэлгэц удаан дарж [+] → Scriptable → Small эсвэл Medium →
//      widget дээр удаан дарж Edit Widget → Script = GRD.
//   Small = зөвхөн заалт. Medium = заалт + тээврийн донат.
// =====================================================================

const BASE = 'https://report-d3e.pages.dev';
const WIDGET_KEY = 'JVh0HOOB_vGJtCbHnlBlC7mU';

// Самбарын яг өнгөнүүд
const RED_HI = '#D22633', RED_MID = '#BC2029', RED_LO = '#8C161D';
const GAUGE_STOPS = [
  [0.00, 0xFF, 0x6A, 0x5A],
  [0.32, 0xFF, 0x9F, 0x1C],
  [0.64, 0xF5, 0xDA, 0x3E],
  [1.00, 0x3D, 0xDC, 0x6B]
];
const C_SLUDGE = '#3B2FE0', C_WASTE = '#9BA3A9', C_PRODUCT = '#FF9500';
const INK = '#1D1D1F', INK3 = '#98A0A6';

// ---------------------------------------------------------------------

async function fetchData(){
  const req = new Request(BASE + '/api/widget?key=' + encodeURIComponent(WIDGET_KEY));
  req.timeoutInterval = 15;
  return await req.loadJSON();
}
const fmt = x => (x ?? 0).toLocaleString('en-US');

// Gradient-ийн өнгө: frac(0..1)-д харгалзах өнгийг stops-оос интерполяцилно
function gaugeColor(f){
  const s = GAUGE_STOPS;
  for(let i = 0; i < s.length - 1; i++){
    if(f <= s[i+1][0]){
      const t = (f - s[i][0]) / (s[i+1][0] - s[i][0]);
      const c = j => Math.round(s[i][j] + (s[i+1][j] - s[i][j]) * t);
      return new Color('#' + [c(1),c(2),c(3)].map(x=>x.toString(16).padStart(2,'0')).join(''));
    }
  }
  return new Color('#3DDC6B');
}
const P = (cx, cy, r, aDeg) => {
  const a = aDeg * Math.PI / 180;
  return new Point(cx + r * Math.cos(a), cy - r * Math.sin(a));
};

// Нум зурагч: aFrom→aTo градусыг жижиг хэрчмүүдээр, өнгө нь колбек
function arc(ctx, cx, cy, r, lw, aFrom, aTo, colorFn){
  const steps = Math.max(2, Math.round(Math.abs(aFrom - aTo) / 3));
  ctx.setLineWidth(lw);
  for(let i = 0; i < steps; i++){
    const f0 = i / steps, f1 = (i + 1) / steps;
    // хэрчмүүдийг 0.6°-аар давхарлаж залгаас харагдахгүй болгоно
    const a0 = aFrom + (aTo - aFrom) * f0;
    const a1 = aFrom + (aTo - aFrom) * f1 + (i < steps - 1 ? Math.sign(aTo - aFrom) * 0.6 : 0);
    const p = new Path();
    p.move(P(cx, cy, r, a0));
    p.addLine(P(cx, cy, r, a1));
    ctx.addPath(p);
    ctx.setStrokeColor(colorFn((f0 + f1) / 2));
    ctx.strokePath();
  }
}

// --- Заалт (улаан картын дотор): самбарын gaugeHtml-ийн хуулбар ---
function drawGauge(ctx, x, y, w, h, d){
  const cx = x + w/2, cy = y + h - 34, R = Math.min(w/2 - 18, h - 64);
  const frac = d.target_ton > 0 ? Math.min(d.production_ton / d.target_ton, 1) : 0;

  // Мөр (track)
  arc(ctx, cx, cy, R, 9, 180, 0, () => new Color('#FFFFFF', 0.20));
  // Хуваарийн 13 зураас
  for(let i = 0; i <= 12; i++){
    const a = 180 - i * 15, major = i % 3 === 0;
    const p = new Path();
    p.move(P(cx, cy, R - (major ? 21 : 17), a));
    p.addLine(P(cx, cy, R - 12, a));
    ctx.addPath(p);
    ctx.setLineWidth(major ? 2.6 : 1.8);
    ctx.setStrokeColor(new Color('#FFFFFF', major ? 0.8 : 0.42));
    ctx.strokePath();
  }
  // Gradient дүүргэлт
  if(frac > 0) arc(ctx, cx, cy, R, 9, 180, 180 - frac * 180, gaugeColor);
  // Үзүүрийн цагаан цагираг
  const tip = P(cx, cy, R, 180 - frac * 180);
  ctx.setFillColor(new Color('#FFFFFF'));
  ctx.fillEllipse(new Rect(tip.x - 6.5, tip.y - 6.5, 13, 13));
  ctx.setFillColor(gaugeColor(frac));
  ctx.fillEllipse(new Rect(tip.x - 3.5, tip.y - 3.5, 7, 7));

  // Гол тоо + «тонн»
  ctx.setTextAlignedCenter();
  ctx.setTextColor(new Color('#FFFFFF'));
  ctx.setFont(Font.heavySystemFont(30));
  ctx.drawTextInRect(fmt(d.production_ton), new Rect(x, cy - 44, w, 36));
  ctx.setFont(Font.semiboldSystemFont(9));
  ctx.setTextColor(new Color('#FFFFFF', 0.75));
  ctx.drawTextInRect('ТОНН', new Rect(x, cy - 8, w, 12));

  // Доод мөр: зорилт | биелэлт
  ctx.setFont(Font.mediumSystemFont(10));
  ctx.setTextColor(new Color('#FFFFFF', 0.85));
  ctx.setTextAlignedLeft();
  ctx.drawTextInRect('Зорилт · ' + fmt(d.target_ton) + ' т', new Rect(x + 14, y + h - 20, w - 28, 13));
  if(d.percent !== null && d.percent !== undefined){
    ctx.setTextAlignedRight();
    ctx.setFont(Font.boldSystemFont(10));
    ctx.setTextColor(new Color('#FFFFFF'));
    ctx.drawTextInRect('Биелэлт ' + d.percent + '%', new Rect(x + 14, y + h - 20, w - 28, 13));
  }
}

// --- НЯГТ заалт + тээврийн зурвас: Small widget-д бүгдийг багтаана ---
function drawSmallFace(ctx, W, H, d){
  // Дээд мөр: огноо (зүүн) + биелэлт % (баруун)
  ctx.setFont(Font.boldSystemFont(8.5));
  ctx.setTextColor(new Color('#FFFFFF', 0.7));
  ctx.setTextAlignedLeft();
  ctx.drawTextInRect(d.date.slice(5).replace('-', '/'), new Rect(13, 9, 60, 11));
  if(d.percent !== null && d.percent !== undefined){
    ctx.setTextAlignedRight();
    ctx.setFont(Font.heavySystemFont(10));
    ctx.setTextColor(new Color('#FFFFFF'));
    ctx.drawTextInRect(d.percent + '%', new Rect(W - 73, 8, 60, 12));
  }

  // Заалт — жижигрүүлсэн хувилбар
  const cx = W / 2, cy = 88, R = 42, LW = 7.5;
  const frac = d.target_ton > 0 ? Math.min(d.production_ton / d.target_ton, 1) : 0;
  arc(ctx, cx, cy, R, LW, 180, 0, () => new Color('#FFFFFF', 0.20));
  for(let i = 0; i <= 12; i += 3){                      // зөвхөн 5 гол зураас
    const a = 180 - i * 15;
    const p = new Path();
    p.move(P(cx, cy, R - 16, a)); p.addLine(P(cx, cy, R - 10, a));
    ctx.addPath(p);
    ctx.setLineWidth(2.2);
    ctx.setStrokeColor(new Color('#FFFFFF', 0.7));
    ctx.strokePath();
  }
  if(frac > 0) arc(ctx, cx, cy, R, LW, 180, 180 - frac * 180, gaugeColor);
  const tip = P(cx, cy, R, 180 - frac * 180);
  ctx.setFillColor(new Color('#FFFFFF'));
  ctx.fillEllipse(new Rect(tip.x - 5.5, tip.y - 5.5, 11, 11));
  ctx.setFillColor(gaugeColor(frac));
  ctx.fillEllipse(new Rect(tip.x - 3, tip.y - 3, 6, 6));

  ctx.setTextAlignedCenter();
  ctx.setTextColor(new Color('#FFFFFF'));
  ctx.setFont(Font.heavySystemFont(25));
  ctx.drawTextInRect(fmt(d.production_ton), new Rect(0, cy - 34, W, 28));
  ctx.setFont(Font.semiboldSystemFont(7.5));
  ctx.setTextColor(new Color('#FFFFFF', 0.7));
  ctx.drawTextInRect('ТОНН', new Rect(0, cy - 6, W, 10));

  // Зорилт — заалтын доор голд
  ctx.setFont(Font.mediumSystemFont(8.5));
  ctx.setTextColor(new Color('#FFFFFF', 0.75));
  ctx.drawTextInRect('Зорилт · ' + fmt(d.target_ton) + ' т', new Rect(0, cy + 12, W, 11));

  // Тээвэр: гарчиг + нийт, хуваарилалтын зурвас, 3 тоо
  const total = d.sludge_ton + d.waste_ton + d.product_ton;
  const bx = 13, bw = W - 26, by = H - 22;
  ctx.setTextAlignedLeft();
  ctx.setFont(Font.boldSystemFont(7.5));
  ctx.setTextColor(new Color('#FFFFFF', 0.6));
  ctx.drawTextInRect('ТЭЭВЭР', new Rect(bx, by - 12, 60, 9));
  ctx.setTextAlignedRight();
  ctx.setFont(Font.boldSystemFont(9));
  ctx.setTextColor(new Color('#FFFFFF'));
  ctx.drawTextInRect(fmt(total) + ' тн', new Rect(W - 93, by - 13, 80, 11));

  if(total > 0){
    // Зурвас: 3 сегмент, 1.5px завсар
    const segs = [[d.sludge_ton, C_SLUDGE], [d.waste_ton, C_WASTE], [d.product_ton, C_PRODUCT]];
    let sx = bx;
    for(const [v, col] of segs){
      if(v <= 0) continue;
      const sw = Math.max(2, v / total * bw - 1.5);
      ctx.setFillColor(new Color(col));
      ctx.fillRect(new Rect(sx, by, sw, 5));
      sx += v / total * bw;
    }
    // Доор нь 3 тоо — өнгөний цэгтэй, зүүн/гол/баруун
    ctx.setFont(Font.mediumSystemFont(8));
    const vals = [[d.sludge_ton, C_SLUDGE, 'left'], [d.waste_ton, C_WASTE, 'center'], [d.product_ton, C_PRODUCT, 'right']];
    for(const [v, col, align] of vals){
      const txt = fmt(v);
      let tx = bx, ta = 'left';
      if(align === 'center'){ ctx.setTextAlignedCenter(); tx = 0; }
      else if(align === 'right'){ ctx.setTextAlignedRight(); tx = W - bx - 80; }
      else ctx.setTextAlignedLeft();
      ctx.setTextColor(new Color('#FFFFFF', 0.85));
      ctx.drawTextInRect(txt, new Rect(align === 'center' ? 0 : (align === 'right' ? W - 93 : bx),
        by + 8, align === 'center' ? W : 80, 10));
    }
  }
}

// --- Улаан карт (градиенттэй) ---
function drawRedCard(ctx, x, y, w, h){
  // DrawContext-д градиент байхгүй тул 3 өнгийг хэвтээ зурвасаар ойролцоолно
  const steps = 24;
  for(let i = 0; i < steps; i++){
    const f = i / (steps - 1);
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const hex = c => parseInt(c.slice(1), 16);
    const c1 = hex(f < 0.45 ? RED_HI : RED_MID), c2 = hex(f < 0.45 ? RED_MID : RED_LO);
    const t = f < 0.45 ? f / 0.45 : (f - 0.45) / 0.55;
    const r = mix(c1 >> 16, c2 >> 16, t), g = mix((c1 >> 8) & 255, (c2 >> 8) & 255, t), b = mix(c1 & 255, c2 & 255, t);
    ctx.setFillColor(new Color('#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')));
    const rh = h / steps;
    // булангийн радиусыг эхний/сүүлийн зурваст л тайрна — дөхөлт хангалттай
    ctx.fillRect(new Rect(x, y + i * rh, w, rh + 1));
  }
}

// --- Донат + legend (цагаан картын дотор) ---
function drawDonut(ctx, x, y, w, h, d){
  const total = d.sludge_ton + d.waste_ton + d.product_ton;
  const cx = x + 62, cy = y + h/2, R = 40, LW = 13;
  const segs = [
    [d.sludge_ton,  new Color(C_SLUDGE)],
    [d.waste_ton,   new Color(C_WASTE)],
    [d.product_ton, new Color(C_PRODUCT)]
  ];
  if(total <= 0){
    ctx.setFont(Font.mediumSystemFont(11));
    ctx.setTextColor(new Color(INK3));
    ctx.setTextAlignedCenter();
    ctx.drawTextInRect('Тээврийн тайлан алга', new Rect(x, cy - 7, w, 14));
    return;
  }
  // Сегментүүд: 90°-аас цагийн зүүгээр, хооронд нь 4° завсар
  const GAP = 4;
  let a = 90;
  for(const [v, col] of segs){
    if(v <= 0) continue;
    const sweep = v / total * 360 - GAP;
    if(sweep > 0) arc(ctx, cx, cy, R, LW, a, a - sweep, () => col);
    a -= v / total * 360;
  }
  // Голын тоо
  ctx.setTextAlignedCenter();
  ctx.setTextColor(new Color(INK));
  ctx.setFont(Font.heavySystemFont(total >= 10000 ? 15 : 17));
  ctx.drawTextInRect(fmt(total), new Rect(cx - R, cy - 11, R * 2, 20));
  ctx.setFont(Font.semiboldSystemFont(8));
  ctx.setTextColor(new Color(INK3));
  ctx.drawTextInRect('ТН', new Rect(cx - R, cy + 8, R * 2, 10));

  // Legend — өнгөний дөрвөлжин + нэр + тоо (+хувь)
  const lx = x + 128, lw2 = x + w - lx - 10;
  const rows = [
    ['Шлам',         d.sludge_ton,  C_SLUDGE],
    ['Хаягдал',      d.waste_ton,   C_WASTE],
    ['Бүтээгдэхүүн', d.product_ton, C_PRODUCT]
  ];
  let ly = cy - 34;
  for(const [name, v, col] of rows){
    ctx.setFillColor(new Color(col));
    ctx.fillRect(new Rect(lx, ly + 3, 9, 9));
    ctx.setTextAlignedLeft();
    ctx.setFont(Font.mediumSystemFont(11));
    ctx.setTextColor(new Color('#55555C'));
    ctx.drawTextInRect(name, new Rect(lx + 15, ly, lw2 - 60, 14));
    ctx.setTextAlignedRight();
    ctx.setFont(Font.boldSystemFont(11));
    ctx.setTextColor(new Color(INK));
    const pct = Math.round(v / total * 100);
    ctx.drawTextInRect(fmt(v) + '  (' + pct + '%)', new Rect(lx + 15, ly, lw2 - 15, 14));
    ly += 23;
  }
}

// --- Угсралт ---
async function build(){
  const fam = config.widgetFamily || 'medium';
  const W = fam === 'small' ? 158 : 338, H = 158;

  const w = new ListWidget();
  w.url = BASE + '/dashboard.html';
  w.setPadding(0, 0, 0, 0);

  let d = null, err = null;
  try { d = await fetchData(); if(d.ok === false){ err = d.error; d = null; } }
  catch(e){ err = 'Холболт амжилтгүй'; }

  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectsScreenScale = true;

  if(fam === 'small'){
    drawRedCard(ctx, 0, 0, W, H);
    if(d) drawSmallFace(ctx, W, H, d);
  } else {
    // Зүүн улаан карт (заалт) + баруун цагаан карт (донат)
    drawRedCard(ctx, 0, 0, 163, H);
    ctx.setFillColor(new Color('#FFFFFF'));
    ctx.fillRect(new Rect(163, 0, W - 163, H));
    if(d){
      drawGauge(ctx, 0, 6, 163, H - 6, d);
      drawDonut(ctx, 163, 0, W - 163, H, d);
      // Баруун картын дээд шошго
      ctx.setTextAlignedLeft();
      ctx.setFont(Font.boldSystemFont(8.5));
      ctx.setTextColor(new Color(INK3));
      ctx.drawTextInRect('ТЭЭВЭР · ' + (d.reports_in) + '/7 ТАЙЛАН', new Rect(178, 10, W - 188, 11));
    }
  }

  if(err){
    ctx.setTextAlignedCenter();
    ctx.setFont(Font.mediumSystemFont(11));
    ctx.setTextColor(fam === 'small' ? new Color('#FFFFFF') : new Color(INK));
    ctx.drawTextInRect(err, new Rect(0, H/2 - 7, W, 14));
  } else if(d && fam === 'small'){
    // Small-д огноог дээр нь жижгээр
    ctx.setTextAlignedLeft();
    ctx.setFont(Font.boldSystemFont(8.5));
    ctx.setTextColor(new Color('#FFFFFF', 0.7));
    ctx.drawTextInRect(d.date.slice(5).replace('-', '/'), new Rect(14, 10, 60, 11));
  }

  w.backgroundImage = ctx.getImage();
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  return w;
}

const widget = await build();
if(config.runsInWidget){
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();


const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const fmt = new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 2 });
const moneyFmt = new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 0 });
const todayISO = () => new Date().toISOString().slice(0,10);
const monthISO = () => todayISO().slice(0,7);
const n = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? null : Number(String(v).replace(/,/g,''));
const show = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? '—' : fmt.format(Number(v));
const showInt = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? '—' : fmt.format(Math.round(Number(v)));
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function initTheme(){
  const saved=localStorage.getItem('dashboardTheme');
  const prefersDark=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme=saved || (prefersDark?'dark':'light');
  const b=$('#themeToggle'); if(b) b.onclick=()=>{const cur=document.documentElement.dataset.theme; const next=cur==='dark'?'light':'dark'; document.documentElement.dataset.theme=next; localStorage.setItem('dashboardTheme',next)};
}
async function api(path, opts={}){
  const res = await fetch(path, {headers:{'content-type':'application/json'}, ...opts});
  const text = await res.text();
  let data; try{ data = text ? JSON.parse(text) : {}; } catch(e){ data = {ok:false,error:text}; }
  if(!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function setStatus(el, msg, kind='muted'){
  if(!el) return;
  el.className = kind;
  el.textContent = msg;
}
function groupSum(rows, key, val){
  const out={};
  for(const r of rows||[]){ const k=r[key]||'—'; out[k]=(out[k]||0)+(Number(r[val])||0); }
  return out;
}
function table(headers, rows){
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="muted">Мэдээлэл алга</td></tr>`}</tbody></table></div>`;
}
const EQUIPMENT_MASTER = [
  ['XCMG 50 ковш','main','own',1],['LONKING 55 ковш 855','main','own',1],['LONKING 60 ковш 863','main','own',1],['SEM-655D ковш','main','own',1],
  ['KOMATSU-360 Экскаватор','main','own',0],['HYUNDAI-12-727 Экскаватор','main','own',0],['HYUNDAI-19-112 Экскаватор','main','own',0],['Zoomlion 25 Кран','main','own',0],
  ['Түлшний машин','support','own',0],['Усны машин','support','own',0],['Бохирын машин','support','own',0],['LC-76','support','own',0],['Toyota Probox','support','own',0],['Hyundai Porter','support','own',0],
  ['85-94 ОРН 60-н хөлт','product_transport_rental','rental',0],['45-08 ӨМЕ 60-н хөлт','product_transport_rental','rental',0],['36-57 ӨМЕ 60-н хөлт','product_transport_rental','rental',0],
  ['ХОВО 802','sludge_transport_rental','rental',0],['ХОВО 803','sludge_transport_rental','rental',0],['ХОВО 809','sludge_transport_rental','rental',0],['ХОВО 810','sludge_transport_rental','rental',0],
  ['00-96 ММА','sludge_transport_rental','rental',0],['51-38 УКМ','sludge_transport_rental','rental',0],['08-49 УНН','sludge_transport_rental','rental',0],['08-46 УНН','sludge_transport_rental','rental',0],
  ['18-58 ТТА (834)','sludge_transport_rental','rental',0],['98-00 ТТА (835)','sludge_transport_rental','rental',0],['82-09 ӨМҮ (836)','sludge_transport_rental','rental',0],['Дозер','sludge_transport_rental','rental',0]
];
const TRUCKS = ['ХОВО 802','ХОВО 803','ХОВО 809','ХОВО 810','18-58 ТТА (834)','98-00 ТТА (835)','82-09 ӨМҮ (836)','00-96 ММА','51-38 УКМ','08-46 УНН','08-49 УНН','HDU831','HDU832','HDU833'];

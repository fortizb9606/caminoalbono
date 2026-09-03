(function(){
'use strict';
const fmt=n=>new Intl.NumberFormat('es-CL').format(Math.round(n));
const money=n=>'$'+fmt(n);
const pct=n=>Math.round((n||0)*100)+'%';

function cfg(){ return window.BONUS_CFG||window.BONUS_CONFIG_DEFAULTS; }
function raw(kg,p,c){
  const labor=p*c.cost;
  const sav=Math.max(0,c.target*kg-labor);
  const th=c.thresholdKg[p];
  if(!th||kg<th[1]||sav<=0) return {sav,share:0,pozo:0,li:-1};
  let li=-1;
  th.forEach((v,i)=>{ if(kg>=v) li=i; });
  const share=li>=2 ? c.shares[Math.min(li-1,3)] : c.shares[0];
  return {sav,share,pozo:sav*share,li};
}
function eff(kg,p,c){
  const th=c.thresholdKg[p], r=raw(kg,p,c);
  let pozo=r.pozo;
  [2,3,4].forEach(i=>{
    if(kg>=th[i]) pozo=Math.max(pozo,raw(Math.max(0,th[i]-c.eqKg),p,c).pozo);
  });
  return {...r,pozo,frozen:pozo>r.pozo+.5};
}
function level(kg,p,c){
  const t=c.thresholdKg[p];
  if(kg<t[0]) return 'Bajo Base';
  if(kg<t[1]) return 'Base';
  if(kg<t[2]) return 'N1';
  if(kg<t[3]) return 'N2';
  if(kg<t[4]) return 'N3';
  return 'N4';
}
function rowData(kg,p,c){
  const labor=p*c.cost, r=eff(kg,p,c);
  const gross=p?r.pozo/p:0;
  const liq=gross*c.net;
  const final=kg?(labor+r.pozo)/kg:0;
  const company=Math.max(0,r.sav-r.pozo);
  return {r,gross,liq,final,company};
}
function css(){
  if(document.getElementById('boStyle')) return;
  const s=document.createElement('style');
  s.id='boStyle';
  s.textContent=`
  .bo-btn{border:1px solid var(--line2);background:transparent;color:var(--agua);border-radius:999px;padding:8px 12px;font:600 10px Oswald;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;margin-left:10px;white-space:nowrap}
  .bo-btn.on{background:var(--agua);color:#0c0e0f;border-color:var(--agua)}
  .bo-wrap{display:none;border-top:1px solid var(--line);background:#101415;padding:14px 16px 18px}.bo-wrap.on{display:block}
  .bo-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
  .bo-segs{display:flex;gap:6px;overflow:auto;padding-bottom:2px}.bo-seg{border:1px solid var(--line2);background:var(--card);color:var(--muted2);border-radius:999px;padding:8px 11px;font:600 10px Oswald;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.bo-seg.on{background:var(--lime);color:#0c0e0f;border-color:var(--lime)}
  .bo-summary{font-size:11px;color:var(--muted)}
  .bo-tablewrap{overflow:auto;border:1px solid var(--line);border-radius:12px;max-height:470px}
  .bo-table{width:100%;border-collapse:collapse;min-width:980px;background:var(--card)}
  .bo-table th{position:sticky;top:0;z-index:2;background:#171c1d;font:600 9px Oswald;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:10px 8px;text-align:right;border-bottom:1px solid var(--line)}
  .bo-table th:first-child,.bo-table td:first-child{text-align:left}
  .bo-table td{padding:9px 8px;border-bottom:1px solid var(--line);font-size:11px;text-align:right;white-space:nowrap}
  .bo-table tr:last-child td{border-bottom:0}.bo-table tr.bo-milestone td{background:#18201b}.bo-liq{color:var(--lime);font-weight:800}.bo-protected{color:var(--amarillo);font-size:9px;margin-left:4px}.bo-lvl{display:inline-block;border:1px solid var(--line2);border-radius:999px;padding:3px 7px;font:600 9px Oswald}
  @media(max-width:760px){.bo-btn{margin-left:0;margin-top:7px}.bo-tools{display:block}.bo-summary{margin-top:8px}}
  `;
  document.head.appendChild(s);
}
function rangeFor(p,seg,c){
  const t=c.thresholdKg[p], step=c.eqKg;
  if(seg==='b1') return [t[0],t[1]];
  if(seg==='12') return [t[1],t[2]];
  if(seg==='23') return [t[2],t[3]];
  if(seg==='34') return [t[3],t[4]];
  return [t[0],t[4]];
}
function render(open,p,seg){
  const c=cfg(); if(!c||!c.thresholdKg||!c.thresholdKg[p]) return;
  const [from,to]=rangeFor(p,seg,c), step=Math.max(1,Number(c.eqKg)||15), t=c.thresholdKg[p];
  const rows=[];
  let kg=Math.ceil(from/step)*step;
  if(Math.abs(kg-from)>0.001) rows.push(from);
  for(;kg<=to+0.001;kg+=step) rows.push(kg);
  if(rows.length===0||Math.abs(rows[rows.length-1]-to)>0.001) rows.push(to);
  const milestones=new Set(t.map(Number));
  const body=rows.map(k=>{
    const d=rowData(k,p,c), r=d.r, eq=k/step;
    return `<tr class="${milestones.has(Number(k))?'bo-milestone':''}">
      <td><b>${Number.isInteger(eq)?fmt(eq):eq.toFixed(1).replace('.',',')}</b></td>
      <td>${fmt(k)}</td>
      <td><span class="bo-lvl">${level(k,p,c)}</span>${r.frozen?'<span class="bo-protected">pozo protegido</span>':''}</td>
      <td>${r.share?pct(r.share):'—'}</td>
      <td>${money(r.sav)}</td>
      <td>${money(r.pozo)}</td>
      <td class="bo-liq">${money(d.liq)}</td>
      <td>${money(d.gross)}</td>
      <td>${money(d.final)}</td>
      <td>${money(d.company)}</td>
    </tr>`;
  }).join('');
  open.querySelector('.bo-summary').textContent=`${rows.length} puntos · ${fmt(from)} a ${fmt(to)} kg · paso ${fmt(step)} kg`;
  open.querySelector('tbody').innerHTML=body;
}
function attach(card,p){
  if(card.dataset.bo==='1') return;
  card.dataset.bo='1';
  const head=card.querySelector('.phead'); if(!head) return;
  const right=head.lastElementChild||head;
  const btn=document.createElement('button');
  btn.className='bo-btn'; btn.type='button'; btn.textContent='Ver apertura';
  right.appendChild(btn);
  const open=document.createElement('div');
  open.className='bo-wrap';
  open.innerHTML=`<div class="bo-tools"><div class="bo-segs">
    <button class="bo-seg" data-s="all">Todo</button>
    <button class="bo-seg" data-s="b1">Base → N1</button>
    <button class="bo-seg on" data-s="12">N1 → N2</button>
    <button class="bo-seg" data-s="23">N2 → N3</button>
    <button class="bo-seg" data-s="34">N3 → N4</button>
  </div><div class="bo-summary"></div></div>
  <div class="bo-tablewrap"><table class="bo-table"><thead><tr>
    <th>Malla eq.</th><th>kg reales</th><th>Nivel</th><th>% equipo</th><th>Ahorro</th><th>Pozo equipo</th><th>Líquido/persona</th><th>Bruto/persona</th><th>Costo final/kg</th><th>Empresa</th>
  </tr></thead><tbody></tbody></table></div>`;
  card.appendChild(open);
  let seg='12';
  btn.onclick=()=>{
    const show=!open.classList.contains('on');
    open.classList.toggle('on',show); btn.classList.toggle('on',show); btn.textContent=show?'Cerrar apertura':'Ver apertura';
    if(show) render(open,p,seg);
  };
  open.querySelectorAll('.bo-seg').forEach(b=>b.onclick=()=>{
    seg=b.dataset.s; open.querySelectorAll('.bo-seg').forEach(x=>x.classList.toggle('on',x===b)); render(open,p,seg);
  });
}
function scan(){
  css();
  const details=document.getElementById('bcDetails'); if(!details) return;
  details.querySelectorAll('.pcard').forEach(card=>{
    const h=card.querySelector('.phead h3');
    const m=h&&h.textContent.match(/(\d+)/); if(m) attach(card,+m[1]);
  });
}
const obs=new MutationObserver(()=>scan());
function start(){ scan(); obs.observe(document.body,{childList:true,subtree:true}); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
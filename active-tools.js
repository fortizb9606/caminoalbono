(function(){
'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('es-CL').format(Math.round(Number(n)||0));
const money=n=>'$'+fmt(n);

function activeState(){try{return JSON.parse(localStorage.getItem('turnoState')||'null')}catch(e){return null}}
function people(){const s=activeState();if(s&&Array.isArray(s.crew)&&s.crew.length)return s.crew.length;const t=($('crew')&&$('crew').textContent)||'';const m=t.match(/(\d+)\s+person/);return m?+m[1]:0}
function currentKg(){const t=($('kgToday')&&$('kgToday').textContent)||'0';return Number(t.replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''))||0}
function cfg(){return window.BONUS_CFG||window.BONUS_CONFIG_DEFAULTS||null}
function raw(kg,p,c){const scale=c.scale&&c.scale[p]?Number(c.scale[p]):1,labor=p*c.cost,sav=Math.max(0,(c.target*scale)*kg-labor),th=c.thresholdKg[p];if(!th||kg<th[1]||sav<=0)return{sav,share:0,pozo:0,li:-1};let li=-1;th.forEach((v,i)=>{if(kg>=v)li=i});const share=li>=2?c.shares[Math.min(li-1,3)]:c.shares[0];return{sav,share,pozo:sav*share,li}}
function eff(kg,p,c){const th=c.thresholdKg[p],r=raw(kg,p,c);let pozo=r.pozo;[2,3,4].forEach(i=>{if(kg>=th[i])pozo=Math.max(pozo,raw(Math.max(0,th[i]-c.eqKg),p,c).pozo)});return{...r,pozo,frozen:pozo>r.pozo+.5}}
function liquidPerPerson(kg,p,c){const r=eff(kg,p,c);return p?r.pozo/p*c.net:0}

function css(){if($('activeToolsCss'))return;const s=document.createElement('style');s.id='activeToolsCss';s.textContent=`
.atActions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px}.atBtn{border:1px solid var(--line2);background:transparent;color:var(--muted2);border-radius:12px;padding:11px 14px;font:600 11px Oswald;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;min-height:44px}.atBtn.open{border-color:var(--agua);color:var(--agua)}.atBtn.back{color:var(--muted)}
.atPanel{display:none;background:var(--card);border:1px solid var(--line);border-radius:18px;margin-bottom:16px;overflow:hidden}.atPanel.on{display:block}.atHead{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:15px 17px;border-bottom:1px solid var(--line)}.atHead h3{margin:0;font:700 20px Oswald;text-transform:uppercase}.atHead small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.atClose{border:1px solid var(--line2);background:transparent;color:var(--muted2);border-radius:10px;padding:9px 12px;cursor:pointer}.atScroll{overflow:auto;max-height:470px}.atTable{width:100%;border-collapse:collapse}.atTable th{position:sticky;top:0;background:#171c1d;z-index:2;font:600 10px Oswald;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:11px 16px;border-bottom:1px solid var(--line)}.atTable th:first-child,.atTable td:first-child{text-align:left}.atTable th:last-child,.atTable td:last-child{text-align:right}.atTable td{padding:11px 16px;border-bottom:1px solid var(--line);font-size:13px;white-space:nowrap}.atTable tr.current td{background:#202b25}.atTable tr.milestone td{border-top:1px solid var(--line2)}.atLiq{color:var(--lime);font:800 15px Oswald}.atNow{color:var(--agua);font:700 9px Oswald;margin-left:7px;text-transform:uppercase}
.atResume{display:none;border:1px solid var(--agua);background:linear-gradient(135deg,#15201d,var(--card));border-radius:16px;padding:14px 16px;margin-bottom:14px;align-items:center;justify-content:space-between;gap:12px}.atResume.on{display:flex}.atResume b{font:600 15px Oswald;text-transform:uppercase}.atResume span{display:block;color:var(--muted2);font-size:11px;margin-top:3px}.atResume button{border:0;background:var(--agua);color:#0c0e0f;border-radius:11px;padding:11px 15px;font:700 11px Oswald;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;min-height:44px}
@media(max-width:640px){.atActions{justify-content:flex-end}.atBtn{padding:10px 11px}.atResume{align-items:flex-start;flex-direction:column}.atResume button{width:100%}.atTable th,.atTable td{padding:10px 13px}}
`;document.head.appendChild(s)}

function renderOpening(){
  const panel=$('activeOpeningPanel'),body=$('activeOpeningBody'),meta=$('activeOpeningMeta');if(!panel||!body||!meta)return;
  const c=cfg(),p=people();
  if(!c||!p||!c.thresholdKg||!c.thresholdKg[p]){body.innerHTML='<tr><td colspan="2">No hay configuración para este número de personas.</td></tr>';return}
  const t=c.thresholdKg[p],step=Math.max(1,Number(c.eqKg)||15),from=t[1],to=t[4],now=currentKg(),currentEq=now/step,rows=[];
  let kg=Math.ceil(from/step)*step;if(Math.abs(kg-from)>.001)rows.push(from);for(;kg<=to+.001;kg+=step)rows.push(kg);if(!rows.length||Math.abs(rows[rows.length-1]-to)>.001)rows.push(to);
  const milestones=new Set(t.slice(1).map(Number));
  body.innerHTML=rows.map(k=>{const eq=k/step,isCurrent=Math.abs(eq-currentEq)<.5,liq=liquidPerPerson(k,p,c);return `<tr class="${isCurrent?'current ':''}${milestones.has(Number(k))?'milestone':''}"><td><b>${Number.isInteger(eq)?fmt(eq):eq.toFixed(1).replace('.',',')}</b>${isCurrent?'<span class="atNow">ahora</span>':''}</td><td class="atLiq">${money(liq)}</td></tr>`}).join('');
  meta.textContent=`${p} personas · bono desde ${fmt(from/step)} mallas · van en ${fmt(currentEq)} mallas`;
  if(panel.classList.contains('on')){const cur=body.querySelector('tr.current');if(cur)setTimeout(()=>cur.scrollIntoView({block:'center',behavior:'smooth'}),40)}
}

function mount(){css();const main=$('main'),setup=$('setup');if(!main||!setup)return;
  const top=main.querySelector('.topbar');if(top&&!$('activeOpeningBtn')){const right=top.lastElementChild;const oldEnd=$('endBtn');const actions=document.createElement('div');actions.className='atActions';if(oldEnd){oldEnd.style.marginTop='0';actions.appendChild(oldEnd)}const open=document.createElement('button');open.id='activeOpeningBtn';open.className='atBtn open';open.type='button';open.textContent='Ver apertura';const back=document.createElement('button');back.id='activeBackBtn';back.className='atBtn back';back.type='button';back.textContent='← Volver';actions.appendChild(open);actions.appendChild(back);right.appendChild(actions);
    const panel=document.createElement('div');panel.id='activeOpeningPanel';panel.className='atPanel';panel.innerHTML='<div class="atHead"><div><h3>Apertura del turno</h3><small id="activeOpeningMeta"></small></div><button class="atClose" id="activeOpeningClose" type="button">Cerrar</button></div><div class="atScroll"><table class="atTable"><thead><tr><th>Mallas</th><th>Líquido / persona</th></tr></thead><tbody id="activeOpeningBody"></tbody></table></div>';top.insertAdjacentElement('afterend',panel);
    open.onclick=()=>{panel.classList.toggle('on');open.textContent=panel.classList.contains('on')?'Cerrar apertura':'Ver apertura';if(panel.classList.contains('on'))renderOpening()};$('activeOpeningClose').onclick=()=>{panel.classList.remove('on');open.textContent='Ver apertura'};
    back.onclick=()=>{panel.classList.remove('on');main.style.display='none';setup.style.display='block';showResume(true);window.scrollTo(0,0)};
  }
  if(!$('activeResume')){const d=document.createElement('div');d.id='activeResume';d.className='atResume';d.innerHTML='<div><b>Turno en curso</b><span>La producción quedó guardada. Puedes volver sin perder lo registrado.</span></div><button id="activeResumeBtn" type="button">Retomar turno</button>';const start=$('startBtn');if(start)start.insertAdjacentElement('beforebegin',d);$('activeResumeBtn').onclick=()=>{setup.style.display='none';main.style.display='block';showResume(false);renderOpening();window.scrollTo(0,0)}}
  const kg=$('kgToday');if(kg&&!kg.dataset.atObs){kg.dataset.atObs='1';new MutationObserver(()=>{if($('activeOpeningPanel')&&$('activeOpeningPanel').classList.contains('on'))renderOpening()}).observe(kg,{childList:true,characterData:true,subtree:true})}
}
function showResume(on){const d=$('activeResume');if(d)d.classList.toggle('on',!!on&&!!activeState())}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
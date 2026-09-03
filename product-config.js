(function(){
'use strict';
const K='theIceProductsV1';
const DEFAULTS=[
  {id:'original15',name:'Pack 15 kg',tag:'Original',kg:15,bonus:true},
  {id:'original12',name:'Pack 12 kg',tag:'Original',kg:12,bonus:true},
  {id:'mini15',name:'Pack 15 kg',tag:'Mini',kg:15,bonus:true},
  {id:'saco20',name:'Saco 20 kg',tag:'Reserva',kg:20,bonus:false}
];
const cp=o=>JSON.parse(JSON.stringify(o));
function cleanId(v,i){return String(v||('producto-'+i)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||('producto-'+i)}
function norm(a){
  if(!Array.isArray(a)||!a.length)return cp(DEFAULTS);
  const used=new Set();
  return a.map((x,i)=>{
    let id=cleanId(x&&x.id,i);while(used.has(id))id+='-'+(i+1);used.add(id);
    return {id,name:String(x&&x.name||'Producto '+(i+1)).trim(),tag:String(x&&x.tag||'').trim(),kg:Math.max(.1,Number(x&&x.kg)||1),bonus:!!(x&&x.bonus)};
  });
}
function load(){try{return norm(JSON.parse(localStorage.getItem(K)||'null'))}catch(e){return cp(DEFAULTS)}}
function save(a){const v=norm(a);localStorage.setItem(K,JSON.stringify(v));window.THE_ICE_PRODUCTS=v;window.dispatchEvent(new CustomEvent('theiceproductschange',{detail:v}));return v}
window.THE_ICE_PRODUCT_DEFAULTS=cp(DEFAULTS);
window.THE_ICE_PRODUCTS=load();
window.THE_ICE_SAVE_PRODUCTS=save;

function css(){if(document.getElementById('prodCfgCss'))return;const s=document.createElement('style');s.id='prodCfgCss';s.textContent=`
.pcProductRows{display:grid;gap:10px;margin-top:12px}.pcProductRow{display:grid;grid-template-columns:1.5fr 1fr 110px 145px 46px;gap:8px;align-items:end;background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:12px}.pcProductRow label{display:block;color:var(--muted);font:600 9px Oswald;letter-spacing:.13em;text-transform:uppercase;margin-bottom:6px}.pcProductRow input[type=text],.pcProductRow input[type=number]{width:100%;background:var(--input);border:1px solid var(--line2);color:var(--text);border-radius:9px;padding:10px;font:600 14px Oswald}.pcCheck{min-height:42px;display:flex;align-items:center;gap:8px;color:var(--text);font-size:12px}.pcCheck input{width:20px;height:20px}.pcDel{height:42px;border:1px solid #5c2a1e;background:transparent;color:var(--coral);border-radius:10px;cursor:pointer;font-size:16px}.pcAdd{margin-top:10px;border:1px dashed var(--line2);background:transparent;color:var(--agua);border-radius:12px;padding:12px 16px;font:600 11px Oswald;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.pcHint{font-size:12px;color:var(--muted);line-height:1.45;margin-top:8px}.pcStock{display:inline-block;border:1px solid #51615c;color:var(--agua);padding:3px 7px;border-radius:999px;font:600 9px Oswald;margin-left:6px}@media(max-width:760px){.pcProductRow{grid-template-columns:1fr 1fr}.pcDel{grid-column:2;justify-self:end;width:46px}.pcCheck{grid-column:1}}
`;document.head.appendChild(s)}
function currentFromRows(){return [...document.querySelectorAll('.pcProductRow')].map((r,i)=>({id:r.dataset.id||('producto-'+i),name:r.querySelector('[data-f=name]').value,tag:r.querySelector('[data-f=tag]').value,kg:+r.querySelector('[data-f=kg]').value||1,bonus:r.querySelector('[data-f=bonus]').checked}))}
function row(x){const d=document.createElement('div');d.className='pcProductRow';d.dataset.id=x.id;d.innerHTML=`<div><label>Producto</label><input data-f="name" type="text" value="${String(x.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></div><div><label>Categoría</label><input data-f="tag" type="text" value="${String(x.tag).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></div><div><label>Kg / unidad</label><input data-f="kg" type="number" min="0.1" step="0.1" value="${x.kg}"></div><label class="pcCheck"><input data-f="bonus" type="checkbox" ${x.bonus?'checked':''}> Cuenta para bono</label><button class="pcDel" type="button" title="Eliminar">✕</button>`;d.querySelector('.pcDel').onclick=()=>{if(document.querySelectorAll('.pcProductRow').length<=1){alert('Debe quedar al menos un producto.');return}d.remove()};return d}
function mount(){
  css();const panel=document.getElementById('bcS');if(!panel||document.getElementById('pcProductsCard'))return;
  const savebar=panel.querySelector('.savebar');const c=document.createElement('div');c.className='card';c.id='pcProductsCard';c.innerHTML='<p class="sec">Productos e inventario</p><p class="secSub">Define qué productos existen y cuáles suman producción para el bono.</p><div class="pcProductRows" id="pcProductRows"></div><button class="pcAdd" id="pcAdd" type="button">＋ Agregar producto</button><div class="pcHint">Los productos con <b>Cuenta para bono</b> aparecen en la producción del turno y sus kg suman al Camino al Bono. Los demás son sólo stock de inventario final. <span class="pcStock">Saco 20 kg = reserva</span></div>';
  if(savebar)panel.insertBefore(c,savebar);else panel.appendChild(c);
  const b=document.getElementById('pcProductRows');window.THE_ICE_PRODUCTS.forEach(x=>b.appendChild(row(x)));
  document.getElementById('pcAdd').onclick=()=>{const i=b.children.length+1;b.appendChild(row({id:'producto-'+Date.now(),name:'Nuevo producto',tag:'',kg:15,bonus:false}))};
  const saveBtn=document.getElementById('bcSave');if(saveBtn&&!saveBtn.dataset.productsHook){saveBtn.dataset.productsHook='1';saveBtn.addEventListener('click',()=>save(currentFromRows()),true)}
  const reset=document.getElementById('bcReset');if(reset&&!reset.dataset.productsHook){reset.dataset.productsHook='1';reset.addEventListener('click',()=>{save(cp(DEFAULTS));setTimeout(()=>{const host=document.getElementById('pcProductRows');if(host){host.innerHTML='';window.THE_ICE_PRODUCTS.forEach(x=>host.appendChild(row(x))) }},0)},true)}
}
const mo=new MutationObserver(()=>mount());
document.addEventListener('DOMContentLoaded',()=>{mount();mo.observe(document.body,{childList:true,subtree:true})});
})();
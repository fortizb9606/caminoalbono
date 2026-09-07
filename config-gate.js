(function(){
'use strict';
const AK='theIceConfigAccessV1';
function unlocked(){return !!sessionStorage.getItem(AK)}
async function verify(pin){
  try{
    const r=await fetch('/api/config?verify=1',{method:'POST',headers:{'x-config-pin':String(pin||'')},cache:'no-store'});
    return r.ok;
  }catch(e){return false}
}
document.addEventListener('click',async e=>{
  const b=e.target&&e.target.closest?e.target.closest('#bonusCfgBtn'):null;
  if(!b||unlocked())return;
  e.preventDefault();e.stopImmediatePropagation();
  const pin=prompt('Código de acceso a Configuración');
  if(pin===null)return;
  if(await verify(pin)){
    sessionStorage.setItem(AK,String(pin));
    setTimeout(()=>b.click(),0);
  }else alert('Código incorrecto.');
},true);
window.THE_ICE_CONFIG_PIN=()=>sessionStorage.getItem(AK)||'';
})();

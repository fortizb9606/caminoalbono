(function(){
'use strict';

// Compatibilidad con instalaciones anteriores. El flujo completo de
// inventario inicial, producción, inventario final y sincronización vive
// ahora en index.html para que también funcione en Safari de iPad.
function sync(){
  if(typeof window.THE_ICE_SYNC_TURNOS==='function'){
    try{window.THE_ICE_SYNC_TURNOS()}catch(e){}
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,600));
else setTimeout(sync,600);
window.addEventListener('online',sync);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
})();

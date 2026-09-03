export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  let central=null;
  try{const u=new URL('/api/config',request.url);const r=await fetch(u);if(r.ok)central=await r.json()}catch(e){}
  const seed=central?`<script>try{localStorage.setItem('theIceBonusConfigV3',${JSON.stringify(JSON.stringify(central.bonus))});localStorage.setItem('theIceProductsV1',${JSON.stringify(JSON.stringify(central.products))})}catch(e){}</script>\n`:'';
  html = html.replace('<script>\n(function(){',seed+'<script src="/bonus-config.js"></script>\n<script src="/product-config.js"></script>\n<script src="/central-config.js"></script>\n<script src="/bonus-opening.js"></script>\n<script src="/inventory-flow-v2.js"></script>\n<script>\n(function(){');
  html = html.replace('const COST=37000, TARGET=70, KGBAG=15, NET=.76, REF=6, MAX_BELOW=3;\n  const TH=[190,220,260,300,360], SHARES=[1,.8,.7,.6];',`const BC=window.BONUS_CFG||{};\n  const COST=Number(BC.cost||37000), TARGET=Number(BC.target||70), KGBAG=Number(BC.eqKg||15), NET=Number(BC.net||.76), REF=6, MAX_BELOW=3;\n  const TH=(BC.thresholdKg&&BC.thresholdKg[6]?BC.thresholdKg[6].map(x=>Number(x)/KGBAG):[190,220,260,300,360]), SHARES=(Array.isArray(BC.shares)&&BC.shares.length===4?BC.shares:[.8,.75,.6,.6]);`);
  html = html.replace(`const PRODUCTS=[\n    {name:"Pack 15 kg",tag:"Original",kg:15},\n    {name:"Pack 12 kg",tag:"Original",kg:12},\n    {name:"Pack 15 kg",tag:"Mini",kg:15},\n  ];`,`const PRODUCTS=((window.THE_ICE_PRODUCTS||[]).filter(p=>p.bonus).map(p=>({name:p.name,tag:p.tag,kg:Number(p.kg)||1,id:p.id})));\n  if(!PRODUCTS.length) PRODUCTS.push({name:"Pack 15 kg",tag:"Original",kg:15,id:"fallback"});`);
  html = html.replace('function scaled(p){const f=p/REF;return TH.map(x=>Math.round(x*f))}',`function scaled(p){const a=BC.thresholdKg&&BC.thresholdKg[p];if(Array.isArray(a)&&a.length===5)return a.map(x=>Number(x)/KGBAG);const f=p/REF;return TH.map(x=>Math.round(x*f))}`);
  html = html.replace('function trigger(p){return Math.floor(p*COST/(TARGET*KGBAG))+1}','function trigger(p){return scaled(p)[1]}');
  html = html.replace('const th=scaled(p), m=mallasEq(kg);\n    let li=-1;','const th=scaled(p), m=mallasEq(kg);\n    if(m<trigger(p))return{sav,share:0,pozo:0,li:-1};\n    let li=-1;');
  html = html.replace("'se activa cuando el kilo baje de $'+TARGET","'se activa al llegar a '+fmt(trigger(p))+' mallas equivalentes'");
  html = html.replace("S={start:Date.now(),crew:chosen.crew,crewByShift:chosen.byShift,inv:[+$('inv0').value||0,+$('inv1').value||0,+$('inv2').value||0],counts:[0,0,0]};","S={start:Date.now(),crew:chosen.crew,crewByShift:chosen.byShift,inv:Array(PRODUCTS.length).fill(0),counts:Array(PRODUCTS.length).fill(0)};");
  html = html.replace("$('invNow'+i).textContent=S.inv[i]+S.counts[i];","$('invNow'+i).textContent=(S.inv[i]||0)+S.counts[i];");
  const headers = new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
};
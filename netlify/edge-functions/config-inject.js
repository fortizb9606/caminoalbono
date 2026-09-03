export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  html = html.replace('<script>\n(function(){','<script src="/bonus-config.js"></script>\n<script>\n(function(){');
  html = html.replace('const COST=37000, TARGET=70, KGBAG=15, NET=.76, REF=6, MAX_BELOW=3;\n  const TH=[190,220,260,300,360], SHARES=[1,.8,.7,.6];',`const BC=window.BONUS_CFG||{};\n  const COST=Number(BC.cost||37000), TARGET=Number(BC.target||70), KGBAG=Number(BC.eqKg||15), NET=Number(BC.net||.76), REF=6, MAX_BELOW=3;\n  const TH=(BC.thresholdKg&&BC.thresholdKg[6]?BC.thresholdKg[6].map(x=>Number(x)/KGBAG):[190,220,260,300,360]), SHARES=(Array.isArray(BC.shares)&&BC.shares.length===4?BC.shares:[.8,.75,.6,.6]);`);
  html = html.replace('function scaled(p){const f=p/REF;return TH.map(x=>Math.round(x*f))}',`function scaled(p){\n    const a=BC.thresholdKg&&BC.thresholdKg[p];\n    if(Array.isArray(a)&&a.length===5)return a.map(x=>Number(x)/KGBAG);\n    const f=p/REF;return TH.map(x=>Math.round(x*f))\n  }`);
  html = html.replace('function trigger(p){return Math.floor(p*COST/(TARGET*KGBAG))+1}','function trigger(p){return scaled(p)[1]}');
  html = html.replace('const th=scaled(p), m=mallasEq(kg);\n    let li=-1;','const th=scaled(p), m=mallasEq(kg);\n    if(m<trigger(p))return{sav,share:0,pozo:0,li:-1};\n    let li=-1;');
  html = html.replace("'se activa cuando el kilo baje de $'+TARGET","'se activa al llegar a '+fmt(trigger(p))+' mallas equivalentes'");
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
};
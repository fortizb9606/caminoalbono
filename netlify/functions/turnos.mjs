import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

function store(){return getStore('camino-turnos',{consistency:'strong'})}
const KEY_HASH='b94014e34122d1a2fe1c4bfc6dc3be078d3e4546bcdf0d5b95b2f5390c1a62ba';
function authorized(req){
  const key=String(req.headers.get('x-turno-key')||'');
  const got=createHash('sha256').update(key).digest();
  const expected=Buffer.from(KEY_HASH,'hex');
  return got.length===expected.length&&timingSafeEqual(got,expected);
}

async function rowsFrom(s){
  const {blobs}=await s.list();
  const rows=[];
  for(const b of blobs){const row=await s.get(b.key,{type:'json'});if(row)rows.push(row)}
  rows.sort((a,b)=>(a.ts||0)-(b.ts||0));
  return rows;
}

export default async (req)=>{
  if(!authorized(req))return new Response('No autorizado',{status:403});
  const s=store();
  const url=new URL(req.url);
  if(req.method==='GET')return Response.json(await rowsFrom(s),{headers:{'cache-control':'no-store'}});
  if(req.method==='POST'){
    let body;try{body=await req.json()}catch{return new Response('JSON inválido',{status:400})}
    if(!body||!body.ts)return new Response('Turno inválido',{status:400});
    const key=String(body.ts),existing=await s.get(key,{type:'json'});
    const merged=existing?{...existing,...body}:body;
    await s.setJSON(key,merged);
    return Response.json({ok:true,ts:body.ts,recordVersion:merged.recordVersion||1});
  }
  if(req.method==='DELETE'){
    const ts=url.searchParams.get('ts');
    if(!ts)return new Response('Falta ts',{status:400});
    await s.delete(String(ts));
    return Response.json({ok:true});
  }
  return new Response('Method not allowed',{status:405});
};

export const config={path:'/api/turnos'};

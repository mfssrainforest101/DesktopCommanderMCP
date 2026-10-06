import assert from 'node:assert/strict';
import http from 'node:http';
const upstream=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');if(req.headers.authorization==='Bearer valid'){res.end(JSON.stringify({id:'allowed-user',aud:'authenticated'}))}else if(req.headers.authorization==='Bearer disallowed'){res.end(JSON.stringify({id:'other-user',aud:'authenticated'}))}else{res.statusCode=401;res.end(JSON.stringify({message:'Invalid token'}))}});
await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
process.env.MCP_SUPABASE_URL=`http://127.0.0.1:${upstream.address().port}`;
process.env.MCP_SUPABASE_ANON_KEY='test-only';process.env.MCP_ALLOWED_USER_IDS='allowed-user';
const {POST}=await import('../app/api/mcp/route.js');
const call=(body,token='valid')=>POST(new Request('http://localhost/api/mcp',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify(body)}));
try{
assert.equal((await call({},'invalid')).status,401);
assert.equal((await call({},'disallowed')).status,403);
let r=await call({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'test',version:'1'}}});assert.equal(r.status,200);assert.equal((await r.json()).result.serverInfo.name,'wayfinder-desktop-commander');
r=await call({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});assert.equal(r.status,200);assert.equal((await r.json()).result.tools.length,2);
r=await call({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'cloud_execute',arguments:{command:'echo test'}}});assert.equal((await r.json()).result.isError,true);
console.log('PASS: invalid/disallowed users denied; authenticated initialize and tools/list; cloud disabled');
}finally{upstream.close();}

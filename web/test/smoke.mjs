import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
let r=await fetch(base);assert.equal(r.status,200);assert.match(await r.text(),/Two execution worlds/);
r=await fetch(base+'/api/health');assert.equal(r.status,200);const health=await r.json();assert.equal(health.authenticationConfigured,false);assert.equal(health.cloudExecutionEnabled,false);
r=await fetch(base+'/api/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{}})});assert.equal(r.status,503);
r=await fetch(base+'/api/mcp');assert.equal(r.status,405);
console.log('PASS: homepage, readiness, fail-closed MCP, method restriction');

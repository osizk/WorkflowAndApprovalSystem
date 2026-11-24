import assert from 'node:assert/strict';
import {test} from 'node:test';
const origin=process.env.WORKFLOW_UAT_ORIGIN;
assert.equal(origin,'https://scd928edd-4d7hbszvwq-as.a.run.app');
async function request(name,path,options={}) {
  const response=await fetch(new URL(path,origin),{...options,signal:AbortSignal.timeout(20000)});
  const body=await response.json();
  console.log(JSON.stringify({name,atUtc:new Date().toISOString(),path,status:response.status,body}));
  return {status:response.status,body};
}
test('health before affected regression',async()=>{const r=await request('health before','/api/health');assert.equal(r.status,200);assert.equal(r.body.status,'ok');});
test('database readiness remains available',async()=>{const r=await request('database readiness','/api/ready');assert.equal(r.status,200);assert.equal(r.body.db,'connected');});
test('signed-out identity remains denied',async()=>{const r=await request('signed-out session','/api/session');assert.equal(r.status,401);assert.equal(r.body.error.code,'AUTH_REQUIRED');});
test('malformed JSON remains a safe client error',async()=>{const r=await request('malformed JSON','/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:'{'});assert.equal(r.status,400);assert.equal(r.body.error.code,'BAD_REQUEST');});
test('health after rejected malformed body',async()=>{const r=await request('health after','/api/health');assert.equal(r.status,200);assert.equal(r.body.status,'ok');});

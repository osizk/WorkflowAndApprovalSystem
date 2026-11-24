import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const mappingFile=path.resolve(here,'../cd-workflow-corrected-20261124/Workflow/corrected-serving-version.json');
const mapping=JSON.parse(await readFile(mappingFile,'utf8'));
const origin='https://scd928edd-4d7hbszvwq-as.a.run.app';
assert.equal(mapping.service.status.url,origin);
assert.equal(mapping.releaseId,'WF-FIX-001');
assert.equal(mapping.sourceCommit,'ad2cbef67decf9953219694898327dea0bb66034');
assert.equal(mapping.marker,mapping.sourceCommit.slice(0,12));
assert.deepEqual(mapping.service.status.traffic.map(t=>[t.revisionName,t.percent]),[['scd928edd-00008-9zd',100]]);
assert.ok(mapping.revision.status.imageDigest.endsWith('@'+mapping.sourceTag.image_summary.digest));
const original=path.resolve(here,'../wf-bug-001-confirmation/oversized-login.test.mjs');
await copyFile(original,path.join(here,'oversized-login.test.mjs'));
const originalHash=createHash('sha256').update(await readFile(original)).digest('hex');
assert.equal(originalHash,createHash('sha256').update(await readFile(path.join(here,'oversized-login.test.mjs'))).digest('hex'));
const startedAtUtc=new Date().toISOString();
async function marker(label){
  const response=await fetch(origin+'/login',{signal:AbortSignal.timeout(20000)});
  const html=await response.text();
  const scripts=Array.from(html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),m=>new URL(m[1],origin));
  assert.ok(scripts.length>0&&scripts.length<=3,'Expected a bounded SPA bootstrap');
  let servedSource=null,assetPath=null,assetSha256=null;
  for(const url of scripts){
    assert.equal(url.origin,origin,'Do not follow third-party assets');
    const asset=await fetch(url,{signal:AbortSignal.timeout(20000)});assert.equal(asset.status,200);
    const js=await asset.text();const found=Array.from(js.matchAll(/\b[0-9a-f]{40}\b/g),m=>m[0]).find(s=>s===mapping.sourceCommit);
    if(found){servedSource=found;assetPath=url.pathname;assetSha256=createHash('sha256').update(js).digest('hex');break;}
  }
  const result={label,atUtc:new Date().toISOString(),status:response.status,marker:servedSource?.slice(0,12)??null,servedSource,assetPath,assetSha256,method:'Full source constant in same-origin served SPA bundle; rendered footer separately observed in the browser'};
  await writeFile(path.join(here,label+'.json'),JSON.stringify(result,null,2));
  assert.equal(response.status,200);assert.equal(result.marker,mapping.marker,'Public release marker must match the supplied corrected mapping');
  return result;
}
const before=await marker('marker-before');
function run(file,output){
  const result=spawnSync(process.execPath,['--test',file],{cwd:here,env:{...process.env,WORKFLOW_UAT_ORIGIN:origin},encoding:'utf8',timeout:120000});
  const text=(result.stdout??'')+(result.stderr??'');
  return writeFile(path.join(here,output),text).then(()=>({exitCode:result.status,signal:result.signal,output:text}));
}
const boundary=await run('oversized-login.test.mjs','boundary-actual-output.txt');
const supplemental=await run('supplemental.test.mjs','supplemental-actual-output.txt');
const after=await marker('marker-after');
function objects(text){return text.split(/\r?\n/).map(l=>l.replace(/^#\s*/,'')).filter(l=>l.startsWith('{')).map(l=>JSON.parse(l));}
const observations=objects(boundary.output);
const envelopeCorrect=observations.some(o=>o.requestBytes===102401&&o.status===413&&o.response.error?.code==='PAYLOAD_TOO_LARGE');
const result={releaseId:mapping.releaseId,source:mapping.sourceCommit,marker:mapping.marker,revision:mapping.service.status.traffic[0].revisionName,digest:mapping.sourceTag.image_summary.digest,trafficPercent:100,cloudMappingProvenance:'C/D supplied fresh read-only mapping; A checked matching public marker before/after and remote successful deployment, not an independent A cloud readback',operator:'Codex GPT-6 under Student A/Punge089',startedAtUtc,completedAtUtc:new Date().toISOString(),originalReproducerSha256:originalHash,originalBoundaryTestCount:2,originalBoundaryExitCode:boundary.exitCode,supplementalTestCount:5,supplementalExitCode:supplemental.exitCode,oversizedEnvelopeCorrect:envelopeCorrect,observations,supplementalObservations:objects(supplemental.output),markerBefore:before,markerAfter:after,retestPassed:boundary.exitCode===0&&supplemental.exitCode===0&&envelopeCorrect,wholeProductAcceptance:false,applicationRecordsModified:false,credentialsUsed:false,priorFailurePreserved:true};
await writeFile(path.join(here,'result.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
process.exitCode=result.retestPassed?0:1;

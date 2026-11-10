"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const root=path.join(__dirname,'..');
function run(job){
  const source=readSource(job);
  const {Simulation,CARD_PARAMS,MODERATION}=new Function(source+';return {Simulation,CARD_PARAMS,MODERATION};')();
  const Legacy=job.mode==='policy'?new Function(execFileSync('git',['show','8df3085:simulation.js'],{cwd:root,encoding:'utf8'})+';return Simulation;')():null;
  if(job.parameters!==null){CARD_PARAMS.cold.forget=job.parameters.cold;MODERATION.rate=job.parameters.ban;}
  const g=new Simulation({seed:job.seed,scenario:job.scenario,role:job.role,difficulty:1});
  g.nextAI=100000;let next=1.15;
  const order=job.seed%2===0?['rumor','clarify']:['clarify','rumor'];
  const started=Date.now();
  while(!g.ended){
    g.step();
    if(!g.ended&&g.day<12&&g.day>=next){
      const opponent=g.opponent;
      for(const side of order){
        g.opponent=g.actors[side];
        if(job.mode==='policy'){
          const policy=side===job.role?Simulation:Legacy;
          g.scoreActions=policy.prototype.scoreActions;policy.prototype.aiTurn.call(g);
        }else g.aiTurn();
      }
      g.opponent=opponent;g.nextAI=100000;next=g.day+.9;
    }
  }
  return {...job,won:g.result.won,winner:g.result.winner,belief:g.result.belief,bans:g.banCount,
    played:g.player.played,fused:g.player.fused,seconds:g.tickCount*.15,computeMs:Date.now()-started};
}
function readSource(version){
  return version.revision===null?fs.readFileSync(path.join(root,version.source),'utf8'):execFileSync('git',['show',version.revision+':simulation.js'],{cwd:root,encoding:'utf8'});
}
if(!isMainThread)parentPort.postMessage(run(workerData));
else{
  const mode=process.argv[2],n=JSON.parse(process.argv[3]),start=JSON.parse(process.argv[4]);
  const versions={compare:[
    {version:'before',source:'simulation.js',revision:'8df3085',parameters:null},
    {version:'after',source:'simulation.js',revision:null,parameters:null}
  ],tune:[
    {version:'current',source:'simulation.js',revision:null,parameters:{cold:.016,ban:.0010}},
    {version:'candidate',source:'simulation.js',revision:null,parameters:{cold:.012,ban:.0008}}
  ],policy:[{version:'after',source:'simulation.js',revision:null,parameters:null}]}[mode];
  const jobs=[];
  for(const version of versions)for(let scenario=0;scenario<3;scenario++)for(const role of ['rumor','clarify'])for(let i=0;i<n;i++)
    jobs.push({...version,mode,scenario,role,seed:start+i});
  const rows=[],total=jobs.length,started=Date.now();
  async function lane(){
    while(jobs.length){
      const job=jobs.shift();
      const row=await new Promise((resolve,reject)=>{
        const worker=new Worker(__filename,{workerData:job});worker.on('message',resolve);worker.on('error',reject);
      });
      rows.push(row);
      console.log(rows.length+'/'+total,row.version,row.scenario,row.role,row.won?'win':'loss',row.computeMs+'ms');
    }
  }
  Promise.all(Array.from({length:4},lane)).then(()=>{
    const hashes=Object.fromEntries(versions.map(v=>[v.version,crypto.createHash('sha256').update(readSource(v)).digest('hex')]));
    const report={hashes,versions,totalMatches:rows.length,seedStart:start,seedsPerCell:n,elapsedMs:Date.now()-started,rows,
      method:mode==='policy'?'Current decision policy against the 8df3085 policy, both on the current engine with the same cards, income and rules. Current policy plays the reported role; other role uses the old aiTurn and scoreActions with current-engine projections. Same 0.9-day cadence from day 1.15; first mover alternates; choice events expire.':'Same complete AI for both actors at 0.9-day cadence from day 1.15; seed parity alternates first mover. Three scenarios and both player roles. Choice events expire; automatic and scene events run normally. Before/after compares the complete versions, not isolated changes.'};
    const out=path.join(root,'test-results/judging-review');fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'balance-'+mode+'-'+start+'.json'),JSON.stringify(report,null,2)+'\n');
    for(const v of versions)for(const role of ['rumor','clarify']){
      const sample=rows.filter(r=>r.version===v.version&&r.role===role);
      console.log('TOTAL',v.version,role,sample.filter(r=>r.won).length+'/'+sample.length);
    }
  });
}

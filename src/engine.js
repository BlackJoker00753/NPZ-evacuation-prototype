// Симулятор эвакуации НПЗ в остановочный ремонт. Один код для браузера и Node. Всё вымышлено.
const SIMLIB=(function(){
const CELL=2, W=640, H=420, GW=W/CELL, GH=H/CELL;
// ---------- площадка (метры, x — восток, y — север)
const UNITS=[
 {id:'AVT',name:'АВТ-3 (в ремонте)',r:[120,220,230,320]},
 {id:'REF',name:'Риформинг Л-35',r:[260,220,360,320]},
 {id:'HDS',name:'Гидроочистка ЛЧ-24',r:[392,220,490,320]},
 {id:'CLAUS',name:'Производство серы (Клаус)',r:[520,240,610,330]},
 {id:'GFU',name:'ГФУ',r:[390,80,470,160]},
];
const CAMP={id:'CAMP',name:'Городок подрядчиков',r:[480,14,620,64]};
const BUILD=[{id:'ADM',name:'Админкорпус и ЦЗЛ',r:[30,330,100,400],door:[104,362],shelter:0.12},{id:'OP',name:'Операторная (подпор воздуха)',r:[288,168,332,192],door:[310,164],shelter:0.0}];
const TANKS=[[90,80],[140,80],[190,80],[90,135],[140,135],[190,135]];
const TANKFARM=[55,45,225,170];
const RACKS=[ // эстакады: прямоугольник и проходы под ними
 {id:'E1',name:'Эстакада Э-1',r:[100,197,626,203],gaps:[[143,153],[243,253],[363,373],[473,483],[573,583]],axis:'x'},
 {id:'E2',name:'Эстакада Э-2',r:[377,203,383,416],gaps:[[255,263],[345,353]],axis:'y'},
];
const MUSTER=[
 {id:'ПС-1',x:68,y:298,name:'ПС-1 у админкорпуса'},
 {id:'ПС-2',x:300,y:40,name:'ПС-2 у южной дороги'},
 {id:'ПС-3',x:624,y:200,name:'ПС-3 у КПП-2'},
 {id:'ПС-4',x:555,y:398,name:'ПС-4 у северной дороги'},
 {id:'ПС-5',x:30,y:24,name:'ПС-5 у КПП-1'},
 {id:'ПС-6',x:250,y:398,name:'ПС-6 резервный (север)',reserve:true},
];
// закрытые участки на время ремонта (ограждения, леса)
const CLOSURES=[
 {id:'П-2',name:'Проход под Э-1 у риформинга (леса ремонта эстакады)',cells:{r:[243,195,253,205]}},
 {id:'АВТ-З',name:'Западное ограждение ремонтной зоны АВТ-3',fence:[[114,214,116,326]]},
 {id:'АВТ-С',name:'Северное ограждение ремонтной зоны АВТ-3',fence:[[114,324,236,326]]},
 {id:'АВТ-В',name:'Восточное ограждение ремонтной зоны АВТ-3',fence:[[234,214,236,326]]},
 {id:'АВТ-Ю',name:'Южное ограждение АВТ-3 (один выход шириной 6 м)',fence:[[114,214,172,216],[178,214,236,216]]},
 {id:'П-6',name:'Проход под Э-2 к северу (склад материалов)',cells:{r:[375,345,385,353]}},
];
const FEATURES=[ // для подписи узких мест
 ['Проход под Э-1 у АВТ-3',148,200],['Проход П-2 под Э-1',248,200],['Проход под Э-1 у ЛЧ-24',368,200],['Проход под Э-1 у ГФУ',478,200],['Проход под Э-1 у Клауса',578,200],
 ['Выход из ограждения АВТ-3',175,212],['Проход под Э-2 (юг)',380,259],['Проход П-6 под Э-2',380,349],['Городок подрядчиков',550,40],['Дорога у резервуарного парка',240,120],
 ...MUSTER.map(m=>[m.id,m.x,m.y])
];
const ZONES={AVT:{name:'АВТ-3',r:[124,224,226,316]},REF:{name:'Риформинг',r:[262,222,358,318]},HDS:{name:'ЛЧ-24',r:[394,222,488,318]},CLAUS:{name:'Клаус',r:[522,242,608,328]},GFU:{name:'ГФУ',r:[392,82,468,158]},RACK:{name:'Эстакада Э-1',r:[110,186,620,196]},CAMP:{name:'Городок',r:[484,18,616,60]},ADM:{name:'Админкорпус',r:[32,332,98,398]},OP:{name:'Операторная',r:[290,170,330,190]}};
const PLA_MAP={AVT:'ПС-1',REF:'ПС-2',HDS:'ПС-2',CLAUS:'ПС-3',GFU:'ПС-3',RACK:'ПС-2',CAMP:'ПС-3',ADM:'ПС-1',OP:'OP'};
const CONTRACTORS=['ТОО «Монтаж-Демо»','ТОО «Изоляция-Сервис»','ТОО «Промчистка-Демо»','ТОО «Леса-Строй»','ТОО «Энергоремонт-Демо»','ТОО «ТехМонтаж-Демо»','ТОО «КИП-Наладка»'];
const WORK=[['в аппарате',0.10],['на высоте (леса)',0.28],['огневые',0.18],['изоляция',0.14],['монтаж',0.30]];
const KPP=[{id:'КПП-1',x:50,y:6},{id:'КПП-2',x:633,y:118}];
const SENSORS=[['ГЗ-1',175,265],['ГЗ-2',310,270],['ГЗ-3',440,270],['ГЗ-4',565,285],['ГЗ-5',600,250],['ГЗ-6',430,120],['ГЗ-7',250,205],['ГЗ-8',500,205],['ГЗ-9',550,60],['ГЗ-10',360,380],...MUSTER.map(m=>['ГЗ у '+m.id,m.x,m.y])];
// позиции ПС задаются прогоном (P.musterPos); без них — исходная расстановка
const MUSTER_HOME=MUSTER.map(m=>({id:m.id,x:m.x,y:m.y}));
function setMusters(pos){pos=pos||{};MUSTER.forEach((m,i)=>{const p=pos[m.id]||MUSTER_HOME[i]; m.x=p.x; m.y=p.y; const s=SENSORS.find(x=>x[0]==='ГЗ у '+m.id); if(s){s[1]=p.x;s[2]=p.y} const ft=FEATURES.find(x=>x[0]===m.id); if(ft){ft[1]=p.x;ft[2]=p.y}})}

// ---------- случайные числа
function rng(seed){let a=seed>>>0; return function(){a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296}}
function lognorm(r,median,s){const u=Math.max(1e-9,r()), v=r(); const z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); return median*Math.exp(s*z)}

// ---------- сетка
function inR(x,y,r){return x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]}
function buildGrid(closed){const walk=new Uint8Array(GW*GH).fill(1), sf=new Float32Array(GW*GH).fill(1);
  const each=(r,fn)=>{for(let j=Math.max(0,Math.floor(r[1]/CELL));j<=Math.min(GH-1,Math.floor(r[3]/CELL));j++)for(let i=Math.max(0,Math.floor(r[0]/CELL));i<=Math.min(GW-1,Math.floor(r[2]/CELL));i++)fn(j*GW+i)};
  for(let i=0;i<GW;i++){walk[i]=0; walk[(GH-1)*GW+i]=0} for(let j=0;j<GH;j++){walk[j*GW]=0; walk[j*GW+GW-1]=0}
  UNITS.forEach(u=>each(u.r,k=>sf[k]=0.55)); each(CAMP.r,k=>sf[k]=0.8);
  each(TANKFARM,k=>walk[k]=0); BUILD.forEach(b=>each(b.r,k=>walk[k]=0));
  RACKS.forEach(rk=>{each(rk.r,k=>walk[k]=0); rk.gaps.forEach(g=>{const r=rk.axis==='x'?[g[0],rk.r[1],g[1],rk.r[3]]:[rk.r[0],g[0],rk.r[2],g[1]]; each(r,k=>walk[k]=1)})});
  CLOSURES.forEach(c=>{if(!closed.includes(c.id)) return; if(c.cells) each(c.cells.r,k=>walk[k]=0); if(c.fence) c.fence.forEach(r=>each(r,k=>walk[k]=0))});
  return {walk,sf}}
function field(G,tx,ty){const D=new Float64Array(GW*GH).fill(Infinity); const heap=[]; const push=(d,k)=>{heap.push([d,k]); let i=heap.length-1; while(i>0){const p=(i-1)>>1; if(heap[p][0]<=heap[i][0]) break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p}};
  const pop=()=>{const top=heap[0], last=heap.pop(); if(heap.length){heap[0]=last; let i=0; for(;;){const l=2*i+1,r=l+1; let m=i; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===i) break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m}} return top};
  let si=Math.min(GW-2,Math.max(1,Math.floor(tx/CELL))), sj=Math.min(GH-2,Math.max(1,Math.floor(ty/CELL)));
  if(!G.walk[sj*GW+si]){outer:for(let rr=1;rr<10;rr++)for(let dj=-rr;dj<=rr;dj++)for(let di=-rr;di<=rr;di++){const k=(sj+dj)*GW+si+di; if(G.walk[k]){si+=di; sj+=dj; break outer}}}
  D[sj*GW+si]=0; push(0,sj*GW+si); const N8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(heap.length){const [d,k]=pop(); if(d>D[k]) continue; const i=k%GW, j=(k-i)/GW; for(const [di,dj,c] of N8){const ni=i+di,nj=j+dj; if(ni<0||nj<0||ni>=GW||nj>=GH) continue; const nk=nj*GW+ni; if(!G.walk[nk]) continue; if(di&&dj&&(!G.walk[j*GW+ni]||!G.walk[nj*GW+i])) continue; const nd=d+c*CELL/Math.max(0.3,G.sf[nk]); if(nd<D[nk]){D[nk]=nd; push(nd,nk)}}}
  return Float32Array.from(D)}

// ---------- шлейф: гауссова модель, классы устойчивости Пасквилла, коэффициенты Бриггса для застроенной (промышленной) местности
const SIG={A:[.32,.0004,.24,.001,1],B:[.32,.0004,.24,.001,1],C:[.22,.0004,.20,0,0],D:[.16,.0004,.14,.0003,-1],E:[.11,.0004,.08,.0015,-1],F:[.11,.0004,.08,.0015,-1]};
function sigmas(cls,x){const s=SIG[cls]||SIG.D; const sy=s[0]*x/Math.sqrt(1+s[1]*x); let sz; if(s[4]===1) sz=s[2]*x*Math.sqrt(1+s[3]*x); else if(s[4]===0) sz=s[2]*x; else sz=s[2]*x/Math.sqrt(1+s[3]*x); return [sy,sz]}
function windAt(P,t){let w=P.wind; for(const ch of (P.windChanges||[])){if(t>=ch.t) w=ch} return w}
function plumeOne(P,w,t,tiso,x,y){const s=P.source; const th=(w.from+180)*Math.PI/180; const dX=Math.sin(th), dY=Math.cos(th); const rx=x-s.x, ry=y-s.y; const a=rx*dX+ry*dY, c=-rx*dY+ry*dX; const t0=s.t0||0; if(t<t0) return 0;
  if(a<2){const d=Math.hypot(rx,ry); return d<6?Math.min(3000,P.Q*400):0}
  const u=Math.max(0.5,w.u); if(a>u*(t-t0)+10) return 0; if(t>tiso&&a<u*(t-tiso)) return 0;
  let [sy,sz]=sigmas(w.cls,a); sy*=P.meander||1.3; sz=Math.max(sz,1.5); const Hs=s.h||3;
  const C=P.Q*1000/(Math.PI*u*sy*sz)*Math.exp(-c*c/(2*sy*sy))*Math.exp(-Hs*Hs/(2*sz*sz)); // г/м3 при Q кг/с
  return Math.min(20000,C*1000*24.45/(P.mw||34.08))}
function conc(P,t,tiso,x,y){let cur=P.wind, prev=null, tch=-1e9; for(const ch of (P.windChanges||[])){if(t>=ch.t){prev=cur; cur=ch; tch=ch.t}} const c1=plumeOne(P,cur,t,tiso,x,y); if(prev&&t-tch<90){const k=(t-tch)/90; return k*c1+(1-k)*plumeOne(P,prev,t,tiso,x,y)} return c1}
const AEGL={a1:0.75,a2:41,a3:76,d2:41*600,d3:76*600};

// ---------- люди
function makePeople(P){const r=rng(P.seed||7); const ppl=[]; const N=P.people||1600; const staff={ADM:110,OP:14}; const opsN=40;
  const contr=N-staff.ADM-staff.OP-opsN; const zw=[['AVT',.44],['RACK',.10],['REF',.12],['HDS',.10],['CLAUS',.08],['GFU',.06],['CAMP',.10]];
  const permits=[]; let pid=1;
  zw.forEach(([z,w])=>{let left=P.zoneCounts?Math.max(0,Math.round(P.zoneCounts[z]||0)):Math.round(contr*w); while(left>0){const size=Math.min(left,4+Math.floor(r()*26)); const ci=Math.floor(r()*CONTRACTORS.length); let wk='монтаж', rr=r(), acc=0; for(const [n,p] of WORK){acc+=p; if(rr<acc){wk=n;break}} if(z==='CAMP') wk='перерыв в городке'; if(z==='RACK'&&wk==='в аппарате') wk='на высоте (леса)';
    permits.push({id:'НД-'+String(pid++).padStart(3,'0'),zone:z,contractor:CONTRACTORS[ci],work:wk,size}); left-=size}});
  const spot=(z)=>{const R=ZONES[z].r; for(let k=0;k<200;k++){const x=R[0]+r()*(R[2]-R[0]), y=R[1]+r()*(R[3]-R[1]); if(P._G.walk[Math.floor(y/CELL)*GW+Math.floor(x/CELL)]) return [x,y]} return [(R[0]+R[2])/2,(R[1]+R[3])/2]};
  permits.forEach(pm=>{const [cx,cy]=spot(pm.zone); for(let k=0;k<pm.size;k++){let x=cx+(r()-.5)*24, y=cy+(r()-.5)*24; if(!P._G.walk[Math.floor(y/CELL)*GW+Math.floor(x/CELL)]||!inR(x,y,ZONES[pm.zone].r)) [x,y]=spot(pm.zone);
    const unlisted=r()<0.045; ppl.push({x,y,zone:pm.zone,permit:unlisted?null:pm.id,contractor:pm.contractor,work:pm.work,staff:false,novice:r()<(0.18+0.04*CONTRACTORS.indexOf(pm.contractor)),hood:r()<(pm.zone==='CLAUS'?0.9:pm.zone==='AVT'?0.4:0.25),v0:1.15+r()*0.35,rA:r(),rB:r(),rC:r()})}});
  ['ADM','OP'].forEach(z=>{for(let k=0;k<staff[z];k++){const b=BUILD.find(b=>b.id===z); ppl.push({x:b.door[0]+(z==='ADM'?1+r()*5:(r()-.5)*8),y:b.door[1]+(z==='ADM'?(r()-.5)*8:-1-r()*4),zone:z,permit:'ШТАТ',contractor:'НПЗ «Демо»',work:z==='OP'?'оператор':'офис',staff:true,inside:true,novice:false,hood:z==='OP',v0:1.2+r()*0.25,rA:r(),rB:r(),rC:r()})}});
  for(let k=0;k<opsN;k++){const z=['AVT','REF','HDS','CLAUS','GFU'][k%5]; const [x,y]=spot(z); ppl.push({x,y,zone:z,permit:'ШТАТ',contractor:'НПЗ «Демо»',work:'оператор установки',staff:true,novice:false,hood:true,v0:1.25+r()*0.25,rA:r(),rB:r(),rC:r()})}
  return {ppl,permits}}

// ---------- стратегии и меры
const BASE={novCamp:0.30,campStay:0.55,regRate:0.6,phoneCamp:null,maps:'static',loudDelay:[90,240],hoodAll:false,tiso:900,extraOpen:[],detectors:false,reserve:false};
const MEASURES=[
 {id:'wind',name:'Пункт сбора выбирается по ветру, резервный ПС-6 с регистраторами',set:{maps:'wind',reserve:true}},
 {id:'exits',name:'Второй выход из ограждения АВТ-3 и аварийный проход П-2',set:{extraOpen:['АВТ-З','П-2']}},
 {id:'ereg',name:'Электронная отметка на ПС по пропуску, 1,5 человека в секунду',set:{regRate:1.5}},
 {id:'camp',name:'Инструктаж новичков «куда идти» и обзвон городка на 5-й минуте',set:{novCamp:0.08,campStay:0.15,phoneCamp:300}},
 {id:'alert',name:'Маячки в шумных зонах и персональные газоанализаторы',set:{loudDelay:[20,60],detectors:true}},
 {id:'hoods',name:'Самоспасатели всем на АВТ-3 и Клаусе',set:{hoodAll:true}},
 {id:'iso',name:'Автоматическая отсечка источника за 6 минут',set:{tiso:360}},
];
function makeStrat(ms){const S=JSON.parse(JSON.stringify(BASE)); (ms||[]).forEach(id=>{const m=MEASURES.find(x=>x.id===id); if(m) Object.assign(S,JSON.parse(JSON.stringify(m.set)))}); return S}
const STRAT={asis:Object.assign(makeStrat([]),{name:'ПЛА как написан'}),fixed:Object.assign(makeStrat(MEASURES.map(m=>m.id)),{name:'ПЛА с правками'}),shtab:Object.assign(makeStrat([]),{name:'Штаб-агенты'}),fixshtab:Object.assign(makeStrat(MEASURES.map(m=>m.id)),{name:'Правки + штаб'})};

// ---------- симуляция
class Sim{
 constructor(P,stratId,decisions){setMusters(P.musterPos); this.P=JSON.parse(JSON.stringify(P)); this.PM=P.plaMap||PLA_MAP; this.S=Object.assign({},typeof stratId==='string'?STRAT[stratId]:makeStrat(stratId.measures),this.P.sOver||{}); this.strat=typeof stratId==='string'?stratId:'custom'; this.t=0; this.dt=0.5; this.log=[]; this.pending=[];
  this.closed=(P.closures||[]).filter(c=>!this.S.extraOpen.includes(c)); this.G=buildGrid(this.closed); this.P._G=this.G;
  const {ppl,permits}=makePeople(this.P); this.ppl=ppl; this.permits=permits; this.tiso=Math.max(Math.min(P.tiso!=null?P.tiso:900,this.S.tiso),P.isoMin||0); this.fire=P.hazard==='fire'; this.A=this.fire?{a2:420,a3:1700}:{a2:AEGL.a2,a3:AEGL.a3}; this.GF=this.G;
  this.musterOpen=Object.fromEntries(MUSTER.map(m=>[m.id,!m.reserve||this.S.reserve])); this.regStart=Object.fromEntries(MUSTER.map(m=>[m.id,0]));
  this.queue=Object.fromEntries(MUSTER.map(m=>[m.id,[]])); this.regAcc=Object.fromEntries(MUSTER.map(m=>[m.id,0])); this.regCount=Object.fromEntries(MUSTER.map(m=>[m.id,0]));
  this.fields={}; this.buildFields(); this.zoneTarget=this.initialTargets(); this.r=rng((P.seed||7)*31+5); this.density=new Uint16Array(GW*GH); this.hot=new Float32Array(GW*GH); this.gso=[]; this.sheltered={}; this.maxQ={};
  const R=this.r, S=this.S; this.decisions=(decisions||[]).slice().sort((a,b)=>a.t-b.t);
  const alarm=P.alarmT||45;
  this.ppl.forEach((p,i)=>{p.i=i; p.state=0; p.tgt=null; p.maxC=0; p.dose=0; p.dose3=0; p.reg=false; p.regWhere=null; p.cross=0; p.hoodOn=false; p.dist=0;
    if(S.hoodAll&&(p.zone==='AVT'||p.zone==='CLAUS')) p.hood=true;
    let rt=alarm+lognorm(()=>p.rA,P.rtMed||55,0.55);
    if(p.work==='в аппарате') rt+=120+p.rB*180; else if(p.work==='на высоте (леса)') rt+=60+p.rB*120; else if(p.work==='огневые') rt+=20;
    const loud=(p.zone==='AVT'||p.zone==='RACK')&&(p.work==='в аппарате'||p.work==='огневые'); if(loud) rt+=S.loudDelay[0]+p.rC*(S.loudDelay[1]-S.loudDelay[0]);
    if(P.sirenFail==='east'&&p.x>400&&!p.staff&&p.zone!=='CAMP'&&!S.detectors) rt+=90+p.rC*150;
    p.rt=rt; // доля новичков, идущих «к своим», а не на ПС
    p.goCamp=!p.staff&&p.novice&&(p.rC<S.novCamp);
    p.leave=!p.staff&&!p.goCamp&&P.leaveShare>0&&p.rB>1-P.leaveShare; p.heat=0; p.maxQ=0;
    if(p.zone==='OP'){p.state=5; p.inside=true}
    if(p.zone==='CAMP'){p.goCamp=!p.staff&&(p.rB<S.campStay); p.rt=alarm+30+p.rA*120}
  });
  this.listN=this.ppl.filter(p=>p.permit).length; this.unlistedN=this.ppl.length-this.listN;
  this.samples=[]; this.nextSample=0; this.events=[]; this.cmdIdx=0;
 }
 buildFields(){MUSTER.forEach(m=>this.fields[m.id]=field(this.GF,m.x,m.y)); this.fields.CAMP=field(this.GF,550,40); BUILD.forEach(b=>this.fields[b.id]=field(this.GF,b.door[0],b.door[1])); KPP.forEach(k=>this.fields[k.id]=field(this.GF,k.x,k.y))}
 inPlumeSector(x,y){const w=windAt(this.P,0); const th=(w.from+180)*Math.PI/180; const rx=x-this.P.source.x, ry=y-this.P.source.y; const a=rx*Math.sin(th)+ry*Math.cos(th); const c=Math.abs(-rx*Math.cos(th)+ry*Math.sin(th)); return a>-20&&c<Math.max(40,a*0.45)}
 initialTargets(){const T={}; Object.keys(ZONES).forEach(z=>{if(this.S.maps==='static'){T[z]=this.PM[z]; return}
   if(z==='OP'){T[z]='OP'; return} const R=ZONES[z].r, cx=(R[0]+R[2])/2, cy=(R[1]+R[3])/2; const k=Math.floor(cy/CELL)*GW+Math.floor(cx/CELL);
   let best=null,bd=1e9; MUSTER.forEach(m=>{if(!this.musterOpen[m.id]||this.inPlumeSector(m.x,m.y)) return; const f=this.fields[m.id]; let d=f[k]; if(!isFinite(d)){d=Math.hypot(m.x-cx,m.y-cy)*1.5} if(d<bd){bd=d;best=m.id}}); T[z]=best||this.PM[z]}); return T}
 nearestOpen(x,y,avoid){const k=Math.floor(y/CELL)*GW+Math.floor(x/CELL); let best=null,bd=1e9; MUSTER.forEach(m=>{if(!this.musterOpen[m.id]||m.id===avoid) return; const d=this.fields[m.id][k]; if(d<bd){bd=d;best=m.id}}); return best}
 C(x,y){return conc(this.P,this.t,this.tiso,x,y)}
 hrr(t){if(!this.fire) return 0; const f=this.P.fire; const g=Math.min(1,t/(f.grow||120)); const d=t>this.tiso?Math.max(0,1-(t-this.tiso)/120):1; return f.hrr*g*d}
 Qh(x,y,t){if(!this.fire) return 0; const f=this.P.fire; const r=Math.max(5,Math.hypot(x-f.x,y-f.y)); return (f.frac||0.3)*this.hrr(t==null?this.t:t)*1000/(4*Math.PI*r*r)}
 heatRadius(q){if(!this.fire) return 0; const h=this.hrr(this.t); return Math.sqrt((this.P.fire.frac||0.3)*h*1000/(4*Math.PI*q))}
 setHeatBlock(on){if(on){const G=buildGrid(this.closed); const f=this.P.fire; const Rr=Math.sqrt((f.frac||0.3)*f.hrr*1000/(4*Math.PI*4)); for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=(i+.5)*CELL,y=(j+.5)*CELL; if(Math.hypot(x-f.x,y-f.y)<Rr) G.walk[j*GW+i]=0} this.GF=G} else this.GF=this.G; this.buildFields(); this._hb=on}
 // ---- действия штаба
 apply(a){const t=this.t; const note=(s)=>this.events.push({t,kind:'штаб',text:s});
  switch(a.type){
   case 'muster_close':{const id=a.id; if(!(id in this.musterOpen)) return; this.musterOpen[id]=false; const to=a.to&&this.musterOpen[a.to]?a.to:null; Object.keys(this.zoneTarget).forEach(z=>{if(this.zoneTarget[z]===id) this.zoneTarget[z]=to||null}); this.pending.push({t:t+30,fn:()=>{this.ppl.forEach(p=>{if(p.tgt===id&&p.state!==5){p.tgt=to||this.nearestOpen(p.x,p.y,id); if(p.state===3){this.queue[id]=this.queue[id].filter(q=>q!==p); p.state=2} if(p.state===4){p.state=2; p.moveReg=true}}}); Object.keys(this.zoneTarget).forEach(z=>{if(!this.zoneTarget[z]) this.zoneTarget[z]=this.nearestOpen((ZONES[z].r[0]+ZONES[z].r[2])/2,(ZONES[z].r[1]+ZONES[z].r[3])/2,id)})}}); note('ПС закрыт: '+id+(to?' → '+to:'')); break}
   case 'muster_open':{if(!(a.id in this.musterOpen)) return; this.musterOpen[a.id]=true; this.regStart[a.id]=t+180; note('ПС открыт: '+a.id); break}
   case 'redirect':{const z=a.zone, to=a.to; if(!ZONES[z]||!this.musterOpen[to]) return; this.zoneTarget[z]=to; this.pending.push({t:t+30,fn:()=>{this.ppl.forEach(p=>{if(p.zone===z&&!p.reg&&p.state!==5&&p.state!==7){p.tgt=to; if(p.state===3){Object.values(this.queue).forEach(q=>{const i=q.indexOf(p); if(i>=0) q.splice(i,1)}); p.state=2}}})}}); note('Зона '+z+' → '+to); break}
   case 'shelter':{const b=a.building; if(!BUILD.find(x=>x.id===b)) return; this.sheltered[b]=true; this.ppl.forEach(p=>{if(p.zone===b&&(p.state===0||(p.state===2&&Math.hypot(p.x-BUILD.find(x=>x.id===b).door[0],p.y-BUILD.find(x=>x.id===b).door[1])<25))){p.state=5; p.inside=true}}); note('Укрыться в здании: '+b); break}
   case 'isolate':{this.tiso=Math.min(this.tiso,Math.max(t+180,this.P.isoMin||0)); note('Отсечь источник (эффект через 3 мин)'); break}
   case 'gso':{const z=a.zone; if(!ZONES[z]) return; const R=ZONES[z].r; const d=Math.hypot((R[0]+R[2])/2-310,(R[1]+R[3])/2-20); this.gso.push({zone:z,arr:t+120+d/1.6,last:0}); note('ГСО в зону '+z); break}
   case 'camp_check':{this.pending.push({t:t+120,fn:()=>this.phoneCamp()}); note('Обзвон городка подрядчиков'); break}
   case 'open_passage':{const id=a.id; if(!this.closed.includes(id)) return; this.pending.push({t:t+120,fn:()=>{this.closed=this.closed.filter(c=>c!==id); this.G=buildGrid(this.closed); if(this._hb) this.setHeatBlock(true); else {this.GF=this.G; this.buildFields()}}}); note('Открыть проход '+id+' (через 2 мин)'); break}
   case 'announce':{this.ppl.forEach(p=>{if(p.state===0&&p.rt>t+90&&!(p.zone==='OP')) p.rt=t+30+p.rA*60; if(p.goCamp&&!p.reg&&p.state<=2&&p.rB<0.5) p.goCamp=false}); note('Громкая связь: '+(a.text||'')); break}
  }}
 phoneCamp(){let n=0; this.ppl.forEach(p=>{if(p.state===6&&!p.reg){p.reg=true; p.regWhere='по телефону'; p.regT=this.t; n++}}); this.events.push({t:this.t,kind:'учёт',text:'Обзвон городка: учтено '+n})}
 step(){const dt=this.dt, t=this.t, S=this.S, G=this.G;
  while(this.cmdIdx<this.decisions.length&&this.decisions[this.cmdIdx].t<=t){(this.decisions[this.cmdIdx].actions||[]).forEach(a=>this.apply(a)); this.cmdIdx++}
  this.pending=this.pending.filter(pd=>{if(pd.t<=t){pd.fn(); return false} return true});
  if(S.phoneCamp&&t>=S.phoneCamp&&!this._pc){this._pc=true; this.phoneCamp()}
  if(this.fire){if(!this._hb&&t>=30&&t<this.tiso+120) this.setHeatBlock(true); else if(this._hb&&t>=this.tiso+120) this.setHeatBlock(false)}
  // плотность
  const D=this.density; D.fill(0); for(const p of this.ppl){if(p.state>=3) continue; D[Math.floor(p.y/CELL)*GW+Math.floor(p.x/CELL)]++}
  for(const p of this.ppl){
   const c=(p.state===5)?0:this.C(p.x,p.y); let ce=c; if(p.state===5){ce=this.C(p.x,p.y)*(BUILD.find(b=>b.id===p.zone)||{shelter:.1}).shelter} if(p.hoodOn&&!this.fire) ce*=0.05;
   if(ce>p.maxC) p.maxC=ce; p.dose+=ce*dt; if(ce>=this.A.a3) p.dose3+=dt;
   let qh=0; if(this.fire&&p.state!==5){qh=this.Qh(p.x,p.y,t); if(qh>p.maxQ) p.maxQ=qh; if(qh>1.6) p.heat+=Math.pow(qh,4/3)*dt}
   if(p.state===7){continue}
   if((p.dose>=this.A.a3*600||p.heat>=500)&&!p.rescued&&p.state!==5&&p.state!==7&&p.state!==8){if(p.state===3){Object.values(this.queue).forEach(q=>{const i=q.indexOf(p); if(i>=0) q.splice(i,1)})} p.state=7; this.events.push({t,kind:'пострадавший',text:'Человек не может выйти сам ('+ZONES[p.zone].name+')'}); continue}
   if(!this.fire&&p.hood&&!p.hoodOn&&c>10&&(p.state!==0||t>p.rt-60)){p.donT=p.donT||t+30; if(t>=p.donT) p.hoodOn=true}
   if(p.state===0){ const sense=this.fire?50:(S.detectors?3:8); if((c>sense&&p.zone!=='OP')||qh>2||t>=p.rt){ if(p.inside&&this.sheltered[p.zone]){p.state=5; continue}
      p.state=2; p.inside=false; p.tgt=p.goCamp?'CAMP':p.leave?(p.x>340?'КПП-2':'КПП-1'):(this.zoneTarget[p.zone]||this.PM[p.zone]); if(p.tgt==='OP'){p.state=5; continue} if(!this.musterOpen[p.tgt]&&p.tgt!=='CAMP') p.tgt=this.nearestOpen(p.x,p.y)} continue}
   if(p.state===5) continue;
   if((p.state===3||p.state===4)&&(c>this.A.a2||qh>4)&&!p.novice){p.gasT=(p.gasT||0)+dt; if(p.gasT>45+p.rA*60){const here=p.tgt; let best=null,bd=1e9; MUSTER.forEach(m=>{if(!this.musterOpen[m.id]||m.id===here||this.C(m.x,m.y)>(this.fire?100:10)||this.Qh(m.x,m.y,t)>2) return; const d=Math.hypot(m.x-p.x,m.y-p.y); if(d<bd){bd=d;best=m.id}}); if(best){if(p.state===3){this.queue[here]=this.queue[here].filter(q=>q!==p)} if(p.reg) p.ghost=here; p.state=2; p.tgt=best; p.selfMoved=true; if(!this._selfLog){this._selfLog=true; this.events.push({t,kind:'люди',text:'Люди сами уходят с загазованного '+here})}}} continue}
   if(p.state===3||p.state===4||p.state===6||p.state===8){continue}
   // движение
   const F=this.fields[p.tgt]; if(!F) continue; const i=Math.floor(p.x/CELL), j=Math.floor(p.y/CELL), k=j*GW+i;
   let tx,ty; const tm=p.tgt==='CAMP'?{x:550,y:40}:(MUSTER.find(m=>m.id===p.tgt)||KPP.find(m=>m.id===p.tgt));
   if(p.tgt.startsWith('КПП')){if(Math.hypot(tm.x-p.x,tm.y-p.y)<12){p.state=8; if(S.regRate>=1.5){p.reg=true; p.regWhere='СКУД '+p.tgt; p.regT=t} if(!this._kppLog){this._kppLog=true; this.events.push({t,kind:'люди',text:'Подрядчики уходят через '+p.tgt+' к автобусам'+(S.regRate>=1.5?' (учтены по СКУД)':', на ПС не отмечаются')})}} }
   else if(p.tgt==='CAMP'&&inR(p.x,p.y,[CAMP.r[0]-8,CAMP.r[1]-8,CAMP.r[2]+8,CAMP.r[3]+8])){p.state=6; continue}
   if(p.tgt!=='CAMP'&&Math.hypot(tm.x-p.x,tm.y-p.y)<22){ if(p.moveReg||p.reg){p.state=4; continue} p.state=3; this.queue[p.tgt].push(p); const a=p.rA*6.28, rr=4+p.rB*16, qx=tm.x+Math.cos(a)*rr, qy=tm.y+Math.sin(a)*rr; if(G.walk[Math.floor(qy/CELL)*GW+Math.floor(qx/CELL)]){p.x=qx; p.y=qy} continue}
   let best=F[k], bi=i, bj=j; for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj) continue; const nk=(j+dj)*GW+i+di; const v=F[nk]+(D[nk]>8?D[nk]*0.4:0); if(v<best){best=v;bi=i+di;bj=j+dj}}
   tx=(bi+0.5)*CELL-p.x+(p.rA-.5)*0.6; ty=(bj+0.5)*CELL-p.y+(p.rB-.5)*0.6;
   // самоспасение: обученные уходят поперёк ветра, если концентрация высокая
   if(qh>4&&p.cross<60){const f=this.P.fire; const rx=p.x-f.x, ry=p.y-f.y, l=Math.hypot(rx,ry)||1; tx=rx/l; ty=ry/l; p.cross+=dt}
   else if(!this.fire&&c>AEGL.a2&&!p.novice&&p.cross<40){const w=windAt(this.P,t); const th=(w.from+180)*Math.PI/180; const dX=Math.sin(th), dY=Math.cos(th); const rx=p.x-this.P.source.x, ry=p.y-this.P.source.y; const side=(-rx*dY+ry*dX)>=0?1:-1; tx=-dY*side; ty=dX*side; p.cross+=dt}
   const L=Math.hypot(tx,ty)||1; let rho=0; for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++) rho+=D[(j+dj)*GW+i+di]; rho/=9*CELL*CELL;
   let v=p.v0*G.sf[k]*(p.hoodOn?0.85:1)*(this.fire&&c>200?0.7:1); if(rho>0.55) v*=Math.max(0.06,1-Math.exp(-1.913*(1/rho-1/5.4)));
   if(rho>1.0&&p.dist>30) this.hot[k]+=dt;
   const nx=p.x+tx/L*v*dt, ny=p.y+ty/L*v*dt; const ok=(x,y)=>G.walk[Math.floor(y/CELL)*GW+Math.floor(x/CELL)];
   if(ok(nx,ny)){p.dist+=Math.hypot(nx-p.x,ny-p.y); p.x=nx; p.y=ny} else if(ok(nx,p.y)){p.x=nx} else if(ok(p.x,ny)){p.y=ny}
  }
  // регистрация на ПС
  MUSTER.forEach(m=>{const q=this.queue[m.id]; if(q.length>(this.maxQ[m.id]||0)) this.maxQ[m.id]=q.length; if(!q.length||t<this.regStart[m.id]) return; this.regAcc[m.id]+=S.regRate*(this.P.regMul||1)*dt; while(this.regAcc[m.id]>=1&&q.length){const p=q.shift(); this.regAcc[m.id]-=1; p.state=4; p.reg=true; p.regWhere=m.id; p.regT=t; this.regCount[m.id]++} if(!q.length) this.regAcc[m.id]=0});
  // ГСО
  this.gso.forEach(g=>{if(t<g.arr) return; const R=ZONES[g.zone].r; if(!g.started){g.started=true; this.ppl.forEach(p=>{if(p.zone===g.zone&&p.state===0){p.rt=t; }})} if(t-g.last>=60){const v=this.ppl.find(p=>p.state===7&&inR(p.x,p.y,[R[0]-40,R[1]-40,R[2]+40,R[3]+40])); if(v){v.state=4; v.rescued=true; v.reg=true; v.regWhere='вынесен ГСО'; v.regT=t; g.last=t; this.events.push({t,kind:'ГСО',text:'Вынесен пострадавший из зоны '+ZONES[g.zone].name})}}});
  this.t+=dt;
  if(this.t>=this.nextSample){this.samples.push(this.metrics()); this.nextSample+=15}
 }
 metrics(){let left=0,cloud=0,reg=0,regL=0,moving=0,notStarted=0,camp=0,shel=0,exp2=0,exp3=0,inc=0,queued=0,unlReg=0; for(const p of this.ppl){if(p.reg){reg++; if(p.permit) regL++; else unlReg++} if(p.state===2) moving++; if(p.state===0) notStarted++; if(p.state===6&&!p.reg) camp++; if(p.state===5) shel++; if(p.state===3) queued++; if(p.maxC>=this.A.a2||p.maxQ>=4) cloud++; if(p.dose>=this.A.a2*600||p.heat>=105) exp2++; if(p.dose>=this.A.a3*600||p.heat>=500) exp3++; if(p.state===7||p.rescued) inc++; if(p.state===8&&!p.reg) left++}
  const opsInOp=this.ppl.filter(p=>p.zone==='OP'&&p.state===5).length; const known=regL+opsInOp+this.ppl.filter(p=>p.permit&&p.state===5&&p.zone!=='OP').length;
  return {t:this.t,left,cloud,reg,regL,moving,notStarted,camp,shel,exp2,exp3,inc,queued,unlReg,unacc:Math.max(0,this.listN-known),pct:known/this.listN}}
 runTo(T){while(this.t<T) this.step()}
 bottlenecks(n){const cells=[]; for(let k=0;k<this.hot.length;k++) if(this.hot[k]>20) cells.push([k,this.hot[k]]); cells.sort((a,b)=>b[1]-a[1]); const out=[];
  for(const [k,v] of cells){const x=(k%GW+.5)*CELL, y=(Math.floor(k/GW)+.5)*CELL; let f=out.find(o=>Math.hypot(o.x-x,o.y-y)<30); if(f){f.v+=v; continue} let lab=null,bd=1e9; FEATURES.forEach(([nm,fx,fy])=>{const d=Math.hypot(fx-x,fy-y); if(d<bd){bd=d;lab=nm}}); out.push({x,y,v,name:bd<40?lab:'Участок у '+lab})}
  out.sort((a,b)=>b.v-a.v); return out.slice(0,n||6).map(o=>({...o,v:Math.round(o.v)}))}
 queues(){return MUSTER.map(m=>({id:m.id,max:this.maxQ[m.id]||0,reg:this.regCount[m.id]})).filter(q=>q.max>0).sort((a,b)=>b.max-a.max)}
 sitrep(){const m=this.metrics(); const t=this.t; const w=windAt(this.P,t); const sens=SENSORS.map(([n,x,y])=>[n,Math.round(this.C(x,y))]);
  const byZone={}; this.ppl.forEach(p=>{if(p.permit&&!p.reg&&!(p.state===5)){byZone[p.zone]=(byZone[p.zone]||0)+1}});
  const queues=MUSTER.map(mm=>`${mm.id}: ${this.musterOpen[mm.id]?'открыт':'закрыт'}, отметились ${this.regCount[mm.id]}, в очереди ${this.queue[mm.id].length}, ${this.fire?'CO':'газ'} у ПС ${Math.round(this.C(mm.x,mm.y))} ppm${this.fire&&this.Qh(mm.x,mm.y,t)>1?`, тепловое излучение ${this.Qh(mm.x,mm.y,t).toFixed(1)} кВт/м²`:''}`);
  const reports=[]; const bn=this.bottlenecks(3).filter(b=>b.v>200); bn.forEach(b=>reports.push(`Наблюдатель: скопление людей — ${b.name}`));
  const campN=this.ppl.filter(p=>p.state===6&&!p.reg).length; if(campN>5) reports.push(`Городок подрядчиков: на месте около ${Math.round(campN/5)*5} человек, на ПС не отмечались`);
  const stuck=this.ppl.filter(p=>p.state===0&&p.zone!=='OP'&&p.zone!=='ADM').length; if(stuck>5&&t>240) reports.push(`Бригадиры по рации: часть людей в аппаратах и на лесах ещё не вышла (по оценке ~${Math.round(stuck/5)*5})`);
  const inc=this.ppl.filter(p=>p.state===7); if(inc.length) reports.push(`Сообщения о пострадавших: ${inc.length} (зоны: ${[...new Set(inc.map(p=>ZONES[p.zone].name))].join(', ')})`);
  this.closed.forEach(c=>{const cc=CLOSURES.find(x=>x.id===c); if(cc) reports.push(`Закрыт участок ${c}: ${cc.name}`)});
  if(this.fire&&this._hb){const f=this.P.fire; const near=FEATURES.filter(([n,fx,fy])=>n.startsWith('Проход')&&Math.hypot(fx-f.x,fy-f.y)<this.heatRadius(4)+12).map(x=>x[0]); reports.push(`Пожарные: зона жара (более 4 кВт/м²) радиусом около ${Math.round(this.heatRadius(4))} м${near.length?', через неё не пройти: '+near.join(', '):''}`)}
  const leftN=this.ppl.filter(p=>p.state===8&&!p.reg).length; if(leftN>3) reports.push(`Охрана КПП: около ${Math.round(leftN/5)*5} человек вышли с площадки к автобусам, на ПС не отмечались`);
  return {t,wind:w,sens,queues,byZone,reports,m,events:this.events.slice()}}
}
return {KPP,MEASURES,makeStrat,CELL,W,H,GW,GH,UNITS,CAMP,BUILD,TANKS,TANKFARM,RACKS,MUSTER,CLOSURES,ZONES,PLA_MAP,SENSORS,STRAT,AEGL,FEATURES,BASE,rng,lognorm,buildGrid,field,conc,windAt,makePeople,setMusters,MUSTER_HOME,Sim};
})();

// Доклад штабу и разбор ответа. Общий для Node и браузера.
const SHTAB=(function(){
const DPTS=[120,300,540,840,1200];
const DIRN=d=>['северный','северо-восточный','восточный','юго-восточный','южный','юго-западный','западный','северо-западный'][Math.round(((d%360)+360)%360/45)%8];
const mmss=t=>{const m=Math.floor(t/60), s=Math.round(t%60); return m+' мин'+(s?' '+s+' с':'')};
function layout(L,sim){const fixedPla=sim&&sim.S&&sim.S.maps==='wind'; const ereg=sim&&sim.S&&sim.S.regRate>=1.5;
 return [
 'Площадка НПЗ 640×420 м. Координаты (x, y) в метрах: x растёт на восток, y — на север.',
 'Установки: '+L.UNITS.map(u=>`${u.name} — x ${u.r[0]}–${u.r[2]}, y ${u.r[1]}–${u.r[3]}`).join('; ')+'.',
 `Городок подрядчиков (бытовки) — x ${L.CAMP.r[0]}–${L.CAMP.r[2]}, y ${L.CAMP.r[1]}–${L.CAMP.r[3]}. Админкорпус и ЦЗЛ — x 30–100, y 330–400. Операторная с подпором воздуха — x 288–332, y 168–192. Резервуарный парк — x 55–225, y 45–170 (непроходим).`+(sim&&sim.P.leaveShare?' КПП-1 (50, 6), КПП-2 (633, 118).':''),
 'Эстакада Э-1 тянется вдоль y≈200 от x 100 до 626; пройти под ней можно только в проходах у x≈148, 248 (П-2), 368, 478, 578. Эстакада Э-2 идёт вдоль x≈380 от y 200 до 416; проходы у y≈259 и 349 (П-6).',
 'Пункты сбора (ПС): '+L.MUSTER.map(m=>`${m.id} (${m.x}, ${m.y})${m.reserve?(fixedPla?' — резервный, открыт, регистраторы на месте':' — резервный, по ПЛА не используется, регистраторов нет'):''}`).join('; ')+'.',
 fixedPla?'По исправленному ПЛА пункт сбора для каждой зоны выбран в момент тревоги по ветру: '+Object.entries(sim.zoneTarget).filter(([z])=>z!=='OP').map(([z,m])=>`${L.ZONES[z].name} → ${m}`).join('; ')+'; операторы операторной остаются в ней. Новички проинструктированы, куда идти; в шумных зонах маячки, у работников персональные газоанализаторы, на АВТ-3 и Клаусе у всех самоспасатели.'
  :'Закрепление по ПЛА: АВТ-3 и админкорпус → ПС-1; риформинг, ЛЧ-24, эстакада → ПС-2; Клаус, ГФУ, городок → ПС-3; операторы операторной остаются в ней. ПЛА составлен без учёта направления ветра.',
 ereg?'Учёт на ПС — электронная отметка по пропуску, около 1,5 человека в секунду на ПС; бригадиров в городке обзванивают автоматически на 5-й минуте.':'Учёт на ПС ведётся по бумажным спискам нарядов: два регистратора, около 0,6 человека в секунду на ПС.',
].join('\n')}
function sourceLine(sim,sc,r){const fire=sim.P.hazard==='fire';
 if(fire) return `Очаг по докладу: ${sc.P.source.name}, координаты (${sc.P.source.x}, ${sc.P.source.y}). Горение ${sim.tiso+120<=r.t?'ликвидировано':sim.tiso<=r.t?'стихает, подача продукта перекрыта':'продолжается'}${sim.tiso>r.t&&sim.tiso<1e8?`; по оценке пожарных локализация возможна к ${mmss(sim.tiso)}`:''}.`;
 return `Источник по докладу оператора: ${sc.P.source.name}, координаты (${sc.P.source.x}, ${sc.P.source.y}). Утечка ${sim.tiso<=r.t?'отсечена':'продолжается'}${sim.tiso>r.t&&sim.tiso<1e8?`; по оценке операторов отсечение возможно к ${mmss(sim.tiso)}`:''}${sim.P.isoMin?' (отсечная задвижка находится в зоне ремонта, раньше не перекрыть)':''}.`}
function prevLine(prev){return prev.length?'Ваши предыдущие решения: '+prev.map(d=>`${mmss(d.t)} — ${(d.actions||[]).map(a=>a.type+(a.id?' '+a.id:'')+(a.zone?' '+a.zone:'')+(a.to?' → '+a.to:'')+(a.building?' '+a.building:'')).join(', ')||'без действий'}`).join('; ')+'.':'Решений штаб ещё не принимал.'}
function sitrepText(sim,sc,L,prev,R){const r=R||sim.sitrep(); const w=r.wind; const m=r.m; const fire=sim.P.hazard==='fire';
 const zones=Object.entries(r.byZone).sort((a,b)=>b[1]-a[1]).map(([z,n])=>`${L.ZONES[z].name} — ${n}`).join('; ');
 return [`Время от начала ${fire?'пожара':'выброса'}: ${mmss(r.t)}. Сигнал тревоги подан на ${sim.P.alarmT||45}-й секунде.`,
 sourceLine(sim,sc,r),
 `Метеостанция: ветер ${DIRN(w.from)} (дует с ${w.from}°), ${w.u} м/с.`,
 (fire?'Датчики CO (дым), ppm: ':'Датчики H₂S, ppm: ')+r.sens.filter(([n])=>!n.startsWith('ГЗ у')).map(([n,v])=>`${n} ${v}`).join(', ')+'.',
 'Пункты сбора: '+r.queues.join('; ')+'.',
 `По спискам нарядов на площадке ${sim.listN} человек. Отметились на ПС: ${m.regL}${m.unlReg?` (и ещё ${m.unlReg} человек, которых нет в списках)`:''}. Не отметились по спискам: ${m.unacc}. По зонам: ${zones||'—'}.`,
 r.reports.length?'Доклады: '+r.reports.join('; ')+'.':'Других докладов нет.',
 prevLine(prev)].join('\n')}
function actions(sim){const fire=sim&&sim.P.hazard==='fire'; return `Доступные действия (тип и параметры строго из списка):
- {"type":"muster_close","id":"ПС-n","to":"ПС-m"} — закрыть пункт сбора и перевести с него людей на другой (через 30 с);
- {"type":"muster_open","id":"ПС-n"} — открыть пункт сбора; регистраторы на резервный ПС-6 прибудут через 3 мин;
- {"type":"redirect","zone":"AVT|REF|HDS|CLAUS|GFU|RACK|CAMP|ADM","to":"ПС-n"} — по громкой связи и рации перенаправить людей зоны;
- {"type":"shelter","building":"ADM|OP"} — людям, ещё не вышедшим из здания, укрыться в нём;
- {"type":"isolate"} — ${fire?'перекрыть подачу продукта к очагу и начать пенную атаку (горение стихает через 3–5 мин)':'приказать отсечь источник (эффект через 3 мин)'};
- {"type":"gso","zone":"…"} — направить газоспасателей в зону: поиск невышедших и вынос пострадавших;
- {"type":"camp_check"} — обзвонить бригадиров в городке подрядчиков и учесть людей по телефону (через 2 мин);
- {"type":"open_passage","id":"П-2|П-6|АВТ-З|АВТ-С|АВТ-В|АВТ-Ю"} — снять временное ограждение (через 2 мин);
- {"type":"announce","text":"…"} — объявление по громкой связи: поторопить невышедших.`}
const ACTIONS=actions(null);
const HINT=sim=>sim&&sim.P.hazard==='fire'?'Учитывай ветер и очаг: дым идёт туда, куда дует ветер, а рядом с очагом опасен жар; люди не пройдут через зону жара.':'Учитывай ветер: облако идёт туда, куда дует ветер.';
function prompt(sim,sc,L,prev){return `Ты — штаб ликвидации аварии НПЗ «Демо» во время остановочного ремонта. В штабе: руководитель ликвидации аварии (начальник смены), начальник газоспасательной службы, ответственный за учёт людей и координатор подрядчиков. Вы видите только то, что приходит в доклады ниже; где находится каждый человек, вы не знаете.

Схема площадки:
${layout(L,sim)}

Обстановка:
${sitrepText(sim,sc,L,prev)}

${actions(sim)}

Сначала каждый член штаба коротко докладывает своё видение (1–2 предложения), затем руководитель принимает решение. ${HINT(sim)} Действия должны быть выполнимыми и не противоречить друг другу; не повторяй уже выполненные. Не больше 5 действий за раз; можно не действовать, если всё идёт правильно.
Ответь только JSON без пояснений: {"reports":{"РЛА":"…","ГСО":"…","Учёт":"…","Подрядчики":"…"},"decision":"решение руководителя, 1–2 предложения","actions":[…]}`}

// ---------- штаб из отдельных ролей с неполной информацией
function rngK(seed){let a=seed>>>0; return ()=>{a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296}}
function noisy(sim,k,L){const r0=sim.sitrep(); const r=rngK(1000+k*17); const R=JSON.parse(JSON.stringify(r0)); const jit=v=>Math.max(0,Math.round(v*(0.85+0.3*r())/5)*5);
 const old=sim.samples.filter(s=>s.t<=sim.t-60).pop()||r0.m; R.m={...r0.m,regL:jit(old.regL),unacc:jit(old.unacc),unlReg:jit(old.unlReg||0)};
 Object.keys(R.byZone).forEach(z=>R.byZone[z]=jit(R.byZone[z]));
 const sens=R.sens.filter(([n])=>!n.startsWith('ГЗ у')); const off=Math.floor(r()*sens.length); R.sens=R.sens.map(s=>s[0]===sens[off][0]?[s[0],'нет связи']:s);
 R.queues=R.queues.map(q=>q.replace(/отметились (\d+), в очереди (\d+)/,(a,b,c)=>`отметились около ${jit(+b)}, в очереди около ${jit(+c)}`));
 const clean=sim.P.hazard==='fire'?null:Object.keys(sim.musterOpen).filter(id=>sim.musterOpen[id]&&sim.C(L.MUSTER.find(m=>m.id===id).x,L.MUSTER.find(m=>m.id===id).y)<1);
 if(r()<0.6&&clean&&clean.length){const id=clean[Math.floor(r()*clean.length)]; R.reports.push(`Непроверенное сообщение по рации: «на ${id} пахнет газом»`)}
 if(r()<0.5) R.reports=R.reports.filter((x,i)=>i!==0||R.reports.length<2);
 R.noise='Доклады приходят с задержкой около минуты, численность — оценки бригадиров и регистраторов (±15%), один датчик без связи, возможны непроверенные сообщения.'; return R}
const ROLES=[
 {id:'ГСО',name:'начальник газоспасательной службы',focus:'загазованность и жар, поиск невышедших, пострадавшие, куда направить звенья ГСО'},
 {id:'Учёт',name:'ответственный за учёт людей',focus:'кто не отметился, очереди на пунктах сбора, пункты сбора в опасной зоне, городок и КПП'},
 {id:'Подрядчики',name:'координатор подрядчиков',focus:'бригады подрядчиков: кто ещё в аппаратах и на лесах, кто ушёл в городок, перекрытые проходы и ограждения'},
];
function roleView(sim,sc,L,prev,R,role){const m=R.m; const fire=sim.P.hazard==='fire'; const w=R.wind; const head=[`Время от начала ${fire?'пожара':'выброса'}: ${mmss(R.t)}.`,sourceLine(sim,sc,R),`Метеостанция: ветер ${DIRN(w.from)} (дует с ${w.from}°), ${w.u} м/с.`];
 const sensors=(fire?'Датчики CO (дым), ppm: ':'Датчики H₂S, ppm: ')+R.sens.filter(([n])=>!n.startsWith('ГЗ у')).map(([n,v])=>`${n} ${v}`).join(', ')+'.';
 const zones=Object.entries(R.byZone).sort((a,b)=>b[1]-a[1]).map(([z,n])=>`${L.ZONES[z].name} — около ${n}`).join('; ');
 const rep=R.reports;
 if(role==='ГСО') return [...head,sensors,'Пункты сбора (газ и жар): '+R.queues.map(q=>q.replace(/, отметились.*?, (газ|CO)/,', $1')).join('; ')+'.',rep.filter(x=>/пострадав|ГСО|Пожарные|запах|пахнет|аппарат/.test(x)).join('; ')||'Сообщений о пострадавших нет.'].join('\n');
 if(role==='Учёт') return [...head,'Пункты сбора: '+R.queues.join('; ')+'.',`По спискам нарядов ${sim.listN} человек. Отметились около ${m.regL}${m.unlReg?` и ещё около ${m.unlReg} не из списков`:''}. Не отметились около ${m.unacc}. По зонам: ${zones||'—'}.`,rep.filter(x=>/Городок|КПП|скопление/.test(x)).join('; ')].join('\n');
 return [...head,`Не отметились по зонам: ${zones||'—'}.`,rep.filter(x=>/Бригадир|Городок|Закрыт|Пожарные|скопление|КПП/.test(x)).join('; ')||'Докладов бригадиров нет.'].join('\n')}
function rolePrompt(sim,sc,L,prev,R,role){const ro=ROLES.find(x=>x.id===role); return `Ты — ${ro.name} в штабе ликвидации аварии НПЗ «Демо» во время остановочного ремонта. Ты видишь только свои доклады; ${R.noise}

Схема площадки:
${layout(L,sim)}

Твои доклады:
${roleView(sim,sc,L,prev,R,role)}
${prevLine(prev)}

${actions(sim)}

Твоя зона ответственности: ${ro.focus}. Коротко доложи руководителю ликвидации, что видишь и что важно, и предложи до 3 действий из списка. ${HINT(sim)} Будь осторожен с непроверенными сообщениями.
Ответь только JSON без пояснений: {"report":"2–3 предложения","proposals":[…]}`}
function rlaPrompt(sim,sc,L,prev,R,outs){return `Ты — руководитель ликвидации аварии (начальник смены) НПЗ «Демо» во время остановочного ремонта. Решение принимаешь ты; члены штаба доложили ниже. ${R.noise}

Схема площадки:
${layout(L,sim)}

Что видишь сам:
${[`Время от начала ${sim.P.hazard==='fire'?'пожара':'выброса'}: ${mmss(R.t)}.`,sourceLine(sim,sc,R),`Метеостанция: ветер ${DIRN(R.wind.from)} (дует с ${R.wind.from}°), ${R.wind.u} м/с.`,prevLine(prev)].join('\n')}

Доклады штаба:
${ROLES.map(ro=>`${ro.id} (${ro.name}): ${(outs[ro.id]||{}).report||'доклада нет'}\nПредлагает: ${JSON.stringify((outs[ro.id]||{}).proposals||[])}`).join('\n')}

${actions(sim)}

Сведи доклады, проверь их на противоречия и прими решение. ${HINT(sim)} Действия должны быть выполнимыми и не противоречить друг другу; не повторяй уже выполненные. Не больше 5 действий.
Ответь только JSON без пояснений: {"assessment":"оценка обстановки, 1–2 предложения","decision":"решение, 1–2 предложения","actions":[…]}`}
function assemble(rla,outs){return {reports:{'РЛА':(rla&&rla.assessment)||'—','ГСО':(outs['ГСО']||{}).report||'—','Учёт':(outs['Учёт']||{}).report||'—','Подрядчики':(outs['Подрядчики']||{}).report||'—'},decision:(rla&&rla.decision)||'—',actions:(rla&&rla.actions)||[],proposals:Object.fromEntries(ROLES.map(r=>[r.id,(outs[r.id]||{}).proposals||[]]))}}
function clean(resp,L){const ok=new Set(['muster_close','muster_open','redirect','shelter','isolate','gso','camp_check','open_passage','announce']); const M=new Set(L.MUSTER.map(m=>m.id)); const Z=new Set(Object.keys(L.ZONES));
 return ((resp&&resp.actions)||[]).filter(a=>a&&ok.has(a.type)).filter(a=>{if(a.type==='muster_close'||a.type==='muster_open') return M.has(a.id); if(a.type==='redirect') return Z.has(a.zone)&&M.has(a.to); if(a.type==='gso') return Z.has(a.zone); if(a.type==='shelter') return a.building==='ADM'||a.building==='OP'; if(a.type==='open_passage') return L.CLOSURES.some(c=>c.id===a.id); return true}).slice(0,5)}
return {DPTS,DIRN,mmss,layout,sitrepText,prompt,clean,ACTIONS,actions,ROLES,noisy,rolePrompt,rlaPrompt,assemble};
})();

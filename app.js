const DATA = window.SOP_DATA;
const LV = {full:["完整 SOP","b-full"],partial:["片段線索","b-partial"],media:["僅影音教材","b-media"],empty:["空資料夾","b-empty"]};
const STAT_TAG = {"實質資料":"var(--full)","僅曲譜影片":"var(--media)","空白":"var(--empty)"};
const GMETA={},DMETA={};
DATA.groups.forEach(g=>GMETA[g.name]=g);
DATA.duties.forEach(d=>DMETA[d.k]=d);
const DORDER=DATA.duties.map(d=>d.k);

function esc(t){const d=document.createElement('div');d.textContent=t==null?"":t;return d.innerHTML;}
function cite(t){return esc(t).replace(/（來源：([^）]*)）/g,'<span class="cite">$1</span>').replace(/\(來源：([^\)]*)\)/g,'<span class="cite">$1</span>');}
function fileUrl(s){return (s.fileId&&/^[A-Za-z0-9_-]{20,}$/.test(s.fileId))?"https://drive.google.com/file/d/"+s.fileId+"/view":null;}
function chip(dk){const d=DMETA[dk];return '<span class="dchip" title="'+d.name+'" style="background:'+d.c+'">'+d.s+'</span>';}
// 括號感知分點器：把長句／段落拆成清楚的條列小點
const OPENP='（(〔［【「｛', CLOSEP='）)〕］】」｝';
function splitTop(text,delims){let d=0,cur='',out=[];for(const ch of text){if(OPENP.indexOf(ch)>=0)d++;else if(CLOSEP.indexOf(ch)>=0){if(d>0)d--;}
  if(d===0&&delims.indexOf(ch)>=0){if(cur.trim())out.push(cur.trim());cur='';}else cur+=ch;} if(cur.trim())out.push(cur.trim());return out;}
function renderSeg(seg){const ci=seg.indexOf('：');
  if(ci>0){const parts=splitTop(seg.slice(ci+1),'、／');
    if(parts.length>=3) return '<span class="pt-lead">'+cite(seg.slice(0,ci))+'：</span><ul class="pts sub">'+parts.map(p=>'<li>'+cite(p)+'</li>').join('')+'</ul>';}
  return cite(seg);}
function renderTask(t){const segs=splitTop(t,'；＞');return segs.length>=2?'<ul class="pts">'+segs.map(s=>'<li>'+renderSeg(s)+'</li>').join('')+'</ul>':renderSeg(t);}
function renderInfo(t){const segs=splitTop(t,'。；');return segs.length>=2?'<ul class="pts">'+segs.map(s=>'<li>'+renderSeg(s)+'</li>').join('')+'</ul>':renderSeg(t);}

document.getElementById('statbar').innerHTML =
  [['f','完整 SOP','full'],['p','片段線索','partial'],['m','僅影音','media'],['e','待補件','empty']]
  .map(([c,n,k])=>'<div class="stat '+c+'"><b>'+DATA.extracts.filter(e=>e._lvl===k).length+'</b>'+n+'</div>').join('')
  + '<div class="stat"><b>'+DATA.extracts.length+'</b>法會/活動</div>';
document.getElementById('legend').innerHTML = DATA.duties.map(d=>'<span>'+chip(d.k)+d.name+'</span>').join('');
document.getElementById('principles').innerHTML = DATA.principleGroups.map(g=>
  '<div class="pg"><div class="pg-h" style="color:'+g.color+'"><span class="bar" style="background:'+g.color+'"></span>'+esc(g.name)+'（'+g.items.length+'）</div>'+
  g.items.map(p=>'<div class="pcard" style="border-left-color:'+g.color+'">'+cite(p).replace(/^【([^】]+)】/,'<span class="k">【$1】</span>')+'</div>').join('')+'</div>').join('');

const wrap=document.getElementById('cards');
const idxG={}; DATA.groups.forEach(g=>idxG[g.name]=[]);
let lastG=null;
DATA.extracts.forEach((e,i)=>{
  const id='fh-'+i, gc=GMETA[e._group].color;
  idxG[e._group].push('<a data-open="'+i+'" href="#'+id+'"><span class="dchip" style="min-width:0;width:11px;height:11px;padding:0;background:'+gc+'"></span>'+esc(e.category.replace(/（.*/,''))+'</a>');
  if(e._group!==lastG){
    const g=GMETA[e._group], cnt=DATA.extracts.filter(x=>x._group===e._group).length;
    const dv=document.createElement('div'); dv.className='grp-div'; dv.dataset.group=e._group;
    dv.innerHTML='<span class="bar" style="background:'+g.color+'"></span><span class="t">'+esc(g.name)+'</span><span class="d">· '+esc(g.desc)+'</span><span class="n">'+cnt+' 項</span>';
    wrap.appendChild(dv); lastG=e._group;
  }
  const art=document.createElement('article');
  art.className='fahui'; art.id=id; art.dataset.lvl=e._lvl; art.style.borderLeftColor=gc;
  const allTasks=[]; e.sop.stages.forEach(s=>s.tasks.forEach(t=>allTasks.push(t)));
  art.dataset.text=(e.category+' '+e.sop.overview+' '+e.sop.altarLayout+' '+e.sop.offerings+' '+e.sop.notes+' '+allTasks.map(t=>t.t).join(' ')).toLowerCase();
  const meta=e.hasAltarContent?(e.sop.stages.length+' 階段 · '+allTasks.length+' 步驟 · '+e.sources.length+' 來源')
                              :(e.sources.length+' 份來源（無香燈文字）');
  let body='';
  if(e.provenanceNote) body+='<div class="prov">ⓘ '+esc(e.provenanceNote)+'</div>';
  if(e.sop.overview) body+='<div class="lead">'+cite(e.sop.overview)+'</div>';

  if(e.sop.stages.length){
    let tl='<div class="timeline">'+e.sop.stages.map((s,si)=>
      '<div class="tl-item"><div class="tl-node">'+(si+1)+'</div><h4>'+esc(s.stage)+'</h4><ul>'+
      s.tasks.map(t=>'<li>'+chip(t.d)+'<div class="ptw">'+renderTask(t.t)+'</div></li>').join('')+'</ul></div>').join('')+'</div>';
    let dv='<div class="view-duty" hidden>'+DORDER.map(dk=>{
      const items=allTasks.filter(t=>t.d===dk); if(!items.length) return '';
      const d=DMETA[dk];
      return '<div class="dgroup"><div class="dgh" style="color:'+d.c+'">'+chip(dk)+d.name+'<span class="n">（'+items.length+'）</span></div><ul>'+
        items.map(t=>'<li>'+renderTask(t.t)+'</li>').join('')+'</ul></div>';
    }).join('')+'</div>';
    body+='<div class="viewswitch"><button class="vs on" data-v="time">⏱ 時序</button><button class="vs" data-v="duty">🗂 職能</button></div>'+
      '<div class="view-time">'+tl+'</div>'+dv;
  }

  let ig='';
  if(e.sop.altarLayout) ig+='<div class="info"><div class="info-h">🪷 壇場・版位布置</div><div class="info-b">'+renderInfo(e.sop.altarLayout)+'</div></div>';
  if(e.sop.offerings) ig+='<div class="info"><div class="info-h">🍎 供品（香花燈燭水果）</div><div class="info-b">'+renderInfo(e.sop.offerings)+'</div></div>';
  if(e.sop.notes) ig+='<div class="info"><div class="info-h">🔔 法器・牌位・注意事項</div><div class="info-b">'+renderInfo(e.sop.notes)+'</div></div>';
  if(ig) body+='<div class="infogrid">'+ig+'</div>';
  if(e.roster && e.roster.length){
    body+='<div class="roster"><div class="roster-h">👥 人員編制（去識別化，'+e.roster.length+' 人）</div>'+
      e.roster.map(p=>'<div class="rperson"><span class="rnum">人員'+p.num+(p.name?'（'+esc(p.name)+'）':'')+'</span><span class="rkind '+(p.kind==='法師'?'k-f':'k-l')+'">'+esc(p.kind)+'</span><span class="rrole">'+esc(p.role)+'</span><div class="rduty">'+esc(p.dutiesSummary)+'</div></div>').join('')+'</div>';
  }
  if(e.manpower){
    const mp=e.manpower, hasC=mp.conflicts&&mp.conflicts.length;
    body+='<div class="manpower '+(hasC?'has':'ok')+'"><div class="mp-h">'+(hasC?'⚠️ 人力配置檢查 · '+mp.conflicts.length+' 項需注意':'✅ 人力配置檢查 · 未發現明顯衝突')+'</div>'+
      (mp.summary?'<div class="mp-sum">'+esc(mp.summary)+'</div>':'')+
      (hasC?'<ul class="mp-list">'+mp.conflicts.map(c=>'<li class="sev-'+esc(c.severity)+'"><span class="sev">'+esc(c.severity)+'</span><b>'+esc(c.issue)+'</b>（'+esc(c.when)+'）：'+esc(c.detail)+'<span class="mp-sug">→ 建議：'+esc(c.suggestion)+'　〔涉及 人員'+(c.nums||[]).join('、人員')+'〕</span></li>').join('')+'</ul>':'')+
      '</div>';
  }
  if(!e.hasAltarContent && e._cov) body+='<div class="lead">此法會雲端資料夾內<b>無香燈文字文件</b>。'+esc(e._cov)+'</div>';
  if(e.sources.length){
    body+='<details class="drawer"><summary>📄 資料出處（'+e.sources.length+'）</summary><ul class="srcs">'+
      e.sources.map(s=>{const u=fileUrl(s);const t=u?'<a href="'+u+'" target="_blank" rel="noopener">'+esc(s.title)+'</a>':esc(s.title);
        return '<li>'+t+' <span class="kind">— '+esc(s.kind)+'</span></li>';}).join('')+'</ul></details>';
  }
  if(e.gaps) body+='<details class="drawer"><summary>ⓘ 資料範圍與缺漏標註</summary><div class="gaps-txt">'+esc(e.gaps)+'</div></details>';

  art.innerHTML='<button class="fh-head"><span class="fh-title"><span class="fh-name">'+esc(e.category)+'</span><span class="fh-meta">'+meta+'</span></span>'+
    '<span class="badge '+LV[e._lvl][1]+'">'+LV[e._lvl][0]+'</span><span class="chev">›</span></button>'+
    '<div class="fh-body">'+body+'</div>';
  art.querySelector('.fh-head').addEventListener('click',()=>art.classList.toggle('open'));
  art.querySelectorAll('.vs').forEach(b=>b.addEventListener('click',ev=>{
    ev.stopPropagation();
    art.querySelectorAll('.vs').forEach(x=>x.classList.toggle('on',x===b));
    const duty=b.dataset.v==='duty';
    const vt=art.querySelector('.view-time'), vd=art.querySelector('.view-duty');
    if(vt)vt.hidden=duty; if(vd)vd.hidden=!duty;
  }));
  wrap.appendChild(art);
});

document.getElementById('index').innerHTML = DATA.groups.filter(g=>idxG[g.name].length).map(g=>
  '<div class="idx-group"><div class="idx-gl"><span class="bar" style="background:'+g.color+'"></span>'+esc(g.name)+'（'+idxG[g.name].length+'）</div><div class="idx">'+idxG[g.name].join('')+'</div></div>').join('');
document.getElementById('cov').innerHTML = DATA.coverage.map(c=>{const color=STAT_TAG[c.status]||'var(--media)';
  return '<div class="row"><div class="c1">'+esc(c.category)+'<span class="tag" style="background:'+color+'">'+esc(c.status)+'</span></div><div class="c2">'+esc(c.detail)+'</div></div>';}).join('');
document.getElementById('todo').innerHTML = DATA.todo.map(t=>'<li>'+esc(t).replace(/^【([^】]+)】/,'<b>【$1】</b>')+'</li>').join('');
document.getElementById('gen').textContent=DATA.generated;
document.getElementById('rootlink').href=DATA.rootFolder;

let flt='all', kw='';
const cards=[...document.querySelectorAll('.fahui')], divs=[...document.querySelectorAll('.grp-div')], countEl=document.getElementById('count');
function apply(){
  let n=0;
  cards.forEach(c=>{const okF=flt==='all'||c.dataset.lvl===flt, okK=!kw||c.dataset.text.includes(kw), show=okF&&okK;
    c.style.display=show?'':'none'; if(show){n++; if(kw)c.classList.add('open');}});
  const browsing=(flt==='all'&&!kw);
  divs.forEach(d=>{d.style.display=browsing?'':'none';});
  countEl.textContent='顯示 '+n+' / '+cards.length+' 個法會'+(kw?'（關鍵字：'+kw+'）':'');
}
document.getElementById('q').addEventListener('input',e=>{kw=e.target.value.trim().toLowerCase();apply();});
document.querySelectorAll('.chip').forEach(ch=>ch.addEventListener('click',()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));ch.classList.add('on');flt=ch.dataset.f;apply();}));
const cbtn=document.getElementById('citebtn');
cbtn.addEventListener('click',()=>{const hidden=document.body.classList.toggle('hide-cite');cbtn.classList.toggle('on',!hidden);cbtn.textContent=hidden?'顯示出處':'隱藏出處';});
document.getElementById('index').addEventListener('click',ev=>{const a=ev.target.closest('a[data-open]');if(!a)return;
  const i=+a.dataset.open, card=document.getElementById('fh-'+i);
  if(flt!=='all'||kw){flt='all';kw='';document.getElementById('q').value='';document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x.dataset.f==='all'));apply();}
  card.classList.add('open');cards.forEach(c=>c.classList.remove('hl'));card.classList.add('hl');setTimeout(()=>card.classList.remove('hl'),1600);
});
apply();

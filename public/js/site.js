function tick(){
  const f = tz => new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  const seoul = document.getElementById('clk-seoul');
  const nyc = document.getElementById('clk-nyc');
  if(seoul) seoul.textContent = f('Asia/Seoul');
  if(nyc) nyc.textContent = f('America/New_York');
}
tick(); setInterval(tick,1000);

document.querySelectorAll('.item').forEach(it => {
  const open = () => openRoom(it.dataset.id);
  it.addEventListener('click', open);
  it.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); open(); } });
});

function setFilter(f){
  document.querySelectorAll('.fchip').forEach(c=>c.classList.toggle('on',c.dataset.f===f));
  document.getElementById('grid').classList.toggle('filtered', f!=='all');
  document.querySelectorAll('#grid .item').forEach(it=>{
    const tags = it.dataset.tags.split(',');
    const show = f==='all' || tags.includes(f);
    it.classList.toggle('hide',!show);
    if(show){ it.style.animation='none'; it.offsetHeight; it.style.animation=''; }
  });
  document.getElementById('work').scrollIntoView({behavior:'smooth',block:'start'});
}

const ORDER = ["fluid", "calibrated", "surreal", "shadow", "ordinary", "ivanpah", "spectrum"];
let current = null;
function openRoom(id){
  const el = document.getElementById('room-'+id);
  el.classList.add('open'); el.setAttribute('aria-hidden','false');
  el.querySelector('.room-scroll').scrollTop = 0;
  document.body.classList.add('locked');
  current = id;
}
function closeRoom(){
  if(!current) return;
  const el = document.getElementById('room-'+current);
  el.classList.remove('open'); el.setAttribute('aria-hidden','true');
  document.body.classList.remove('locked');
  current = null;
}
function nextRoom(id){
  const i = ORDER.indexOf(id);
  document.getElementById('room-'+id).classList.remove('open');
  document.getElementById('room-'+id).setAttribute('aria-hidden','true');
  setTimeout(()=>openRoom(ORDER[(i+1)%ORDER.length]), 150);
}
addEventListener('keydown', e => { if(e.key==='Escape') closeRoom(); });

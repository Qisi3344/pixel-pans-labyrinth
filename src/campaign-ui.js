import './campaign-style.css';
import {FINAL_OUTCOMES} from './chapter4-logic.js';
import {CHAPTERS,CAMPAIGN_MENU,CAMPAIGN_FINAL,loadCampaign,storeCampaign,
 setInputPreference,chapterUnlocked,campaignChapterUrl,selectedInputMode,
 inferredInputMode,defaultProgress} from './campaign.js';

const $=id=>document.getElementById(id);
const chapterMarkup=(c,save)=>`
 <button type="button" class="tale-chapter ${chapterUnlocked(c.number,save)?'':'is-locked'}"
 data-chapter="${c.number}" ${chapterUnlocked(c.number,save)?'':'disabled'}
 aria-label="${c.name}${chapterUnlocked(c.number,save)?'':'，尚未解锁'}">
  <span class="tale-chapter-num">0${c.number}</span>
  <span class="tale-chapter-words"><small>${c.kind}</small><strong>${c.name}</strong><em>${c.english}</em></span>
  <span class="tale-chapter-end">${save.completed>=c.number?'✓':'↗'}</span>
 </button>`;
const setBody=(klass)=>{
 document.body.className='campaign-root '+klass;
 document.documentElement.dataset.inputMode=selectedInputMode();
};
const navigate=url=>{window.location.href=url;};
const chapterButtons=(root,save)=>{
 root.querySelectorAll('[data-chapter]').forEach(button=>{
  button.addEventListener('click',()=>{
   const number=Number(button.dataset.chapter);
   if(chapterUnlocked(number,save))navigate(campaignChapterUrl(number));
  });
 });
};
function addSelectionHandlers(panel,onDone,onCancel){
 let mode=selectedInputMode(),lastFocus=document.activeElement;
 const update=()=>{
  panel.querySelectorAll('[data-choose-mode]').forEach(el=>{
   el.setAttribute('aria-pressed',String(el.dataset.chooseMode===mode));
  });
 };
 update();
 panel.querySelectorAll('[data-choose-mode]').forEach(el=>{
  el.addEventListener('click',()=>{mode=el.dataset.chooseMode;update();});
 });
 panel.querySelector('[data-mode-accept]').addEventListener('click',()=>{
  setInputPreference(mode);
  document.documentElement.dataset.inputMode=mode;
  onDone(mode);
 });
 panel.querySelector('[data-mode-cancel]')?.addEventListener('click',()=>{
  onCancel?.();lastFocus?.focus?.({preventScroll:true});
 });
}
function modeMarkup(cancel=true){
 return `<section class="tale-modal-backdrop" id="tale-mode-dialog" role="dialog"
  aria-modal="true" aria-label="选择操作方式">
  <div class="tale-modal tale-mode" tabindex="-1">
   <div class="tale-eyebrow">BEFORE THE FIRST STEP · 操作方式</div>
   <div class="tale-crest">✧</div><h2>你打算如何行走？</h2>
   <p>选择适合设备的操作方式。进入游戏后仍可随时切换。</p>
   <div class="tale-options">
    <button type="button" data-choose-mode="touch" aria-pressed="false">
     <span class="tale-mode-symbol">◎</span><strong>触屏操作</strong>
     <small>圆形摇杆移动 · 触碰交互 · 轻点地面寻路</small>
    </button>
    <button type="button" data-choose-mode="keyboard" aria-pressed="false">
     <span class="tale-mode-symbol">⌘</span><strong>键鼠操作</strong>
     <small>WASD / 方向键移动 · E 交互 · 鼠标寻路</small>
    </button>
   </div>
   <div class="tale-modal-actions">
    ${cancel?'<button type="button" class="tale-text-button" data-mode-cancel>返回</button>':''}
    <button type="button" class="tale-primary" data-mode-accept>确定操作方式 <span>↗</span></button>
   </div>
  </div>
 </section>`;
}
function prologueMarkup(){
 return `<section class="tale-modal-backdrop" id="tale-prologue" role="dialog"
 aria-modal="true" aria-labelledby="tale-prologue-title">
 <article class="tale-modal tale-prologue">
  <div class="tale-crest">✦</div>
  <div class="tale-eyebrow">PROLOGUE · THE STONE REMEMBERS</div>
  <h2 id="tale-prologue-title">门后的故事</h2>
  <div class="tale-prologue-art" aria-hidden="true"><span>✧</span></div>
  <p>有些门只在夜里开启。<br>少女循着古老的石路，走向被遗忘的名字。<br>
  一把钥匙、一柄匕首，以及必须遵守的禁忌，<br>正等待着她。</p>
  <button id="tale-enter" class="tale-primary" type="button">走进迷宫 <span>↗</span></button>
 </article></section>`;
}
function installHome(){
 const save=loadCampaign();
 setBody('campaign-menu');
 document.title='潘神的迷宫 · 黑暗童话微缩世界';
 document.body.innerHTML=`
  <main class="tale-page tale-menu-page">
   <div class="tale-vine tale-vine-a" aria-hidden="true"></div>
   <div class="tale-vine tale-vine-b" aria-hidden="true"></div>
   <div class="tale-page-inner">
    <header class="tale-title">
     <div class="tale-eyebrow">A MINIATURE DARK FAIRYTALE · THREE.JS</div>
     <div class="tale-crest" aria-hidden="true">✧</div>
     <h1>潘神的迷宫</h1>
     <div class="tale-english">PAN'S LABYRINTH</div>
     <div class="tale-rule"><span>✦</span></div>
     <p>迷宫从不告诉来者，哪一条路可以回头。</p>
    </header>
    <div class="tale-menu-main">
     <section class="tale-hero-menu" aria-label="主菜单">
      <div class="tale-gate" aria-hidden="true"><div class="tale-gate-in"><span>✧</span></div></div>
      <div class="tale-main-actions">
       <button class="tale-primary" id="tale-new" type="button">开启旅程 <span>↗</span></button>
       ${save.completed>0?`<button class="tale-secondary" id="tale-continue" type="button">${save.completed>=4?'回顾最终结局':'继续旅程 · 第 '+Math.min(4,save.completed+1)+' 章'} <span>↗</span></button>`:''}
       <button class="tale-secondary" id="tale-controls" type="button">操作方式 <span>⌘</span></button>
       <p class="tale-save">${save.completed===4?'终章已完成 · 两条命运都可重温':save.completed>0?`已走过 ${save.completed} / 4 章 · 进度保存在本机`:'四段微缩章节 · 从石之迷宫开始'}</p>
      </div>
     </section>
     <section class="tale-chapter-list" aria-label="章节回看">
      <div class="tale-panel-heading"><span>THE CHAPTERS</span><strong>章节回看</strong></div>
      ${CHAPTERS.map(c=>chapterMarkup(c,save)).join('')}
      <div class="tale-panel-foot">✧ 首次游玩按顺序解锁章节。已完成的章节可以随时重温。</div>
     </section>
    </div>
    <footer class="tale-page-foot">
     <span>等距视角 · 三维像素微缩世界</span><span>黑暗童话四章 · 非官方致敬作品</span>
    </footer>
   </div>
  </main>`;
 chapterButtons(document,save);
 const dialog=(onChosen)=>{
  if(document.getElementById('campaign-dialog-host'))return;
  const host=document.createElement('div');host.id='campaign-dialog-host';host.innerHTML=modeMarkup();
  document.body.appendChild(host);
  const sheet=$('tale-mode-dialog');
  const close=()=>host.remove();
  addSelectionHandlers(sheet,onChosen?()=>onChosen(host):close,close);
  sheet.querySelector('.tale-modal').focus({preventScroll:true});
 };
 $('tale-new').addEventListener('click',()=>{
  dialog(host=>{
   // This replaces the selector *without removing its host from the DOM*.
   host.innerHTML=prologueMarkup();
   const prologue=host.querySelector('#tale-prologue');
   prologue.querySelector('#tale-enter').focus({preventScroll:true});
   prologue.querySelector('#tale-enter').addEventListener('click',()=>navigate(campaignChapterUrl(1)));
  });
 });
 $('tale-controls').addEventListener('click',()=>dialog());
 $('tale-continue')?.addEventListener('click',()=>navigate(save.completed>=4?CAMPAIGN_FINAL:campaignChapterUrl(Math.min(4,save.completed+1))));
}
function installEpilogue(){
 const save=loadCampaign();
 if(save.completed<4){navigate(CAMPAIGN_MENU);return;}
 let viewed=save.ending||'mercy';
 setBody('campaign-ending');
 document.title='最后的命运 · 潘神的迷宫';
 const choices=save.endingsSeen||[viewed];
 document.body.innerHTML=`
 <main class="tale-page tale-ending-page" id="tale-epilogue-root">
  <div class="tale-vine tale-vine-a" aria-hidden="true"></div>
  <div class="tale-vine tale-vine-b" aria-hidden="true"></div>
  <article class="tale-ending-content" id="tale-ending-art">
   <div class="tale-eyebrow">THE FINAL TRIAL · THE KINGDOM BEYOND</div>
   <div class="tale-crest" id="tale-end-crest">✧</div>
   <h1 id="tale-end-heading">无辜之血</h1>
   <div class="tale-english" id="tale-end-subtitle">THE ROYAL RETURN</div>
   <div class="tale-rule"><span>✦</span></div>
   <p class="tale-epilogue-prose" id="tale-end-prose"></p>
   <div class="tale-royal-blessing">
    <div class="tale-eyebrow">THE KING AND QUEEN · 父亲与母亲</div>
    <blockquote id="tale-end-blessing"></blockquote>
   </div>
   <div class="tale-relics" aria-label="旅途所得">
    ${CHAPTERS.map(c=>`<div><span>${c.icon}</span><small>第 0${c.number} 章</small><strong>${c.item}</strong></div>`).join('')}
   </div>
   <p class="tale-epilogue-note" id="tale-end-last"></p>
   <div class="tale-end-archive">
    <div class="tale-eyebrow">已见结局 · ${choices.length} / 2</div>
    <div class="tale-end-tabs">
     ${choices.map(k=>`<button type="button" data-ending="${k}">${k==='mercy'?'✧ 无辜之血':'✢ 猩红归途'}</button>`).join('')}
    </div>
    <p>“猩红归途”为本游戏新增的架空命运；“无辜之血”对应电影原结局。</p>
   </div>
   <div class="tale-ending-actions">
    <button id="tale-replay-final" type="button" class="tale-primary">重走最后的石井 <span>↗</span></button>
    <button id="tale-replay" type="button" class="tale-secondary">从头重温</button>
    <button id="tale-toc" type="button" class="tale-secondary">章节目录</button>
   </div>
  </article>
 </main>`;
 const render=()=>{
  const v=FINAL_OUTCOMES[viewed];
  $('tale-epilogue-root').dataset.ending=viewed;
  $('tale-end-crest').textContent=viewed==='mercy'?'✧':'✢';
  $('tale-end-heading').textContent=v.title;
  $('tale-end-subtitle').textContent=v.subtitle;
  $('tale-end-prose').textContent=viewed==='mercy'
   ?'维达尔赶到石井，带走了弟弟，枪声落下。\\n少女的血流过古老台阶，点亮一扇谁也无法证实的门。\\n在金色王宫中，她再次见到了父亲与母亲。'
   :'奥菲莉娅交出了潘神要求的那一滴血。\\n石井闪出猩红的光，路真的通向了王宫。\\n父亲与母亲在等待她——弟弟却再也没能穿过那道门。';
  $('tale-end-blessing').textContent=v.speech;
  $('tale-end-last').textContent=v.second+' '+v.last;
  document.querySelectorAll('[data-ending]').forEach(b=>{
   b.setAttribute('aria-pressed',String(b.dataset.ending===viewed));
  });
 };
 document.querySelectorAll('[data-ending]').forEach(b=>
  b.addEventListener('click',()=>{viewed=b.dataset.ending;render();}));
 render();
 $('tale-replay-final').addEventListener('click',()=>navigate(campaignChapterUrl(4)));
 $('tale-replay').addEventListener('click',()=>navigate(campaignChapterUrl(1)));
 $('tale-toc').addEventListener('click',()=>navigate(CAMPAIGN_MENU));
}
export function bootCampaignScreen(params=new URLSearchParams(window.location.search)){
 if(params.get('screen')==='epilogue')installEpilogue();
 else installHome();
}
export function mountChapterFrame(stage){
 if(!Number.isInteger(stage)||stage<1||stage>4)return;
 document.body.classList.add('campaign-chapter');
 document.documentElement.dataset.inputMode=selectedInputMode();
 document.documentElement.dataset.chapter=String(stage);
 const parent=document.querySelector(stage===1?'.top-actions':stage===2?'.root-tools':stage===3?'.pale-tools':'.final-tools');
 if(!parent||document.getElementById('tale-chapter-menu'))return;
 const menu=document.createElement('button');
 menu.id='tale-chapter-menu';menu.type='button';menu.textContent='☷';
 menu.title='章节目录';menu.setAttribute('aria-label','返回章节目录');
 menu.className='tale-hud-action';
 menu.addEventListener('click',()=>navigate(CAMPAIGN_MENU));
 const setting=document.createElement('button');
 setting.id='tale-chapter-settings';setting.type='button';setting.textContent='◈';
 setting.title='操作方式';setting.setAttribute('aria-label','切换操作方式');
 setting.className='tale-hud-action';
 parent.prepend(setting);parent.prepend(menu);
 if(stage===1){
  document.getElementById('begin')?.addEventListener('click',()=>{
   const tip=document.getElementById('game-tip');
   if(tip){
    tip.textContent=selectedInputMode()==='touch'
     ?'拖动圆形摇杆移动；右侧按钮互动。轻点地面也可以寻路。'
     :'按 WASD / 方向键移动；靠近符印后按 E，或点击地面寻路。';
    tip.classList.add('show');
   }
  },{once:true});
 }
 setting.addEventListener('click',()=>{
  if(document.getElementById('campaign-dialog-host'))return;
  // Pause simulation while changing controls, including the Pale Man chase.
  window.__pansModalOpen=true;
  window.dispatchEvent(new Event('blur'));
  const host=document.createElement('div');host.id='campaign-dialog-host';host.innerHTML=modeMarkup(true);
  document.body.appendChild(host);
  const sheet=$('tale-mode-dialog');
  let capture=null;
  const close=()=>{
   window.__pansModalOpen=false;
   window.removeEventListener('keydown',capture,true);
   host.remove();
  };
  addSelectionHandlers(sheet,close,close);
  sheet.querySelector('.tale-modal').focus({preventScroll:true});
  capture=e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
   if(e.key!=='Tab'){e.preventDefault();e.stopImmediatePropagation();}
  };
  window.addEventListener('keydown',capture,true);
 });
}

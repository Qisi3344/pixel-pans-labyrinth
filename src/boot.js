// The full game now has a single campaign shell. Each Three.js chapter is
// lazy-loaded with a LITERAL Vite import so old levels remain independent
// modules (and existing chapter QA links keep working).
import {bootCampaignScreen,mountChapterFrame} from './campaign-ui.js';
const params=new URLSearchParams(window.location.search);
const stage=params.get('stage');
if(!['1','2','3','4'].includes(stage)||params.get('screen')==='menu'||params.get('screen')==='epilogue'){
 bootCampaignScreen(params);
}else{
 const loading=stage==='4'?import('./chapter4-main.js'):
  stage==='3'?import('./chapter3-main.js'):
  stage==='2'?import('./chapter2-main.js'):import('./main.js');
 loading.then(()=>{
  mountChapterFrame(Number(stage));
 }).catch(error=>{
  console.error('Unable to load chapter:',error);
  const card=document.createElement('section');
  card.className='tale-load-error';card.style.cssText=
   'position:fixed;inset:0;z-index:9999;background:#191f1e;display:grid;place-items:center;color:#f1e4ce;font:14px system-ui';
  const wrap=document.createElement('div');wrap.style.cssText='max-width:500px;text-align:center;padding:32px';
  const heading=document.createElement('h2');heading.textContent='迷宫暂时沉默了';
  const copy=document.createElement('p');copy.textContent='章节加载失败，请返回目录或刷新页面重试。';
  const link=document.createElement('a');link.href='?screen=menu';link.textContent='返回章节目录';link.style.color='#c5aa7f';
  wrap.append(heading,copy,link);
  if(params.get('debug')==='1'){
   const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.fontSize='11px';
   pre.textContent=String(error?.stack||error);wrap.append(pre);
  }
  card.append(wrap);document.body.append(card);
 });
}

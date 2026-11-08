import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAPTERS,SAVE_KEY,CAMPAIGN_FINAL,defaultProgress,loadCampaign,
 storeCampaign,setInputPreference,recordChapterComplete,chapterUnlocked,
 campaignChapterUrl,getItemNames,selectedInputMode,inferredInputMode} from '../src/campaign.js';

function storage(){
 const values=new Map();
 return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
}
test('one story preserves film task chronology while labeling prologue as a prologue',()=>{
 assert.deepEqual(CHAPTERS.map(x=>x.name),['石之迷宫','巨树之腹','苍白盛宴','最后的石井']);
 assert.ok(CHAPTERS[0].kind.includes('序幕'));
 assert.ok(CHAPTERS[1].kind.includes('第一项试炼'));
 assert.ok(CHAPTERS[2].kind.includes('第二项试炼'));
 assert.ok(CHAPTERS[3].kind.includes('第三项试炼'));
 assert.equal(CAMPAIGN_FINAL,'?screen=epilogue');
});

test('new playthrough unlocks chapters in order and stores key/knife only when earned',()=>{
 const s=storage();const initial=loadCampaign(s);
 assert.equal(initial.completed,0);
 assert.equal(chapterUnlocked(1,initial),true);
 assert.equal(chapterUnlocked(2,initial),false);
 assert.equal(chapterUnlocked(3,initial),false);
 assert.equal(recordChapterComplete(3,s).completed,0,'deep-link cannot unlock all');
 assert.equal(recordChapterComplete(2,s).completed,0,'skipping chapter 1 cannot unlock');
 assert.equal(recordChapterComplete(1,s).completed,1);
 assert.equal(chapterUnlocked(2,loadCampaign(s)),true);
 assert.equal(recordChapterComplete(2,s).completed,2);
 assert.deepEqual(getItemNames(loadCampaign(s)),['三枚归位的符印','黄金钥匙']);
 assert.equal(chapterUnlocked(3,loadCampaign(s)),true);
 assert.equal(recordChapterComplete(3,s).dagger,true);
 assert.equal(loadCampaign(s).completed,3);
 assert.deepEqual(getItemNames(loadCampaign(s)),
  ['三枚归位的符印','黄金钥匙','祭仪匕首']);
 assert.equal(chapterUnlocked(3,loadCampaign(s)),true);
 assert.equal(chapterUnlocked(4,loadCampaign(s)),true);
 assert.equal(campaignChapterUrl(2),'?stage=2&flow=1');
 assert.equal(campaignChapterUrl(4),'?stage=4&flow=1');
});

test('user-chosen touch or keyboard controls persist and override device guess',()=>{
 const s=storage();
 assert.equal(inferredInputMode({matchMedia:()=>({matches:true})}),'touch');
 assert.equal(inferredInputMode({matchMedia:()=>({matches:false})}),'keyboard');
 setInputPreference('touch',s);assert.equal(selectedInputMode(s), 'touch');
 setInputPreference('keyboard',s);assert.equal(loadCampaign(s).mode,'keyboard');
 assert.throws(()=>setInputPreference('controller',s));
 assert.ok(s.getItem(SAVE_KEY).includes('keyboard'));
});

test('broken or hostile browser save cannot crash or unlock extra chapters',()=>{
 const s=storage();s.setItem(SAVE_KEY,'{not json');
 assert.deepEqual(loadCampaign(s),defaultProgress());
 s.setItem(SAVE_KEY,JSON.stringify({completed:999,lastStage:999,mode:'gamepad'}));
 const p=loadCampaign(s);assert.equal(p.completed,4);assert.equal(p.mode,null);
 assert.equal(p.lastStage,4);
});

test('boot hosts a real menu, prologue and epilogue, not three disconnected demos',()=>{
 const boot=readFileSync(new URL('../src/boot.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/campaign-ui.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/campaign-style.css',import.meta.url),'utf8');
 const first=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const tree=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 const banquet=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(boot.includes('bootCampaignScreen(params)'));
 assert.ok(boot.includes('mountChapterFrame(Number(stage))'));
 for(const entry of ["import('./main.js')","import('./chapter2-main.js')","import('./chapter3-main.js')","import('./chapter4-main.js')"])
  assert.ok(boot.includes(entry),entry);
 assert.ok(ui.includes('modeMarkup()')&&ui.includes('prologueMarkup()'));
 assert.ok(ui.includes('installEpilogue()')&&ui.includes('installHome()'));
 assert.ok(ui.includes('章节回看'));
 assert.ok(ui.includes('settings')||ui.includes('操作方式'));
 assert.ok(first.includes('recordChapterComplete(1)'));
 assert.ok(tree.includes('recordChapterComplete(2)'));
 assert.ok(banquet.includes('recordChapterComplete(3)'));
 assert.ok(banquet.includes('campaignChapterUrl(4)'));
 assert.ok(css.includes('.tale-chapter-list'));
 assert.ok(css.includes('html[data-input-mode="keyboard"] .touch-controls'));
 assert.ok(css.includes('html[data-input-mode="touch"] .pale-touch'));
});

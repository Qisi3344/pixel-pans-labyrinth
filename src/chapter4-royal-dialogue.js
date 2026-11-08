// Dialogue is staged IN the royal hall, close to the speaking monarch.
import {FINAL_CUES} from './chapter4-cinematic.js';
// These are original Chinese adaptations, not quotations from the screenplay.
export const ROYAL_DIALOGUE=Object.freeze({
 mercy:Object.freeze([
  Object.freeze({speaker:'father',start:FINAL_CUES.mercy.royalAt+.65,end:14.75,name:'父王',
   text:'欢迎回来，我的女儿。你宁愿流自己的血，也没有伤害无辜。最后的试炼，你通过了。'}),
  Object.freeze({speaker:'mother',start:14.75,end:19.75,name:'母后',
   text:'回来吧，孩子。中间的王座，一直为你留着。'})
 ]),
 offering:Object.freeze([
  Object.freeze({speaker:'father',start:FINAL_CUES.offering.royalAt+.65,end:14.10,name:'父王',
   text:'欢迎回来，女儿。漫长的归途终于结束了。这里仍有你的王座。'}),
  Object.freeze({speaker:'mother',start:14.10,end:18.90,name:'母后',
   text:'来吧，孩子。你终于回到了自己的家。'})
 ])
});
export function activeRoyalDialogue(ending,time,royalShown=true){
 if(!royalShown||!Number.isFinite(time))return null;
 return ROYAL_DIALOGUE[ending]?.find(line=>time>=line.start&&time<line.end)||null;
}
export const royalDialogueEnd=ending=>ROYAL_DIALOGUE[ending]?.at(-1)?.end??0;

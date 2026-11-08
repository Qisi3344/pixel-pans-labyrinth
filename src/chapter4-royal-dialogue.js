// Dialogue is staged IN the royal hall, close to the speaking monarch.
// These are original Chinese adaptations, not quotations from the screenplay.
export const ROYAL_DIALOGUE=Object.freeze({
 mercy:Object.freeze([
  Object.freeze({speaker:'father',start:5.20,end:9.40,name:'父王',
   text:'欢迎回来，我的女儿。你宁愿流自己的血，也没有伤害无辜。最后的试炼，你通过了。'}),
  Object.freeze({speaker:'mother',start:9.40,end:14.15,name:'母后',
   text:'回来吧，孩子。中间的王座，一直为你留着。'})
 ]),
 offering:Object.freeze([
  Object.freeze({speaker:'father',start:4.05,end:8.28,name:'父王',
   text:'你打开了归来的门。可我看见，你身后少了一个孩子。'}),
  Object.freeze({speaker:'mother',start:8.28,end:12.95,name:'母后',
   text:'欢迎回来，女儿。王座仍属于你，但有些代价，连王国也无法偿还。'})
 ])
});
export function activeRoyalDialogue(ending,time,royalShown=true){
 if(!royalShown||!Number.isFinite(time))return null;
 return ROYAL_DIALOGUE[ending]?.find(line=>time>=line.start&&time<line.end)||null;
}
export const royalDialogueEnd=ending=>ROYAL_DIALOGUE[ending]?.at(-1)?.end??0;

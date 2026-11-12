(()=>{
'use strict';
const manifest=window.AURA_COMPOSITE_VOICES;
const previous=window.showAuraDemo;
if(!manifest||!previous)return;
window.showAuraDemo=function(viewer,item,group,card){
 const records=manifest[item.id];
 const adapted=records&&Array.isArray(item.events)?{...item,events:item.events.map((e,i)=>records[i]?{...e,text:records[i].zh,en:records[i].en}:e)}:item;
 previous(viewer,adapted,group,card);
};
})();

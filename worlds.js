// Real destinations; the route, launch targets, and travel times are arcade fiction.
export const WORLDS = [
  {name:'Earth',kind:'Our home planet',color:'#79b9d7',land:'#73b59b',sky:[91,132,167],haze:[177,181,170],terrain:['#738b8f','#526f73','#344f59'],clouds:true},
  {name:'Moon',kind:'Earth’s moon',color:'#bdbdc6',land:'#858793',sky:[14,17,29],haze:[39,41,54],terrain:['#93949e','#646571','#3d3f4d'],companion:'earth'},
  {name:'Mars',kind:'The red planet',color:'#d88969',land:'#a55140',sky:[112,72,76],haze:[205,145,111],terrain:['#b37b67','#8f5849','#563a37']},
  {name:'Ceres',kind:'Dwarf planet · asteroid belt',color:'#aaa69e',land:'#77786e',sky:[16,19,32],haze:[39,43,52],terrain:['#8b8982','#62655f','#393f3e']},
  {name:'Europa',kind:'Jupiter’s icy moon',color:'#e1d0ae',land:'#ad7e68',sky:[17,22,39],haze:[42,47,64],terrain:['#bdbbb5','#89929c','#535e71'],companion:'jupiter'},
  {name:'Titan',kind:'Saturn’s hazy moon',color:'#d8ae65',land:'#a27740',sky:[110,77,40],haze:[195,150,76],terrain:['#aa885c','#7b6247','#4e4333'],clouds:true},
  {name:'Triton',kind:'Neptune’s frozen moon',color:'#bccac7',land:'#9d8996',sky:[15,22,38],haze:[40,51,70],terrain:['#b5b8c5','#858ba1','#4f586e'],companion:'neptune'},
  {name:'Pluto',kind:'Dwarf planet · Kuiper Belt',color:'#cbb6a1',land:'#997b69',sky:[18,21,36],haze:[43,49,65],terrain:['#b4a496','#817f86','#4e5261']},
  {name:'Eris',kind:'Distant icy dwarf planet',color:'#e4e4dc',land:'#b0b3bd',sky:[11,14,27],haze:[28,33,47],terrain:['#c2c5cf','#8c92a5','#4b5268']},
];
export const TAU_CETI = {name:'Tau Ceti',kind:'Another star. Journey complete.',color:'#ffe4a0',land:'#ffc668',star:true};
export const worldFor = run => WORLDS[Math.max(0,Math.min(WORLDS.length-1,Math.floor(run?.difficulty||0)))];
export const destinationFor = run => WORLDS[(run?.difficulty||0)+1] || TAU_CETI;
export function worldMarkup(world, extraClass='') {
  return `<span class="world-orb ${world.star?'world-star':''} ${extraClass}" style="--world-color:${world.color};--world-land:${world.land}" aria-hidden="true"></span>`;
}
export function worldRoute(profile, selected) {
  return WORLDS.map((world,index)=>{
    const cleared=index<profile.maxDifficulty || (index===8&&profile.campaignComplete);
    const locked=index>profile.maxDifficulty;
    return `<button type="button" class="world-stop" data-world="${index}" data-step="${index+1}" aria-label="${world.name}, world ${index+1} of 9${locked?', locked':cleared?', cleared':''}" aria-pressed="${index===selected}" ${locked?'disabled':''} title="${world.name}${locked?' · locked':''}">${worldMarkup(world)}${cleared?'<b class="world-check" aria-hidden="true">✓</b>':''}<span class="world-stop-number">${world.name}</span></button>`;
  }).join('');
}

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
// Flight forces and departure targets are tuned for play, not an SI/orbital model.
// Versioned profiles keep already-started expeditions on their original rules.
export const CONDITIONS_VERSION = 3;
const EARTH = {gravity:.5,drag:1,label:'Air drag',brief:'Air resistance matters. Try a streamlined nose.',tip:'Streamlined noses cut air resistance. Balance fuel with engine power.',checkpoints:[2500,10000,25000,55000,100000,160000],grant:0,stockTier:2};
const MOON = {gravity:.35,drag:0,label:'Low gravity · no air drag',brief:'No air drag. Spend on fuel and keep the rocket light.',tip:'Fuel and low weight matter. Nose drag has no effect here.',checkpoints:[6000,20000,60000,150000,300000,600000],grant:100,stockTier:4};
const CONDITIONS_V2 = [
  EARTH, MOON,
  {gravity:.42,drag:.1,label:'Thin air · long coasts',brief:'Thin air lets boosts last. Try extra fuel or boosters.',tip:'Air drag is much weaker than on Earth. Fuel and staged boosts carry you farther; compare their extra weight.',checkpoints:[6000,25000,70000,160000,300000,500000],grant:220,stockTier:6},
  {gravity:.25,drag:0,label:'Very low gravity · near vacuum',brief:'A lighter rocket goes a long way in this weak gravity.',tip:'This is a shorter stop in near vacuum. Keep weight low; aerodynamic fairings give no drag benefit.',checkpoints:[15000,60000,180000,360000,650000,900000],grant:320,stockTier:6},
  {gravity:.33,drag:0,label:'Low gravity · near vacuum',brief:'A longer vacuum climb. Try fuel and staged boosts.',tip:'There is negligible air drag. Larger tanks and boosters can extend your coast; compare their weight.',checkpoints:[20000,90000,350000,750000,1300000,2000000],grant:420,stockTier:6},
  {gravity:.32,drag:2.4,label:'Thick air · strong drag',brief:'Thick air slows you down. Streamline before adding power.',tip:'Air resistance is strong. A streamlined nose and a longer burn often beat a short burst of extra power.',checkpoints:[5000,15000,35000,65000,100000,150000],grant:520,stockTier:6},
  {gravity:.30,drag:0,label:'Very thin air · long coasts',brief:'Back to near vacuum. Trade the heavy fairing for fuel.',tip:'Air drag is negligible in this simplified model. Reconsider heavy aerodynamic parts and extend your fuel supply.',checkpoints:[30000,120000,450000,950000,1600000,2300000],grant:620,stockTier:6},
  {gravity:.28,drag:0,label:'Weak gravity · long climb',brief:'A long climb needs fuel. Balance a bigger tank and engine.',tip:'Air drag is negligible in this simplified model. A large tank needs enough engine power; staged boosts offer another route.',checkpoints:[40000,160000,500000,1050000,1800000,2600000],grant:720,stockTier:6},
  {gravity:.30,drag:0,label:'Near vacuum · final launch',brief:'Your final launch: combine fuel, power and useful staging.',tip:'This last departure needs a developed build. Combine fuel capacity, engine power and staging; compare before fitting.',checkpoints:[50000,200000,550000,1100000,1900000,2800000],grant:820,stockTier:6},
];
// The previous table remains immutable for runs already in progress.
// New journeys limit first-launch purchasing power and leave room for earned refits.
const BALANCED_LADDERS = [
  [2500,10000,25000,55000,100000,160000],
  [6000,50000,200000,600000,1200000,2000000],
  [6000,35000,110000,250000,450000,750000],
  [15000,150000,550000,1200000,2100000,3000000],
  [20000,150000,550000,1100000,1800000,2500000],
  [5000,15000,35000,65000,100000,150000],
  [30000,180000,650000,1300000,2100000,2800000],
  [40000,200000,700000,1400000,2200000,3000000],
  [50000,200000,650000,1300000,2100000,2800000],
];
const STARTING_GRANTS = [0,0,100,100,140,220,180,200,220];
const CONDITIONS = CONDITIONS_V2.map((conditions,index)=>({...conditions,checkpoints:BALANCED_LADDERS[index],grant:STARTING_GRANTS[index]}));
CONDITIONS[3].tip='Weak gravity allows long coasts. Keep weight low, then develop fuel capacity and staging for the departure climb.';
export function flightConditions(world,version=CONDITIONS_VERSION) {
  if(!Number.isInteger(world)||world<0||world>=CONDITIONS.length)return {...EARTH,label:'',brief:'',tip:'',grant:0};
  if(version===0)return {...EARTH,label:'Original flight conditions',brief:'This saved expedition keeps its original flight conditions.',tip:'This saved expedition keeps its original flight conditions.',grant:0};
  if(version===1)return world===1?{...MOON,grant:0}:world===0?EARTH:{...EARTH,label:'Original flight conditions',brief:'This saved expedition keeps its original flight conditions.',tip:'This saved expedition keeps its original flight conditions.',grant:0};
  return (version===2?CONDITIONS_V2:CONDITIONS)[world];
}
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

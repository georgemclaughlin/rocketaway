// Permanent expedition research. No DOM, storage, or dependency on the game loop.
export const RESEARCH_COSTS = [3,5,8,12,18];
export const RESEARCH_TRACKS = [
 {id:'scrapper',name:'Scrapper',theme:'Lightweight engineering',unlock:0,benefit:rank=>`${rank*3}% less dry weight · +${rank*10} starting credits`,
  parts:[{rank:2,id:'ember',name:'Ember engine'},{rank:4,id:'dart',name:'Dart engine'},{rank:5,id:'needle',name:'Needle fairing'}]},
 {id:'stager',name:'Stagehand',theme:'Staged propulsion',unlock:3,benefit:rank=>`${rank*6}% stronger boosters`,
  parts:[{rank:2,id:'long',name:'Long tank'},{rank:3,id:'ember',name:'Ember engine'},{rank:4,id:'solids',name:'Solid boosters'},{rank:5,id:'composite',name:'Composite tank'}]},
 {id:'scientist',name:'Scientist',theme:'Long-range science',unlock:6,benefit:rank=>`${rank*3}% longer burn · ${rank*5}% more altitude credits`,
  parts:[{rank:2,id:'long',name:'Long tank'},{rank:4,id:'composite',name:'Composite tank'},{rank:5,id:'dart',name:'Dart engine'}]},
];
const int=(value,max=1e7)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
export const newResearch=()=>({data:0,levels:{scrapper:0,stager:0,scientist:0}});
export function restoreResearch(raw,profile={}) {
 const research=newResearch();
 if(!raw || typeof raw!=='object') {
  // One-time credit for progress earned before research existed; saved on next persist.
  research.data=int(int(profile.totalGates)*2+int(profile.wins)*4);
  return research;
 }
 research.data=int(raw.data);
 for(const track of RESEARCH_TRACKS)research.levels[track.id]=int(raw.levels?.[track.id],5);
 return research;
}
export const researchRank=(profile,id)=>int(profile.research?.levels?.[id],5);
export const researchCost=(profile,id)=>RESEARCH_COSTS[researchRank(profile,id)]??null;
export function researchLoadout(profile,kit) {
 const rank=researchRank(profile,kit.id),track=RESEARCH_TRACKS.find(t=>t.id===kit.id);
 return {rank,credits:kit.credits+(kit.id==='scrapper'?rank*10:0),parts:[...kit.parts,...(track?.parts||[]).filter(p=>p.rank<=rank).map(p=>p.id)]};
}
export function syncResearch(session) {
 if(!session.active)return;
 session.active.program.research={kit:session.active.kit,rank:researchRank(session.profile,session.active.kit)};
}
export function buyResearch(session,id) {
 const track=RESEARCH_TRACKS.find(t=>t.id===id),cost=researchCost(session.profile,id);
 if(!track || session.mode!=='expedition' || session.profile.totalGates<track.unlock || cost===null || !session.profile.research || session.profile.research.data<cost)return false;
 if(session.active && !['build','won','lost'].includes(session.active.status))return false;
 session.profile.research.data-=cost;
 session.profile.research.levels[id]++;
 syncResearch(session);
 return true;
}
export function researchModifiers(program) {
 const rank=int(program.research?.rank,5),kit=program.research?.kit;
 return {dry:kit==='scrapper'?1-rank*.03:1,kick:kit==='stager'?1+rank*.06:1,burn:kit==='scientist'?1+rank*.03:1,pay:kit==='scientist'?1+rank*.05:1};
}
export function awardResearch(session,cleared,firstWorld) {
 const data=1+cleared*2+(firstWorld?4:0);
 session.profile.research??=newResearch();
 session.profile.research.data+=data;
 return data;
}

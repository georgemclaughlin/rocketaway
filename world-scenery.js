// Stylized scenery, not a scientific terrain model. Coordinates scale to the viewport.
export function drawTerrain(ctx,world,width,height,groundY) {
  const colors=world.terrain;
  for(let layer=0;layer<2;layer++) {
    ctx.fillStyle=colors[layer];ctx.beginPath();
    const base=groundY-(layer===0?75:20),rise=layer===0?65:30;
    ctx.moveTo(0,base);
    if(world.name==='Mars') {
      for(const [x,y] of [[.07,0],[.15,-.8],[.3,-.8],[.34,-.25],[.51,-.25],[.59,-1],[.73,-1],[.8,-.1],[1,-.3]])ctx.lineTo(x*width,base+y*rise);
    } else if(['Europa','Triton','Eris'].includes(world.name)) {
      const relief=world.name==='Europa'?.28:world.name==='Triton'?.55:.7;
      for(const [x,y] of [[0,.1],[.11,.35],[.24,.2],[.37,.85],[.43,.65],[.57,.1],[.72,.5],[.81,.3],[.91,.65],[1,.4]])ctx.lineTo(width*x,base-y*rise*relief);
    } else if(world.name==='Ceres') {
      for(let i=0;i<=10;i++)ctx.lineTo(width*i/10,base-Math.abs(Math.sin(i*1.7+layer))*rise*.65);
    } else {
      const dune=world.name==='Titan'?1.35:1;
      ctx.bezierCurveTo(width*.17,base-rise*dune,width*.3,base+rise*.3,width*.45,base-rise*.45);
      ctx.bezierCurveTo(width*.7,base-rise*dune,width*.8,base+rise*.2,width,base-rise*.65);
    }
    ctx.lineTo(width,height+220);ctx.lineTo(0,height+220);ctx.fill();
  }
  ctx.fillStyle=colors[2];ctx.fillRect(0,groundY,width,height+220);
  if(world.name==='Moon'||world.name==='Ceres') {
    for(const [x,y,r] of [[.31,8,19],[.74,22,28],[.93,3,12]]) {
      ctx.strokeStyle=colors[0];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(width*x,groundY+y,r,r*.22,0,0,Math.PI*2);ctx.stroke();
    }
  }
  if(['Europa','Triton','Pluto','Eris'].includes(world.name)) {
    ctx.strokeStyle=world.name==='Europa'?'#bd907a':'#c5d8de88';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(0,groundY+10);ctx.lineTo(width*.25,groundY+21);ctx.lineTo(width*.31,groundY+8);ctx.lineTo(width*.42,groundY+30);ctx.moveTo(width*.7,groundY+6);ctx.lineTo(width*.8,groundY+28);ctx.lineTo(width,groundY+34);ctx.stroke();
  }
}

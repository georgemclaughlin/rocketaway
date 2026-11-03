// Educational data is separate from arcade physics. Heights are approximate metres.
export const EARTH_LAYERS = [
  {name:'Troposphere',bottom:0,top:12000,fact:'Most weather happens here, in the lowest layer of our atmosphere.'},
  {name:'Stratosphere',bottom:12000,top:50000,fact:'The ozone layer absorbs much of the Sun’s harmful ultraviolet radiation.'},
  {name:'Mesosphere',bottom:50000,top:80000,fact:'Many incoming meteors burn up in this layer.'},
  {name:'Thermosphere',bottom:80000,top:700000,fact:'Very thin gas absorbs energetic sunlight. High temperature does not mean it would feel hot.'},
  {name:'Exosphere',bottom:700000,top:10000000,fact:'The outermost region gradually merges with space; it has no sharp edge.'},
];
export const SCIENCE_WORLDS = [
  {name:'Earth',label:'Layered atmosphere',fact:'Earth’s atmosphere thins gradually. Space does not begin at a sudden wall of air.',gravity:9.80,source:'https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/'},
  {name:'Moon',label:'Near vacuum',fact:'The Moon has an extremely sparse exosphere. Its surface gravity is about one-sixth of Earth’s.',gravity:1.62,source:'https://science.nasa.gov/moon/facts/'},
  {name:'Mars',label:'Thin atmosphere',gravity:3.73,gravitySource:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',fact:'Mars has a thin atmosphere, mostly carbon dioxide. Suspended dust gives its sky a reddish haze.',source:'https://science.nasa.gov/mars/facts/'},
  {name:'Ceres',label:'Very thin atmosphere',fact:'Scientists have found evidence of water vapor around Ceres, possibly from ice turning directly into gas.',source:'https://science.nasa.gov/dwarf-planets/ceres/facts/'},
  {name:'Europa',label:'Trace oxygen',fact:'Europa has an extremely thin oxygen atmosphere. It is far too sparse to breathe.',source:'https://europa.nasa.gov/resources/193/deep-dive-on-jupiters-moon-europa-infographic/'},
  {name:'Titan',label:'Thick atmosphere',fact:'Titan’s thick atmosphere is mostly nitrogen. Its clouds can rain methane, which fills lakes and seas. Surface air pressure is about 60% higher than Earth’s.',source:'https://science.nasa.gov/saturn/moons/titan/facts/'},
  {name:'Triton',label:'Thin atmosphere',fact:'Triton’s thin atmosphere is mostly nitrogen, with small amounts of methane.',source:'https://science.nasa.gov/neptune/moons/triton/'},
  {name:'Pluto',label:'Thin atmosphere',fact:'Pluto’s thin atmosphere contains nitrogen, methane and carbon monoxide. Surface ice can turn directly into gas.',source:'https://science.nasa.gov/dwarf-planets/pluto/facts/'},
  {name:'Eris',label:'Deep cold',fact:'Eris is a distant dwarf planet. Its estimated surface temperature is roughly −243°C to −217°C.',source:'https://science.nasa.gov/dwarf-planets/eris/'},
  {name:'Tau Ceti',label:'Another star',fact:'Tau Ceti is a real star about 11.9 light-years from Earth. A light-year measures distance: how far light travels in a year.',source:'https://science.nasa.gov/exoplanets/target-star-catalog/'},
];
export function earthLayerAt(altitude) {
  return EARTH_LAYERS.find(layer=>Math.max(0,altitude)<layer.top) || null;
}
export function environmentLabel(world,altitude) {
  return world===0 ? earthLayerAt(altitude)?.name || 'Beyond exosphere' : (SCIENCE_WORLDS[world]||SCIENCE_WORLDS[0]).label;
}
export const GRAVITY_SOURCE='https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html';

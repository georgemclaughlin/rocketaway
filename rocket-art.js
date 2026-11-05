let serial = 0;

// The same physical stack is used by the hangar, starting kits, and travel.
export function rocketArt(parts, selected, preview = false, changes = []) {
  const uid = `rocket-${serial++}`, h = 57 + parts.tank.height * .62, top = 166 - h;
  const paint = parts.aero.id === 'ceramic' ? '#83cfca' : parts.aero.ability === 'feather' ? '#8ce4bc' : '#f5a16d';
  const outline = slot => `data-build-slot="${slot}" class="rocket-section${changes.includes(parts[slot].id) ? ' planned-section' : ''}" stroke="${preview && changes.includes(parts[slot].id) ? '#96f1cc' : selected === slot ? '#ffd48a' : '#49687b'}" stroke-width="${selected === slot ? 1.8 : .8}"`;
  const cone = parts.aero.shape === 'capsule'
    ? `<path d="M77 ${top}l5-25q18-19 36 0l5 25z" fill="url(#${uid}-body)"/><circle cx="100" cy="${top-15}" r="11" fill="#122c43"/><circle cx="97" cy="${top-18}" r="5" fill="#80d9de"/><path d="M81 ${top-3}h38" stroke="${paint}" stroke-width="5"/>`
    : `<path d="M82 ${top}Q82 ${top-17} 100 ${top-(parts.aero.shape==='round'?31:43)}Q118 ${top-17} 118 ${top}Z" fill="${paint}"/><path d="M88 ${top-5}Q88 ${top-18} 100 ${top-29}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="3"/>`;
  const bell = (x, w, bottom) => `<path d="M${x-w*.65} 178h${w*1.3}l${w*.35} ${bottom-178}h${-w*2}z" fill="url(#${uid}-metal)"/><path d="M${x-w} ${bottom}h${w*2}" stroke="#f6b06b" stroke-width="3"/>`;
  const boosters = parts.boosters.kick ? [-1,1].map(side => {
    const x = 100 + side*34, bh = 35+parts.boosters.kick*7;
    return `<path d="M100 143h${side*34}M100 170h${side*34}" stroke="#a0b9c7" stroke-width="4"/><path d="M${x-9} 181v${-bh}q9-23 18 0v${bh}z" fill="url(#${uid}-body)"/><path d="M${x-9} ${181-bh+8}h18M${x-9} 170h18" stroke="${parts.boosters.ability==='recovery'?'#88ddb1':paint}" stroke-width="6"/><path d="M${x-7} 181l-3 9h20l-3-9" fill="url(#${uid}-metal)"/>`;
  }).join('') : '';
  const markings = parts.tank.ability === 'drop'
    ? `<rect x="79" y="${top+h*.55}" width="42" height="20" rx="3" fill="#548f87"/><path d="M83 ${top+h*.55+6}h34M83 ${top+h*.55+14}h34" stroke="#b1f1cf" stroke-width="2"/>`
    : parts.tank.ability === 'reserve' ? `<rect x="78" y="${top+12}" width="44" height="15" rx="4" fill="#526f93"/><path d="M85 ${top+19}h30" stroke="#b1d8ed" stroke-width="3"/>` : '';
  const ceiling = Math.min(top - (parts.aero.shape === 'pointed' ? 48 : 39), parts.boosters.kick ? 153-parts.boosters.kick*7 : 220);
  return `<svg viewBox="35 ${ceiling} 130 ${220-ceiling}" aria-hidden="true"><defs><linearGradient id="${uid}-body"><stop stop-color="#91aab5"/><stop offset=".25" stop-color="#f5f2df"/><stop offset=".55" stop-color="#fffcef"/><stop offset="1" stop-color="#93aeba"/></linearGradient><linearGradient id="${uid}-metal"><stop stop-color="#253d53"/><stop offset=".4" stop-color="#b5c8cf"/><stop offset=".6" stop-color="#6a8799"/><stop offset="1" stop-color="#1d344b"/></linearGradient></defs>
    <ellipse cx="100" cy="212" rx="47" ry="5" fill="#061320" opacity=".6"/>
    <g ${outline('boosters')}>${boosters}</g>
    <g ${outline('engine')}><path d="M83 151l-20 43 20-9h34l20 9-20-43" fill="${paint}"/><rect x="82" y="166" width="36" height="14" rx="3" fill="url(#${uid}-metal)"/>${parts.engine.shape==='cluster' ? bell(85,9,198)+bell(115,9,198)+bell(100,9,204) : bell(100,parts.engine.id==='spark'?13:20,parts.engine.shape==='long'?207:198)}${parts.engine.ability ? `<path d="M86 181h28M84 186h32M82 191h36" stroke="${parts.engine.ability==='momentum'?'#f4ac68':'#86e7c5'}" stroke-width="3"/>` : ''}</g>
    <g ${outline('tank')}><rect x="82" y="${top}" width="36" height="${h+4}" rx="4" fill="url(#${uid}-body)"/><path d="M83 ${top+5}h34M83 160h34" stroke="${parts.tank.id==='composite'?'#5d968e':paint}" stroke-width="5"/><path d="M88 ${top+13}v${h-24}" stroke="#fff" stroke-width="2" opacity=".6"/><rect x="93" y="${top+19}" width="14" height="24" rx="3" fill="#17374e"/><path d="M97 ${top+24}h6M97 ${top+30}h6M97 ${top+36}h6" stroke="#9ee9d8" stroke-width="2"/>${markings}<path d="M94 149h12" stroke="#38576b" stroke-width="3"/></g>
    <g ${outline('aero')}>${cone}${parts.aero.ability==='feather'?`<path d="M91 ${top-5}l9-25 9 25" fill="none" stroke="#e3ffed" stroke-width="2"/>`:''}</g>
  </svg>`;
}

// Decorative scenery only. Flight motion is driven by presentation time in the UI.
export const workshopScene = `<svg class="scenery" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
 <linearGradient id="ws-sky" x2="0" y2="1"><stop stop-color="#204a60"/><stop offset=".55" stop-color="#639b9c"/><stop offset="1" stop-color="#f2c897"/></linearGradient>
 <linearGradient id="ws-ridge" x2="0" y2="1"><stop stop-color="#3c7378"/><stop offset="1" stop-color="#244c58"/></linearGradient>
 <linearGradient id="ws-pad" x2="0" y2="1"><stop stop-color="#8da5a0"/><stop offset="1" stop-color="#344f59"/></linearGradient>
 <pattern id="ws-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#f9eccb" stroke-opacity=".07"/></pattern>
 <pattern id="ws-hazard" width="22" height="20" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)"><rect width="11" height="20" fill="#edb86c"/><rect x="11" width="11" height="20" fill="#354c50"/></pattern>
</defs>
<rect width="800" height="600" fill="url(#ws-sky)" class="earth-sky"/>
<rect width="800" height="600" fill="#152d48" class="moon-sky"/>
<rect width="800" height="600" fill="url(#ws-grid)"/>
<g fill="#fff4cb" opacity=".7"><circle cx="70" cy="75" r="2"/><circle cx="290" cy="44" r="1.4"/><circle cx="530" cy="110" r="1.6"/><circle cx="725" cy="38" r="2"/><circle cx="650" cy="186" r="1.3"/><circle cx="328" cy="173" r="1"/><path d="M180 140v10m-5-5h10M580 55v12m-6-6h12" stroke="#fff4cb"/></g>
<g class="destination earth-destination"><circle cx="650" cy="110" r="48" fill="#f9e3b5"/><circle cx="632" cy="96" r="9" fill="#dbcaa5"/><circle cx="664" cy="126" r="13" fill="#e2cfa8"/><circle cx="650" cy="110" r="60" fill="none" stroke="#fff0cd" stroke-opacity=".2" stroke-dasharray="3 8"/></g>
<g class="lunar-earth"><circle cx="650" cy="110" r="48" fill="#78b8ca"/><path d="M618 76l22-10 16 8-10 16 21 14-9 15-18-7-12 21-17-10-9-20zM663 128l25-7 8 20-24 14-12-12z" fill="#b8cba2"/><path d="M615 86q28-15 61 0m-56 50q24 13 52 1" fill="none" stroke="#eff0db" stroke-width="5" opacity=".6"/></g>
<g class="clouds" fill="#ffe8c5" opacity=".25"><path d="M-40 250h230c0-28-28-38-51-27-15-40-74-36-87-6-37-13-61 6-66 17z"/><path d="M500 295h340c-5-25-31-37-58-27-15-47-85-54-110-13-35-22-66-12-76 13-45-9-64 2-66 15z"/></g>
<g class="terrain">
 <path d="M0 420l95-65 76 30 102-108 97 128 108-42 68 28 122-92 132 119v182H0z" fill="#80a7a1"/>
 <path d="M0 468l124-62 95 33 153-73 103 87 121-54 204 58v143H0z" fill="url(#ws-ridge)"/>
 <path d="M0 519q200-55 400-13t400-2v96H0z" fill="#244650"/>
 <path d="M0 555q180-30 360 0t440-9v54H0z" fill="#18343d"/>
 <g class="gantry" fill="none" stroke="#24434b" stroke-width="7"><path d="M179 509V211h52v298M179 216l52 46-52 46 52 46-52 46 52 46-52 46M180 213h150v15H230M180 300h93M180 385h85"/><path d="M188 210v-30h32v30" stroke-width="4"/><path d="M204 180v-23" stroke="#e5a46d" stroke-width="3"/></g>
 <ellipse cx="470" cy="541" rx="167" ry="26" fill="#0d2932" opacity=".7"/>
 <path d="M309 510h322l34 28H278z" fill="url(#ws-pad)"/><path d="M278 538h387v14H278z" fill="url(#ws-hazard)"/>
 <path d="M340 514h255M329 523h277" stroke="#b9c6b3" stroke-opacity=".5" stroke-width="2"/>
 <g fill="#efc477"><rect x="293" y="526" width="7" height="7" rx="2"/><rect x="642" y="526" width="7" height="7" rx="2"/></g>
 <g transform="translate(74 477)"><rect width="75" height="48" rx="4" fill="#d0ba90"/><path d="M-4 0l8-12h66l9 12" fill="#314f56"/><rect x="10" y="10" width="25" height="15" rx="2" fill="#345b63"/><rect x="46" y="9" width="18" height="39" fill="#415e60"/><path d="M20-12v-35m0 0l20 12" stroke="#d8c6a3" stroke-width="3"/><circle cx="20" cy="-47" r="4" fill="#f0b570"/></g>
</g>
</svg>`;

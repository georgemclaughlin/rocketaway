// Ratings use the displayed power, so the label and rounded percentage agree.
export function launchRating(quality) {
 const power=Math.round(quality*100);
 const tier=power>=118?'perfect':power>=110?'great':power>=100?'good':'off';
 const label={perfect:'Perfect',great:'Great',good:'Good',off:'Off target'}[tier];
 return {power,tier,label};
}

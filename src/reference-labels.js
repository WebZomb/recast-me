export function referenceDirections(raw,count,subjectCount=''){
  if(!raw)return '';
  let labels;try{labels=JSON.parse(raw)}catch{throw new Error('Choose who appears in each photo.')}
  if(!Array.isArray(labels)||labels.length!==count||labels.some(x=>typeof x!=='string'||!(/^(pet|car|together|person[1-8])$/).test(x)))throw new Error('Choose a valid subject label for every photo.');
  const describe=label=>label==='together'?'all requested subjects together':label==='pet'?'the same pet':label==='car'?'the same vehicle':`person ${label.slice(6)}`;
  const exact=/^[2-8]$/.test(String(subjectCount))?`Include exactly ${subjectCount} people. `:'';
  return exact+labels.map((label,i)=>`Input image ${i} (photo ${i+1}) shows ${describe(label)}.`).join(' ')+' Repeated labels refer to the same individual, not extra subjects. Preserve each referenced face, exact pet markings, muzzle, ears, leg length and natural body proportions. Keep separate bodies and limbs clearly readable; do not overlap a pet with a person’s legs. Change the outfit and world, not identity.';
}

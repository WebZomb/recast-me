const rect=(x,y,w,h,r=0)=>({quad:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],radius:r});
module.exports={
 canvas:{base:'shop-assets/sales/golden-village-canvas-20261109.webp',faces:[{quad:[[137,40],[156,34],[155,676],[138,675]],uvRect:[0,0,.028,1],shade:.68},{quad:[[156,34],[786,50],[786,660],[155,676]]}]},
 pillows:{base:'shop-assets/sales/golden-village-pillow-20261109.webp',faces:[{shape:'pillow',bounds:[90,86,853,752],fabric:true}]},
 blankets:{base:'assets/christmas-blanket-20261101.webp',faces:[{shape:'blanket',bounds:[0,77,900,858],fabric:true,coverRatio:1.12}]},
 tumblers:{base:'assets/christmas-tumbler-20261101.webp',faces:[{shape:'tumbler',bounds:[246,117,653,853],coverRatio:.55,cylinder:true}]},
 hoodies:{base:'assets/christmas-hoodie-20261101.webp',clean:[{rect:[228,227,442,302],sample:[329,576,224,142],feather:18}],faces:[{...rect(274,221,356,316),coverRatio:1.125,fade:.04,fabric:true}],restore:[[[404,164],[416,168],[415,205],[402,252],[390,292],[375,298],[374,288],[387,253],[398,207],[399,173]],[[485,166],[495,167],[498,210],[509,246],[520,284],[513,296],[505,279],[494,249],[483,209]]]},
 't-shirts':{base:'assets/christmas-tshirt-20261101.webp',clean:[{rect:[217,186,455,426],sample:[249,622,385,53],feather:22}],faces:[{...rect(231,199,431,400),coverRatio:1.078,fade:.045,fabric:true}]},
 'tote-bags':{base:'assets/christmas-tote-20261101.webp',faces:[{quad:[[176,264],[743,264],[755,827],[158,827]],fabric:true,holes:[[[302,264],[351,266],[344,320],[299,316]],[[568,265],[616,265],[621,319],[574,323]]]}]},
 'phone-cases':{base:'assets/christmas-case-20261101.webp',faces:[{...rect(245,34,411,804),radii:[.13,.065],coverRatio:.515,roundHoles:[{x:248,y:44,w:200,h:197,r:49}]}]},
 'framed-prints':{base:'assets/christmas-frame-20261101.webp',faces:[{quad:[[202,101],[729,101],[730,711],[198,707]],coverRatio:.875}]},
 posters:{base:'assets/christmas-poster-20261101.webp',faces:[{...rect(176,26,548,777),coverRatio:.705}]},
 journals:{base:'assets/christmas-journal-20261101.webp',faces:[{quad:[[137,97],[632,53],[791,716],[200,779]],radius:.045,coverRatio:.78}]},
 puzzles:{base:'assets/christmas-puzzle-20261101.webp',clean:[{rect:[500,682,395,218],sample:[272,742,224,66],feather:26,exclude:[[39,111],[805,53],[891,660],[42,723]]}],faces:[{quad:[[39,111],[805,53],[891,660],[42,723]],radius:.008,fitArtwork:1.32,puzzle:true}]}
};

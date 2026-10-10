// Single source of truth: visible adventure copy + both generators' scene/wardrobe directions.
// All 48 adventure IDs are covered; 'custom' remains customer-provided.
// Descriptions are safe public assets: no credentials, provider keys or private photos.
export const ADVENTURE_GUIDES = Object.freeze({
  "game": {
    "scene": "on a cinematic futuristic rooftop above a vast original neon city at sunset, with hovering transit and dramatic skyline depth",
    "pet": "a fitted adventure vest and utility-style collar, paws and face visible",
    "person": "an original adventure jacket with understated explorer gear",
    "look": "cinematic semi-real photography with atmospheric sunset and dramatic rim light",
    "teaser": "An adventure vest or hero jacket on a neon-city rooftop at sunset."
  },
  "halloween": {
    "scene": "in a moonlit pumpkin garden beside an old lantern-lit manor, carved jack-o-lanterns and gentle fog",
    "pet": "a burgundy vampire cape or playful witch-themed scarf tailored for a real animal",
    "person": "a playful, tasteful original Halloween cloak with themed details",
    "look": "photographic magical autumn twilight, amber lanterns against blue moonlight",
    "teaser": "A playful costume in a moonlit pumpkin garden with glowing lanterns."
  },
  "retro": {
    "scene": "on a neon-lit 1980s boardwalk with an original vintage convertible, arcade signs, palm silhouettes and a sunset",
    "pet": "a colorful retro satin bomber-style pet vest and striped bandana",
    "person": "a period windbreaker, high-waist jeans and bold retro sunglasses",
    "look": "authentic analog 1980s film color, gentle grain and magenta-blue neon",
    "teaser": "1980s arcade lights, retro outfits and a neon sunset by the boardwalk."
  },
  "fantasy": {
    "scene": "on a mossy stone bridge leading into a misty mountain kingdom with castle towers and an ancient enchanted forest",
    "pet": "a lightweight leather-and-cloth fantasy harness or ornate cape, face unobstructed",
    "person": "original nonviolent adventurer armor, boots and woven cloak",
    "look": "cinematic epic fantasy realism with glowing runes and warm shafted sunlight",
    "teaser": "Fantasy armor and fitted pet capes among ancient castles and enchanted forests."
  },
  "royal": {
    "scene": "inside an ornate European palace courtyard with grand arches, carved stone, fountains and warm golden light",
    "pet": "an embroidered velvet blue royal cape and a small tasteful crown placed without covering the ears",
    "person": "rich velvet ceremonial attire, subtle jeweled accessories and refined regal posture",
    "look": "photoreal elegant editorial portraiture, warm palace architecture",
    "teaser": "Regal capes and crowns in a grand palace courtyard."
  },
  "future": {
    "scene": "on an elevated walkway in a rain-glossed futuristic metropolis with luminous towers, sky traffic and blue-violet reflections",
    "pet": "a tailored futuristic pet harness with subtle glowing trim",
    "person": "a sleek original sci-fi coat or fitted technology jacket",
    "look": "photoreal cinematic science-fiction city lighting, realistic wet reflections",
    "teaser": "Sleek futuristic outfits in a luminous rain-soaked city."
  },
  "comic": {
    "scene": "on the rooftops of an entirely original illustrated metropolis with dynamic perspective and inked clouds",
    "pet": "a fitted original hero pet cape or chest harness, no brand emblem",
    "person": "a unique unbranded graphic-novel hero suit and dramatic but safe stance",
    "look": "premium ORIGINAL graphic-novel illustration, clean ink linework, subtle halftone shading",
    "teaser": "Original comic-book heroes on illustrated city rooftops; never copied characters."
  },
  "space": {
    "scene": "on a lunar observation terrace beside an original spacecraft, with a large blue planet above the horizon",
    "pet": "a lightweight pet-safe space harness with an open, unobstructed face",
    "person": "an original realistic astronaut exploration suit and clear visor",
    "look": "cinematic photoreal space exploration with crisp silver rim lighting",
    "teaser": "Astronaut gear on a moonlit spacecraft terrace beneath distant planets."
  },
  "animated-sitcom": {
    "scene": "in a bright original suburban animated living room with a colorful couch, window and playful everyday props",
    "pet": "a simple bright cartoon sweater fitted to the dog's actual body",
    "person": "an original everyday cartoon outfit with graphic color blocks",
    "look": "original clean 2D prime-time TV animation, flat cel color and simple expressive line art",
    "teaser": "Become a recognizable original 2D animated character in a colorful living room."
  },
  "cutout-comedy": {
    "scene": "in a handcrafted cut-paper mountain town made from layered colored paper, paper pine trees and tiny cutout houses",
    "pet": "a clearly layered paper-cut scarf or jacket over the same animal shape",
    "person": "layered cut-paper winter clothes with visible paper edges",
    "look": "deliberately flat ORIGINAL handmade paper-cut illustration with tactile paper edges",
    "teaser": "Handmade layered-paper characters inside a colorful cutout town."
  },
  "anime": {
    "scene": "on a hand-painted cherry-blossom city street at golden hour with a distant fantasy train and atmospheric sky",
    "pet": "a fitted anime-adventure scarf and soft explorer jacket that retain the dog's true markings",
    "person": "an original anime-adventure coat with a distinctive silhouette",
    "look": "original detailed cinematic anime illustration, painterly background, tasteful ink outlines",
    "teaser": "Original anime adventurers on a painted cherry-blossom street."
  },
  "storybook": {
    "scene": "in a glowing illustrated flower meadow with an ivy-covered cottage, winding path and whimsical trees",
    "pet": "a soft blue storybook hooded cloak or knitted scarf fitted around the real body",
    "person": "gentle original illustrated traveling clothes and soft textures",
    "look": "warm watercolor-and-gouache children's-storybook illustration with delicate brush marks",
    "teaser": "Painterly storybook outfits among flower meadows and enchanted cottages."
  },
  "football": {
    "scene": "on the turf of a floodlit American football stadium with goalposts and filled stands",
    "pet": "a fitted unbranded sports jersey and simple team-color bandana, all four paws grounded",
    "person": "an original jersey, football trousers and shoulder-pad silhouette without trademarks",
    "look": "photoreal night sports editorial, strong arena lights and green turf",
    "teaser": "An unbranded football uniform in a dramatic floodlit stadium."
  },
  "basketball": {
    "scene": "at center court of a large indoor basketball arena with polished hardwood, hoops and cheering spectators",
    "pet": "a fitted sleeveless original-color pet jersey with a basketball beside the paws, never held in human hands",
    "person": "an original sleeveless basketball uniform and court shoes",
    "look": "photoreal indoor sports editorial with spotlight and reflective court",
    "teaser": "A customized basketball jersey on a polished arena court."
  },
  "baseball": {
    "scene": "on the dirt infield of a classic baseball diamond with baselines, outfield grass, grandstands and stadium lights",
    "pet": "a properly fitted unbranded baseball jersey with contrasting piping and a cap nearby, ears clear",
    "person": "an original button-front baseball jersey, trousers and plain cap",
    "look": "photoreal ballpark sports photography; sharp grass and warm stadium light",
    "teaser": "An original baseball jersey on the ballpark infield, not the original backyard."
  },
  "soccer": {
    "scene": "on a lush football pitch inside a modern stadium with goal nets, field markings and colorful stands",
    "pet": "a fitted original soccer jersey with simple collar and a ball beside the paws",
    "person": "an original club-free soccer shirt, shorts and boots",
    "look": "photoreal daylight stadium sports photography with natural shadow",
    "teaser": "An original soccer kit on a grass pitch inside a lively stadium."
  },
  "seventies": {
    "scene": "in a vintage 1970s lounge with geometric wallpaper, warm lamps, a velvet sofa and a record player",
    "pet": "a paisley neckerchief and warm earth-tone pet vest",
    "person": "period flared trousers, bold-collar shirt or patterned 1970s outfit",
    "look": "warm analog film grain, amber tones and vintage editorial photography",
    "teaser": "1970s clothes in a retro lounge with record players and warm amber light."
  },
  "nineties": {
    "scene": "outside a colorful 1990s arcade and skate shop with posters, brickwork and flash-lit street details",
    "pet": "a bright color-block windbreaker vest and sporty collar",
    "person": "oversized windbreaker, retro denim and original unbranded sneakers",
    "look": "authentic 1990s film snapshot with direct flash and saturated color",
    "teaser": "1990s windbreakers outside a colorful arcade and skate shop."
  },
  "y2k": {
    "scene": "inside an early-2000s chrome-and-pastel pop-video studio with glossy shapes and translucent props",
    "pet": "a metallic satin pet jacket with a playful glossy collar",
    "person": "an original shiny pop-era jacket with era-inspired accessories",
    "look": "early-2000s flash photography, chrome highlights and pastel color palette",
    "teaser": "Glossy Y2K pop styling in a chrome-and-pastel studio."
  },
  "space-opera": {
    "scene": "inside a vast original spacecraft hangar facing alien desert mountains and a glowing twin-sunset sky",
    "pet": "an ornate futuristic flight harness with dramatic but comfortable collar",
    "person": "an original long sci-fi flight coat with unbranded adventure detailing",
    "look": "original grand cinematic space-opera realism, atmospheric alien sunset",
    "teaser": "Space-opera flight costumes in an original starship hangar."
  },
  "wizard-academy": {
    "scene": "inside an enchanted stone academy library with spiral stairs, floating lanterns and tall shelves of magical books",
    "pet": "a fitted midnight-blue wizard cape with an embroidered collar and tiny hat that leaves ears visible",
    "person": "a richly textured original scholar robe with small embroidered motifs",
    "look": "warm fantasy library lighting and softly sparkling magic, photoreal textures",
    "teaser": "Wizard robes in a grand magical library with floating lanterns."
  },
  "dinosaur-adventure": {
    "scene": "on a prehistoric rainforest riverbank with tall ferns, giant cycads and distant peaceful dinosaurs",
    "pet": "a khaki expedition pet harness with explorer neckerchief",
    "person": "khaki expedition vest, sturdy boots and simple explorer hat",
    "look": "photoreal lush prehistoric adventure, misty sunlight, no danger or violence",
    "teaser": "Explorer outfits on a prehistoric riverbank with dinosaurs in the distance."
  },
  "spy-thriller": {
    "scene": "on a cinematic rain-slick high-rise rooftop overlooking an original city at night with illuminated windows",
    "pet": "a fitted black tuxedo-style pet harness with a discreet high-tech collar",
    "person": "an elegant dark tailored suit or coat and understated original spy gadgets",
    "look": "photoreal moody thriller, cool night reflections, high-contrast spot lighting",
    "teaser": "Secret-agent outfits on a dramatic rainy city rooftop."
  },
  "western": {
    "scene": "on a dusty wooden frontier-town main street with false-front buildings, hitching rails and mountains in the distance",
    "pet": "a rustic bandana and tiny weathered leather pet vest fitted naturally",
    "person": "denim frontier clothing, simple hat and original leather details",
    "look": "photoreal golden-hour western atmosphere with warm dust and long shadows",
    "teaser": "Frontier outfits on the dusty main street of an original western town."
  },
  "pirate": {
    "scene": "on the sunlit wooden deck of an original tall sailing ship with ropes, sails, turquoise water and distant islands",
    "pet": "a sea-captain bandana and fitted navy pet coat, ears and paws visible",
    "person": "an original naval-inspired pirate coat, sash and tricorn hat",
    "look": "photoreal cinematic ocean light, richly detailed sails and ship timber",
    "teaser": "Pirate coats and bandanas aboard a tall ship at sea."
  },
  "noir": {
    "scene": "on a rain-wet 1940s-inspired city street with art-deco buildings, vintage car and a glowing streetlamp",
    "pet": "a restrained dark trench-style pet cape or bow tie collar",
    "person": "a classic trench coat and brimmed fedora with no visible logos",
    "look": "dramatic photoreal BLACK-AND-WHITE film-noir contrast, hard shadows and wet reflections",
    "teaser": "Black-and-white detective portraits on a rainy 1940s street."
  },
  "christmas": {
    "scene": "at a snowy Christmas-market town square with decorated evergreen trees, wooden stalls, soft snowfall and glowing string lights",
    "pet": "a deep-red knitted holiday scarf with a subtle festive pet cape, face and paws visible",
    "person": "a cozy elegant winter coat, knit scarf and warm gloves",
    "look": "photoreal magical holiday evening, amber bokeh, blue snow shadows",
    "teaser": "Winter outfits in a snow-covered holiday village full of trees and lights."
  },
  "valentine": {
    "scene": "in a romantic rose garden beneath a soft floral arch, with pastel ribbons, falling petals and a sunset path",
    "pet": "a rose-colored velvet bow or heart-themed collar on the unchanged pet",
    "person": "refined rose-toned formal wear with modest floral accents",
    "look": "photoreal romantic editorial photography, blush pink light and warm sunset",
    "teaser": "Elegant rose-colored accessories under a flower-filled garden arch."
  },
  "birthday": {
    "scene": "in a cheerful decorated celebration studio with tasteful balloons, colorful confetti, cake table and streamers",
    "pet": "a fitted party bandana and small paper party hat set behind the ears",
    "person": "fun polished party clothes in original festive colors",
    "look": "bright photoreal celebration photography with lively confetti bokeh",
    "teaser": "Birthday outfits with balloons, confetti and a colorful celebration setup."
  },
  "rockstar": {
    "scene": "ON A FULL LIVE ROCK CONCERT STAGE with tall amplifiers, drum kit, microphone stand, dramatic colored spotlights and cheering crowd silhouettes, NOT the source yard",
    "pet": "a fitted black rocker jacket or dark bandana with an original studded collar; a guitar prop rests nearby, never in humanlike paws",
    "person": "an original leather stage jacket and expressive performer styling, with guitar or mic prop",
    "look": "PHOTOREAL concert photography, red-blue stage lights, smoke and dramatic spotlights; NOT a cartoon, not a backyard",
    "teaser": "Rock-concert outfits on a real-looking stage with amps, drums and colorful lights."
  },
  "popstar": {
    "scene": "on a colorful original music-video stage with giant LED wall, floating scenic shapes and concert lighting",
    "pet": "a bright sparkly fitted pop jacket or patterned collar, head and ears unobstructed",
    "person": "an original colorful pop-stage outfit, reflective accents and expressive but natural pose",
    "look": "photoreal polished pop-video editorial with magenta-cyan stage light",
    "teaser": "Pop-star outfits on a vibrant music-video stage with dramatic color."
  },
  "dj": {
    "scene": "inside a neon-lit nightclub DJ booth with decks, speakers, abstract lasers and dancing crowd silhouettes",
    "pet": "a fitted neon-trimmed collar and DJ-themed pet vest, small headphones nearby without covering ears",
    "person": "an original stylish DJ jacket behind unbranded mixing decks",
    "look": "photoreal nightlife editorial, purple-and-cyan laser haze",
    "teaser": "DJ gear at a neon nightclub booth with speakers and laser lights."
  },
  "red-carpet": {
    "scene": "at a glamorous theater premiere entrance with red carpet, velvet ropes, blank backdrop and camera flashes",
    "pet": "a tiny tailored tuxedo-style pet harness or jewel-toned bow collar",
    "person": "an elegant tuxedo or evening gown with tasteful formal accessories",
    "look": "photoreal luxury event editorial with bright flattering camera flashes",
    "teaser": "Formal red-carpet outfits at a luxury premiere with velvet ropes."
  },
  "beach": {
    "scene": "on a warm sandy coast at golden hour with gentle waves, cliffs and parasols on a distant beach",
    "pet": "a light breathable nautical bandana suited to the original dog",
    "person": "casual linen vacation clothes and relaxed resort accessories",
    "look": "photoreal natural seaside photography, sunset reflections on water",
    "teaser": "Linen-inspired resort styling on a golden-hour beach."
  },
  "paris": {
    "scene": "at a Parisian sidewalk cafe terrace with cobblestones, classic balconies, pastries and a distant Eiffel Tower",
    "pet": "a small striped French-style scarf neatly tied at the collar",
    "person": "a chic tailored trench coat, relaxed scarf and simple beret",
    "look": "photoreal European travel editorial, crisp cafe details and soft morning light",
    "teaser": "Chic scarves at a Paris café terrace with cobblestone streets."
  },
  "tropical": {
    "scene": "beside a turquoise tropical lagoon with palms, flowering plants and an overwater bungalow",
    "pet": "a pet-safe colorful floral garland or light resort-style bandana",
    "person": "original breezy resort clothes with botanical colors",
    "look": "photoreal vibrant tropical travel photography, sunlit water and deep green palms",
    "teaser": "Flower garlands and resort outfits by a turquoise tropical lagoon."
  },
  "luxury": {
    "scene": "on the terrace of a modern designer penthouse overlooking city lights, polished stone and glass architecture",
    "pet": "a refined velvet bow tie or tailored miniature jacket, face fully clear",
    "person": "elegant tailored evening clothes or silk-like fashion styling",
    "look": "photoreal upscale magazine editorial, refined softbox light, rich materials",
    "teaser": "Refined evening outfits in a modern penthouse overlooking the city."
  },
  "astronaut": {
    "scene": "on a moon-base landing platform beside an original spacecraft and lunar rover beneath a planet-lit sky",
    "pet": "a fitted pet-safe space harness with an open facial visor design that does not obscure identity",
    "person": "original realistic astronaut suit, control patches without insignia and clear face visor",
    "look": "photoreal lunar expedition, crisp surface textures, cinematic blue rim light",
    "teaser": "Astronaut suits on a moon-base platform beside a futuristic rover."
  },
  "firefighter": {
    "scene": "outside a clean red-brick fire station with a parked fire engine at sunrise, no active flames or casualties",
    "pet": "a miniature fitted protective-inspired pet jacket and safe collar, no heavy obstructive helmet",
    "person": "realistic original firefighter safety jacket and gear, respectful non-action stance",
    "look": "photoreal warm sunrise portrait, professional fire-station atmosphere",
    "teaser": "Firefighter-inspired uniforms outside a station with a fire engine."
  },
  "chef": {
    "scene": "inside a professional warmly lit restaurant kitchen with tiled walls, copper pans, plated food and preparation counters",
    "pet": "a red chef-style neckerchief and a light chef hat positioned behind the ears",
    "person": "a crisp white chef coat, apron and original cooking accessories",
    "look": "photoreal culinary magazine photography with detailed kitchen surfaces",
    "teaser": "Chef outfits inside a real restaurant kitchen with copper pans."
  },
  "pilot": {
    "scene": "in an aircraft hangar beside a sleek unbranded prop airplane, with dramatic blue sky visible through open doors",
    "pet": "a pet-safe aviator scarf and flight harness, simple goggles resting around the neck",
    "person": "a classic aviator jacket, original flight uniform and practical headset",
    "look": "photoreal aviation editorial with golden natural sky light",
    "teaser": "Aviator jackets beside an airplane in a sunlit hangar."
  },
  "ancient-egypt": {
    "scene": "in an ancient-Egypt-inspired sandstone temple courtyard beside colossal carved columns, with pyramids beyond the desert",
    "pet": "a decorative gold-and-turquoise Egyptian-inspired collar on the natural animal",
    "person": "period-inspired linen clothing with gold-toned ornaments, no sacred-role claims",
    "look": "cinematic historical-inspired photography with rich sandstone and desert sunlight",
    "teaser": "Egyptian-inspired outfits among carved temples and distant pyramids."
  },
  "roman": {
    "scene": "in a Roman Forum-inspired plaza with marble columns, statues and arched stone walkways",
    "pet": "a red-and-gold period-inspired collar and small ceremonial cape fitted to the animal",
    "person": "Roman-inspired tunic, cloak and subtle laurel styling",
    "look": "cinematic historical-inspired realism under Mediterranean sun",
    "teaser": "Roman-inspired tunics and pet capes among marble forum columns."
  },
  "medieval": {
    "scene": "inside a cobblestone medieval castle courtyard with battlements, cloth banners and warm torches",
    "pet": "a fitted embroidered heraldic velvet cape or period pet harness",
    "person": "period-inspired tunic, mantle and practical boots with original insignia-free banners",
    "look": "cinematic medieval realism, golden torchlight and stone textures",
    "teaser": "Medieval capes and tunics in an original banner-lined castle."
  },
  "renaissance": {
    "scene": "inside a Renaissance-era palazzo with carved pillars, tapestry, arched window and deep velvet curtains",
    "pet": "an ornate embroidered collar with a small fitted velvet pet cape",
    "person": "period-inspired velvet doublet or gown and subtle jewelry",
    "look": "museum-quality OLD-MASTER OIL PAINTING, warm chiaroscuro and visible brushwork",
    "teaser": "Old-master painted portraits in a Renaissance palazzo with rich tapestries."
  },
  "tiny-world": {
    "scene": "inside an oversized enchanted garden with towering daisies, giant teacup, colossal books and realistic miniature scale cues",
    "pet": "a miniature scarf fitted to the original pet, without changing its anatomy",
    "person": "a charming small-scale explorer outfit",
    "look": "photoreal miniature-world illusion with shallow depth of field and soft whimsical light",
    "teaser": "A tiny version of your subject among giant flowers and everyday objects."
  },
  "giant-world": {
    "scene": "towering peacefully above a detailed miniature coastal city with tiny buildings, streets and distant mountains",
    "pet": "a simple fitted colored neck scarf while remaining a normal four-legged animal",
    "person": "a casual original adventure outfit with gentle non-destructive pose",
    "look": "photoreal whimsical forced-perspective illusion, full-scale cinematic light",
    "teaser": "Your same subject appears giant beside an original miniature city."
  },
  "food-world": {
    "scene": "in a fantastical dessert village with gingerbread cottages, giant strawberries, candy-cane trees and cupcake hills",
    "pet": "a cheerful confection-inspired patterned bandana, animal itself remains natural and not edible",
    "person": "an original playful pastel bakery-adventure outfit",
    "look": "vivid original painterly storybook realism with glossy edible scenery",
    "teaser": "Playful outfits in a colorful candy-and-dessert fantasy landscape."
  }
});
export const DRAWN_ADVENTURES = Object.freeze(['comic','animated-sitcom','cutout-comedy','anime','storybook','renaissance']);
export function adventureGuide(id){return ADVENTURE_GUIDES[id]||null;}
export function adventureMode(id){return DRAWN_ADVENTURES.includes(id)?'illustration':'photograph';}

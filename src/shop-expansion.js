// Source-pinned, owner-directed Christmas Village pet mug expansion.
// Generates SUPPLIER MOCKUP REVIEWS only; no order, charge, checkout or fulfillment.
// Publication requires exact reviewed proof signatures in the source allow-list.
import {read,hash,randomToken,change,fault,recommendedCheckoutDesign,composeProductLayout} from './commerce-store.js';
import {moderateContent} from './content-safety.js';
import {FULFILLMENT,prepareCheckout} from './entry.js';
import {createMockup,mockupStatus} from './workflow.js';
import {hashBytes,SHOP_CATALOG_KEY,resolveShopOffer} from './shop-catalog-store.js';

export const EXPANSION_DESIGNS=Object.freeze([
  {
    "id": "christmas-village-golden-retriever",
    "requestId": "RC-SHOP-GOLDEN-RETRIEVER-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-golden-retriever-artwork-approved-20261103.png?v=1793745022",
    "sha256": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "originalMasterSha256": "582bc22115b2475f2ec6e15d4198c2071a69729dc619695dcaa23a1396e89137",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Golden Retriever",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-labrador-retriever",
    "requestId": "RC-SHOP-LABRADOR-RETRIEVER-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-labrador-retriever-art-20261103.png?v=1793743824",
    "sha256": "2fe1cef7ace1ed368b16e49b53f93c93928c377d6d8550427c3288d51bae114e",
    "originalMasterSha256": "cc1f562f615f63cac4748f78bf091bc05bfdc8e9c9118007cc01176d30a91b0e",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Labrador Retriever",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-german-shepherd",
    "requestId": "RC-SHOP-GERMAN-SHEPHERD-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-german-shepherd-art-20261103.png?v=1793743831",
    "sha256": "eeeb9c399993eae5cc8ebfada27b893171fe25c8e39dff118bd90b8b68eb3382",
    "originalMasterSha256": "db4d5801ca9cdb62f47022ae1ab0bc4f99cfcf0a4e983fa6d749c473e4b030d0",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "German Shepherd",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-french-bulldog",
    "requestId": "RC-SHOP-FRENCH-BULLDOG-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-french-bulldog-art-20261103.png?v=1793743838",
    "sha256": "8463dab4746cdeb6ac9ff86110c1ed69b56b99b3784e71a904433f5de67a6de3",
    "originalMasterSha256": "f70ecbf69db44fbb8cabad1a29137bca024e9d07c72777404c82565f19cbfb92",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "French Bulldog",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-beagle",
    "requestId": "RC-SHOP-BEAGLE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-beagle-art-20261103.png?v=1793743845",
    "sha256": "c16994403a42d4887b17860c26734cf19071f15dd2f66789bb5a7a7a5d99728d",
    "originalMasterSha256": "f6c066a9cc15124126d37cc173df7c4a2df6a20c7522efc59e57df4e9a5a9c24",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Beagle",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-poodle",
    "requestId": "RC-SHOP-POODLE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-poodle-art-20261103.png?v=1793743853",
    "sha256": "404cc348114c8d1c3b66007a0c785f09abee818f4a495c8666d35524a92f6428",
    "originalMasterSha256": "26aa77ff72df8e01b48c2fd5e22a6890b62e4398177327eda66feb056240e6e6",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Poodle",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-husky",
    "requestId": "RC-SHOP-HUSKY-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-husky-art-20261103.png?v=1793743860",
    "sha256": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "originalMasterSha256": "de90e9ead88b054f344dcaeab20169d3efb92e35bdc9046bea8d9638ad994cd4",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Siberian Husky",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-siamese-cat",
    "requestId": "RC-SHOP-SIAMESE-CAT-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-siamese-cat-art-20261103.png?v=1793743866",
    "sha256": "3afbbac01b6fd3e16f1888a20f4b52855dca45949895f286a14126cdde4956ef",
    "originalMasterSha256": "84608cef086ab9acc4c585a3ce7d731f436d225ef0051d6e142ddb34d8671ece",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Siamese",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-orange-tabby",
    "requestId": "RC-SHOP-ORANGE-TABBY-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-orange-tabby-art-20261103.png?v=1793743872",
    "sha256": "4c78cbac43d317c06364ade65c2247daf48c91c9d329af7893f1c49556f72055",
    "originalMasterSha256": "3148db65251b1a10418ef54d1e21d749512f245ef20a36c895c34512169d1492",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Orange Tabby",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-tuxedo-cat",
    "requestId": "RC-SHOP-TUXEDO-CAT-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-tuxedo-cat-art-20261103.png?v=1793743880",
    "sha256": "a65640bcc3f22ea17791de4781a6d87ceaa065da44098e17a1c9cd111d8683e1",
    "originalMasterSha256": "ec8bb18f88673696238e9183d743debc47c7763402d7c843bd1514e864ddd7f3",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Tuxedo",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-jack-russell",
    "requestId": "RC-SHOP-JACK-RUSSELL-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-village-jack-russell-original-20261103.png?v=1793745496",
    "sha256": "6f416806d0fb34a4190cced090da3cc494e15a5e00a64e01f9ebf49c5149c70a",
    "originalMasterSha256": "5deac5f34dc4294be434c80671e2076748064c20bdd693f884d64b01fd6ce289",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Jack Russell Terrier",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-chihuahua",
    "requestId": "RC-SHOP-CHIHUAHUA-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-village-chihuahua-original-20261103.png?v=1793745506",
    "sha256": "e9720b0aea70a46756d75d12789ccf9cf02b1b434da3496af440d8160aade8e2",
    "originalMasterSha256": "d1df44a927cf16bc63e95d17676213f682fb4787144a242551c987edd108393f",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Chihuahua",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-dachshund",
    "requestId": "RC-SHOP-DACHSHUND-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-village-dachshund-original-20261103.png?v=1793745516",
    "sha256": "4299b3b3020d74cb7e48a835a7a8252a70a86e1ad75eca0229032f302789b2a8",
    "originalMasterSha256": "7303cca5cbe4b65208c92563e4e262e434efb617d58d440e737ed31962e622bb",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Dachshund",
    "occasion": "christmas"
  },
  {
    "id": "christmas-archive-ragdoll-ice-palace",
    "requestId": "RC-SHOP-ARCHIVE-RAGDOLL-ICE-PALACE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-ragdoll-ice-palace-art-20261103.png?v=1793748611",
    "sha256": "dbbfaab622fefaaf9638a2509d6efcc2086df6e6e1592f496f09888e7b27248d",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Ragdoll Cat",
    "occasion": "christmas",
    "title": "Ragdoll · Winter Crystal Palace Mug"
  },
  {
    "id": "christmas-archive-poodle-lavender",
    "requestId": "RC-SHOP-ARCHIVE-POODLE-LAVENDER-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-poodle-lavender-art-20261103.png?v=1793748619",
    "sha256": "e38df25789a4023b3ad561df0702081015d1de3f1d862864c75a5a51247116d3",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Poodle",
    "occasion": "christmas",
    "title": "Poodle · Lavender Christmas Mug"
  },
  {
    "id": "christmas-archive-beagle-santa-mail",
    "requestId": "RC-SHOP-ARCHIVE-BEAGLE-SANTA-MAIL-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-beagle-santa-mail-art-20261103.png?v=1793748626",
    "sha256": "c9cc78b803f9a7d598acafd1dc3bfea435b22890683f9e38933e7e2c0283bb89",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Beagle",
    "occasion": "christmas",
    "title": "Beagle · Letters to Santa Mug"
  },
  {
    "id": "christmas-archive-maine-coon-snowfall",
    "requestId": "RC-SHOP-ARCHIVE-MAINE-COON-SNOWFALL-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-maine-coon-snowfall-art-20261103.png?v=1793748633",
    "sha256": "f188e500d8ce9e7d5853af4af8d747557ddcf28dfcc5e017433fd84f029d15e7",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Maine Coon",
    "occasion": "christmas",
    "title": "Maine Coon · Winter Snowfall Mug"
  },
  {
    "id": "christmas-archive-white-persian-rose",
    "requestId": "RC-SHOP-ARCHIVE-WHITE-PERSIAN-ROSE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-white-persian-rose-art-20261103.png?v=1793748641",
    "sha256": "179a94dfc8d5c0dc8d7e08992ef1f10cc8adba8a5e3328811a6574d2ce27f36a",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "White Persian Cat",
    "occasion": "christmas",
    "title": "White Persian · Rosy Christmas Mug"
  },
  {
    "id": "christmas-archive-english-bulldog-gifts",
    "requestId": "RC-SHOP-ARCHIVE-ENGLISH-BULLDOG-GIFTS-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-english-bulldog-gifts-art-20261103.png?v=1793748648",
    "sha256": "6231f26073a4bc814993fb61a8d8ae51a7af630c7c8e15d99bde4c259f8afb14",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "English Bulldog",
    "occasion": "christmas",
    "title": "English Bulldog · Under the Tree Mug"
  },
  {
    "id": "christmas-archive-silver-tabby-toy-train",
    "requestId": "RC-SHOP-ARCHIVE-SILVER-TABBY-TOY-TRAIN-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-silver-tabby-toy-train-art-20261103.png?v=1793748655",
    "sha256": "2aed0e383b6abd8941c2bef6740da26475da0b26535ebdf9a241e18c0c609e0a",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Silver Tabby Cat",
    "occasion": "christmas",
    "title": "Silver Tabby · Christmas Express Mug"
  },
  {
    "id": "christmas-archive-german-shepherd-snowy-street",
    "requestId": "RC-SHOP-ARCHIVE-GERMAN-SHEPHERD-SNOWY-STREET-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-german-shepherd-snowy-street-art-20261103.png?v=1793748661",
    "sha256": "75344d5bb79049fda7a7f16eda7e323181bc3e4949929416471a00026f224a2e",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "German Shepherd",
    "occasion": "christmas",
    "title": "German Shepherd · Snowy Village Mug"
  },
  {
    "id": "christmas-archive-russian-blue-midnight",
    "requestId": "RC-SHOP-ARCHIVE-RUSSIAN-BLUE-MIDNIGHT-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-russian-blue-midnight-art-20261103.png?v=1793748668",
    "sha256": "7880618e39b51f249d5ddd82c8d8fbe906888a7dc4d6f2019e85cedf6a2f4641",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Russian Blue Cat",
    "occasion": "christmas",
    "title": "Russian Blue · Moonlit Christmas Mug"
  },
  {
    "id": "christmas-archive-maine-coon-fireside",
    "requestId": "RC-SHOP-ARCHIVE-MAINE-COON-FIRESIDE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-maine-coon-fireside-art-20261103.png?v=1793748675",
    "sha256": "c8d2e410f123ffc45e24e1d217def1892dfbf5d92037857884e32d21d9fb0fc8",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Maine Coon",
    "occasion": "christmas",
    "title": "Maine Coon · Fireside Christmas Mug"
  },
  {
    "id": "christmas-archive-british-shorthair-red-velvet",
    "requestId": "RC-SHOP-ARCHIVE-BRITISH-SHORTHAIR-RED-VELVET-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-british-shorthair-red-velvet-art-20261103.png?v=1793748682",
    "sha256": "b66e6dad89495b703dc740cec0ee677f0d5450546eb5281ab557ecde1cae7e75",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "British Shorthair Cat",
    "occasion": "christmas",
    "title": "British Shorthair · Velvet Christmas Mug"
  },
  {
    "id": "christmas-archive-pointer-winter-woods",
    "requestId": "RC-SHOP-ARCHIVE-POINTER-WINTER-WOODS-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-pointer-winter-woods-art-20261103.png?v=1793748698",
    "sha256": "e4ab13bb1cff8dd064058e4c3c7ea69afcd9bf40a80d72a0c1410decf7668f50",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "German Shorthaired Pointer",
    "occasion": "christmas",
    "title": "Pointer · Winter Woods Mug"
  },
  {
    "id": "christmas-archive-french-bulldog-toy-shop",
    "requestId": "RC-SHOP-ARCHIVE-FRENCH-BULLDOG-TOY-SHOP-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-french-bulldog-toy-shop-art-20261103.png?v=1793748705",
    "sha256": "7be3a366dbd6e4d79c1f120a37716adf93f10b3192c36a501fd8b4a9029e37f3",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "French Bulldog",
    "occasion": "christmas",
    "title": "French Bulldog · Christmas Toy Shop Mug"
  },
  {
    "id": "christmas-archive-abyssinian-evergreen",
    "requestId": "RC-SHOP-ARCHIVE-ABYSSINIAN-EVERGREEN-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-abyssinian-evergreen-art-20261103.png?v=1793748713",
    "sha256": "28d2cfd78d35500e4c8c8de98ce0ab8cbe28f2a31eaf46cc16832b12961665a7",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Abyssinian Cat",
    "occasion": "christmas",
    "title": "Abyssinian · Evergreen Glow Mug"
  },
  {
    "id": "christmas-archive-chihuahua-holiday-gold",
    "requestId": "RC-SHOP-ARCHIVE-CHIHUAHUA-HOLIDAY-GOLD-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-chihuahua-holiday-gold-art-20261103.png?v=1793748721",
    "sha256": "05c939d4a2c931123cd21e536d9b1d519432316f25552814f055ed635cf880ea",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Chihuahua",
    "occasion": "christmas",
    "title": "Chihuahua · Holiday Gold Mug"
  },
  {
    "id": "christmas-archive-orange-persian-cozy-fire",
    "requestId": "RC-SHOP-ARCHIVE-ORANGE-PERSIAN-COZY-FIRE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-orange-persian-cozy-fire-art-20261103.png?v=1793748729",
    "sha256": "536564decec538123c5155893bd48a204485c6b008011d2bac7f8b9da4dcec5e",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Orange Persian Cat",
    "occasion": "christmas",
    "title": "Orange Persian · Cozy Fireside Mug"
  },
  {
    "id": "christmas-archive-chocolate-labrador-chalet",
    "requestId": "RC-SHOP-ARCHIVE-CHOCOLATE-LABRADOR-CHALET-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-chocolate-labrador-chalet-art-20261103.png?v=1793748736",
    "sha256": "9549746496e4082415b07d18b6d176fc52d5d1447f4ad368eedfd7bcee349daf",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Chocolate Labrador",
    "occasion": "christmas",
    "title": "Chocolate Labrador · Winter Chalet Mug"
  },
  {
    "id": "christmas-archive-dalmatian-christmas-engine",
    "requestId": "RC-SHOP-ARCHIVE-DALMATIAN-CHRISTMAS-ENGINE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-dalmatian-christmas-engine-art-20261103.png?v=1793748743",
    "sha256": "8169c0ffe573cc860f0cad06400ed041edc59f23f4d5792ff59aba03a8bb0125",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Dalmatian",
    "occasion": "christmas",
    "title": "Dalmatian · Christmas Fire Engine Mug"
  },
  {
    "id": "christmas-archive-sphynx-present-surprise",
    "requestId": "RC-SHOP-ARCHIVE-SPHYNX-PRESENT-SURPRISE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-sphynx-present-surprise-art-20261103.png?v=1793748749",
    "sha256": "0e0e788355c2a4822cfa65c6f4fc95fc0b05759550d3a700d1e4c78b24ca153f",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Sphynx Cat",
    "occasion": "christmas",
    "title": "Sphynx · Christmas Present Mug"
  },
  {
    "id": "christmas-archive-dachshund-gingerbread-village",
    "requestId": "RC-SHOP-ARCHIVE-DACHSHUND-GINGERBREAD-VILLAGE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-dachshund-gingerbread-village-art-20261103.png?v=1793748757",
    "sha256": "df47ff3c2f66ef67cbb877bf1e748719a1bed651aa09d105e054cd206d0ae3b3",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Dachshund",
    "occasion": "christmas",
    "title": "Dachshund · Gingerbread Village Mug"
  },
  {
    "id": "christmas-archive-rottweiler-fireside",
    "requestId": "RC-SHOP-ARCHIVE-ROTTWEILER-FIRESIDE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-rottweiler-fireside-art-20261103.png?v=1793748765",
    "sha256": "a73011f1bd01c40e746ae39f221d3dbd5beaec1a31d65925f912cbb6dc654c71",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Rottweiler",
    "occasion": "christmas",
    "title": "Rottweiler · Fireside Christmas Mug"
  },
  {
    "id": "christmas-archive-jack-russell-snowy-sleigh",
    "requestId": "RC-SHOP-ARCHIVE-JACK-RUSSELL-SNOWY-SLEIGH-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-archive-jack-russell-snowy-sleigh-art-20261103.png?v=1793748774",
    "sha256": "40abfd26ae849ff65ef081fb7771fd2709513263bc806efc902009cca9783615",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Jack Russell Terrier",
    "occasion": "christmas",
    "title": "Jack Russell · Snowy Sleigh Mug"
  }
]);
export const EXPANSION_ITEMS=Object.freeze(EXPANSION_DESIGNS.flatMap(d=>[
 {id:d.id.replace(/^christmas-/,'')+'-mug-11oz',designId:d.id,sku:'RECAST-MUG-11OZ',title:d.title||d.breed+' Christmas Village Mug',variantLabel:'White glossy · 11 oz'},
 {id:d.id.replace(/^christmas-/,'')+'-mug-15oz',designId:d.id,sku:'RECAST-MUG-15OZ',title:d.title?d.title+' · 15 oz':d.breed+' Christmas Village Large Mug',variantLabel:'White glossy · 15 oz'}
]));
const byDesign=new Map(EXPANSION_DESIGNS.map(d=>[d.id,d]));
// DO NOT add a proof hash until both Printful image and frozen print placement
// have been independently inspected and compared to the pinned source artwork.
// Reviewed against the exact Printful 11 oz and 15 oz handle-left and 3D previews.
// The source-revision, saved clean print file and position remain immutable.
export const REVIEWED_EXPANSION_PROOFS=Object.freeze({
 'village-golden-retriever-mug-11oz':'b114d98c685bd48caa8d0cedd9a890714fc4936273b1a4d85d75e9c36cc5669b',
 'village-golden-retriever-mug-15oz':'ef15ee055e30aeb1f121cec08a1e7200aed283f6d7e17985f51b56b32661049d',
 'village-labrador-retriever-mug-11oz':'859163145a6650e7e9e092047ada6d25077cf90a76837ac2ee1927e170ec5f33',
 'village-labrador-retriever-mug-15oz':'d571679afef663d389116bc51abbaf441eefc12981f74a0cd4e78e7e439de941',
 'village-german-shepherd-mug-11oz':'bcb075fd4fe0d8fdbe5b509b974013f3e931b8c064104676d614cc087ccdde85',
 'village-german-shepherd-mug-15oz':'a487bde8c62f69f0a942705f256d49e2a957663c3ddab82d019eac847a7f5c8d',
 'village-french-bulldog-mug-11oz':'a61b3871c29c252af5a485bde2e7b4b204232fd9ce6ce7f2268cadd5a5d131be',
 'village-french-bulldog-mug-15oz':'427f93b08b399626afd2db2c599960c200867b0bc3e6b9d051ff7502e20e119f',
 'village-beagle-mug-11oz':'f6f5094f66f6ac1122f96d8ec0d5d1b10047d4399f975a4f5739b23145304af2',
 'village-beagle-mug-15oz':'9c97106fbd086f851a23a8a1990892c97cc54cc32991a03f20f9c6bb5b4d2dea',
 'village-poodle-mug-11oz':'e94acc028ce9e0f9e4505530bbe3f68daf88a486f41e0e49601d99000982947a',
 'village-poodle-mug-15oz':'dd1deb81c0d364c56b8c901ce66024fdf0773b08ebc8802caf50ad3f2d1abf6f',
 'village-husky-mug-11oz':'1dded23da0468e08365a89384e5c9485e4142cc4f36c79dc2af6097c6ff77d36',
 'village-husky-mug-15oz':'87f50dc89f7050a7cacd474de2d0eed846c4f4cba598077aeff1ffca61ae363a',
 'village-orange-tabby-mug-11oz':'35f17e2c03f47a97902db01ff97b2a5049f9c3f8d7b5d487cd6cbe88cb1f5f24',
 'village-orange-tabby-mug-15oz':'0b2b5caf21625b213d492b4a024d3aed4fc7a734ebfa42e8ea018944f381dda4',
 'village-tuxedo-cat-mug-11oz':'c820ad43f05a6cd6b1e30325d9a58bae69fae04a17fc356d05374d90df314ca2',
 'village-tuxedo-cat-mug-15oz':'4a0d52ad627abf9d963bed195bba3187384c717c5a897921b1a44f800f724d78',
 'village-jack-russell-mug-11oz':'82e96b6a9248a835b43a35eb3d9b6b5d9dac74cd55c81e4aca4c0f46f9a4a256',
 'village-jack-russell-mug-15oz':'3b566030164e8bdcbef873507a831f503b3d6708f6b1bd97f8f3c2944aff200c',
 'village-chihuahua-mug-11oz':'fb8cdabc60e4bc3987a29016dc7a7a5f97a9f5ee72b1a7c54fb555b78f54cc0a',
 'village-chihuahua-mug-15oz':'adf1f48c405435d910e96cdd29bd62aa64a25033bc73cbe6cb2d7fd3b3d9be04',
 'village-dachshund-mug-11oz':'9c44e7e6fe5813a8ae3cab2306911a376703cc7fba668eb05a4f0e4c85d6db4f',
 'village-dachshund-mug-15oz':'5d4499268c13ad4dc4584667164999f52b3c081f7450b10708a29904870e9da4',
 'archive-poodle-lavender-mug-11oz':'454d9c2305c890db41a505c6c9958473aa1cbd8cc097c47ca855f5cca5060c2f',
 'archive-poodle-lavender-mug-15oz':'2aa6a7bcb4b9beb1d7ee7b66beed8acb59d17196412c068524f160d805a0e54c',
 'archive-british-shorthair-red-velvet-mug-11oz':'a05add9dd3fb8db94ba5542d9f613b3ba75b5ed4a9233b9d4112a31e51326955',
 'archive-british-shorthair-red-velvet-mug-15oz':'5cd680e16833bd44d67d6ff747dac258a3976ae5ff323a7420c9742ab4d15a0c',
 'archive-pointer-winter-woods-mug-11oz':'6c86a9a19c74a83d998b49516811f0f4d286b2b2078fa999bcc510b9102e82c2',
 'archive-pointer-winter-woods-mug-15oz':'2a9d5ee0901a57eda500f5d051266372dbb1eb7f286e0abfa7b4b253b3a564ad',
 'archive-abyssinian-evergreen-mug-11oz':'3b925ecd598e8f0f4bc2c4ffec1f78cd691c4bc8db987e86893732f1cd770b40',
 'archive-abyssinian-evergreen-mug-15oz':'cbe46b9637a5cb6a5628bcfee6daa4471eb2cec95cfe7d8fe704904647f0fe30'
});
// Separate v3 namespace preserves all v2 attempted records. No deletion, no blind supplier retries.
export function approvedMugSourceMime(bytes){
 if(bytes?.[0]===255&&bytes?.[1]===216&&bytes?.[2]===255)return 'image/jpeg';
 if(bytes?.[0]===137&&bytes?.[1]===80&&bytes?.[2]===78&&bytes?.[3]===71&&bytes?.[4]===13&&bytes?.[5]===10&&bytes?.[6]===26&&bytes?.[7]===10)return 'image/png';
 throw fault('seed_asset_format','The saved Christmas artwork is not a supported image format.',503);
}
// Bound provider requests on every cron invocation; tasks are idempotent and persisted.
export function sourcePreviewBatchSize(env){
 const count=Number(env?.PREMADE_EXPANSION_PREVIEW_BATCH_SIZE??2);
 return Number.isInteger(count)&&count>=1&&count<=8?count:2;
}
// Printful's new-store Mockup Generator may allow only 2 create-task calls per
// rolling 60 seconds. Persist a 65-second token bucket across cron executions.
// Losing a response consumes capacity conservatively; it NEVER triggers an unsafe retry.
export async function claimMugPreviewRateSlot(env,stamp=Date.now()){
 const key='shop/preparation/v3/mockup-create-rate.json',obj=await env.ARTWORK.get(key);
 if(obj&&!obj.etag)return false;
 let timestamps=[];
 if(obj){try{
   const data=await obj.json();
   if(!Array.isArray(data?.timestamps)||data.timestamps.length>100||
      data.timestamps.some(x=>!Number.isSafeInteger(x)||x<0))return false;
   timestamps=data.timestamps;
  }catch{return false;}
 }
 const recent=timestamps.filter(x=>x>stamp-65000&&x<=stamp);
 if(recent.length>=2)return false;
 const saved=await env.ARTWORK.put(key,JSON.stringify({timestamps:[...recent,stamp]}),{
  onlyIf:obj?{etagMatches:obj.etag}:new Headers({'If-None-Match':'*'}),
  httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}
 });
 return Boolean(saved?.etag);
}
export function canaryDesignCount(env){
 const count=Number(env?.PREMADE_EXPANSION_CANARY_COUNT??35);
 return Number.isInteger(count)&&count>=0&&count<=EXPANSION_DESIGNS.length?count:0;
}

const key=id=>`shop/preparation/v3/${id}.json`;
const now=()=>new Date().toISOString();
const base=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const inner=(env,path,body)=>new Request(base(env)+path,{method:body?'POST':'GET',headers:{'x-recast-request':'1',origin:base(env),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const b64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(out);};
async function source(env,design){
 const meta=await read(env,`requests/${design.requestId}/request.json`);
 if(meta){if(meta.source!=='premade-catalog'||meta.catalogDesignId!==design.id||meta.catalogMasterHash!==design.sha256)throw fault('seed_identity','The catalog source needs review.',503);return meta;}
 const claim=`shop/preparation/v3/source-${design.id}.claim`;
 if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('seed_source_pending','The original catalog import needs review before retrying.',503);
 if(!design.asset.startsWith('https://cdn.shopify.com/s/files/1/0854/3810/3796/files/'))throw fault('seed_asset','The source URL is not from the approved Recast Me media library.',503);
 // Workerd implements only manual/follow, not redirect:'error'. Reject 3xx explicitly.
 const response=await fetch(design.asset,{redirect:'manual',headers:{accept:'image/png'}});
 if((response.status>=300&&response.status<400)||response.redirected||response.type==='opaqueredirect'){
  await response.body?.cancel().catch(()=>{});
  throw fault('seed_asset_redirect','The catalog artwork source redirected and needs review.',503);
 }
 if(!response.ok)throw fault('seed_asset','The approved catalog artwork could not load.',503);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(await hashBytes(bytes)!==design.sha256)throw fault('seed_asset_changed','The catalog artwork does not match its approved source.',503);
 // Shopify Files may optimize PNG uploads into JPEG bytes while retaining a .png URL.
 // SHA-256 is pinned to the actual delivered bytes; declare the actual MIME to Images and moderation.
 const mime=approvedMugSourceMime(bytes);
 const info=await env.IMAGES.info(new Blob([bytes],{type:mime}).stream());
 if(info.width!==design.width||info.height!==design.height)throw fault('seed_dimensions','The catalog artwork dimensions changed.',503);
 const notes=`Original fictional ${design.breed} Christmas Village — premade catalog`,text=notes+' ';
 const screened=await moderateContent(env,{text,images:[new File([bytes],design.id+(mime==='image/jpeg'?'.jpg':'.png'),{type:mime})],required:true});
 const encoded=b64(bytes),createdAt=now(),requestId=design.requestId;
 const masterKey=`shop/masters/${design.id}/${design.sha256}.${mime==='image/jpeg'?'jpg':'png'}`;
 const saved={requestId,accessToken:randomToken(),previewMime:mime,catalogMasterKey:masterKey,source:'premade-catalog',catalogDesignId:design.id,catalogMasterHash:design.sha256,catalogRightsConfirmedAt:createdAt,contentSafety:screened,notes,styleId:'christmas',styleName:'Christmas Village',subjectType:'pet',qualityMode:'original',modelUsed:null,status:'preview_ready',paid:false,fulfillment:'not_started',createdAt,updatedAt:createdAt,width:info.width,height:info.height};
 await env.ARTWORK.put(masterKey,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:mime}});
 await env.ARTWORK.put(`requests/${requestId}/preview.b64`,encoded,{onlyIf:new Headers({'If-None-Match':'*'})});
 await env.ARTWORK.put(`security/content-screening/${requestId}.json`,JSON.stringify({...screened,hash:await hash(encoded+'|'+text)}));
 const stored=await env.ARTWORK.put(`requests/${requestId}/request.json`,JSON.stringify(saved),{onlyIf:new Headers({'If-None-Match':'*'})});
 if(!stored)throw fault('seed_source_conflict','The catalog source changed during import.',503);
 return saved;
}
async function freezeOffer(env,item,meta,state,design){
 const prepared=await prepareCheckout(inner(env,'/api/checkout-link',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,mockupId:state.mockupId,design:state.design,confirmDesign:true}),env,{});
 if(prepared instanceof Response)throw fault('seed_approval','The product preview could not be frozen.',503);
 const record=prepared.checkoutApproval,task=await read(env,`mockups/${meta.requestId}/${item.sku}/${state.mockupId}/task.json`);
 if(!task?.taskKey||task.status!=='completed'||record.approvalMode!=='product-mockup')throw fault('seed_proof','A completed supplier proof is required.',503);
 const sourceObject=await env.ARTWORK.get(record.snapshotKey),encoded=await sourceObject.text();
 if(await hash(encoded)!==record.sourceHash)throw fault('seed_source_changed','The approved source changed.',503);
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),area={width:record.position.area_width,height:record.position.area_height};
 const info=await env.IMAGES.info(new Blob([bytes],{type:meta.previewMime}).stream());
 // Starter assortment is mugs only: source height exceeds the supplier's native
 // print-area height. Larger products cannot silently reuse this small master.
 if(FULFILLMENT[item.sku].product!=='Mug'||info.height<area.height||info.width<area.height)throw fault('seed_resolution','This design needs a larger master for this product.',503);
 const composed=await composeProductLayout(env,bytes,info,area,FULFILLMENT[item.sku],record.design,4096);
 const finalHash=await hashBytes(composed.bytes),mime=composed.mime||'image/jpeg';
 if(mime!=='image/jpeg'||composed.bytes[0]!==255||composed.bytes[1]!==216)throw fault('seed_printfile','The locked print file is invalid.',503);
 const finalKey=`shop/printfiles/${item.id}/${finalHash}.jpg`,placementHash=await hash(JSON.stringify(record.position));
 await env.ARTWORK.put(finalKey,composed.bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:mime}});
 const premadePrint={key:finalKey,sha256:finalHash,mime,sku:item.sku,sourceHash:record.sourceHash,proofHash:record.proofHash,placementHash,artworkRevision:design.sha256};
 const full=await change(env,`commerce/preapprovals/${record.token}.json`,null,old=>{
  if(!old||old.sourceHash!==record.sourceHash||old.proofHash!==record.proofHash)throw fault('seed_approval_changed','The frozen product approval changed.',503);
  if(old.premadePrint&&JSON.stringify(old.premadePrint)!==JSON.stringify(premadePrint))throw fault('seed_print_changed','This print file needs review.',503);
  return {...old,premadePrint};
 });
 const mockupUrl=prepared.approvedPreview.imageUrl,proof={provider:'printful',approved:true,artworkRevision:design.sha256,printfulVariantId:FULFILLMENT[item.sku].printfulVariantId,printFileHash:finalHash,placementHash,taskId:String(task.taskKey),checkedAt:now()};
 const offer={...item,designId:design.id,occasion:design.occasion,pet:design.pet,breed:design.breed,product:'mug',variantId:prepared.row.variantId,priceCents:Math.round(Number(prepared.row.price)*100),currency:'USD',status:'verified',artworkRevision:design.sha256,artworkKey:meta.catalogMasterKey||`shop/masters/${design.id}/${design.sha256}.png`,requestId:meta.requestId,sourceHash:record.sourceHash,proofHash:record.proofHash,mockupId:record.mockupId,approvalToken:record.token,approvalRecordHash:await hash(JSON.stringify(full)),mockupUrl,proof};
 await env.ARTWORK.put(`shop/proofs/${item.id}.json`,JSON.stringify({...proof,mockupUrl}));
 return {id:item.id,status:'ready_for_review',title:item.title,variantLabel:item.variantLabel,offer,views:prepared.approvedPreview.images,preparedAt:now()};
}
async function publishReviewed(env,item,state){
 const expected=REVIEWED_EXPANSION_PROOFS[item.id];
 if(!expected||!state.offer)return false;
 const signature=await hash(JSON.stringify([state.offer.approvalRecordHash,state.offer.proofHash,state.offer.proof.printFileHash,state.offer.proof.placementHash]));
 if(signature!==expected)throw fault('expansion_review_changed','The exact approved print proof changed. No publication.',503);
 await resolveShopOffer(env,item.id,state.offer.artworkRevision,{catalog:{version:1,offers:[state.offer]}});
 await change(env,SHOP_CATALOG_KEY,{version:1,revision:0,offers:[]},catalog=>{
  const previous=catalog.offers.find(o=>o.id===item.id);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(state.offer))throw fault('expansion_offer_conflict','The published offer needs manual review.',503);
  return previous?catalog:{...catalog,revision:catalog.revision+1,offers:[...catalog.offers,state.offer]};
 });
 await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'published',publishedAt:now()}));
 return true;
}

export async function runShopExpansion(env){
 if(env.PREMADE_EXPANSION_ENABLED!=='true'||!env.ARTWORK||!env.IMAGES)return {enabled:false};
 const lock='shop/preparation/v3/expansion.lock',existing=await env.ARTWORK.get(lock);
 if(existing&&Date.parse((await existing.json()).until)>Date.now())return {busy:true};
 const locked=await env.ARTWORK.put(lock,JSON.stringify({until:new Date(Date.now()+180000).toISOString()}),{onlyIf:existing?{etagMatches:existing.etag}:new Headers({'If-None-Match':'*'})});
 if(!locked)return {busy:true};
 let created=0,polled=0,ready=0;
 try{
  for(const item of EXPANSION_ITEMS){
   const design=byDesign.get(item.designId);
   if(!design||EXPANSION_DESIGNS.indexOf(design)>=canaryDesignCount(env))continue;
   let state=await read(env,key(item.id));
   if(state?.status==='published'||state?.status==='needs_review')continue;
   if(state?.status==='ready_for_review'){
    try{if(await publishReviewed(env,item,state))ready++;}
    catch(error){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'needs_review',code:error.code||'expansion_review',message:String(error.message).slice(0,180),checkedAt:now()}));}
    continue;
   }
   if(!state&&created>=sourcePreviewBatchSize(env))continue;
   if(state?.status==='pending_preview'&&polled>=Math.max(6,sourcePreviewBatchSize(env)*3))continue;
   try{
    const meta=await source(env,design),layout=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
    if(!state){
     if(!await claimMugPreviewRateSlot(env))continue;
     state={id:item.id,status:'creating_preview',startedAt:now()};
     if(!await env.ARTWORK.put(key(item.id),JSON.stringify(state),{onlyIf:new Headers({'If-None-Match':'*'})}))continue;
     created++;
     const response=await createMockup(inner(env,'/api/mockup/create',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,design:layout}),env);
     const data=await response.json();
     if(!response.ok||!data.ok||!data.mockupId)throw fault('expansion_preview','Supplier preview creation needs review; no automatic recreation.',503);
     await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'pending_preview',mockupId:data.mockupId,design:layout,polls:0}));
     continue;
    }
    if(state.status!=='pending_preview')throw fault('expansion_uncertain','Uncertain supplier task; manual review required.',503);
    if(state.polls>=20)throw fault('expansion_timeout','Supplier preview poll limit reached.',503);
    polled++;
    const query=new URLSearchParams({requestId:meta.requestId,token:meta.accessToken,sku:item.sku,mockup:state.mockupId});
    const response=await mockupStatus(inner(env,'/api/mockup/status?'+query),env),data=await response.json();
    if(!response.ok||!data.ok)throw fault('expansion_poll','Supplier preview could not be confirmed.',503);
    if(data.status!=='completed'){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,polls:state.polls+1}));continue;}
    await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'freezing_preview'}));
    await env.ARTWORK.put(key(item.id),JSON.stringify(await freezeOffer(env,item,meta,state,design)));
    ready++;
   }catch(error){
    await env.ARTWORK.put(key(item.id),JSON.stringify({...state,id:item.id,status:'needs_review',code:error.code||'expansion_failed',message:String(error.message||'Preview preparation failed').slice(0,180),checkedAt:now()}));
   }
  }
  return {enabled:true,created,polled,ready};
 }finally{await env.ARTWORK.delete(lock);}
}
const SAFE_FAILURE_WORDS=new Set(['cannot','read','reading','property','properties','of','undefined','null','fetch','failed','failure','network','connection','dns','timeout','timed','out','image','images','format','decode','info','png','webp','moderation','screen','screening','safety','credits','quota','permission','denied','source','asset','file','error','not','supported','response','body','already','consumed','too','many','subrequests','invalid','hash','resource','limit','missing','unavailable','service','inference','request','binding','method','function','typeerror','referenceerror']);
export function safeExpansionFailureClass(message){
 const words=String(message||'').toLowerCase().match(/[a-z]{2,18}/g)||[];
 return words.filter(w=>SAFE_FAILURE_WORDS.has(w)).slice(0,7).join('_')||'unclassified';
}
export async function shopExpansionStatus(env){
 const items=[];
 for(const item of EXPANSION_ITEMS){
  const state=await read(env,key(item.id));
  const offer=state?.offer;
  items.push({id:item.id,designId:item.designId,title:item.title,variantLabel:item.variantLabel,status:state?.status||'not_started',code:state?.code||null,diagnostic:state?.status==='needs_review'?safeExpansionFailureClass(state.message):null,
   ...(offer?{views:state.views,previewUrl:offer.mockupUrl,reviewSignature:await hash(JSON.stringify([offer.approvalRecordHash,offer.proofHash,offer.proof.printFileHash,offer.proof.placementHash]))}:{})});
 }
 return {enabled:env.PREMADE_EXPANSION_ENABLED==='true',canaryDesigns:canaryDesignCount(env),maxNewTasksPerRun:sourcePreviewBatchSize(env),queue:'v3',items};
}

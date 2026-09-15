/**
 * Placeholder photography for the demo brand.
 *
 * The Juniper Table organisation in Gorilla Dash carries no media yet, so every image
 * slot falls back to a free Unsplash photo (Unsplash License) chosen for that slot.
 * When a record gains real media in Gorilla Dash, pass its URL as the first argument
 * to `imageOr()` and the placeholder is ignored.
 */
const PHOTOS = {
  heroBoard: '1773754109448-13d2af138059',
  interiorBright: '1544031064-9de80864ade5',
  interiorYellow: '1712730642507-d4ad0904e997',
  interiorCounter: '1689037676470-b72230d5236e',
  interiorWindows: '1690999934686-85806c270eb7',
  interiorBooks: '1679241766152-0e47cd92a734',
  storefrontEvening: '1665792235543-0e42f20860c7',
  storefrontPatio: '1715208970431-436fc26933ac',
  storefrontFlowers: '1672777368863-0d3946b57d95',
  kitchen: '1655182413225-695cc7ed0411',
  boardClassic: '1557109965-b9bf442aeb97',
  boardGourmet: '1771216597626-92664c822237',
  boardGrapes: '1781714534168-d36732f399e0',
  boardDips: '1787797690862-d7b6aaa32a37',
  bowlRice: '1666819691822-29a09f0992e5',
  bowlSalad: '1667499823726-f2c6fc321b66',
  bowlPair: '1574365321751-0fdea984d9c0',
  oats: '1571750007475-09cc42b58613',
  latteFlatLay: '1511920170033-f8396924c348',
  latteLeaf: '1650097364104-eef0e54af0da',
  latteArt: '1742549626436-bf3c11dab212',
  coffeePour: '1507915135761-41a0a222c709',
  baristaPour: '1532713107108-dfb5d8d2fc42',
  baristaSmile: '1599549192669-6baac5d32432',
  baristaCounter: '1580644043501-627f569f7e25',
  buffet: '1555244162-803834f70033',
  cateringSpread: '1576842546422-60562b9242ae',
  cateringTable: '1740047602722-b4993b79e4b7',
  miniSandwiches: '1633424411431-5eb8d0e96488',
  platingGloves: '1687369595840-e96a912586f1',
  chef: '1616734755909-bb016ce64930',
  toastEgg: '1533089860892-a7c6f0a88666',
  eggsBacon: '1734770205674-d117e4ba7926',
  brunchSpread: '1504754524776-8f4f37790ca0',
  brunchTable: '1424847651672-bf20a4b0982b',
  croissants: '1623334044303-241021148842',
  croissantTray: '1530610476181-d83430b64dcd',
  breadTray: '1612366747681-e4ca6992b1e9',
  sandwich: '1553909489-cd47e0907980',
  clubSandwich: '1540713434306-58505cf1b6fc',
  baguette: '1509722747041-616f39b57569',
  ownerCounter: '1556745750-68295fefafc5',
  ownerSmile: '1758887261865-a2b89c0f7ac5',
  ownerServing: '1541557435984-1c79685a082b',
  teamKitchen: '1651977560788-98792cd34da0',
  dinersRestaurant: '1723744910051-da35a92321af',
  dinersTable: '1723744909898-4a1ce8922699',
  friendsTable: '1564282350314-367c9169d05a',
  banquet: '1762216444265-a675abbb48dd',
  dessertBuffet: '1769812344084-b45b638b1737',
  dessertTable: '1774660811213-37f1b8e8f00c',
  macarons: '1761115048523-ed6cc1b358ca',
  lemonade: '1523677011781-c91d1bbe2f9e',
  cookies: '1618009544639-d61a46e7974d'
} as const

export type PhotoKey = keyof typeof PHOTOS

export function photo(key: PhotoKey, width = 1200, ratio?: number): string {
  const height = ratio ? `&h=${Math.round(width / ratio)}` : ''

  return `https://images.unsplash.com/photo-${PHOTOS[key]}?auto=format&fit=crop&q=75&w=${width}${height}`
}

export function imageOr(gorillaDashUrl: string | null | undefined, fallback: string): string {
  return gorillaDashUrl ? gorillaDashUrl : fallback
}

const seedIndex = (seed: string, length: number): number =>
  [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % length

const TRIBE_PHOTOS: Record<string, PhotoKey> = {
  'austin-south-congress': 'interiorCounter',
  'denver-highlands': 'storefrontPatio',
  'nashville-germantown': 'interiorWindows',
  'scottsdale-old-town': 'storefrontFlowers',
  'san-diego-north-park': 'interiorYellow',
  'charlotte-south-end': 'interiorBooks',
  'tampa-hyde-park': 'dinersRestaurant',
  'portland-pearl-district': 'interiorBright'
}

export function tribePhoto(slug: string, width = 1600): string {
  const fallbacks: PhotoKey[] = ['storefrontEvening', 'interiorBright', 'interiorCounter']

  return photo(TRIBE_PHOTOS[slug] ?? fallbacks[seedIndex(slug, fallbacks.length)]!, width)
}

const MENU_PHOTOS: Array<[RegExp, PhotoKey]> = [
  [/taco/i, 'eggsBacon'],
  [/salmon|toast/i, 'toastEgg'],
  [/oat/i, 'oats'],
  [/farmhouse|plate/i, 'brunchTable'],
  [/harvest|goddess/i, 'bowlSalad'],
  [/mediterranean|bowl box/i, 'bowlPair'],
  [/chicken|bowl/i, 'bowlRice'],
  [/brie|club|sandwich box/i, 'clubSandwich'],
  [/caprese|melt|grilled cheese/i, 'baguette'],
  [/mini sandwich/i, 'miniSandwiches'],
  [/croissant/i, 'croissantTray'],
  [/muffin/i, 'breadTray'],
  [/cookie/i, 'cookies'],
  [/latte|traveler/i, 'latteLeaf'],
  [/cold brew/i, 'coffeePour'],
  [/lemonade/i, 'lemonade'],
  [/pancake/i, 'brunchSpread'],
  [/garden board/i, 'boardDips'],
  [/grazing|board/i, 'boardGourmet'],
  [/dessert/i, 'dessertBuffet'],
  [/tray/i, 'cateringSpread']
]

export function menuPhoto(name: string, width = 800): string {
  const match = MENU_PHOTOS.find(([pattern]) => pattern.test(name))

  return photo(match ? match[1] : 'brunchSpread', width, 4 / 3)
}

const WORK_PHOTOS: PhotoKey[] = [
  'banquet',
  'buffet',
  'cateringTable',
  'platingGloves',
  'dessertTable',
  'cateringSpread',
  'boardGrapes',
  'dinersTable'
]

export function workPhoto(seed: string, width = 900): string {
  return photo(WORK_PHOTOS[seedIndex(seed, WORK_PHOTOS.length)]!, width, 4 / 3)
}

const PEOPLE_PHOTOS: PhotoKey[] = [
  'ownerCounter',
  'ownerSmile',
  'baristaSmile',
  'ownerServing',
  'baristaCounter',
  'chef'
]

export function personPhoto(seed: string, width = 500): string {
  return photo(PEOPLE_PHOTOS[seedIndex(seed, PEOPLE_PHOTOS.length)]!, width, 1)
}

const ARTICLE_PHOTOS: PhotoKey[] = [
  'latteArt',
  'boardClassic',
  'bowlPair',
  'macarons',
  'croissants',
  'friendsTable',
  'kitchen',
  'latteFlatLay'
]

export function articlePhoto(seed: string, width = 900): string {
  return photo(ARTICLE_PHOTOS[seedIndex(seed, ARTICLE_PHOTOS.length)]!, width, 3 / 2)
}

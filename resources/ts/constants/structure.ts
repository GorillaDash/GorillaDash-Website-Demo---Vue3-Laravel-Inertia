/**
 * What Structure view says about each block: the Gorilla Dash module that owns the
 * content, the GraphQL query the site reads it with, and where a franchisor edits it.
 * Brand-neutral on purpose; these labels are what a prospect reads at the stand.
 */
export type StructureInfo = {
  module: string
  query: string
  edit: string
  scope: 'Organisation' | 'Tribe'
}

export const STRUCTURE = {
  franchiseBanner: {
    module: 'Website Sections',
    query: 'websiteSection(name: "Franchise Banner")',
    edit: 'Websites › Sections › Franchise Banner',
    scope: 'Organisation'
  },
  mainMenu: {
    module: 'Website Menus',
    query: 'websiteMenu(name: "Main Menu")',
    edit: 'Websites › Menus › Main Menu',
    scope: 'Organisation'
  },
  footer: {
    module: 'Website Menus + Sections',
    query: 'websiteMenu(name: "Footer Menu") · websiteSection(name: "Site Footer")',
    edit: 'Websites › Menus and Sections',
    scope: 'Organisation'
  },
  page: {
    module: 'Website Pages',
    query: 'websitePage(slug)',
    edit: 'Websites › Pages',
    scope: 'Organisation'
  },
  networkStats: {
    module: 'Tribes + Reviews',
    query: 'tribes(status: "all") · reviews',
    edit: 'Calculated live from tribes and reviews',
    scope: 'Organisation'
  },
  foodMenu: {
    module: 'Food Menus',
    query: 'foodMenu(name: "Website Menu")',
    edit: 'Food › Menus › Website Menu',
    scope: 'Organisation'
  },
  cateringMenu: {
    module: 'Food Menus',
    query: 'foodMenu(name: "Catering Menu")',
    edit: 'Food › Menus › Catering Menu',
    scope: 'Organisation'
  },
  organisationOurWork: {
    module: 'Our Work',
    query: 'organisationOurWorks(featured: true)',
    edit: 'Marketing › Our Work',
    scope: 'Organisation'
  },
  tribeOurWork: {
    module: 'Our Work',
    query: 'ourWorks(tribe_slug)',
    edit: 'Tribe › Marketing › Our Work',
    scope: 'Tribe'
  },
  tribeFinder: {
    module: 'Tribes',
    query: 'tribes(name: "Juniper Table Cafes", status: "all")',
    edit: 'Tribes › Directory',
    scope: 'Organisation'
  },
  tribeDetails: {
    module: 'Tribes',
    query: 'tribe(slug)',
    edit: 'Tribe › Settings › Details and Opening Hours',
    scope: 'Tribe'
  },
  tribeTeam: {
    module: 'Organisation Chart',
    query: 'tribe(slug) { teamMembers(active: true) }',
    edit: 'Tribe › Team Members',
    scope: 'Tribe'
  },
  reviews: {
    module: 'Reviews',
    query: 'reviews(featured: true)',
    edit: 'Reputation › Reviews',
    scope: 'Organisation'
  },
  tribeReviews: {
    module: 'Reviews',
    query: 'reviews(tribe_slug)',
    edit: 'Tribe › Reputation › Reviews',
    scope: 'Tribe'
  },
  articles: {
    module: 'Articles',
    query: 'articlesPagination(status: "Published")',
    edit: 'Marketing › Articles',
    scope: 'Organisation'
  }
} as const satisfies Record<string, StructureInfo>

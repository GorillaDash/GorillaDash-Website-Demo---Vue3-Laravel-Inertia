/**
 * Prop contract for the homepage hero.
 *
 * Sections stay presentational: the page maps CMS content values onto these
 * shapes, so a component never reaches for the CMS itself. Add a shape here per
 * section as the client's homepage grows.
 */

export interface CtaLink {
  label: string
  href: string
}

export interface HeroContent {
  heading: string
  subheading: string
  /** Background image URL from the CMS; the hero falls back to its own asset. */
  image: string
  cta: CtaLink
}

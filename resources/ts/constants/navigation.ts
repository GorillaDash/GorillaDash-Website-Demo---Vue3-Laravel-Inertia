/**
 * Centralised navigation config for the site chrome (header + footer).
 *
 * Keeping the link structure here means the Header/Footer components stay
 * presentational, and when real routes are wired up only this file changes.
 * Internal `href`s are placeholders (`#`) until their pages/routes exist.
 */

export type NavLink = {
  label: string
  href: string
  /** External links open in a new tab and render as a plain anchor. */
  external?: boolean
  /** Second-level menu. When present the header renders a styled dropdown (desktop) / accordion (mobile). */
  children?: NavLink[]
}

export type FooterColumn = {
  heading?: string
  links: NavLink[]
}

/** Footer link columns (mirrors the three-column block in the design). */
export const footerColumns: FooterColumn[] = [
  {
    links: [
      { label: 'Menu', href: '#' },
      { label: 'Locations', href: '#' },
      { label: 'Our Story', href: '#' },
      { label: 'Nutrition Info', href: '#' }
    ]
  },
  {
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'In the News', href: '#' }
    ]
  },
  {
    links: [
      { label: 'Account', href: '#' },
      { label: 'Franchise', href: '#' },
      { label: 'Become a Vendor', href: '#' },
      { label: 'Gift Cards', href: '#' }
    ]
  }
]

/** Bottom-bar legal links (all external). */
export const legalLinks: NavLink[] = [
  { label: 'GDPR', href: 'https://unitedfranchisegroup.com/trust/gdpr/', external: true },
  { label: 'In The News', href: 'https://www.acme-usa.example.com/news', external: true },
  { label: 'Terms of Service', href: 'https://policies.google.com/terms', external: true }
]

export type SocialLink = NavLink & { icon: 'instagram' | 'facebook' }

/** Social icons in the footer bottom bar. */
export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: '#', external: true, icon: 'instagram' },
  { label: 'Facebook', href: '#', external: true, icon: 'facebook' }
]

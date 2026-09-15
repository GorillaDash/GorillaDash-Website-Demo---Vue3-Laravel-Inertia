export type WebsiteMenuType = {
  id: number
  name: string
  children: WebsiteMenuItemType[]
}

export type WebsiteMenuItemType = {
  id: number
  label: string
  name: string
  value: string
  url: string
  path: string
  type:
    | 'Internal Url'
    | 'External Url'
    | 'Placeholder'
    | 'Product'
    | 'Category'
    | 'Range'
    | 'Website Page'
  image: string[]
  use_custom_image: boolean
  url_target: string
  children: WebsiteMenuItemType[]
}

export type MediaUrlType = {
  name: string
  media: {
    banner: string
    default: string
    original_cropped: string
    portrait: string
    rectangle: string
    square: string
  }[]
}

export const mapMenu = (menu: WebsiteMenuType): WebsiteMenuType => {
  return {
    id: menu.id,
    name: menu.name,
    children: menu.children.map((item: WebsiteMenuItemType) => {
      return mapMenuItem(item)
    })
  }
}

export const mapMenuItem = (
  item: WebsiteMenuItemType & { media_url?: MediaUrlType[] }
): WebsiteMenuItemType => {
  let image = item.image
  if (item.use_custom_image && item.media_url && item.media_url.length > 0) {
    const square = item.media_url[0]!.media[0]?.square
    image = square ? [square] : []
  }
  return {
    id: item.id,
    label: item.name ?? item.label,
    name: item.label,
    value: item.value,
    url: item.url,
    path: item.path,
    image: image,
    type: item.type,
    use_custom_image: item.use_custom_image,
    url_target: item.url_target || '_self',
    children: item.children.map((sub: WebsiteMenuItemType) => mapMenuItem(sub))
  }
}

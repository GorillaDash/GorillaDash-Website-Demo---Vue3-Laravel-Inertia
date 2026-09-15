export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JsonParser: { input: unknown; output: unknown; }
};

/** The bookable appointment times for one appointment type at a tribe on one date. */
export type AppointmentAvailableTime = {
  __typename?: 'AppointmentAvailableTime';
  /** The date the times apply to, as passed to the query. */
  date: Maybe<Scalars['String']['output']>;
  /** When the organisation's content last changed; the same value the `lastUpdatedAt` query returns. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Every slot within the tribe's opening hours for that date, as a list of objects with `enable` (false when an existing appointment already covers the slot), `text` (for display, for example `09:30 am`) and `value` (24-hour `HH:MM`). */
  times: Maybe<Scalars['JsonParser']['output']>;
  /** The appointment type name, as passed to the query. */
  type: Maybe<Scalars['String']['output']>;
};

/** A blog or news article, with its copy, SEO fields, categories and images. */
export type Article = {
  __typename?: 'Article';
  /** A short summary of the article. */
  abstract: Maybe<Scalars['String']['output']>;
  /** The article body. */
  article: Maybe<Scalars['String']['output']>;
  /** Extra fields defined by the article's page template, with their values. */
  articleFields: Maybe<Array<Maybe<ArticleFields>>>;
  /** Article categories */
  article_categories: Array<ArticleCategory>;
  /** Article author */
  author: Maybe<Scalars['String']['output']>;
  /** When the article was created. */
  created_at: Maybe<Scalars['String']['output']>;
  /** Whether the article uses a blog page template written with the visual editor. */
  editor_enabled: Maybe<Scalars['Boolean']['output']>;
  /** A table of key facts about the article, as JSON. */
  facts_table: Maybe<Scalars['JsonParser']['output']>;
  /** Other published articles that feature the same website page, newest first. Only filled in for Gorilla Dash's own website; empty for every other organisation. */
  feature_related_articles: Array<Article>;
  /** The website page this article features, if any. */
  feature_website_page: Maybe<WebsitePage>;
  /** The id of the website page this article features, if any. */
  feature_website_page_id: Maybe<Scalars['Int']['output']>;
  /** Gorilla Dash news links (people and businesses mentioned) attached to the article. */
  gorilla_news_links: Array<GorillaNewsLink>;
  /** Article heading */
  heading: Scalars['String']['output'];
  /** The article body as HTML, when the article is written with the visual editor. */
  html: Maybe<Scalars['String']['output']>;
  /** Whether this is a tribe's customised copy of an organisation article. */
  is_customised: Maybe<Scalars['Boolean']['output']>;
  /** Whether this is an organisation-level article rather than one written only for specific tribes. Also true for a tribe's customised copy of an organisation article. */
  is_organisation: Maybe<Scalars['Boolean']['output']>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The canonical URL for the article, when one is set. */
  meta_canonical: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** The next (newer) published article in the same listing. Only available when fetching a single article; requesting it inside a list returns an error. */
  next: Maybe<Article>;
  /** Whether search engines should be told not to index the article. */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** The previous (older) published article in the same listing. Only available when fetching a single article; requesting it inside a list returns an error. */
  prev: Maybe<Article>;
  /** Other published articles that share a news link with this one, newest first. Only filled in for Gorilla Dash's own website; empty for every other organisation. */
  related_articles: Array<Article>;
  /** Article slug */
  slug: Scalars['String']['output'];
  /** The article's publishing status: `Published`, `Draft` or `Deleted`. */
  status: Maybe<Scalars['String']['output']>;
  /** Article sub heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Short key points to show at the top of the article. */
  top_bullet_points: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** When the article itself was last saved. */
  updated_at: Maybe<Scalars['String']['output']>;
};


/** A blog or news article, with its copy, SEO fields, categories and images. */
export type ArticleFeature_Related_ArticlesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


/** A blog or news article, with its copy, SEO fields, categories and images. */
export type ArticleMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A blog or news article, with its copy, SEO fields, categories and images. */
export type ArticleNextArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A blog or news article, with its copy, SEO fields, categories and images. */
export type ArticlePrevArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A blog or news article, with its copy, SEO fields, categories and images. */
export type ArticleRelated_ArticlesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};

/** A category that groups articles, with its heading, caption and images. */
export type ArticleCategory = {
  __typename?: 'ArticleCategory';
  /** Articles in the category, newest first. */
  articles: Maybe<Array<Maybe<Article>>>;
  /** Articles in the category, newest first, one page at a time. */
  articlesPagination: Maybe<ArticlePagination>;
  /** Number of articles in the category. */
  articles_count: Scalars['Int']['output'];
  /** Article category caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Article category heading */
  heading: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** Article category name */
  name: Maybe<Scalars['String']['output']>;
  /** Article category slug */
  slug: Maybe<Scalars['String']['output']>;
};


/** A category that groups articles, with its heading, caption and images. */
export type ArticleCategoryArticlesArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};


/** A category that groups articles, with its heading, caption and images. */
export type ArticleCategoryArticlesPaginationArgs = {
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


/** A category that groups articles, with its heading, caption and images. */
export type ArticleCategoryMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ArticlePagination = {
  __typename?: 'ArticlePagination';
  /** Current page of the cursor */
  current_page: Scalars['Int']['output'];
  /** List of items on the current page */
  data: Array<Article>;
  /** Number of the first item returned */
  from: Maybe<Scalars['Int']['output']>;
  /** Determines if cursor has more pages after the current page */
  has_more_pages: Scalars['Boolean']['output'];
  /** The last page (number of pages) */
  last_page: Scalars['Int']['output'];
  /** Number of items returned per page */
  per_page: Scalars['Int']['output'];
  /** Number of the last item returned */
  to: Maybe<Scalars['Int']['output']>;
  /** Number of total items selected by the query */
  total: Scalars['Int']['output'];
};

/** A source the chatbot used for its reply, such as a website page or a tribe. */
export type ChatbotCitation = {
  __typename?: 'ChatbotCitation';
  /** The title of the source. */
  heading: Maybe<Scalars['String']['output']>;
  /** The id of the source record. */
  id: Maybe<Scalars['String']['output']>;
  /** The kind of source, for example `tribe`. */
  source_type: Maybe<Scalars['String']['output']>;
  /** The URL of the source, when it has one. */
  url: Maybe<Scalars['String']['output']>;
};

/** The chatbot's reply to a website visitor, with the conversation token and any tribes or sources it refers to. */
export type ChatbotReply = {
  __typename?: 'ChatbotReply';
  /** The sources the chatbot used for this reply. */
  citations: Maybe<Array<Maybe<ChatbotCitation>>>;
  /** The chatbot's greeting when a conversation is started; otherwise null. */
  greeting: Maybe<Scalars['String']['output']>;
  /** Whether this reply captured the visitor's details as an enquiry. */
  lead_captured: Maybe<Scalars['Boolean']['output']>;
  /** The chatbot's reply text. When a conversation starts without a first message, this is the greeting. */
  reply: Maybe<Scalars['String']['output']>;
  /** The token for this conversation. Send it with the visitor's next message to continue the same conversation. */
  session_token: Maybe<Scalars['String']['output']>;
  /** Tribes the chatbot suggested in this reply. */
  suggested_tribes: Maybe<Array<Maybe<ChatbotSuggestedTribe>>>;
  /** The tribe the conversation is tied to, if any. */
  tribe: Maybe<ChatbotSuggestedTribe>;
  /** Whether suggested_tribes is a choice to put to the visitor (render them as selectable locations) rather than background context. */
  tribe_choice: Maybe<Scalars['Boolean']['output']>;
};

/** A tribe, one location of the organisation, that the chatbot suggested or tied the conversation to. */
export type ChatbotSuggestedTribe = {
  __typename?: 'ChatbotSuggestedTribe';
  /** Straight-line distance from the visitor in statute miles. Null when no distance was calculated. */
  distance: Maybe<Scalars['Float']['output']>;
  /** Straight-line distance from the visitor in kilometres. */
  distance_km: Maybe<Scalars['Float']['output']>;
  /** That distance ready to show a visitor, in the unit the business's country uses (e.g. "24 km", "15 miles"). */
  distance_label: Maybe<Scalars['String']['output']>;
  /** The tribe id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The tribe's suburb, town or city. */
  locality: Maybe<Scalars['String']['output']>;
  /** The tribe's name. */
  name: Maybe<Scalars['String']['output']>;
  /** The tribe's URL slug. */
  slug: Maybe<Scalars['String']['output']>;
};

/** A reusable block of content created by the organisation, with its named contents and the products, ranges, categories and tribes it relates to. */
export type Component = {
  __typename?: 'Component';
  /** Component contents */
  contents: Array<ComponentContent>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Component name */
  name: Maybe<Scalars['String']['output']>;
  /** Product categories linked to the component. */
  product_categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product ranges linked to the component. */
  product_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Products linked to the component. */
  products: Maybe<Array<Maybe<Product>>>;
  /** Related product categories */
  related_product_categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Related product ranges */
  related_product_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Related products */
  related_products: Maybe<Array<Maybe<Product>>>;
  /** Related tribes */
  related_tribes: Maybe<Array<Maybe<Tribe>>>;
  /** Component slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Component status */
  status: Maybe<Scalars['String']['output']>;
};


/** A reusable block of content created by the organisation, with its named contents and the products, ranges, categories and tribes it relates to. */
export type ComponentContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** One named value inside a component, such as a heading, a block of text or a gallery. */
export type ComponentContent = {
  __typename?: 'ComponentContent';
  /** The start of the current day, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** The content type, for example `Short Text`, `Rich Text`, `Date`, `Single Image` or `Gallery`. */
  type: Maybe<Scalars['String']['output']>;
  /** The text value in the requested locale. Null for image content; read `media_collection` instead. */
  value: Maybe<Scalars['String']['output']>;
};


/** One named value inside a component, such as a heading, a block of text or a gallery. */
export type ComponentContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ComponentPagination = {
  __typename?: 'ComponentPagination';
  /** Current page of the cursor */
  current_page: Scalars['Int']['output'];
  /** List of items on the current page */
  data: Array<Component>;
  /** Number of the first item returned */
  from: Maybe<Scalars['Int']['output']>;
  /** Determines if cursor has more pages after the current page */
  has_more_pages: Scalars['Boolean']['output'];
  /** The last page (number of pages) */
  last_page: Scalars['Int']['output'];
  /** Number of items returned per page */
  per_page: Scalars['Int']['output'];
  /** Number of the last item returned */
  to: Maybe<Scalars['Int']['output']>;
  /** Number of total items selected by the query */
  total: Scalars['Int']['output'];
};

/** A type of reusable content component defined by the organisation, with the components created from it. */
export type ComponentType = {
  __typename?: 'ComponentType';
  /** The base path configured for this component type. */
  base_path: Maybe<Scalars['String']['output']>;
  /** The components of this type, in their saved order. */
  components: Array<Component>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Component type name */
  name: Maybe<Scalars['String']['output']>;
  /** Component type status */
  status: Maybe<Scalars['String']['output']>;
};


/** A type of reusable content component defined by the organisation, with the components created from it. */
export type ComponentTypeComponentsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};

/** Special opening hours for a tribe on one date, such as a public holiday. */
export type CustomOpeningHour = {
  __typename?: 'CustomOpeningHour';
  /** The closing time. Uses 12-hour format, for example `5:30 pm`, when the tribe is set to 12-hour time. */
  close: Scalars['String']['output'];
  /** The date the special hours apply to. */
  date: Scalars['String']['output'];
  /** The name of the occasion, for example a public holiday. */
  name: Scalars['String']['output'];
  /** The opening time. Uses 12-hour format, for example `9:00 am`, when the tribe is set to 12-hour time. */
  open: Scalars['String']['output'];
  /** The id of the organisation the tribe belongs to. */
  organisation_id: Scalars['Int']['output'];
  /** The id of the tribe the hours apply to. */
  tribe_id: Scalars['Int']['output'];
};

/** An enquiry form and its fields. */
export type EnquiryForm = {
  __typename?: 'EnquiryForm';
  /** The fields on the form. */
  fields: Array<EnquiryFormField>;
  /** The form's name. */
  name: Scalars['String']['output'];
};

/** One field on an enquiry form. */
export type EnquiryFormField = {
  __typename?: 'EnquiryFormField';
  /** The field's name. */
  name: Scalars['String']['output'];
  /** The field's type. */
  type: Scalars['String']['output'];
  /** The field's value or options, as JSON. */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** An ingredient used in food products, with its unit of measurement. */
export type FoodComponent = {
  __typename?: 'FoodComponent';
  /** The unit the ingredient is measured in. */
  measurement: Scalars['String']['output'];
  /** The measurement size that goes with `measurement`. */
  measurement_size: Scalars['String']['output'];
  /** The ingredient's name. */
  name: Scalars['String']['output'];
};

/** A food ordering coupon, with its discount, validity dates, minimum spend and usage limits. */
export type FoodCoupon = {
  __typename?: 'FoodCoupon';
  /** The code customers enter to use the coupon. */
  code: Scalars['String']['output'];
  /** When the coupon stops being valid. Ignore it when `no_end_date` is true. */
  end_date: Maybe<Scalars['String']['output']>;
  /** The food coupon id */
  id: Scalars['Int']['output'];
  /** The smallest order amount the coupon can be used on, in whole currency units. */
  minimum_spend: Scalars['Int']['output'];
  /** The name of the food coupon */
  name: Scalars['String']['output'];
  /** Whether the coupon never expires. */
  no_end_date: Scalars['Boolean']['output'];
  /** How many times the coupon can be used in total. Ignore it when `quantity_unlimited` is true. */
  quantity: Maybe<Scalars['Int']['output']>;
  /** Whether one customer can use the coupon any number of times. */
  quantity_customer_unlimited: Scalars['Boolean']['output'];
  /** How many times one customer can use the coupon. Ignore it when `quantity_customer_unlimited` is true. */
  quantity_per_customer: Maybe<Scalars['Int']['output']>;
  /** Whether the coupon can be used any number of times. */
  quantity_unlimited: Scalars['Boolean']['output'];
  /** When the coupon becomes valid. */
  start_date: Maybe<Scalars['String']['output']>;
  /** The coupon status: `Active`, `Paused` or `Deleted`. */
  status: Scalars['String']['output'];
  /** The tribes the coupon can be used at. */
  tribes: Maybe<Array<Tribe>>;
  /** The coupon type: `Percent Discount`, `Amount Discount` or `Menu Item`. */
  type: Scalars['String']['output'];
  /** The coupon's value: a percentage for `Percent Discount` coupons, or an amount in whole currency units for `Amount Discount` coupons. */
  value: Scalars['Int']['output'];
};

/** The result of checking a food coupon code against an order amount at a tribe, with the discount it gives. */
export type FoodCouponAvailable = {
  __typename?: 'FoodCouponAvailable';
  /** The order amount after the discount, in the smallest currency unit (for example cents). */
  amount: Scalars['Int']['output'];
  /** The code of the food coupon */
  code: Scalars['String']['output'];
  /** The discount the coupon gives, in the smallest currency unit (for example cents). Zero for `Menu Item` coupons. */
  discount_amount: Scalars['Int']['output'];
  /** The free menu item the coupon gives, for `Menu Item` coupons; otherwise null. */
  food_menu_item: Maybe<FoodMenuItem>;
  /** The id of the food coupon */
  id: Scalars['Int']['output'];
  /** The order amount the coupon was checked against, in the smallest currency unit (for example cents). */
  origin_amount: Scalars['Int']['output'];
  /** The coupon type: `Percent Discount`, `Amount Discount` or `Menu Item`. */
  type: Scalars['String']['output'];
  /** The coupon's value: a percentage for `Percent Discount` coupons, or an amount in whole currency units for `Amount Discount` coupons. */
  value: Scalars['Int']['output'];
};

/** A food menu, made up of ordered sections. */
export type FoodMenu = {
  __typename?: 'FoodMenu';
  /** The menu's sections, in their saved order. */
  foodMenuSections: Maybe<Array<FoodMenuSection>>;
  /** The menu's name. */
  name: Maybe<Scalars['String']['output']>;
};

/** A dish or drink that can be ordered, with its prices, nutrition, options and images. */
export type FoodMenuItem = {
  __typename?: 'FoodMenuItem';
  /** The item's allergy statement, in the requested locale. */
  allergy_statement: Maybe<Scalars['String']['output']>;
  /** Energy per serving in Calories (kcal), converted when entered in kilojoules */
  calories: Maybe<Scalars['Float']['output']>;
  /** The item's default price, in major currency units (for example dollars). */
  default_price: Scalars['Float']['output'];
  /** The item's description, in the requested locale. */
  description: Maybe<Scalars['String']['output']>;
  /** Unit the energy was entered in — `kcal` or `kJ` */
  energy_unit: Maybe<Scalars['String']['output']>;
  /** Energy per serving, as entered by the operator */
  energy_value: Maybe<Scalars['Float']['output']>;
  /** Attributes such as vegetarian or gluten free. */
  foodAttributes: Array<FoodMenuItemAttribute>;
  /** Groups of options customers choose from, such as sizes or extras. */
  foodModifierGroups: Array<FoodModifierGroup>;
  /** The food products the item is made from. */
  foodProducts: Array<FoodProduct>;
  /** Food menu item id */
  id: Scalars['Int']['output'];
  /** Energy per serving in kilojoules, converted when entered in Calories (kcal) */
  kilojoules: Maybe<Scalars['Float']['output']>;
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The item's name, in the requested locale. */
  name: Scalars['String']['output'];
  /** Text describing the item's photo, in the requested locale. */
  photo_description: Maybe<Scalars['String']['output']>;
  /** The item's price on this menu entry, in major currency units (for example dollars): the entry's own price when one is set, otherwise `default_price`. */
  price: Scalars['Float']['output'];
  /** Unit the serving size is measured in, e.g. g, oz, ml, slice */
  serving_size_measure: Maybe<Scalars['String']['output']>;
  /** Nutrition serving size the figures below are measured over */
  serving_size_quantity: Maybe<Scalars['Float']['output']>;
  /** Sort position within the menu entry. */
  sort: Scalars['Int']['output'];
  /** The price and availability of the item at the tribe given by `tribe_slug`, for this menu entry. */
  tribeFoodMenuPrice: Maybe<FoodMenuItemTribePrice>;
};


/** A dish or drink that can be ordered, with its prices, nutrition, options and images. */
export type FoodMenuItemMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A dish or drink that can be ordered, with its prices, nutrition, options and images. */
export type FoodMenuItemTribeFoodMenuPriceArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};

/** A dietary or product attribute shown on menu items, such as vegetarian or gluten free, with its icon. */
export type FoodMenuItemAttribute = {
  __typename?: 'FoodMenuItemAttribute';
  /** Food menu item attribute id */
  id: Scalars['Int']['output'];
  /** The attribute's icon images. Returns the `icon` collection unless `size` names other collections. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The attribute's name. */
  name: Scalars['String']['output'];
};


/** A dietary or product attribute shown on menu items, such as vegetarian or gluten free, with its icon. */
export type FoodMenuItemAttributeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A tribe's own price and availability for a menu item. */
export type FoodMenuItemTribePrice = {
  __typename?: 'FoodMenuItemTribePrice';
  /** Whether the item is available at the tribe. */
  enabled: Maybe<Scalars['Boolean']['output']>;
  /** A link for ordering the item from this tribe on an external ordering site. */
  external_order_url: Maybe<Scalars['String']['output']>;
  /** The tribe's price for the item, in major currency units (for example dollars). */
  price: Maybe<Scalars['Float']['output']>;
  /** Whether the tribe uses the item's default price instead of `price`. */
  use_default_price: Maybe<Scalars['Boolean']['output']>;
};

/** An entry on a food menu, either a single dish or a group of dishes, with its menu items, pairings and ordering link. */
export type FoodMenuListItem = {
  __typename?: 'FoodMenuListItem';
  /** The entry's description, in the requested locale. */
  description: Maybe<Scalars['String']['output']>;
  /** A link for ordering this entry from the tribe given by `tribe_slug` on an external ordering site. Built from the organisation's online ordering settings when the entry has no link of its own. Null when no `tribe_slug` is given or a working link cannot be built. */
  external_order_url: Maybe<Scalars['String']['output']>;
  /** The dishes in the entry, with the prices and sort order set on this entry. */
  foodMenuItems: Array<FoodMenuItem>;
  /** The menu section the entry belongs to. */
  foodMenuSection: FoodMenuSection;
  /** Food menu list item id */
  id: Scalars['Int']['output'];
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The entry's name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Paired food menu list items, in their configured sort order */
  pairings: Array<FoodMenuListItem>;
  /** Text describing the entry's photo, in the requested locale. */
  photo_description: Maybe<Scalars['String']['output']>;
  /** The entry's URL slug. */
  slug: Scalars['String']['output'];
  /** Sort position within the menu section. */
  sort: Maybe<Scalars['Int']['output']>;
  /** The entry's status. */
  status: Maybe<Scalars['String']['output']>;
  /** The entry type: `single` for one dish or `group` for a choice of dishes. */
  type: Maybe<Scalars['String']['output']>;
};


/** An entry on a food menu, either a single dish or a group of dishes, with its menu items, pairings and ordering link. */
export type FoodMenuListItemExternal_Order_UrlArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** An entry on a food menu, either a single dish or a group of dishes, with its menu items, pairings and ordering link. */
export type FoodMenuListItemMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** An entry on a food menu, either a single dish or a group of dishes, with its menu items, pairings and ordering link. */
export type FoodMenuListItemPairingsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};

/** A section of a food menu, such as starters or drinks, with its entries. */
export type FoodMenuSection = {
  __typename?: 'FoodMenuSection';
  /** The section's description, in the requested locale. */
  description: Maybe<Scalars['String']['output']>;
  /** The entries in the section. */
  foodMenuListItems: Array<FoodMenuListItem>;
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The section's name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Whether the section should appear in the menu's section navigation. */
  show_on_nav: Scalars['Boolean']['output'];
  /** The section's URL slug. */
  slug: Scalars['String']['output'];
  /** Sort position within the menu. */
  sort: Maybe<Scalars['Int']['output']>;
};


/** A section of a food menu, such as starters or drinks, with its entries. */
export type FoodMenuSectionFoodMenuListItemsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};


/** A section of a food menu, such as starters or drinks, with its entries. */
export type FoodMenuSectionMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** One option in a modifier group, such as a size or an extra topping. */
export type FoodModifier = {
  __typename?: 'FoodModifier';
  /** Food modifier id */
  id: Scalars['Int']['output'];
  /** The option label shown to customers. */
  label: Scalars['String']['output'];
  /** Whether the option is linked to a product. */
  link_product: Scalars['Boolean']['output'];
  /** The extra charge for the option, in major currency units (for example dollars). */
  price: Scalars['Float']['output'];
  /** The option's quantity. */
  quantity: Scalars['Float']['output'];
};

/** A group of options customers choose from for a menu item, such as sizes or extras, with its selection rules. */
export type FoodModifierGroup = {
  __typename?: 'FoodModifierGroup';
  /** Whether customers can choose a quantity of each option. */
  enable_qty: Maybe<Scalars['Boolean']['output']>;
  /** The options in the group. */
  foodModifiers: Array<FoodModifier>;
  /** Food modifier group id */
  id: Scalars['Int']['output'];
  /** The label shown to customers. */
  label: Maybe<Scalars['String']['output']>;
  /** The most options a customer may choose. */
  maximum_selection: Maybe<Scalars['Int']['output']>;
  /** The fewest options a customer must choose. */
  minimum_selection: Maybe<Scalars['Int']['output']>;
  /** The group's name. */
  name: Scalars['String']['output'];
  /** Whether there is no maximum number of options. */
  no_maximum: Maybe<Scalars['Boolean']['output']>;
  /** Whether there is no minimum number of options. */
  no_minimum: Maybe<Scalars['Boolean']['output']>;
};

/** An online food ordering portal set up for a customer, with its menu and contact details. */
export type FoodOrderingPortal = {
  __typename?: 'FoodOrderingPortal';
  /** The email address of the customer's main contact. */
  customer_main_contact_email: Maybe<Scalars['String']['output']>;
  /** The name of the customer's main contact. */
  customer_main_contact_name: Maybe<Scalars['String']['output']>;
  /** The telephone number of the customer's main contact, as entered. */
  customer_main_contact_telephone: Maybe<Scalars['String']['output']>;
  /** The portal's description. */
  description: Maybe<Scalars['String']['output']>;
  /** The food menu customers order from. */
  foodMenu: Maybe<FoodMenu>;
  /** The heading shown at the top of the portal. */
  heading: Maybe<Scalars['String']['output']>;
  /** The portal's name. */
  name: Scalars['String']['output'];
  /** Whether search engines should be told not to index the portal. */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** Instructions shown to people placing an order. */
  ordering_instructions: Maybe<Scalars['String']['output']>;
  /** How orders from the portal are processed, for example `Online Order`. */
  sales_flow: Maybe<Scalars['String']['output']>;
  /** The portal's URL slug. */
  slug: Scalars['String']['output'];
  /** The portal's status. */
  status: Scalars['String']['output'];
  /** The sub heading shown under the heading. */
  sub_heading: Maybe<Scalars['String']['output']>;
};

/** A delivery or pickup location on a food ordering portal, with its address and contact details. */
export type FoodOrderingPortalLocation = {
  __typename?: 'FoodOrderingPortalLocation';
  /** The first line of the street address. */
  address_1: Maybe<Scalars['String']['output']>;
  /** The second line of the street address. */
  address_2: Maybe<Scalars['String']['output']>;
  /** Whether orders can be delivered. */
  allow_delivery: Maybe<Scalars['Boolean']['output']>;
  /** Whether customers can pick up orders. */
  allow_pickup: Maybe<Scalars['Boolean']['output']>;
  /** The email address of the contact at the location. */
  contact_email: Maybe<Scalars['String']['output']>;
  /** The name of the contact at the location. */
  contact_name: Maybe<Scalars['String']['output']>;
  /** The country. */
  country: Maybe<Scalars['String']['output']>;
  /** The location's id in an external system. */
  external_id: Maybe<Scalars['String']['output']>;
  /** The suburb, town or city. */
  locality: Maybe<Scalars['String']['output']>;
  /** The location's name. */
  name: Scalars['String']['output'];
  /** Notes about the location. */
  notes: Maybe<Scalars['String']['output']>;
  /** The postcode. */
  postcode: Maybe<Scalars['String']['output']>;
  /** The state or province. */
  state: Maybe<Scalars['String']['output']>;
  /** The location's status. */
  status: Scalars['String']['output'];
  /** The location's telephone number in E.164 format, for example `+61412345678`. */
  telephone_e164: Maybe<Scalars['String']['output']>;
  /** The tribe that fulfils orders for this location. */
  tribe: Maybe<Tribe>;
  /** The id of the tribe that fulfils orders for this location. */
  tribe_id: Maybe<Scalars['Int']['output']>;
};

/** A food product that menu items are made from, with its ingredients and images. */
export type FoodProduct = {
  __typename?: 'FoodProduct';
  /** The product's description. */
  description: Maybe<Scalars['String']['output']>;
  /** The ingredients in the product, with the quantity of each. */
  foodProductComponents: Array<FoodProductComponent>;
  /** Food product id */
  id: Scalars['Int']['output'];
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The product's name. */
  name: Scalars['String']['output'];
};


/** A food product that menu items are made from, with its ingredients and images. */
export type FoodProductMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** An ingredient used in a food product, with the quantity used. */
export type FoodProductComponent = {
  __typename?: 'FoodProductComponent';
  /** The ingredient. */
  foodComponent: FoodComponent;
  /** The unit the quantity is measured in. */
  measurement: Scalars['String']['output'];
  /** The measurement size that goes with `measurement`. */
  measurement_size: Scalars['String']['output'];
  /** The quantity of the ingredient used. */
  quantity: Scalars['Float']['output'];
};

/** A visitor's food shopping cart. */
export type FoodShoppingCart = {
  __typename?: 'FoodShoppingCart';
  /** The items in the cart. */
  foodShoppingCartItems: Maybe<Array<FoodShoppingCartItem>>;
  /** The session id the cart belongs to. */
  session_id: Scalars['String']['output'];
};

/** An item in a food shopping cart, with the options chosen and its calculated prices. */
export type FoodShoppingCartItem = {
  __typename?: 'FoodShoppingCartItem';
  /** The dish that was added. */
  foodMenuItem: FoodMenuItem;
  /** The menu entry the item was added from. */
  foodMenuListItem: FoodMenuListItem;
  /** The options chosen for the item. */
  foodShoppingCartModifiers: Maybe<Array<FoodShoppingCartModifier>>;
  /** The id of the shopping cart item */
  id: Scalars['Int']['output'];
  /** The quantity of the shopping cart item */
  quantity: Scalars['Int']['output'];
  /** The unit price times the quantity, plus the chosen options, in major currency units (for example dollars), before tax is applied. */
  sub_total: Scalars['Float']['output'];
  /** The tax on this line, in major currency units (for example dollars), calculated from the store's tax settings. */
  tax: Scalars['Float']['output'];
  /** The line total after applying the store's tax settings, in major currency units (for example dollars). */
  total: Scalars['Float']['output'];
  /** The price of one item before options and tax, in major currency units (for example dollars), using the tribe's own price when it has one. */
  unit_price: Scalars['Float']['output'];
};

/** An option a customer chose for an item in their food shopping cart. */
export type FoodShoppingCartModifier = {
  __typename?: 'FoodShoppingCartModifier';
  /** The chosen option. */
  foodModifier: FoodModifier;
  /** The modifier group the option belongs to. */
  foodModifierGroup: FoodModifierGroup;
  /** How many of this option were chosen. */
  quantity: Scalars['Int']['output'];
};

/** The payment provider details needed to pay for a food shopping cart. */
export type FoodShoppingCartPaymentProvider = {
  __typename?: 'FoodShoppingCartPaymentProvider';
  /** The client secret used to confirm the payment in the browser. */
  payment_client_secret: Maybe<Scalars['String']['output']>;
  /** The payment provider's publishable key, for use in the browser. */
  public_key: Maybe<Scalars['String']['output']>;
};

/** The pickup or delivery times a tribe can offer for food orders on one date. */
export type FoodTribeAvailableTime = {
  __typename?: 'FoodTribeAvailableTime';
  /** The date the times apply to. */
  date: Maybe<Scalars['String']['output']>;
  /** Available times in 15-minute steps, as a list of objects with `text` (for display, for example `09:30 am`) and `value` (24-hour `HH:MM`). Allows for the store's preparation time and, when the store only delivers during opening hours, the tribe's opening and special hours. */
  times: Maybe<Scalars['JsonParser']['output']>;
};

/** A person or business mentioned in a Gorilla Dash news article, with links and hashtags for sharing. */
export type GorillaNewsLink = {
  __typename?: 'GorillaNewsLink';
  /** The hashtag to use when sharing on Facebook. */
  facebook_hashtag: Maybe<Scalars['String']['output']>;
  /** The URL of an image of the person or business. */
  image_url: Maybe<Scalars['String']['output']>;
  /** The URL the link points to. */
  link_url: Maybe<Scalars['String']['output']>;
  /** The hashtag to use when sharing on LinkedIn. */
  linkedin_hashtag: Maybe<Scalars['String']['output']>;
  /** The text of the link. */
  string: Maybe<Scalars['String']['output']>;
  /** Whether the link is for a `Person` or a `Business`. */
  type: Maybe<Scalars['String']['output']>;
};

/** A tribe's stock record for a product, with its price, quantity and custom data. */
export type Inventory = {
  __typename?: 'Inventory';
  /** Custom fields recorded for the stock. */
  customData: Maybe<Array<Maybe<InventoryCustomData>>>;
  /** A display name for the stock record. */
  friendly_name: Maybe<Scalars['String']['output']>;
  /** The stock record id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The quantity in stock. */
  quantity: Maybe<Scalars['Int']['output']>;
  /** The unit price, in major currency units (for example dollars). */
  unit_price: Maybe<Scalars['Float']['output']>;
  /** The product variant the stock is for, as JSON. */
  variants: Maybe<Scalars['JsonParser']['output']>;
};

/** A custom field on a tribe's stock record. */
export type InventoryCustomData = {
  __typename?: 'InventoryCustomData';
  /** The custom field name. */
  name: Maybe<Scalars['String']['output']>;
  /** The custom field type. */
  type: Maybe<Scalars['String']['output']>;
  /** The field value as JSON. For image fields, a list of objects with `name` and `media`, where `media` maps a collection name to an absolute CDN URL. */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** A customer who has logged in to the website, with their contact and address details. */
export type Login = {
  __typename?: 'Login';
  /** The first line of the street address. */
  address_1: Maybe<Scalars['String']['output']>;
  /** The second line of the street address. */
  address_2: Maybe<Scalars['String']['output']>;
  /** The country. */
  country: Maybe<Scalars['String']['output']>;
  /** The customer's email address. */
  email: Scalars['String']['output'];
  /** The customer's first name. */
  first_name: Scalars['String']['output'];
  /** The customer's last name. */
  last_name: Scalars['String']['output'];
  /** The suburb, town or city. */
  locality: Maybe<Scalars['String']['output']>;
  /** The customer's mobile number, as entered. */
  mobile: Maybe<Scalars['String']['output']>;
  /** The postal code. */
  postal_code: Maybe<Scalars['String']['output']>;
  /** The state or province. */
  state: Maybe<Scalars['String']['output']>;
};

/** A value stored against a customer login for an external platform. */
export type LoginAttribute = {
  __typename?: 'LoginAttribute';
  /** The attribute name. */
  attribute_name: Scalars['String']['output'];
  /** The stored value, as a string. */
  attribute_value: Maybe<Scalars['String']['output']>;
  /** The platform the value belongs to, for example `x2`. */
  platform: Scalars['String']['output'];
  /** How to read `attribute_value`: `string`, `boolean` or `json`. */
  type: Scalars['String']['output'];
};

/** A token that identifies a logged-in customer in later requests. */
export type LoginToken = {
  __typename?: 'LoginToken';
  /** The customer login token. Pass it as the `token` argument of the customer queries and mutations. */
  token: Scalars['String']['output'];
};

/** One image or file from the media library, with an absolute CDN URL for each size. */
export type Media = {
  __typename?: 'Media';
  /** Alternative text for the image, when available. */
  alt_tag: Maybe<Scalars['String']['output']>;
  /** Whether the image is approved for use, when available. */
  approved: Maybe<Scalars['Boolean']['output']>;
  /** Absolute CDN URL of the banner crop, 1500 x 750 pixels unless the organisation has changed its media sizes. Empty string when this size has not been generated. */
  banner: Scalars['String']['output'];
  /** Absolute CDN URL of the original uploaded file. Use it for files that are not images, such as PDFs. */
  default: Scalars['String']['output'];
  /** Absolute CDN URL of the image at its original dimensions with the chosen crop applied. Empty string when this size has not been generated. */
  original_cropped: Scalars['String']['output'];
  /** Absolute CDN URL of the portrait crop, 600 x 800 pixels unless the organisation has changed its media sizes. Empty string when this size has not been generated. */
  portrait: Scalars['String']['output'];
  /** Absolute CDN URL of the rectangle crop, 1200 x 800 pixels unless the organisation has changed its media sizes. Empty string when this size has not been generated. */
  rectangle: Scalars['String']['output'];
  /** Absolute CDN URL of the square crop, 600 x 600 pixels unless the organisation has changed its media sizes. Empty string when this size has not been generated. */
  square: Scalars['String']['output'];
  /** Absolute CDN URL of the thumbnail, 300 pixels wide. Empty string when this size has not been generated. */
  thumbnail: Scalars['String']['output'];
  /** The tribes the image is shared with. */
  tribes: Array<Tribe>;
};

/** A named group of images attached to a record, such as its `main` image or its `gallery`. */
export type MediaCollection = {
  __typename?: 'MediaCollection';
  /** Always an empty string. */
  description: Maybe<Scalars['String']['output']>;
  /** The images in the collection. */
  media: Array<Media>;
  /** The collection name, for example `main`, `gallery`, `banner` or `square`. */
  name: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Adds one menu item, with any modifiers the visitor chose, as a new line in the open food shopping cart for `session_id`, creating the cart first if none is open. The change is saved immediately and the mutation returns the string `Success`. Adding the same item twice creates two separate lines rather than increasing the quantity. */
  addFoodMenuItemToShoppingCart: Maybe<Scalars['String']['output']>;
  /** Cancels a website customer account, for example when the customer closes their account on your website. The account is marked as cancelled immediately and can no longer sign in through the `logins` query. Cancelling an account that is already cancelled succeeds without changing the date it was cancelled. Returns a two-item list of the status code `201` and a confirmation message. */
  cancelLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Registers a new website customer account in the organisation and links it to a person record, reusing a person with the same email address and first name or creating one. The account is created immediately but the customer is not signed in, so call the `logins` query afterwards to get a token. Returns a list of `201`, a confirmation message and the new account ID, or `422`, `User already exists` and null when the organisation already has an account with that email address. */
  createLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Removes one line from the open food shopping cart for `session_id`. The change is saved immediately and the mutation returns the string `Success`, including when no line matched; if no cart is open for the session, an empty cart is created. */
  deleteFoodMenuItemFromShoppingCart: Maybe<Scalars['String']['output']>;
  /** Closes the open food shopping cart after the visitor has completed payment in Stripe, so the cart cannot be changed or paid again, and returns a one-item list containing the ID of the order. Call it once Stripe confirms the payment intent created by `submitFoodShoppingCart`. It does not check the payment with Stripe itself: the order is marked as paid separately, when Gorilla Dash receives the payment confirmation from Stripe. */
  foodShippingCartPaymentPaid: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Sets a new password on a website customer account using the `reset_token` from the link emailed by `tbaForgotPassword`. The token alone identifies the account. The change is immediate, the token and any other reset links for the account stop working, and the customer is signed out of every other session. Returns `true` when the password was changed, and `false` when `reset_token` is missing, has expired, has already been used, belongs to another organisation, or belongs to an account that has since been disabled or cancelled. */
  resetLoginUserPassword: Maybe<Scalars['Boolean']['output']>;
  /** Ties an existing chatbot conversation to the tribe the visitor picked, for example from the chatbot's `suggested_tribes`, so later answers and any enquiry use that tribe. The choice is saved immediately without asking the chatbot, and the returned `ChatbotReply` contains a short fixed confirmation message and the selected tribe. */
  selectChatbotTribe: Maybe<ChatbotReply>;
  /** Sends the visitor's next message in an existing chatbot conversation and returns the chatbot's answer as a `ChatbotReply`. The answer is generated before the mutation returns, which can take several seconds, and during the turn the chatbot may suggest tribes or save the visitor's details as an enquiry, which is reported in `lead_captured`. */
  sendChatbotMessage: Maybe<ChatbotReply>;
  /** Starts a new conversation with the website's active chatbot and returns a `ChatbotReply` whose `session_token` must be sent with every later chatbot call. Without `message`, `reply` holds the chatbot's greeting; with `message`, the chatbot answers it before the mutation returns, which can take several seconds and may capture the visitor as an enquiry. Returns a not-found error when the website has no active chatbot. */
  startChatbotConversation: Maybe<ChatbotReply>;
  /** Saves extra values against a signed-in website customer account, creating each attribute or overwriting the existing one with the same name and platform. The values are saved immediately. Returns a two-item list of the status code `201` and a confirmation message. */
  storeLoginAttributes: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Books an appointment of a named appointment type and adds the visitor as its attendee, matching an existing person by email address, first name and last name or creating a new person in the tribe. Offer the visitor times from `appointmentAvailableTime` so they choose a free slot. Returns an empty list. */
  submitAppointment: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Creates an enquiry from a custom page form on the enquiry form with the given slug; if the organisation has no form with that slug, a new form is created first with default wording and a single field named `Fields`. The enquiry is saved before the mutation returns, in the same way as `submitEnquiry`, and notification emails and other follow-up work continue in the background. Returns a three-item list of the form's thank-you page title, heading and text, with tribe placeholders filled in. */
  submitCustomPageEnquiry: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Creates an enquiry on one of the organisation's enquiry forms: it saves the answers and files, links the enquirer to a person record and the listed tribes, and checks the organisation's spam list. The enquiry is saved before the mutation returns, and an identical repeat submission returns the thank-you text without creating a second enquiry; notification emails follow a few minutes later and other follow-up work, such as lead-source calculation and AI summaries, runs in the background. Returns a three-item list of the form's thank-you page title, heading and text, with placeholders filled in. */
  submitEnquiry: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Checks out the open food shopping cart for a tribe: it creates (or re-prices) an order awaiting payment in Gorilla Dash with every line priced from the tribe's menu prices, modifiers, tax, coupon and shipping, and links the customer to a person record in the tribe. When Stripe is set up for the tribe or organisation it also creates a new Stripe payment intent, cancelling any earlier one for the cart, and returns a two-item list of the Stripe publishable key and the payment intent client secret for use with Stripe.js; otherwise the order is still saved and two empty strings are returned. The cart stays open until `foodShippingCartPaymentPaid` is called after the payment succeeds. */
  submitFoodShoppingCart: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Adds every person in the organisation with the given email address to the named person category, for example to record a newsletter sign-up. If nobody has that email address a new person is created with only the email, and if the category does not exist it is created. The change is immediate and the mutation returns an empty list. */
  submitPersonToCategory: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Submits an open food shopping cart through a food ordering portal as an order to be invoiced, with no online payment taken. It assigns the cart to the chosen tribe, creates an order awaiting invoice with every line priced and taxed, records the portal as the channel the order came from and closes the cart, all before returning. It returns a one-item list containing the ID of the order. */
  submitPortalFoodShoppingCart: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Enters a person into one of the organisation's promotions, such as a competition or giveaway. The entry is queued and saved in the background, where the person record is created or updated and the promotion's confirmation email is sent, so the response does not confirm that the entry was saved. Returns a one-item list containing the unique entry ID assigned to the entry. */
  submitPromotion: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Records a review written on your website against a tribe, linked to a person record matched by email address and first name or created for the reviewer. The review is saved immediately and appears with the tribe's reviews in Gorilla Dash, and a 5-star review also sends the reviewer the organisation's review follow-up email. Returns an empty list. */
  submitReview: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Starts a password reset for a website customer account by emailing the customer a link to your website's reset-password page, sent from the organisation with its logo and colour. Gorilla Dash adds a `reset_token` parameter to the link; the token expires after 60 minutes and can be used once, with `resetLoginUserPassword`. The link must be on one of the organisation's website domains. The email is sent before the mutation returns. Returns `true` when the email was sent. An account is sent at most 5 reset emails in 15 minutes; a request over that limit also returns `true` but sends nothing. Returns `false` when the organisation has no enabled account with that email address (including a disabled or cancelled account), or when the link is not on one of the organisation's website domains. */
  tbaForgotPassword: Maybe<Scalars['Boolean']['output']>;
  /** Updates the details of a signed-in website customer account. Only the arguments you send are changed, and they are saved immediately to the account itself; the linked person record in Gorilla Dash is not updated. Returns a two-item list of the status code `201` and a confirmation message. */
  updateLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Adds a listing to, or removes one from, the saved listings of a signed-in website customer account. The change is saved immediately and the mutation returns the full list of saved listing IDs after the change. */
  updateSavedList: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
};


export type MutationAddFoodMenuItemToShoppingCartArgs = {
  food_item: Scalars['JsonParser']['input'];
  session_id: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type MutationCancelLoginUserArgs = {
  email: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationCreateLoginUserArgs = {
  address_1: InputMaybe<Scalars['String']['input']>;
  address_2: InputMaybe<Scalars['String']['input']>;
  attributes: InputMaybe<Scalars['JsonParser']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  locality: InputMaybe<Scalars['String']['input']>;
  mobile_e164: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  postal_code: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteFoodMenuItemFromShoppingCartArgs = {
  cart_food_item_id: Scalars['Int']['input'];
  session_id: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type MutationFoodShippingCartPaymentPaidArgs = {
  payment_intent_id: Scalars['String']['input'];
  session_id: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type MutationResetLoginUserPasswordArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  reset_token: InputMaybe<Scalars['String']['input']>;
};


export type MutationSelectChatbotTribeArgs = {
  session_token: Scalars['String']['input'];
  tribe_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendChatbotMessageArgs = {
  message: Scalars['String']['input'];
  session_token: Scalars['String']['input'];
};


export type MutationStartChatbotConversationArgs = {
  chatbot_slug: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  message: InputMaybe<Scalars['String']['input']>;
  page_url: InputMaybe<Scalars['String']['input']>;
  tracking_data: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  tribe_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  visitor_email: InputMaybe<Scalars['String']['input']>;
  visitor_name: InputMaybe<Scalars['String']['input']>;
};


export type MutationStoreLoginAttributesArgs = {
  attributes: Scalars['JsonParser']['input'];
  token: Scalars['String']['input'];
};


export type MutationSubmitAppointmentArgs = {
  comments: InputMaybe<Scalars['String']['input']>;
  data: InputMaybe<Scalars['String']['input']>;
  datetime: Scalars['String']['input'];
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationSubmitCustomPageEnquiryArgs = {
  address_1: InputMaybe<Scalars['String']['input']>;
  address_2: InputMaybe<Scalars['String']['input']>;
  browser: InputMaybe<Scalars['String']['input']>;
  browser_agent: InputMaybe<Scalars['String']['input']>;
  business_name: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  device: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  fields: Array<InputMaybe<Scalars['JsonParser']['input']>>;
  files: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  first_name: Scalars['String']['input'];
  ip: InputMaybe<Scalars['String']['input']>;
  last_name: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  locality: InputMaybe<Scalars['String']['input']>;
  mobile: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  operating_system: InputMaybe<Scalars['String']['input']>;
  postal_code: InputMaybe<Scalars['String']['input']>;
  products: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  slug: InputMaybe<Scalars['String']['input']>;
  sms_approved: InputMaybe<Scalars['Boolean']['input']>;
  source: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
  tracking_data: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  tribes: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationSubmitEnquiryArgs = {
  address_1: InputMaybe<Scalars['String']['input']>;
  address_2: InputMaybe<Scalars['String']['input']>;
  browser: InputMaybe<Scalars['String']['input']>;
  browser_agent: InputMaybe<Scalars['String']['input']>;
  business_name: InputMaybe<Scalars['String']['input']>;
  client_site_visitor_id: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  created_at: InputMaybe<Scalars['String']['input']>;
  device: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  fields: Array<InputMaybe<Scalars['JsonParser']['input']>>;
  files: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  first_name: Scalars['String']['input'];
  gorilla_user_key: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['Int']['input']>;
  ip: InputMaybe<Scalars['String']['input']>;
  last_name: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  locality: InputMaybe<Scalars['String']['input']>;
  media_in_job: InputMaybe<Scalars['Boolean']['input']>;
  meta: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  mobile: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  notifications: InputMaybe<Scalars['Boolean']['input']>;
  online_store_products: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  operating_system: InputMaybe<Scalars['String']['input']>;
  possible_spam: InputMaybe<Scalars['Boolean']['input']>;
  postal_code: InputMaybe<Scalars['String']['input']>;
  products: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  slug: InputMaybe<Scalars['String']['input']>;
  sms_approved: InputMaybe<Scalars['Boolean']['input']>;
  source: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
  submit_url: InputMaybe<Scalars['String']['input']>;
  tracking_data: InputMaybe<Array<InputMaybe<Scalars['JsonParser']['input']>>>;
  tribes: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationSubmitFoodShoppingCartArgs = {
  comments: InputMaybe<Scalars['String']['input']>;
  coupon_id: InputMaybe<Scalars['Int']['input']>;
  customer: Scalars['JsonParser']['input'];
  delivery_date: Scalars['String']['input'];
  delivery_option: Scalars['String']['input'];
  delivery_time: InputMaybe<Scalars['String']['input']>;
  early_pick_up: InputMaybe<Scalars['Boolean']['input']>;
  early_pick_up_message: InputMaybe<Scalars['String']['input']>;
  session_id: Scalars['String']['input'];
  shipping_rate_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: Scalars['String']['input'];
};


export type MutationSubmitPersonToCategoryArgs = {
  email: Scalars['String']['input'];
  person_category: Scalars['String']['input'];
};


export type MutationSubmitPortalFoodShoppingCartArgs = {
  comments: InputMaybe<Scalars['String']['input']>;
  customer: Scalars['JsonParser']['input'];
  delivery_date: Scalars['String']['input'];
  delivery_option: Scalars['String']['input'];
  delivery_time: InputMaybe<Scalars['String']['input']>;
  early_pick_up: InputMaybe<Scalars['Boolean']['input']>;
  early_pick_up_message: InputMaybe<Scalars['String']['input']>;
  portal_slug: Scalars['String']['input'];
  session_id: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type MutationSubmitPromotionArgs = {
  address_1: InputMaybe<Scalars['String']['input']>;
  address_2: InputMaybe<Scalars['String']['input']>;
  business_name: InputMaybe<Scalars['String']['input']>;
  comment: InputMaybe<Scalars['String']['input']>;
  comment_public: InputMaybe<Scalars['Boolean']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  fields: Array<InputMaybe<Scalars['JsonParser']['input']>>;
  first_name: Scalars['String']['input'];
  gorilla_user_key: InputMaybe<Scalars['String']['input']>;
  ip: Scalars['String']['input'];
  last_name: InputMaybe<Scalars['String']['input']>;
  locality: InputMaybe<Scalars['String']['input']>;
  mobile: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  postal_code: InputMaybe<Scalars['Int']['input']>;
  referral_method: InputMaybe<Scalars['String']['input']>;
  referral_person_id: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
  tribe: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitReviewArgs = {
  data: InputMaybe<Scalars['JsonParser']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  review: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type MutationTbaForgotPasswordArgs = {
  email: Scalars['String']['input'];
  url: Scalars['String']['input'];
};


export type MutationUpdateLoginUserArgs = {
  address_1: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  last_name: Scalars['String']['input'];
  locality: InputMaybe<Scalars['String']['input']>;
  mobile_e164: InputMaybe<Scalars['String']['input']>;
  password: InputMaybe<Scalars['String']['input']>;
  postal_code: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
};


export type MutationUpdateSavedListArgs = {
  id: Scalars['Int']['input'];
  process_type: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

/** A team member from the organisation chart, with the contact details they have chosen to make public. */
export type OrgChartPerson = {
  __typename?: 'OrgChartPerson';
  /** The person's profile text. */
  about: Maybe<Scalars['String']['output']>;
  /** Absolute URL of the person's profile photo, using the cropped version when there is one. Empty when there is no photo. */
  avatar: Maybe<Scalars['String']['output']>;
  /** The person's email address. Null unless `email_public` is true. */
  email: Maybe<Scalars['String']['output']>;
  /** Whether the person's email address may be shown publicly. */
  email_public: Maybe<Scalars['Boolean']['output']>;
  /** The person's first name. */
  first_name: Maybe<Scalars['String']['output']>;
  /** The person's last name. */
  last_name: Maybe<Scalars['String']['output']>;
  /** The person's mobile number in E.164 format. Null unless `mobile_public` is true. */
  mobile_e164: Maybe<Scalars['String']['output']>;
  /** Whether the person's mobile number may be shown publicly. */
  mobile_public: Maybe<Scalars['Boolean']['output']>;
  /** The positions the person holds, in their saved order. */
  positions: Maybe<Array<Maybe<OrgChartPosition>>>;
  /** The person's job title. */
  role: Maybe<Scalars['String']['output']>;
  /** Whether the person should be listed on the website. */
  show_on_website: Maybe<Scalars['Boolean']['output']>;
  /** The organisation's team member custom fields, with this person's value for each */
  teamMemberCustomFields: Array<TeamMemberCustomField>;
  /** The person's telephone extension. Null unless `telephone_public` is true. */
  telephone_extension: Maybe<Scalars['String']['output']>;
  /** The person's telephone number, as entered. Null unless `telephone_public` is true. */
  telephone_number: Maybe<Scalars['String']['output']>;
  /** Whether the person's telephone number may be shown publicly. */
  telephone_public: Maybe<Scalars['Boolean']['output']>;
  /** The tribe the person works at. */
  tribe: Maybe<Tribe>;
};

/** A position a team member holds, such as store manager. */
export type OrgChartPosition = {
  __typename?: 'OrgChartPosition';
  /** A description of the position. */
  description: Maybe<Scalars['String']['output']>;
  /** The position name. */
  name: Maybe<Scalars['String']['output']>;
  /** Sort order of the position. */
  order: Maybe<Scalars['Int']['output']>;
};

/** An item in an organisation's or tribe's media library, as returned by `all_media`. */
export type OriginMedia = {
  __typename?: 'OriginMedia';
  /** Alternative text for the image. */
  alt_tag: Maybe<Scalars['String']['output']>;
  /** Whether the item is approved for use. */
  approved: Maybe<Scalars['Boolean']['output']>;
  /** Names of the media library categories the item belongs to. Only filled in on a tribe's `all_media`. */
  categories: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Always an empty string. */
  description: Maybe<Scalars['String']['output']>;
  /** The media library item id. */
  id: Maybe<Scalars['Int']['output']>;
  /** Whether the item is starred in the media library. */
  is_star: Maybe<Scalars['Boolean']['output']>;
  /** The stored files behind the item. Use `url` for links. */
  media: Maybe<Array<Maybe<Media>>>;
  /** The name given to the item in the media library. */
  name: Maybe<Scalars['String']['output']>;
  /** Absolute CDN URLs for the sizes requested with the `size` argument of `all_media`, as a list of single-key objects, for example `[{"default": "https://..."}, {"square": "https://..."}]`. A size that has not been generated is an empty string. */
  url: Maybe<Scalars['JsonParser']['output']>;
};

/** A case study or example of work, with its copy, client details and images. */
export type OurWork = {
  __typename?: 'OurWork';
  /** The full write-up, in the requested locale. */
  article: Maybe<Scalars['String']['output']>;
  /** The author. */
  author: Maybe<Scalars['String']['output']>;
  /** The client's name. */
  client_name: Maybe<Scalars['String']['output']>;
  /** A link to the client's website. */
  client_url: Maybe<Scalars['String']['output']>;
  /** A short summary, in the requested locale. */
  excerpt: Maybe<Scalars['String']['output']>;
  /** The heading, in the requested locale. */
  heading: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The meta description, in the requested locale. */
  meta_description: Maybe<Scalars['String']['output']>;
  /** The meta title, in the requested locale. */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Whether search engines should be told not to index the page. */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** When the work was, or will be, published. */
  published_at: Maybe<Scalars['String']['output']>;
  /** The URL slug, in the requested locale. */
  slug: Maybe<Scalars['String']['output']>;
  /** The status, for example `Published` or `Draft`. */
  status: Maybe<Scalars['String']['output']>;
  /** The sub heading. */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** The tribe that did the work. */
  tribe: Maybe<Tribe>;
};


/** A case study or example of work, with its copy, client details and images. */
export type OurWorkMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type OurWorkPagination = {
  __typename?: 'OurWorkPagination';
  /** Current page of the cursor */
  current_page: Scalars['Int']['output'];
  /** List of items on the current page */
  data: Array<OurWork>;
  /** Number of the first item returned */
  from: Maybe<Scalars['Int']['output']>;
  /** Determines if cursor has more pages after the current page */
  has_more_pages: Scalars['Boolean']['output'];
  /** The last page (number of pages) */
  last_page: Scalars['Int']['output'];
  /** Number of items returned per page */
  per_page: Scalars['Int']['output'];
  /** Number of the last item returned */
  to: Maybe<Scalars['Int']['output']>;
  /** Number of total items selected by the query */
  total: Scalars['Int']['output'];
};

/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type Product = {
  __typename?: 'Product';
  /** Additional costs, as JSON, with amounts in cents. */
  additional_costs: Maybe<Scalars['JsonParser']['output']>;
  /** The URL of the artwork specification PDF, when the product has one. */
  artwork_specification_pdf_url: Maybe<Scalars['String']['output']>;
  /** Branding options for the product, as JSON. */
  branding_options: Maybe<Scalars['JsonParser']['output']>;
  /** Product caption */
  caption: Maybe<Scalars['String']['output']>;
  /** The colours the product is available in. */
  colours: Maybe<Array<Maybe<ProductColour>>>;
  /** Component types used by components on this product, with their components. */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Whether the product's customisation prices have been calculated. */
  customisation_prices_processed: Maybe<Scalars['Boolean']['output']>;
  /** Product description */
  description: Maybe<Scalars['String']['output']>;
  /** Whether each variant has its own price. */
  enable_variant_prices: Maybe<Scalars['Boolean']['output']>;
  /** The product's features in the requested locale, as JSON. */
  features: Maybe<Scalars['JsonParser']['output']>;
  /** full_colour_branding */
  full_colour_branding: Maybe<Scalars['Int']['output']>;
  /** Whether the tribe given by `tribe_slug` has its own values for this product. False when no `tribe_slug` is given. */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product id */
  id: Maybe<Scalars['Int']['output']>;
  /** Identifier */
  identifier: Maybe<Scalars['String']['output']>;
  /** image_count_branding */
  image_count_branding: Maybe<Scalars['Int']['output']>;
  /** Whether installation can be added: true when the product is in the online shop and its primary SKU has an installation cost. */
  installation_available: Maybe<Scalars['Boolean']['output']>;
  /** Tribe stock records for the product. */
  inventories: Maybe<Array<Maybe<Inventory>>>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The label to use in navigation menus, in the requested locale. */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Product meta */
  meta: Maybe<Scalars['String']['output']>;
  /** The minimum quantity that can be ordered. */
  minimum_quantity: Maybe<Scalars['String']['output']>;
  /** The product name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Product page heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product page subheading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** The product's path on the website: the website's `base_products_path` followed by the product `slug`. */
  path: Maybe<Scalars['String']['output']>;
  /** Quantity price brackets, as JSON, with amounts in cents. */
  price_brackets: Maybe<Scalars['JsonParser']['output']>;
  /** Text shown with the product's primary price. */
  primary_price_description: Maybe<Scalars['String']['output']>;
  /** A comment shown with the product's primary pricing. */
  primary_pricing_comment: Maybe<Scalars['String']['output']>;
  /** Active product categories the product belongs to. */
  product_categories: Array<ProductCategory>;
  /** Number of product categories the product belongs to. */
  product_categories_count: Maybe<Scalars['Int']['output']>;
  /** The product's custom fields in the requested locale, with the tribe's own values used instead when `tribe_slug` is given. */
  product_custom_data: Maybe<Array<Maybe<ProductCustomData>>>;
  /** Active product ranges the product belongs to. */
  product_ranges: Array<ProductRange>;
  /** Number of product ranges the product belongs to. */
  product_ranges_count: Maybe<Scalars['Int']['output']>;
  /** Related Products */
  product_related_products: Maybe<Array<Maybe<Product>>>;
  /** The product's SKUs with the variant values each one represents, as JSON. */
  product_sku_variants: Maybe<Scalars['JsonParser']['output']>;
  /** The product's SKUs. Empty unless the product is available in the online shop. */
  product_skus: Maybe<Array<Maybe<ProductSku>>>;
  /** Additional costs customers can add in the online store, using the tribe's own prices when `tribe_slug` is given. */
  product_store_additional_costs: Maybe<Array<Maybe<ProductStoreAdditionalCost>>>;
  /** Colour options for the product in the online store. */
  product_store_colours: Maybe<Array<Maybe<ProductStoreColour>>>;
  /** Customisations customers can add in the online store, using the tribe's own prices when `tribe_slug` is given. */
  product_store_customisations: Maybe<Array<Maybe<ProductStoreCustomisation>>>;
  /** Quantity price brackets for the online store, using the tribe's own prices when `tribe_slug` is given. */
  product_store_price_brackets: Maybe<Array<Maybe<ProductStorePriceBracket>>>;
  /** The product's online store settings. */
  product_store_setting: Maybe<ProductStoreSetting>;
  /** The product type, which defines the product's custom fields. */
  product_type: Maybe<ProductType>;
  /** The product's variant options and their values, as JSON. */
  product_variants: Maybe<Scalars['JsonParser']['output']>;
  /** Secondary colours the product is available in. */
  secondary_colours: Maybe<Array<Maybe<ProductColour>>>;
  /** The average review rating to show in the product's search engine results. */
  seo_review_average: Maybe<Scalars['Float']['output']>;
  /** The number of reviews to show in the product's search engine results. */
  seo_review_count: Maybe<Scalars['Int']['output']>;
  /** Whether the product is available in the online shop. */
  shop_active: Maybe<Scalars['Boolean']['output']>;
  /** Product slug */
  slug: Maybe<Scalars['String']['output']>;
  /** The product status, for example `Active`. */
  status: Maybe<Scalars['String']['output']>;
  /** Product subheading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** The product's supplier. */
  supplier: Maybe<ProductSupplier>;
  /** The product's status with its supplier. */
  supplier_status: Maybe<Scalars['String']['output']>;
  /** Images a tribe has set to replace this record's own images on its pages. Null unless `images_tribe_slug` is given. */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** Always null. Build the URL from `slug` and the base paths in `websiteInfo`. */
  url: Maybe<Scalars['String']['output']>;
  /** Website components linked to the product. */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductInventoriesArgs = {
  id: InputMaybe<Scalars['Int']['input']>;
  tribe_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductProduct_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductProduct_Store_Additional_CostsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductProduct_Store_CustomisationsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductProduct_Store_Price_BracketsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product, with its page copy, pricing, SKUs, custom data, images and the ranges and categories it belongs to. */
export type ProductTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategory = {
  __typename?: 'ProductCategory';
  /** all category children in current supplier */
  all_children_in_supplier: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product category caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Product category children */
  children: Maybe<Array<Maybe<ProductCategory>>>;
  /** Component types used by components on this category, with their components. */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Product category description */
  description: Maybe<Scalars['String']['output']>;
  /** Whether the tribe given by `tribe_slug` has customised this category on the website given by `website_id`. False unless both are given. */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product category heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product category id */
  id: Maybe<Scalars['Int']['output']>;
  /** Product category introduction text */
  introduction: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The label to use in navigation menus, in the requested locale. */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Product category meta */
  meta: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** The category name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Product category page heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product category page subheading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** Product category parents */
  parents: Maybe<Array<Maybe<ProductCategory>>>;
  /** The category's path on the website: the website's `base_categories_path` followed by the category `slug`. */
  path: Maybe<Scalars['String']['output']>;
  /** Number of products in the category whose customisation prices have been calculated. */
  processed_products_count: Maybe<Scalars['Int']['output']>;
  /** Active product ranges in the category, in their saved order. */
  product_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Number of product ranges in the category. */
  product_ranges_count: Maybe<Scalars['Int']['output']>;
  /** Active products in the category. */
  products: Maybe<Array<Maybe<Product>>>;
  /** Number of products in the category. */
  products_count: Maybe<Scalars['Int']['output']>;
  /** Products in the category that are available in the online shop. */
  shop_products: Maybe<Array<Maybe<Product>>>;
  /** Show gallery */
  show_gallery: Maybe<Scalars['Boolean']['output']>;
  /** Product category slug */
  slug: Maybe<Scalars['String']['output']>;
  /** The category status, for example `Active`. */
  status: Maybe<Scalars['String']['output']>;
  /** Product category subheading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Images a tribe has set to replace this record's own images on its pages. Null unless `images_tribe_slug` is given. */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** The wording a tribe has customised for this category, for the tribe given by `tribe_slug`. */
  tribe_product_categories: Maybe<Array<Maybe<TribeProductCategoryType>>>;
  /** Always null. Build the URL from `slug` and the base paths in `websiteInfo`. */
  url: Maybe<Scalars['String']['output']>;
  /** Website components linked to the category. */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryProductsArgs = {
  onlyShop: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  sortBy: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category, with its page copy, SEO fields, images and the products and ranges in it. */
export type ProductCategoryTribe_Product_CategoriesArgs = {
  tribe_slug: Scalars['String']['input'];
};

/** A colour a product is available in. */
export type ProductColour = {
  __typename?: 'ProductColour';
  /** The colour's hex code. */
  hex: Maybe<Scalars['String']['output']>;
  /** The colour name. */
  name: Maybe<Scalars['String']['output']>;
};

/** A custom field on a product, as defined by the product's type. */
export type ProductCustomData = {
  __typename?: 'ProductCustomData';
  /** Custom data name */
  name: Maybe<Scalars['String']['output']>;
  /** The custom field type. `Related Products`, `Related Ranges` and `Related Categories` fields return the related records in `value`. */
  type: Maybe<Scalars['String']['output']>;
  /** The field value as JSON, in the requested locale. For `Related Products`, `Related Ranges` and `Related Categories` fields, a list of the related records with their images. */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRange = {
  __typename?: 'ProductRange';
  /** Product range caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Component types used by components on this range, with their components. */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Product range description */
  description: Maybe<Scalars['String']['output']>;
  /** Whether the tribe given by `tribe_slug` has customised this range on the website given by `website_id`. False unless both are given. */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product range heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product range id */
  id: Maybe<Scalars['Int']['output']>;
  /** Introduction */
  introduction: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Maybe<Array<MediaCollection>>;
  /** The label to use in navigation menus, in the requested locale. */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** The range name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Product range page_heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product range page_sub_heading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** The range's path on the website: the website's `base_ranges_path` followed by the range `slug`. */
  path: Maybe<Scalars['String']['output']>;
  /** Active product categories the range belongs to. */
  product_categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Number of product categories the range belongs to. */
  product_categories_count: Maybe<Scalars['Int']['output']>;
  /** Active products in the range. */
  products: Maybe<Array<Maybe<Product>>>;
  /** Number of products in the range. */
  products_count: Maybe<Scalars['Int']['output']>;
  /** Related product ranges, in their saved order. */
  related_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Active products in the range that are available in the online shop. */
  shop_active_products: Maybe<Array<Maybe<Product>>>;
  /** Show gallery */
  show_gallery: Maybe<Scalars['Boolean']['output']>;
  /** Product range slug */
  slug: Maybe<Scalars['String']['output']>;
  /** The range status, for example `Active`. */
  status: Maybe<Scalars['String']['output']>;
  /** Product range sub_heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Images a tribe has set to replace this record's own images on its pages. Null unless `images_tribe_slug` is given. */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** The wording a tribe has customised for this range, for the tribe given by `tribe_slug`. */
  tribe_product_ranges: Maybe<Array<Maybe<TribeProductRangeType>>>;
  /** Always null. Build the URL from `slug` and the base paths in `websiteInfo`. */
  url: Maybe<Scalars['String']['output']>;
  /** Website components linked to the range. */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeProductsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  loadMedia: InputMaybe<Scalars['Boolean']['input']>;
  onlyShop: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  random: InputMaybe<Scalars['Boolean']['input']>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range, with its page copy, SEO fields, images and the products and categories in it. */
export type ProductRangeTribe_Product_RangesArgs = {
  tribe_slug: Scalars['String']['input'];
};

/** A stock keeping unit (SKU) of a product, with its price and shipping details. */
export type ProductSku = {
  __typename?: 'ProductSku';
  /** Barcode */
  barcode: Maybe<Scalars['String']['output']>;
  /** The comparison price, such as the price before a discount, in major currency units (for example dollars). */
  compare_price: Maybe<Scalars['Float']['output']>;
  /** The SKU id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The installation cost, in major currency units (for example dollars). Null when installation is not offered. */
  installation_cost: Maybe<Scalars['Float']['output']>;
  /** Measurement unit */
  measurement_unit: Maybe<Scalars['String']['output']>;
  /** The SKU price, in major currency units (for example dollars). Uses the tribe's own price when the organisation publishes tribe pricing and the query asks for a tribe. */
  price: Maybe<Scalars['Float']['output']>;
  /** Price description */
  price_description: Maybe<Scalars['String']['output']>;
  /** Whether this is the product's main SKU. */
  primary_sku: Maybe<Scalars['Boolean']['output']>;
  /** Whether the SKU needs shipping. */
  requires_shipping: Maybe<Scalars['Boolean']['output']>;
  /** The SKU code. */
  sku: Maybe<Scalars['String']['output']>;
  /** Weight */
  weight: Maybe<Scalars['Int']['output']>;
};

/** An extra charge customers can add to a product in the online store. */
export type ProductStoreAdditionalCost = {
  __typename?: 'ProductStoreAdditionalCost';
  /** Whether the charge is currently offered. */
  active: Maybe<Scalars['Boolean']['output']>;
  /** The additional cost id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The name of the charge. */
  name: Maybe<Scalars['String']['output']>;
  /** Whether customers can choose not to add the charge. */
  optional: Maybe<Scalars['Boolean']['output']>;
  /** The one-off setup price, in cents. */
  retail_setup_price: Maybe<Scalars['Int']['output']>;
  /** The price per unit, in cents. */
  retail_unit_price: Maybe<Scalars['Int']['output']>;
};

/** A set of colours customers can choose from for a product in the online store. */
export type ProductStoreColour = {
  __typename?: 'ProductStoreColour';
  /** The colours in the set, as JSON. */
  colours: Maybe<Scalars['JsonParser']['output']>;
  /** A comment about the colours. */
  comment: Maybe<Scalars['String']['output']>;
  /** The colour set id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The name of the colour set. */
  name: Maybe<Scalars['String']['output']>;
  /** The id of the product the colours belong to. */
  product_id: Maybe<Scalars['Int']['output']>;
};

/** A customisation, such as printing or embroidery, that customers can add to a product in the online store. */
export type ProductStoreCustomisation = {
  __typename?: 'ProductStoreCustomisation';
  /** A description of the customisation. */
  description: Maybe<Scalars['String']['output']>;
  /** Whether the customisation is in full colour. */
  full_colour: Maybe<Scalars['Boolean']['output']>;
  /** The customisation id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The most colours allowed. */
  maximum_colours: Maybe<Scalars['Int']['output']>;
  /** The most positions the customisation can be applied to. */
  maximum_positions: Maybe<Scalars['Int']['output']>;
  /** Whether the setup price is charged once per colour. */
  multiple_setup_price_per_colour: Maybe<Scalars['Boolean']['output']>;
  /** Whether the unit price is charged once per colour. */
  multiple_unit_price_per_colour: Maybe<Scalars['Boolean']['output']>;
  /** The customisation name. */
  name: Maybe<Scalars['String']['output']>;
  /** The one-off setup price, in cents. */
  retail_setup_price: Maybe<Scalars['Int']['output']>;
  /** The price per unit, in cents. */
  retail_unit_price: Maybe<Scalars['Int']['output']>;
};

/** A quantity price bracket for a product in the online store. */
export type ProductStorePriceBracket = {
  __typename?: 'ProductStorePriceBracket';
  /** Whether the bracket is in use. */
  active: Maybe<Scalars['Boolean']['output']>;
  /** The price bracket id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The smallest quantity the bracket applies to. */
  minimum_units: Maybe<Scalars['Int']['output']>;
  /** The price per unit in this bracket, in cents. */
  retail_unit_price: Maybe<Scalars['Float']['output']>;
};

/** Online store settings for a product. */
export type ProductStoreSetting = {
  __typename?: 'ProductStoreSetting';
  /** The settings id. */
  id: Maybe<Scalars['Int']['output']>;
  /** Whether customers can order fewer than the minimum quantity. */
  less_than_minimum_enabled: Maybe<Scalars['Boolean']['output']>;
  /** The surcharge added to orders below the minimum quantity, in cents. */
  less_than_minimum_surcharge: Maybe<Scalars['Int']['output']>;
  /** Whether customers can choose more than one customisation option. */
  multiple_branding: Maybe<Scalars['Boolean']['output']>;
  /** The id of the product the settings belong to. */
  product_id: Maybe<Scalars['Int']['output']>;
};

/** The supplier a product comes from. */
export type ProductSupplier = {
  __typename?: 'ProductSupplier';
  /** The supplier's code. */
  code: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The supplier's name. */
  name: Maybe<Scalars['String']['output']>;
};

/** A product type, which defines the custom fields its products carry. */
export type ProductType = {
  __typename?: 'ProductType';
  /** The product type's description. */
  description: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The definitions of the custom fields for products of this type, as JSON. */
  meta: Maybe<Scalars['JsonParser']['output']>;
  /** The product type's name. */
  name: Maybe<Scalars['String']['output']>;
};

/** One variant of a product, such as a size and colour combination, with its SKU and price. */
export type ProductVariant = {
  __typename?: 'ProductVariant';
  /** The variant's price. */
  price: Maybe<Scalars['Int']['output']>;
  /** The variant's option values joined with ` / `, for example `Large / Red`. */
  variant: Maybe<Scalars['String']['output']>;
  /** The variant's SKU code. */
  variantSku: Maybe<Scalars['String']['output']>;
};

/** A promotion, such as a competition, with its dates, terms, entry fields and website content. */
export type Promotion = {
  __typename?: 'Promotion';
  /** The banner content: the `Promotion URL`, `Promotion Banner` and `Promotion Banner Heading` entries from `website_content`. */
  banner: Maybe<Array<Maybe<PromotionBanner>>>;
  /** When the promotion ends. */
  end_date: Maybe<Scalars['String']['output']>;
  /** The entry form fields for the promotion, as JSON. */
  fields: Maybe<Scalars['JsonParser']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Promotion name */
  name: Maybe<Scalars['String']['output']>;
  /** Promotion slug */
  slug: Maybe<Scalars['String']['output']>;
  /** When the promotion starts. */
  start_date: Maybe<Scalars['String']['output']>;
  /** The promotion's status. */
  status: Maybe<Scalars['String']['output']>;
  /** The promotion's terms and conditions. */
  terms: Maybe<Scalars['String']['output']>;
  /** The tribe types the promotion is open to. */
  tribe_types: Maybe<Array<Maybe<TribeType>>>;
  /** The promotion type, for example `Competition`. */
  type: Maybe<Scalars['String']['output']>;
  /** The name of the front-end component the website uses to show the promotion. */
  vue_component: Maybe<Scalars['String']['output']>;
  /** The promotion's website content. */
  website_content: Maybe<Array<Maybe<PromotionWebsiteContent>>>;
};

/** One piece of a promotion's banner content: its URL, banner image or banner heading. */
export type PromotionBanner = {
  __typename?: 'PromotionBanner';
  /** Images for this content, grouped into named collections. Each image includes absolute CDN URLs for every size, including `default` for the original file. */
  media_collection: Array<MediaCollection>;
  /** The content name: `Promotion URL`, `Promotion Banner` or `Promotion Banner Heading`. */
  name: Maybe<Scalars['String']['output']>;
  /** The content type. */
  type: Maybe<Scalars['String']['output']>;
  /** The content value. Structured values are returned as a JSON string. */
  value: Maybe<Scalars['String']['output']>;
};


/** One piece of a promotion's banner content: its URL, banner image or banner heading. */
export type PromotionBannerMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** One piece of website content for a promotion, such as text, an image or a selection of products. */
export type PromotionWebsiteContent = {
  __typename?: 'PromotionWebsiteContent';
  /** Images for this content, grouped into named collections. Each image includes absolute CDN URLs for every size, including `default` for the original file. */
  media_collection: Array<MediaCollection>;
  /** The content name. */
  name: Maybe<Scalars['String']['output']>;
  /** For `Products Selector` content, the selected products as a list of objects with `id`, `name`, `slug` and `photo` (an absolute CDN URL, or null). Null for other content types. */
  products: Maybe<Scalars['JsonParser']['output']>;
  /** The content type, for example `Products Selector`. */
  type: Maybe<Scalars['String']['output']>;
  /** The content value. Structured values are returned as a JSON string. */
  value: Maybe<Scalars['String']['output']>;
};


/** One piece of website content for a promotion, such as text, an image or a selection of products. */
export type PromotionWebsiteContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Query = {
  __typename?: 'Query';
  /** Returns a paginated list of upcoming webinar events for one tribe, read from the tribe components of the named tribe component type in the organisation of the authenticated website. Only components assigned to the tribe in `tribe_slug` whose `Date (mm/dd/yyyy) mm 01-12, dd 01-31` field is today or later are included, soonest first. Returns an error when the component type is not found. */
  EFTribeWebinarEvents: Maybe<TribeComponentPagination>;
  /** Returns a paginated list of upcoming webinar events read from components, soonest first. Without `tribe_slug` the events come from the component type of the authenticated website named in `name`; with `tribe_slug` they come from a tribe component type belonging to that tribe, and `name` is not used. Only components with the given status whose `Date (mm/dd/yyyy) mm 01-12, dd 01-31` field is today or later are included, and an error is returned when no component type is found. */
  EFWebinarEvents: Maybe<ComponentPagination>;
  /** Returns the appointment time slots a tribe offers on one date for one appointment type. Slots are built from the opening hours of the tribe for that weekday, in steps of the appointment type interval, and a slot is marked as not enabled when an existing appointment already covers it. Returns an error when the tribe or the appointment type is not found in the organisation of the authenticated website. */
  appointmentAvailableTime: Maybe<AppointmentAvailableTime>;
  /** Returns one article from the organisation of the authenticated website. With `tribe_slug` the article must be assigned to that tribe; without it, only organisation-level articles that are not assigned to any tribe are considered. When several articles match, the most recently created one is returned, and null is returned when none match. */
  article: Maybe<Article>;
  /** Returns the distinct business names tagged on the published articles of the organisation of the authenticated website, sorted alphabetically. Only organisation-level articles that are not assigned to a tribe are counted, and names longer than four words are left out. Pass the slug form of a name to `articlesPagination` as `businessSlug` to list the matching articles. */
  articleBusinessCloud: Array<Scalars['String']['output']>;
  /** Returns the article categories of the organisation of the authenticated website, sorted by name. Returns an empty list when no category matches. */
  articleCategories: Maybe<Array<Maybe<ArticleCategory>>>;
  /** Returns every article of the organisation of the authenticated website that matches the filters, newest first, without pagination. By default the list includes both organisation-level articles and articles assigned to tribes; set `only_organisation` to leave out tribe articles. Returns an empty list when nothing matches. */
  articles: Array<Article>;
  /** Returns a paginated list of the organisation-level articles of the organisation of the authenticated website, newest first. Articles assigned to a tribe are never included; use `tribeArticlesPagination` for those. Returns an empty page when nothing matches. */
  articlesPagination: Maybe<ArticlePagination>;
  /** Returns the product categories of the organisation that owns the authenticated website, as a single unpaginated list. Only categories with the status Active are included, and an empty list is returned when nothing matches. */
  categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Returns the default website of each child organisation of the organisation of the authenticated website, with the organisation id, website URL and tribe base path. Child organisations without a default website are left out, and an empty list is returned when there are none. */
  childWebsites: Maybe<Array<ChildWebsite>>;
  /** Returns the enquiry form with the given name from the organisation of the authenticated website. Returns an error when no form has that name. */
  enquiryForm: Maybe<EnquiryForm>;
  /** Checks whether a food coupon code can be used at a tribe for an order of the given amount, and returns the coupon with the discount and new total calculated. The tribe must have the status `Active` or `Testing`, and the coupon must be active, within its start and end dates in the tribe timezone, have a minimum spend no greater than `amount`, and be either available to every tribe or assigned to this one. Returns an error when the tribe or a usable coupon is not found. */
  foodCouponAvailable: FoodCouponAvailable;
  /** Returns the food menu with the given name from the organisation of the authenticated website. Returns an error when no menu has that name. Pass `locale` to receive translated text in the menu where a translation exists. */
  foodMenu: FoodMenu;
  /** Returns the food menu item attributes of the organisation of the authenticated website, sorted by name. Returns an empty list when none match. */
  foodMenuItemAttributes: Array<FoodMenuItemAttribute>;
  /** Returns one list item from a section of a food menu in the organisation of the authenticated website, located by menu name, section slug and item slug. Returns an error when no item matches. */
  foodMenuListItem: FoodMenuListItem;
  /** Returns one section of a food menu in the organisation of the authenticated website, located by menu name and section slug. Returns an error when no section matches. Pass `locale` to receive translated text where a translation exists. */
  foodMenuSection: FoodMenuSection;
  /** Returns the food ordering portal with the given slug from the organisation of the authenticated website. Returns an error when no portal matches, or when the portal has an access code and `access_code` is omitted or does not match it. */
  foodOrderingPortal: Maybe<FoodOrderingPortal>;
  /** Returns the active locations of the food ordering portal with the given slug in the organisation of the authenticated website, sorted by name. A location is only included when its tribe also has the status `Active`, and an empty list is returned when the portal is not found or has no active locations. */
  foodOrderingPortalAvailableLocation: Array<FoodOrderingPortalLocation>;
  /** Returns the food shopping cart for a session in the organisation of the authenticated website, as long as it is still open or awaiting payment. Returns null when there is no such cart, which includes a cart that has already been submitted. */
  foodShoppingCart: Maybe<FoodShoppingCart>;
  /** Returns the active store settings of a tribe in the organisation of the authenticated website, as used for food ordering. Settings that belong to a branded store or an online store are not considered. Returns an error when the tribe is not found, and null when the tribe has no active store settings. */
  foodStoreSetting: Maybe<StoreSetting>;
  /** Returns the pickup or delivery time slots a tribe can offer for food orders on a date, in 15-minute steps in the tribe timezone, starting no earlier than the current time plus the minimum preparation time. When the store settings limit orders to opening hours, the slots follow the opening hours of the tribe for that day (or its custom hours for that date) and end 15 minutes before closing; otherwise they run until 23:45. Returns an error when the tribe is not found, and an empty `times` list when the tribe has no store settings. */
  foodTribeAvailableTime: Maybe<FoodTribeAvailableTime>;
  /** Returns the website member account that a login token belongs to, using the token returned by `logins`. Returns an error when the token is unknown or has expired, belongs to an account in another organisation, or belongs to a disabled or cancelled account. */
  getUserByToken: LoginUserByToken;
  /** Returns the date and time content such as products, product categories, articles, our work entries and components last changed in the organisation of the authenticated website, or null when no change has been recorded. Compare it with a value you stored earlier to decide whether your site needs to fetch content again. */
  lastUpdatedAt: Maybe<Scalars['String']['output']>;
  /** Returns true when a website member account with the given email address exists in the organisation of the authenticated website, and false otherwise. */
  loginExists: Scalars['Boolean']['output'];
  /** Signs a website member in with an email address and password from the organisation of the authenticated website, and returns a login token that stays valid for one year. Returns an error when the email address or password is wrong, or when the account has been cancelled or disabled. Pass the token to `getUserByToken` and to the member mutations that take a `token` argument. */
  logins: Maybe<LoginToken>;
  /** Returns the menus of the authenticated website as a single unpaginated list, in every language. Without `tribe_slug` only organisation-level menus are returned, and with it only the menus of that tribe are returned. Returns an empty list when nothing matches; use `websiteMenu` to pick a menu for one language. */
  menus: Maybe<Array<Maybe<WebsiteMenu>>>;
  /** Returns the top-level pages of the authenticated website that are linked to the org chart person with the given slug. Child pages are not included, and an empty list is returned when no page matches. */
  orgChartPersonWebsitePages: Maybe<Array<WebsitePage>>;
  /** Returns the organisation that owns the authenticated website. */
  organisation: Maybe<Organisation>;
  /** Returns one organisation-level our work entry, meaning one that is not assigned to a tribe, from the organisation of the authenticated website. The entry is matched by slug whatever its status or publish date, and an error is returned when no entry matches. Pass `locale` to receive translated text and to match a translated slug. */
  organisationOurWork: OurWork;
  /** Returns a paginated list of organisation-level our work entries, meaning those not assigned to a tribe, from the organisation of the authenticated website, most recently published first. Only entries with the status `Published` and a publish date in the past are included. Pass `locale` to receive translated text where a translation exists. */
  organisationOurWorks: Maybe<OurWorkPagination>;
  /** Returns one our work entry assigned to the given tribe in the organisation of the authenticated website. The entry is matched by slug whatever its status or publish date, and an error is returned when no entry matches. Pass `locale` to receive translated text and to match a translated slug. */
  ourWork: OurWork;
  /** Returns a paginated list of the our work entries assigned to the given tribe in the organisation of the authenticated website, most recently published first. Only entries with the status `Published` and a publish date in the past are included, and an empty page is returned when the tribe has none. Pass `locale` to receive translated text where a translation exists. */
  ourWorks: Maybe<OurWorkPagination>;
  /** Returns one product of the organisation that owns the authenticated website, matched by slug. Only a product with the status Active is returned, unless `only_shop_active` is `true`, and the query returns an error when no product matches. */
  product: Product;
  /** Returns one active product category of the organisation that owns the authenticated website, matched by slug. Returns an error when no category with the status Active matches. */
  productCategory: ProductCategory;
  /** Returns product components for the organisation that owns the authenticated website. When `componentType` names one of the organisation component types, every component of that type is returned in the order saved for the type; otherwise the result is the components attached to at least one of the organisation products. Returns an empty list when nothing matches. */
  productComponents: Maybe<Array<Maybe<Component>>>;
  /** Returns every product supplier of the organisation that owns the authenticated website, whatever its status. The list is not filtered, ordered or paginated, and is empty when the organisation has no suppliers. */
  productSuppliers: Maybe<Array<Maybe<ProductSupplier>>>;
  /** Returns a list of every product type of the organisation that owns the authenticated website, despite the singular field name. The list is not filtered, ordered or paginated, and is empty when the organisation has no product types. */
  productType: Maybe<Array<Maybe<ProductType>>>;
  /** Returns the products of the organisation that owns the authenticated website, as a single unpaginated list. By default only products with the status Active are included; pass `onlyShopActive` to list products enabled for the online shop instead. Returns an empty list when nothing matches. */
  products: Maybe<Array<Maybe<Product>>>;
  /** Returns one promotion of the organisation that owns the authenticated website, matched by slug. The promotion must have the status Active or Pending and today must fall between its start and end dates (compared by calendar date only); otherwise the query returns an error. */
  promotion: Promotion;
  /** Returns the promotion to show as a site banner: an `Active` promotion of the organisation of the authenticated website whose start and end dates include today. When several promotions match, the one with the earliest start date is returned, and null is returned when none match. */
  promotionBanner: Maybe<Promotion>;
  /** Returns a list containing at most one promotion of the organisation that owns the authenticated website, matched by slug. Unlike `promotion`, it does not check the promotion status or date range, so paused, finished and deleted promotions can be returned. Returns null when no promotion matches. */
  promotions: Maybe<Array<Maybe<Promotion>>>;
  /** Returns the product ranges of the organisation that owns the authenticated website. Only ranges with the status Active are included, the list is not paginated, and an empty list is returned when nothing matches. */
  ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Returns active geographic regions (countries, states, cities and areas), for one country when `country_iso` is sent. Regions are shared reference data and are not specific to the organisation. Returns an empty list when nothing matches. */
  regions: Array<Region>;
  /** Returns reviews for the organisation that owns the authenticated website, newest first by default. Reviews can be narrowed to one tribe and to featured reviews, and `count` caps the list because the query is not paginated. Returns an empty list when nothing matches. */
  reviews: Maybe<Array<Maybe<Review>>>;
  /** Store finder: returns up to 10 active tribes of the organisation that owns the authenticated website near a location, sorted by distance. Tribes whose service territory contains the location or its postcode come first, followed by the nearest other tribes. When the address cannot be located, a single fallback tribe for the organisation is returned instead of an error. */
  searchStores: Array<Tribe>;
  /** Returns the active shipping zones of a tribe online store that cover a delivery address, and whether the order amount qualifies for free shipping in any of them. When the tribe store is set to show only one delivery option, only the zone with the cheapest base rate is returned. Returns no zones and `free` false when the address is empty or cannot be located (the tribe is not checked in that case), and an error when a located address is sent for a tribe that is not found. */
  shippingZones: Maybe<ShippingZoneWithFree>;
  /** Returns the variants of the first active product, in the organisation that owns the authenticated website, that has the given SKU. Returns an empty list when no active product matches. */
  shopping: Maybe<Array<Maybe<ProductVariant>>>;
  /** Returns one tribe of the organisation that owns the authenticated website, usually matched by `slug`, or the nearest matching tribe when `lat` and `lng` are passed. Only tribes with the status Active are considered unless `status` says otherwise, and the query returns an error when no tribe matches. Pass `locale` to receive translated headings, introductions and meta text where translations exist. */
  tribe: Tribe;
  /** Returns every article a tribe should show, newest first, as a single unpaginated list: the articles linked to the tribe plus the organisation-wide articles not linked to any tribe, leaving out any organisation article that the tribe has replaced with its own version. Articles of every status are included unless `status` is passed. Returns an empty list when nothing matches; use `tribeArticlesPagination` for large sets. */
  tribeArticles: Array<Article>;
  /** Returns one page of the articles a tribe should show, newest first: the articles linked to the tribe plus the organisation-wide articles not linked to any tribe, leaving out any organisation article that the tribe has replaced with its own version. Articles of every status are included unless `status` is passed. Returns an empty page when nothing matches. */
  tribeArticlesPagination: Maybe<ArticlePagination>;
  /** Returns one tribe component, matched by slug, whose component type belongs to the organisation that owns the authenticated website and which is assigned to the given tribe. Returns an error when no such component exists. */
  tribeComponent: Maybe<TribeComponent>;
  /** Returns one tribe component type of the organisation that owns the authenticated website, matched by name, with its `components` limited to those assigned to a tribe. Returns null when no type with that name exists or when none of its components match. */
  tribeComponentType: Maybe<TribeComponentType>;
  /** Returns the tribes of the organisation that owns the authenticated website, as a single unpaginated list sorted by name unless `orderBy` is passed. Only tribes with the status Active are included unless `status` says otherwise. Returns an empty list when nothing matches. */
  tribes: Array<Tribe>;
  /** Returns one website component, matched by slug, whose component type belongs to the authenticated website. Components of any status are returned unless `status` is passed, and the query returns an error when no component matches. */
  websiteComponent: Component;
  /** Returns the website component types of the authenticated website, each with its components, as a single unpaginated list. Types and components of any status are returned unless `status` is passed, and an empty list is returned when nothing matches. */
  websiteComponents: Array<ComponentType>;
  /** Returns the FAQs of the authenticated website as a single unpaginated list, with no status filter. Tribe placeholders in each question and answer are filled from the tribe named by `assign_store_slug`. Returns an empty list when nothing matches. */
  websiteFaq: Maybe<Array<Maybe<WebsiteFaq>>>;
  /** Returns the FAQ categories of the authenticated website as a single unpaginated list, with no status filter. Returns an empty list when nothing matches. */
  websiteFaqCategory: Maybe<Array<Maybe<WebsiteFaqCategory>>>;
  /** Returns the authenticated website itself: its settings and details, as identified by the access token. It never returns null. Its `last_updated_at` field moves when the website settings are saved or when its pages, page content, sections, section content or menus are edited, so poll it together with `lastUpdatedAt` (which covers products, articles, reviews, components and other organisation content) to decide when to refresh cached content. */
  websiteInfo: Maybe<Website>;
  /** Returns one menu of the authenticated website, matched by `name` or `id`. Without `tribe_slug` only organisation-level menus are searched, and with it only the menus of that tribe are searched, with no fallback to the organisation menu. When `locale` is passed, a menu for that language is preferred over a menu with no language; returns null when no menu matches. */
  websiteMenu: Maybe<WebsiteMenu>;
  /** Returns one website page of the authenticated website, used to render a page. Matching pages are looked up in order: the page of the team member named by `agent_slug`, then the page of the tribe named by `tribe_slug`, then the organisation-level page, and the first page in menu order at the first level that has a match is returned. Deleted pages are never returned, and the query returns null when no page matches. */
  websitePage: Maybe<WebsitePage>;
  /** Returns the page templates of the authenticated website as a single unpaginated list, with no status filter and no particular order. Returns an empty list when nothing matches. */
  websitePageTemplates: Maybe<Array<WebsitePageTemplate>>;
  /** Returns website pages of the authenticated website in menu order, as a single unpaginated list. When `tribe_slug` names an Active tribe that has matching pages, the pages of that tribe are returned; otherwise the matching organisation-level pages are returned instead. Deleted pages are never included, and an empty list is returned when nothing matches. */
  websitePages: Maybe<Array<WebsitePage>>;
  /** Returns the website pages that belong to one tribe and use one of the given page templates, in menu order, for building a tribe menu. Only pages of the tribe itself are returned, with no fallback to organisation-level pages, and tribe placeholders in the page text are filled from that tribe. Returns an empty list when the tribe does not exist in the organisation, is not Active, or has no matching pages. */
  websitePagesInTribeMenu: Maybe<Array<WebsitePage>>;
  /** Returns every redirect configured for the authenticated website as a single unpaginated list, leaving out any redirect that has been detected as part of a redirect loop. Each redirect carries its `from` and `to` values but no HTTP status code, so the client decides whether to answer with a 301 or a 302. Returns an empty list when the website has no redirects. */
  websiteRedirects: Array<WebsiteRedirect>;
  /** Returns one website section of the authenticated website, matched by name. When `tribe_slug` is passed and that tribe has its own section with this name, the tribe section is returned; otherwise the organisation-level section is returned. The query returns an error when neither exists. */
  websiteSection: Maybe<WebsiteSection>;
  /** Returns website sections of the authenticated website as a single unpaginated list. Organisation-level sections and the sections of every tribe are returned together, because this query cannot be limited to one tribe; use `websiteSection` with `tribe_slug` for that. Returns an empty list when nothing matches. */
  websiteSections: Maybe<Array<Maybe<WebsiteSection>>>;
};


export type QueryEfTribeWebinarEventsArgs = {
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  page: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEfWebinarEventsArgs = {
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  page: InputMaybe<Scalars['Int']['input']>;
  status: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  types: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAppointmentAvailableTimeArgs = {
  date: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};


export type QueryArticleArgs = {
  included_related_articles: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryArticleCategoriesArgs = {
  article_status: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryArticlesArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  only_organisation: InputMaybe<Scalars['Boolean']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryArticlesPaginationArgs = {
  businessSlug: InputMaybe<Scalars['String']['input']>;
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryCategoriesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  supplier_ids: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryEnquiryFormArgs = {
  name: Scalars['String']['input'];
};


export type QueryFoodCouponAvailableArgs = {
  amount: Scalars['Int']['input'];
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type QueryFoodMenuArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};


export type QueryFoodMenuItemAttributesArgs = {
  name: InputMaybe<Scalars['String']['input']>;
};


export type QueryFoodMenuListItemArgs = {
  food_menu_name: Scalars['String']['input'];
  section_slug: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryFoodMenuSectionArgs = {
  food_menu_name: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


export type QueryFoodOrderingPortalArgs = {
  access_code: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


export type QueryFoodOrderingPortalAvailableLocationArgs = {
  slug: Scalars['String']['input'];
};


export type QueryFoodShoppingCartArgs = {
  session_id: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryFoodStoreSettingArgs = {
  tribe_slug: Scalars['String']['input'];
};


export type QueryFoodTribeAvailableTimeArgs = {
  date: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};


export type QueryGetUserByTokenArgs = {
  token: Scalars['String']['input'];
};


export type QueryLoginExistsArgs = {
  email: Scalars['String']['input'];
};


export type QueryLoginsArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type QueryMenusArgs = {
  id: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryOrgChartPersonWebsitePagesArgs = {
  agent_slug: Scalars['String']['input'];
};


export type QueryOrganisationOurWorkArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};


export type QueryOrganisationOurWorksArgs = {
  featured: InputMaybe<Scalars['Boolean']['input']>;
  itemsPerPage: Scalars['Int']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  page: Scalars['Int']['input'];
};


export type QueryOurWorkArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type QueryOurWorksArgs = {
  featured: InputMaybe<Scalars['Boolean']['input']>;
  itemsPerPage: Scalars['Int']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  page: Scalars['Int']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type QueryProductArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  only_shop_active: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryProductCategoryArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryProductComponentsArgs = {
  componentType: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryProductsArgs = {
  customisationPricesProcessed: InputMaybe<Scalars['Boolean']['input']>;
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  inventory_id: InputMaybe<Scalars['Int']['input']>;
  inventory_tribe_id: InputMaybe<Scalars['Int']['input']>;
  inventory_tribe_slug: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  onlyShopActive: InputMaybe<Scalars['Boolean']['input']>;
  random: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  supplier_status: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryPromotionArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPromotionsArgs = {
  slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryRangesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  result_count: InputMaybe<Scalars['Int']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryRegionsArgs = {
  country_iso: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};


export type QueryReviewsArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  featured: InputMaybe<Scalars['Boolean']['input']>;
  includeConnectedOrganisations: InputMaybe<Scalars['Boolean']['input']>;
  sort_by: InputMaybe<Scalars['String']['input']>;
  tribe_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchStoresArgs = {
  address: Scalars['String']['input'];
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  radius: InputMaybe<Scalars['Float']['input']>;
  tribe_type: Scalars['String']['input'];
  using_alternative_address: InputMaybe<Scalars['Boolean']['input']>;
  zipcode: InputMaybe<Scalars['String']['input']>;
};


export type QueryShippingZonesArgs = {
  address: InputMaybe<Scalars['String']['input']>;
  amount: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: Scalars['String']['input'];
};


export type QueryShoppingArgs = {
  sku: InputMaybe<Scalars['String']['input']>;
};


export type QueryTribeArgs = {
  includeConnectedOrganisations: InputMaybe<Scalars['Boolean']['input']>;
  lat: InputMaybe<Scalars['Float']['input']>;
  lng: InputMaybe<Scalars['Float']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  onlineStore: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryTribeArticlesArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  tribe_slug: Scalars['String']['input'];
};


export type QueryTribeArticlesPaginationArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
  tribe_slug: Scalars['String']['input'];
};


export type QueryTribeComponentArgs = {
  slug: Scalars['String']['input'];
  tribe_slug: Scalars['String']['input'];
};


export type QueryTribeComponentTypeArgs = {
  name: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryTribesArgs = {
  includeConnectedOrganisations: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  onlineStore: InputMaybe<Scalars['Boolean']['input']>;
  orderBy: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  slug: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteComponentArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteComponentsArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteFaqArgs = {
  assign_store_slug: InputMaybe<Scalars['String']['input']>;
  faq_slug: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteFaqCategoryArgs = {
  name: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteMenuArgs = {
  id: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsitePageArgs = {
  agent_slug: InputMaybe<Scalars['String']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  organisation_template: InputMaybe<Scalars['Boolean']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  template_slug: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  tribe_template: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryWebsitePageTemplatesArgs = {
  slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsitePagesArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
  template_slug: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  template_type: InputMaybe<Scalars['String']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWebsitePagesInTribeMenuArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  template_slug: Array<Scalars['String']['input']>;
  tribe_slug: Scalars['String']['input'];
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWebsiteSectionArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


export type QueryWebsiteSectionsArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A job advertisement, with its role, region, salary and description. */
export type RecruitmentPosting = {
  __typename?: 'RecruitmentPosting';
  /** A description of the role. */
  about_role: Maybe<Scalars['String']['output']>;
  /** The benefits and perks of the job. */
  benefits_and_perks: Maybe<Scalars['String']['output']>;
  /** When the posting closes. */
  close_date: Maybe<Scalars['String']['output']>;
  /** The heading of the job advertisement. */
  heading: Maybe<Scalars['String']['output']>;
  /** The working hours. */
  hours: Maybe<Scalars['String']['output']>;
  /** The posting id. */
  id: Maybe<Scalars['Int']['output']>;
  /** A short summary of the job. */
  job_summary: Maybe<Scalars['String']['output']>;
  /** The id of the organisation the posting belongs to. */
  organisation_id: Maybe<Scalars['Int']['output']>;
  /** Whether the job is permanent, fixed-term or casual. */
  permanency: Maybe<Scalars['String']['output']>;
  /** When the posting is published. */
  publish_date: Maybe<Scalars['String']['output']>;
  /** The region the job is in. */
  region: Maybe<Region>;
  /** The job role the posting is for. */
  role: Maybe<RecruitmentRole>;
  /** The lowest salary for the job, as entered. */
  salary_from: Maybe<Scalars['String']['output']>;
  /** The highest salary for the job, as entered. */
  salary_to: Maybe<Scalars['String']['output']>;
  /** The first selling point of the job. */
  selling_point_1: Maybe<Scalars['String']['output']>;
  /** The second selling point of the job. */
  selling_point_2: Maybe<Scalars['String']['output']>;
  /** The third selling point of the job. */
  selling_point_3: Maybe<Scalars['String']['output']>;
  /** Whether the salary should be shown to applicants. The salary fields are returned either way. */
  show_salary: Maybe<Scalars['Boolean']['output']>;
  /** The skills and experience needed. */
  skills_and_experience: Maybe<Scalars['String']['output']>;
  /** The posting status, for example `Active`. */
  status: Maybe<Scalars['String']['output']>;
  /** Absolute URL of the posting on the organisation's careers site. */
  url: Maybe<Scalars['String']['output']>;
};

/** A job role, with the standard copy used by job postings for it. */
export type RecruitmentRole = {
  __typename?: 'RecruitmentRole';
  /** A description of the role. */
  about_role: Maybe<Scalars['String']['output']>;
  /** The benefits and perks of the role. */
  benefits_and_perks: Maybe<Scalars['String']['output']>;
  /** A short summary of the role. */
  job_summary: Maybe<Scalars['String']['output']>;
  /** The role name. */
  name: Maybe<Scalars['String']['output']>;
  /** The category the role belongs to. */
  role_category: Maybe<RecruitmentRoleCategory>;
  /** The first selling point of the role. */
  selling_point_1: Maybe<Scalars['String']['output']>;
  /** The second selling point of the role. */
  selling_point_2: Maybe<Scalars['String']['output']>;
  /** The third selling point of the role. */
  selling_point_3: Maybe<Scalars['String']['output']>;
  /** The skills and experience needed. */
  skills_and_experience: Maybe<Scalars['String']['output']>;
  /** The role status. */
  status: Maybe<Scalars['String']['output']>;
};

/** A category that groups job roles. */
export type RecruitmentRoleCategory = {
  __typename?: 'RecruitmentRoleCategory';
  /** The category name. */
  name: Maybe<Scalars['String']['output']>;
  /** The category status. */
  status: Maybe<Scalars['String']['output']>;
};

/** A geographic region, such as a state, with its centre point and boundary. */
export type Region = {
  __typename?: 'Region';
  /** The two-letter ISO code of the region's country, for example `US`. */
  country_iso: Maybe<Scalars['String']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The latitude of the region's centre. */
  latitude: Maybe<Scalars['Float']['output']>;
  /** The longitude of the region's centre. */
  longitude: Maybe<Scalars['Float']['output']>;
  /** The region name. */
  name: Maybe<Scalars['String']['output']>;
  /** The region's short name, for example `CA`. */
  name_abbreviated: Maybe<Scalars['String']['output']>;
  /** The region's boundary polygons, as JSON. */
  polygons: Maybe<Scalars['JsonParser']['output']>;
  /** The region status. */
  status: Maybe<Scalars['String']['output']>;
  /** A suggested map zoom level for showing the whole region. */
  zoom: Maybe<Scalars['Int']['output']>;
};

/** A customer review of the organisation or one of its tribes. */
export type Review = {
  __typename?: 'Review';
  /** The reviewer's business name, when they have one. */
  business_name: Maybe<Scalars['String']['output']>;
  /** When the review was created. */
  created_at: Maybe<Scalars['String']['output']>;
  /** Whether the review is featured. */
  featured: Maybe<Scalars['Boolean']['output']>;
  /** The review id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The time of the request, not when the record changed. Use the `lastUpdatedAt` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The reviewer's name. */
  name: Maybe<Scalars['String']['output']>;
  /** The star rating given. */
  rating: Maybe<Scalars['Int']['output']>;
  /** The review text. */
  review: Maybe<Scalars['String']['output']>;
  /** Where the review came from: `Google`, `Facebook`, `Yelp` or `Website`. */
  review_source: Maybe<Scalars['String']['output']>;
  /** Whether the review is `Public` or `Internal`. */
  review_type: Maybe<Scalars['String']['output']>;
  /** A link to the reviewer's profile on the site the review came from. */
  social_author_url: Maybe<Scalars['String']['output']>;
  /** The review text as posted on the site it came from. */
  social_message: Maybe<Scalars['String']['output']>;
  /** The rating given on the site the review came from. */
  social_rating: Maybe<Scalars['Int']['output']>;
  /** The review status: `Pending` or `Responded`. */
  status: Maybe<Scalars['String']['output']>;
  /** The tribe the review is for. */
  tribe: Maybe<Tribe>;
  /** When the review was last updated. */
  updated_at: Maybe<Scalars['String']['output']>;
};

/** An area a shipping zone covers, defined by country, state or map polygons. */
export type ShippingArea = {
  __typename?: 'ShippingArea';
  /** The states or provinces in the area, as JSON. */
  administrative_area_level_1: Maybe<Scalars['JsonParser']['output']>;
  /** The centre point of the area, as JSON. */
  center: Maybe<Scalars['JsonParser']['output']>;
  /** The area name. */
  name: Maybe<Scalars['String']['output']>;
  /** The map polygons that outline the area, as JSON. */
  polygons: Maybe<Scalars['JsonParser']['output']>;
  /** The radius around `center`, as JSON. */
  radius: Maybe<Scalars['JsonParser']['output']>;
  /** How the area is defined: `Country`, `State` or `Polygons`. */
  type: Maybe<Scalars['String']['output']>;
};

/** A shipping rate charged within a shipping zone. */
export type ShippingRate = {
  __typename?: 'ShippingRate';
  /** The flat base charge, in major currency units (for example dollars). */
  base_rate: Maybe<Scalars['Float']['output']>;
  /** The currency the rate is charged in. */
  currency: Maybe<Scalars['String']['output']>;
  /** The order amount at which shipping becomes free, in major currency units (for example dollars). */
  free_shipping_price: Maybe<Scalars['Float']['output']>;
  /** Shipping rate id */
  id: Scalars['Int']['output'];
  /** The largest order amount the rate applies to, in major currency units (for example dollars). */
  maximum_order_price: Maybe<Scalars['Float']['output']>;
  /** The smallest order amount the rate applies to, in major currency units (for example dollars). */
  minimum_order_price: Maybe<Scalars['Float']['output']>;
  /** Shipping rate name */
  name: Scalars['String']['output'];
  /** The charge per unit of weight, in major currency units (for example dollars). */
  weight_rate: Maybe<Scalars['Float']['output']>;
};

/** A shipping zone, with the areas it covers and the rates charged there. */
export type ShippingZone = {
  __typename?: 'ShippingZone';
  /** Shipping zone id */
  id: Scalars['Int']['output'];
  /** Shipping zone name */
  name: Scalars['String']['output'];
  /** The areas the zone covers. */
  shippingAreas: Array<ShippingArea>;
  /** The rates charged in the zone. */
  shippingRates: Array<ShippingRate>;
  /** Shipping zone status */
  status: Scalars['String']['output'];
};

/** The shipping zones that cover a delivery address, and whether the order qualifies for free shipping. */
export type ShippingZoneWithFree = {
  __typename?: 'ShippingZoneWithFree';
  /** Whether the order amount qualifies for free shipping in any of the zones. */
  free: Scalars['Boolean']['output'];
  /** The shipping zones that cover the address. */
  shipping_zones: Maybe<Array<ShippingZone>>;
};

/** A team member at a tribe, with their role and photo. */
export type TeamMember = {
  __typename?: 'TeamMember';
  /** The team member's profile text. */
  about: Maybe<Scalars['String']['output']>;
  /** Absolute URL of the square version of the team member's photo. */
  avatar: Maybe<Scalars['String']['output']>;
  /** The team member's email address. */
  email: Maybe<Scalars['String']['output']>;
  /** The team member's first name. */
  first_name: Maybe<Scalars['String']['output']>;
  /** The team member's last name. */
  last_name: Maybe<Scalars['String']['output']>;
  /** The team member's job title. */
  role: Maybe<Scalars['String']['output']>;
  /** The tribe the team member works at. */
  tribe: Maybe<Tribe>;
};

/** A team member custom field defined by the organisation, with one person's value for it. */
export type TeamMemberCustomField = {
  __typename?: 'TeamMemberCustomField';
  /** Custom field id */
  id: Maybe<Scalars['Int']['output']>;
  /** Images held against a Single Image / Gallery custom field */
  media_collection: Array<MediaCollection>;
  /** Custom field name */
  name: Maybe<Scalars['String']['output']>;
  /** The field type, which decides how to read `value`. Image fields hold their images in `media_collection`. */
  type: Maybe<Scalars['String']['output']>;
  /** The team member's value for this custom field */
  value: Maybe<Scalars['JsonParser']['output']>;
};


/** A team member custom field defined by the organisation, with one person's value for it. */
export type TeamMemberCustomFieldMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type Tribe = {
  __typename?: 'Tribe';
  /** The first line of the tribe's street address. Uses the organisation's address instead when the tribe is set to use it. */
  address_1: Maybe<Scalars['String']['output']>;
  /** The second line of the tribe's street address. Uses the organisation's address instead when the tribe is set to use it. */
  address_2: Maybe<Scalars['String']['output']>;
  /** Items in the tribe's media library, 20 by default. */
  all_media: Maybe<Array<Maybe<OriginMedia>>>;
  /** The number that tracked calls to the tribe are answered on, as entered. */
  answer_number: Maybe<Scalars['String']['output']>;
  /** Articles written for the tribe. */
  articles: Maybe<Array<Maybe<Article>>>;
  /** A short caption for the tribe. */
  caption: Maybe<Scalars['String']['output']>;
  /** Component types used on the tribe's pages, each with the tribe's components of that type. */
  component_types: Maybe<Array<Maybe<TribeComponentType>>>;
  /** Named content for the tribe's pages. */
  contents: Maybe<Array<Maybe<TribeContent>>>;
  /** The tribe's country. Uses the organisation's address instead when the tribe is set to use it. */
  country: Maybe<Scalars['String']['output']>;
  /** The two-letter ISO code of the tribe's country. */
  country_iso: Maybe<Scalars['String']['output']>;
  /** Special opening hours for the next seven days, starting today in the tribe's timezone. */
  custom_opening_hours: Maybe<Array<Maybe<CustomOpeningHour>>>;
  /** Whether stock levels are shown on the website. */
  enable_inventory: Maybe<Scalars['Boolean']['output']>;
  /** Facebook Pixel ID */
  facebook_pixel_id: Maybe<Scalars['String']['output']>;
  /** The link customers use to leave a Facebook review. */
  facebook_review_link: Maybe<Scalars['String']['output']>;
  /** Whether the tribe can take online food orders, either through an online ordering link or its own online store. */
  food_shop_active: Maybe<Scalars['Boolean']['output']>;
  /** The tribe's Google Place ID. */
  google_place_id: Maybe<Scalars['String']['output']>;
  /** The link customers use to leave a Google review. */
  google_review_url: Maybe<Scalars['String']['output']>;
  /** The tribe page heading, with placeholders such as the tribe name filled in. */
  heading: Maybe<Scalars['String']['output']>;
  /** The tribe introduction, with placeholders such as the tribe name filled in. */
  introduction: Maybe<Scalars['String']['output']>;
  /** The bold opening of the tribe introduction, with placeholders such as the tribe name filled in. */
  introduction_bold: Maybe<Scalars['String']['output']>;
  /** The introduction to the team section, with placeholders such as the tribe name filled in. */
  introduction_team: Maybe<Scalars['String']['output']>;
  /** Whether the tribe uses an alternative address. False when not set. */
  is_alternate_address: Maybe<Scalars['Boolean']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The tribe's latitude. Uses the organisation's address instead when the tribe is set to use it. */
  latitude: Maybe<Scalars['String']['output']>;
  /** The tribe's suburb, town or city. Uses the organisation's address instead when the tribe is set to use it. */
  locality: Maybe<Scalars['String']['output']>;
  /** The tribe's longitude. Uses the organisation's address instead when the tribe is set to use it. */
  longitude: Maybe<Scalars['String']['output']>;
  /** The tribe's main telephone number, as entered. */
  main_telephone: Maybe<Scalars['String']['output']>;
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The tribe page meta description, with placeholders such as the tribe name filled in. */
  meta_description: Maybe<Scalars['String']['output']>;
  /** The tribe page meta title, with placeholders such as the tribe name filled in. */
  meta_title: Maybe<Scalars['String']['output']>;
  /** The tribe's name. */
  name: Scalars['String']['output'];
  /** Regular opening hours as a list of objects with `day`, `open` and `close`, one for each weekday and one for holidays, as entered. */
  opening_hours: Maybe<Scalars['JsonParser']['output']>;
  /** Opening hours as an object keyed by day (`Monday` to `Sunday`, and `Holiday`), each a list of periods with `open` and `close`. Times are 24-hour `HH:MM`, or 12-hour such as `9:00 am` when the tribe uses 12-hour time, and can be `Closed`. */
  opening_hours_array: Maybe<Scalars['JsonParser']['output']>;
  /** A message to show with the opening hours. */
  opening_hours_message: Maybe<Scalars['String']['output']>;
  /** The call tracking provider's code for `organic_number`. */
  organic_cid: Maybe<Scalars['String']['output']>;
  /** The call tracking number shown to visitors from organic search, formatted from E.164 to the national format of its country, for example `(02) 9876 5432`. */
  organic_number: Maybe<Scalars['String']['output']>;
  /** The id of the organisation the tribe belongs to. */
  organisation_id: Scalars['Int']['output'];
  /** Published examples of the tribe's work, newest first. */
  ourWorks: Maybe<Array<Maybe<OurWork>>>;
  /** The heading at the top of the tribe page, with placeholders such as the tribe name filled in. */
  page_heading: Maybe<Scalars['String']['output']>;
  /** The sub heading at the top of the tribe page, with placeholders such as the tribe name filled in. */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** The call tracking provider's code for `paid_number`. */
  paid_cid: Maybe<Scalars['String']['output']>;
  /** The call tracking number shown to visitors from paid search, formatted from E.164 to the national format of its country, for example `(02) 9876 5432`. */
  paid_number: Maybe<Scalars['String']['output']>;
  /** The extension for `main_telephone`. */
  phone_extension: Maybe<Scalars['String']['output']>;
  /** The tribe's postal code. Uses the organisation's address instead when the tribe is set to use it. */
  postal_code: Maybe<Scalars['String']['output']>;
  /** The tribe's public email address. */
  public_email: Maybe<Scalars['String']['output']>;
  /** Active, published job postings at the tribe. */
  recruitment_postings: Maybe<Array<Maybe<RecruitmentPosting>>>;
  /** Whether the tribe has an active online store. */
  shop_active: Maybe<Scalars['Boolean']['output']>;
  /** Whether the opening hours message should be shown. */
  show_opening_hours: Maybe<Scalars['Boolean']['output']>;
  /** Whether the tribe's online store shows prices. */
  show_price: Maybe<Scalars['Boolean']['output']>;
  /** The tribe's URL slug. */
  slug: Scalars['String']['output'];
  /** The label for the SMS consent checkbox. Null unless `sms_legal_message_enabled` is true. */
  sms_checkbox_label: Maybe<Scalars['String']['output']>;
  /** The SMS consent legal message. Null unless `sms_legal_message_enabled` is true. */
  sms_legal_message: Maybe<Scalars['String']['output']>;
  /** Whether an SMS consent message should be shown on the tribe's forms. */
  sms_legal_message_enabled: Scalars['Boolean']['output'];
  /** How SMS consent is collected on forms. Null unless `sms_legal_message_enabled` is true. */
  sms_legal_message_mode: Maybe<Scalars['String']['output']>;
  /** The label for the 'no' SMS consent option. Null unless `sms_legal_message_enabled` is true. */
  sms_radio_no_label: Maybe<Scalars['String']['output']>;
  /** The label for the 'yes' SMS consent option. Null unless `sms_legal_message_enabled` is true. */
  sms_radio_yes_label: Maybe<Scalars['String']['output']>;
  /** Facebook URL */
  social_facebook_url: Maybe<Scalars['String']['output']>;
  /** Google URL */
  social_google_url: Maybe<Scalars['String']['output']>;
  /** Instagram URL */
  social_instagram_url: Maybe<Scalars['String']['output']>;
  /** LinkedIn URL */
  social_linkedin_url: Maybe<Scalars['String']['output']>;
  /** Pinterest URL */
  social_pinterest_url: Maybe<Scalars['String']['output']>;
  /** Tiktok URL */
  social_tiktok_url: Maybe<Scalars['String']['output']>;
  /** Twitter URL */
  social_twitter_url: Maybe<Scalars['String']['output']>;
  /** Yelp URL */
  social_yelp_url: Maybe<Scalars['String']['output']>;
  /** Youtube URL */
  social_youtube_url: Maybe<Scalars['String']['output']>;
  /** The tribe's state or province. Uses the organisation's address instead when the tribe is set to use it. */
  state: Maybe<Scalars['String']['output']>;
  /** The short form of the tribe's state, for example `NSW`. Always the tribe's own value. */
  state_abbreviated: Maybe<Scalars['String']['output']>;
  /** The tribe status: `Active`, `Opening Soon`, `Testing`, `Paused` or `Deleted`. */
  status: Maybe<Scalars['String']['output']>;
  /** The Stripe publishable key for the tribe's online store. Null when the tribe has no active Stripe store. */
  stripe_public_key: Maybe<Scalars['String']['output']>;
  /** The tribe page sub heading, with placeholders such as the tribe name filled in. */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** People from the organisation chart who work at the tribe, in their saved order. */
  teamMembers: Maybe<Array<Maybe<OrgChartPerson>>>;
  /** Rules for swapping the displayed telephone number based on the page URL, as JSON, with numbers formatted from E.164 to national format. */
  telephone_url_triggers: Maybe<Scalars['JsonParser']['output']>;
  /** The tribe's timezone, for example `Australia/Sydney`. */
  timezone: Maybe<Scalars['String']['output']>;
  /** Tracking code to add to the tribe's pages. */
  tracking_code: Maybe<Scalars['String']['output']>;
  /** Navigation menus for the tribe's pages. */
  tribe_menus: Maybe<Array<Maybe<TribeMenu>>>;
  /** The same value as `opening_hours_array`. */
  tribe_opening_hours: Maybe<Scalars['JsonParser']['output']>;
  /** The sort position of the tribe in tribe lists. */
  tribe_sort_order: Maybe<Scalars['Int']['output']>;
  /** The tribe types the tribe belongs to. */
  tribe_types: Maybe<Array<Maybe<TribeType>>>;
  /** Whether the website may swap displayed phone numbers by traffic source (organisation master switch AND tribe opt-in) */
  website_number_swap_enabled: Scalars['Boolean']['output'];
  /** Website pages created for the tribe. */
  website_pages: Maybe<Array<Maybe<WebsitePage>>>;
  /** The tribe's WhatsApp number, as entered. */
  whats_app_number: Maybe<Scalars['String']['output']>;
  /** The link customers use to leave a Yelp review. */
  yelp_review_url: Maybe<Scalars['String']['output']>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeAll_MediaArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  id: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  order: InputMaybe<Scalars['String']['input']>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  star: InputMaybe<Scalars['Boolean']['input']>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeComponent_TypesArgs = {
  componentTypeName: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeContentsArgs = {
  name: InputMaybe<Scalars['String']['input']>;
  names: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tribeTypeName: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeOurWorksArgs = {
  slug: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeTeamMembersArgs = {
  active: InputMaybe<Scalars['Boolean']['input']>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeTribe_MenusArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  menus: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tribe_type: InputMaybe<Scalars['String']['input']>;
};


/** A tribe, one location of the organisation, with its address, contact details, opening hours and page content. */
export type TribeWebsite_PagesArgs = {
  slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};

/** A component used on tribes' pages, with its contents and the tribes it is active for. */
export type TribeComponent = {
  __typename?: 'TribeComponent';
  /** The active tribes that use the component. */
  activeTribes: Maybe<Array<Maybe<Tribe>>>;
  /** The component's contents. */
  contents: Maybe<Array<Maybe<TribeComponentContent>>>;
  /** Component name */
  name: Maybe<Scalars['String']['output']>;
  /** Component slug */
  slug: Maybe<Scalars['String']['output']>;
  /** The component's type. */
  type: Maybe<TribeComponentType>;
};


/** A component used on tribes' pages, with its contents and the tribes it is active for. */
export type TribeComponentContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** One named value inside a tribe component, such as a heading or an image. */
export type TribeComponentContent = {
  __typename?: 'TribeComponentContent';
  /** Images attached to this record, grouped into named collections such as `main`, `gallery` or `banner`. Each image includes absolute CDN URLs for every size. */
  media_collection: Maybe<Array<MediaCollection>>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** Component content type */
  type: Maybe<Scalars['String']['output']>;
  /** The text value, as stored. It is not translated. */
  value: Maybe<Scalars['String']['output']>;
};


/** One named value inside a tribe component, such as a heading or an image. */
export type TribeComponentContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type TribeComponentPagination = {
  __typename?: 'TribeComponentPagination';
  /** Current page of the cursor */
  current_page: Scalars['Int']['output'];
  /** List of items on the current page */
  data: Array<TribeComponent>;
  /** Number of the first item returned */
  from: Maybe<Scalars['Int']['output']>;
  /** Determines if cursor has more pages after the current page */
  has_more_pages: Scalars['Boolean']['output'];
  /** The last page (number of pages) */
  last_page: Scalars['Int']['output'];
  /** Number of items returned per page */
  per_page: Scalars['Int']['output'];
  /** Number of the last item returned */
  to: Maybe<Scalars['Int']['output']>;
  /** Number of total items selected by the query */
  total: Scalars['Int']['output'];
};

/** A type of component used on a tribe's pages, with the components of that type. */
export type TribeComponentType = {
  __typename?: 'TribeComponentType';
  /** The components of this type, in their saved order. */
  components: Maybe<Array<Maybe<TribeComponent>>>;
  /** Component type name */
  name: Maybe<Scalars['String']['output']>;
  /** Component type status */
  status: Maybe<Scalars['String']['output']>;
};


/** A type of component used on a tribe's pages, with the components of that type. */
export type TribeComponentTypeComponentsArgs = {
  name: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

/** A named piece of content on a tribe's pages, such as a heading, text block or image. */
export type TribeContent = {
  __typename?: 'TribeContent';
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The content name. */
  name: Maybe<Scalars['String']['output']>;
  /** The content type, for example `Short Text` or `Single Image`. */
  type: Maybe<Scalars['String']['output']>;
  /** The text value in the requested locale, with tribe placeholders filled in. Null for image content; read `media_collection` instead. */
  value: Maybe<Scalars['String']['output']>;
};


/** A named piece of content on a tribe's pages, such as a heading, text block or image. */
export type TribeContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A navigation menu for a tribe's pages. */
export type TribeMenu = {
  __typename?: 'TribeMenu';
  /** The menu structure, as JSON. */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The menu name. An empty string when the menu has no data. */
  name: Maybe<Scalars['String']['output']>;
};

/** A tribe type, used to group tribes that share menus, content and promotions. */
export type TribeType = {
  __typename?: 'TribeType';
  /** The tribe type's name. */
  name: Maybe<Scalars['String']['output']>;
  /** A short code for the tribe type. */
  short_code: Maybe<Scalars['String']['output']>;
};

/** A named piece of content in a website section, such as a heading, text block or image. */
export type WebsiteContent = {
  __typename?: 'WebsiteContent';
  /** The start of the current day, not when the record changed. Use `last_updated_at` on the `websiteInfo` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The content name. */
  name: Maybe<Scalars['String']['output']>;
  /** The content type, for example `Short Text`, `Rich Text` or `Gallery`. */
  type: Maybe<Scalars['String']['output']>;
  /** The text value in the requested locale. Null for image content; read `media_collection` instead. */
  value: Maybe<Scalars['String']['output']>;
};


/** A named piece of content in a website section, such as a heading, text block or image. */
export type WebsiteContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A navigation menu on the website. */
export type WebsiteMenu = {
  __typename?: 'WebsiteMenu';
  /** The time of the request, not when the record changed. Use `last_updated_at` on the `websiteInfo` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The menu structure, as JSON. */
  menu_json: Maybe<Scalars['JsonParser']['output']>;
  /** The menu name. */
  name: Maybe<Scalars['String']['output']>;
};

/** A redirect rule that sends visitors from one address on the website to another. */
export type WebsiteRedirect = {
  __typename?: 'WebsiteRedirect';
  /** The address to redirect from. */
  from: Scalars['String']['output'];
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The address to redirect to. */
  to: Scalars['String']['output'];
};

/** A named section of the website, such as a header or footer, holding shared content. */
export type WebsiteSection = {
  __typename?: 'WebsiteSection';
  /** The content in the section. */
  contents: Maybe<Array<Maybe<WebsiteContent>>>;
  /** The time of the request, not when the record changed. Use `last_updated_at` on the `websiteInfo` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The section name. */
  name: Maybe<Scalars['String']['output']>;
};


/** A named section of the website, such as a header or footer, holding shared content. */
export type WebsiteSectionContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A custom field on an article, defined by the article's page template. */
export type ArticleFields = {
  __typename?: 'articleFields';
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** Article field name */
  name: Maybe<Scalars['String']['output']>;
  /** Where the field comes from, for example `template`. */
  source: Maybe<Scalars['String']['output']>;
  /** The field type, for example `Short Text`, `Rich Text` or `Single Image`. */
  type: Maybe<Scalars['String']['output']>;
  /** The field value in the requested locale. Null for image fields; read `media_collection` instead. */
  value: Maybe<Scalars['String']['output']>;
};


/** A custom field on an article, defined by the article's page template. */
export type ArticleFieldsMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A website that belongs to a child organisation of this website's organisation. */
export type ChildWebsite = {
  __typename?: 'childWebsite';
  /** Path prefix for tribe pages on the child website; a tribe's path is this prefix followed by its slug. */
  base_tribes_path: Maybe<Scalars['String']['output']>;
  /** The id of the child organisation that owns the website. */
  organisation_id: Maybe<Scalars['Int']['output']>;
  /** The child website's public base URL. */
  website_url: Maybe<Scalars['String']['output']>;
};

/** The customer a login token belongs to, with their contact details and stored attributes. */
export type LoginUserByToken = {
  __typename?: 'loginUserByToken';
  /** The first line of the street address. */
  address_1: Maybe<Scalars['String']['output']>;
  /** Country */
  country: Maybe<Scalars['String']['output']>;
  /** The customer's email address. */
  email: Scalars['String']['output'];
  /** First name */
  first_name: Scalars['String']['output'];
  /** Last name */
  last_name: Scalars['String']['output'];
  /** The suburb, town or city. */
  locality: Maybe<Scalars['String']['output']>;
  /** Values stored against the login for one platform. */
  loginAttributes: Maybe<Array<LoginAttribute>>;
  /** The dialling code of the mobile number, for example `+61`. */
  mobile_code: Maybe<Scalars['String']['output']>;
  /** The two-letter country code of the mobile number, for example `AU`. */
  mobile_country: Maybe<Scalars['String']['output']>;
  /** The mobile number formatted for display. */
  mobile_display: Maybe<Scalars['String']['output']>;
  /** The mobile number in E.164 format, for example `+61412345678`. */
  mobile_e164: Maybe<Scalars['String']['output']>;
  /** The postal code. */
  postal_code: Maybe<Scalars['String']['output']>;
  /** The state or province. */
  state: Maybe<Scalars['String']['output']>;
};


/** The customer a login token belongs to, with their contact details and stored attributes. */
export type LoginUserByTokenLoginAttributesArgs = {
  attribute_names: Array<InputMaybe<Scalars['String']['input']>>;
  platform: Scalars['String']['input'];
};

/** The organisation that owns the website, with its currency, public contact details and media library. */
export type Organisation = {
  __typename?: 'organisation';
  /** Items in the organisation's media library, 20 by default. */
  all_media: Maybe<Array<Maybe<OriginMedia>>>;
  /** The organisation's currency code, for example `AUD` or `USD`. */
  currency: Maybe<Scalars['String']['output']>;
  /** The symbol to show beside prices, for example `$`. */
  currency_symbol: Maybe<Scalars['String']['output']>;
  /** The organisation's public email address. */
  email_address: Maybe<Scalars['String']['output']>;
  /** The organisation's name. */
  name: Maybe<Scalars['String']['output']>;
  /** The organisation's public telephone number in E.164 format, for example `+61412345678`. */
  tel_e164: Maybe<Scalars['String']['output']>;
};


/** The organisation that owns the website, with its currency, public contact details and media library. */
export type OrganisationAll_MediaArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  id: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  order: InputMaybe<Scalars['String']['input']>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  star: InputMaybe<Scalars['Boolean']['input']>;
};

/** Online store settings, such as tax, pricing, preparation time and pickup rules. */
export type StoreSetting = {
  __typename?: 'storeSetting';
  /** Whether the store is active. */
  active: Scalars['Boolean']['output'];
  /** The legal name of the business. */
  business_legal_name: Maybe<Scalars['String']['output']>;
  /** The business's tax number. */
  business_tax_number: Maybe<Scalars['String']['output']>;
  /** Whether delivery and pickup times are limited to the tribe's opening hours. */
  delivery_only_open_hours: Maybe<Scalars['Boolean']['output']>;
  /** A message shown to customers about early pickup. */
  early_pickup_message: Maybe<Scalars['String']['output']>;
  /** The minimum order amount for early pickup, in major currency units (for example dollars). */
  early_pickup_minimum: Maybe<Scalars['Float']['output']>;
  /** Whether early pickup is offered. */
  enable_early_pickup: Maybe<Scalars['Boolean']['output']>;
  /** Whether tribes can set their own prices. */
  enable_tribe_pricing: Maybe<Scalars['Boolean']['output']>;
  /** The minimum installation fee, in major currency units (for example dollars). */
  min_installation_fee: Maybe<Scalars['Float']['output']>;
  /** The minimum time needed to prepare an order, in minutes. */
  minimum_preparation_time: Maybe<Scalars['Int']['output']>;
  /** The organisation the store belongs to. */
  organisation: Organisation;
  /** Whether prices are shown in the store. */
  show_price: Maybe<Scalars['Boolean']['output']>;
  /** The store's tax rate. Zero when no rate is set. */
  store_tax_rate: Scalars['Float']['output'];
  /** How tax is applied: `No Tax`, `Included in price` or `Added to total`. An empty string when not set. */
  store_tax_settings: Scalars['String']['output'];
};

/** A tribe's customised wording for a product category. */
export type TribeProductCategoryType = {
  __typename?: 'tribeProductCategoryType';
  /** The customised values, as JSON keyed by field name, for example `heading`. */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** The customisation id. */
  id: Maybe<Scalars['Int']['output']>;
  /** The id of the tribe that made the customisation. */
  tribe_id: Maybe<Scalars['Int']['output']>;
};

/** A tribe's customised wording for a product range. */
export type TribeProductRangeType = {
  __typename?: 'tribeProductRangeType';
  /** The customised values, as JSON keyed by field name, for example `heading`. */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** The customisation id. */
  id: Maybe<Scalars['Int']['output']>;
};

/** A website managed in Gorilla Dash, with its base URL, path settings, organisation and theme. */
export type Website = {
  __typename?: 'website';
  /** The path prefix for product category pages; a category path is this prefix followed by the category `slug`. */
  base_categories_path: Maybe<Scalars['String']['output']>;
  /** The path prefix for product pages; a product path is this prefix followed by the product `slug`. */
  base_products_path: Maybe<Scalars['String']['output']>;
  /** The path prefix for product range pages; a range path is this prefix followed by the range `slug`. */
  base_ranges_path: Maybe<Scalars['String']['output']>;
  /** The path prefix for tribe pages; a tribe path is this prefix followed by the tribe `slug`. */
  base_tribes_path: Maybe<Scalars['String']['output']>;
  /** When the website's pages, page content, sections, section content or menus last changed, or its settings were saved. Use it to detect changes to website content. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The website name. */
  name: Maybe<Scalars['String']['output']>;
  /** The organisation that owns the website. */
  organisation: Maybe<Organisation>;
  /** Theme tokens for this website */
  style: Maybe<WebsiteStyle>;
  /** The website's public base URL, for example `https://www.example.com`. */
  url: Maybe<Scalars['String']['output']>;
};

/** A frequently asked question and its answer. */
export type WebsiteFaq = {
  __typename?: 'websiteFaq';
  /** The answer. */
  answer: Maybe<Scalars['String']['output']>;
  /** The category the question belongs to. */
  faq_category: Maybe<WebsiteFaqCategory>;
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The question. */
  question: Maybe<Scalars['String']['output']>;
  /** The question's URL slug. */
  slug: Maybe<Scalars['String']['output']>;
  /** The sort position within the category. */
  sort: Maybe<Scalars['Int']['output']>;
};

/** A group of frequently asked questions on the website. */
export type WebsiteFaqCategory = {
  __typename?: 'websiteFaqCategory';
  /** The time of the request, not when the record changed, so it cannot be used to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The category name. */
  name: Maybe<Scalars['String']['output']>;
  /** The sort position of the category. */
  sort: Maybe<Scalars['Int']['output']>;
  /** The questions in the category. */
  website_faqs: Maybe<Array<Maybe<WebsiteFaq>>>;
};

/** A page on the website, with its content, SEO fields, template and related records. */
export type WebsitePage = {
  __typename?: 'websitePage';
  /** The page body HTML, in the requested locale. */
  body: Maybe<Scalars['String']['output']>;
  /** Component types used on the page, with their components. */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** The page's named content. Content placed with the page builder is not included. */
  contents: Maybe<Array<Maybe<WebsitePageContent>>>;
  /** Website page related food menu list items */
  foodMenuListItems: Maybe<Array<Maybe<FoodMenuListItem>>>;
  /** Whether the page belongs to a tribe. */
  is_tribe_page: Maybe<Scalars['Boolean']['output']>;
  /** The time of the request, not when the record changed. Use `last_updated_at` on the `websiteInfo` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** The label to use for the page in menus. */
  menu_label: Maybe<Scalars['String']['output']>;
  /** The sort position of the page in menus. */
  menu_order: Maybe<Scalars['Int']['output']>;
  /** The menu section the page appears under. */
  menu_section: Maybe<Scalars['String']['output']>;
  /** The page meta description in the requested locale, with placeholders such as the tribe name filled in. */
  meta_description: Maybe<Scalars['String']['output']>;
  /** The page meta title in the requested locale, with placeholders such as the tribe name filled in. */
  meta_title: Maybe<Scalars['String']['output']>;
  /** The page name, in the requested locale. */
  name: Maybe<Scalars['String']['output']>;
  /** Whether search engines should be told not to index the page. */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** Website page related product categories */
  productCategories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Website page related product ranges */
  productRanges: Maybe<Array<Maybe<ProductRange>>>;
  /** Website page related products */
  products: Maybe<Array<Maybe<Product>>>;
  /** Whether the page should appear in navigation menus. */
  show_in_menu: Maybe<Scalars['Boolean']['output']>;
  /** The page's URL slug, in the requested locale. */
  slug: Maybe<Scalars['String']['output']>;
  /** The name of the template the page uses. */
  template_name: Maybe<Scalars['String']['output']>;
  /** The slug of the template the page uses. */
  template_slug: Maybe<Scalars['String']['output']>;
  /** Tracking parameters configured for the page, as JSON. */
  tracking_parameters: Maybe<Scalars['JsonParser']['output']>;
  /** The tribe the page belongs to, for tribe pages. */
  tribe: Maybe<Tribe>;
  /** Website page related tribes */
  tribes: Maybe<Array<Maybe<Tribe>>>;
  /** The front-end route name for the page, taken from its template when the page does not set one. */
  vue_route_name: Maybe<Scalars['String']['output']>;
};


/** A page on the website, with its content, SEO fields, template and related records. */
export type WebsitePageComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A page on the website, with its content, SEO fields, template and related records. */
export type WebsitePageFoodMenuListItemsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};

/** A named piece of content on a website page, such as a heading, text block or image. */
export type WebsitePageContent = {
  __typename?: 'websitePageContent';
  /** The start of the current day, not when the record changed. Use `last_updated_at` on the `websiteInfo` query to detect changes. */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Images held by this content, grouped into named collections, using the requested locale's images when a translation has its own. Each image includes absolute CDN URLs for every size. */
  media_collection: Array<MediaCollection>;
  /** The content name. */
  name: Maybe<Scalars['String']['output']>;
  /** Where the content comes from: `single` for content entered on this page, or `template` for a field from the page template. */
  source: Maybe<Scalars['String']['output']>;
  /** The content type, for example `Short Text`, `Rich Text` or `Single Image`. */
  type: Maybe<Scalars['String']['output']>;
  /** The text value in the requested locale. Null for image content; read `media_collection` instead. */
  value: Maybe<Scalars['String']['output']>;
};


/** A named piece of content on a website page, such as a heading, text block or image. */
export type WebsitePageContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A page template that website pages are built from. */
export type WebsitePageTemplate = {
  __typename?: 'websitePageTemplate';
  /** The template name. */
  name: Maybe<Scalars['String']['output']>;
  /** Whether the template is for organisation-level pages. */
  organisation_template: Maybe<Scalars['Boolean']['output']>;
  /** The template slug. */
  slug: Maybe<Scalars['String']['output']>;
  /** Whether the template is for tribe pages. */
  tribe_template: Maybe<Scalars['Boolean']['output']>;
};

/** The fonts, colours, spacing and shapes a website paints its pages with */
export type WebsiteStyle = {
  __typename?: 'websiteStyle';
  /** Page-level font, weight and background colour */
  body: Maybe<Scalars['JsonParser']['output']>;
  /** Primary button colours and corner radius, plus the secondary button */
  button: Maybe<Scalars['JsonParser']['output']>;
  /** Heading font, colour, line height, letter spacing, transform and the h1-h4 sizes */
  heading: Maybe<Scalars['JsonParser']['output']>;
  /** Section spacing, content width, corner radius, border colour and form field styling */
  layout: Maybe<Scalars['JsonParser']['output']>;
  /** Link colour, hover colour and whether links are underlined */
  link: Maybe<Scalars['JsonParser']['output']>;
  /** Named brand colours: primary, secondary, accent, light and dark section backgrounds */
  palette: Maybe<Scalars['JsonParser']['output']>;
  /** Body copy font, size, weight, colour and line height */
  paragraph: Maybe<Scalars['JsonParser']['output']>;
};

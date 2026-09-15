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

/** Appointment available time type */
export type AppointmentAvailableTime = {
  __typename?: 'AppointmentAvailableTime';
  /** Appointment Date */
  date: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Appointment Available times */
  times: Maybe<Scalars['JsonParser']['output']>;
  /** Appointment type */
  type: Maybe<Scalars['String']['output']>;
};

/** A Article type */
export type Article = {
  __typename?: 'Article';
  /** Article abstract */
  abstract: Maybe<Scalars['String']['output']>;
  /** Article article */
  article: Maybe<Scalars['String']['output']>;
  /** Article fields */
  articleFields: Maybe<Array<Maybe<ArticleFields>>>;
  /** Article categories */
  article_categories: Array<ArticleCategory>;
  /** Article author */
  author: Maybe<Scalars['String']['output']>;
  /** Created At */
  created_at: Maybe<Scalars['String']['output']>;
  /** editor enabled */
  editor_enabled: Maybe<Scalars['Boolean']['output']>;
  /** Facts Table */
  facts_table: Maybe<Scalars['JsonParser']['output']>;
  /** Related Feature Articles */
  feature_related_articles: Array<Article>;
  /** Feature website page */
  feature_website_page: Maybe<WebsitePage>;
  /** Feature website page id */
  feature_website_page_id: Maybe<Scalars['Int']['output']>;
  /** Gorilla dash new links */
  gorilla_news_links: Array<GorillaNewsLink>;
  /** Article heading */
  heading: Scalars['String']['output'];
  /** editor html */
  html: Maybe<Scalars['String']['output']>;
  /** Is customised from organisation article */
  is_customised: Maybe<Scalars['Boolean']['output']>;
  /** Article Organisation */
  is_organisation: Maybe<Scalars['Boolean']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product media */
  media_collection: Array<MediaCollection>;
  /** meta canonical */
  meta_canonical: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Next (newer) published article in the same listing */
  next: Maybe<Article>;
  /** no index */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** Previous (older) published article in the same listing */
  prev: Maybe<Article>;
  /** Related Articles */
  related_articles: Array<Article>;
  /** Article slug */
  slug: Scalars['String']['output'];
  /** Article heading */
  status: Maybe<Scalars['String']['output']>;
  /** Article sub heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Top Bullet Points */
  top_bullet_points: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Updated At */
  updated_at: Maybe<Scalars['String']['output']>;
};


/** A Article type */
export type ArticleFeature_Related_ArticlesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};


/** A Article type */
export type ArticleMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A Article type */
export type ArticleNextArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A Article type */
export type ArticlePrevArgs = {
  categories: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A Article type */
export type ArticleRelated_ArticlesArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
};

/** A Article Category type */
export type ArticleCategory = {
  __typename?: 'ArticleCategory';
  /** Article list */
  articles: Maybe<Array<Maybe<Article>>>;
  /** Article list with pagination */
  articlesPagination: Maybe<ArticlePagination>;
  /** Article count */
  articles_count: Scalars['Int']['output'];
  /** Article category caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Article category heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product media */
  media_collection: Array<MediaCollection>;
  /** Article category name */
  name: Maybe<Scalars['String']['output']>;
  /** Article category slug */
  slug: Maybe<Scalars['String']['output']>;
};


/** A Article Category type */
export type ArticleCategoryArticlesArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};


/** A Article Category type */
export type ArticleCategoryArticlesPaginationArgs = {
  itemsPerPage: InputMaybe<Scalars['Int']['input']>;
  page: InputMaybe<Scalars['Int']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};


/** A Article Category type */
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

/** A public-safe source the chatbot used to answer. */
export type ChatbotCitation = {
  __typename?: 'ChatbotCitation';
  heading: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['String']['output']>;
  source_type: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
};

/** The chatbot's response to a public website visitor turn. */
export type ChatbotReply = {
  __typename?: 'ChatbotReply';
  citations: Maybe<Array<Maybe<ChatbotCitation>>>;
  greeting: Maybe<Scalars['String']['output']>;
  lead_captured: Maybe<Scalars['Boolean']['output']>;
  reply: Maybe<Scalars['String']['output']>;
  session_token: Maybe<Scalars['String']['output']>;
  suggested_tribes: Maybe<Array<Maybe<ChatbotSuggestedTribe>>>;
  tribe: Maybe<ChatbotSuggestedTribe>;
  /** Whether suggested_tribes is a choice to put to the visitor (render them as selectable locations) rather than background context. */
  tribe_choice: Maybe<Scalars['Boolean']['output']>;
};

/** A tribe (location) the chatbot can tie a session to. */
export type ChatbotSuggestedTribe = {
  __typename?: 'ChatbotSuggestedTribe';
  /** Straight-line distance in statute miles (legacy consumers). */
  distance: Maybe<Scalars['Float']['output']>;
  /** Straight-line distance in kilometres. */
  distance_km: Maybe<Scalars['Float']['output']>;
  /** That distance ready to show a visitor, in the unit the business's country uses (e.g. "24 km", "15 miles"). */
  distance_label: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['Int']['output']>;
  locality: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
};

/** A component */
export type Component = {
  __typename?: 'Component';
  /** Component contents */
  contents: Array<ComponentContent>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Component name */
  name: Maybe<Scalars['String']['output']>;
  /** Product Categories */
  product_categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product Ranges */
  product_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Products */
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


/** A component */
export type ComponentContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A component content */
export type ComponentContent = {
  __typename?: 'ComponentContent';
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Component content media */
  media_collection: Array<MediaCollection>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** Component content type */
  type: Maybe<Scalars['String']['output']>;
  /** Component content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A component content */
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

/** A component type */
export type ComponentType = {
  __typename?: 'ComponentType';
  /** Component type base_path */
  base_path: Maybe<Scalars['String']['output']>;
  /** Components */
  components: Array<Component>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Component type name */
  name: Maybe<Scalars['String']['output']>;
  /** Component type status */
  status: Maybe<Scalars['String']['output']>;
};


/** A component type */
export type ComponentTypeComponentsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};

/** A tribe custom opening hour */
export type CustomOpeningHour = {
  __typename?: 'CustomOpeningHour';
  /** Close time of the custom opening hour */
  close: Scalars['String']['output'];
  /** Date of the custom opening hour */
  date: Scalars['String']['output'];
  /** Name of the custom opening hour */
  name: Scalars['String']['output'];
  /** Open time of the custom opening hour */
  open: Scalars['String']['output'];
  /** Organisation Id */
  organisation_id: Scalars['Int']['output'];
  /** Tribe Id */
  tribe_id: Scalars['Int']['output'];
};

/** A enquiry form type */
export type EnquiryForm = {
  __typename?: 'EnquiryForm';
  /** enquiry fields */
  fields: Array<EnquiryFormField>;
  /** enquiry name */
  name: Scalars['String']['output'];
};

/** A enquiry form field type */
export type EnquiryFormField = {
  __typename?: 'EnquiryFormField';
  /** field name */
  name: Scalars['String']['output'];
  /** field type */
  type: Scalars['String']['output'];
  /** field name */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** A food component type */
export type FoodComponent = {
  __typename?: 'FoodComponent';
  /** measurement */
  measurement: Scalars['String']['output'];
  /** measurement_size */
  measurement_size: Scalars['String']['output'];
  /** name */
  name: Scalars['String']['output'];
};

/** A food coupon type */
export type FoodCoupon = {
  __typename?: 'FoodCoupon';
  /** The code of the food coupon */
  code: Scalars['String']['output'];
  /** The end date of the food coupon */
  end_date: Maybe<Scalars['String']['output']>;
  /** The food coupon id */
  id: Scalars['Int']['output'];
  /** The minimum spend of the food coupon */
  minimum_spend: Scalars['Int']['output'];
  /** The name of the food coupon */
  name: Scalars['String']['output'];
  /** The no end date of the food coupon */
  no_end_date: Scalars['Boolean']['output'];
  /** The quantity of the food coupon */
  quantity: Maybe<Scalars['Int']['output']>;
  /** The quantity customer unlimited of the food coupon */
  quantity_customer_unlimited: Scalars['Boolean']['output'];
  /** The quantity per customer of the food coupon */
  quantity_per_customer: Maybe<Scalars['Int']['output']>;
  /** The quantity unlimited of the food coupon */
  quantity_unlimited: Scalars['Boolean']['output'];
  /** The start date of the food coupon */
  start_date: Maybe<Scalars['String']['output']>;
  /** The status of the food coupon */
  status: Scalars['String']['output'];
  /** The tribes of the food coupon */
  tribes: Maybe<Array<Tribe>>;
  /** The type of the food coupon */
  type: Scalars['String']['output'];
  /** The value of the food coupon */
  value: Scalars['Int']['output'];
};

/** A food coupon available type */
export type FoodCouponAvailable = {
  __typename?: 'FoodCouponAvailable';
  /** The amount of the food coupon */
  amount: Scalars['Int']['output'];
  /** The code of the food coupon */
  code: Scalars['String']['output'];
  /** The discount amount of the food coupon */
  discount_amount: Scalars['Int']['output'];
  /** The food menu item of the food coupon */
  food_menu_item: Maybe<FoodMenuItem>;
  /** The id of the food coupon */
  id: Scalars['Int']['output'];
  /** The origin amount of the food coupon */
  origin_amount: Scalars['Int']['output'];
  /** The type of the food coupon */
  type: Scalars['String']['output'];
  /** The value of the food coupon */
  value: Scalars['Int']['output'];
};

/** A food menu type */
export type FoodMenu = {
  __typename?: 'FoodMenu';
  /** Food menu sections */
  foodMenuSections: Maybe<Array<FoodMenuSection>>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
};

/** A food menu item type */
export type FoodMenuItem = {
  __typename?: 'FoodMenuItem';
  /** Allergy statement */
  allergy_statement: Maybe<Scalars['String']['output']>;
  /** Energy per serving in Calories (kcal), converted when entered in kilojoules */
  calories: Maybe<Scalars['Float']['output']>;
  /** Default price */
  default_price: Scalars['Float']['output'];
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** Unit the energy was entered in — `kcal` or `kJ` */
  energy_unit: Maybe<Scalars['String']['output']>;
  /** Energy per serving, as entered by the operator */
  energy_value: Maybe<Scalars['Float']['output']>;
  /** Food menu item attributes */
  foodAttributes: Array<FoodMenuItemAttribute>;
  /** Food modifier group */
  foodModifierGroups: Array<FoodModifierGroup>;
  /** Food products */
  foodProducts: Array<FoodProduct>;
  /** Food menu item id */
  id: Scalars['Int']['output'];
  /** Energy per serving in kilojoules, converted when entered in Calories (kcal) */
  kilojoules: Maybe<Scalars['Float']['output']>;
  /** media */
  media_collection: Array<MediaCollection>;
  /** Name */
  name: Scalars['String']['output'];
  /** Photo description */
  photo_description: Maybe<Scalars['String']['output']>;
  /** Price */
  price: Scalars['Float']['output'];
  /** Unit the serving size is measured in, e.g. g, oz, ml, slice */
  serving_size_measure: Maybe<Scalars['String']['output']>;
  /** Nutrition serving size the figures below are measured over */
  serving_size_quantity: Maybe<Scalars['Float']['output']>;
  /** sort */
  sort: Scalars['Int']['output'];
  /** tribe price */
  tribeFoodMenuPrice: Maybe<FoodMenuItemTribePrice>;
};


/** A food menu item type */
export type FoodMenuItemMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A food menu item type */
export type FoodMenuItemTribeFoodMenuPriceArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};

/** A food menu item attribute type */
export type FoodMenuItemAttribute = {
  __typename?: 'FoodMenuItemAttribute';
  /** Food menu item attribute id */
  id: Scalars['Int']['output'];
  /** media */
  media_collection: Array<MediaCollection>;
  /** Name */
  name: Scalars['String']['output'];
};


/** A food menu item attribute type */
export type FoodMenuItemAttributeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A food menu item tribe price type */
export type FoodMenuItemTribePrice = {
  __typename?: 'FoodMenuItemTribePrice';
  /** Enabled */
  enabled: Maybe<Scalars['Boolean']['output']>;
  /** External order URL */
  external_order_url: Maybe<Scalars['String']['output']>;
  /** Price */
  price: Maybe<Scalars['Float']['output']>;
  /** Use default price */
  use_default_price: Maybe<Scalars['Boolean']['output']>;
};

/** A food menu list items type */
export type FoodMenuListItem = {
  __typename?: 'FoodMenuListItem';
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** External order URL */
  external_order_url: Maybe<Scalars['String']['output']>;
  /** Food menu items */
  foodMenuItems: Array<FoodMenuItem>;
  /** Food menu section */
  foodMenuSection: FoodMenuSection;
  /** Food menu list item id */
  id: Scalars['Int']['output'];
  /** media */
  media_collection: Array<MediaCollection>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Paired food menu list items, in their configured sort order */
  pairings: Array<FoodMenuListItem>;
  /** Photo description */
  photo_description: Maybe<Scalars['String']['output']>;
  /** Slug */
  slug: Scalars['String']['output'];
  /** Sort */
  sort: Maybe<Scalars['Int']['output']>;
  /** Status */
  status: Maybe<Scalars['String']['output']>;
  /** Type */
  type: Maybe<Scalars['String']['output']>;
};


/** A food menu list items type */
export type FoodMenuListItemExternal_Order_UrlArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A food menu list items type */
export type FoodMenuListItemMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A food menu list items type */
export type FoodMenuListItemPairingsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};

/** A food menu section type */
export type FoodMenuSection = {
  __typename?: 'FoodMenuSection';
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** Food menu list items */
  foodMenuListItems: Array<FoodMenuListItem>;
  /** media */
  media_collection: Array<MediaCollection>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Show on nav */
  show_on_nav: Scalars['Boolean']['output'];
  /** Slug */
  slug: Scalars['String']['output'];
  /** Sort */
  sort: Maybe<Scalars['Int']['output']>;
};


/** A food menu section type */
export type FoodMenuSectionFoodMenuListItemsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};


/** A food menu section type */
export type FoodMenuSectionMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A food modifier type */
export type FoodModifier = {
  __typename?: 'FoodModifier';
  /** Food modifier id */
  id: Scalars['Int']['output'];
  /** Label */
  label: Scalars['String']['output'];
  /** link_product */
  link_product: Scalars['Boolean']['output'];
  /** price */
  price: Scalars['Float']['output'];
  /** quantity */
  quantity: Scalars['Float']['output'];
};

/** A food modifier group type */
export type FoodModifierGroup = {
  __typename?: 'FoodModifierGroup';
  /** Enable Quantity */
  enable_qty: Maybe<Scalars['Boolean']['output']>;
  /** Food modifier */
  foodModifiers: Array<FoodModifier>;
  /** Food modifier group id */
  id: Scalars['Int']['output'];
  /** Label */
  label: Maybe<Scalars['String']['output']>;
  /** Maximum Selection */
  maximum_selection: Maybe<Scalars['Int']['output']>;
  /** Minimum Selection */
  minimum_selection: Maybe<Scalars['Int']['output']>;
  /** Name */
  name: Scalars['String']['output'];
  /** No Maximum */
  no_maximum: Maybe<Scalars['Boolean']['output']>;
  /** No Minimum */
  no_minimum: Maybe<Scalars['Boolean']['output']>;
};

/** A food ordering portal */
export type FoodOrderingPortal = {
  __typename?: 'FoodOrderingPortal';
  /** customer_main_contact_email */
  customer_main_contact_email: Maybe<Scalars['String']['output']>;
  /** customer_main_contact_name */
  customer_main_contact_name: Maybe<Scalars['String']['output']>;
  /** customer_main_contact_telephone */
  customer_main_contact_telephone: Maybe<Scalars['String']['output']>;
  /** description */
  description: Maybe<Scalars['String']['output']>;
  /** foodMenu */
  foodMenu: Maybe<FoodMenu>;
  /** heading */
  heading: Maybe<Scalars['String']['output']>;
  /** name */
  name: Scalars['String']['output'];
  /** no_index */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** ordering_instructions */
  ordering_instructions: Maybe<Scalars['String']['output']>;
  /** sales_flow */
  sales_flow: Maybe<Scalars['String']['output']>;
  /** slug */
  slug: Scalars['String']['output'];
  /** status */
  status: Scalars['String']['output'];
  /** sub_heading */
  sub_heading: Maybe<Scalars['String']['output']>;
};

/** A food ordering portal location */
export type FoodOrderingPortalLocation = {
  __typename?: 'FoodOrderingPortalLocation';
  /** address 1 */
  address_1: Maybe<Scalars['String']['output']>;
  /** address 2 */
  address_2: Maybe<Scalars['String']['output']>;
  /** allow delivery */
  allow_delivery: Maybe<Scalars['Boolean']['output']>;
  /** allow pickup */
  allow_pickup: Maybe<Scalars['Boolean']['output']>;
  /** contact email */
  contact_email: Maybe<Scalars['String']['output']>;
  /** contact name */
  contact_name: Maybe<Scalars['String']['output']>;
  /** country */
  country: Maybe<Scalars['String']['output']>;
  /** external id */
  external_id: Maybe<Scalars['String']['output']>;
  /** locality */
  locality: Maybe<Scalars['String']['output']>;
  /** name */
  name: Scalars['String']['output'];
  /** notes */
  notes: Maybe<Scalars['String']['output']>;
  /** postcode */
  postcode: Maybe<Scalars['String']['output']>;
  /** state */
  state: Maybe<Scalars['String']['output']>;
  /** status */
  status: Scalars['String']['output'];
  /** telephone_e164 */
  telephone_e164: Maybe<Scalars['String']['output']>;
  /** Tribe */
  tribe: Maybe<Tribe>;
  /** tribe id */
  tribe_id: Maybe<Scalars['Int']['output']>;
};

/** A food product type */
export type FoodProduct = {
  __typename?: 'FoodProduct';
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** food product components */
  foodProductComponents: Array<FoodProductComponent>;
  /** Food product id */
  id: Scalars['Int']['output'];
  /** media */
  media_collection: Array<MediaCollection>;
  /** Name */
  name: Scalars['String']['output'];
};


/** A food product type */
export type FoodProductMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A food product component type */
export type FoodProductComponent = {
  __typename?: 'FoodProductComponent';
  /** food component */
  foodComponent: FoodComponent;
  /** measurement */
  measurement: Scalars['String']['output'];
  /** measurement_size */
  measurement_size: Scalars['String']['output'];
  /** quantity */
  quantity: Scalars['Float']['output'];
};

/** A type */
export type FoodShoppingCart = {
  __typename?: 'FoodShoppingCart';
  /** food shopping cart items */
  foodShoppingCartItems: Maybe<Array<FoodShoppingCartItem>>;
  /** The session id of the user */
  session_id: Scalars['String']['output'];
};

/** A type */
export type FoodShoppingCartItem = {
  __typename?: 'FoodShoppingCartItem';
  foodMenuItem: FoodMenuItem;
  foodMenuListItem: FoodMenuListItem;
  /** food shopping cart modifiers */
  foodShoppingCartModifiers: Maybe<Array<FoodShoppingCartModifier>>;
  /** The id of the shopping cart item */
  id: Scalars['Int']['output'];
  /** The quantity of the shopping cart item */
  quantity: Scalars['Int']['output'];
  /** The sub total of the food item */
  sub_total: Scalars['Float']['output'];
  /** The tax of the food item */
  tax: Scalars['Float']['output'];
  /** The total of the food item */
  total: Scalars['Float']['output'];
  /** The unit price of the food item */
  unit_price: Scalars['Float']['output'];
};

/** A type */
export type FoodShoppingCartModifier = {
  __typename?: 'FoodShoppingCartModifier';
  /** The modifier of the food item */
  foodModifier: FoodModifier;
  /** The modifier group of the food item */
  foodModifierGroup: FoodModifierGroup;
  /** The quantity of the food item */
  quantity: Scalars['Int']['output'];
};

/** A type */
export type FoodShoppingCartPaymentProvider = {
  __typename?: 'FoodShoppingCartPaymentProvider';
  /** payment client secret */
  payment_client_secret: Maybe<Scalars['String']['output']>;
  /** key */
  public_key: Maybe<Scalars['String']['output']>;
};

/** A type */
export type FoodTribeAvailableTime = {
  __typename?: 'FoodTribeAvailableTime';
  /** Date */
  date: Maybe<Scalars['String']['output']>;
  /** Available times */
  times: Maybe<Scalars['JsonParser']['output']>;
};

/** A gorilla news link type */
export type GorillaNewsLink = {
  __typename?: 'GorillaNewsLink';
  /** gorilla news link facebook hashtag */
  facebook_hashtag: Maybe<Scalars['String']['output']>;
  /** gorilla news link image url */
  image_url: Maybe<Scalars['String']['output']>;
  /** gorilla news link url */
  link_url: Maybe<Scalars['String']['output']>;
  /** gorilla news link linkedin hashtag */
  linkedin_hashtag: Maybe<Scalars['String']['output']>;
  /** gorilla news link string */
  string: Maybe<Scalars['String']['output']>;
  /** gorilla news link type */
  type: Maybe<Scalars['String']['output']>;
};

/** A Inventory type */
export type Inventory = {
  __typename?: 'Inventory';
  /** Inventory custom data */
  customData: Maybe<Array<Maybe<InventoryCustomData>>>;
  /** Inventory Friendly Name */
  friendly_name: Maybe<Scalars['String']['output']>;
  /** Inventory id */
  id: Maybe<Scalars['Int']['output']>;
  /** Inventory quantity */
  quantity: Maybe<Scalars['Int']['output']>;
  /** Inventory unit price */
  unit_price: Maybe<Scalars['Float']['output']>;
  /** Inventory variants */
  variants: Maybe<Scalars['JsonParser']['output']>;
};

/** A InventoryCustomData type */
export type InventoryCustomData = {
  __typename?: 'InventoryCustomData';
  /** Inventory data name */
  name: Maybe<Scalars['String']['output']>;
  /** Inventory data type */
  type: Maybe<Scalars['String']['output']>;
  /** Inventory data value */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** A login type */
export type Login = {
  __typename?: 'Login';
  /** address 1 */
  address_1: Maybe<Scalars['String']['output']>;
  /** address 2 */
  address_2: Maybe<Scalars['String']['output']>;
  /** country */
  country: Maybe<Scalars['String']['output']>;
  /** email */
  email: Scalars['String']['output'];
  /** First name */
  first_name: Scalars['String']['output'];
  /** Last name */
  last_name: Scalars['String']['output'];
  /** locality */
  locality: Maybe<Scalars['String']['output']>;
  /** mobile */
  mobile: Maybe<Scalars['String']['output']>;
  /** postal code */
  postal_code: Maybe<Scalars['String']['output']>;
  /** state */
  state: Maybe<Scalars['String']['output']>;
};

/** A login attribute type */
export type LoginAttribute = {
  __typename?: 'LoginAttribute';
  /** attribute name */
  attribute_name: Scalars['String']['output'];
  /** attribute value */
  attribute_value: Maybe<Scalars['String']['output']>;
  /** platform */
  platform: Scalars['String']['output'];
  /** attribute type */
  type: Scalars['String']['output'];
};

/** A login token type */
export type LoginToken = {
  __typename?: 'LoginToken';
  /** Token */
  token: Scalars['String']['output'];
};

/** A media */
export type Media = {
  __typename?: 'Media';
  /** Media Alt Tag */
  alt_tag: Maybe<Scalars['String']['output']>;
  /** Media Approved */
  approved: Maybe<Scalars['Boolean']['output']>;
  /** Banner url */
  banner: Scalars['String']['output'];
  /** default url for non-image */
  default: Scalars['String']['output'];
  /** Original_cropped url */
  original_cropped: Scalars['String']['output'];
  /** Portrait url */
  portrait: Scalars['String']['output'];
  /** Rectangle url */
  rectangle: Scalars['String']['output'];
  /** Square url */
  square: Scalars['String']['output'];
  /** Thumbnail url */
  thumbnail: Scalars['String']['output'];
  /** Get tribes */
  tribes: Array<Tribe>;
};

/** A media collection */
export type MediaCollection = {
  __typename?: 'MediaCollection';
  description: Maybe<Scalars['String']['output']>;
  /** Media collection */
  media: Array<Media>;
  /** Media name */
  name: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** A add food menu item to food shopping cart */
  addFoodMenuItemToShoppingCart: Maybe<Scalars['String']['output']>;
  /** Cancel login user mutation */
  cancelLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A create login user mutation */
  createLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A delete food menu item from food shopping cart */
  deleteFoodMenuItemFromShoppingCart: Maybe<Scalars['String']['output']>;
  /** A query */
  foodShippingCartPaymentPaid: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** reset tba login password */
  resetLoginUserPassword: Maybe<Scalars['Boolean']['output']>;
  /** Set the tribe (location) for a website chatbot conversation. */
  selectChatbotTribe: Maybe<ChatbotReply>;
  /** Send a message in a website chatbot conversation. */
  sendChatbotMessage: Maybe<ChatbotReply>;
  /** Start a website chatbot conversation and get a session token. */
  startChatbotConversation: Maybe<ChatbotReply>;
  /** Storing login attribute mutation */
  storeLoginAttributes: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A mutation */
  submitAppointment: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Submit custom page enquiry */
  submitCustomPageEnquiry: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Submit enquiry */
  submitEnquiry: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A mutation */
  submitFoodShoppingCart: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A mutation */
  submitPersonToCategory: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** A mutation */
  submitPortalFoodShoppingCart: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Submit promotion */
  submitPromotion: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Submit Review */
  submitReview: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** reset tba login password */
  tbaForgotPassword: Maybe<Scalars['Boolean']['output']>;
  /** Update login user mutation */
  updateLoginUser: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Update save listing for x2 mutation */
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
  signature: Scalars['String']['input'];
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

/** A org chart person type */
export type OrgChartPerson = {
  __typename?: 'OrgChartPerson';
  /** About */
  about: Maybe<Scalars['String']['output']>;
  /** Avatar */
  avatar: Maybe<Scalars['String']['output']>;
  /** Email */
  email: Maybe<Scalars['String']['output']>;
  /** Email public */
  email_public: Maybe<Scalars['Boolean']['output']>;
  /** First name */
  first_name: Maybe<Scalars['String']['output']>;
  /** Last name */
  last_name: Maybe<Scalars['String']['output']>;
  /** Mobile number */
  mobile_e164: Maybe<Scalars['String']['output']>;
  /** Mobile public */
  mobile_public: Maybe<Scalars['Boolean']['output']>;
  /** Tribe */
  positions: Maybe<Array<Maybe<OrgChartPosition>>>;
  /** Role */
  role: Maybe<Scalars['String']['output']>;
  /** Show on website */
  show_on_website: Maybe<Scalars['Boolean']['output']>;
  /** The organisation's team member custom fields, with this person's value for each */
  teamMemberCustomFields: Array<TeamMemberCustomField>;
  /** Telephone extension */
  telephone_extension: Maybe<Scalars['String']['output']>;
  /** Telephone number */
  telephone_number: Maybe<Scalars['String']['output']>;
  /** Telephone public */
  telephone_public: Maybe<Scalars['Boolean']['output']>;
  /** Tribe */
  tribe: Maybe<Tribe>;
};

/** A org chart position type */
export type OrgChartPosition = {
  __typename?: 'OrgChartPosition';
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Order */
  order: Maybe<Scalars['Int']['output']>;
};

/** A media */
export type OriginMedia = {
  __typename?: 'OriginMedia';
  /** Media alt tag */
  alt_tag: Maybe<Scalars['String']['output']>;
  /** Approved */
  approved: Maybe<Scalars['Boolean']['output']>;
  /** Media Category */
  categories: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  description: Maybe<Scalars['String']['output']>;
  /** Media id */
  id: Maybe<Scalars['Int']['output']>;
  /** Media Starred */
  is_star: Maybe<Scalars['Boolean']['output']>;
  /** Media collection */
  media: Maybe<Array<Maybe<Media>>>;
  /** Media name */
  name: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['JsonParser']['output']>;
};

/** A our work */
export type OurWork = {
  __typename?: 'OurWork';
  /** Article */
  article: Maybe<Scalars['String']['output']>;
  /** Author */
  author: Maybe<Scalars['String']['output']>;
  /** Client Name */
  client_name: Maybe<Scalars['String']['output']>;
  /** Client URL */
  client_url: Maybe<Scalars['String']['output']>;
  /** Excerpt */
  excerpt: Maybe<Scalars['String']['output']>;
  /** Heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Media */
  media_collection: Array<MediaCollection>;
  /** Meta description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** No index */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** Publish Date */
  published_at: Maybe<Scalars['String']['output']>;
  /** Slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Status */
  status: Maybe<Scalars['String']['output']>;
  /** Sub heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Tribe */
  tribe: Maybe<Tribe>;
};


/** A our work */
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

/** A product */
export type Product = {
  __typename?: 'Product';
  /** Product additional costs */
  additional_costs: Maybe<Scalars['JsonParser']['output']>;
  /** Artwork specification pdf */
  artwork_specification_pdf_url: Maybe<Scalars['String']['output']>;
  /** branding options */
  branding_options: Maybe<Scalars['JsonParser']['output']>;
  /** Product caption */
  caption: Maybe<Scalars['String']['output']>;
  /** colours */
  colours: Maybe<Array<Maybe<ProductColour>>>;
  /** Product component type */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** customisation_prices_processed */
  customisation_prices_processed: Maybe<Scalars['Boolean']['output']>;
  /** Product description */
  description: Maybe<Scalars['String']['output']>;
  /** enable variant prices */
  enable_variant_prices: Maybe<Scalars['Boolean']['output']>;
  /** Product features */
  features: Maybe<Scalars['JsonParser']['output']>;
  /** full_colour_branding */
  full_colour_branding: Maybe<Scalars['Int']['output']>;
  /** Has tribe custom data */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product id */
  id: Maybe<Scalars['Int']['output']>;
  /** Identifier */
  identifier: Maybe<Scalars['String']['output']>;
  /** image_count_branding */
  image_count_branding: Maybe<Scalars['Int']['output']>;
  /** installation available */
  installation_available: Maybe<Scalars['Boolean']['output']>;
  /** Inventory */
  inventories: Maybe<Array<Maybe<Inventory>>>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product media */
  media_collection: Array<MediaCollection>;
  /** Product menu label */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Product meta */
  meta: Maybe<Scalars['String']['output']>;
  /** Minimum quantity */
  minimum_quantity: Maybe<Scalars['String']['output']>;
  /** Product name */
  name: Maybe<Scalars['String']['output']>;
  /** Product page heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product page subheading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** Product path */
  path: Maybe<Scalars['String']['output']>;
  /** Product price brackets */
  price_brackets: Maybe<Scalars['JsonParser']['output']>;
  /** primary_price_description */
  primary_price_description: Maybe<Scalars['String']['output']>;
  /** primary_pricing_comment */
  primary_pricing_comment: Maybe<Scalars['String']['output']>;
  /** Product categories */
  product_categories: Array<ProductCategory>;
  /** Product categories count */
  product_categories_count: Maybe<Scalars['Int']['output']>;
  /** Product custom data */
  product_custom_data: Maybe<Array<Maybe<ProductCustomData>>>;
  /** Product ranges */
  product_ranges: Array<ProductRange>;
  /** Product ranges count */
  product_ranges_count: Maybe<Scalars['Int']['output']>;
  /** Related Products */
  product_related_products: Maybe<Array<Maybe<Product>>>;
  /** product sku variants */
  product_sku_variants: Maybe<Scalars['JsonParser']['output']>;
  /** Product SKUs */
  product_skus: Maybe<Array<Maybe<ProductSku>>>;
  /** product store addition costs */
  product_store_additional_costs: Maybe<Array<Maybe<ProductStoreAdditionalCost>>>;
  /** product store colours */
  product_store_colours: Maybe<Array<Maybe<ProductStoreColour>>>;
  /** product store customisation */
  product_store_customisations: Maybe<Array<Maybe<ProductStoreCustomisation>>>;
  /** product store price bracket */
  product_store_price_brackets: Maybe<Array<Maybe<ProductStorePriceBracket>>>;
  /** product store setting */
  product_store_setting: Maybe<ProductStoreSetting>;
  /** Product type */
  product_type: Maybe<ProductType>;
  /** product variants */
  product_variants: Maybe<Scalars['JsonParser']['output']>;
  /** secondary colours */
  secondary_colours: Maybe<Array<Maybe<ProductColour>>>;
  /** seo_review_average */
  seo_review_average: Maybe<Scalars['Float']['output']>;
  /** seo_review_count */
  seo_review_count: Maybe<Scalars['Int']['output']>;
  /** shop_active */
  shop_active: Maybe<Scalars['Boolean']['output']>;
  /** Product slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Product status */
  status: Maybe<Scalars['String']['output']>;
  /** Product subheading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Product supplier */
  supplier: Maybe<ProductSupplier>;
  /** Supplier status */
  supplier_status: Maybe<Scalars['String']['output']>;
  /** Tribe customise website images */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** Product url (deprecated) */
  url: Maybe<Scalars['String']['output']>;
  /** Related components */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product */
export type ProductComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product */
export type ProductHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product */
export type ProductInventoriesArgs = {
  id: InputMaybe<Scalars['Int']['input']>;
  tribe_id: InputMaybe<Scalars['Int']['input']>;
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product */
export type ProductMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product */
export type ProductProduct_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product */
export type ProductProduct_Store_Additional_CostsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product */
export type ProductProduct_Store_CustomisationsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product */
export type ProductProduct_Store_Price_BracketsArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
};


/** A product */
export type ProductTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A product category */
export type ProductCategory = {
  __typename?: 'ProductCategory';
  /** all category children in current supplier */
  all_children_in_supplier: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product category caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Product category children */
  children: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product range component type */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Product category description */
  description: Maybe<Scalars['String']['output']>;
  /** Has tribe custom data */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product category heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product category id */
  id: Maybe<Scalars['Int']['output']>;
  /** Product category introduction text */
  introduction: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product category media */
  media_collection: Array<MediaCollection>;
  /** Product category menu label */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Product category meta */
  meta: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Product category name */
  name: Maybe<Scalars['String']['output']>;
  /** Product category page heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product category page subheading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** Product category parents */
  parents: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product category path */
  path: Maybe<Scalars['String']['output']>;
  /** processed_products_count */
  processed_products_count: Maybe<Scalars['Int']['output']>;
  /** Product ranges */
  product_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Product ranges count */
  product_ranges_count: Maybe<Scalars['Int']['output']>;
  /** Products */
  products: Maybe<Array<Maybe<Product>>>;
  /** Products count */
  products_count: Maybe<Scalars['Int']['output']>;
  /** Only Shop Products */
  shop_products: Maybe<Array<Maybe<Product>>>;
  /** Show gallery */
  show_gallery: Maybe<Scalars['Boolean']['output']>;
  /** Product category slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Product category status */
  status: Maybe<Scalars['String']['output']>;
  /** Product category subheading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Tribe customise website images */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** Tribe customize data */
  tribe_product_categories: Maybe<Array<Maybe<TribeProductCategoryType>>>;
  /** Product category url (deprecated) */
  url: Maybe<Scalars['String']['output']>;
  /** Related components */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product category */
export type ProductCategoryComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category */
export type ProductCategoryHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product category */
export type ProductCategoryMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category */
export type ProductCategoryProductsArgs = {
  onlyShop: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  sortBy: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category */
export type ProductCategoryTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product category */
export type ProductCategoryTribe_Product_CategoriesArgs = {
  tribe_slug: Scalars['String']['input'];
};

/** A product colour */
export type ProductColour = {
  __typename?: 'ProductColour';
  /** Colour hex */
  hex: Maybe<Scalars['String']['output']>;
  /** Colour name */
  name: Maybe<Scalars['String']['output']>;
};

/** A product custom data */
export type ProductCustomData = {
  __typename?: 'ProductCustomData';
  /** Custom data name */
  name: Maybe<Scalars['String']['output']>;
  /** Custom data type */
  type: Maybe<Scalars['String']['output']>;
  /** Custom data type */
  value: Maybe<Scalars['JsonParser']['output']>;
};

/** A product range */
export type ProductRange = {
  __typename?: 'ProductRange';
  /** Product range caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Product range component type */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Product range description */
  description: Maybe<Scalars['String']['output']>;
  /** Has tribe custom data */
  has_tribe_custom_data: Maybe<Scalars['Boolean']['output']>;
  /** Product range heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Product range id */
  id: Maybe<Scalars['Int']['output']>;
  /** Introduction */
  introduction: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product category media */
  media_collection: Maybe<Array<MediaCollection>>;
  /** Product range menu_label */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Meta Description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta Title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Product range name */
  name: Maybe<Scalars['String']['output']>;
  /** Product range page_heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** Product range page_sub_heading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** Product range path */
  path: Maybe<Scalars['String']['output']>;
  /** Product categories */
  product_categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Product categories count */
  product_categories_count: Maybe<Scalars['Int']['output']>;
  /** Products */
  products: Maybe<Array<Maybe<Product>>>;
  /** Products count */
  products_count: Maybe<Scalars['Int']['output']>;
  /** Related Product Range */
  related_ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** Get only shop active products */
  shop_active_products: Maybe<Array<Maybe<Product>>>;
  /** Show gallery */
  show_gallery: Maybe<Scalars['Boolean']['output']>;
  /** Product range slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Product range status */
  status: Maybe<Scalars['String']['output']>;
  /** Product range sub_heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Tribe customise website images */
  tribe_custom_images: Maybe<Array<MediaCollection>>;
  /** Tribe customize data */
  tribe_product_ranges: Maybe<Array<Maybe<TribeProductRangeType>>>;
  /** Product range url (deprecated) */
  url: Maybe<Scalars['String']['output']>;
  /** Related components */
  websiteComponents: Maybe<Array<Maybe<Component>>>;
};


/** A product range */
export type ProductRangeComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range */
export type ProductRangeHas_Tribe_Custom_DataArgs = {
  tribe_slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};


/** A product range */
export type ProductRangeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range */
export type ProductRangeProductsArgs = {
  limit: InputMaybe<Scalars['Int']['input']>;
  loadMedia: InputMaybe<Scalars['Boolean']['input']>;
  onlyShop: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  random: InputMaybe<Scalars['Boolean']['input']>;
};


/** A product range */
export type ProductRangeTribe_Custom_ImagesArgs = {
  images_tribe_slug: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A product range */
export type ProductRangeTribe_Product_RangesArgs = {
  tribe_slug: Scalars['String']['input'];
};

/** Product Sku */
export type ProductSku = {
  __typename?: 'ProductSku';
  /** Barcode */
  barcode: Maybe<Scalars['String']['output']>;
  /** Compare price */
  compare_price: Maybe<Scalars['Float']['output']>;
  /** SKU ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Installation cost */
  installation_cost: Maybe<Scalars['Float']['output']>;
  /** Measurement unit */
  measurement_unit: Maybe<Scalars['String']['output']>;
  /** price */
  price: Maybe<Scalars['Float']['output']>;
  /** Price description */
  price_description: Maybe<Scalars['String']['output']>;
  /** Primary sku */
  primary_sku: Maybe<Scalars['Boolean']['output']>;
  /** requires shipping */
  requires_shipping: Maybe<Scalars['Boolean']['output']>;
  /** Sku */
  sku: Maybe<Scalars['String']['output']>;
  /** Weight */
  weight: Maybe<Scalars['Int']['output']>;
};

/** A product store addition cost type */
export type ProductStoreAdditionalCost = {
  __typename?: 'ProductStoreAdditionalCost';
  /** Active */
  active: Maybe<Scalars['Boolean']['output']>;
  /** ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Optional */
  optional: Maybe<Scalars['Boolean']['output']>;
  /** Retail setup price */
  retail_setup_price: Maybe<Scalars['Int']['output']>;
  /** Retail unit price */
  retail_unit_price: Maybe<Scalars['Int']['output']>;
};

/** A product store colour type */
export type ProductStoreColour = {
  __typename?: 'ProductStoreColour';
  /** Colours */
  colours: Maybe<Scalars['JsonParser']['output']>;
  /** Comment */
  comment: Maybe<Scalars['String']['output']>;
  /** ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Product ID */
  product_id: Maybe<Scalars['Int']['output']>;
};

/** A product store customisation type */
export type ProductStoreCustomisation = {
  __typename?: 'ProductStoreCustomisation';
  /** Description */
  description: Maybe<Scalars['String']['output']>;
  /** Full colour */
  full_colour: Maybe<Scalars['Boolean']['output']>;
  /** ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Maximum colours */
  maximum_colours: Maybe<Scalars['Int']['output']>;
  /** Maximum positions */
  maximum_positions: Maybe<Scalars['Int']['output']>;
  /** Multiple setup price per colour */
  multiple_setup_price_per_colour: Maybe<Scalars['Boolean']['output']>;
  /** Multiple unit price per colour */
  multiple_unit_price_per_colour: Maybe<Scalars['Boolean']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Retail setup price */
  retail_setup_price: Maybe<Scalars['Int']['output']>;
  /** Retail unit price */
  retail_unit_price: Maybe<Scalars['Int']['output']>;
};

/** A product store price bracket type */
export type ProductStorePriceBracket = {
  __typename?: 'ProductStorePriceBracket';
  /** Active */
  active: Maybe<Scalars['Boolean']['output']>;
  /** ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Minimum units */
  minimum_units: Maybe<Scalars['Int']['output']>;
  /** Retail unit price */
  retail_unit_price: Maybe<Scalars['Float']['output']>;
};

/** Product store settings */
export type ProductStoreSetting = {
  __typename?: 'ProductStoreSetting';
  /** ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Enable less than minimum purchases */
  less_than_minimum_enabled: Maybe<Scalars['Boolean']['output']>;
  /** Less than minimum purchase surcharge */
  less_than_minimum_surcharge: Maybe<Scalars['Int']['output']>;
  /** Multiple customisation options */
  multiple_branding: Maybe<Scalars['Boolean']['output']>;
  /** Product ID */
  product_id: Maybe<Scalars['Int']['output']>;
};

/** ProductSupplier */
export type ProductSupplier = {
  __typename?: 'ProductSupplier';
  /** Product supplier code */
  code: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product supplier name */
  name: Maybe<Scalars['String']['output']>;
};

/** A product type */
export type ProductType = {
  __typename?: 'ProductType';
  /** Product type description */
  description: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Product type meta */
  meta: Maybe<Scalars['JsonParser']['output']>;
  /** Product type name */
  name: Maybe<Scalars['String']['output']>;
};

/** A product variant type */
export type ProductVariant = {
  __typename?: 'ProductVariant';
  /** Variant Price */
  price: Maybe<Scalars['Int']['output']>;
  /** Variant Text */
  variant: Maybe<Scalars['String']['output']>;
  /** Variant SKU */
  variantSku: Maybe<Scalars['String']['output']>;
};

/** A promotion type */
export type Promotion = {
  __typename?: 'Promotion';
  /** Promotion banner */
  banner: Maybe<Array<Maybe<PromotionBanner>>>;
  /** Promotion end date */
  end_date: Maybe<Scalars['String']['output']>;
  /** Promotion fields */
  fields: Maybe<Scalars['JsonParser']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Promotion name */
  name: Maybe<Scalars['String']['output']>;
  /** Promotion slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Promotion start date */
  start_date: Maybe<Scalars['String']['output']>;
  /** Promotion status */
  status: Maybe<Scalars['String']['output']>;
  /** Promotion terms */
  terms: Maybe<Scalars['String']['output']>;
  /** tribe types */
  tribe_types: Maybe<Array<Maybe<TribeType>>>;
  /** Promotion type */
  type: Maybe<Scalars['String']['output']>;
  /** promotion vue component */
  vue_component: Maybe<Scalars['String']['output']>;
  /** Promotion website content */
  website_content: Maybe<Array<Maybe<PromotionWebsiteContent>>>;
};

/** A promotion banner */
export type PromotionBanner = {
  __typename?: 'PromotionBanner';
  /** Component content media */
  media_collection: Array<MediaCollection>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** Component content type */
  type: Maybe<Scalars['String']['output']>;
  /** Component content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A promotion banner */
export type PromotionBannerMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A promotion website content */
export type PromotionWebsiteContent = {
  __typename?: 'PromotionWebsiteContent';
  /** Component content media */
  media_collection: Array<MediaCollection>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** products */
  products: Maybe<Scalars['JsonParser']['output']>;
  /** Component content type */
  type: Maybe<Scalars['String']['output']>;
  /** Component content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A promotion website content */
export type PromotionWebsiteContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Query = {
  __typename?: 'Query';
  /** A Exit Factor Webinar Events query */
  EFTribeWebinarEvents: Maybe<TribeComponentPagination>;
  /** A Exit Factor Webinar Events query */
  EFWebinarEvents: Maybe<ComponentPagination>;
  /** appointment available time */
  appointmentAvailableTime: Maybe<AppointmentAvailableTime>;
  /** A article query */
  article: Maybe<Article>;
  articleBusinessCloud: Array<Scalars['String']['output']>;
  /** A article categories query */
  articleCategories: Maybe<Array<Maybe<ArticleCategory>>>;
  /** The articles query */
  articles: Array<Article>;
  /** A article query */
  articlesPagination: Maybe<ArticlePagination>;
  /** A product categories query */
  categories: Maybe<Array<Maybe<ProductCategory>>>;
  /** A child websites information query */
  childWebsites: Maybe<Array<ChildWebsite>>;
  /** A enquiry form query */
  enquiryForm: Maybe<EnquiryForm>;
  /** A query */
  foodCouponAvailable: FoodCouponAvailable;
  /** A food menu query */
  foodMenu: FoodMenu;
  /** The food menu item attributes query */
  foodMenuItemAttributes: Array<FoodMenuItemAttribute>;
  /** A food menu list item query */
  foodMenuListItem: FoodMenuListItem;
  /** A food menu section query */
  foodMenuSection: FoodMenuSection;
  /** A food ordering portal */
  foodOrderingPortal: Maybe<FoodOrderingPortal>;
  /** A food ordering portal locations */
  foodOrderingPortalAvailableLocation: Array<FoodOrderingPortalLocation>;
  /** A query */
  foodShoppingCart: Maybe<FoodShoppingCart>;
  /** A query */
  foodStoreSetting: Maybe<StoreSetting>;
  /** A query */
  foodTribeAvailableTime: Maybe<FoodTribeAvailableTime>;
  /** A login user by token query */
  getUserByToken: LoginUserByToken;
  /** A query */
  lastUpdatedAt: Maybe<Scalars['String']['output']>;
  /** A login exists query */
  loginExists: Scalars['Boolean']['output'];
  /** A logins query */
  logins: Maybe<LoginToken>;
  /** Get website menus */
  menus: Maybe<Array<Maybe<WebsiteMenu>>>;
  /** A website pages by org chart person query */
  orgChartPersonWebsitePages: Maybe<Array<WebsitePage>>;
  /** Qrganisation query */
  organisation: Maybe<Organisation>;
  /** A query */
  organisationOurWork: OurWork;
  /** A query */
  organisationOurWorks: Maybe<OurWorkPagination>;
  /** A query */
  ourWork: OurWork;
  /** A query */
  ourWorks: Maybe<OurWorkPagination>;
  /** A product query */
  product: Product;
  /** A product category query */
  productCategory: ProductCategory;
  /** A product components query */
  productComponents: Maybe<Array<Maybe<Component>>>;
  /** A product suppliers query */
  productSuppliers: Maybe<Array<Maybe<ProductSupplier>>>;
  /** A product type query */
  productType: Maybe<Array<Maybe<ProductType>>>;
  /** A products query */
  products: Maybe<Array<Maybe<Product>>>;
  /** A promotion query */
  promotion: Promotion;
  /** A promotion banner query */
  promotionBanner: Maybe<Promotion>;
  /** A promotions query */
  promotions: Maybe<Array<Maybe<Promotion>>>;
  /** A product range query */
  ranges: Maybe<Array<Maybe<ProductRange>>>;
  /** A region query */
  regions: Array<Region>;
  /** A review query */
  reviews: Maybe<Array<Maybe<Review>>>;
  /** A query */
  searchStores: Array<Tribe>;
  /** A shipping zone query */
  shippingZones: Maybe<ShippingZoneWithFree>;
  /** A shopping query */
  shopping: Maybe<Array<Maybe<ProductVariant>>>;
  /** A tribe query */
  tribe: Tribe;
  /** tribe articles query */
  tribeArticles: Array<Article>;
  /** tribe articles query */
  tribeArticlesPagination: Maybe<ArticlePagination>;
  /** A tribe component */
  tribeComponent: Maybe<TribeComponent>;
  /** A tribe component type */
  tribeComponentType: Maybe<TribeComponentType>;
  /** A tribe list query */
  tribes: Array<Tribe>;
  /** A website component query */
  websiteComponent: Component;
  /** A website components query */
  websiteComponents: Array<ComponentType>;
  /** A website faq query */
  websiteFaq: Maybe<Array<Maybe<WebsiteFaq>>>;
  /** A website faq category query */
  websiteFaqCategory: Maybe<Array<Maybe<WebsiteFaqCategory>>>;
  /** A website information query */
  websiteInfo: Maybe<Website>;
  /** Get website menu */
  websiteMenu: Maybe<WebsiteMenu>;
  /** A website page query */
  websitePage: Maybe<WebsitePage>;
  /** A website page template query */
  websitePageTemplates: Maybe<Array<WebsitePageTemplate>>;
  /** A website page list query */
  websitePages: Maybe<Array<WebsitePage>>;
  /** A website page list query */
  websitePagesInTribeMenu: Maybe<Array<WebsitePage>>;
  /** A website redirect query */
  websiteRedirects: Array<WebsiteRedirect>;
  /** A website section query */
  websiteSection: Maybe<WebsiteSection>;
  /** A website sections query */
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

/** A job posting type */
export type RecruitmentPosting = {
  __typename?: 'RecruitmentPosting';
  /** About Role */
  about_role: Maybe<Scalars['String']['output']>;
  /** Benefits And Perks */
  benefits_and_perks: Maybe<Scalars['String']['output']>;
  /** Close Datetime */
  close_date: Maybe<Scalars['String']['output']>;
  /** Posting Heading */
  heading: Maybe<Scalars['String']['output']>;
  /** Hours */
  hours: Maybe<Scalars['String']['output']>;
  /** Posting ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Job Summary */
  job_summary: Maybe<Scalars['String']['output']>;
  /** Organisation ID */
  organisation_id: Maybe<Scalars['Int']['output']>;
  /** Permanency */
  permanency: Maybe<Scalars['String']['output']>;
  /** Publish Datetime */
  publish_date: Maybe<Scalars['String']['output']>;
  /** Region */
  region: Maybe<Region>;
  /** Role */
  role: Maybe<RecruitmentRole>;
  /** Salary From */
  salary_from: Maybe<Scalars['String']['output']>;
  /** Salary To */
  salary_to: Maybe<Scalars['String']['output']>;
  /** Selling Point 1 */
  selling_point_1: Maybe<Scalars['String']['output']>;
  /** Selling Point 2 */
  selling_point_2: Maybe<Scalars['String']['output']>;
  /** Selling Point 3 */
  selling_point_3: Maybe<Scalars['String']['output']>;
  /** Show Salary */
  show_salary: Maybe<Scalars['Boolean']['output']>;
  /** Skills And Experience */
  skills_and_experience: Maybe<Scalars['String']['output']>;
  /** Posting Status */
  status: Maybe<Scalars['String']['output']>;
  /** Url */
  url: Maybe<Scalars['String']['output']>;
};

/** A job role type */
export type RecruitmentRole = {
  __typename?: 'RecruitmentRole';
  /** About Role */
  about_role: Maybe<Scalars['String']['output']>;
  /** Benefits And Perks */
  benefits_and_perks: Maybe<Scalars['String']['output']>;
  /** Job Summary */
  job_summary: Maybe<Scalars['String']['output']>;
  /** Role Heading */
  name: Maybe<Scalars['String']['output']>;
  /** Skills And Experience */
  role_category: Maybe<RecruitmentRoleCategory>;
  /** Selling Point 1 */
  selling_point_1: Maybe<Scalars['String']['output']>;
  /** Selling Point 2 */
  selling_point_2: Maybe<Scalars['String']['output']>;
  /** Selling Point 3 */
  selling_point_3: Maybe<Scalars['String']['output']>;
  /** Skills And Experience */
  skills_and_experience: Maybe<Scalars['String']['output']>;
  /** Role Status */
  status: Maybe<Scalars['String']['output']>;
};

/** A job role category type */
export type RecruitmentRoleCategory = {
  __typename?: 'RecruitmentRoleCategory';
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Status */
  status: Maybe<Scalars['String']['output']>;
};

/** A region type */
export type Region = {
  __typename?: 'Region';
  /** Country Short Code */
  country_iso: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** center latitude */
  latitude: Maybe<Scalars['Float']['output']>;
  /** center longitude */
  longitude: Maybe<Scalars['Float']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Abbreviated Code */
  name_abbreviated: Maybe<Scalars['String']['output']>;
  /** Boundary */
  polygons: Maybe<Scalars['JsonParser']['output']>;
  /** Status */
  status: Maybe<Scalars['String']['output']>;
  /** zoom */
  zoom: Maybe<Scalars['Int']['output']>;
};

/** A review */
export type Review = {
  __typename?: 'Review';
  /** Review business name */
  business_name: Maybe<Scalars['String']['output']>;
  /** Review created at */
  created_at: Maybe<Scalars['String']['output']>;
  /** Review featured */
  featured: Maybe<Scalars['Boolean']['output']>;
  /** Review ID */
  id: Maybe<Scalars['Int']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Review */
  name: Maybe<Scalars['String']['output']>;
  /** Review rating */
  rating: Maybe<Scalars['Int']['output']>;
  /** Review */
  review: Maybe<Scalars['String']['output']>;
  /** Review source */
  review_source: Maybe<Scalars['String']['output']>;
  /** Review type */
  review_type: Maybe<Scalars['String']['output']>;
  /** Social author url */
  social_author_url: Maybe<Scalars['String']['output']>;
  /** Social message */
  social_message: Maybe<Scalars['String']['output']>;
  /** Social rating */
  social_rating: Maybe<Scalars['Int']['output']>;
  /** Review status */
  status: Maybe<Scalars['String']['output']>;
  /** Tribe */
  tribe: Maybe<Tribe>;
  /** Review created at */
  updated_at: Maybe<Scalars['String']['output']>;
};

/** A shipping area type */
export type ShippingArea = {
  __typename?: 'ShippingArea';
  /** Shipping area administrative area level 1 */
  administrative_area_level_1: Maybe<Scalars['JsonParser']['output']>;
  /** Shipping area center */
  center: Maybe<Scalars['JsonParser']['output']>;
  /** Shipping area name */
  name: Maybe<Scalars['String']['output']>;
  /** Shipping area polygons */
  polygons: Maybe<Scalars['JsonParser']['output']>;
  /** Shipping area radius */
  radius: Maybe<Scalars['JsonParser']['output']>;
  /** Shipping area type */
  type: Maybe<Scalars['String']['output']>;
};

/** A shipping rate type */
export type ShippingRate = {
  __typename?: 'ShippingRate';
  /** Shipping rate base */
  base_rate: Maybe<Scalars['Float']['output']>;
  /** Shipping rate currency */
  currency: Maybe<Scalars['String']['output']>;
  /** Shipping rate free */
  free_shipping_price: Maybe<Scalars['Float']['output']>;
  /** Shipping rate id */
  id: Scalars['Int']['output'];
  /** Maximum order price */
  maximum_order_price: Maybe<Scalars['Float']['output']>;
  /** Minimum order price */
  minimum_order_price: Maybe<Scalars['Float']['output']>;
  /** Shipping rate name */
  name: Scalars['String']['output'];
  /** Shipping rate weight */
  weight_rate: Maybe<Scalars['Float']['output']>;
};

/** A shipping zone type */
export type ShippingZone = {
  __typename?: 'ShippingZone';
  /** Shipping zone id */
  id: Scalars['Int']['output'];
  /** Shipping zone name */
  name: Scalars['String']['output'];
  /** Shipping areas */
  shippingAreas: Array<ShippingArea>;
  /** Shipping rates */
  shippingRates: Array<ShippingRate>;
  /** Shipping zone status */
  status: Scalars['String']['output'];
};

/** A shipping zone with free type */
export type ShippingZoneWithFree = {
  __typename?: 'ShippingZoneWithFree';
  /** Free shipping */
  free: Scalars['Boolean']['output'];
  /** Shipping zones */
  shipping_zones: Maybe<Array<ShippingZone>>;
};

/** A team member */
export type TeamMember = {
  __typename?: 'TeamMember';
  /** About */
  about: Maybe<Scalars['String']['output']>;
  /** Avatar */
  avatar: Maybe<Scalars['String']['output']>;
  /** Email */
  email: Maybe<Scalars['String']['output']>;
  /** First name */
  first_name: Maybe<Scalars['String']['output']>;
  /** Last name */
  last_name: Maybe<Scalars['String']['output']>;
  /** Role */
  role: Maybe<Scalars['String']['output']>;
  /** Tribe */
  tribe: Maybe<Tribe>;
};

/** A team member custom field type */
export type TeamMemberCustomField = {
  __typename?: 'TeamMemberCustomField';
  /** Custom field id */
  id: Maybe<Scalars['Int']['output']>;
  /** Images held against a Single Image / Gallery custom field */
  media_collection: Array<MediaCollection>;
  /** Custom field name */
  name: Maybe<Scalars['String']['output']>;
  /** Custom field type */
  type: Maybe<Scalars['String']['output']>;
  /** The team member's value for this custom field */
  value: Maybe<Scalars['JsonParser']['output']>;
};


/** A team member custom field type */
export type TeamMemberCustomFieldMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A tribe */
export type Tribe = {
  __typename?: 'Tribe';
  /** Tribe address_1 */
  address_1: Maybe<Scalars['String']['output']>;
  /** Tribe address_2 */
  address_2: Maybe<Scalars['String']['output']>;
  /** All Tribe media */
  all_media: Maybe<Array<Maybe<OriginMedia>>>;
  /** Answer number */
  answer_number: Maybe<Scalars['String']['output']>;
  /** Articles */
  articles: Maybe<Array<Maybe<Article>>>;
  /** caption */
  caption: Maybe<Scalars['String']['output']>;
  /** Tribe component type */
  component_types: Maybe<Array<Maybe<TribeComponentType>>>;
  /** Tribe content */
  contents: Maybe<Array<Maybe<TribeContent>>>;
  /** Tribe country */
  country: Maybe<Scalars['String']['output']>;
  /** Tribe country ISO */
  country_iso: Maybe<Scalars['String']['output']>;
  /** Custom opening hours */
  custom_opening_hours: Maybe<Array<Maybe<CustomOpeningHour>>>;
  /** Enable Inventory on Website */
  enable_inventory: Maybe<Scalars['Boolean']['output']>;
  /** Facebook Pixel ID */
  facebook_pixel_id: Maybe<Scalars['String']['output']>;
  /** Facebook Review Link */
  facebook_review_link: Maybe<Scalars['String']['output']>;
  /** Food Shop Active */
  food_shop_active: Maybe<Scalars['Boolean']['output']>;
  /** Google Place ID */
  google_place_id: Maybe<Scalars['String']['output']>;
  /** Google Review URL */
  google_review_url: Maybe<Scalars['String']['output']>;
  /** heading */
  heading: Maybe<Scalars['String']['output']>;
  /** introduction */
  introduction: Maybe<Scalars['String']['output']>;
  /** introduction_bold */
  introduction_bold: Maybe<Scalars['String']['output']>;
  /** Introduction team */
  introduction_team: Maybe<Scalars['String']['output']>;
  is_alternate_address: Maybe<Scalars['Boolean']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Tribe latitude */
  latitude: Maybe<Scalars['String']['output']>;
  /** Tribe locality */
  locality: Maybe<Scalars['String']['output']>;
  /** Tribe longitude */
  longitude: Maybe<Scalars['String']['output']>;
  /** main_telephone */
  main_telephone: Maybe<Scalars['String']['output']>;
  /** Tribe media */
  media_collection: Array<MediaCollection>;
  /** Tribe meta description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Tribe meta title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Tribe name */
  name: Scalars['String']['output'];
  /** Opening hours */
  opening_hours: Maybe<Scalars['JsonParser']['output']>;
  /** Opening hours */
  opening_hours_array: Maybe<Scalars['JsonParser']['output']>;
  /** Opening hours message */
  opening_hours_message: Maybe<Scalars['String']['output']>;
  /** organic_cid */
  organic_cid: Maybe<Scalars['String']['output']>;
  /** Organic number */
  organic_number: Maybe<Scalars['String']['output']>;
  /** Organisation Id */
  organisation_id: Scalars['Int']['output'];
  /** OurWorks */
  ourWorks: Maybe<Array<Maybe<OurWork>>>;
  /** page_heading */
  page_heading: Maybe<Scalars['String']['output']>;
  /** page_sub_heading */
  page_sub_heading: Maybe<Scalars['String']['output']>;
  /** paid_cid */
  paid_cid: Maybe<Scalars['String']['output']>;
  /** Paid number */
  paid_number: Maybe<Scalars['String']['output']>;
  /** phone extension */
  phone_extension: Maybe<Scalars['String']['output']>;
  /** Tribe postal_code */
  postal_code: Maybe<Scalars['String']['output']>;
  /** public email */
  public_email: Maybe<Scalars['String']['output']>;
  /** Job Postings */
  recruitment_postings: Maybe<Array<Maybe<RecruitmentPosting>>>;
  /** Tribe Active Shop */
  shop_active: Maybe<Scalars['Boolean']['output']>;
  /** Show opening hours message */
  show_opening_hours: Maybe<Scalars['Boolean']['output']>;
  /** Tribe Shop Price */
  show_price: Maybe<Scalars['Boolean']['output']>;
  /** Tribe slug */
  slug: Scalars['String']['output'];
  /** SMS Label */
  sms_checkbox_label: Maybe<Scalars['String']['output']>;
  /** SMS Legal Message */
  sms_legal_message: Maybe<Scalars['String']['output']>;
  /** SMS Legal Message Enabled */
  sms_legal_message_enabled: Scalars['Boolean']['output'];
  /** SMS Legal Message Mode */
  sms_legal_message_mode: Maybe<Scalars['String']['output']>;
  /** SMS Radio No */
  sms_radio_no_label: Maybe<Scalars['String']['output']>;
  /** SMS Radio Yes */
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
  /** Tribe state */
  state: Maybe<Scalars['String']['output']>;
  /** Tribe state abbreviated */
  state_abbreviated: Maybe<Scalars['String']['output']>;
  /** Tribe status */
  status: Maybe<Scalars['String']['output']>;
  /** Stripe public key */
  stripe_public_key: Maybe<Scalars['String']['output']>;
  /** sub_heading */
  sub_heading: Maybe<Scalars['String']['output']>;
  /** Team members */
  teamMembers: Maybe<Array<Maybe<OrgChartPerson>>>;
  /** Url Triggers */
  telephone_url_triggers: Maybe<Scalars['JsonParser']['output']>;
  /** Timezone */
  timezone: Maybe<Scalars['String']['output']>;
  /** Tracking code */
  tracking_code: Maybe<Scalars['String']['output']>;
  /** Menus */
  tribe_menus: Maybe<Array<Maybe<TribeMenu>>>;
  /** Opening hours */
  tribe_opening_hours: Maybe<Scalars['JsonParser']['output']>;
  /** Tribe Sort Order */
  tribe_sort_order: Maybe<Scalars['Int']['output']>;
  /** Belong to tribe types */
  tribe_types: Maybe<Array<Maybe<TribeType>>>;
  /** Whether the website may swap displayed phone numbers by traffic source (organisation master switch AND tribe opt-in) */
  website_number_swap_enabled: Scalars['Boolean']['output'];
  /** website pages */
  website_pages: Maybe<Array<Maybe<WebsitePage>>>;
  /** Whatsapp number */
  whats_app_number: Maybe<Scalars['String']['output']>;
  /** Yelp Review URL */
  yelp_review_url: Maybe<Scalars['String']['output']>;
};


/** A tribe */
export type TribeAll_MediaArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  id: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  order: InputMaybe<Scalars['String']['input']>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  star: InputMaybe<Scalars['Boolean']['input']>;
};


/** A tribe */
export type TribeComponent_TypesArgs = {
  componentTypeName: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe */
export type TribeContentsArgs = {
  name: InputMaybe<Scalars['String']['input']>;
  names: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tribeTypeName: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe */
export type TribeMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe */
export type TribeOurWorksArgs = {
  slug: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A tribe */
export type TribeTeamMembersArgs = {
  active: InputMaybe<Scalars['Boolean']['input']>;
};


/** A tribe */
export type TribeTribe_MenusArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  menus: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tribe_type: InputMaybe<Scalars['String']['input']>;
};


/** A tribe */
export type TribeWebsite_PagesArgs = {
  slug: InputMaybe<Scalars['String']['input']>;
  website_id: InputMaybe<Scalars['Int']['input']>;
};

/** A tribe component */
export type TribeComponent = {
  __typename?: 'TribeComponent';
  /** Tribes */
  activeTribes: Maybe<Array<Maybe<Tribe>>>;
  /** Component contents */
  contents: Maybe<Array<Maybe<TribeComponentContent>>>;
  /** Component name */
  name: Maybe<Scalars['String']['output']>;
  /** Component slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Component Type */
  type: Maybe<TribeComponentType>;
};


/** A tribe component */
export type TribeComponentContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A tribe component content */
export type TribeComponentContent = {
  __typename?: 'TribeComponentContent';
  /** Component content media */
  media_collection: Maybe<Array<MediaCollection>>;
  /** Component content name */
  name: Maybe<Scalars['String']['output']>;
  /** Component content type */
  type: Maybe<Scalars['String']['output']>;
  /** Component content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A tribe component content */
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

/** A tribe component type */
export type TribeComponentType = {
  __typename?: 'TribeComponentType';
  /** Components */
  components: Maybe<Array<Maybe<TribeComponent>>>;
  /** Component type name */
  name: Maybe<Scalars['String']['output']>;
  /** Component type status */
  status: Maybe<Scalars['String']['output']>;
};


/** A tribe component type */
export type TribeComponentTypeComponentsArgs = {
  name: InputMaybe<Scalars['String']['input']>;
  slug: InputMaybe<Scalars['String']['input']>;
};

/** A tribe content */
export type TribeContent = {
  __typename?: 'TribeContent';
  /** Website content media */
  media_collection: Array<MediaCollection>;
  /** Website content name */
  name: Maybe<Scalars['String']['output']>;
  /** Website content type */
  type: Maybe<Scalars['String']['output']>;
  /** Website content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A tribe content */
export type TribeContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A tribe menus */
export type TribeMenu = {
  __typename?: 'TribeMenu';
  /** Menu json */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

/** A tribe type */
export type TribeType = {
  __typename?: 'TribeType';
  /** Tribe type name */
  name: Maybe<Scalars['String']['output']>;
  /** Tribe type short code */
  short_code: Maybe<Scalars['String']['output']>;
};

/** A website content */
export type WebsiteContent = {
  __typename?: 'WebsiteContent';
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Website content media */
  media_collection: Array<MediaCollection>;
  /** Website content name */
  name: Maybe<Scalars['String']['output']>;
  /** Website content type */
  type: Maybe<Scalars['String']['output']>;
  /** Website content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A website content */
export type WebsiteContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A website menu */
export type WebsiteMenu = {
  __typename?: 'WebsiteMenu';
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Website menu json */
  menu_json: Maybe<Scalars['JsonParser']['output']>;
  /** Website menu name */
  name: Maybe<Scalars['String']['output']>;
};

/** A website redirect type */
export type WebsiteRedirect = {
  __typename?: 'WebsiteRedirect';
  /** From url */
  from: Scalars['String']['output'];
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** To url */
  to: Scalars['String']['output'];
};

/** A website section */
export type WebsiteSection = {
  __typename?: 'WebsiteSection';
  /** Website content list */
  contents: Maybe<Array<Maybe<WebsiteContent>>>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Website section name */
  name: Maybe<Scalars['String']['output']>;
};


/** A website section */
export type WebsiteSectionContentsArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A article field type */
export type ArticleFields = {
  __typename?: 'articleFields';
  /** Article field media */
  media_collection: Array<MediaCollection>;
  /** Article field name */
  name: Maybe<Scalars['String']['output']>;
  /** Article field source */
  source: Maybe<Scalars['String']['output']>;
  /** Article field type */
  type: Maybe<Scalars['String']['output']>;
  /** Article field value */
  value: Maybe<Scalars['String']['output']>;
};


/** A article field type */
export type ArticleFieldsMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A child website */
export type ChildWebsite = {
  __typename?: 'childWebsite';
  /** Website base tribe path */
  base_tribes_path: Maybe<Scalars['String']['output']>;
  /** Organisation Id */
  organisation_id: Maybe<Scalars['Int']['output']>;
  /** Website url */
  website_url: Maybe<Scalars['String']['output']>;
};

/** A login user data by type */
export type LoginUserByToken = {
  __typename?: 'loginUserByToken';
  /** Address 1 */
  address_1: Maybe<Scalars['String']['output']>;
  /** Country */
  country: Maybe<Scalars['String']['output']>;
  /** Email */
  email: Scalars['String']['output'];
  /** First name */
  first_name: Scalars['String']['output'];
  /** Last name */
  last_name: Scalars['String']['output'];
  /** Locality */
  locality: Maybe<Scalars['String']['output']>;
  /** attributes */
  loginAttributes: Maybe<Array<LoginAttribute>>;
  /** Mobile dail code */
  mobile_code: Maybe<Scalars['String']['output']>;
  /** Mobile country code */
  mobile_country: Maybe<Scalars['String']['output']>;
  /** Mobile Display */
  mobile_display: Maybe<Scalars['String']['output']>;
  /** Mobile E164 */
  mobile_e164: Maybe<Scalars['String']['output']>;
  /** postal code */
  postal_code: Maybe<Scalars['String']['output']>;
  /** State */
  state: Maybe<Scalars['String']['output']>;
};


/** A login user data by type */
export type LoginUserByTokenLoginAttributesArgs = {
  attribute_names: Array<InputMaybe<Scalars['String']['input']>>;
  platform: Scalars['String']['input'];
};

/** A organisation type */
export type Organisation = {
  __typename?: 'organisation';
  /** All Organisation Media */
  all_media: Maybe<Array<Maybe<OriginMedia>>>;
  /** Currency */
  currency: Maybe<Scalars['String']['output']>;
  /** Currency symbol */
  currency_symbol: Maybe<Scalars['String']['output']>;
  /** Public Email Address */
  email_address: Maybe<Scalars['String']['output']>;
  /** Media name */
  name: Maybe<Scalars['String']['output']>;
  /** Tel E164 */
  tel_e164: Maybe<Scalars['String']['output']>;
};


/** A organisation type */
export type OrganisationAll_MediaArgs = {
  count: InputMaybe<Scalars['Int']['input']>;
  desc: InputMaybe<Scalars['Boolean']['input']>;
  id: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  order: InputMaybe<Scalars['String']['input']>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  star: InputMaybe<Scalars['Boolean']['input']>;
};

/** A store setting */
export type StoreSetting = {
  __typename?: 'storeSetting';
  /** Store active */
  active: Scalars['Boolean']['output'];
  /** Business legal name */
  business_legal_name: Maybe<Scalars['String']['output']>;
  /** Business tax number */
  business_tax_number: Maybe<Scalars['String']['output']>;
  /** Delivery only open hours */
  delivery_only_open_hours: Maybe<Scalars['Boolean']['output']>;
  /** Early pickup message */
  early_pickup_message: Maybe<Scalars['String']['output']>;
  /** Early pickup minimum */
  early_pickup_minimum: Maybe<Scalars['Float']['output']>;
  /** Enable early pickup */
  enable_early_pickup: Maybe<Scalars['Boolean']['output']>;
  /** Enable tribe pricing */
  enable_tribe_pricing: Maybe<Scalars['Boolean']['output']>;
  /** Minimum installation fee */
  min_installation_fee: Maybe<Scalars['Float']['output']>;
  /** Minimum preparation time */
  minimum_preparation_time: Maybe<Scalars['Int']['output']>;
  /** Job Postings */
  organisation: Organisation;
  /** Show price */
  show_price: Maybe<Scalars['Boolean']['output']>;
  /** Store tax rate */
  store_tax_rate: Scalars['Float']['output'];
  /** Store tax settings */
  store_tax_settings: Scalars['String']['output'];
};

/** A tribe product category */
export type TribeProductCategoryType = {
  __typename?: 'tribeProductCategoryType';
  /** Tribe Customize data */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** Product category customize data id */
  id: Maybe<Scalars['Int']['output']>;
  /** Product category tribe id */
  tribe_id: Maybe<Scalars['Int']['output']>;
};

/** A tribe product range */
export type TribeProductRangeType = {
  __typename?: 'tribeProductRangeType';
  /** Tribe Customize data */
  data: Maybe<Scalars['JsonParser']['output']>;
  /** Product range customize data id */
  id: Maybe<Scalars['Int']['output']>;
};

/** A website */
export type Website = {
  __typename?: 'website';
  /** Website base category path */
  base_categories_path: Maybe<Scalars['String']['output']>;
  /** Website base product path */
  base_products_path: Maybe<Scalars['String']['output']>;
  /** Website base range path */
  base_ranges_path: Maybe<Scalars['String']['output']>;
  /** Website base tribe path */
  base_tribes_path: Maybe<Scalars['String']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Website name */
  name: Maybe<Scalars['String']['output']>;
  /** Organisation */
  organisation: Maybe<Organisation>;
  /** Theme tokens for this website */
  style: Maybe<WebsiteStyle>;
  /** Website url */
  url: Maybe<Scalars['String']['output']>;
};

/** A website faq */
export type WebsiteFaq = {
  __typename?: 'websiteFaq';
  /** Answer */
  answer: Maybe<Scalars['String']['output']>;
  /** Faq category */
  faq_category: Maybe<WebsiteFaqCategory>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Question */
  question: Maybe<Scalars['String']['output']>;
  /** Slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Sort */
  sort: Maybe<Scalars['Int']['output']>;
};

/** A website faq category */
export type WebsiteFaqCategory = {
  __typename?: 'websiteFaqCategory';
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Name */
  name: Maybe<Scalars['String']['output']>;
  /** Sort */
  sort: Maybe<Scalars['Int']['output']>;
  /** Website faqs */
  website_faqs: Maybe<Array<Maybe<WebsiteFaq>>>;
};

/** A website page type */
export type WebsitePage = {
  __typename?: 'websitePage';
  /** Page html body */
  body: Maybe<Scalars['String']['output']>;
  /** Website page component type */
  componentTypes: Maybe<Array<Maybe<ComponentType>>>;
  /** Website page contents */
  contents: Maybe<Array<Maybe<WebsitePageContent>>>;
  /** Website page related food menu list items */
  foodMenuListItems: Maybe<Array<Maybe<FoodMenuListItem>>>;
  /** Is tribe page */
  is_tribe_page: Maybe<Scalars['Boolean']['output']>;
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Menu label */
  menu_label: Maybe<Scalars['String']['output']>;
  /** Order Number */
  menu_order: Maybe<Scalars['Int']['output']>;
  /** Menu Section */
  menu_section: Maybe<Scalars['String']['output']>;
  /** Meta description */
  meta_description: Maybe<Scalars['String']['output']>;
  /** Meta title */
  meta_title: Maybe<Scalars['String']['output']>;
  /** Website page name */
  name: Maybe<Scalars['String']['output']>;
  /** No index */
  no_index: Maybe<Scalars['Boolean']['output']>;
  /** Website page related product categories */
  productCategories: Maybe<Array<Maybe<ProductCategory>>>;
  /** Website page related product ranges */
  productRanges: Maybe<Array<Maybe<ProductRange>>>;
  /** Website page related products */
  products: Maybe<Array<Maybe<Product>>>;
  /** Show in menu */
  show_in_menu: Maybe<Scalars['Boolean']['output']>;
  /** Website page slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Website page template name */
  template_name: Maybe<Scalars['String']['output']>;
  /** Website page template slug */
  template_slug: Maybe<Scalars['String']['output']>;
  /** tracking parameters */
  tracking_parameters: Maybe<Scalars['JsonParser']['output']>;
  /** Website page tribe */
  tribe: Maybe<Tribe>;
  /** Website page related tribes */
  tribes: Maybe<Array<Maybe<Tribe>>>;
  /** Vue route name */
  vue_route_name: Maybe<Scalars['String']['output']>;
};


/** A website page type */
export type WebsitePageComponentTypesArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** A website page type */
export type WebsitePageFoodMenuListItemsArgs = {
  status: InputMaybe<Scalars['String']['input']>;
};

/** A website page content type */
export type WebsitePageContent = {
  __typename?: 'websitePageContent';
  /** Last Updated At */
  last_updated_at: Maybe<Scalars['String']['output']>;
  /** Website page media */
  media_collection: Array<MediaCollection>;
  /** Website page content name */
  name: Maybe<Scalars['String']['output']>;
  /** Website page content source */
  source: Maybe<Scalars['String']['output']>;
  /** Website page content type */
  type: Maybe<Scalars['String']['output']>;
  /** Website page content value */
  value: Maybe<Scalars['String']['output']>;
};


/** A website page content type */
export type WebsitePageContentMedia_CollectionArgs = {
  name: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  size: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** A website page template type */
export type WebsitePageTemplate = {
  __typename?: 'websitePageTemplate';
  /** Website page name */
  name: Maybe<Scalars['String']['output']>;
  /** Website page organisation template */
  organisation_template: Maybe<Scalars['Boolean']['output']>;
  /** Website page slug */
  slug: Maybe<Scalars['String']['output']>;
  /** Website page tribe template */
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

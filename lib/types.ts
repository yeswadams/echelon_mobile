// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

// ─── Sanity image references ────────────────────────────────────────────────

export interface SanityImage {
  asset: { _ref: string };
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; left: number; bottom: number; right: number };
  alt?: string;
}

export interface GalleryImage {
  image: SanityImage;
  alt?: string;
  caption?: string;
}

// ─── Sanity property listing (card / list view) ─────────────────────────────

export interface SanityPropertyListing {
  _id: string;
  title: string;
  slug: { current: string };
  listingType: string;
  propertyType: string;
  availabilityStatus?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  price: number;
  priceTo?: number;
  currency: string;
  priceLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  sizeSqft?: number;
  description?: string;
  heroImage?: SanityImage;
  location?: { area?: string; city?: string; country?: string };
  locationRef?: { name: string; slug: { current: string } };
}

// ─── Sanity property detail (full page) ─────────────────────────────────────

export interface SanityAgent {
  _id: string;
  name: string;
  slug?: { current: string };
  avatar?: SanityImage;
  role?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  languages?: string[];
  specialties?: string[];
}

export interface SanityDeveloper {
  _id: string;
  name: string;
  slug?: { current: string };
  logo?: SanityImage;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface SanityAmenity {
  _id: string;
  name: string;
  slug?: { current: string };
  category?: string;
  icon?: string;
  description?: string;
}

export interface SanityFeature {
  _id: string;
  name: string;
  slug?: { current: string };
  category?: string;
  icon?: string;
}

export interface SanityNearbyPlace {
  _id: string;
  name: string;
  category?: string;
  icon?: string;
  distanceHint?: string;
}

// ─── Search & discovery (results view, filters) ─────────────────────────────

export type ViewMode = 'grid' | 'list';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface FilterState {
  propertyType: string;
  priceMin?: number;
  priceMax?: number;
  beds?: number;
  baths?: number;
  sortBy: SortOption;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  propertyType: 'All',
  sortBy: 'newest',
};

export interface SanityPropertyDetail extends SanityPropertyListing {
  _createdAt: string;
  _updatedAt: string;
  referenceCode?: string;
  assetType?: string;
  projectStatus?: string;
  serviceCharge?: number;
  deposit?: number;
  toilets?: number;
  ensuiteBedrooms?: number;
  floors?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  completionDate?: string;
  tenure?: string;
  body?: unknown[];
  highlights?: string[];
  pros?: string[];
  cons?: string[];
  idealBuyer?: string;
  bestFor?: string;
  gallery?: GalleryImage[];
  videoTours?: Array<{ url: string; provider?: string; isPrimary?: boolean }>;
  virtualTours?: unknown[];
  agent?: SanityAgent;
  developer?: SanityDeveloper;
  amenities?: SanityAmenity[];
  features?: SanityFeature[];
  nearbyPlaces?: SanityNearbyPlace[];
  locationRef?: { _id?: string; name: string; slug: { current: string } };
  seo?: { metaTitle?: string; metaDescription?: string; noIndex?: boolean };
  leadCapture?: { whatsappNumber?: string };
}

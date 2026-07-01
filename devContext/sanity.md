# Echelon Studio — Integration Guide

> **Audience:** Frontend developers building the Marketing Website (Next.js), Internal Web App (React), and Mobile App (React Native / Expo).
>
> **Sanity Project ID:** `xfkwtbtp` · **Dataset:** `production`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Content Architecture](#2-content-architecture)
3. [Schema Reference](#3-schema-reference)
4. [Data Relationships](#4-data-relationships)
5. [GROQ Query Examples](#5-groq-query-examples)
6. [Image Handling](#6-image-handling)
7. [Portable Text Rendering](#7-portable-text-rendering)
8. [Matterport Virtual Tour Integration](#8-matterport-virtual-tour-integration)
9. [Best Practices](#9-best-practices)
10. [Integration Checklist](#10-integration-checklist)

---

## 1. Project Overview

**Echelon Studio** is the centralised Sanity v3 content backend for the Echelon Real Estate platform. It serves three consumer surfaces:

| Platform | Framework | Primary use |
|----------|-----------|-------------|
| Marketing Website | Next.js (App Router) | Public-facing property listings, blog, agent profiles |
| Internal Web App | React | CRM-style views, enquiry management, analytics |
| Mobile App | React Native / Expo | Property search, saved listings, viewing requests |

All three surfaces consume the same dataset. Field-level visibility (e.g. `isPublished`, `isActive`) is enforced in GROQ queries — the Studio itself does not gate by platform.

---

## 2. Content Architecture

```
property          ← Core listing document
  └── propertyUnit  ← Individual units within a development

agent             ← People who list and sell
developer         ← Companies that build

location          ← Browseable area/neighbourhood pages
nearbyPlace       ← POIs linked to properties

amenity           ← Shared facilities (pool, gym, etc.)
feature           ← Property-specific selling features
tag               ← Searchable labels

faq               ← Global and property-specific FAQs
post              ← Blog articles / market reports
```

### Taxonomy documents

`amenity`, `feature`, `nearbyPlace`, `tag`, and `location` are **reusable lookup documents** — create them once and reference them from many properties. Never duplicate data inline when a reference exists.

---

## 3. Schema Reference

### 3.1 `property`

The primary listing document. Every property for sale, rent, lease, or off-plan lives here.

#### Groups (tabs in Studio)

| Group | Purpose |
|-------|---------|
| `listing` | Core fields: title, slug, types, status flags, publish state |
| `location` | Address object + reference to `location` document |
| `specs` | Bedrooms, bathrooms, sizes, tenure, completion date |
| `pricing` | Price, currency, payment plan, financing |
| `content` | Short description, full body, highlights, pros/cons |
| `media` | Hero image, gallery, brochure, video tours, virtual tours |
| `relationships` | Developer, agent, tags, amenities, features, nearby places |
| `ai` | AI sales profile for chatbot/recommendation engine |
| `seo` | Meta title, description, OG image + lead capture overrides |

#### Key Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required. Max 120 chars. |
| `slug` | slug | Required. Source: `title`. Do not change after publishing. |
| `referenceCode` | string | Internal ID (e.g. `ECH-2024-001`). Not shown publicly. |
| `listingType` | string enum | `sale`, `rent`, `lease`, `short-let`, `off-plan` |
| `assetType` | string enum | `residential`, `commercial`, `land`, `mixed-use` |
| `propertyType` | string enum | `apartment`, `villa`, `plot`, etc. |
| `projectStatus` | string enum | `completed`, `under-construction`, `off-plan`, etc. |
| `availabilityStatus` | string enum | `available`, `few-units-left`, `sold-out`, etc. |
| `isFeatured` | boolean | Gates homepage featured sections. |
| `isNew` | boolean | Shows "New" badge on listing card. |
| `isPublished` | boolean | Filter by this in all public queries. |
| `locationRef` | reference → `location` | For browse-by-area pages. |
| `location` | object | Inline address + `geopoint`. |
| `bedrooms` | number | Standalone property spec. |
| `bathrooms` | number | |
| `sizeSqm` | number | |
| `sizeSqft` | number | |
| `completionDate` | date | Off-plan expected delivery. |
| `price` | number | Starting/asking price in `currency`. |
| `priceTo` | number | Top of price range. Null = fixed price. |
| `currency` | string | `KES`, `USD`, `GBP`, `EUR` |
| `description` | text | Short summary (50–500 chars). Required. |
| `body` | Portable Text | Full rich-text description with inline images. |
| `heroImage` | image | Primary listing image with `alt` field. |
| `gallery` | array of `galleryImage` objects | Each has `image`, `alt`, `caption`. |
| `videoTours` | array of `videoTour` objects | YouTube/Vimeo with `url`, `provider`, `isPrimary`. |
| `virtualTours` | array | Discriminated union: `matterportTour` or `genericVirtualTour`. |
| `developer` | reference → `developer` | |
| `agent` | reference → `agent` | |
| `tags` | array of reference → `tag` | |
| `amenities` | array of reference → `amenity` | |
| `features` | array of reference → `feature` | |
| `nearbyPlaces` | array of reference → `nearbyPlace` | |
| `aiSalesProfile` | object | Structured data for AI recommendation engine. |
| `seo` | object | `metaTitle`, `metaDescription`, `ogImage`, `keywords`, `noIndex`. |
| `leadCapture` | object | Overrides agency defaults: WhatsApp, call, email, CTA. |
| `listingOrder` | number | Lower = appears first in ordered queries. |

#### Virtual Tours — Discriminated Union

The `virtualTours` array supports two types distinguished by `_type`:

- `matterportTour` — Matterport-specific with `shareUrl`, `modelId`, `autoPlay`, `hideUi`.
- `genericVirtualTour` — Kuula, 360°, or other providers with a plain `embedUrl`.

See [Section 8](#8-matterport-virtual-tour-integration) for full frontend usage.

---

### 3.2 `propertyUnit`

Individual units within a multi-unit development (e.g. apartment block). Always references a parent `property`.

| Field | Notes |
|-------|-------|
| `property` | Required reference to parent `property`. |
| `title` | e.g. "3-Bedroom Penthouse – Block A, Floor 12" |
| `unitCode` | Internal code e.g. `A-12-3B` |
| `unitType` | `studio`, `1br`, `2br`, etc. |
| `availabilityStatus` | `available`, `reserved`, `sold`, `occupied` |
| `bedrooms`, `bathrooms`, `sizeSqm`, `sizeSqft` | Same as property-level specs |
| `price`, `currency` | Unit-specific pricing |
| `floorLevel` | e.g. "5th Floor" |
| `view` | e.g. "City skyline" |
| `features` | References to `feature` documents |
| `floorPlan` | Image with `alt` field |
| `gallery` | Array of `galleryImage` objects |
| `virtualTours` | Same discriminated union as `property` |
| `aiUnitSummary` | `summary`, `bestFor`, `pros`, `cons` |

---

### 3.3 `agent`

Agent profile documents. Referenced from `property` and `post`.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required. Auto-generated from name. |
| `avatar` | Image with `alt` field |
| `role` | e.g. "Senior Sales Agent" |
| `licenseNumber` | Professional license if applicable |
| `yearsOfExperience` | Number |
| `languages` | Array of strings |
| `specialties` | Array of strings |
| `bio` | Plain text biography |
| `isActive` | Filter inactive agents out of public directories |
| `email`, `phone` | Contact details |
| `socials.whatsapp` | Phone number string (not URL). Build `wa.me/` link on frontend. |
| `socials.linkedin`, `.instagram`, etc. | Full URLs |
| `seo` | `metaTitle`, `metaDescription`, `ogImage` |

**WhatsApp link:** `https://wa.me/${phone.replace(/\D/g, '')}` where phone = `socials.whatsapp`.

---

### 3.4 `developer`

Property development company profiles.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required |
| `logo` | Image with `alt` field |
| `description` | Company overview (plain text) |
| `established` | Year founded |
| `country` | Primary country of operation |
| `isActive` | Filter inactive developers from public pages |
| `contactEmail`, `contactPhone`, `website` | Contact details |
| `socialLinks` | Array of `{platform, url}` objects. Platforms: `linkedin`, `instagram`, `facebook`, `twitter`, `youtube`, `website`. |
| `notes` | Internal only — never expose publicly |
| `seo` | Standard SEO object |

---

### 3.5 `location`

Browseable area/neighbourhood documents. Linked from `property.locationRef`.

| Field | Notes |
|-------|-------|
| `name` | Required. e.g. "Westlands" |
| `slug` | Required. Used in browse-by-area URL: `/locations/westlands` |
| `country`, `county`, `city`, `area`, `estate` | Geographic hierarchy |
| `centerPoint` | `geopoint` — for map views |
| `description` | Neighbourhood overview — shown on location landing page |
| `isActive` | Filter inactive locations |
| `coverImage` | Hero image with `alt` field |
| `seo` | Standard SEO object |

---

### 3.6 `nearbyPlace`

Points of interest linked to properties.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required |
| `category` | `school`, `hospital`, `mall`, `supermarket`, `restaurant`, `gym`, `park`, `transport`, `bank`, `worship`, `entertainment`, `petrol`, `airport`, `other` |
| `icon` | Icon name string for frontend icon library |
| `distanceHint` | Display string e.g. "500m", "2km", "5 min drive" |
| `mapLocation` | `geopoint` |
| `description` | Brief description |

---

### 3.7 `amenity`

Shared facilities referenced from properties.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required |
| `category` | `leisure`, `security`, `transport`, `utilities`, `wellness`, `family`, `community`, `business`, `outdoor`, `other` |
| `icon` | Icon name for frontend icon library |
| `description` | Optional description |

---

### 3.8 `feature`

Property-specific selling features.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required |
| `category` | `interior`, `exterior`, `technology`, `sustainability`, `kitchen`, `bathroom`, `outdoor`, `security`, `other` |
| `icon` | Icon name |
| `description` | Optional explanation |

---

### 3.9 `tag`

Searchable labels for properties and posts.

| Field | Notes |
|-------|-------|
| `name` | Required |
| `slug` | Required |
| `group` | `lifestyle`, `views`, `investment`, `style`, `buyer-type`, `promotion`, `other` |

---

### 3.10 `faq`

Questions and answers — can be global or scoped to a property.

| Field | Notes |
|-------|-------|
| `question` | Required string |
| `answer` | Portable Text |
| `category` | `general`, `buying`, `renting`, `off-plan`, `financing`, `legal`, `management`, `viewings`, `other` |
| `property` | Optional reference to property for property-specific FAQs |
| `order` | Display order within category |
| `isPublished` | Filter unpublished FAQs |

---

### 3.11 `post` (Blog / Article)

Market reports, buying guides, neighbourhood guides, and news.

| Field | Notes |
|-------|-------|
| `title` | Required |
| `slug` | Required |
| `excerpt` | Short summary — used in cards and as SEO fallback |
| `featuredImage` | Image with `alt` and `caption` fields |
| `body` | Portable Text with inline images |
| `author` | Reference to `agent` |
| `category` | `market-insights`, `buying-guide`, etc. |
| `tags` | References to `tag` documents |
| `relatedProperties` | References to featured properties |
| `publishedAt` | Datetime |
| `isPublished` | Required filter on all public blog queries |
| `isFeatured` | Pin to blog homepage |
| `seo` | Standard SEO object |

---

## 4. Data Relationships

```
property
├── locationRef ──────────────────────────→ location
├── developer ────────────────────────────→ developer
├── agent ────────────────────────────────→ agent
├── tags[]  ──────────────────────────────→ tag[]
├── amenities[] ──────────────────────────→ amenity[]
├── features[] ───────────────────────────→ feature[]
└── nearbyPlaces[] ───────────────────────→ nearbyPlace[]

propertyUnit
└── property ─────────────────────────────→ property
    └── features[] ───────────────────────→ feature[]

faq
└── property (optional) ──────────────────→ property

post
├── author ───────────────────────────────→ agent
├── tags[] ───────────────────────────────→ tag[]
└── relatedProperties[] ──────────────────→ property[]
```

### Reverse relationships (not in schema — query-driven)

| Starting from | Reverse lookup |
|---------------|---------------|
| `property` | All units: query `propertyUnit` where `property._ref == $id` |
| `property` | All FAQs: query `faq` where `property._ref == $id` |
| `location` | All properties: query `property` where `locationRef._ref == $id` |
| `agent` | All listings: query `property` where `agent._ref == $id` |
| `developer` | All developments: query `property` where `developer._ref == $id` |
| `tag` | All tagged properties: query `property` where `$tagId in tags[]._ref` |

---

## 5. GROQ Query Examples

> All public queries must include `isPublished == true` on `property` and `isActive == true` on `agent`/`developer`/`location` where applicable.

### 5.1 Homepage

```groq
// Featured properties (max 6)
*[_type == "property" && isPublished == true && isFeatured == true] | order(listingOrder asc) [0...6] {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  availabilityStatus,
  price,
  priceTo,
  currency,
  priceLabel,
  bedrooms,
  bathrooms,
  sizeSqm,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city, country },
  "locationRef": locationRef->{ name, slug }
}

// Featured articles (max 3)
*[_type == "post" && isPublished == true && isFeatured == true] | order(publishedAt desc) [0...3] {
  _id,
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  "featuredImage": featuredImage { asset, hotspot, crop, alt },
  "author": author->{ name, slug, avatar }
}
```

### 5.2 Property Listing Page

```groq
// Paginated listing with filters
*[
  _type == "property" &&
  isPublished == true &&
  ($listingType == "" || listingType == $listingType) &&
  ($assetType == "" || assetType == $assetType) &&
  ($propertyType == "" || propertyType == $propertyType) &&
  ($locationId == "" || locationRef._ref == $locationId) &&
  ($minPrice == 0 || price >= $minPrice) &&
  ($maxPrice == 0 || price <= $maxPrice) &&
  ($minBeds == 0 || bedrooms >= $minBeds)
] | order(listingOrder asc, _createdAt desc) [$offset...$offset + $limit] {
  _id,
  title,
  slug,
  listingType,
  assetType,
  propertyType,
  availabilityStatus,
  isNew,
  isFeatured,
  price,
  priceTo,
  currency,
  priceLabel,
  bedrooms,
  bathrooms,
  sizeSqm,
  sizeSqft,
  description,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city, country },
  "locationRef": locationRef->{ name, slug }
}

// Total count for pagination
count(*[
  _type == "property" &&
  isPublished == true &&
  ($listingType == "" || listingType == $listingType)
])
```

### 5.3 Property Detail Page

```groq
// Full property document with all expanded references
*[_type == "property" && slug.current == $slug && isPublished == true][0] {
  _id,
  _createdAt,
  _updatedAt,
  title,
  slug,
  referenceCode,
  listingType,
  assetType,
  propertyType,
  projectStatus,
  availabilityStatus,
  isFeatured,
  isNew,

  // Pricing
  price,
  priceTo,
  currency,
  priceLabel,
  serviceCharge,
  deposit,
  paymentPlan,
  financing,

  // Location
  location,
  "locationRef": locationRef->{ _id, name, slug, description, coverImage },

  // Specs
  bedrooms,
  bathrooms,
  toilets,
  ensuiteBedrooms,
  sizeSqm,
  sizeSqft,
  floors,
  parkingSpaces,
  garageSpaces,
  yearBuilt,
  completionDate,
  tenure,
  titleDeedStatus,
  zoning,

  // Content
  description,
  body,
  highlights,
  pros,
  cons,
  idealBuyer,
  bestFor,
  notFor,

  // Media
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "gallery": gallery[] {
    "image": image { asset, hotspot, crop },
    alt,
    caption
  },
  "brochure": brochure { asset },
  videoTours,
  virtualTours,

  // People
  "developer": developer->{ _id, name, slug, logo, description, website, contactEmail, contactPhone, socialLinks },
  "agent": agent->{ _id, name, slug, avatar, role, email, phone, "whatsapp": socials.whatsapp, languages, specialties },

  // Taxonomy — expanded
  "tags": tags[]->{ _id, name, slug, group },
  "amenities": amenities[]->{ _id, name, slug, category, icon, description },
  "features": features[]->{ _id, name, slug, category, icon, description },
  "nearbyPlaces": nearbyPlaces[]->{ _id, name, slug, category, icon, distanceHint, mapLocation, description },

  // AI
  aiSalesProfile,

  // SEO
  seo,
  leadCapture
}
```

### 5.4 Property Units (for a development)

```groq
*[_type == "propertyUnit" && property._ref == $propertyId] | order(_createdAt asc) {
  _id,
  title,
  slug,
  unitCode,
  unitType,
  availabilityStatus,
  bedrooms,
  bathrooms,
  sizeSqm,
  sizeSqft,
  price,
  currency,
  floorLevel,
  view,
  completionDate,
  "floorPlan": floorPlan { asset, hotspot, crop, alt },
  "gallery": gallery[] { "image": image { asset, hotspot, crop }, alt, caption },
  virtualTours,
  "features": features[]->{ name, slug, category, icon }
}
```

### 5.5 Similar Properties

```groq
// Properties similar to the current one — same type in the same area, exclude self
*[
  _type == "property" &&
  isPublished == true &&
  _id != $currentId &&
  propertyType == $propertyType &&
  location.city == $city
] | order(_createdAt desc) [0...4] {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  price,
  currency,
  bedrooms,
  bathrooms,
  sizeSqm,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city }
}
```

### 5.6 Agent Profile & Listings

```groq
// Agent profile
*[_type == "agent" && slug.current == $slug && isActive == true][0] {
  _id,
  name,
  slug,
  avatar,
  role,
  licenseNumber,
  yearsOfExperience,
  languages,
  specialties,
  bio,
  email,
  phone,
  socials,
  seo
}

// Properties by agent
*[_type == "property" && isPublished == true && agent._ref == $agentId] | order(listingOrder asc) {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  availabilityStatus,
  price,
  currency,
  bedrooms,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city }
}
```

### 5.7 Developer Profile & Developments

```groq
// Developer profile
*[_type == "developer" && slug.current == $slug && isActive == true][0] {
  _id,
  name,
  slug,
  logo,
  description,
  established,
  country,
  website,
  contactEmail,
  contactPhone,
  socialLinks,
  seo
}

// Properties by developer
*[_type == "property" && isPublished == true && developer._ref == $developerId] | order(listingOrder asc) {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  availabilityStatus,
  price,
  currency,
  bedrooms,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city }
}
```

### 5.8 Browse by Location

```groq
// Location page data
*[_type == "location" && slug.current == $slug && isActive == true][0] {
  _id,
  name,
  slug,
  country,
  county,
  city,
  area,
  centerPoint,
  description,
  coverImage,
  seo
}

// Properties in this location
*[_type == "property" && isPublished == true && locationRef._ref == $locationId] | order(listingOrder asc) {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  price,
  currency,
  bedrooms,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city }
}

// All active locations (for browse navigation)
*[_type == "location" && isActive == true] | order(name asc) {
  _id,
  name,
  slug,
  city,
  "coverImage": coverImage { asset, hotspot, crop, alt },
  "count": count(*[_type == "property" && isPublished == true && locationRef._ref == ^._id])
}
```

### 5.9 Search

```groq
// Full-text search across properties
*[
  _type == "property" &&
  isPublished == true &&
  [title, description, "area", location.area, location.city] match $searchQuery
] | order(_score desc) | order(listingOrder asc) [0...20] {
  _id,
  title,
  slug,
  listingType,
  propertyType,
  price,
  currency,
  bedrooms,
  "heroImage": heroImage { asset, hotspot, crop, alt },
  "location": location { area, city }
}
```

### 5.10 Filters — Get All Available Filter Values

```groq
// Get all distinct listing types that have published properties
*[_type == "property" && isPublished == true].listingType

// All active locations (for dropdown)
*[_type == "location" && isActive == true] | order(name asc) { _id, name, slug }

// All amenities (for filter chips)
*[_type == "amenity"] | order(category asc, name asc) { _id, name, slug, category, icon }

// All features
*[_type == "feature"] | order(category asc, name asc) { _id, name, slug, category, icon }

// All tags
*[_type == "tag"] | order(group asc, name asc) { _id, name, slug, group }
```

### 5.11 FAQs

```groq
// Global FAQs (no property reference)
*[_type == "faq" && isPublished == true && !defined(property)] | order(category asc, order asc) {
  _id,
  question,
  answer,
  category,
  order
}

// Property-specific FAQs
*[_type == "faq" && isPublished == true && property._ref == $propertyId] | order(order asc) {
  _id,
  question,
  answer,
  category
}
```

### 5.12 Blog

```groq
// Blog listing
*[_type == "post" && isPublished == true] | order(publishedAt desc) [$offset...$offset + $limit] {
  _id,
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  isFeatured,
  "featuredImage": featuredImage { asset, hotspot, crop, alt },
  "author": author->{ name, slug, avatar },
  "tags": tags[]->{ name, slug }
}

// Blog post detail
*[_type == "post" && slug.current == $slug && isPublished == true][0] {
  _id,
  title,
  slug,
  excerpt,
  body,
  category,
  publishedAt,
  "featuredImage": featuredImage { asset, hotspot, crop, alt },
  "author": author->{ name, slug, avatar, role, bio },
  "tags": tags[]->{ name, slug, group },
  "relatedProperties": relatedProperties[]->{ _id, title, slug, price, currency, "heroImage": heroImage { asset, hotspot, crop, alt } },
  seo
}
```

### 5.13 SEO — Open Graph Data

Always project SEO data in page-level queries. Use fallbacks to keep SEO correct when editors leave SEO fields blank:

```groq
// Included in the property detail query above. Consume on the frontend as:
// title    = seo.metaTitle    || title
// desc     = seo.metaDescription || description
// ogImage  = seo.ogImage      || heroImage
// noIndex  = seo.noIndex      ?? false
```

---

## 6. Image Handling

Echelon Studio uses Sanity's asset pipeline. All images should be rendered through `@sanity/image-url` or the native Sanity Image URL builder.

### Image reference structure in the dataset

```json
{
  "asset": { "_ref": "image-abc123-1920x1080-jpg" },
  "hotspot": { "x": 0.5, "y": 0.3, "width": 0.8, "height": 0.6 },
  "crop": { "top": 0.0, "left": 0.0, "bottom": 0.0, "right": 0.0 },
  "alt": "Exterior view of Westgate Residences"
}
```

### Next.js / React setup

```bash
npm install @sanity/image-url
```

```typescript
// lib/sanityImage.ts
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

const builder = imageUrlBuilder({ projectId: 'xfkwtbtp', dataset: 'production' })

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
```

### Usage

```tsx
// Listing card image — responsive with hotspot respect
<img
  src={urlFor(property.heroImage).width(600).height(400).fit('crop').auto('format').url()}
  alt={property.heroImage.alt ?? property.title}
  loading="lazy"
/>

// Full-width hero — WebP with quality control
<img
  src={urlFor(property.heroImage).width(1200).height(630).fit('crop').auto('format').quality(80).url()}
  alt={property.heroImage.alt ?? property.title}
/>

// Next.js Image component with blur placeholder
import NextImage from 'next/image'

<NextImage
  src={urlFor(property.heroImage).url()}
  alt={property.heroImage.alt ?? ''}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### Recommended image sizes by context

| Context | Width | Height | Fit |
|---------|-------|--------|-----|
| Listing card | 600 | 400 | crop |
| Hero image | 1200 | 630 | crop |
| OG / social | 1200 | 630 | crop |
| Gallery thumbnail | 400 | 300 | crop |
| Gallery full | 1600 | — | max |
| Agent avatar | 200 | 200 | crop |
| Developer logo | 300 | — | max |
| Location cover | 1200 | 500 | crop |

### Gallery array

The `gallery` field stores objects (`galleryImage`), not raw images. Always project through the object:

```groq
"gallery": gallery[] {
  "image": image { asset, hotspot, crop },
  alt,
  caption
}
```

```typescript
// Render gallery
property.gallery?.map((item) => (
  <figure key={item.image.asset._ref}>
    <img
      src={urlFor(item.image).width(800).fit('crop').auto('format').url()}
      alt={item.alt ?? ''}
    />
    {item.caption && <figcaption>{item.caption}</figcaption>}
  </figure>
))
```

---

## 7. Portable Text Rendering

The `body` field in `property` and `post`, and the `answer` field in `faq`, use Sanity Portable Text.

### Install

```bash
npm install @portabletext/react
```

### Basic renderer

```tsx
// components/PortableTextRenderer.tsx
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/lib/sanityImage'
import type { PortableTextReactComponents } from '@portabletext/react'

const components: Partial<PortableTextReactComponents> = {
  types: {
    image: ({ value }) => (
      <figure className="my-8">
        <img
          src={urlFor(value).width(900).auto('format').url()}
          alt={value.alt ?? ''}
          className="w-full rounded-lg"
        />
        {value.caption && (
          <figcaption className="text-center text-sm text-gray-500 mt-2">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>,
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-6">{children}</blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
}

export function PortableTextRenderer({ content }: { content: unknown[] }) {
  return (
    <div className="prose max-w-none">
      <PortableText value={content} components={components} />
    </div>
  )
}
```

### React Native / Expo

```bash
npm install @portabletext/react-native
```

```tsx
import { PortableText } from '@portabletext/react-native'

<PortableText
  value={property.body}
  components={{
    types: {
      image: ({ value }) => (
        <Image
          source={{ uri: urlFor(value).width(400).url() }}
          style={{ width: '100%', height: 220, borderRadius: 8, marginVertical: 12 }}
          accessibilityLabel={value.alt}
        />
      ),
    },
  }}
/>
```

---

## 8. Matterport Virtual Tour Integration

### How the schema stores Matterport data

```json
{
  "_type": "matterportTour",
  "title": "3-Bedroom Show Unit",
  "shareUrl": "https://my.matterport.com/show/?m=SFR2tst4aXF",
  "modelId": "SFR2tst4aXF",
  "thumbnail": { "asset": {...}, "alt": "3D tour preview" },
  "description": "Explore the 3-bedroom show unit in full 3D.",
  "isFeatured": true,
  "autoPlay": false,
  "hideUi": false
}
```

### Extracting the Model ID

The `modelId` field is optional — editors may leave it blank. Always fall back to extracting it from `shareUrl`:

```typescript
// utils/matterport.ts
export function getMatterportModelId(tour: {
  modelId?: string
  shareUrl: string
}): string | null {
  if (tour.modelId) return tour.modelId
  try {
    const url = new URL(tour.shareUrl)
    return url.searchParams.get('m')
  } catch {
    return null
  }
}

export function getMatterportEmbedUrl(
  tour: { modelId?: string; shareUrl: string; autoPlay?: boolean; hideUi?: boolean }
): string | null {
  const modelId = getMatterportModelId(tour)
  if (!modelId) return null

  const params = new URLSearchParams({ m: modelId })
  if (tour.autoPlay) params.set('play', '1')
  if (tour.hideUi) params.set('hl', '0')
  // brand=0 removes the Matterport branding (requires Enterprise plan)
  // params.set('brand', '0')

  return `https://my.matterport.com/show/?${params.toString()}`
}
```

### React / Next.js embed component

```tsx
// components/MatterportTour.tsx
import { getMatterportEmbedUrl, getMatterportModelId } from '@/utils/matterport'
import { urlFor } from '@/lib/sanityImage'
import { useState } from 'react'

interface MatterportTourProps {
  tour: {
    _type: 'matterportTour'
    title?: string
    shareUrl: string
    modelId?: string
    thumbnail?: { asset: object; alt?: string }
    description?: string
    isFeatured?: boolean
    autoPlay?: boolean
    hideUi?: boolean
  }
}

export function MatterportTour({ tour }: MatterportTourProps) {
  const [isLoaded, setIsLoaded] = useState(tour.autoPlay ?? false)
  const embedUrl = getMatterportEmbedUrl(tour)

  if (!embedUrl) return null

  return (
    <div className="relative w-full">
      {!isLoaded ? (
        // Poster frame — click to launch
        <button
          onClick={() => setIsLoaded(true)}
          className="relative block w-full aspect-video bg-gray-900 rounded-xl overflow-hidden group"
          aria-label={`Launch 3D tour: ${tour.title ?? 'Virtual Tour'}`}
        >
          {tour.thumbnail ? (
            <img
              src={urlFor(tour.thumbnail).width(900).fit('crop').auto('format').url()}
              alt={tour.thumbnail.alt ?? tour.title ?? 'Virtual tour preview'}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-white text-sm">3D Tour Preview</span>
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-white/90 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-900 ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            {tour.title && (
              <span className="text-white text-sm font-medium drop-shadow">{tour.title}</span>
            )}
          </div>
        </button>
      ) : (
        // Embedded iframe
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <iframe
            src={embedUrl}
            title={tour.title ?? 'Matterport 3D Virtual Tour'}
            allow="fullscreen; vr; gyroscope; accelerometer"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      )}
      {tour.description && (
        <p className="mt-3 text-sm text-gray-500">{tour.description}</p>
      )}
    </div>
  )
}
```

### React Native / Expo embed

```tsx
// components/MatterportTourNative.tsx
import { WebView } from 'react-native-webview'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { getMatterportEmbedUrl } from '@/utils/matterport'
import { urlFor } from '@/utils/sanityImage'
import { useState } from 'react'

export function MatterportTourNative({ tour }) {
  const [launched, setLaunched] = useState(false)
  const embedUrl = getMatterportEmbedUrl(tour)

  if (!embedUrl) return null

  if (!launched) {
    return (
      <TouchableOpacity onPress={() => setLaunched(true)} style={styles.poster}>
        {tour.thumbnail && (
          <Image
            source={{ uri: urlFor(tour.thumbnail).width(400).url() }}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={tour.thumbnail.alt ?? 'Virtual tour preview'}
          />
        )}
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        {tour.title && <Text style={styles.tourLabel}>{tour.title}</Text>}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' },
  poster: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 20, color: '#111', marginLeft: 3 },
  tourLabel: { color: '#fff', fontSize: 12, marginTop: 8, fontWeight: '500' },
  webview: { flex: 1 },
})
```

### Rendering the virtualTours array

Since `virtualTours` is a discriminated union, check `_type` before rendering:

```tsx
// components/VirtualTours.tsx
import { MatterportTour } from './MatterportTour'

export function VirtualTours({ tours }) {
  if (!tours?.length) return null

  // Show featured tour first
  const sorted = [...tours].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return 0
  })

  return (
    <section>
      <h2>Virtual Tours</h2>
      {sorted.map((tour, i) => {
        if (tour._type === 'matterportTour') {
          return <MatterportTour key={i} tour={tour} />
        }
        if (tour._type === 'genericVirtualTour') {
          return (
            <div key={i} className="relative w-full aspect-video rounded-xl overflow-hidden">
              <iframe
                src={tour.embedUrl}
                title={tour.title ?? 'Virtual Tour'}
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          )
        }
        return null
      })}
    </section>
  )
}
```

---

## 9. Best Practices

### 9.1 Query Optimisation

**Always project only the fields you need.** Avoid `*[...] {..., ...}` (all fields) in production — it wastes bandwidth and slows renders.

```groq
// Bad — fetches everything including AI profile, SEO, etc.
*[_type == "property" && isPublished == true][0]

// Good — only what the listing card needs
*[_type == "property" && isPublished == true][0] {
  _id, title, slug, price, currency, bedrooms, "heroImage": heroImage { asset, hotspot, crop, alt }
}
```

**Use GROQ parameters** for all dynamic values to leverage query caching:

```typescript
const result = await client.fetch(QUERY, {
  slug: params.slug,
  listingType: filters.listingType ?? '',
})
```

**Limit result sets** — always paginate. Use `[$offset...$offset + $limit]` syntax.

### 9.2 Caching Strategy

| Surface | Recommended approach |
|---------|---------------------|
| Next.js Website | ISR — `revalidate: 60` on listing pages, `revalidate: 300` on homepage |
| Next.js property detail | `revalidate: 30` or on-demand revalidation via Sanity webhooks |
| Web App | SWR or React Query with `staleTime: 60_000` |
| Mobile App | React Query with `staleTime: 120_000` and offline persistence |

### 9.3 On-Demand Revalidation (Next.js)

Set up a Sanity webhook to call your revalidation endpoint when properties change:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const secret = req.headers.get('x-sanity-webhook-secret')

  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { _type, slug } = body

  if (_type === 'property') {
    revalidatePath('/properties', 'page')
    if (slug?.current) revalidatePath(`/properties/${slug.current}`, 'page')
  }

  if (_type === 'post') {
    revalidatePath('/blog', 'page')
    if (slug?.current) revalidatePath(`/blog/${slug.current}`, 'page')
  }

  return NextResponse.json({ revalidated: true })
}
```

### 9.4 Live Preview (Draft Mode)

```bash
npm install @sanity/preview-kit next-sanity
```

Configure a Sanity API token with viewer access for draft preview. Use `useLiveQuery` from `@sanity/preview-kit` in draft mode and regular `client.fetch` in production.

### 9.5 Image Optimisation

- Always pass `.auto('format')` — serves WebP to supported browsers.
- Always pass `.quality(80)` on hero images — sufficient for photography.
- Never fetch images wider than the render viewport.
- In Next.js, prefer the `<Image>` component with `fill` + `sizes` attribute for automatic responsive srcsets.
- Pre-blur placeholders: use Sanity's `lqip` (low quality image placeholder) via the metadata projection:

```groq
"heroImage": heroImage {
  asset->{ metadata { lqip, dimensions } },
  hotspot, crop, alt
}
```

```tsx
<NextImage
  src={urlFor(property.heroImage).url()}
  alt={property.heroImage.alt ?? ''}
  fill
  placeholder="blur"
  blurDataURL={property.heroImage.asset.metadata.lqip}
/>
```

### 9.6 TypeScript Types from Sanity

Generate TypeScript types from your schema automatically:

```bash
npm install -D @sanity/cli
npx sanity@latest typegen generate
```

This produces types that match exactly what GROQ returns — use them everywhere.

### 9.7 Published/Draft handling

All public queries **must** filter by `isPublished == true` on `property` and `isPublished == true` on `post`. The Studio uses Sanity's draft system — drafts have `_id` starting with `drafts.`. In CDN-cached queries, drafts are never exposed unless you use a token with read access.

---

## 10. Integration Checklist

Use these checklists when integrating this Studio into each platform.

---

### Next.js Website

#### Setup
- [ ] Install `next-sanity`, `@sanity/image-url`, `@portabletext/react`
- [ ] Create `sanity.client.ts` with `projectId: 'xfkwtbtp'`, `dataset: 'production'`, `apiVersion: '2024-01-01'`, `useCdn: true`
- [ ] Create `sanityImage.ts` with `imageUrlBuilder`
- [ ] Run `npx sanity@latest typegen generate` and commit generated types
- [ ] Create `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`

#### Pages to implement
- [ ] `/` — Homepage: featured properties + featured articles (query 5.1)
- [ ] `/properties` — Listing page with filters + pagination (query 5.2)
- [ ] `/properties/[slug]` — Property detail with full data (query 5.3)
- [ ] `/properties/[slug]/units` — Development units (query 5.4)
- [ ] `/locations` — All active locations
- [ ] `/locations/[slug]` — Location page + its properties (query 5.8)
- [ ] `/agents` — Agent directory
- [ ] `/agents/[slug]` — Agent profile + listings (query 5.6)
- [ ] `/developers/[slug]` — Developer profile + developments (query 5.7)
- [ ] `/blog` — Article listing (query 5.12)
- [ ] `/blog/[slug]` — Article detail
- [ ] `/faq` — Global FAQ page (query 5.11)

#### Features
- [ ] Property search with GROQ `match` (query 5.9)
- [ ] Sidebar filters: listingType, assetType, propertyType, location, price range, bedrooms
- [ ] Similar properties section on detail page (query 5.5)
- [ ] Property FAQs on detail page (query 5.11 property-specific)
- [ ] Matterport embed using `MatterportTour` component (Section 8)
- [ ] Video tour embed (YouTube/Vimeo — use `url` field)
- [ ] Gallery lightbox using `gallery[]` items
- [ ] Brochure download via `brochure.asset._ref`
- [ ] Portable Text renderer for `body` and FAQ `answer` (Section 7)
- [ ] SEO: populate `<title>`, `<meta name="description">`, `<meta property="og:image">` with fallbacks
- [ ] `noIndex` → `<meta name="robots" content="noindex">` when true
- [ ] Canonical URL handling
- [ ] ISR revalidation (`revalidate: 60`) on all listing pages
- [ ] On-demand revalidation webhook from Sanity (query 9.3)
- [ ] Draft Mode for live preview (Section 9.4)
- [ ] Image blur placeholders with `lqip` (query 9.5)
- [ ] WhatsApp CTA: `https://wa.me/${leadCapture.whatsappNumber.replace(/\D/g,'')}`
- [ ] Agent WhatsApp: `https://wa.me/${agent.socials.whatsapp.replace(/\D/g,'')}`
- [ ] Map integration: use `location.mapLocation` geopoint `{lat, lng}`
- [ ] Structured data (JSON-LD) for properties: `RealEstateListing` schema

---

### React Web App (Internal)

#### Setup
- [ ] Install `@sanity/client`, `@sanity/image-url`, `@portabletext/react`
- [ ] Create Sanity client with `useCdn: false` (always fresh data for internal use)
- [ ] Use a `SANITY_API_READ_TOKEN` with read access for draft content
- [ ] Use React Query or SWR for data fetching and caching

#### Views to implement
- [ ] Property list with all fields visible (including `referenceCode`, `listingOrder`, `isPublished`)
- [ ] Property detail — same query as website but include internal fields
- [ ] Agent directory with active/inactive toggle
- [ ] Developer directory
- [ ] FAQ manager view
- [ ] Blog article manager view
- [ ] Location overview with property count

#### Features
- [ ] All filter options from query 5.10
- [ ] Full-text search (query 5.9)
- [ ] Show draft/unpublished properties (use `isPublished` as a visible status badge, not a filter)
- [ ] Unit availability board for multi-unit developments
- [ ] Matterport tour preview using `MatterportTour` component
- [ ] Export/print: render brochure URL from `brochure.asset._ref`

---

### React Native / Expo Mobile App

#### Setup
- [ ] Install `@sanity/client`, `@sanity/image-url`, `@portabletext/react-native`, `react-native-webview`
- [ ] Create Sanity client with `useCdn: true`
- [ ] Use React Query with offline persistence (`react-query-persist-client` or MMKV)
- [ ] Add image caching with `expo-image` (preferred over `react-native` Image)

#### Screens to implement
- [ ] Home — Featured properties + recent articles
- [ ] Search / Browse — Filtered property list (query 5.2)
- [ ] Property Detail — All specs, gallery, virtual tours
- [ ] Units Screen — For multi-unit developments (query 5.4)
- [ ] Location Browse — Location list + properties per location
- [ ] Agent Profile
- [ ] Blog / Market Reports
- [ ] Saved Properties — Local persistence of `_id` list, re-fetch from Sanity

#### Features
- [ ] Property image carousel from `gallery[]` using `expo-image`
- [ ] Virtual tours: `WebView`-based Matterport embed (Section 8 — React Native)
- [ ] Video tours: use `expo-video` or `react-native-video` with the `url` field
- [ ] Portable Text rendering with `@portabletext/react-native`
- [ ] Map view: use `location.mapLocation` geopoint with `react-native-maps`
- [ ] Nearby places pins using `nearbyPlace.mapLocation` geopoints
- [ ] WhatsApp deep link: `Linking.openURL('https://wa.me/...')`
- [ ] Phone call: `Linking.openURL('tel:+254...')`
- [ ] Brochure open: `Linking.openURL(brochureUrl)` via `sanity.client.getDocument`
- [ ] Offline-first: persist last fetched properties list; show stale data with refresh indicator
- [ ] Deep linking: property detail via `properties/[slug]` universal link
- [ ] Push notifications for new listings: trigger from backend, include `slug` for deep link

---

## Appendix: Sanity Client Configuration

```typescript
// lib/sanity.client.ts
import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: 'xfkwtbtp',
  dataset: 'production',
  apiVersion: '2024-01-01', // use a stable date — only update when using new GROQ features
  useCdn: true, // set false for draft preview or internal tools
  token: process.env.SANITY_API_READ_TOKEN, // only needed for draft access
  perspective: 'published', // ensures drafts are excluded without a token
})
```

---

*Last updated: 2026-06-29 — reflects Echelon Studio v2 schema after comprehensive audit and refactor.*

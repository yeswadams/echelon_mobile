import { createClient } from '@sanity/client';

import type { SanityPropertyDetail, SanityPropertyListing } from './types';

export const sanityClient = createClient({
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? 'xfkwtbtp',
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  perspective: 'published',
});

// ─── Listing card projection (minimal fields for cards) ─────────────────────

const LISTING_FIELDS = `
  _id,
  title,
  slug,
  listingType,
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
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getFeaturedProperties(): Promise<SanityPropertyListing[]> {
  return sanityClient.fetch(
    `*[_type == "property" && isPublished == true && isFeatured == true]
     | order(listingOrder asc) [0...6] { ${LISTING_FIELDS} }`
  );
}

export async function getProperties({
  filter,
  query,
  limit = 20,
}: {
  filter: string;
  query: string;
  limit?: number;
}): Promise<SanityPropertyListing[]> {
  const propertyTypeFilter = filter && filter !== 'All' ? filter.toLowerCase() : '';
  const searchQuery = query?.trim() ?? '';

  return sanityClient.fetch(
    `*[
      _type == "property" &&
      isPublished == true &&
      ($propertyType == "" || propertyType == $propertyType) &&
      ($search == "" || [title, description, location.area, location.city] match $search)
    ] | order(listingOrder asc, _createdAt desc) [0...$limit] { ${LISTING_FIELDS} }`,
    { propertyType: propertyTypeFilter, search: searchQuery, limit }
  );
}

export async function getPropertyById({ id }: { id: string }): Promise<SanityPropertyDetail | null> {
  try {
    return await sanityClient.fetch(
      `*[_type == "property" && _id == $id && isPublished == true][0] {
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

        price,
        priceTo,
        currency,
        priceLabel,
        serviceCharge,
        deposit,

        location,
        "locationRef": locationRef->{ _id, name, slug },

        bedrooms,
        bathrooms,
        toilets,
        ensuiteBedrooms,
        sizeSqm,
        sizeSqft,
        floors,
        parkingSpaces,
        yearBuilt,
        completionDate,
        tenure,

        description,
        body,
        highlights,
        pros,
        cons,
        idealBuyer,
        bestFor,

        "heroImage": heroImage { asset, hotspot, crop, alt },
        "gallery": gallery[] {
          "image": image { asset, hotspot, crop },
          alt,
          caption
        },
        videoTours,
        virtualTours,

        "developer": developer->{ _id, name, slug, logo, description, website, contactEmail, contactPhone },
        "agent": agent->{ _id, name, slug, avatar, role, email, phone, "whatsapp": socials.whatsapp, languages, specialties },

        "amenities": amenities[]->{ _id, name, slug, category, icon, description },
        "features": features[]->{ _id, name, slug, category, icon },
        "nearbyPlaces": nearbyPlaces[]->{ _id, name, slug, category, icon, distanceHint },

        seo,
        leadCapture
      }`,
      { id }
    );
  } catch (err) {
    console.error('getPropertyById error:', err);
    return null;
  }
}

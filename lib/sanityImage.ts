import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const builder = createImageUrlBuilder({
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? 'xfkwtbtp',
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET ?? 'production',
});

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

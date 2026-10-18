/**
 * Interim approved-offer source for both Birdiaconia Site and Toss.
 * This must contain only operator-approved data. Replace with a transactional
 * storage adapter when authorization, audit and persistence are available.
 * NEVER paste private/person/case/cost information here.
 *
 * An empty array is deliberate: the project currently has no verified public
 * partners or bookable offers. Concept/demo records belong elsewhere.
 */
export const publishedOfferRows: Record<string, unknown>[] = [];

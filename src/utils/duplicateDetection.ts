import { CivicCase } from '../types';

/**
 * Calculates geographic distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Normalizes civic keywords and stems for robust duplicate comparison.
 */
function normalizeWord(w: string): string {
  let word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Civic synonyms
  if (word === 'bicycle' || word === 'bicycles' || word === 'cyclist' || word === 'cyclists' || word === 'bikes') return 'bike';
  if (word === 'limb' || word === 'limbs' || word === 'branches') return 'branch';
  if (word === 'obstructing' || word === 'obstructed' || word === 'obstruction' || word === 'block' || word === 'blocked') return 'blocking';
  if (word === 'corridor' || word === 'lane' || word === 'path' || word === 'track') return 'lane';
  if (word === 'potholes' || word === 'crater') return 'pothole';
  if (word === 'streetlights' || word === 'lamp' || word === 'luminaire') return 'streetlight';
  if (word === 'leaking' || word === 'leakage' || word === 'burst') return 'leak';

  // Basic suffix stripping
  if (word.endsWith('ing') && word.length > 5) word = word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) word = word.slice(0, -2);
  if (word.endsWith('s') && word.length > 3) word = word.slice(0, -1);
  return word;
}

/**
 * Calculates token-based Jaccard similarity and character n-gram overlap between two texts (0 to 1).
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const tokenize = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map(normalizeWord)
        .filter((w) => w.length > 1)
    );
  };

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...set1, ...set2]).size;
  return unionCount === 0 ? 0 : Number((intersectionCount / unionCount).toFixed(2));
}

export interface DuplicateCandidate {
  caseItem: CivicCase;
  distanceMeters: number;
  similarityScore: number; // 0 to 1
  isCategoryMatch: boolean;
  isLikelyDuplicate: boolean;
  matchReason: string;
}

/**
 * Detects potential duplicate cases for a target case within a given radius (default 350m).
 */
export function findDuplicateCandidates(
  targetCase: CivicCase,
  allCases: CivicCase[],
  maxRadiusMeters: number = 400
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const other of allCases) {
    if (other.id === targetCase.id) continue;
    if (other.status === 'Merged') continue; // Don't match already merged cases

    const distance = calculateDistanceMeters(
      targetCase.latitude,
      targetCase.longitude,
      other.latitude,
      other.longitude
    );

    const isCategoryMatch = targetCase.category === other.category;
    const textSim = calculateTextSimilarity(
      `${targetCase.title} ${targetCase.description}`,
      `${other.title} ${other.description}`
    );

    // Criteria: within radius AND (same category OR high text similarity)
    let isLikelyDuplicate = false;
    let matchReason = '';

    if (distance <= maxRadiusMeters && isCategoryMatch && textSim >= 0.2) {
      isLikelyDuplicate = true;
      matchReason = `Same category (${targetCase.category}), ${distance}m away, ${Math.round(textSim * 100)}% text similarity`;
    } else if (distance <= 150 && textSim >= 0.35) {
      isLikelyDuplicate = true;
      matchReason = `Close proximity (${distance}m), ${Math.round(textSim * 100)}% text similarity`;
    } else if (isCategoryMatch && distance <= 200) {
      isLikelyDuplicate = true;
      matchReason = `Same category within ${distance}m`;
    }

    if (isLikelyDuplicate || (distance <= maxRadiusMeters && (isCategoryMatch || textSim >= 0.25))) {
      candidates.push({
        caseItem: other,
        distanceMeters: distance,
        similarityScore: Number(textSim.toFixed(2)),
        isCategoryMatch,
        isLikelyDuplicate,
        matchReason: matchReason || `${distance}m away, ${Math.round(textSim * 100)}% similarity`,
      });
    }
  }

  // Sort by likelihood and distance
  return candidates.sort((a, b) => {
    if (a.isLikelyDuplicate && !b.isLikelyDuplicate) return -1;
    if (!a.isLikelyDuplicate && b.isLikelyDuplicate) return 1;
    return a.distanceMeters - b.distanceMeters;
  });
}

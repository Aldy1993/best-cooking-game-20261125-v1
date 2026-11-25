// Warung Senja — the menu: ingredients, what cooks where, and the dishes.
// One clear job: the data every other module reads, nothing else.

// Ingredients on the counter. cook: which station turns it into its cooked
// form (null = goes straight onto the plate raw). cookTime in seconds.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', cook: 'wok', cookTime: 4 },
  { id: 'telur', name: 'Telur', key: '2', cook: 'wok', cookTime: 3 },
  { id: 'mie', name: 'Mie', key: '3', cook: 'wok', cookTime: 5 },
  { id: 'ayam', name: 'Ayam', key: '4', cook: 'grill', cookTime: 6 },
  { id: 'cabai', name: 'Cabai', key: '5', cook: null, cookTime: 0 },
  { id: 'timun', name: 'Timun', key: '6', cook: null, cookTime: 0 },
  { id: 'kerupuk', name: 'Kerupuk', key: '7', cook: null, cookTime: 0 },
  { id: 'teh', name: 'Es Teh', key: '8', cook: null, cookTime: 0 },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((item) => [item.id, item]),
);

// Cooked forms, keyed by raw ingredient id.
export const COOKED_ID = {
  nasi: 'nasi_masak',
  telur: 'telur_masak',
  mie: 'mie_masak',
  ayam: 'ayam_masak',
};

export const COOKED_NAME = {
  nasi_masak: 'Nasi Wok',
  telur_masak: 'Telur Wok',
  mie_masak: 'Mie Wok',
  ayam_masak: 'Ayam Bakar',
};

export const RAW_OF_COOKED = Object.fromEntries(
  Object.entries(COOKED_ID).map(([raw, cooked]) => [cooked, raw]),
);

export function displayName(id) {
  if (INGREDIENT_BY_ID[id]) return INGREDIENT_BY_ID[id].name;
  if (COOKED_NAME[id]) return COOKED_NAME[id];
  return id;
}

export function isCooked(id) {
  return id in COOKED_NAME;
}

// The five dishes on the order board. needs lists the exact items a plate
// must hold (order does not matter); price is the base coin reward.
export const DISHES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 45,
    needs: ['nasi_masak', 'telur_masak', 'cabai'],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', price: 50,
    needs: ['mie_masak', 'telur_masak', 'timun'],
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 55,
    needs: ['ayam_masak', 'cabai', 'nasi_masak'],
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', price: 60,
    needs: ['ayam_masak', 'cabai', 'kerupuk'],
  },
  {
    id: 'es-teh', name: 'Es Teh Manis', price: 25,
    needs: ['teh'],
  },
];

export const DISH_BY_ID = Object.fromEntries(
  DISHES.map((dish) => [dish.id, dish]),
);

// Spawn weights: quick drinks show up less often than full dishes.
export const DISH_WEIGHTS = [
  { value: 'nasi-goreng', weight: 5 },
  { value: 'mie-goreng', weight: 5 },
  { value: 'ayam-geprek', weight: 4 },
  { value: 'sate-ayam', weight: 4 },
  { value: 'es-teh', weight: 2 },
];

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

// The dish a plate completes, or null when the plate matches no dish.
export function dishForPlate(items) {
  for (const dish of DISHES) {
    if (sameMultiset(items, dish.needs)) return dish;
  }
  return null;
}

// How close a plate is to a dish (0..1): used for the "almost there" hint.
export function plateProgress(items, dish) {
  if (items.length === 0) return 0;
  const remaining = dish.needs.slice();
  let matched = 0;
  for (const item of items) {
    const at = remaining.indexOf(item);
    if (at >= 0) {
      remaining.splice(at, 1);
      matched++;
    }
  }
  return matched / dish.needs.length;
}

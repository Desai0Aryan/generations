// What the player owns. In Part 1 purchases are TEST-ONLY: tapping "Unlock" just records ownership locally.
//
// To go live (later): replace `purchase()` and `restore()` with real StoreKit calls. The easiest path
// in Expo is RevenueCat (react-native-purchases): configure products, call Purchases.purchaseStoreProduct,
// then add the product id to `owned`. Nothing else in the app needs to change.
import { PRODUCTS, type Product } from './products.ts';

export interface Entitlements {
  owned: string[]; // product ids
  activeTheme: string;
}

export const DEFAULT_ENTITLEMENTS: Entitlements = { owned: [], activeTheme: 'teal' };

export function ownedPackIds(e: Entitlements): string[] {
  return PRODUCTS.filter((p) => p.kind === 'pack' && e.owned.includes(p.id)).map((p) => p.refId);
}

export function owns(e: Entitlements, p: Product): boolean {
  return e.owned.includes(p.id);
}

export async function purchase(e: Entitlements, p: Product): Promise<Entitlements> {
  // TODO(real IAP): await Purchases.purchaseStoreProduct(...)
  if (e.owned.includes(p.id)) return e;
  return { ...e, owned: [...e.owned, p.id] };
}

export async function restore(e: Entitlements): Promise<Entitlements> {
  // TODO(real IAP): await Purchases.restorePurchases()
  return e;
}

export type Store = { live: boolean; url: string; badge: string; label: string };

// Flip `live` to true only when the store listing and the official badge file both exist.
// tests/stores.test.ts fails the build if a live store has no URL on its own origin or no badge file.
export const STORES: { apple: Store; google: Store } = {
  apple: { live: false, url: '', badge: '/badges/app-store.svg', label: 'Download on the App Store' },
  google: { live: false, url: '', badge: '/badges/google-play.png', label: 'Get it on Google Play' },
};

export function comingSoonLine(appleLive: boolean, googleLive: boolean): string | null {
  if (appleLive && googleLive) return null;
  if (appleLive) return 'Coming soon to Google Play.';
  if (googleLive) return 'Coming soon to the App Store.';
  return 'Coming soon to the App Store and Google Play.';
}

import { useQuery } from '@tanstack/react-query';
import type { Catalog } from '../../../ingest/src/types.js';

const CATALOG_URL = `${import.meta.env.BASE_URL}data/catalog.json`;

async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    throw new Error(`catalog.json indisponible (HTTP ${res.status}) — lancer \`npm run ingest\` ?`);
  }
  return res.json();
}

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    // Le fichier est régénéré 2×/jour par le cron : inutile de refetcher agressivement.
    staleTime: 60 * 60 * 1000,
  });
}

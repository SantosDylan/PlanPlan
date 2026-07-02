import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SourceAdapter } from './adapters/adapter.js';
import { scalaThionville } from './adapters/scala-thionville/index.js';
import { buildIcsFeed } from './ics.js';
import type { Catalog, Movie } from './types.js';

const adapters: SourceAdapter[] = [scalaThionville];

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const dataDir = path.join(repoRoot, 'web', 'public', 'data');
const calendarDir = path.join(repoRoot, 'web', 'public', 'calendar');

async function main(): Promise<void> {
  const generatedAt = new Date();
  const results: { adapter: SourceAdapter; movies: Movie[] }[] = [];

  for (const adapter of adapters) {
    try {
      const movies = await adapter.fetchProgram();
      const showtimeCount = movies.reduce((n, movie) => n + movie.showtimes.length, 0);
      console.log(`✓ ${adapter.cinema.id} : ${movies.length} films, ${showtimeCount} séances à venir`);
      results.push({ adapter, movies });
    } catch (error) {
      console.error(`✗ ${adapter.cinema.id} : ingestion échouée`, error);
    }
  }

  // Tous les adapters KO → on ne publie rien : l'ancien catalog reste en ligne,
  // le run rouge sert d'alerte (cf. STRATEGY, métrique "taux de succès").
  if (results.length === 0) {
    process.exitCode = 1;
    return;
  }

  const catalog: Catalog = {
    generatedAt: generatedAt.toISOString(),
    cinemas: results.map(({ adapter }) => adapter.cinema),
    movies: results.flatMap(({ movies }) => movies),
  };

  await mkdir(dataDir, { recursive: true });
  await mkdir(calendarDir, { recursive: true });
  await writeFile(path.join(dataDir, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  for (const { adapter, movies } of results) {
    await writeFile(path.join(calendarDir, `${adapter.cinema.id}.ics`), buildIcsFeed(adapter.cinema, movies, generatedAt));
  }
  console.log(`Catalog écrit : ${catalog.movies.length} films, ${results.length} cinéma(s).`);
}

await main();

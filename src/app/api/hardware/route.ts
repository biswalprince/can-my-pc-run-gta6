import catalog from "@/data/hardware-catalog.json";
import cpuRanking from "@/data/fpshq-cpu-ranking.json";
import gpuRanking from "@/data/fpshq-gpu-ranking.json";

type CatalogRecord = {
  name: string;
  slug: string;
  sourceUrl: string;
};

type Catalog = {
  cpus: CatalogRecord[];
  gpus: CatalogRecord[];
};

type CpuRanking = { cpu: string; segment: string };
type GpuRanking = { gpu: string; segment: string };

const hardwareCatalog = catalog as Catalog;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/^(AMD|Intel|NVIDIA|ATI|Qualcomm|VIA|Apple)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

const rankedCpus = new Set(
  (cpuRanking as { rows: CpuRanking[] }).rows
    .filter((row) => !row.segment.toLowerCase().includes("integrated"))
    .map((row) => normalize(row.cpu)),
);
const rankedGpus = new Set(
  (gpuRanking as { rows: GpuRanking[] }).rows
    .filter((row) => !row.segment.toLowerCase().includes("integrated"))
    .map((row) => normalize(row.gpu)),
);

function searchTerms(record: CatalogRecord) {
  const withoutVendor = record.name.replace(
    /^(AMD|Intel|NVIDIA|ATI|Qualcomm|VIA|Apple)\s+/i,
    "",
  );

  return [record.name, withoutVendor, record.slug.replace(/-/g, " ")].map(normalize);
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const queryText = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const query = normalize(queryText);

  if (type !== "cpu" && type !== "gpu") {
    return Response.json({ error: "Type must be cpu or gpu." }, { status: 400 });
  }

  if (query.length < 2) {
    return Response.json({ results: [] });
  }

  const records = type === "cpu" ? hardwareCatalog.cpus : hardwareCatalog.gpus;
  const matches = records
    .map((record) => {
      const terms = searchTerms(record);
      const rank = terms.some((term) => term.startsWith(query))
        ? 0
        : terms.some((term) => term.includes(query))
          ? 1
          : -1;
      return { record, rank };
    })
    .filter((entry) => entry.rank >= 0)
    .sort(
      (left, right) =>
        left.rank - right.rank || left.record.name.localeCompare(right.record.name),
    )
    .slice(0, 10)
    .map(({ record }) => ({
      name: record.name,
      slug: record.slug,
      projectionAvailable: (type === "cpu" ? rankedCpus : rankedGpus).has(normalize(record.name)),
    }));

  return Response.json(
    { results: matches },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}

import catalog from "@/data/hardware-catalog.json";

type CatalogRecord = {
  name: string;
  slug: string;
  sourceUrl: string;
};

type Catalog = {
  cpus: CatalogRecord[];
  gpus: CatalogRecord[];
};

const hardwareCatalog = catalog as Catalog;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

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
    .map(({ record }) => ({ name: record.name, slug: record.slug }));

  return Response.json(
    { results: matches },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}

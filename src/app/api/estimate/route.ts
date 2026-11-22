import { estimate, type EstimateInput } from "@/lib/estimator";

const resolutions = new Set(["1080p", "1440p", "4K"]);
const qualities = new Set(["Low", "Medium", "High", "Ultra"]);
const resolutionOptions: EstimateInput["resolution"][] = ["1080p", "1440p", "4K"];
const qualityOptions: EstimateInput["quality"][] = ["Low", "Medium", "High", "Ultra"];

export async function POST(request: Request) {
  let body: Partial<EstimateInput>;
  try {
    body = await request.json() as Partial<EstimateInput>;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  if (
    typeof body.gpu !== "string" || body.gpu.length > 120 ||
    typeof body.cpu !== "string" || body.cpu.length > 120 ||
    typeof body.memory !== "number" || !Number.isFinite(body.memory) || body.memory < 4 || body.memory > 256 ||
    typeof body.resolution !== "string" || !resolutions.has(body.resolution) ||
    typeof body.quality !== "string" || !qualities.has(body.quality)
  ) {
    return Response.json({ error: "Enter valid hardware, memory, resolution, and quality settings." }, { status: 400 });
  }

  const input = body as EstimateInput;
  const matrix = resolutionOptions.flatMap((resolution) =>
    qualityOptions.map((quality) => ({
      resolution,
      quality,
      result: estimate({ ...input, resolution, quality }),
    })),
  );
  const selected = matrix.find((cell) =>
    cell.resolution === input.resolution && cell.quality === input.quality,
  )?.result ?? estimate(input);

  return Response.json({ selected, matrix }, {
    headers: { "Cache-Control": "no-store" },
  });
}

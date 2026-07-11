import { Hono } from "hono/tiny";
import { getPageHtml } from "./page.js";
import { parseCoords, gcj02ToWgs84, round6 } from "./parse.js";

const app = new Hono();

function jsonError(c, message, status) {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  return c.json({ error: message }, status);
}

function constantTimeEqual(leftValue, rightValue) {
  const left = new TextEncoder().encode(String(leftValue || ""));
  const right = new TextEncoder().encode(String(rightValue || ""));

  if (left.length !== right.length) return false;

  let difference = 0;
  for (let i = 0; i < left.length; i += 1) {
    difference |= left[i] ^ right[i];
  }
  return difference === 0;
}

app.get("/", (c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "no-referrer");
  return c.html(getPageHtml());
});

// GET /api/parse?u=<encoded map URL>&format=json&cs=<gcj|none>
// Authentication: X-WLOC-Key request header must match the WLOC_API_KEY secret.
app.get("/api/parse", async (c) => {
  const expectedKey = c.env.WLOC_API_KEY || "";
  const suppliedKey = c.req.header("X-WLOC-Key") || "";

  if (!expectedKey || !constantTimeEqual(suppliedKey, expectedKey)) {
    return jsonError(c, "Unauthorized", 401);
  }

  const raw = c.req.query("u") || "";
  const cs = (c.req.query("cs") || "").toLowerCase();
  const fmt = (c.req.query("format") || "").toLowerCase();

  if (!raw || raw.length > 4096) {
    return jsonError(c, "Invalid input", 400);
  }
  if (!["", "gcj", "none"].includes(cs)) {
    return jsonError(c, "Invalid coordinate system", 400);
  }
  if (!["", "json"].includes(fmt)) {
    return jsonError(c, "Invalid format", 400);
  }

  try {
    let { lat, lon, name, src } = await parseCoords(raw);
    const needConversion = cs === "gcj" || (cs !== "none" && (src === "amap" || src === "apple"));

    if (needConversion) {
      ({ lat, lon } = gcj02ToWgs84(lat, lon));
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return jsonError(c, "Invalid coordinates", 422);
    }

    lat = round6(lat);
    lon = round6(lon);
    name = String(name || "").slice(0, 200);

    c.header("Cache-Control", "no-store");
    c.header("X-Content-Type-Options", "nosniff");

    if (fmt === "json") return c.json({ lat, lon, name });
    return c.text(`lat=${lat}&lon=${lon}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parse failed";
    return jsonError(c, message, 422);
  }
});

app.notFound((c) => jsonError(c, "Not found", 404));

app.onError((error, c) => {
  console.error("Worker error", error instanceof Error ? error.name : "UnknownError");
  return jsonError(c, "Internal server error", 500);
});

export default app;

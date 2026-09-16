import process from "node:process";
import { writeFile } from "node:fs/promises";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(".env");
  }
} catch {
  // Environment may already be loaded.
}

const apiKey = process.env.TTC_API_KEY?.trim();

const apiUrl =
  process.env.TTC_API_BASE_URL?.trim() ||
  "https://tuongtaccheo.com/api/v2";

if (!apiKey) {
  throw new Error("Missing TTC_API_KEY in .env");
}

const body = new URLSearchParams({
  key: apiKey,
  action: "services"
});

const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body
});

const rawText = await response.text();

if (!response.ok) {
  throw new Error(`TTC HTTP ${response.status}: ${rawText.slice(0, 300)}`);
}

let data;

try {
  data = JSON.parse(rawText);
} catch {
  throw new Error(`TTC returned invalid JSON: ${rawText.slice(0, 300)}`);
}

const services =
  Array.isArray(data)
    ? data
    : Array.isArray(data?.services)
      ? data.services
      : [];

if (!services.length) {
  console.log(data);
  throw new Error("Could not find TTC services array.");
}

const rows = services.map((item) => ({
  service: item.service ?? item.id ?? "",
  category: item.category ?? "",
  name: item.name ?? "",
  type: item.type ?? "",
  rate: item.rate ?? "",
  min: item.min ?? "",
  max: item.max ?? "",
  refill: item.refill ?? "",
  cancel: item.cancel ?? ""
}));

console.log("");
console.log(`TTC SERVICES: ${rows.length}`);
console.log("");

console.log(
  [
    "ID",
    "CATEGORY",
    "NAME",
    "TYPE",
    "RATE",
    "MIN",
    "MAX",
    "REFILL",
    "CANCEL"
  ].join("\t")
);

for (const row of rows) {
  console.log(
    [
      row.service,
      row.category,
      row.name,
      row.type,
      row.rate,
      row.min,
      row.max,
      row.refill,
      row.cancel
    ].join("\t")
  );
}

await writeFile(
  "qa/ttc-services-raw.json",
  JSON.stringify(rows, null, 2),
  "utf8"
);

const tsv = [
  [
    "service",
    "category",
    "name",
    "type",
    "rate",
    "min",
    "max",
    "refill",
    "cancel"
  ].join("\t"),
  ...rows.map((row) =>
    [
      row.service,
      row.category,
      row.name,
      row.type,
      row.rate,
      row.min,
      row.max,
      row.refill,
      row.cancel
    ].join("\t")
  )
].join("\n");

await writeFile(
  "qa/ttc-services-raw.tsv",
  tsv,
  "utf8"
);

console.log("");
console.log("Saved:");
console.log("  qa/ttc-services-raw.json");
console.log("  qa/ttc-services-raw.tsv");
console.log("");
console.log("READ-ONLY: no TTC order was created and no database data was changed.");
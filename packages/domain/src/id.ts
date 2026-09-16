import { randomBytes } from "node:crypto";

function compactDate(now: Date) {
  return now.toISOString().slice(2, 10).replaceAll("-", "");
}

export function createPublicId(prefix: "TT" | "DEP" | "SUP" | "SVC", now = new Date()) {
  const suffix = randomBytes(8).toString("hex");
  return `${prefix}${compactDate(now)}-${suffix}`;
}

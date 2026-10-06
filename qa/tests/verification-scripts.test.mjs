import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("Bash and PowerShell verification enforce the same gates in the same order", () => {
  const bash = readFileSync(new URL("../../scripts/work7-verify.sh", import.meta.url), "utf8");
  const powershell = readFileSync(new URL("../../scripts/work7-verify.ps1", import.meta.url), "utf8");
  const bashGates = [...bash.matchAll(/^npm run ([\w:]+)$/gm)].map((match) => match[1]);
  const powershellGates = powershell.match(/\$gates = @\(([\s\S]*?)\)/)[1].match(/"([\w:]+)"/g).map((value) => value.slice(1, -1));
  assert.deepEqual(bashGates, powershellGates);
  assert.ok(bash.includes("set -euo pipefail"));
  assert.ok(powershell.includes("if ($LASTEXITCODE -ne 0)"));
});

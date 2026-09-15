import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const issues = [];
const rules = [
  { name: "no-inline-style", pattern: /style=\{\{/g, message: "Use design-system classes/tokens instead of inline style." },
  { name: "no-component-hex", pattern: /#[0-9a-fA-F]{3,8}\b/g, message: "Hard-coded colors belong in globals.css tokens, not TS/TSX components." },
  { name: "no-console-log", pattern: /console\.log\s*\(/g, message: "Do not leave console.log in application source." },
  { name: "no-todo", pattern: /\bTODO\b/g, message: "Resolve TODO markers before checkpoint review." }
];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "validation") continue;
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const source = fs.readFileSync(full, "utf8");
    for (const rule of rules) {
      for (const match of source.matchAll(rule.pattern)) {
        const line = source.slice(0, match.index).split("\n").length;
        issues.push(`${path.relative(process.cwd(), full)}:${line} [${rule.name}] ${rule.message}`);
      }
    }
    if (/\b(useState|useEffect|useId|useRef|useContext|useCallback|useMemo|usePathname)\b/.test(source) && !source.startsWith('"use client"')) {
      issues.push(`${path.relative(process.cwd(), full)}:1 [client-boundary] Hook usage requires an explicit client boundary.`);
    }
  }
}

walk(root);
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log("UI source lint passed.");

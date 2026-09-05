#!/usr/bin/env node
// Valida que o setup do workflow de agentes (CARSHOP-98) está completo:
// CLAUDE.md, os 10 subagentes em .claude/agents/ e as 18 regras em docs/rules/.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredAgents = [
  "task-reader",
  "spec-writer",
  "knowledge-reader",
  "architect",
  "plan-writer",
  "developer",
  "tester",
  "reviewer",
  "task-manager",
  "knowledge-manager",
];

const requiredRules = [
  "architecture",
  "nextjs",
  "react",
  "typescript",
  "routing",
  "rendering",
  "api",
  "auth",
  "state-query",
  "forms",
  "ui-design-system",
  "accessibility",
  "responsive",
  "seo",
  "testing",
  "security",
  "branching",
  "spec-security",
];

const hasRequiredFrontmatter = (content) => {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    return false;
  }

  let hasName = false;
  let hasDescription = false;

  for (const line of lines.slice(1)) {
    if (line === "---") {
      return hasName && hasDescription;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1 || line.slice(separatorIndex + 1).trim() === "") {
      continue;
    }

    const field = line.slice(0, separatorIndex).trim();
    hasName ||= field === "name";
    hasDescription ||= field === "description";
  }

  return false;
};

const errors = [];

if (!existsSync(path.join(rootDir, "CLAUDE.md"))) {
  errors.push("CLAUDE.md não encontrado na raiz do repositório.");
}

for (const agent of requiredAgents) {
  const filePath = path.join(rootDir, ".claude", "agents", `${agent}.md`);
  if (!existsSync(filePath)) {
    errors.push(`Agente ausente: .claude/agents/${agent}.md`);
    continue;
  }
  const content = readFileSync(filePath, "utf8");
  if (!hasRequiredFrontmatter(content)) {
    errors.push(
      `Agente .claude/agents/${agent}.md sem frontmatter válido (name/description).`,
    );
  }
}

for (const rule of requiredRules) {
  const filePath = path.join(rootDir, "docs", "rules", `${rule}.md`);
  if (!existsSync(filePath)) {
    errors.push(`Regra ausente: docs/rules/${rule}.md`);
  }
}

if (errors.length > 0) {
  console.error("Validação do workflow de agentes falhou:\n");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(`\n${errors.length} problema(s) encontrado(s).`);
  process.exit(1);
}

console.log(
  `Workflow de agentes OK: CLAUDE.md, ${requiredAgents.length} agentes em .claude/agents/ e ${requiredRules.length} regras em docs/rules/.`,
);

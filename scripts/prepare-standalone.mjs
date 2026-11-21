import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const standalone = ".next/standalone";
if (!existsSync(standalone)) process.exit(0);

mkdirSync(`${standalone}/.next`, { recursive: true });
rmSync(`${standalone}/.next/static`, { recursive: true, force: true });
cpSync(".next/static", `${standalone}/.next/static`, { recursive: true });

if (existsSync("public")) {
  rmSync(`${standalone}/public`, { recursive: true, force: true });
  cpSync("public", `${standalone}/public`, { recursive: true });
}

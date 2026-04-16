import fs from "fs";
import {$, write} from "bun";
import {name, version} from "./package.json";

// Reusing package.json name and converting from kebab-case to camelCase.
const rawName = name.split('/').pop()!;
const fileName = rawName.replace(/-([a-z])/g, (_match, letter) => {
  // TypeScript sait que 'letter' est une string si le match a eu lieu
  return letter ? letter.toUpperCase() : "";
});
console.log(`🐰 🏗️  Building ${fileName} v${version}...`);

const outputDir = "./dist-lib";
console.log(`🐰 🧹 Cleanup of old ${outputDir} content...`);
await $`rm -rf ${outputDir}`;

const now = new Date()
const content = `export const LIB_VERSION = "${version}";\n
export const BUILD_TIME = "${now.toISOString()}";
`;
await write("src/version.ts", content);


const sharedConfig = {
  entrypoints: ["./src/index.ts"],
  outdir: outputDir,
  minify: true,
  sourcemap: "external" as const,
};

console.log("🐰 📦 Generating bundles with Bun...");
await Promise.all([
  // Module ES (for modern bundlers)
  Bun.build({...sharedConfig, format: "esm", naming: `${fileName}.esm.js`}),

  // CommonJS (for Node.js)
  Bun.build({...sharedConfig, format: "cjs", naming: `${fileName}.cjs.js`}),

  // Browser (IIFE with specific entry point)
  Bun.build({...sharedConfig, entrypoints: ["./src/browser.ts"], format: "iife", naming: `${fileName}.umd.js`})
]);
console.log("🐰 ✅ Bundles successfully generated !");
console.log("🐰 🎓 Generating Type Definitions...");
// We force --noEmit to false ==> override the config file
// tsconfig.build.json extends tsconfig.json but enables declaration emit.
// This avoids the --noEmit false CLI override hack.
await $`bun x tsc --project tsconfig.build.json`;
const dtsPath = `${outputDir}/index.d.ts`;
const targetDtsPath = `${outputDir}/${fileName}.d.ts`;
const typesToPrune = [
  `${outputDir}/browser.d.ts`,
  `${outputDir}/version.d.ts`,
];

console.log("🐰 🧹 Type cleanup...");
for (const file of typesToPrune) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}
if (fs.existsSync(dtsPath)) {
  fs.renameSync(dtsPath, targetDtsPath);
  console.log(`🐰 🏷️ Types renamed to ${targetDtsPath}`);
}

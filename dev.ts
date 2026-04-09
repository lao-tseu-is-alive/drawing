// dev.ts
import { watch } from "fs";

const outDir = "./dist";
const entrypoint = "./src/index.ts";

// 1. Fonction de compilation via l'API native de Bun
async function build() {
    console.log("🔨 Compilation du composant...");
    await Bun.build({
        entrypoints: [entrypoint],
        outdir: outDir,
        naming: "drawing.js",
        minify: false,
        sourcemap: "inline",
    });
}

// 2. Compilation initiale
await build();

// 3. Mode Watch : on observe le dossier src et on recompile au moindre changement
watch("./src", { recursive: true }, async (event, filename) => {
    console.log(`Fichier modifié: ${filename}`);
    await build();
});

// 4. Serveur HTTP statique natif
const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response(Bun.file("index.html"));
        if (url.pathname === "/dist/drawing.js") return new Response(Bun.file("dist/drawing.js"));
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Serveur actif sur http://localhost:${server.port}`);

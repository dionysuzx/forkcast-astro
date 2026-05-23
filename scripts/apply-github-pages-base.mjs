import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = (
	process.env.FORKCAST_PUBLIC_BASE_PATH ?? "/forkcast-astro"
).replace(/\/+$/g, "");
if (!base.startsWith("/") || base === "/") {
	throw new Error(
		"FORKCAST_PUBLIC_BASE_PATH must be a non-root absolute path for GitHub Pages project deploys",
	);
}

const distRoot = path.resolve("dist");
const textExtensions = new Set([".html", ".css", ".js", ".mjs"]);
const internalPrefixes = [
	"_astro",
	"agenda",
	"calls",
	"complexity",
	"data",
	"decisions",
	"devnets",
	"eip-search-index.json",
	"eip-spec-search-index.json",
	"eips",
	"glamsterdam",
	"planner",
	"priority",
	"schedule",
	"upgrade",
	"upgrades",
	"blobby-gradient-red.svg",
	"eth-diamond-black.png",
	"eth-mag.png",
	"ethereum-icon.svg",
	"favicon.ico",
	"forkcast-logo.svg",
	"_snapshot.json",
];

const prefixPattern = new RegExp(
	`(["'\`])/(?!${base.slice(1)}(?:/|$)|/)((${internalPrefixes.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=[\\w./?=&%#-]*))`,
	"g",
);

const rewrite = (value) =>
	value
		.replace(/((?:href|src|action)=["'])\/(?!\/)/g, `$1${base}/`)
		.replace(/(url\(["']?)\/(?!\/)/g, `$1${base}/`)
		.replace(/(fetch\(["'])\/(?!\/)/g, `$1${base}/`)
		.replace(prefixPattern, `$1${base}/$2`);

const walk = async (dir) => {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await walk(fullPath);
			continue;
		}
		if (!textExtensions.has(path.extname(entry.name))) continue;
		const before = await readFile(fullPath, "utf8");
		const after = rewrite(before);
		if (after !== before) await writeFile(fullPath, after);
	}
};

await walk(distRoot);
await writeFile(path.join(distRoot, ".nojekyll"), "");
console.log(`Applied GitHub Pages base path ${base} to dist/`);

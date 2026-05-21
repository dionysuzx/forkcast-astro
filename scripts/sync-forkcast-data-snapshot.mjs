import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
	const index = args.indexOf(`--${name}`);
	return index >= 0 ? args[index + 1] : fallback;
};

const latestRoot =
	arg("latest-root", process.env.FORKCAST_DATA_LATEST_ROOT) ??
	"/Users/lucy/fun/forkcast-data/dist/latest";
const dataBaseUrl =
	arg("data-base-url", process.env.FORKCAST_DATA_BASE_URL) ??
	"http://localhost:8888";
const isRemoteLatestRoot = /^https?:\/\//.test(latestRoot);
const latestBaseUrl = latestRoot.replace(/\/$/, "");

const readRemoteText = async (file) => {
	const response = await fetch(`${latestBaseUrl}/${file}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${file}: ${response.status}`);
	}
	return response.text();
};

const readText = async (file) =>
	isRemoteLatestRoot
		? readRemoteText(file)
		: readFile(path.join(latestRoot, file), "utf8");

const readJson = async (file) => JSON.parse(await readText(file));

const readNdjson = async (file) =>
	(await readText(file))
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));

const manifest = await readJson("manifest.json");
const eips = await readJson("eips/index.json").catch(() => []);
const calls = await readJson("calls/index.json").catch(() => []);
const decisions = await readNdjson("decisions/index.ndjson").catch(() => []);
const search = await readJson("search/index.json").catch(() => []);

const snapshot = {
	snapshotId: manifest.snapshot_id,
	source: "forkcast-data",
	latestRoot,
	dataBaseUrl,
	updatedAt: new Date().toISOString(),
	counts: {
		eips: eips.length,
		calls: calls.length,
		decisions: decisions.length,
		searchDocuments: search.length,
	},
	manifest,
	eips,
	calls,
	decisions,
	search,
};

await mkdir("src/domain/forkcast-data", { recursive: true });
await writeFile(
	"src/domain/forkcast-data/pinned-snapshot.json",
	`${JSON.stringify(snapshot, null, "\t")}\n`,
);
await writeFile(
	"forkcast-data.snapshot.json",
	`${JSON.stringify(
		{
			snapshotId: manifest.snapshot_id,
			source: "forkcast-data",
			latestRoot,
			dataBaseUrl,
			updatedAt: snapshot.updatedAt,
			counts: snapshot.counts,
		},
		null,
		"\t",
	)}\n`,
);

const format = spawnSync(
	"pnpm",
	[
		"exec",
		"biome",
		"check",
		"--write",
		"forkcast-data.snapshot.json",
		"src/domain/forkcast-data/pinned-snapshot.json",
	],
	{ stdio: "inherit" },
);
if (format.status) process.exit(format.status);

console.log(`Pinned forkcast-data snapshot ${manifest.snapshot_id}`);

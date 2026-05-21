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
const catalog = await readJson("catalog.json").catch(() => ({ records: [] }));
const eips = await readJson("eips/index.json").catch(() => []);
const calls = await readJson("calls/index.json").catch(() => []);
const decisions = await readNdjson("decisions/index.ndjson").catch(() => []);
const search = await readJson("search/index.json").catch(() => []);
const kindCounts = (catalog.records ?? []).reduce((counts, record) => {
	const kind = record.kind ?? "unknown";
	counts[kind] = (counts[kind] ?? 0) + 1;
	return counts;
}, {});

const publicManifest = {
	version: manifest.version,
	snapshot_id: manifest.snapshot_id,
	generated_at: manifest.generated_at,
	catalog_path: manifest.catalog_path,
	record_count: manifest.record_count,
};

const publicEips = eips.map((eip) => ({
	id: eip.id,
	title: eip.title,
	status: eip.status,
	canonical_url: eip.canonical_url,
	markdown_url: eip.markdown_url,
}));

const publicCalls = calls.map((call) => ({
	id: call.id,
	series: call.series,
	number: call.number,
	date: call.date,
	title: call.title,
	canonical_json_url: call.canonical_json_url,
	canonical_markdown_url: call.canonical_markdown_url,
}));

const snapshot = {
	snapshotId: manifest.snapshot_id,
	source: "forkcast-data",
	latestRoot,
	dataBaseUrl,
	updatedAt: new Date().toISOString(),
	counts: {
		records: manifest.record_count,
		eips: eips.length,
		calls: calls.length,
		decisions: decisions.length,
		searchDocuments: search.length,
	},
	kindCounts,
	manifest: publicManifest,
	eips: publicEips,
	calls: publicCalls,
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

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const networksUrl =
	"https://ethpandaops-platform-production-cartographoor.ams3.digitaloceanspaces.com/networks.json";
const outputPath = resolve("src/domain/devnets/active-networks.snapshot.json");

const fetchJson = async (url) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.json();
};

const run = async () => {
	const data = await fetchJson(networksUrl);
	const activeNetworkIds = Object.entries(data.networks ?? {})
		.filter(([, entry]) => entry?.status === "active")
		.map(([id]) => id)
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

	const snapshot = {
		source: networksUrl,
		retrievedAt: new Date().toISOString().slice(0, 10),
		activeNetworkIds,
	};

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(snapshot, null, "\t")}\n`);

	console.log(
		`Wrote ${activeNetworkIds.length} active devnet network ids to ${outputPath}`,
	);
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

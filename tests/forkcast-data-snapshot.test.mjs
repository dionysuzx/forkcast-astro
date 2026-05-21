import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pin = JSON.parse(await readFile("forkcast-data.snapshot.json", "utf8"));
const snapshot = JSON.parse(
	await readFile("src/domain/forkcast-data/pinned-snapshot.json", "utf8"),
);

assert.notEqual(
	pin.snapshotId,
	"uninitialized",
	"snapshot pin must be initialized",
);
assert.equal(
	pin.snapshotId,
	snapshot.snapshotId,
	"root pin and generated snapshot must match",
);
assert.ok(snapshot.counts.eips > 0, "snapshot must include EIPs");
assert.ok(snapshot.counts.calls > 0, "snapshot must include calls");
assert.ok(
	snapshot.counts.records >= snapshot.counts.eips,
	"record count must be retained",
);
assert.ok(
	snapshot.eips.every((eip) => eip.canonical_url?.startsWith("/latest/eips/")),
	"EIPs must carry canonical data URLs",
);
assert.equal(
	snapshot.search,
	undefined,
	"Astro must not commit the full forkcast-data search corpus",
);
assert.equal(
	snapshot.decisions,
	undefined,
	"Astro must not commit source-close decision text from forkcast-data",
);

console.log(`Pinned forkcast-data snapshot ${pin.snapshotId}`);

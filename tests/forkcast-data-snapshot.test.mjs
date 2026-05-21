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
	snapshot.eips.every((eip) => eip.canonical_url?.startsWith("/latest/eips/")),
	"EIPs must carry canonical data URLs",
);

console.log(`Pinned forkcast-data snapshot ${pin.snapshotId}`);

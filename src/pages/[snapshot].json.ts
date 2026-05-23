import { forkcastDataSnapshot } from "@/domain/forkcast-data/snapshot";

export const prerender = true;

export function getStaticPaths() {
	return [{ params: { snapshot: "_snapshot" } }];
}

export function GET() {
	const body = {
		snapshotId: forkcastDataSnapshot.snapshotId,
		source: forkcastDataSnapshot.source,
		latestRoot: forkcastDataSnapshot.latestRoot,
		dataBaseUrl: forkcastDataSnapshot.dataBaseUrl,
		updatedAt: forkcastDataSnapshot.updatedAt,
		counts: forkcastDataSnapshot.counts,
		manifest: forkcastDataSnapshot.manifest,
	};

	return new Response(`${JSON.stringify(body, null, "\t")}\n`, {
		headers: {
			"cache-control": "public, max-age=0, must-revalidate",
			"content-type": "application/json; charset=utf-8",
		},
	});
}

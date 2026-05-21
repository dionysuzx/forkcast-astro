import snapshot from "./pinned-snapshot.json";

export interface ForkcastDataCitation {
	recordId: string;
	artifactPath: string;
	url: string;
	label: string;
	snippet?: string;
}

export interface ForkcastDataEip {
	id: number;
	title: string;
	status: string;
	canonical_url: string;
	markdown_url: string;
	summary?: string;
	citations?: ForkcastDataCitation[];
}

export interface ForkcastDataCall {
	id: string;
	series: string;
	number: number;
	date: string;
	title: string;
	canonical_json_url: string;
	canonical_markdown_url: string;
	summary?: string;
	citations?: ForkcastDataCitation[];
}

export const forkcastDataSnapshot = snapshot;

export const dataBaseUrl = snapshot.dataBaseUrl.replace(/\/$/, "");

export const canonicalDataUrl = (path: string): string =>
	`${dataBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

export const canonicalEipDataUrl = (id: number): string =>
	canonicalDataUrl(`/latest/eips/${id}.json`);

export const canonicalCallDataUrl = (call: {
	type: string;
	number: string | number;
}): string =>
	canonicalDataUrl(`/latest/calls/${call.type}/${call.number}.json`);

export const snapshotEip = (id: number): ForkcastDataEip | undefined =>
	(snapshot.eips as ForkcastDataEip[]).find((entry) => entry.id === id);

export const snapshotCall = (path: string): ForkcastDataCall | undefined =>
	(snapshot.calls as ForkcastDataCall[]).find((entry) => {
		const normalized = `${entry.series}/${entry.number}`;
		return normalized === path;
	});

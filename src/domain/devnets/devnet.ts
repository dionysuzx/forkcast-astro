const modules = import.meta.glob("./specs/*.json", { eager: true });

export type EipDevnetStatus =
	| "updated"
	| "new"
	| "new_optional"
	| "optional"
	| null;
export type ClientSupportStatus =
	| "supported"
	| "not_supported"
	| "in_progress"
	| "unknown"
	| string;

export interface DevnetSpecEip {
	number: number;
	title: string;
	status: EipDevnetStatus;
	url: string;
}

export interface ClientSupportMatrix {
	clients: string[];
	matrix: Array<{
		eipNumber: number;
		label: string;
		support: Record<string, ClientSupportStatus>;
	}>;
}

export interface DevnetSpec {
	id: string;
	title: string;
	sourceUrl: string;
	scrapedAt: string;
	announcements: string[];
	eips: DevnetSpecEip[];
	elClientSupport: ClientSupportMatrix;
	clClientSupport: ClientSupportMatrix;
	specReferences: {
		consensusSpecs: { version: string; url: string } | null;
		executionSpecs: { version: string; url: string } | null;
	};
}

const isDevnetSpec = (value: unknown): value is DevnetSpec =>
	typeof value === "object" &&
	value !== null &&
	"id" in value &&
	!("upgrade" in value);

export const devnetSpecs = Object.values(modules)
	.map((module) => (module as { default: unknown }).default)
	.filter(isDevnetSpec)
	.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));

export const getDevnetSpec = (id: string): DevnetSpec | undefined =>
	devnetSpecs.find((spec) => spec.id === id);

export const getDevnetSeriesSiblings = (
	id: string,
): {
	previous: string | null;
	next: string | null;
} => {
	const lastDash = id.lastIndexOf("-");
	if (lastDash === -1) return { previous: null, next: null };
	const series = id.slice(0, lastDash);
	const siblings = devnetSpecs
		.filter((spec) => spec.id.startsWith(`${series}-`))
		.sort((a, b) => {
			const aNumber = Number.parseInt(a.id.slice(series.length + 1), 10);
			const bNumber = Number.parseInt(b.id.slice(series.length + 1), 10);
			return aNumber - bNumber;
		});
	const index = siblings.findIndex((spec) => spec.id === id);
	return {
		previous: index > 0 ? siblings[index - 1].id : null,
		next:
			index >= 0 && index < siblings.length - 1 ? siblings[index + 1].id : null,
	};
};

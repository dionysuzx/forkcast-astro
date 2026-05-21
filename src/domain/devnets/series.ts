import { activeDevnetIds } from "@/domain/devnets/active-network";
import { devnetSpecs, getDevnetSpec } from "@/domain/devnets/devnet";

export type DevnetSeriesGroup =
	| "Glamsterdam"
	| "Fusaka"
	| "Pectra"
	| "Dencun"
	| "Other";

export interface DevnetSeriesDefinition {
	categoryKey: string;
	displayName: string;
	group: DevnetSeriesGroup;
	description: string;
}

export interface DevnetSeriesCard extends DevnetSeriesDefinition {
	activeKeys: string[];
	upcomingSpecId: string | null;
	inactive: boolean;
}

export interface DevnetRouteEntry {
	id: string;
	kind: "spec" | "network" | "series";
}

const seriesDefinitions: DevnetSeriesDefinition[] = [
	{
		categoryKey: "bal",
		displayName: "BAL",
		group: "Glamsterdam",
		description:
			"Block-level Access Lists embed every account and storage slot touched during a block with their post-execution values, reducing execution witness overhead.",
	},
	{
		categoryKey: "epbs",
		displayName: "ePBS",
		group: "Glamsterdam",
		description:
			"Enshrined proposer-builder separation moves builder commitments into the protocol while preserving validator duties.",
	},
	{
		categoryKey: "glamsterdam",
		displayName: "Glamsterdam",
		group: "Glamsterdam",
		description:
			"Glamsterdam is the planned Ethereum hard fork following Fusaka, focused on scaling the L1 and improving UX with EIPs spanning execution, consensus, and protocol-level changes.",
	},
	{
		categoryKey: "blob",
		displayName: "BLOB",
		group: "Other",
		description:
			"Cell-based data-availability sampling breaks erasure-coded blobs into smaller cells, enabling nodes to verify availability with less bandwidth.",
	},
	{
		categoryKey: "perf",
		displayName: "PERF",
		group: "Other",
		description:
			"A specialized set of Ethereum testnets focused on stress-testing gas limits and evaluating EVM performance under extreme workloads.",
	},
];

const groupOrder: DevnetSeriesGroup[] = [
	"Glamsterdam",
	"Fusaka",
	"Pectra",
	"Dencun",
	"Other",
];

const categoryFromDevnetId = (id: string): string | null => {
	const match = id.match(/^(.+)-devnet-\d+$/);
	return match?.[1] ?? null;
};

const versionFromDevnetId = (id: string): number | null => {
	const match = id.match(/-(\d+)$/);
	if (!match) return null;
	const version = Number.parseInt(match[1], 10);
	return Number.isFinite(version) ? version : null;
};

const compareDevnetIdsDescending = (a: string, b: string): number => {
	const aVersion = versionFromDevnetId(a) ?? -1;
	const bVersion = versionFromDevnetId(b) ?? -1;
	return bVersion - aVersion || a.localeCompare(b);
};

const specIdsForCategory = (categoryKey: string): string[] =>
	devnetSpecs
		.map((spec) => spec.id)
		.filter((id) => categoryFromDevnetId(id) === categoryKey)
		.sort(compareDevnetIdsDescending);

const highestUpcomingSpec = (
	categoryKey: string,
	activeKeys: string[],
): string | null => {
	const latestActiveVersion = Math.max(
		-1,
		...activeKeys.map((id) => versionFromDevnetId(id) ?? -1),
	);

	return (
		specIdsForCategory(categoryKey).find(
			(id) => (versionFromDevnetId(id) ?? -1) > latestActiveVersion,
		) ?? null
	);
};

const categoryDefinitions = (): DevnetSeriesDefinition[] => {
	const definedKeys = new Set(
		seriesDefinitions.map((series) => series.categoryKey),
	);
	const activeCategories = [...activeDevnetIds()]
		.map(categoryFromDevnetId)
		.filter((category): category is string => Boolean(category));

	const generatedDefinitions = [...new Set(activeCategories)]
		.filter((categoryKey) => !definedKeys.has(categoryKey))
		.map<DevnetSeriesDefinition>((categoryKey) => ({
			categoryKey,
			displayName: categoryKey.toUpperCase(),
			group: "Other",
			description: `Active ${categoryKey} devnet series.`,
		}));

	return [...seriesDefinitions, ...generatedDefinitions];
};

export const devnetSeriesCards = (): DevnetSeriesCard[] => {
	const activeIds = [...activeDevnetIds()];

	return categoryDefinitions()
		.map((definition) => {
			const activeKeys = activeIds
				.filter((id) => categoryFromDevnetId(id) === definition.categoryKey)
				.sort(compareDevnetIdsDescending);

			return {
				...definition,
				activeKeys,
				upcomingSpecId: highestUpcomingSpec(definition.categoryKey, activeKeys),
				inactive: activeKeys.length === 0,
			};
		})
		.filter((card) => card.activeKeys.length > 0 || card.upcomingSpecId)
		.sort(
			(a, b) =>
				groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) ||
				a.displayName.localeCompare(b.displayName),
		);
};

export const devnetSeriesGroups = (): Array<{
	group: DevnetSeriesGroup;
	cards: DevnetSeriesCard[];
}> => {
	const cards = devnetSeriesCards();
	return groupOrder
		.map((group) => ({
			group,
			cards: cards.filter((card) => card.group === group),
		}))
		.filter(({ cards }) => cards.length > 0);
};

export const getDevnetSeries = (
	categoryKey: string,
): DevnetSeriesCard | undefined =>
	devnetSeriesCards().find((series) => series.categoryKey === categoryKey);

export const devnetRouteEntries = (): DevnetRouteEntry[] => {
	const ids = new Map<string, DevnetRouteEntry>();

	for (const spec of devnetSpecs) {
		ids.set(spec.id, { id: spec.id, kind: "spec" });
	}

	for (const series of devnetSeriesCards()) {
		ids.set(series.categoryKey, { id: series.categoryKey, kind: "series" });
		for (const activeKey of series.activeKeys) {
			if (!getDevnetSpec(activeKey)) {
				ids.set(activeKey, { id: activeKey, kind: "network" });
			}
		}
	}

	return [...ids.values()].sort((a, b) => a.id.localeCompare(b.id));
};

import { activeDevnetIds } from "@/domain/devnets/active-network";
import glamsterdamDevnets from "@/domain/devnets/specs/glamsterdam.json";
import { glamsterdamPriorityRows } from "@/domain/prioritization/client-priority";
import {
	getInclusionStage,
	getLaymanTitle,
	getProposalCode,
	getProposalLayer,
	type InclusionStage,
	type ProtocolLayer,
	proposalsForFork,
} from "@/domain/proposals/proposal";
import {
	glamsterdamTestComplexityRows,
	type SteelComplexityAssessment,
} from "@/domain/test-complexity/test-complexity";

export type DevnetInclusionSortField =
	| "proposal"
	| "complexity"
	| "support"
	| "stage"
	| "devnets";
export type SortDirection = "asc" | "desc";
export type DevnetInclusionStageFilter = "all" | InclusionStage;
export type DevnetInclusionLayerFilter = "all" | ProtocolLayer;

export interface GlamsterdamDevnet {
	id: string;
	type: "headliner" | "combined" | string;
	headliner?: string;
	version: number;
	launchDate: string;
	eips: number[];
	updatedEips?: number[];
	optionalEips?: number[];
	isTarget?: boolean;
}

export interface DevnetInclusion {
	id: string;
	type: string;
	headliner: string;
	version: number;
	launchDate: string;
	isTarget: boolean;
	optional: boolean;
	updated: boolean;
}

export interface DevnetInclusionRow {
	proposalId: number;
	displayId: string;
	title: string;
	href: string;
	layer: ProtocolLayer | null;
	inclusionStage: InclusionStage;
	complexity: SteelComplexityAssessment | null;
	averageSupport: number | null;
	stanceCount: number;
	devnets: DevnetInclusion[];
	isGasRepricing: boolean;
}

interface GlamsterdamDevnetData {
	upgrade: string;
	lastUpdated: string;
	devnets: GlamsterdamDevnet[];
}

const data = glamsterdamDevnets as GlamsterdamDevnetData;

const gasRepricingProposalIds = new Set([
	2780, 7778, 7904, 7976, 7981, 8037, 8038,
]);

const stageOrder: Record<InclusionStage, number> = {
	Included: 1,
	"Scheduled for Inclusion": 2,
	"Considered for Inclusion": 3,
	"Proposed for Inclusion": 4,
	"Declined for Inclusion": 5,
	Withdrawn: 6,
	Unknown: 7,
};

export const glamsterdamDevnetDataLastUpdated = (): string => data.lastUpdated;

export const glamsterdamDevnetInclusionRows = (): DevnetInclusionRow[] => {
	const complexityByProposal = new Map(
		glamsterdamTestComplexityRows().map((row) => [
			row.proposalId,
			row.assessment,
		]),
	);
	const priorityByProposal = new Map(
		glamsterdamPriorityRows().map((row) => [row.proposalId, row]),
	);
	const activeIds = activeDevnetIds();
	const devnetsByProposal = buildDevnetMap(
		data.devnets.filter((devnet) => activeIds.has(devnet.id)),
	);

	return proposalsForFork("Glamsterdam").map((proposal) => {
		const priority = priorityByProposal.get(proposal.id);

		return {
			proposalId: proposal.id,
			displayId: getProposalCode(proposal),
			title: getLaymanTitle(proposal),
			href: `/eips/${proposal.id}`,
			layer: getProposalLayer(proposal),
			inclusionStage: getInclusionStage(proposal, "Glamsterdam"),
			complexity: complexityByProposal.get(proposal.id) ?? null,
			averageSupport: priority?.averageScore ?? null,
			stanceCount: priority?.stanceCount ?? 0,
			devnets: devnetsByProposal.get(proposal.id) ?? [],
			isGasRepricing: gasRepricingProposalIds.has(proposal.id),
		};
	});
};

export const sortDevnetInclusionRows = (
	rows: DevnetInclusionRow[],
	sortField: DevnetInclusionSortField,
	sortDirection: SortDirection,
): DevnetInclusionRow[] =>
	[...rows].sort((a, b) => {
		switch (sortField) {
			case "proposal":
				return directedComparison(a.proposalId - b.proposalId, sortDirection);
			case "complexity":
				return compareNullableNumber(
					a.complexity?.totalScore ?? null,
					b.complexity?.totalScore ?? null,
					sortDirection,
				);
			case "support":
				return compareNullableNumber(
					a.averageSupport,
					b.averageSupport,
					sortDirection,
				);
			case "stage":
				return directedComparison(
					(stageOrder[a.inclusionStage] ?? 99) -
						(stageOrder[b.inclusionStage] ?? 99),
					sortDirection,
				);
			case "devnets":
				return directedComparison(
					latestDevnetVersion(a.devnets) - latestDevnetVersion(b.devnets) ||
						a.devnets.length - b.devnets.length,
					sortDirection,
				);
			default:
				return 0;
		}
	});

export const devnetBadgeClass = (headliner: string): string => {
	switch (headliner.toUpperCase()) {
		case "BAL":
			return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
		case "EPBS":
			return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
		case "GLAMSTERDAM":
			return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
		default:
			return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
	}
};

export const devnetLabel = (devnet: DevnetInclusion): string =>
	`${devnet.id}${devnet.optional ? "*" : ""}`;

const buildDevnetMap = (
	devnets: GlamsterdamDevnet[],
): Map<number, DevnetInclusion[]> => {
	const map = new Map<number, DevnetInclusion[]>();

	for (const devnet of devnets) {
		for (const proposalId of devnet.eips) {
			addDevnet(map, proposalId, devnet, false);
		}
		for (const proposalId of devnet.optionalEips ?? []) {
			addDevnet(map, proposalId, devnet, true);
		}
	}

	return map;
};

const addDevnet = (
	map: Map<number, DevnetInclusion[]>,
	proposalId: number,
	devnet: GlamsterdamDevnet,
	optional: boolean,
) => {
	const inclusion: DevnetInclusion = {
		id: devnet.id,
		type: devnet.type,
		headliner: deriveHeadliner(devnet),
		version: devnet.version,
		launchDate: devnet.launchDate,
		isTarget: Boolean(devnet.isTarget),
		optional,
		updated: Boolean(devnet.updatedEips?.includes(proposalId)),
	};

	const existing = map.get(proposalId) ?? [];
	map.set(proposalId, [...existing, inclusion]);
};

const deriveHeadliner = (devnet: GlamsterdamDevnet): string => {
	if (devnet.headliner) return devnet.headliner;
	const match = devnet.id.match(/^(.+)-devnet-\d+$/);
	return match ? match[1].toUpperCase() : devnet.id.toUpperCase();
};

const latestDevnetVersion = (devnets: DevnetInclusion[]): number =>
	devnets.length > 0
		? Math.max(...devnets.map((devnet) => devnet.version))
		: -1;

const compareNullableNumber = (
	a: number | null,
	b: number | null,
	sortDirection: SortDirection,
): number => {
	if (a === null && b === null) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	return directedComparison(a - b, sortDirection);
};

const directedComparison = (
	comparison: number,
	sortDirection: SortDirection,
): number => (sortDirection === "asc" ? comparison : -comparison);

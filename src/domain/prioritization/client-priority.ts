import { pendingProposalsForFork } from "@/domain/proposals/pending-proposal";
import {
	getInclusionStage,
	getLaymanTitle,
	getProposalCode,
	getProposalLayer,
	type InclusionStage,
	type ProtocolLayer,
	proposalsForFork,
} from "@/domain/proposals/proposal";
import glamsterdamData from "@/domain/upgrades/prioritization/glamsterdam.json";

export type RatingSystem =
	| "tier-abcds"
	| "support-oppose"
	| "priority-tier"
	| "custom";
export type ClientType = "EL" | "CL";
export type PrioritySortField =
	| "proposal"
	| "average"
	| "elAverage"
	| "clAverage"
	| "stanceCount"
	| "stage";
export type SortDirection = "asc" | "desc";

export interface ClientStance {
	clientName: string;
	clientType: ClientType;
	ratingSystem: RatingSystem;
	rawRating: string | null;
	normalizedScore: number | null;
	comment?: string;
	sourceUrl: string;
	lastUpdated: string;
}

export interface PrioritizationData {
	fork: string;
	lastUpdated: string;
	eips: Array<{
		eipId: number;
		stances: ClientStance[];
	}>;
}

export interface ClientPriorityRow {
	proposalId: number;
	displayId: string;
	title: string;
	href: string;
	layer: ProtocolLayer | null;
	inclusionStage: InclusionStage;
	averageScore: number | null;
	elAverageScore: number | null;
	clAverageScore: number | null;
	stanceCount: number;
	elStanceCount: number;
	clStanceCount: number;
	supportCount: number;
	opposeCount: number;
	stances: ClientStance[];
}

export const elClients = ["Besu", "Erigon", "Geth", "Nethermind", "Reth"];
export const clClients = [
	"Grandine",
	"Lighthouse",
	"Lodestar",
	"Nimbus",
	"Prysm",
	"Teku",
];

const stageOrder: Record<InclusionStage, number> = {
	Included: 1,
	"Scheduled for Inclusion": 2,
	"Considered for Inclusion": 3,
	"Proposed for Inclusion": 4,
	"Declined for Inclusion": 5,
	Withdrawn: 6,
	Unknown: 7,
};

export const ratingLabel = (
	ratingSystem: RatingSystem,
	rawRating: string | null,
): string => {
	if (!rawRating) return "No stance";
	const rating = rawRating.toLowerCase();

	switch (ratingSystem) {
		case "tier-abcds":
			return (
				{
					s: "S-Tier",
					a: "A-Tier",
					b: "B-Tier",
					c: "C-Tier",
					d: "D-Tier",
					dfi: "DFI",
				}[rating] ?? rawRating
			);
		case "support-oppose":
			return (
				{
					"strongly-support": "Strong Support",
					support: "Support",
					"weakly-support": "Weak Support",
					neutral: "Neutral",
					oppose: "Oppose",
				}[rating] ?? rawRating
			);
		case "priority-tier":
			return (
				{
					"tier-1": "Tier 1",
					"tier-2": "Tier 2",
				}[rating] ?? rawRating
			);
		case "custom":
			return (
				{
					approve: "Approve",
					reject: "Reject",
					uncertain: "Uncertain",
				}[rating] ?? rawRating
			);
	}
};

export const scoreClass = (score: number | null, hasStance = true): string => {
	if (score === null) {
		return hasStance
			? "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
			: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400";
	}

	switch (score) {
		case 5:
			return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
		case 4:
			return "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300";
		case 3:
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
		case 2:
			return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
		case 1:
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
		default:
			return "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400";
	}
};

export const clientInitials = (clientName: string): string =>
	(
		({
			besu: "Be",
			erigon: "Er",
			geth: "Ge",
			nethermind: "Ne",
			reth: "Re",
			grandine: "Gr",
			lighthouse: "LH",
			lodestar: "Lo",
			nimbus: "Ni",
			prysm: "Pr",
			teku: "Te",
		}) as Record<string, string>
	)[clientName.toLowerCase()] ?? clientName.slice(0, 2);

const averageScore = (stances: ClientStance[]): number | null => {
	const scored = stances.filter((stance) => stance.normalizedScore !== null);
	if (scored.length === 0) return null;
	const total = scored.reduce(
		(sum, stance) => sum + (stance.normalizedScore ?? 0),
		0,
	);
	return Math.round((total / scored.length) * 10) / 10;
};

const aggregateRow = (
	proposal: ReturnType<typeof proposalsForFork>[number],
	stances: ClientStance[],
): ClientPriorityRow => {
	const elStances = stances.filter((stance) => stance.clientType === "EL");
	const clStances = stances.filter((stance) => stance.clientType === "CL");
	const scored = stances.filter((stance) => stance.normalizedScore !== null);

	return {
		proposalId: proposal.id,
		displayId: getProposalCode(proposal),
		title: getLaymanTitle(proposal),
		href: `/eips/${proposal.id}`,
		layer: getProposalLayer(proposal),
		inclusionStage: getInclusionStage(proposal, "Glamsterdam"),
		averageScore: averageScore(stances),
		elAverageScore: averageScore(elStances),
		clAverageScore: averageScore(clStances),
		stanceCount: scored.length,
		elStanceCount: elStances.filter((stance) => stance.normalizedScore !== null)
			.length,
		clStanceCount: clStances.filter((stance) => stance.normalizedScore !== null)
			.length,
		supportCount: scored.filter((stance) => (stance.normalizedScore ?? 0) >= 4)
			.length,
		opposeCount: scored.filter((stance) => stance.normalizedScore === 1).length,
		stances,
	};
};

export const glamsterdamPriorityRows = (): ClientPriorityRow[] => {
	const data = glamsterdamData as PrioritizationData;
	const stancesByProposal = new Map(
		data.eips.map((proposal) => [proposal.eipId, proposal.stances]),
	);

	return proposalsForFork("Glamsterdam").map((proposal) =>
		aggregateRow(proposal, stancesByProposal.get(proposal.id) ?? []),
	);
};

export const glamsterdamPriorityLastUpdated = (): string =>
	(glamsterdamData as PrioritizationData).lastUpdated;

export const pendingGlamsterdamProposalCount = (): number =>
	pendingProposalsForFork("Glamsterdam").length;

export const sortPriorityRows = (
	rows: ClientPriorityRow[],
	sortField: PrioritySortField,
	sortDirection: SortDirection,
): ClientPriorityRow[] =>
	[...rows].sort((a, b) => {
		let comparison = 0;

		switch (sortField) {
			case "proposal":
				comparison = a.proposalId - b.proposalId;
				break;
			case "average":
				return compareNullableScore(
					a.averageScore,
					b.averageScore,
					a.stanceCount,
					b.stanceCount,
					sortDirection,
				);
			case "elAverage":
				return compareNullableScore(
					a.elAverageScore,
					b.elAverageScore,
					a.elStanceCount,
					b.elStanceCount,
					sortDirection,
				);
			case "clAverage":
				return compareNullableScore(
					a.clAverageScore,
					b.clAverageScore,
					a.clStanceCount,
					b.clStanceCount,
					sortDirection,
				);
			case "stanceCount":
				comparison = a.stanceCount - b.stanceCount;
				break;
			case "stage":
				comparison =
					(stageOrder[a.inclusionStage] ?? 99) -
					(stageOrder[b.inclusionStage] ?? 99);
				if (comparison === 0) comparison = b.stanceCount - a.stanceCount;
				break;
		}

		return sortDirection === "asc" ? comparison : -comparison;
	});

const compareNullableScore = (
	aScore: number | null,
	bScore: number | null,
	aStanceCount: number,
	bStanceCount: number,
	sortDirection: SortDirection,
): number => {
	if (aScore === null && bScore === null) return bStanceCount - aStanceCount;
	if (aScore === null) return 1;
	if (bScore === null) return -1;
	const scoreComparison = aScore - bScore;
	const directionalComparison =
		sortDirection === "asc" ? scoreComparison : -scoreComparison;
	return directionalComparison === 0
		? bStanceCount - aStanceCount
		: directionalComparison;
};

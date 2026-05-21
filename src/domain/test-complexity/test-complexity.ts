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
import steelSnapshot from "@/domain/test-complexity/steel-complexity.snapshot.json";

export type ComplexityTier = "Low" | "Medium" | "High";
export type ComplexitySortField = "proposal" | "score" | "tier" | "stage";
export type SortDirection = "asc" | "desc";
export type ComplexityTierFilter = "all" | ComplexityTier | "unassessed";

export interface ComplexityAnchor {
	name: string;
	score: number;
	notes?: string;
}

export interface SteelComplexityAssessment {
	eipNumber: number;
	totalScore: number;
	tier: ComplexityTier;
	anchors: ComplexityAnchor[];
	assessmentUrl: string;
}

export interface SteelComplexitySnapshot {
	source: string;
	retrievedAt: string;
	assessments: SteelComplexityAssessment[];
}

export interface TestComplexityRow {
	proposalId: number;
	displayId: string;
	title: string;
	href: string;
	layer: ProtocolLayer | null;
	inclusionStage: InclusionStage;
	assessment: SteelComplexityAssessment | null;
}

const snapshot = steelSnapshot as SteelComplexitySnapshot;

const stageOrder: Record<InclusionStage, number> = {
	Included: 1,
	"Scheduled for Inclusion": 2,
	"Considered for Inclusion": 3,
	"Proposed for Inclusion": 4,
	"Declined for Inclusion": 5,
	Withdrawn: 6,
	Unknown: 7,
};

const tierOrder: Record<ComplexityTier, number> = {
	Low: 1,
	Medium: 2,
	High: 3,
};

export const steelComplexitySource = (): string => snapshot.source;

export const steelComplexityRetrievedAt = (): string => snapshot.retrievedAt;

export const steelComplexityAssessments = (): SteelComplexityAssessment[] =>
	snapshot.assessments;

export const steelComplexityAssessmentByEip = (): Map<
	number,
	SteelComplexityAssessment
> =>
	new Map(
		snapshot.assessments.map((assessment) => [
			assessment.eipNumber,
			assessment,
		]),
	);

export const glamsterdamTestComplexityRows = (): TestComplexityRow[] => {
	const assessmentsByEip = steelComplexityAssessmentByEip();

	return proposalsForFork("Glamsterdam").map((proposal) => ({
		proposalId: proposal.id,
		displayId: getProposalCode(proposal),
		title: getLaymanTitle(proposal),
		href: `/eips/${proposal.id}`,
		layer: getProposalLayer(proposal),
		inclusionStage: getInclusionStage(proposal, "Glamsterdam"),
		assessment: assessmentsByEip.get(proposal.id) ?? null,
	}));
};

export const pendingGlamsterdamComplexityProposalCount = (): number =>
	pendingProposalsForFork("Glamsterdam").length;

export const sortTestComplexityRows = (
	rows: TestComplexityRow[],
	sortField: ComplexitySortField,
	sortDirection: SortDirection,
): TestComplexityRow[] =>
	[...rows].sort((a, b) => {
		switch (sortField) {
			case "proposal":
				return directedComparison(a.proposalId - b.proposalId, sortDirection);
			case "score":
				return compareNullableNumber(
					a.assessment?.totalScore ?? null,
					b.assessment?.totalScore ?? null,
					sortDirection,
				);
			case "tier":
				return compareNullableNumber(
					a.assessment ? tierOrder[a.assessment.tier] : null,
					b.assessment ? tierOrder[b.assessment.tier] : null,
					sortDirection,
				);
			case "stage":
				return directedComparison(
					(stageOrder[a.inclusionStage] ?? 99) -
						(stageOrder[b.inclusionStage] ?? 99),
					sortDirection,
				);
			default:
				return 0;
		}
	});

export const tierBadgeClass = (tier: ComplexityTier): string => {
	switch (tier) {
		case "Low":
			return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
		case "Medium":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
		case "High":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
	}
};

export const scoreToneClass = (score: number): string => {
	if (score >= 20) {
		return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
	}
	if (score >= 10) {
		return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
	}
	return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
};

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

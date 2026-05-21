import {
	FUSAKA_PROGRESS,
	GLAMSTERDAM_PROGRESS,
	HEGOTA_PROGRESS,
	UPGRADE_PROCESS_PHASES,
} from "@/constants/timeline-phases";
import {
	calculateSoonestMainnetDate,
	DEFAULT_PHASE_DURATIONS,
	formatDateISO,
	generateForkProgress,
	type PhaseDurations,
	parseLocalDate,
} from "@/domain/schedule/fork-date-calculator";
import type {
	DevnetDetail,
	ForkPhaseProgress,
	ForkProgress,
	ProcessPhase,
	SubstepDetail,
	TestnetDetail,
} from "@/types/timeline";

export type ScheduledFork = "fusaka" | "glamsterdam" | "hegota";

export interface PlanningTableState {
	glamsterdamMainnetDate: string;
	hegotaMainnetDate: string;
	glamsterdamDevnetCount: number;
	hegotaDevnetCount: number;
	lockedDates: Record<string, string>;
	phaseDurations: PhaseDurations;
}

export interface DurationSetting {
	key: keyof PhaseDurations;
	group: "headliners" | "scope" | "devnets" | "testnets";
	label: string;
	description: string;
	days: number;
}

export interface ScheduledForkPlan {
	id: ScheduledFork;
	name: string;
	metaThreadUrl: string | null;
	mainnetDate: string;
	devnetCount: number;
	progress: ForkProgress;
}

export type ScheduledForkRecord = Record<ScheduledFork, ScheduledForkPlan>;

export interface SchedulePlan {
	forks: ScheduledForkPlan[];
	forksById: ScheduledForkRecord;
	phases: ProcessPhase[];
	durationSettings: DurationSetting[];
}

export const defaultPlanningState: PlanningTableState = {
	glamsterdamMainnetDate: formatDateISO(
		calculateSoonestMainnetDate(new Date(2026, 3, 15), 5),
	),
	hegotaMainnetDate: "2027-03-01",
	glamsterdamDevnetCount: 6,
	hegotaDevnetCount: 5,
	lockedDates: {},
	phaseDurations: DEFAULT_PHASE_DURATIONS,
};

export const durationSettings = (
	durations: PhaseDurations = DEFAULT_PHASE_DURATIONS,
): DurationSetting[] => [
	{
		key: "HEADLINER_SELECTION_DURATION",
		group: "headliners",
		label: "Proposal to selection",
		description: "Expected days for headliner review and selection.",
		days: durations.HEADLINER_SELECTION_DURATION,
	},
	{
		key: "SELECTION_TO_EIP_PFI",
		group: "headliners",
		label: "Selection to PFI",
		description: "Days between headliner selection and proposal window.",
		days: durations.SELECTION_TO_EIP_PFI,
	},
	{
		key: "EIP_PFI_DURATION",
		group: "scope",
		label: "PFI to CFI",
		description: "Expected days for non-headliner proposals.",
		days: durations.EIP_PFI_DURATION,
	},
	{
		key: "EIP_SELECTION_TO_DEVNET",
		group: "scope",
		label: "CFI to first devnet",
		description: "Days between CFI deadline and first devnet.",
		days: durations.EIP_SELECTION_TO_DEVNET,
	},
	{
		key: "DEVNET_DURATION",
		group: "devnets",
		label: "Between devnets",
		description: "Expected days between each devnet.",
		days: durations.DEVNET_DURATION,
	},
	{
		key: "DEVNET_TO_SEPOLIA",
		group: "devnets",
		label: "Last devnet to Sepolia",
		description: "Days between last devnet and first public testnet.",
		days: durations.DEVNET_TO_SEPOLIA,
	},
	{
		key: "SEPOLIA_TO_HOODI",
		group: "testnets",
		label: "Sepolia to Hoodi",
		description: "Days between public testnets.",
		days: durations.SEPOLIA_TO_HOODI,
	},
	{
		key: "HOODI_TO_MAINNET",
		group: "testnets",
		label: "Hoodi to mainnet",
		description: "Days between Hoodi testnet and mainnet.",
		days: durations.HOODI_TO_MAINNET,
	},
];

const preserveKnownDates = <
	T extends SubstepDetail | DevnetDetail | TestnetDetail,
>(
	projected: T[] | undefined,
	known: T[] | undefined,
): T[] | undefined =>
	projected?.map((item, index) => {
		const knownItem = known?.[index];
		if (!knownItem?.date) return item;
		return {
			...item,
			status: knownItem.status,
			date: knownItem.date,
			projectedDate: knownItem.date,
		};
	});

const mergeKnownProgress = (
	projected: ForkProgress,
	known: ForkProgress,
): ForkProgress => ({
	...projected,
	phases: projected.phases.map((phase, index) => {
		const knownPhase = known.phases[index];
		if (!knownPhase) return phase;
		const phaseHasKnownState =
			knownPhase.status === "completed" || knownPhase.status === "in-progress";
		return {
			...phase,
			status: phaseHasKnownState ? knownPhase.status : phase.status,
			actualStartDate: knownPhase.actualStartDate ?? phase.actualStartDate,
			actualEndDate: knownPhase.actualEndDate ?? phase.actualEndDate,
			progressNotes: phaseHasKnownState
				? (knownPhase.progressNotes ?? phase.progressNotes)
				: phase.progressNotes,
			substeps: preserveKnownDates(phase.substeps, knownPhase.substeps),
			devnets: preserveKnownDates(phase.devnets, knownPhase.devnets),
			testnets: preserveKnownDates(phase.testnets, knownPhase.testnets),
		};
	}),
});

export const phaseDateLabel = (phase: ForkPhaseProgress): string =>
	phase.actualEndDate ??
	phase.projectedDate ??
	phase.actualStartDate ??
	"No date set";

export const phaseForFork = (
	fork: ScheduledForkPlan,
	phaseId: string,
): ForkPhaseProgress | null =>
	fork.progress.phases.find((phase) => phase.phaseId === phaseId) ?? null;

export const phaseMilestones = (
	phase: ForkPhaseProgress | null,
): Array<SubstepDetail | DevnetDetail | TestnetDetail> => [
	...(phase?.substeps ?? []),
	...(phase?.devnets ?? []),
	...(phase?.testnets?.filter((testnet) => testnet.status !== "deprecated") ??
		[]),
];

export const buildSchedulePlan = (
	state: PlanningTableState = defaultPlanningState,
): SchedulePlan => {
	const glamsterdamProjection = mergeKnownProgress(
		generateForkProgress(
			"Glamsterdam",
			parseLocalDate(state.glamsterdamMainnetDate),
			{
				devnetCount: state.glamsterdamDevnetCount,
				durations: state.phaseDurations,
			},
		),
		GLAMSTERDAM_PROGRESS,
	);

	const hegotaProjection = mergeKnownProgress(
		generateForkProgress("Hegota", parseLocalDate(state.hegotaMainnetDate), {
			headlinerProposalDeadlineOverride: new Date(2026, 1, 4),
			headlinerSelectionDeadlineOverride: new Date(2026, 2, 26),
			devnetCount: state.hegotaDevnetCount,
			durations: state.phaseDurations,
		}),
		HEGOTA_PROGRESS,
	);

	const forksById: ScheduledForkRecord = {
		fusaka: {
			id: "fusaka",
			name: "Fusaka",
			metaThreadUrl: null,
			mainnetDate: "Dec 3, 2025",
			devnetCount: 6,
			progress: FUSAKA_PROGRESS,
		},
		glamsterdam: {
			id: "glamsterdam",
			name: "Glamsterdam",
			metaThreadUrl:
				"https://ethereum-magicians.org/t/eip-7773-glamsterdam-network-upgrade-meta-thread/21195",
			mainnetDate: state.glamsterdamMainnetDate,
			devnetCount: state.glamsterdamDevnetCount,
			progress: glamsterdamProjection,
		},
		hegota: {
			id: "hegota",
			name: "Hegota",
			metaThreadUrl:
				"https://ethereum-magicians.org/t/eip-8081-heka-bogota-network-upgrade-meta-thread/26876",
			mainnetDate: state.hegotaMainnetDate,
			devnetCount: state.hegotaDevnetCount,
			progress: hegotaProjection,
		},
	};

	return {
		forks: [forksById.fusaka, forksById.glamsterdam, forksById.hegota],
		forksById,
		phases: UPGRADE_PROCESS_PHASES,
		durationSettings: durationSettings(state.phaseDurations),
	};
};

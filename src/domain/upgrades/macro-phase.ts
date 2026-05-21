import { FORK_PROGRESS_MAP, MACRO_PHASES } from "@/constants/timeline-phases";
import type { ForkProgress, MacroPhase } from "@/types/timeline";
import type { NetworkUpgrade } from "./upgrade";

const phaseOrder: MacroPhase[] = [
	"headliners",
	"scoping",
	"devnets",
	"testnets",
	"mainnet",
];

const isActivePhase = (status?: string): boolean =>
	status === "completed" || status === "in-progress";

export const deriveMacroPhase = (progress: ForkProgress): MacroPhase => {
	const phaseStatus = (phaseId: string) =>
		progress.phases.find((phase) => phase.phaseId === phaseId)?.status;

	if (isActivePhase(phaseStatus("mainnet-deployment"))) return "mainnet";
	if (isActivePhase(phaseStatus("public-testnets"))) return "testnets";
	if (isActivePhase(phaseStatus("development"))) return "devnets";
	if (isActivePhase(phaseStatus("eip-selection"))) return "scoping";
	return "headliners";
};

export const progressForUpgrade = (
	upgrade: NetworkUpgrade,
): ForkProgress | undefined => FORK_PROGRESS_MAP[upgrade.id];

export const macroPhaseForUpgrade = (upgrade: NetworkUpgrade): MacroPhase => {
	if (upgrade.macroPhaseOverride) return upgrade.macroPhaseOverride;
	const progress = progressForUpgrade(upgrade);
	return progress ? deriveMacroPhase(progress) : "headliners";
};

export const macroPhaseSummary = (upgrade: NetworkUpgrade): string => {
	if (upgrade.status === "Live") {
		return upgrade.highlights ?? upgrade.tagline;
	}
	if (upgrade.tagline) return upgrade.tagline;

	const progress = progressForUpgrade(upgrade);
	const activePhase = [...(progress?.phases ?? [])]
		.reverse()
		.find((phase) => phase.status === "in-progress");
	if (activePhase?.progressNotes) return activePhase.progressNotes;

	const completedPhase = [...(progress?.phases ?? [])]
		.reverse()
		.find((phase) => phase.status === "completed");
	if (completedPhase?.progressNotes) return completedPhase.progressNotes;

	switch (macroPhaseForUpgrade(upgrade)) {
		case "headliners":
			return "Defining fork focus and evaluating headliner proposals.";
		case "scoping":
			return "Selecting non-headliner EIPs for inclusion.";
		case "devnets":
			return "Client teams implementing across devnets.";
		case "testnets":
			return "Testing on public testnets.";
		case "mainnet":
			return "Preparing for mainnet activation.";
	}
};

export interface MacroPhaseSegment {
	id: MacroPhase;
	label: string;
	description: string;
	state: "complete" | "current" | "upcoming";
}

export const macroPhaseSegments = (
	upgrade: NetworkUpgrade,
): MacroPhaseSegment[] => {
	const shipped = upgrade.status === "Live";
	const currentPhase = macroPhaseForUpgrade(upgrade);
	const currentIndex = phaseOrder.indexOf(currentPhase);

	return MACRO_PHASES.map((phase, index) => ({
		...phase,
		state:
			shipped || index < currentIndex
				? "complete"
				: index === currentIndex
					? "current"
					: "upcoming",
	}));
};

export const macroPhaseCurrentLabel = (upgrade: NetworkUpgrade): string => {
	if (upgrade.status === "Live") return "Live";
	const currentPhase = macroPhaseForUpgrade(upgrade);
	return (
		MACRO_PHASES.find((phase) => phase.id === currentPhase)?.label ??
		currentPhase
	);
};

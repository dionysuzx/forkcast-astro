import type { KeyDecision } from "./artifacts";

export const keyDecisionTagLabel = (decision: KeyDecision): string => {
	if (decision.type === "headliner_selected") return "Headliner";
	if (decision.type === "devnet_inclusion") return decision.devnet ?? "Devnet";
	if (decision.type === "stage_change" && decision.stage_change) {
		switch (decision.stage_change.to) {
			case "Considered":
				return "CFI";
			case "Scheduled":
				return "SFI";
			case "Declined":
				return "DFI";
			case "Included":
				return "Included";
			case "Withdrawn":
				return "Withdrawn";
			case "Proposed":
				return "Proposed";
		}
	}
	return "";
};

export const keyDecisionTagClass = (decision: KeyDecision): string => {
	if (decision.type === "headliner_selected") {
		return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
	}
	if (decision.type === "devnet_inclusion") {
		return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
	}
	switch (decision.stage_change?.to) {
		case "Scheduled":
		case "Included":
			return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
		case "Considered":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
		case "Declined":
			return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
		case "Withdrawn":
			return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
		case "Proposed":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
	}
};

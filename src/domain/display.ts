import type { InclusionStage, ProtocolLayer } from "./proposals/proposal";
import type { UpgradeStatus } from "./upgrades/upgrade";

export const stageLabel = (stage: InclusionStage | string): string => {
	switch (stage) {
		case "Considered for Inclusion":
			return "Considered";
		case "Proposed for Inclusion":
			return "Proposed";
		case "Scheduled for Inclusion":
			return "Scheduled";
		case "Declined for Inclusion":
			return "Declined";
		default:
			return stage;
	}
};

export const stageBadgeClass = (stage: InclusionStage | string): string => {
	switch (stage) {
		case "Considered for Inclusion":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
		case "Proposed for Inclusion":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
		case "Scheduled for Inclusion":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
		case "Included":
			return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
		case "Declined for Inclusion":
			return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
		case "Withdrawn":
			return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
	}
};

export const layerBadgeClass = (layer: ProtocolLayer): string =>
	layer === "EL"
		? "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-600"
		: "bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-600";

export const upgradeBadgeClass = (status: UpgradeStatus): string => {
	switch (status) {
		case "Live":
			return "bg-emerald-50/50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
		case "Upcoming":
			return "bg-blue-50/50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
		case "Planning":
		case "Research":
			return "bg-purple-50/50 text-purple-600 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800";
		default:
			return "bg-slate-50/50 text-slate-600 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700";
	}
};

export const callTypeBadgeClass = (type: string): string => {
	const styles: Record<string, string> = {
		acdc: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
		acde: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
		acdt: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
		epbs: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
		bal: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
		focil:
			"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
		price: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
		tli: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
		pqts: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
		rpc: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
		zkevm:
			"bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
		etm: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
		awd: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
		pqi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
		fcr: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
		aa: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
	};
	return (
		styles[type] ??
		"bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
	);
};

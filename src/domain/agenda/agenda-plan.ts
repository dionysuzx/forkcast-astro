import fs from "node:fs";
import path from "node:path";
import { getCallArtifacts, type TldrData } from "@/domain/calls/artifacts";
import {
	callsByType,
	callTypeNames,
	type ProtocolCall,
} from "@/domain/calls/call";
import {
	type UpcomingCallSnapshot,
	upcomingCallForType,
} from "@/domain/calls/upcoming-call";
import { pendingProposalsForFork } from "@/domain/proposals/pending-proposal";
import {
	getLaymanTitle,
	getProposalLayer,
	type Proposal,
	proposals,
} from "@/domain/proposals/proposal";
import { getForkDisplayName, networkUpgrades } from "@/domain/upgrades/upgrade";

export type SeriesKey = "acde" | "acdc" | "acdt";
export type Priority = "high" | "medium" | "low";
export type ScopeStatus = "Considered" | "Proposed" | "Candidate";

export interface AgendaSuggestion {
	topic: string;
	priority: Priority;
	rationale: string;
	related_eips: number[];
	source: string;
}

export interface AgendaSuggestionsData {
	series: string;
	generated: string;
	for_call: string;
	suggestions: AgendaSuggestion[];
}

export interface OpenActionItem {
	action: string;
	owner: string;
	source_call: string;
	source_date: string;
	notes: string | null;
}

export interface OpenActionItemsData {
	series: string;
	generated: string;
	lookback_calls: string[];
	open_items: OpenActionItem[];
	resolved_items: Array<{
		action: string;
		owner: string;
		source_call: string;
		source_date: string;
		resolved_in: string;
		resolution: string;
	}>;
}

export interface DeferredDecision {
	topic: string;
	deferred_in: string;
	deferred_date: string;
	expected_revisit: string | null;
	revisited: boolean;
	revisited_in: string | null;
	outcome: string | null;
}

export interface DeferredDecisionsData {
	series: string;
	generated: string;
	lookback_calls: string[];
	deferred: DeferredDecision[];
}

export interface EipThread {
	eip: number;
	title: string;
	fork: string;
	stage: string;
	thread: { call: string; date: string; summary: string }[];
	current_state: string;
	open_questions: string[];
}

export interface EipThreadsData {
	series: string;
	generated: string;
	lookback_calls: string[];
	eip_threads: EipThread[];
}

export interface PendingScopeItem {
	id: number | string;
	title: string;
	href: string;
	layer: "EL" | "CL" | null;
	status: ScopeStatus;
	lastDiscussedDate: string | null;
	lastDiscussedCall: string | null;
	thread: EipThread | null;
}

export interface RecentCallSummary {
	call: ProtocolCall;
	tldr: TldrData;
	decisionCount: number;
	actionCount: number;
	targetCount: number;
}

export interface AgendaPlan {
	type: SeriesKey;
	label: string;
	seriesName: string;
	agendaSuggestions: AgendaSuggestionsData | null;
	openActions: OpenActionItemsData | null;
	deferredDecisions: DeferredDecisionsData | null;
	eipThreads: EipThreadsData | null;
	upcomingCall: UpcomingCallSnapshot | null;
	scopeGroups: Array<{
		forkName: string;
		items: PendingScopeItem[];
	}>;
	recentCalls: RecentCallSummary[];
}

type ForkRelationship = Proposal["forkRelationships"][number];

const callTypes: SeriesKey[] = ["acde", "acdc", "acdt"];
const seriesLayer: Partial<Record<SeriesKey, "EL" | "CL">> = {
	acde: "EL",
	acdc: "CL",
};

const defaultArtifactRoot = () =>
	path.resolve(process.cwd(), "public", "artifacts");

const readJson = <T>(
	artifactRoot: string,
	type: SeriesKey,
	file: string,
): T | null => {
	const filePath = path.join(artifactRoot, type, "plan", file);
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const threadByEip = (data: EipThreadsData | null): Map<number, EipThread> =>
	new Map((data?.eip_threads ?? []).map((thread) => [thread.eip, thread]));

const pendingScopeForSeries = (
	type: SeriesKey,
	eipThreads: EipThreadsData | null,
): AgendaPlan["scopeGroups"] => {
	const layer = seriesLayer[type] ?? null;
	const threads = threadByEip(eipThreads);
	const groups = new Map<string, PendingScopeItem[]>();
	const activeUpgrades = networkUpgrades.filter(
		(upgrade) => upgrade.status === "Upcoming" || upgrade.status === "Planning",
	);

	const push = (forkName: string, item: PendingScopeItem) => {
		const existing = groups.get(forkName) ?? [];
		groups.set(forkName, [...existing, item]);
	};

	for (const upgrade of activeUpgrades) {
		const displayForkName = upgrade.name.replace(" Upgrade", "");
		const forkKeys = new Set([
			displayForkName.toLowerCase(),
			upgrade.id.toLowerCase(),
		]);

		for (const proposal of proposals) {
			if (layer && getProposalLayer(proposal) !== layer) continue;
			const relationship = proposal.forkRelationships.find((fork) =>
				forkKeys.has(fork.forkName.toLowerCase()),
			);
			if (!relationship) continue;

			const latest = relationship.statusHistory.at(-1);
			if (latest?.status === "Proposed" || latest?.status === "Considered") {
				push(
					displayForkName,
					scopeItem(proposal, relationship, latest.status, threads),
				);
				continue;
			}

			if (
				!latest &&
				(relationship.isHeadliner || relationship.wasHeadlinerCandidate) &&
				upgrade.status === "Planning"
			) {
				push(
					displayForkName,
					scopeItem(proposal, relationship, "Candidate", threads),
				);
			}
		}

		const pending = [
			...pendingProposalsForFork(displayForkName),
			...pendingProposalsForFork(upgrade.id),
		].filter(
			(proposal, index, all) =>
				all.findIndex((item) => item.id === proposal.id) === index,
		);
		for (const proposal of pending) {
			if (layer && proposal.layer !== layer) continue;
			push(displayForkName, {
				id: proposal.id,
				title: proposal.title,
				href: proposal.forumLink,
				layer: proposal.layer,
				status: "Candidate",
				lastDiscussedDate: null,
				lastDiscussedCall: null,
				thread: null,
			});
		}
	}

	return [...groups.entries()]
		.map(([forkName, items]) => ({
			forkName: getForkDisplayName(forkName),
			items: items.sort(compareScopeItems),
		}))
		.filter((group) => group.items.length > 0);
};

const scopeItem = (
	proposal: Proposal,
	relationship: ForkRelationship,
	status: ScopeStatus,
	threads: Map<number, EipThread>,
): PendingScopeItem => {
	const latest = relationship.statusHistory.at(-1);

	return {
		id: proposal.id,
		title: getLaymanTitle(proposal),
		href: `/eips/${proposal.id}`,
		layer: getProposalLayer(proposal),
		status,
		lastDiscussedDate: latest?.date ?? null,
		lastDiscussedCall: latest?.call ?? null,
		thread: threads.get(proposal.id) ?? null,
	};
};

const compareScopeItems = (
	a: PendingScopeItem,
	b: PendingScopeItem,
): number => {
	const order: Record<ScopeStatus, number> = {
		Considered: 1,
		Proposed: 2,
		Candidate: 3,
	};
	const status = order[a.status] - order[b.status];
	if (status !== 0) return status;
	return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
};

const recentCallSummaries = (type: SeriesKey): RecentCallSummary[] =>
	callsByType(type)
		.slice(0, 5)
		.map((call) => {
			const artifacts = getCallArtifacts(call);
			if (!artifacts.tldr) return null;
			const decisionCount =
				artifacts.keyDecisions.length || artifacts.tldr.decisions?.length || 0;
			const actionCount = artifacts.tldr.action_items?.length ?? 0;
			const targetCount = artifacts.tldr.targets?.length ?? 0;
			if (decisionCount + actionCount + targetCount === 0) return null;
			return {
				call,
				tldr: artifacts.tldr,
				decisionCount,
				actionCount,
				targetCount,
			};
		})
		.filter((summary): summary is RecentCallSummary => summary !== null);

export const buildAgendaPlans = (
	artifactRoot = defaultArtifactRoot(),
): AgendaPlan[] =>
	callTypes.map((type) => {
		const eipThreads = readJson<EipThreadsData>(
			artifactRoot,
			type,
			"eip_threads.json",
		);
		return {
			type,
			label: type.toUpperCase(),
			seriesName: callTypeNames[type],
			agendaSuggestions: readJson<AgendaSuggestionsData>(
				artifactRoot,
				type,
				"agenda_suggestions.json",
			),
			openActions: readJson<OpenActionItemsData>(
				artifactRoot,
				type,
				"open_action_items.json",
			),
			deferredDecisions: readJson<DeferredDecisionsData>(
				artifactRoot,
				type,
				"deferred_decisions.json",
			),
			eipThreads,
			upcomingCall: upcomingCallForType(type),
			scopeGroups: pendingScopeForSeries(type, eipThreads),
			recentCalls: recentCallSummaries(type),
		};
	});

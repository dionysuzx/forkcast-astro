import fs from "node:fs";
import path from "node:path";
import type { ProtocolCall } from "./call";

export interface TldrData {
	meeting: string;
	highlights?: Record<string, { timestamp: string; highlight: string }[]>;
	action_items?: { timestamp: string; action: string; owner: string }[];
	decisions?: { timestamp: string; decision: string }[];
	targets?: { timestamp: string; target: string }[];
}

export interface KeyDecision {
	original_text: string;
	timestamp: string;
	type: "stage_change" | "devnet_inclusion" | "headliner_selected" | "other";
	eips: number[];
	stage_change?: {
		to:
			| "Proposed"
			| "Considered"
			| "Scheduled"
			| "Included"
			| "Declined"
			| "Withdrawn";
	};
	devnet?: string;
	fork?: string;
	context?: string;
}

export interface CallSyncConfig {
	transcriptStartTime: string | null;
	videoStartTime: string | null;
	description?: string;
}

export interface CallConfig {
	videoUrl?: string;
	issue?: number;
	sync?: CallSyncConfig;
}

export interface CallArtifacts {
	chat: string | null;
	transcript: string | null;
	tldr: TldrData | null;
	keyDecisions: KeyDecision[];
	videoUrl: string | null;
	config: CallConfig | null;
}

const artifactRoot = path.resolve(process.cwd(), "public", "artifacts");

const readText = (filePath: string): string | null =>
	fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

const readJson = <T>(filePath: string): T | null => {
	const text = readText(filePath);
	if (!text) return null;
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
};

export const artifactPathForCall = (call: ProtocolCall): string =>
	path.join(artifactRoot, call.type, `${call.date}_${call.number}`);

export const getCallArtifacts = (call: ProtocolCall): CallArtifacts => {
	const base = artifactPathForCall(call);
	const config = readJson<CallConfig>(path.join(base, "config.json"));
	const videoText = readText(path.join(base, "video.txt"))?.trim() ?? null;
	const keyDecisionEnvelope = readJson<{ key_decisions?: KeyDecision[] }>(
		path.join(base, "key_decisions.json"),
	);

	return {
		chat: readText(path.join(base, "chat.txt")),
		transcript:
			readText(path.join(base, "transcript_corrected.vtt")) ??
			readText(path.join(base, "transcript.vtt")),
		tldr: readJson<TldrData>(path.join(base, "tldr.json")),
		keyDecisions: keyDecisionEnvelope?.key_decisions ?? [],
		videoUrl: config?.videoUrl ?? videoText,
		config,
	};
};

export const getLatestMeetingDecisionSet = (
	calls: ProtocolCall[],
): { call: ProtocolCall; decisions: KeyDecision[] } | null => {
	const acdTypes = new Set(["acdc", "acde", "acdt"]);
	for (const call of calls.filter((entry) => acdTypes.has(entry.type))) {
		const decisions = getCallArtifacts(call).keyDecisions;
		if (decisions.length > 0) return { call, decisions };
	}
	return null;
};

export const listAllDecisions = (
	calls: ProtocolCall[],
): Array<{ call: ProtocolCall; decisions: KeyDecision[] }> =>
	calls
		.map((call) => ({ call, decisions: getCallArtifacts(call).keyDecisions }))
		.filter((entry) => entry.decisions.length > 0);

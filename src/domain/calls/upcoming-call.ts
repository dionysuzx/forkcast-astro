import type { CallType } from "./call";
import snapshot from "./upcoming-calls.snapshot.json";

export interface UpcomingCallSnapshot {
	type: CallType;
	title: string;
	date: string;
	startTimeUtc: string;
	number: string;
	githubUrl: string;
	issueNumber: number;
	agendaItems: string[];
	createdAt: string;
	updatedAt: string;
	youtubeUrl: string | null;
}

export interface UpcomingCallsSnapshot {
	source: string;
	apiSource: string;
	retrievedAt: string;
	calls: UpcomingCallSnapshot[];
}

export const upcomingCallsSnapshot = snapshot as UpcomingCallsSnapshot;

export const upcomingCalls = upcomingCallsSnapshot.calls;

export const upcomingCallForType = (
	type: string,
): UpcomingCallSnapshot | null =>
	upcomingCalls.find((call) => call.type === type) ?? null;

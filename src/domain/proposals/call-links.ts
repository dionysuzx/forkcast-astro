import {
	type CallType,
	callsByType,
	callTypeNames,
	type ProtocolCall,
} from "@/domain/calls/call";
import {
	type UpcomingCallSnapshot,
	upcomingCallForType,
} from "@/domain/calls/upcoming-call";

const proposalCallTypes: Partial<Record<number, CallType>> = {
	7732: "epbs",
	7805: "focil",
	7928: "bal",
};

export interface ProposalCallLink {
	type: CallType;
	seriesName: string;
	latest: ProtocolCall | null;
	upcoming: UpcomingCallSnapshot | null;
}

export const getProposalCallLink = (
	proposalId: number,
): ProposalCallLink | null => {
	const type = proposalCallTypes[proposalId];
	if (!type) return null;

	const latest =
		callsByType(type).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

	return {
		type,
		seriesName: callTypeNames[type],
		latest,
		upcoming: upcomingCallForType(type),
	};
};

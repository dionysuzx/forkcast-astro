import eips from "./eips.json";

export type ProtocolLayer = "EL" | "CL";
export type ProposalPrefix = "EIP" | "RIP";

export interface Champion {
	name: string;
	discord?: string;
	telegram?: string;
	email?: string;
}

export interface ForkRelationship {
	forkName: string;
	statusHistory: Array<{
		status:
			| "Proposed"
			| "Considered"
			| "Scheduled"
			| "Declined"
			| "Included"
			| "Withdrawn";
		call: `${"acdc" | "acde" | "acdt"}/${number}` | null;
		date: string | null;
		timestamp?: number;
	}>;
	isHeadliner?: boolean;
	wasHeadlinerCandidate?: boolean;
	champions?: Champion[];
	presentationHistory?: Array<{
		type:
			| "headliner_proposal"
			| "headliner_presentation"
			| "presentation"
			| "debate";
		call?: `${"acdc" | "acde" | "acdt"}/${number}`;
		link?: string;
		date: string;
		timestamp?: number;
	}>;
}

export interface Proposal {
	id: number;
	title: string;
	status: string;
	description: string;
	author: string;
	type: string;
	category?: string;
	createdDate: string;
	discussionLink?: string;
	reviewer?: string;
	layer?: ProtocolLayer;
	collection?: string;
	specificationUrl?: string;
	forkRelationships: ForkRelationship[];
	laymanDescription?: string;
	northStars?: string[];
	northStarAlignment?: {
		scaleL1?: { impact?: string; description: string };
		scaleBlobs?: { impact?: string; description: string };
		improveUX?: { impact?: string; description: string };
	};
	stakeholderImpacts?: Partial<
		Record<
			| "endUsers"
			| "appDevs"
			| "walletDevs"
			| "toolingInfra"
			| "layer2s"
			| "stakersNodes"
			| "clClients"
			| "elClients",
			{ impact?: string; description: string }
		>
	>;
	benefits?: string[];
	tradeoffs?: string[] | null;
}

export type InclusionStage =
	| "Proposed for Inclusion"
	| "Considered for Inclusion"
	| "Scheduled for Inclusion"
	| "Declined for Inclusion"
	| "Included"
	| "Withdrawn"
	| "Unknown";

export interface ParsedAuthor {
	name: string;
	handle?: string;
}

export const proposals = (eips as Proposal[]).sort((a, b) => a.id - b.id);

export const proposalById = new Map(
	proposals.map((proposal) => [proposal.id, proposal]),
);

export const getProposal = (id: number): Proposal | undefined =>
	proposalById.get(id);

export const getProposalPrefix = (proposal: Proposal): ProposalPrefix =>
	proposal.collection === "RIP" || proposal.title.startsWith("RIP-")
		? "RIP"
		: "EIP";

export const getProposalCode = (proposal: Proposal): string =>
	`${getProposalPrefix(proposal)}-${proposal.id}`;

export const getLaymanTitle = (proposal: Proposal): string =>
	proposal.title.replace(/^(EIP|RIP)-\d+:\s*/, "");

export const getSpecificationUrl = (proposal: Proposal): string => {
	if (proposal.specificationUrl) return proposal.specificationUrl;
	if (getProposalPrefix(proposal) === "RIP") {
		return `https://github.com/ethereum/RIPs/blob/master/RIPS/rip-${proposal.id}.md`;
	}
	return `https://eips.ethereum.org/EIPS/eip-${proposal.id}`;
};

export const getProposalLayer = (proposal: Proposal): ProtocolLayer | null =>
	proposal.layer ?? null;

export const getForkRelationship = (
	proposal: Proposal,
	forkName?: string,
): ForkRelationship | undefined => {
	if (!forkName) return undefined;
	return proposal.forkRelationships.find(
		(fork) => fork.forkName.toLowerCase() === forkName.toLowerCase(),
	);
};

export const getInclusionStage = (
	proposal: Proposal,
	forkName?: string,
): InclusionStage => {
	const fork = getForkRelationship(proposal, forkName);
	if (!fork?.statusHistory.length) return "Unknown";

	const latest = fork.statusHistory[fork.statusHistory.length - 1]?.status;
	switch (latest) {
		case "Proposed":
			return "Proposed for Inclusion";
		case "Considered":
			return "Considered for Inclusion";
		case "Scheduled":
			return "Scheduled for Inclusion";
		case "Declined":
			return "Declined for Inclusion";
		case "Included":
			return "Included";
		case "Withdrawn":
			return "Withdrawn";
		default:
			return "Unknown";
	}
};

export const isHeadliner = (proposal: Proposal, forkName?: string): boolean =>
	Boolean(getForkRelationship(proposal, forkName)?.isHeadliner);

export const isHeadlinerInAnyFork = (proposal: Proposal): boolean =>
	proposal.forkRelationships.some((fork) => fork.isHeadliner);

export const wasHeadlinerCandidate = (
	proposal: Proposal,
	forkName?: string,
): boolean => {
	const fork = getForkRelationship(proposal, forkName);
	if (!fork?.wasHeadlinerCandidate) return false;
	const latestStatus = fork.statusHistory.at(-1)?.status;
	return latestStatus !== "Withdrawn";
};

export const wasHeadlinerCandidateInAnyFork = (proposal: Proposal): boolean => {
	if (isHeadlinerInAnyFork(proposal)) return false;
	return proposal.forkRelationships.some((fork) => {
		const latestStatus = fork.statusHistory.at(-1)?.status;
		return Boolean(fork.wasHeadlinerCandidate && latestStatus !== "Withdrawn");
	});
};

export const latestProposalUpdateTime = (proposal: Proposal): number => {
	let latest = 0;
	for (const fork of proposal.forkRelationships) {
		for (const entry of fork.statusHistory) {
			if (!entry.date) continue;
			const timestamp = Date.parse(entry.date);
			if (Number.isFinite(timestamp)) latest = Math.max(latest, timestamp);
		}
	}
	return latest;
};

export const recentlyUpdatedProposals = (limit: number): Proposal[] =>
	proposals
		.map((proposal) => ({
			proposal,
			updatedAt: latestProposalUpdateTime(proposal),
		}))
		.filter((item) => item.updatedAt > 0)
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.slice(0, limit)
		.map((item) => item.proposal);

export const proposalsForFork = (forkName: string): Proposal[] =>
	proposals.filter((proposal) =>
		proposal.forkRelationships.some(
			(fork) => fork.forkName.toLowerCase() === forkName.toLowerCase(),
		),
	);

export const parseAuthors = (authorString: string): ParsedAuthor[] => {
	if (!authorString) return [];

	return authorString
		.split(/,\s*/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const github = part.match(/^(.+?)\s*\(@([^)]+)\)$/);
			if (github) return { name: github[1].trim(), handle: `@${github[2]}` };

			const email = part.match(/^(.+?)\s*<([^>]+)>$/);
			if (email) return { name: email[1].trim(), handle: email[2] };

			return { name: part };
		});
};

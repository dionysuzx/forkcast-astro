import type { Champion, ProtocolLayer } from "./proposal";

export interface PendingProposal {
	id: string;
	title: string;
	description: string;
	forumLink: string;
	layer: ProtocolLayer;
	champions: Champion[];
	forkName: string;
}

export const pendingProposals: PendingProposal[] = [
	{
		id: "partial-reconstruction-2d-peerdas",
		title: "Partial Reconstruction and 2D PeerDAS",
		description:
			"Enables nodes to participate in data availability sampling without requiring supernode bandwidth. Node operators benefit from lower storage and bandwidth requirements, validators gain resilience against data withholding attacks, and L2s get more reliable blob availability.",
		forumLink:
			"https://ethereum-magicians.org/t/hegota-headliner-partial-reconstruction-and-2d-peerdas/27652",
		layer: "CL",
		champions: [],
		forkName: "Hegota",
	},
];

export const pendingProposalsForFork = (forkName: string): PendingProposal[] =>
	pendingProposals.filter(
		(proposal) => proposal.forkName.toLowerCase() === forkName.toLowerCase(),
	);

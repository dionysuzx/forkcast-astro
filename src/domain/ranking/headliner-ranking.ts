import { pendingProposalsForFork } from "@/domain/proposals/pending-proposal";
import {
	getForkRelationship,
	getLaymanTitle,
	getProposalCode,
	getProposalLayer,
	type ProtocolLayer,
	proposals,
	wasHeadlinerCandidate,
} from "@/domain/proposals/proposal";

export type RankingTierId = "S" | "A" | "B" | "C" | "D";

export interface RankingTier {
	id: RankingTierId;
	name: RankingTierId;
	textClass: string;
	bandClass: string;
	rowClass: string;
	bandColor: string;
	rowColor: string;
}

export interface RankableProposal {
	id: string;
	source: "proposal" | "pending";
	displayId: string;
	href: string;
	title: string;
	description: string;
	layer: ProtocolLayer;
	author?: string;
	champions: string[];
}

export const rankingTiers: RankingTier[] = [
	{
		id: "S",
		name: "S",
		textClass: "text-slate-900",
		bandClass: "bg-[#f87171]",
		rowClass: "bg-red-100",
		bandColor: "#f87171",
		rowColor: "#fee2e2",
	},
	{
		id: "A",
		name: "A",
		textClass: "text-slate-900",
		bandClass: "bg-amber-300",
		rowClass: "bg-amber-100",
		bandColor: "#fbbf24",
		rowColor: "#fef9c3",
	},
	{
		id: "B",
		name: "B",
		textClass: "text-slate-900",
		bandClass: "bg-yellow-200",
		rowClass: "bg-yellow-50",
		bandColor: "#fde68a",
		rowColor: "#fefce8",
	},
	{
		id: "C",
		name: "C",
		textClass: "text-slate-900",
		bandClass: "bg-green-300",
		rowClass: "bg-green-100",
		bandColor: "#7af2a8",
		rowColor: "#d1fae5",
	},
	{
		id: "D",
		name: "D",
		textClass: "text-slate-900",
		bandClass: "bg-sky-300",
		rowClass: "bg-sky-100",
		bandColor: "#73d4ff",
		rowColor: "#e0f2fe",
	},
];

export const hegotaHeadlinerRankables = (): RankableProposal[] => {
	const proposalItems = proposals
		.filter((proposal) => wasHeadlinerCandidate(proposal, "Hegota"))
		.map((proposal): RankableProposal => {
			const relationship = getForkRelationship(proposal, "Hegota");
			const layer = getProposalLayer(proposal);
			if (!layer) {
				throw new Error(
					`Hegota rankable proposal ${proposal.id} is missing a layer`,
				);
			}

			return {
				id: `eip-${proposal.id}`,
				source: "proposal",
				displayId: getProposalCode(proposal),
				href: `/eips/${proposal.id}`,
				title: getLaymanTitle(proposal),
				description: proposal.laymanDescription || proposal.description,
				layer,
				author: proposal.author,
				champions:
					relationship?.champions
						?.map((champion) => champion.name)
						.filter(Boolean) ?? [],
			};
		});

	const pendingItems = pendingProposalsForFork("Hegota").map(
		(proposal): RankableProposal => ({
			id: `pending-${proposal.id}`,
			source: "pending",
			displayId: "Pending",
			href: proposal.forumLink,
			title: proposal.title,
			description: proposal.description,
			layer: proposal.layer,
			champions: proposal.champions.map((champion) => champion.name),
		}),
	);

	return [...proposalItems, ...pendingItems];
};

export const cleanAuthorName = (author: string): string =>
	author
		.replace(/\([^)]*\)/g, "")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.replace(/\s*,\s*/g, ", ")
		.replace(/,\s*,/g, ",")
		.replace(/,\s*$/g, "")
		.trim();

export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
};

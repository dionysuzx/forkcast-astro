import { getForkDisplayName } from "@/domain/upgrades/upgrade";
import {
	getLaymanTitle,
	getProposalCode,
	getProposalLayer,
	type Proposal,
	type ProtocolLayer,
	proposals,
} from "./proposal";

export interface ProposalSearchDocument {
	id: number;
	code: string;
	title: string;
	description: string;
	author: string;
	layer: ProtocolLayer | null;
	latestFork: string | null;
	latestForkDisplay: string | null;
	latestStatus: string | null;
	forks: string[];
	forkStatuses: string[];
	benefits: string;
	northStars: string;
	searchText: string;
}

export interface ProposalSearchIndex {
	documents: ProposalSearchDocument[];
	forks: Array<{ name: string; displayName: string }>;
	statuses: string[];
	layers: ProtocolLayer[];
}

const normalized = (value: string): string => value.trim().toLowerCase();

const compactSearchText = (parts: Array<string | null | undefined>): string =>
	parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(" ")
		.toLowerCase();

export const buildProposalSearchDocument = (
	proposal: Proposal,
): ProposalSearchDocument => {
	const latestFork = proposal.forkRelationships.at(-1) ?? null;
	const latestStatus = latestFork?.statusHistory.at(-1)?.status ?? null;
	const forks = proposal.forkRelationships.map((fork) => fork.forkName);
	const forkStatuses = Array.from(
		new Set(
			proposal.forkRelationships.flatMap((fork) =>
				fork.statusHistory.map((entry) => entry.status),
			),
		),
	);
	const benefits = proposal.benefits?.join(" ") ?? "";
	const northStars =
		proposal.northStars?.join(" ") ??
		Object.values(proposal.northStarAlignment ?? {})
			.map((entry) => entry?.description)
			.filter(Boolean)
			.join(" ");

	const document: Omit<ProposalSearchDocument, "searchText"> = {
		id: proposal.id,
		code: getProposalCode(proposal),
		title: getLaymanTitle(proposal),
		description: proposal.laymanDescription || proposal.description,
		author: proposal.author,
		layer: getProposalLayer(proposal),
		latestFork: latestFork?.forkName ?? null,
		latestForkDisplay: latestFork
			? getForkDisplayName(latestFork.forkName)
			: null,
		latestStatus,
		forks,
		forkStatuses,
		benefits,
		northStars,
	};

	return {
		...document,
		searchText: compactSearchText([
			document.code,
			String(document.id),
			document.title,
			document.description,
			document.author,
			document.layer,
			document.latestFork,
			document.latestForkDisplay,
			document.latestStatus,
			document.benefits,
			document.northStars,
			...document.forks,
			...document.forkStatuses,
		]),
	};
};

export const buildProposalSearchIndex = (
	source: Proposal[] = proposals,
): ProposalSearchIndex => {
	const documents = source.map(buildProposalSearchDocument);
	const forks = Array.from(
		new Map(
			source
				.flatMap((proposal) => proposal.forkRelationships)
				.map((fork) => [
					normalized(fork.forkName),
					{
						name: fork.forkName,
						displayName: getForkDisplayName(fork.forkName),
					},
				]),
		).values(),
	).sort((a, b) => a.displayName.localeCompare(b.displayName));

	const statuses = Array.from(
		new Set(
			source.flatMap((proposal) =>
				proposal.forkRelationships.flatMap((fork) =>
					fork.statusHistory.map((entry) => entry.status),
				),
			),
		),
	).sort();

	const layers = Array.from(
		new Set(source.map(getProposalLayer).filter(Boolean)),
	).sort() as ProtocolLayer[];

	return { documents, forks, statuses, layers };
};

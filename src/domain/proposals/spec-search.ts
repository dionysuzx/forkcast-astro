import fs from "node:fs";
import path from "node:path";
import { proposalById } from "./proposal";

export interface ProposalSpecSearchIndex {
	terms: Record<string, number[]>;
}

const stripMarkdown = (markdown: string): string =>
	markdown
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]+`/g, " ")
		.replace(/!\[[^\]]*]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
		.replace(/<[^>]+>/g, " ")
		.replace(/^[-*_]{3,}\s*$/gm, " ")
		.replace(/^>\s+/gm, "")
		.replace(/^[\s]*[-*+]\s+/gm, "")
		.replace(/^[\s]*\d+\.\s+/gm, "")
		.replace(/\|?[-:]+[-|:]+\|?/g, " ")
		.replace(/\|/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const tokenize = (text: string): string[] =>
	text
		.toLowerCase()
		.replace(/[^\w\s]/g, " ")
		.split(/\s+/)
		.filter((token) => token.length > 1);

const readSpecIds = (directory: string): number[] =>
	fs
		.readdirSync(directory)
		.filter((file) => file.endsWith(".md"))
		.map((file) => Number.parseInt(file.replace(".md", ""), 10))
		.filter((id) => Number.isFinite(id))
		.sort((a, b) => a - b);

export const buildProposalSpecSearchIndex = (
	specDirectory = path.resolve(process.cwd(), "src", "content", "eip-specs"),
): ProposalSpecSearchIndex => {
	if (!fs.existsSync(specDirectory)) return { terms: {} };

	const terms = new Map<string, number[]>();

	for (const id of readSpecIds(specDirectory)) {
		const proposal = proposalById.get(id);
		if (proposal?.status === "Moved") continue;

		const markdown = fs.readFileSync(
			path.join(specDirectory, `${id}.md`),
			"utf8",
		);
		const tokens = new Set(tokenize(stripMarkdown(markdown)));

		for (const token of tokens) {
			const ids = terms.get(token);
			if (ids) ids.push(id);
			else terms.set(token, [id]);
		}
	}

	return {
		terms: Object.fromEntries(
			Array.from(terms.entries()).sort(([left], [right]) =>
				left.localeCompare(right),
			),
		),
	};
};

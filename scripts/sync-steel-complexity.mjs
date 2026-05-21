import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const githubDirectoryUrl =
	"https://api.github.com/repos/ethsteel/pm/contents/complexity_assessments/EIPs";
const rawContentBase =
	"https://raw.githubusercontent.com/ethsteel/pm/main/complexity_assessments/EIPs";
const outputPath = resolve(
	"src/domain/test-complexity/steel-complexity.snapshot.json",
);

const parseScore = (scoreText) => {
	const trimmed = scoreText.trim();
	if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "–") {
		return 0;
	}

	if (trimmed.includes("+")) {
		return trimmed
			.split("+")
			.map((part) => Number.parseInt(part.trim(), 10))
			.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
	}

	const value = Number.parseInt(trimmed, 10);
	return Number.isFinite(value) ? value : 0;
};

const parseAnchors = (markdown) => {
	const checklist = markdown.match(
		/### Checklist[\s\S]*?\|[\s\S]*?(?=\n\n|\*\*Total|\n###|\n##|$)/i,
	);
	if (!checklist) return [];

	const anchors = [];
	const rowPattern =
		/\|\s*\*?\*?([^|*]+)\*?\*?\s*\|\s*([^|]*?)\s*\|\s*([^|]*)\|/g;

	for (const match of checklist[0].matchAll(rowPattern)) {
		const name = match[1].trim();
		if (name.toLowerCase() === "anchor" || name.includes("---")) continue;

		anchors.push({
			name,
			score: parseScore(match[2]),
			notes: match[3].trim() || undefined,
		});
	}

	return anchors;
};

const parseTotalScore = (markdown, anchors) => {
	const finalAssessment = markdown.match(
		/\*\*Total Score\*\*[^|]*\|[^|]*\|\s*[*`]*(\d+)[*`]*\s*\|/i,
	);
	if (finalAssessment) return Number.parseInt(finalAssessment[1], 10);

	const boldTotal = markdown.match(/\*\*Total[:\s]*(\d+)\*\*/i);
	if (boldTotal) return Number.parseInt(boldTotal[1], 10);

	const trailingBoldTotal = markdown.match(/\*\*Total:?\*\*\s*(\d+)/i);
	if (trailingBoldTotal) return Number.parseInt(trailingBoldTotal[1], 10);

	const plainTotal = markdown.match(/^Total:?\s*(\d+)/im);
	if (plainTotal) return Number.parseInt(plainTotal[1], 10);

	return anchors.reduce((sum, anchor) => sum + anchor.score, 0);
};

const tierFromScore = (score) => {
	if (score < 10) return "Low";
	if (score < 20) return "Medium";
	return "High";
};

const parseTier = (markdown, totalScore) => {
	const tierRow = markdown.match(
		/\*\*Complexity Tier\*\*[^|]*\|[^|]*\|\s*(.+?)\s*\|/,
	);
	if (!tierRow) return tierFromScore(totalScore);

	const value = tierRow[1].trim();
	if (value.includes("🟢")) return "Low";
	if (value.includes("🟡")) return "Medium";
	if (value.includes("🔴")) return "High";
	return tierFromScore(totalScore);
};

const fetchJson = async (url) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.json();
};

const fetchText = async (url) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.text();
};

const parseAssessment = (eipNumber, markdown) => {
	const anchors = parseAnchors(markdown);
	const totalScore = parseTotalScore(markdown, anchors);

	return {
		eipNumber,
		totalScore,
		tier: parseTier(markdown, totalScore),
		anchors,
		assessmentUrl: `https://github.com/ethsteel/pm/blob/main/complexity_assessments/EIPs/EIP-${eipNumber}.md`,
	};
};

const run = async () => {
	const files = await fetchJson(githubDirectoryUrl);
	const eipNumbers = files
		.map((file) => file.name.match(/^EIP-(\d+)\.md$/)?.[1])
		.filter(Boolean)
		.map((id) => Number.parseInt(id, 10))
		.sort((a, b) => a - b);

	const assessments = [];
	const batchSize = 5;

	for (let start = 0; start < eipNumbers.length; start += batchSize) {
		const batch = eipNumbers.slice(start, start + batchSize);
		const parsed = await Promise.all(
			batch.map(async (eipNumber) => {
				const markdown = await fetchText(
					`${rawContentBase}/EIP-${eipNumber}.md`,
				);
				return parseAssessment(eipNumber, markdown);
			}),
		);
		assessments.push(...parsed);
	}

	const snapshot = {
		source:
			"https://github.com/ethsteel/pm/tree/main/complexity_assessments/EIPs",
		retrievedAt: new Date().toISOString().slice(0, 10),
		assessments,
	};

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(snapshot, null, "\t")}\n`);

	console.log(
		`Wrote ${assessments.length} STEEL complexity assessments to ${outputPath}`,
	);
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const issuesUrl =
	"https://api.github.com/repos/ethereum/pm/issues?state=open&per_page=100";
const outputPath = resolve("src/domain/calls/upcoming-calls.snapshot.json");

const callSeriesToType = {
	"all core devs - consensus": "acdc",
	"all core devs - execution": "acde",
	"all core devs - testing": "acdt",
	"all wallet devs": "awd",
	"pq interop": "pqi",
	"pq transaction signatures": "pqts",
	"l1-zkevm breakout": "zkevm",
	"fast confirmation rule": "fcr",
	"rpc standards": "rpc",
	"focil breakout": "focil",
	"eip-7732 breakout room": "epbs",
	"eip-7928 breakout room": "bal",
};

const utcDateTimeSection =
	/### UTC Date & Time[\s\S]{0,300}?([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}),\s*(\d{1,2}):(\d{2})\s*UTC/i;
const callSeriesSection = /### Call Series\s*\n\s*\n([^\n\r]+)/i;
const agendaSection =
	/### Agenda\s*([\s\S]*?)(?=\n### |\n## Metadata|\n## |$)/i;

const fetchJson = async (url) => {
	const response = await fetch(url, {
		headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "forkcast-astro-upcoming-calls",
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.json();
};

const normalizeCallSeries = (series) =>
	series.trim().toLowerCase().replace(/\s+/g, " ");

const parseCallDate = (dateString) => {
	const match = dateString.match(/([A-Za-z]+\s+\d{1,2},\s*\d{4})/);
	const parsed = new Date(match ? match[1] : dateString.trim());
	if (Number.isNaN(parsed.getTime())) return null;

	return [
		parsed.getFullYear(),
		String(parsed.getMonth() + 1).padStart(2, "0"),
		String(parsed.getDate()).padStart(2, "0"),
	].join("-");
};

const normalizeUtcTime = (hours, minutes) =>
	`${String(Number(hours)).padStart(2, "0")}:${minutes}`;

const resolveSchedule = (body) => {
	const match = body?.match(utcDateTimeSection);
	if (!match) return null;

	const date = parseCallDate(match[1]);
	if (!date) return null;

	const startTimeUtc = `${date}T${normalizeUtcTime(match[2], match[3])}:00Z`;
	return { date, startTimeUtc };
};

const resolveTypeFromTitle = (title) => {
	if (/\(ACDC\)/i.test(title)) return "acdc";
	if (/\(ACDE\)/i.test(title)) return "acde";
	if (/\(ACDT\)/i.test(title)) return "acdt";
	if (/EIP-7732|ePBS/i.test(title)) return "epbs";
	if (/EIP-7928|Block Access List|\bBAL\b/i.test(title)) return "bal";
	if (/FOCIL/i.test(title)) return "focil";
	if (/RPC Standards/i.test(title)) return "rpc";
	if (/L1-zkEVM/i.test(title)) return "zkevm";
	if (/\(PQTS\)|Post Quantum transaction signature/i.test(title)) return "pqts";
	if (/(?:Post-Quantum\s*\(PQ\)|PQ)\s*Interop/i.test(title)) return "pqi";
	if (/Fast Confirmation Rule|\(FCR\)/i.test(title)) return "fcr";
	if (/All\s*Wallet\s*Devs|AllWalletDevs/i.test(title)) return "awd";
	if (/Native Account Abstraction|\(AA\)/i.test(title)) return "aa";
	return null;
};

const resolveType = (title, body) => {
	const series = body?.match(callSeriesSection)?.[1];
	if (series) {
		const type = callSeriesToType[normalizeCallSeries(series)];
		if (type) return type;
	}

	return resolveTypeFromTitle(title);
};

const resolveNumber = (title) => {
	const match = title.match(/#\s*(\d+)/);
	return match ? match[1].padStart(3, "0") : null;
};

const parseAgendaItems = (body) => {
	const match = body?.match(agendaSection);
	if (!match) return [];

	return match[1]
		.split(/\r?\n/)
		.map((line) =>
			line
				.trim()
				.replace(/^#{1,6}\s*/, "")
				.replace(/^[-*]\s+/, "")
				.replace(/^\d+\.\s+/, "")
				.trim(),
		)
		.filter((line) => line && !line.startsWith("[Input]"))
		.filter((line) => line.toLowerCase() !== "agenda")
		.slice(0, 14);
};

const extractYoutubeUrl = (comments) => {
	for (const comment of comments) {
		const match = comment.body?.match(
			/YouTube Live.*?\[.*?]\((https?:\/\/[^\s)]+)\)/i,
		);
		if (match) return match[1];
	}
	return null;
};

const isRelevant = (call, now = new Date()) => {
	const today = now.toISOString().slice(0, 10);
	return call.date >= today;
};

const parseIssue = (issue) => {
	const schedule = resolveSchedule(issue.body ?? "");
	const type = resolveType(issue.title, issue.body ?? "");
	const number = resolveNumber(issue.title);
	if (!schedule || !type || !number) return null;

	return {
		type,
		title: issue.title.trim(),
		date: schedule.date,
		startTimeUtc: schedule.startTimeUtc,
		number,
		githubUrl: issue.html_url,
		issueNumber: issue.number,
		agendaItems: parseAgendaItems(issue.body ?? ""),
		createdAt: issue.created_at,
		updatedAt: issue.updated_at,
	};
};

const run = async () => {
	const issues = await fetchJson(issuesUrl);
	const parsed = issues
		.map(parseIssue)
		.filter((call) => call && isRelevant(call))
		.sort(
			(a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type),
		);

	const latestByType = new Map();
	for (const call of parsed) {
		if (!latestByType.has(call.type)) latestByType.set(call.type, call);
	}

	const commentsByIssue = await Promise.all(
		[...latestByType.values()].map(async (call) => {
			const comments = await fetchJson(
				`https://api.github.com/repos/ethereum/pm/issues/${call.issueNumber}/comments`,
			);
			return [call.issueNumber, comments];
		}),
	);
	const comments = new Map(commentsByIssue);

	const calls = [...latestByType.values()]
		.map((call) => ({
			...call,
			youtubeUrl: extractYoutubeUrl(comments.get(call.issueNumber) ?? []),
		}))
		.sort(
			(a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type),
		);

	const snapshot = {
		source: "https://github.com/ethereum/pm/issues?q=is%3Aissue+is%3Aopen",
		apiSource: issuesUrl,
		retrievedAt: new Date().toISOString(),
		calls,
	};

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(snapshot, null, "\t")}\n`);

	console.log(`Wrote ${calls.length} upcoming calls to ${outputPath}`);
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

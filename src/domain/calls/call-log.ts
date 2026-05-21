export interface TranscriptEntry {
	timestamp: string;
	seconds: number;
	fragment: string;
	text: string;
}

export interface ChatEntry {
	timestamp: string;
	seconds: number;
	fragment: string;
	speaker: string;
	message: string;
}

export const timestampToSeconds = (timestamp: string): number => {
	const parts = timestamp.split(":").map((part) => Number.parseInt(part, 10));
	if (parts.some((part) => !Number.isFinite(part))) return 0;
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
	if (parts.length === 2) return parts[0] * 60 + parts[1];
	return parts[0] ?? 0;
};

export const secondsToTimestamp = (seconds: number): string => {
	const safeSeconds = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const remainingSeconds = safeSeconds % 60;
	return [hours, minutes, remainingSeconds]
		.map((part) => String(part).padStart(2, "0"))
		.join(":");
};

export const timestampFragment = (
	kind: "transcript" | "chat",
	timestamp: string,
): string => `${kind}-${timestamp.replaceAll(":", "-")}`;

const isReactionMessage = (message: string): boolean =>
	message.startsWith("Reacted to") ||
	message.startsWith("Heeft gereageerd op") ||
	/^add\s+\S+/i.test(message);

export const parseTranscript = (content: string | null): TranscriptEntry[] => {
	if (!content) return [];
	const lines = content.split(/\r?\n/).map((line) => line.trim());
	const entries: TranscriptEntry[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.includes("-->")) continue;

		const timestamp =
			line
				.split("-->")[0]
				?.trim()
				.replace(/\.\d+$/, "") ?? "";
		const textLines: string[] = [];
		index += 1;

		while (index < lines.length && !lines[index].includes("-->")) {
			if (lines[index] && !/^\d+$/.test(lines[index])) {
				textLines.push(lines[index]);
			}
			index += 1;
		}

		index -= 1;
		const text = textLines.join(" ").replace(/<[^>]+>/g, "");
		if (!timestamp || !text) continue;

		entries.push({
			timestamp,
			seconds: timestampToSeconds(timestamp),
			fragment: timestampFragment("transcript", timestamp),
			text,
		});
	}

	return entries;
};

export const parseChatLog = (content: string | null): ChatEntry[] => {
	if (!content) return [];
	const entries: ChatEntry[] = [];
	let current: Omit<ChatEntry, "fragment" | "seconds"> | null = null;

	const flush = () => {
		if (!current) return;
		const message = current.message.trim();
		if (!message || isReactionMessage(message)) return;
		entries.push({
			...current,
			seconds: timestampToSeconds(current.timestamp),
			fragment: timestampFragment("chat", current.timestamp),
			message,
		});
	};

	for (const line of content.split(/\r?\n/)) {
		const match = line.match(/^(\d{2}:\d{2}:\d{2})\t(.+?):\t?(.*)$/);
		if (match) {
			flush();
			current = {
				timestamp: match[1],
				speaker: match[2],
				message: match[3] ?? "",
			};
			continue;
		}

		if (current) {
			current = {
				...current,
				message: `${current.message}${current.message ? "\n" : ""}${line}`,
			};
		}
	}

	flush();
	return entries;
};

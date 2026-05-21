import fs from "node:fs";
import path from "node:path";
import { type ChatEntry, parseChatLog } from "@/domain/calls/call-log";
import {
	type Breakout,
	breakoutLabels,
	breakouts,
} from "@/domain/protocol-events/breakouts";

export interface BreakoutArtifacts {
	breakout: Breakout;
	label: string;
	chatEntries: ChatEntry[];
}

const artifactRoot = () => path.resolve(process.cwd(), "public", "artifacts");

const readText = (relativePath: string): string | null => {
	const filePath = path.join(artifactRoot(), relativePath);
	if (!fs.existsSync(filePath)) return null;
	return fs.readFileSync(filePath, "utf8");
};

export const breakoutArtifactsForCall = (
	callPath: string,
): BreakoutArtifacts[] =>
	breakouts
		.filter((breakout) => breakout.parentPath === callPath)
		.map((breakout) => ({
			breakout,
			label: breakoutLabels[breakout.kind],
			chatEntries: parseChatLog(
				readText(path.join(breakout.artifactDir, "chat.txt")),
			),
		}));

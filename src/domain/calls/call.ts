import generatedCalls from "./protocol-calls.generated.json";

export type CallType =
	| "acdc"
	| "acde"
	| "acdt"
	| "epbs"
	| "bal"
	| "focil"
	| "price"
	| "tli"
	| "pqts"
	| "rpc"
	| "zkevm"
	| "etm"
	| "awd"
	| "pqi"
	| "fcr"
	| "aa";

export interface ProtocolCall {
	type: string;
	date: string;
	number: string;
	path: string;
	name?: string;
	issue?: number;
}

export const callTypeNames: Record<CallType, string> = {
	acdc: "AllCoreDevs - Consensus",
	acde: "AllCoreDevs - Execution",
	acdt: "AllCoreDevs - Testing",
	epbs: "ePBS Breakout",
	bal: "BAL Breakout",
	focil: "FOCIL Breakout",
	price: "Glamsterdam Repricings",
	tli: "Trustless Log Index",
	pqts: "Post Quantum Transaction Signatures",
	rpc: "RPC Standards",
	zkevm: "L1-zkEVM Breakout",
	etm: "Encrypt The Mempool",
	awd: "AllWalletDevs",
	pqi: "PQ Interop",
	fcr: "Fast Confirmation Rule",
	aa: "Native Account Abstraction",
};

export const protocolCalls = (generatedCalls as ProtocolCall[]).sort((a, b) =>
	b.date.localeCompare(a.date),
);

export const callByPath = new Map(
	protocolCalls.map((call) => [call.path, call]),
);
export const callByIssue = new Map(
	protocolCalls.flatMap((call) =>
		call.issue ? [[String(call.issue), call] as const] : [],
	),
);

export const isOneOffCall = (type: string): boolean =>
	type.startsWith("one-off-");

export const getCallDisplayName = (call: ProtocolCall): string =>
	call.name ?? callTypeNames[call.type as CallType] ?? call.type;

export const getCallTitle = (call: ProtocolCall): string =>
	call.name ?? `${getCallDisplayName(call)} #${call.number}`;

export const recentProtocolCalls = (limit: number): ProtocolCall[] =>
	protocolCalls.slice(0, limit);

export const callTypes = Array.from(
	new Set(protocolCalls.map((call) => call.type)),
).sort((a, b) =>
	(callTypeNames[a as CallType] ?? a).localeCompare(
		callTypeNames[b as CallType] ?? b,
	),
);

export const callsByType = (type: string): ProtocolCall[] =>
	protocolCalls
		.filter((call) => call.type === type)
		.sort(
			(a, b) => Number.parseInt(b.number, 10) - Number.parseInt(a.number, 10),
		);

export const getCallNeighbors = (
	call: ProtocolCall,
): { previous: ProtocolCall | null; next: ProtocolCall | null } => {
	const series = callsByType(call.type).sort(
		(a, b) => Number.parseInt(a.number, 10) - Number.parseInt(b.number, 10),
	);
	const index = series.findIndex((entry) => entry.path === call.path);
	return {
		previous: index > 0 ? series[index - 1] : null,
		next: index >= 0 && index < series.length - 1 ? series[index + 1] : null,
	};
};

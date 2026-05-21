import snapshot from "@/domain/devnets/active-networks.snapshot.json";

export interface DevnetNetworkSnapshot {
	source: string;
	retrievedAt: string;
	activeNetworkIds: string[];
}

const data = snapshot as DevnetNetworkSnapshot;

export const activeDevnetIds = (): Set<string> =>
	new Set(data.activeNetworkIds);

export const devnetNetworkSnapshotRetrievedAt = (): string => data.retrievedAt;

export const devnetNetworkSnapshotSource = (): string => data.source;

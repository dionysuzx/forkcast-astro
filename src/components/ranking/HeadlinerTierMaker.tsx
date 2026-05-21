import {
	ArrowLeft,
	ChevronDown,
	Download,
	Info,
	RotateCcw,
	X,
} from "lucide-react";
import type {
	DragEvent,
	KeyboardEvent,
	MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect, useMemo, useState } from "react";
import type { ProtocolLayer } from "@/domain/proposals/proposal";
import {
	cleanAuthorName,
	type RankableProposal,
	type RankingTier,
	type RankingTierId,
	rankingTiers,
	truncateText,
} from "@/domain/ranking/headliner-ranking";

interface HeadlinerTierMakerProps {
	proposals: RankableProposal[];
}

type RankingItem = RankableProposal & {
	tier: RankingTierId | null;
};

interface SavedRanking {
	id: string;
	tier: RankingTierId | null;
}

const storageKey = "hegota-rankings";
const layerOrder: ProtocolLayer[] = ["EL", "CL"];

const layerLabel = (layer: ProtocolLayer): string =>
	layer === "EL" ? "Execution Layer" : "Consensus Layer";

const layerBadgeClass = (layer: ProtocolLayer): string =>
	layer === "EL"
		? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
		: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300";

const tierIds = new Set<RankingTierId>(["S", "A", "B", "C", "D"]);

const isRankingTierId = (value: unknown): value is RankingTierId =>
	typeof value === "string" && tierIds.has(value as RankingTierId);

const toRankingItems = (proposals: RankableProposal[]): RankingItem[] =>
	proposals.map((proposal) => ({ ...proposal, tier: null }));

const savedRankingsFromStorage = (): SavedRanking[] => {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((item): SavedRanking | null => {
				if (
					typeof item !== "object" ||
					item === null ||
					!("id" in item) ||
					typeof item.id !== "string"
				) {
					return null;
				}

				if (!("tier" in item) || item.tier === null) {
					return { id: item.id, tier: null };
				}

				return isRankingTierId(item.tier)
					? { id: item.id, tier: item.tier }
					: null;
			})
			.filter((item): item is SavedRanking => item !== null);
	} catch {
		return [];
	}
};

const mergeSavedRankings = (items: RankingItem[]): RankingItem[] => {
	const saved = savedRankingsFromStorage();
	if (saved.length === 0) return items;
	const savedById = new Map(saved.map((item) => [item.id, item.tier]));
	return items.map((item) => ({
		...item,
		tier: savedById.has(item.id) ? (savedById.get(item.id) ?? null) : item.tier,
	}));
};

const groupedUnassignedItems = (
	items: RankingItem[],
): Array<[ProtocolLayer, RankingItem[]]> => {
	const groups = new Map<ProtocolLayer, RankingItem[]>();
	for (const layer of layerOrder) groups.set(layer, []);

	for (const item of items) {
		if (item.tier !== null) continue;
		groups.get(item.layer)?.push(item);
	}

	return layerOrder
		.map((layer): [ProtocolLayer, RankingItem[]] => [
			layer,
			groups.get(layer) ?? [],
		])
		.filter(([, layerItems]) => layerItems.length > 0);
};

const groupedLayerIds = (items: RankingItem[]): Set<ProtocolLayer> =>
	new Set(groupedUnassignedItems(items).map(([layer]) => layer));

const itemCountForLayer = (
	items: RankingItem[],
	layer: ProtocolLayer,
): number => items.filter((item) => item.layer === layer).length;

const itemsInTier = (
	items: RankingItem[],
	tierId: RankingTierId,
): RankingItem[] => items.filter((item) => item.tier === tierId);

const hasRankedItems = (items: RankingItem[]): boolean =>
	items.some((item) => item.tier !== null);

const fillRoundedRect = (
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) => {
	context.beginPath();
	context.moveTo(x + radius, y);
	context.lineTo(x + width - radius, y);
	context.quadraticCurveTo(x + width, y, x + width, y + radius);
	context.lineTo(x + width, y + height - radius);
	context.quadraticCurveTo(
		x + width,
		y + height,
		x + width - radius,
		y + height,
	);
	context.lineTo(x + radius, y + height);
	context.quadraticCurveTo(x, y + height, x, y + height - radius);
	context.lineTo(x, y + radius);
	context.quadraticCurveTo(x, y, x + radius, y);
	context.closePath();
	context.fill();
	context.stroke();
};

const drawRankedCard = (
	context: CanvasRenderingContext2D,
	item: RankingItem,
	x: number,
	y: number,
	width: number,
	height: number,
	scale: number,
) => {
	const radius = 12 * scale;

	context.save();
	context.fillStyle = "#fff";
	context.strokeStyle = "#e5e7eb";
	context.lineWidth = scale;
	context.shadowColor = "rgba(0,0,0,0.10)";
	context.shadowBlur = 3 * scale;
	context.shadowOffsetY = scale;
	fillRoundedRect(context, x, y, width, height, radius);
	context.restore();

	const centerY = y + height / 2;
	let cursorX = x + 8 * scale;

	context.save();
	context.font = `bold ${13 * scale}px "SF Mono", Monaco, Consolas, monospace`;
	context.fillStyle = "#64748b";
	context.textAlign = "left";
	context.textBaseline = "middle";
	context.fillText(item.displayId, cursorX, centerY);
	cursorX += context.measureText(item.displayId).width + 6 * scale;
	context.restore();

	context.save();
	context.font = `bold ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	const badgeWidth = 28 * scale;
	const badgeHeight = 18 * scale;
	context.fillStyle = item.layer === "EL" ? "#e0e7ff" : "#ccfbf1";
	context.fillRect(cursorX, centerY - badgeHeight / 2, badgeWidth, badgeHeight);
	context.fillStyle = item.layer === "EL" ? "#4338ca" : "#0f766e";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(item.layer, cursorX + badgeWidth / 2, centerY);
	cursorX += badgeWidth + 8 * scale;
	context.restore();

	context.save();
	context.font = `bold ${15 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	context.fillStyle = "#18181b";
	context.textAlign = "left";
	context.textBaseline = "middle";
	const maxWidth = width - (cursorX - x) - 8 * scale;
	let title = item.title;
	while (title.length > 4 && context.measureText(title).width > maxWidth) {
		title = title.slice(0, -1);
	}
	if (title.length < item.title.length) title = `${title.slice(0, -3)}...`;
	context.fillText(title, cursorX, centerY);
	context.restore();
};

const downloadRankingsImage = (items: RankingItem[]) => {
	const rankedItems = items.filter((item) => item.tier !== null);
	if (rankedItems.length === 0) {
		window.alert(
			"Please rank at least one proposal before generating an image.",
		);
		return;
	}

	const scale = 2;
	const canvasWidth = 720 * scale;
	const cardHeight = 36 * scale;
	const cardGap = 6 * scale;
	const columnGap = 6 * scale;
	const headerHeight = 6 * scale;
	const footerHeight = 54 * scale;
	const canvasHeight =
		headerHeight +
		footerHeight +
		rankingTiers.reduce((height, tier) => {
			const count = itemsInTier(items, tier.id).length;
			const rows = Math.max(1, Math.ceil(count / 2));
			return height + rows * (cardHeight + cardGap);
		}, 0);

	const canvas = document.createElement("canvas");
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	const context = canvas.getContext("2d");
	if (!context) return;

	context.fillStyle = "#1e293b";
	context.fillRect(0, 0, canvas.width, canvas.height);

	const bandWidth = 50 * scale;
	const leftPad = bandWidth + 8 * scale;
	const availableWidth = canvasWidth - leftPad - 4 * scale;
	const cardWidth = (availableWidth - columnGap) / 2;
	let y = headerHeight;

	for (const tier of rankingTiers) {
		const tierItems = itemsInTier(items, tier.id);
		const rows = Math.max(1, Math.ceil(tierItems.length / 2));
		const tierHeight = rows * (cardHeight + cardGap);

		context.save();
		context.fillStyle = tier.rowColor;
		context.fillRect(4 * scale, y, canvasWidth - 4 * scale, tierHeight);
		context.fillStyle = tier.bandColor;
		context.fillRect(0, y, bandWidth, tierHeight);
		context.fillStyle = "#18181b";
		context.font = `${24 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(tier.id, bandWidth / 2, y + tierHeight / 2);
		context.restore();

		for (const item of tierItems) {
			const index = tierItems.indexOf(item);
			const row = Math.floor(index / 2);
			const column = index % 2;
			drawRankedCard(
				context,
				item,
				leftPad + column * (cardWidth + columnGap),
				y + row * (cardHeight + cardGap) + cardGap / 2,
				cardWidth,
				cardHeight,
				scale,
			);
		}

		y += tierHeight;
	}

	const dateStamp = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
	const footerY1 = canvas.height - 36 * scale;
	const footerY2 = canvas.height - 18 * scale;

	context.save();
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = `${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	context.fillStyle = "#f1f5f9";
	context.fillText(
		`Hegota Headliner Rankings • ${dateStamp}`,
		canvas.width / 2,
		footerY1,
	);
	context.fillStyle = "#94a3b8";
	context.fillText(
		"Make your own at forkcast.org/rank",
		canvas.width / 2,
		footerY2,
	);
	context.restore();

	canvas.toBlob((blob) => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "hegota-headliner-rankings.png";
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	});
};

export const HeadlinerTierMaker = ({ proposals }: HeadlinerTierMakerProps) => {
	const [items, setItems] = useState<RankingItem[]>(() =>
		toRankingItems(proposals),
	);
	const [loadedStoredRankings, setLoadedStoredRankings] = useState(false);
	const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
	const [dragOverTier, setDragOverTier] = useState<RankingTierId | null>(null);
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [expandedLayerIds, setExpandedLayerIds] = useState<Set<ProtocolLayer>>(
		() => groupedLayerIds(toRankingItems(proposals)),
	);
	const [instructionsExpanded, setInstructionsExpanded] = useState(false);
	const [hoveredItem, setHoveredItem] = useState<RankingItem | null>(null);
	const [tooltipPosition, setTooltipPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		setItems(mergeSavedRankings(toRankingItems(proposals)));
		setLoadedStoredRankings(true);
		setIsTouchDevice(
			"ontouchstart" in window || window.navigator.maxTouchPoints > 0,
		);
	}, [proposals]);

	useEffect(() => {
		if (!loadedStoredRankings) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify(items.map(({ id, tier }) => ({ id, tier }))),
			);
		} catch {
			// Local storage can be unavailable in private or embedded browser modes.
		}
	}, [items, loadedStoredRankings]);

	const unassignedGroups = useMemo(
		() => groupedUnassignedItems(items),
		[items],
	);
	const rankedCount = useMemo(
		() => items.filter((item) => item.tier !== null).length,
		[items],
	);

	const assignItemToTier = (itemId: string, tierId: RankingTierId | null) => {
		setItems((currentItems) =>
			currentItems.map((item) =>
				item.id === itemId ? { ...item, tier: tierId } : item,
			),
		);
	};

	const handleDragStart = (event: DragEvent<HTMLElement>, itemId: string) => {
		setDraggedItemId(itemId);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", itemId);
	};

	const handleDragEnd = () => {
		setDraggedItemId(null);
		setDragOverTier(null);
	};

	const handleDragOver = (event: DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (event: DragEvent<HTMLElement>, tierId: RankingTierId) => {
		event.preventDefault();
		const itemId = draggedItemId || event.dataTransfer.getData("text/plain");
		if (itemId) assignItemToTier(itemId, tierId);
		setDraggedItemId(null);
		setDragOverTier(null);
	};

	const toggleLayer = (layer: ProtocolLayer) => {
		setExpandedLayerIds((currentLayers) => {
			const nextLayers = new Set(currentLayers);
			if (nextLayers.has(layer)) {
				nextLayers.delete(layer);
			} else {
				nextLayers.add(layer);
			}
			return nextLayers;
		});
	};

	const resetRankings = () => {
		setItems((currentItems) =>
			currentItems.map((item) => ({ ...item, tier: null })),
		);
		setSelectedItemId(null);
		try {
			localStorage.removeItem(storageKey);
		} catch {
			// Ignore storage cleanup failures.
		}
	};

	const selectItem = (itemId: string) => {
		setSelectedItemId((currentItemId) =>
			currentItemId === itemId ? null : itemId,
		);
	};

	const assignSelectedItem = (tierId: RankingTierId) => {
		if (!selectedItemId) return;
		assignItemToTier(selectedItemId, tierId);
		setSelectedItemId(null);
	};

	const handleItemKeyDown = (
		event: KeyboardEvent<HTMLElement>,
		itemId: string,
	) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		setSelectedItemId((currentItemId) =>
			currentItemId === itemId ? null : itemId,
		);
	};

	const showTooltip = (
		event: ReactMouseEvent<HTMLElement>,
		item: RankingItem,
	) => {
		if (isTouchDevice) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const tooltipWidth = 400;
		const tooltipHeight = 350;
		const padding = 10;
		let x = rect.right + padding;
		let y = rect.top;

		if (x + tooltipWidth > window.innerWidth - padding) {
			x = rect.left - tooltipWidth - padding;
		}
		if (x < padding) {
			x = (window.innerWidth - tooltipWidth) / 2;
		}
		if (y + tooltipHeight > window.innerHeight - padding) {
			y = Math.max(padding, window.innerHeight - tooltipHeight - padding);
		}

		setHoveredItem(item);
		setTooltipPosition({ x, y });
	};

	const hideTooltip = () => {
		setHoveredItem(null);
		setTooltipPosition(null);
	};

	return (
		<div
			className="min-h-screen bg-slate-50 dark:bg-slate-900"
			data-ranking-board
		>
			<div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="relative flex h-auto flex-col items-center py-3 sm:h-16 sm:flex-row sm:justify-center sm:py-0">
						<a
							href="/upgrade/hegota"
							className="mb-2 inline-flex items-center gap-1 text-slate-600 text-sm transition-colors hover:text-slate-900 sm:absolute sm:left-0 sm:top-1/2 sm:mb-0 sm:-translate-y-1/2 dark:text-slate-300 dark:hover:text-slate-100"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden="true" />
							Back to Hegota
						</a>
						<h1 className="max-w-full truncate text-center font-semibold text-base text-slate-900 sm:text-xl dark:text-slate-100">
							Hegota Headliner Tier Maker
						</h1>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<div className="flex flex-col gap-4">
						<section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
							<button
								type="button"
								onClick={() => setInstructionsExpanded((expanded) => !expanded)}
								className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
							>
								<h2 className="font-medium text-sm text-slate-900 dark:text-slate-100">
									What is this?
								</h2>
								<ChevronDown
									className={`h-4 w-4 text-slate-400 transition-transform ${
										instructionsExpanded ? "rotate-180" : ""
									}`}
									aria-hidden="true"
								/>
							</button>
							{instructionsExpanded && (
								<div className="px-4 pb-4">
									<p className="mb-4 text-slate-600 text-xs leading-relaxed dark:text-slate-300">
										Users, node operators, app developers, core developers, and
										any other stakeholders are invited to voice their support
										for their preferred headliner proposals for the Hegota
										upgrade.
									</p>
									<p className="mb-4 text-slate-600 text-xs leading-relaxed dark:text-slate-300">
										Drag and drop on desktop or tap-to-assign on mobile. S-tier
										represents your highest priority proposals, while D-tier
										represents your lowest priority.
									</p>
									<p className="text-slate-600 text-xs leading-relaxed dark:text-slate-300">
										Download the image to share your rankings and start a
										conversation.{" "}
										<a
											href="/upgrade/hegota"
											className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
										>
											Learn more about Hegota
										</a>
										.
									</p>
									<div className="mt-4 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
										<Info
											className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400"
											aria-hidden="true"
										/>
										<p className="text-slate-600 text-xs leading-relaxed dark:text-slate-300">
											The deadline for headliner proposal submissions was
											February 4th, 2025.
										</p>
									</div>
								</div>
							)}
						</section>

						<section className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] dark:border-slate-700 dark:bg-slate-800">
							<div className="flex flex-shrink-0 items-center justify-between bg-slate-800 px-4 py-3">
								<h2 className="font-bold text-lg text-white">Your Rankings</h2>
								<span className="font-mono text-slate-400 text-sm">
									forkcast.org/rank
								</span>
							</div>
							<div className="flex-1 overflow-y-auto">
								{rankingTiers.map((tier) => (
									<TierRow
										key={tier.id}
										tier={tier}
										items={itemsInTier(items, tier.id)}
										draggedItemId={draggedItemId}
										dragOverTier={dragOverTier}
										isTouchDevice={isTouchDevice}
										selectedItemId={selectedItemId}
										onDragStart={handleDragStart}
										onDragEnd={handleDragEnd}
										onDragOver={handleDragOver}
										onDragEnter={() => setDragOverTier(tier.id)}
										onDragLeave={() => setDragOverTier(null)}
										onDrop={(event) => handleDrop(event, tier.id)}
										onAssignSelected={() => assignSelectedItem(tier.id)}
										onRemove={(itemId) => assignItemToTier(itemId, null)}
									/>
								))}
							</div>
							<div className="flex-shrink-0 bg-slate-800 px-4 py-3">
								<div className="flex items-center justify-end gap-3">
									<button
										type="button"
										onClick={resetRankings}
										className="inline-flex cursor-pointer items-center gap-1 rounded px-3 py-1.5 font-medium text-slate-300 text-xs transition-colors hover:bg-slate-700 hover:text-white"
									>
										<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
										Reset
									</button>
									<button
										type="button"
										onClick={() => downloadRankingsImage(items)}
										className="inline-flex cursor-pointer items-center gap-1 rounded bg-purple-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-purple-700"
									>
										<Download className="h-3.5 w-3.5" aria-hidden="true" />
										Download Image
									</button>
								</div>
							</div>
						</section>
					</div>

					<section className="lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)] lg:flex-col lg:overflow-hidden">
						<div className="mb-4 flex flex-shrink-0 items-center justify-between">
							<h2 className="font-medium text-lg text-slate-900 dark:text-slate-100">
								Headliner Proposals
								<span className="ml-2 text-slate-500 text-sm dark:text-slate-400">
									({items.length - rankedCount} unranked)
								</span>
							</h2>
							{hasRankedItems(items) && (
								<div className="rounded bg-slate-100 px-2 py-1 text-slate-500 text-xs dark:bg-slate-700 dark:text-slate-400">
									Ready to generate image
								</div>
							)}
						</div>
						<div className="space-y-4 lg:flex-1 lg:overflow-y-auto">
							{unassignedGroups.map(([layer, layerItems]) => {
								const isExpanded = expandedLayerIds.has(layer);
								return (
									<section
										key={layer}
										className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
									>
										<button
											type="button"
											onClick={() => toggleLayer(layer)}
											className="flex w-full cursor-pointer items-center justify-between border-slate-200 border-b bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
										>
											<div className="flex items-center gap-2">
												<span
													className={`rounded px-1.5 py-0.5 font-medium text-xs ${layerBadgeClass(
														layer,
													)}`}
												>
													{layer}
												</span>
												<h3 className="font-semibold text-slate-900 text-sm dark:text-slate-100">
													{layerLabel(layer)}
												</h3>
												<span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700 text-xs dark:bg-slate-700 dark:text-slate-300">
													{itemCountForLayer(items, layer)}
												</span>
											</div>
											<ChevronDown
												className={`h-4 w-4 text-slate-400 transition-transform ${
													isExpanded ? "rotate-180" : ""
												}`}
												aria-hidden="true"
											/>
										</button>
										{isExpanded && (
											<div className="grid grid-cols-1 gap-2 p-3 lg:grid-cols-2">
												{layerItems.map((item) => (
													<UnassignedCard
														key={item.id}
														item={item}
														draggedItemId={draggedItemId}
														isTouchDevice={isTouchDevice}
														selectedItemId={selectedItemId}
														onDragStart={handleDragStart}
														onDragEnd={handleDragEnd}
														onClick={() => selectItem(item.id)}
														onKeyDown={(event) =>
															handleItemKeyDown(event, item.id)
														}
														onMouseEnter={(event) => showTooltip(event, item)}
														onMouseLeave={hideTooltip}
													/>
												))}
											</div>
										)}
									</section>
								);
							})}
						</div>
					</section>
				</div>
			</div>

			{hoveredItem && !isTouchDevice && tooltipPosition && (
				<div
					className="fixed z-50"
					style={{
						left: tooltipPosition.x,
						top: tooltipPosition.y,
						maxWidth: "400px",
						width: "auto",
					}}
				>
					<div className="rounded-lg border-2 border-purple-300 bg-white p-4 shadow-2xl dark:border-purple-600 dark:bg-slate-800">
						<div className="mb-3 flex items-start gap-2">
							<span className="font-bold font-mono text-purple-600 text-sm dark:text-purple-400">
								{hoveredItem.displayId}
							</span>
							<span
								className={`rounded px-1.5 py-0.5 font-medium text-xs ${layerBadgeClass(
									hoveredItem.layer,
								)}`}
							>
								{hoveredItem.layer}
							</span>
						</div>
						<h3 className="mb-2 font-semibold text-slate-900 text-sm dark:text-slate-100">
							{hoveredItem.title}
						</h3>
						<p className="mb-3 text-slate-600 text-xs leading-relaxed dark:text-slate-300">
							{truncateText(hoveredItem.description, 300)}
						</p>
						{hoveredItem.author && (
							<div className="mb-2 text-slate-500 text-xs dark:text-slate-400">
								<span className="font-medium">Author:</span>{" "}
								{cleanAuthorName(hoveredItem.author)}
							</div>
						)}
						{hoveredItem.champions.length > 0 && (
							<div className="text-slate-500 text-xs dark:text-slate-400">
								<span className="font-medium">
									{hoveredItem.champions.length > 1
										? "Champions:"
										: "Champion:"}
								</span>{" "}
								{hoveredItem.champions.join(" & ")}
							</div>
						)}
					</div>
				</div>
			)}

			<div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
				<div className="space-y-3 text-center">
					<p className="mx-auto max-w-2xl text-slate-500 text-xs dark:text-slate-400">
						This is an experimental tool for expressing preferences. Rankings do
						not represent an official vote of any kind. To learn more about
						Ethereum governance, visit{" "}
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://ethereum.org/governance"
							className="text-purple-600 underline decoration-1 underline-offset-2 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
						>
							ethereum.org
						</a>
						.
					</p>
					<div className="text-slate-400 text-xs dark:text-slate-400">
						<span className="italic">Have feedback? Contact </span>
						<a
							href="mailto:nixo@ethereum.org"
							className="text-slate-500 underline decoration-1 underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
						>
							nixo
						</a>
						<span className="italic"> or </span>
						<a
							href="https://x.com/wolovim"
							target="_blank"
							rel="noopener noreferrer"
							className="text-slate-500 underline decoration-1 underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
						>
							@wolovim
						</a>
						<span className="italic">.</span>
					</div>
				</div>
			</div>
		</div>
	);
};

interface TierRowProps {
	tier: RankingTier;
	items: RankingItem[];
	draggedItemId: string | null;
	dragOverTier: RankingTierId | null;
	isTouchDevice: boolean;
	selectedItemId: string | null;
	onDragStart: (event: DragEvent<HTMLElement>, itemId: string) => void;
	onDragEnd: () => void;
	onDragOver: (event: DragEvent<HTMLElement>) => void;
	onDragEnter: () => void;
	onDragLeave: () => void;
	onDrop: (event: DragEvent<HTMLElement>) => void;
	onAssignSelected: () => void;
	onRemove: (itemId: string) => void;
}

const TierRow = ({
	tier,
	items,
	draggedItemId,
	dragOverTier,
	isTouchDevice,
	selectedItemId,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDragEnter,
	onDragLeave,
	onDrop,
	onAssignSelected,
	onRemove,
}: TierRowProps) => (
	<fieldset
		data-ranking-tier={tier.id}
		className={`m-0 flex min-w-0 w-full items-stretch overflow-hidden border-0 p-0 transition-shadow duration-150 ${
			draggedItemId ? "cursor-grabbing ring-2 ring-purple-200 ring-inset" : ""
		} ${selectedItemId ? "ring-2 ring-purple-400 ring-inset" : ""}`}
		style={{ minHeight: 48 }}
		onDragOver={onDragOver}
		onDragEnter={onDragEnter}
		onDragLeave={(event) => {
			if (!event.currentTarget.contains(event.relatedTarget as Node)) {
				onDragLeave();
			}
		}}
		onDrop={onDrop}
	>
		<legend className="sr-only">{tier.name} tier</legend>
		<div
			className={`flex min-h-12 w-12 flex-shrink-0 items-center justify-center ${tier.bandClass}`}
		>
			<span className={`text-2xl ${tier.textClass}`}>{tier.name}</span>
		</div>
		<div
			className={`flex min-h-12 flex-1 items-center overflow-hidden border-slate-200 border-l px-0 dark:border-slate-600 ${
				dragOverTier === tier.id
					? "bg-[repeating-linear-gradient(45deg,#f3f4f6_0_8px,transparent_8px_16px)] dark:bg-[repeating-linear-gradient(45deg,#374151_0_8px,transparent_8px_16px)]"
					: tier.rowClass
			}`}
		>
			<ul className="flex w-full flex-col gap-1 p-1 lg:overflow-x-auto">
				{selectedItemId && (
					<li>
						<button
							type="button"
							onClick={onAssignSelected}
							className="flex h-7 w-full items-center justify-center rounded border border-purple-300 bg-purple-50 font-medium text-purple-700 text-xs dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-200"
						>
							Assign selected here
						</button>
					</li>
				)}
				{items.length === 0 ? (
					<li className="flex h-5 items-center justify-center"></li>
				) : (
					items.map((item) => (
						<li
							key={item.id}
							data-ranked-item={item.id}
							draggable={!isTouchDevice}
							onDragStart={(event) => onDragStart(event, item.id)}
							onDragEnd={onDragEnd}
							className="flex items-center justify-between rounded border border-slate-200 bg-white p-2 shadow-sm lg:min-w-max dark:border-slate-600 dark:bg-slate-700"
						>
							<div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
								<span className="flex-shrink-0 whitespace-nowrap font-mono text-slate-500 text-xs dark:text-slate-400">
									{item.displayId}
								</span>
								<span
									className={`flex-shrink-0 rounded px-1 py-0.5 font-medium text-xs ${layerBadgeClass(
										item.layer,
									)}`}
								>
									{item.layer}
								</span>
								<span className="truncate font-medium text-slate-900 text-xs dark:text-slate-100">
									{item.title}
								</span>
							</div>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									onRemove(item.id);
								}}
								className="ml-1 flex-shrink-0 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
								aria-label={`Remove ${item.displayId} from ${tier.name} tier`}
							>
								<X className="h-3 w-3" aria-hidden="true" />
							</button>
						</li>
					))
				)}
			</ul>
		</div>
	</fieldset>
);

interface UnassignedCardProps {
	item: RankingItem;
	draggedItemId: string | null;
	isTouchDevice: boolean;
	selectedItemId: string | null;
	onDragStart: (event: DragEvent<HTMLElement>, itemId: string) => void;
	onDragEnd: () => void;
	onClick: () => void;
	onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
	onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => void;
	onMouseLeave: () => void;
}

const UnassignedCard = ({
	item,
	draggedItemId,
	isTouchDevice,
	selectedItemId,
	onDragStart,
	onDragEnd,
	onClick,
	onKeyDown,
	onMouseEnter,
	onMouseLeave,
}: UnassignedCardProps) => (
	<button
		type="button"
		data-ranking-card={item.id}
		draggable={!isTouchDevice}
		aria-label={`Select ${item.displayId} ${item.title}`}
		aria-pressed={selectedItemId === item.id}
		onDragStart={(event) => onDragStart(event, item.id)}
		onDragEnd={onDragEnd}
		onClick={onClick}
		onKeyDown={onKeyDown}
		onMouseEnter={onMouseEnter}
		onMouseLeave={onMouseLeave}
		className={`relative w-full cursor-move touch-manipulation rounded-lg border border-slate-200 bg-white p-2 text-left transition-all hover:shadow-md dark:border-slate-600 dark:bg-slate-700 ${
			draggedItemId === item.id ? "opacity-50" : ""
		} ${
			selectedItemId === item.id
				? "bg-purple-50 ring-2 ring-purple-400 dark:bg-purple-900/20"
				: ""
		}`}
	>
		<div className="flex flex-nowrap items-center gap-2">
			<span className="inline-flex flex-shrink-0 items-center whitespace-nowrap border-current border-b border-dotted font-mono text-slate-500 text-xs hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300">
				{item.displayId}
			</span>
			<span
				className={`flex-shrink-0 rounded px-1 py-0.5 font-medium text-xs ${layerBadgeClass(
					item.layer,
				)}`}
			>
				{item.layer}
			</span>
			<span className="truncate font-medium text-slate-900 text-xs dark:text-slate-100">
				{item.title}
			</span>
		</div>
	</button>
);

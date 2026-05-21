import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronDown,
	ExternalLink,
	Filter,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { layerBadgeClass, stageBadgeClass, stageLabel } from "@/domain/display";
import {
	type ClientPriorityRow,
	type ClientStance,
	clClients,
	clientInitials,
	elClients,
	type PrioritySortField,
	ratingLabel,
	type SortDirection,
	scoreClass,
	sortPriorityRows,
} from "@/domain/prioritization/client-priority";
import type { ProtocolLayer } from "@/domain/proposals/proposal";

interface GlamsterdamClientPriorityProps {
	rows: ClientPriorityRow[];
	lastUpdated: string;
}

type LayerFilter = "all" | ProtocolLayer;
type StanceFilter = "all" | "support" | "mixed" | "oppose" | "none";

export const GlamsterdamClientPriority = ({
	rows,
	lastUpdated,
}: GlamsterdamClientPriorityProps) => {
	const [sortField, setSortField] = useState<PrioritySortField>("average");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [layerFilter, setLayerFilter] = useState<LayerFilter>("all");
	const [stanceFilter, setStanceFilter] = useState<StanceFilter>("all");
	const [clientFilter, setClientFilter] = useState("all");
	const [hideExcluded, setHideExcluded] = useState(true);
	const [expandedProposalId, setExpandedProposalId] = useState<number | null>(
		null,
	);
	const [filtersOpen, setFiltersOpen] = useState(false);

	useEffect(() => {
		document.body.style.overflow = filtersOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [filtersOpen]);

	const filteredRows = useMemo(() => {
		let result = rows;

		if (hideExcluded) {
			result = result.filter(
				(row) =>
					row.inclusionStage !== "Declined for Inclusion" &&
					row.inclusionStage !== "Withdrawn" &&
					row.inclusionStage !== "Unknown",
			);
		}

		if (clientFilter !== "all") {
			result = result.filter((row) =>
				row.stances.some((stance) => stance.clientName === clientFilter),
			);
		}

		if (layerFilter !== "all") {
			result = result.filter((row) => row.layer === layerFilter);
		}

		if (stanceFilter === "support") {
			result = result.filter(
				(row) => row.averageScore !== null && row.averageScore >= 4,
			);
		}
		if (stanceFilter === "oppose") {
			result = result.filter((row) => row.opposeCount > row.supportCount);
		}
		if (stanceFilter === "mixed") {
			result = result.filter(
				(row) => row.supportCount > 0 && row.opposeCount > 0,
			);
		}
		if (stanceFilter === "none") {
			result = result.filter((row) => row.stanceCount === 0);
		}

		return result;
	}, [clientFilter, hideExcluded, layerFilter, rows, stanceFilter]);

	const sortedRows = useMemo(
		() => sortPriorityRows(filteredRows, sortField, sortDirection),
		[filteredRows, sortDirection, sortField],
	);

	const stats = useMemo(() => {
		const withStances = rows.filter((row) => row.stanceCount > 0);
		const averageScores = withStances
			.map((row) => row.averageScore)
			.filter((score): score is number => score !== null);

		return {
			total: rows.length,
			withStances: withStances.length,
			average:
				averageScores.length > 0
					? Math.round(
							(averageScores.reduce((sum, score) => sum + score, 0) /
								averageScores.length) *
								10,
						) / 10
					: null,
			highSupport: rows.filter(
				(row) => row.averageScore !== null && row.averageScore >= 4,
			).length,
			contested: rows.filter(
				(row) => row.supportCount > 0 && row.opposeCount > 0,
			).length,
		};
	}, [rows]);

	const activeFilterCount = [
		layerFilter !== "all",
		clientFilter !== "all",
		stanceFilter !== "all",
	].filter(Boolean).length;

	const clearFilters = () => {
		setLayerFilter("all");
		setClientFilter("all");
		setStanceFilter("all");
	};

	const toggleSort = (field: PrioritySortField) => {
		if (sortField === field) {
			setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
			return;
		}
		setSortField(field);
		setSortDirection("desc");
	};

	const toggleExpanded = (proposalId: number) => {
		setExpandedProposalId((currentId) =>
			currentId === proposalId ? null : proposalId,
		);
	};

	return (
		<>
			<p className="mb-1 text-slate-500 text-sm dark:text-slate-400">
				Aggregate client team stances on proposed EIPs. Scores normalized to a
				1-5 scale.
			</p>
			<p className="mb-6 text-slate-500 text-xs dark:text-slate-400">
				Most perspectives were written in November 2025. Thinking and EIPs may
				have evolved since then.
				<span className="sr-only"> Dataset last updated {lastUpdated}.</span>
			</p>

			<div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-3">
					<button
						type="button"
						onClick={() => setFiltersOpen(true)}
						className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-medium text-sm transition-colors ${
							activeFilterCount > 0
								? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
								: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						}`}
					>
						<Filter className="h-5 w-5" aria-hidden="true" />
						<span className="hidden sm:inline">Filters</span>
						{activeFilterCount > 0 && (
							<span className="rounded-full bg-purple-200 px-1.5 py-0.5 text-purple-800 text-xs dark:bg-purple-800 dark:text-purple-200">
								{activeFilterCount}
							</span>
						)}
					</button>

					<label className="flex cursor-pointer select-none items-center gap-2">
						<input
							type="checkbox"
							checked={hideExcluded}
							onChange={(event) => setHideExcluded(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600"
						/>
						<span className="text-slate-600 text-sm dark:text-slate-300">
							Active only
						</span>
					</label>

					<div className="ml-auto flex items-center gap-4 text-sm">
						<span className="text-slate-500 dark:text-slate-400">
							{sortedRows.length} EIPs
						</span>
						{stats.withStances > 0 && (
							<div className="hidden items-center gap-3 md:flex">
								<span className="flex items-center gap-1">
									<span className="h-2 w-2 rounded-full bg-emerald-500"></span>
									<span className="text-slate-600 dark:text-slate-300">
										{stats.highSupport} high
									</span>
								</span>
								<span className="flex items-center gap-1">
									<span className="h-2 w-2 rounded-full bg-amber-500"></span>
									<span className="text-slate-600 dark:text-slate-300">
										{stats.contested} contested
									</span>
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{filtersOpen && (
				<FiltersDialog
					layerFilter={layerFilter}
					stanceFilter={stanceFilter}
					clientFilter={clientFilter}
					activeFilterCount={activeFilterCount}
					resultCount={sortedRows.length}
					onLayerChange={setLayerFilter}
					onStanceChange={setStanceFilter}
					onClientChange={setClientFilter}
					onClear={clearFilters}
					onClose={() => setFiltersOpen(false)}
				/>
			)}

			<div className="space-y-2 lg:hidden">
				{sortedRows.length === 0 ? (
					<EmptyState />
				) : (
					sortedRows.map((row) => (
						<PriorityCard
							key={row.proposalId}
							row={row}
							isExpanded={expandedProposalId === row.proposalId}
							onToggle={() => toggleExpanded(row.proposalId)}
						/>
					))
				)}
			</div>

			<div className="hidden overflow-hidden rounded border border-slate-200 bg-white lg:block dark:border-slate-700 dark:bg-slate-800">
				<table className="w-full">
					<thead className="bg-slate-50 dark:bg-slate-700/50">
						<tr>
							<SortableHeader
								align="left"
								field="proposal"
								label="EIP"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<th className="px-4 py-3 text-left font-medium text-slate-700 text-sm dark:text-slate-300">
								Title
							</th>
							<SortableHeader
								align="left"
								field="stage"
								label="Stage"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<th className="px-4 py-3 text-center font-medium text-slate-700 text-sm dark:text-slate-300">
								<div className="flex items-center justify-center gap-1">
									<span className="h-2 w-2 rounded-full bg-indigo-500"></span>
									EL Clients
								</div>
							</th>
							<th className="px-4 py-3 text-center font-medium text-slate-700 text-sm dark:text-slate-300">
								<div className="flex items-center justify-center gap-1">
									<span className="h-2 w-2 rounded-full bg-teal-500"></span>
									CL Clients
								</div>
							</th>
							<SortableHeader
								align="right"
								field="average"
								label="Avg"
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={toggleSort}
							/>
							<th className="px-4 py-3 text-center font-medium text-slate-700 text-sm dark:text-slate-300">
								Details
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200 dark:divide-slate-700">
						{sortedRows.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
								>
									No EIPs found with prioritization data
								</td>
							</tr>
						) : (
							sortedRows.map((row) => (
								<PriorityTableRow
									key={row.proposalId}
									row={row}
									isExpanded={expandedProposalId === row.proposalId}
									onToggle={() => toggleExpanded(row.proposalId)}
								/>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h3 className="mb-3 font-medium text-slate-700 text-sm dark:text-slate-300">
					Score Legend
				</h3>
				<div className="flex flex-wrap gap-3 text-xs">
					<span className={`rounded px-2 py-1 ${scoreClass(5)}`}>
						5 = Strong Support
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(4)}`}>
						4 = Support
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(3)}`}>
						3 = Neutral
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(2)}`}>
						2 = Low Priority
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(1)}`}>
						1 = Oppose
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(null, true)}`}>
						? = Uncertain
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(null, false)}`}>
						- = Not Mentioned
					</span>
				</div>
			</div>

			<div className="mt-8 text-center text-slate-400 text-xs dark:text-slate-400">
				<p>
					Stances parsed from client team blog posts and public statements. Data
					may not reflect current positions.
				</p>
			</div>
		</>
	);
};

interface SortableHeaderProps {
	field: PrioritySortField;
	label: string;
	sortField: PrioritySortField;
	sortDirection: SortDirection;
	align: "left" | "right";
	onSort: (field: PrioritySortField) => void;
}

const SortableHeader = ({
	field,
	label,
	sortField,
	sortDirection,
	align,
	onSort,
}: SortableHeaderProps) => (
	<th className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
		<button
			type="button"
			onClick={() => onSort(field)}
			className={`inline-flex items-center gap-2 font-medium text-slate-700 text-sm hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 ${
				align === "right" ? "justify-end" : "justify-start"
			}`}
		>
			{label}
			<SortIcon active={sortField === field} direction={sortDirection} />
		</button>
	</th>
);

const SortIcon = ({
	active,
	direction,
}: {
	active: boolean;
	direction: SortDirection;
}) => {
	if (!active) return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
	return direction === "asc" ? (
		<ArrowUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
	) : (
		<ArrowDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
	);
};

interface PriorityCardProps {
	row: ClientPriorityRow;
	isExpanded: boolean;
	onToggle: () => void;
}

const PriorityCard = ({ row, isExpanded, onToggle }: PriorityCardProps) => (
	<div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
		<button
			type="button"
			onClick={onToggle}
			className="w-full px-4 py-3 text-left"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<span className="font-mono text-purple-600 text-sm dark:text-purple-400">
							{row.displayId}
						</span>
						{row.layer && (
							<span
								className={`rounded px-1.5 py-0.5 text-[10px] ${layerBadgeClass(row.layer)}`}
							>
								{row.layer}
							</span>
						)}
						<span
							className={`rounded px-1.5 py-0.5 text-[10px] ${stageBadgeClass(row.inclusionStage)}`}
						>
							{stageLabel(row.inclusionStage)}
						</span>
					</div>
					<p className="line-clamp-2 text-slate-900 text-sm dark:text-slate-100">
						{row.title}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{row.averageScore !== null ? (
						<span
							className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${scoreClass(
								Math.round(row.averageScore),
							)}`}
						>
							{row.averageScore.toFixed(1)}
						</span>
					) : (
						<span className="text-slate-400 text-xs italic dark:text-slate-400">
							No data
						</span>
					)}
					<ChevronDown
						className={`h-4 w-4 text-slate-400 transition-transform ${
							isExpanded ? "rotate-180" : ""
						}`}
						aria-hidden="true"
					/>
				</div>
			</div>
		</button>
		{isExpanded && (
			<div className="border-slate-100 border-t px-4 pt-2 pb-4 dark:border-slate-700">
				<ClientStancesGrid stances={row.stances} />
			</div>
		)}
	</div>
);

interface PriorityTableRowProps {
	row: ClientPriorityRow;
	isExpanded: boolean;
	onToggle: () => void;
}

const PriorityTableRow = ({
	row,
	isExpanded,
	onToggle,
}: PriorityTableRowProps) => (
	<>
		<tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
			<td className="px-4 py-3">
				<div className="flex items-center gap-2">
					<a
						href={row.href}
						className="font-mono text-purple-600 text-sm hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
					>
						{row.displayId}
					</a>
					{row.layer && (
						<span
							className={`rounded px-1.5 py-0.5 text-[10px] ${layerBadgeClass(row.layer)}`}
						>
							{row.layer}
						</span>
					)}
				</div>
			</td>
			<td className="px-4 py-3">
				<a
					href={row.href}
					className="line-clamp-1 text-slate-900 text-sm hover:text-purple-600 dark:text-slate-100 dark:hover:text-purple-400"
				>
					{row.title}
				</a>
			</td>
			<td className="px-4 py-3">
				<span
					className={`inline-block rounded px-2 py-0.5 text-xs ${stageBadgeClass(row.inclusionStage)}`}
				>
					{stageLabel(row.inclusionStage)}
				</span>
			</td>
			<td className="px-4 py-3">
				<ClientStanceBadges stances={row.stances} clients={elClients} />
			</td>
			<td className="px-4 py-3">
				<ClientStanceBadges stances={row.stances} clients={clClients} />
			</td>
			<td className="px-4 py-3 text-right">
				{row.averageScore !== null ? (
					<span
						className={`inline-flex items-center rounded px-2 py-1 font-medium text-xs ${scoreClass(
							Math.round(row.averageScore),
						)}`}
					>
						{row.averageScore.toFixed(1)}
					</span>
				) : (
					<span className="text-slate-400 dark:text-slate-400">-</span>
				)}
			</td>
			<td className="px-4 py-3 text-center">
				<button
					type="button"
					onClick={onToggle}
					className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
					aria-label={isExpanded ? "Collapse details" : "Expand details"}
				>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
						aria-hidden="true"
					/>
				</button>
			</td>
		</tr>
		{isExpanded && (
			<tr className="bg-slate-50 dark:bg-slate-800/50">
				<td colSpan={7} className="px-4 py-4">
					<ClientStancesGrid stances={row.stances} />
				</td>
			</tr>
		)}
	</>
);

const ClientStanceBadges = ({
	stances,
	clients,
}: {
	stances: ClientStance[];
	clients: string[];
}) => (
	<div className="flex justify-center gap-1">
		{clients.map((client) => {
			const stance = stances.find((item) => item.clientName === client);
			const hasStance = Boolean(stance);
			const score = stance?.normalizedScore ?? null;
			return (
				<div
					key={client}
					className={`flex h-6 w-6 items-center justify-center rounded font-medium text-[10px] ${scoreClass(
						score,
						hasStance,
					)}`}
					title={
						stance
							? `${client}: ${ratingLabel(stance.ratingSystem, stance.rawRating)}`
							: `${client}: Not mentioned`
					}
				>
					{clientInitials(client)}
				</div>
			);
		})}
	</div>
);

const ClientStancesGrid = ({ stances }: { stances: ClientStance[] }) => (
	<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
		<ClientColumn clients={elClients} stances={stances} type="EL" />
		<ClientColumn clients={clClients} stances={stances} type="CL" />
	</div>
);

const ClientColumn = ({
	clients,
	stances,
	type,
}: {
	clients: string[];
	stances: ClientStance[];
	type: "EL" | "CL";
}) => (
	<div>
		<h4
			className={`mb-2 flex items-center gap-1 font-medium text-xs ${
				type === "EL"
					? "text-indigo-600 dark:text-indigo-400"
					: "text-teal-600 dark:text-teal-400"
			}`}
		>
			<span
				className={`h-2 w-2 rounded-full ${
					type === "EL" ? "bg-indigo-500" : "bg-teal-500"
				}`}
			></span>
			{type === "EL" ? "Execution Layer Clients" : "Consensus Layer Clients"}
		</h4>
		<div>
			{clients.map((client) => {
				const stance = stances.find((item) => item.clientName === client);
				return (
					<div
						key={client}
						className="flex items-center justify-between border-slate-100 border-b py-1.5 last:border-0 dark:border-slate-700"
					>
						<span className="text-slate-700 text-sm dark:text-slate-300">
							{client}
						</span>
						<div className="flex items-center gap-2">
							{stance ? (
								<>
									<span
										className={`rounded px-2 py-0.5 font-medium text-xs ${scoreClass(
											stance.normalizedScore,
										)}`}
									>
										{ratingLabel(stance.ratingSystem, stance.rawRating)}
									</span>
									{stance.comment && (
										<span
											className="max-w-[200px] truncate text-slate-500 text-xs dark:text-slate-400"
											title={stance.comment}
										>
											{stance.comment}
										</span>
									)}
									<a
										href={stance.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
										aria-label={`${client} source`}
									>
										<ExternalLink className="h-4 w-4" aria-hidden="true" />
									</a>
								</>
							) : (
								<span className="text-slate-400 text-xs italic dark:text-slate-400">
									No stance
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

interface FiltersDialogProps {
	layerFilter: LayerFilter;
	stanceFilter: StanceFilter;
	clientFilter: string;
	activeFilterCount: number;
	resultCount: number;
	onLayerChange: (filter: LayerFilter) => void;
	onStanceChange: (filter: StanceFilter) => void;
	onClientChange: (client: string) => void;
	onClear: () => void;
	onClose: () => void;
}

const FiltersDialog = ({
	layerFilter,
	stanceFilter,
	clientFilter,
	activeFilterCount,
	resultCount,
	onLayerChange,
	onStanceChange,
	onClientChange,
	onClear,
	onClose,
}: FiltersDialogProps) => (
	<div className="fixed inset-0 z-50 animate-fadeIn">
		<button
			type="button"
			className="absolute inset-0 bg-black/50"
			onClick={onClose}
			aria-label="Close filters"
		></button>
		<div className="absolute right-0 bottom-0 left-0 md:inset-0 md:flex md:items-center md:justify-center">
			<div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-white md:max-h-[90vh] md:w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl dark:bg-slate-800">
				<div className="flex items-center justify-between border-slate-200 border-b px-4 py-3 dark:border-slate-700">
					<h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
						Filters
					</h2>
					<div className="flex items-center gap-3">
						{activeFilterCount > 0 && (
							<button
								type="button"
								onClick={onClear}
								className="font-medium text-purple-600 text-sm dark:text-purple-400"
							>
								Clear all
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
							aria-label="Close filters"
						>
							<X className="h-6 w-6 text-slate-500" aria-hidden="true" />
						</button>
					</div>
				</div>
				<div className="flex-1 overflow-y-auto p-4 md:p-6">
					<div className="grid gap-6 md:grid-cols-2">
						<FilterGroup title="Layer">
							{[
								{ value: "all" as const, label: "All Layers" },
								{ value: "EL" as const, label: "Execution Layer" },
								{ value: "CL" as const, label: "Consensus Layer" },
							].map((item) => (
								<FilterChip
									key={item.value}
									label={item.label}
									selected={layerFilter === item.value}
									onClick={() => onLayerChange(item.value)}
								/>
							))}
						</FilterGroup>
						<FilterGroup title="Stance">
							{[
								{ value: "all" as const, label: "All Stances" },
								{ value: "support" as const, label: "High Support" },
								{ value: "mixed" as const, label: "Contested" },
								{ value: "oppose" as const, label: "More Opposition" },
								{ value: "none" as const, label: "No Stances" },
							].map((item) => (
								<FilterChip
									key={item.value}
									label={item.label}
									selected={stanceFilter === item.value}
									onClick={() => onStanceChange(item.value)}
								/>
							))}
						</FilterGroup>
						<FilterGroup title="EL Clients">
							{elClients.map((client) => (
								<FilterChip
									key={client}
									label={client}
									selected={clientFilter === client}
									tone="indigo"
									onClick={() =>
										onClientChange(clientFilter === client ? "all" : client)
									}
								/>
							))}
						</FilterGroup>
						<FilterGroup title="CL Clients">
							{clClients.map((client) => (
								<FilterChip
									key={client}
									label={client}
									selected={clientFilter === client}
									tone="teal"
									onClick={() =>
										onClientChange(clientFilter === client ? "all" : client)
									}
								/>
							))}
						</FilterGroup>
					</div>
				</div>
				<div className="border-slate-200 border-t bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
					<button
						type="button"
						onClick={onClose}
						className="w-full rounded-lg bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700"
					>
						Show {resultCount} {resultCount === 1 ? "result" : "results"}
					</button>
				</div>
			</div>
		</div>
	</div>
);

const FilterGroup = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<div>
		<h3 className="mb-3 font-semibold text-slate-700 text-sm dark:text-slate-300">
			{title}
		</h3>
		<div className="flex flex-wrap gap-2">{children}</div>
	</div>
);

const FilterChip = ({
	label,
	selected,
	tone = "purple",
	onClick,
}: {
	label: string;
	selected: boolean;
	tone?: "purple" | "indigo" | "teal";
	onClick: () => void;
}) => {
	const selectedClass = {
		purple:
			"bg-purple-100 text-purple-800 ring-purple-500 dark:bg-purple-900/30 dark:text-purple-300",
		indigo:
			"bg-indigo-100 text-indigo-800 ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300",
		teal: "bg-teal-100 text-teal-800 ring-teal-500 dark:bg-teal-900/30 dark:text-teal-300",
	}[tone];

	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
				selected
					? `${selectedClass} ring-2 ring-offset-1 dark:ring-offset-slate-800`
					: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
			}`}
		>
			{label}
		</button>
	);
};

const EmptyState = () => (
	<div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
		No EIPs found with prioritization data
	</div>
);

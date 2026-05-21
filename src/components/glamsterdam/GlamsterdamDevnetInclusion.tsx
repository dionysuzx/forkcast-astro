import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ExternalLink,
	Filter,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
	type DevnetInclusionLayerFilter,
	type DevnetInclusionRow,
	type DevnetInclusionSortField,
	type DevnetInclusionStageFilter,
	devnetBadgeClass,
	devnetLabel,
	type SortDirection,
	sortDevnetInclusionRows,
} from "@/domain/devnets/glamsterdam-inclusion";
import { layerBadgeClass, stageBadgeClass, stageLabel } from "@/domain/display";
import { scoreClass } from "@/domain/prioritization/client-priority";
import type {
	InclusionStage,
	ProtocolLayer,
} from "@/domain/proposals/proposal";
import { scoreToneClass } from "@/domain/test-complexity/test-complexity";

interface GlamsterdamDevnetInclusionProps {
	rows: DevnetInclusionRow[];
	lastUpdated: string;
	activeNetworkRetrievedAt: string;
}

const stageOptions: InclusionStage[] = [
	"Included",
	"Scheduled for Inclusion",
	"Considered for Inclusion",
	"Proposed for Inclusion",
	"Declined for Inclusion",
	"Withdrawn",
];

export const GlamsterdamDevnetInclusion = ({
	rows,
	lastUpdated,
	activeNetworkRetrievedAt,
}: GlamsterdamDevnetInclusionProps) => {
	const [sortField, setSortField] =
		useState<DevnetInclusionSortField>("support");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [hideExcluded, setHideExcluded] = useState(true);
	const [hideInDevnet, setHideInDevnet] = useState(false);
	const [stageFilter, setStageFilter] =
		useState<DevnetInclusionStageFilter>("all");
	const [layerFilter, setLayerFilter] =
		useState<DevnetInclusionLayerFilter>("all");
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

		if (hideInDevnet) {
			result = result.filter((row) => row.devnets.length === 0);
		}

		if (stageFilter !== "all") {
			result = result.filter((row) => row.inclusionStage === stageFilter);
		}

		if (layerFilter !== "all") {
			result = result.filter((row) => row.layer === layerFilter);
		}

		return result;
	}, [hideExcluded, hideInDevnet, layerFilter, rows, stageFilter]);

	const sortedRows = useMemo(
		() => sortDevnetInclusionRows(filteredRows, sortField, sortDirection),
		[filteredRows, sortDirection, sortField],
	);

	const activeFilterCount = [
		stageFilter !== "all",
		layerFilter !== "all",
	].filter(Boolean).length;

	const clearFilters = () => {
		setStageFilter("all");
		setLayerFilter("all");
	};

	const toggleSort = (field: DevnetInclusionSortField) => {
		if (sortField === field) {
			setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
			return;
		}

		setSortField(field);
		setSortDirection(
			field === "proposal" || field === "stage" ? "asc" : "desc",
		);
	};

	return (
		<>
			<p className="mb-6 text-slate-500 text-sm dark:text-slate-400">
				Aggregated data points as a devnet inclusion decision-making aid, not a
				recommendation.
				<span className="sr-only">
					{" "}
					Devnet inclusion data last updated {lastUpdated}. Active network
					snapshot captured {activeNetworkRetrievedAt}. Optional devnet entries
					are marked with *.
				</span>
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

					<label className="flex cursor-pointer select-none items-center gap-2">
						<input
							type="checkbox"
							checked={hideInDevnet}
							onChange={(event) => setHideInDevnet(event.target.checked)}
							className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600"
						/>
						<span className="text-slate-600 text-sm dark:text-slate-300">
							Hide in devnet
						</span>
					</label>

					<div className="ml-auto flex items-center gap-4 text-sm">
						<span className="text-slate-500 dark:text-slate-400">
							{sortedRows.length} EIPs
						</span>
					</div>
				</div>
			</div>

			{filtersOpen && (
				<FiltersDialog
					stageFilter={stageFilter}
					layerFilter={layerFilter}
					activeFilterCount={activeFilterCount}
					resultCount={sortedRows.length}
					onStageChange={setStageFilter}
					onLayerChange={setLayerFilter}
					onClear={clearFilters}
					onClose={() => setFiltersOpen(false)}
				/>
			)}

			<div className="space-y-2 md:hidden">
				{sortedRows.length === 0 ? (
					<EmptyState />
				) : (
					sortedRows.map((row) => <DevnetCard key={row.proposalId} row={row} />)
				)}
			</div>

			<div className="hidden overflow-hidden rounded border border-slate-200 bg-white md:block dark:border-slate-700 dark:bg-slate-800">
				<div className="overflow-x-auto">
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
								<SortableHeader
									align="left"
									field="devnets"
									label="Active Devnets"
									sortField={sortField}
									sortDirection={sortDirection}
									onSort={toggleSort}
								/>
								<SortableHeader
									align="right"
									field="complexity"
									label="Test Complexity"
									sortField={sortField}
									sortDirection={sortDirection}
									onSort={toggleSort}
								/>
								<SortableHeader
									align="right"
									field="support"
									label="Avg Support"
									sortField={sortField}
									sortDirection={sortDirection}
									onSort={toggleSort}
								/>
								<th className="px-4 py-3 text-center font-medium text-slate-700 text-sm dark:text-slate-300">
									Stances
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
										No EIPs found
									</td>
								</tr>
							) : (
								sortedRows.map((row) => (
									<DevnetTableRow key={row.proposalId} row={row} />
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h3 className="mb-3 font-medium text-slate-700 text-sm dark:text-slate-300">
					Signal Legend
				</h3>
				<div className="flex flex-wrap gap-3 text-xs">
					<span className={`rounded px-2 py-1 ${scoreToneClass(0)}`}>
						Low test complexity
					</span>
					<span className={`rounded px-2 py-1 ${scoreToneClass(10)}`}>
						Medium test complexity
					</span>
					<span className={`rounded px-2 py-1 ${scoreToneClass(20)}`}>
						High test complexity
					</span>
					<span className={`rounded px-2 py-1 ${scoreClass(5)}`}>
						High client support
					</span>
					<span className="rounded bg-orange-100 px-2 py-1 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
						repricing = gas repricing cluster
					</span>
				</div>
			</div>

			<div className="mt-8 text-center text-slate-400 text-xs dark:text-slate-400">
				<p>
					Complexity data from{" "}
					<a
						href="https://github.com/ethsteel/pm"
						target="_blank"
						rel="noreferrer"
						className="underline hover:text-slate-600 dark:hover:text-slate-300"
					>
						STEEL
					</a>
					{" | "}Prioritization data from client team publications{" | "}
					<a
						href="/upgrade/glamsterdam/test-complexity"
						className="underline hover:text-slate-600 dark:hover:text-slate-300"
					>
						Full complexity view
					</a>
					{" | "}
					<a
						href="/upgrade/glamsterdam/client-priority"
						className="underline hover:text-slate-600 dark:hover:text-slate-300"
					>
						Full priority view
					</a>
				</p>
			</div>
		</>
	);
};

interface SortableHeaderProps {
	field: DevnetInclusionSortField;
	label: string;
	sortField: DevnetInclusionSortField;
	sortDirection: SortDirection;
	align: "left" | "right";
	onSort: (field: DevnetInclusionSortField) => void;
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

const DevnetCard = ({ row }: { row: DevnetInclusionRow }) => (
	<div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
		<div className="mb-2 flex items-start justify-between gap-3">
			<div className="min-w-0">
				<a
					href={row.href}
					className="whitespace-nowrap font-mono text-purple-600 text-sm hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
				>
					{row.displayId}
				</a>
				<MetaBadges row={row} />
			</div>
		</div>
		<a
			href={row.href}
			className="mb-3 line-clamp-2 block text-slate-900 text-sm hover:text-purple-600 dark:text-slate-100 dark:hover:text-purple-400"
		>
			{row.title}
		</a>
		<div className="mb-3 flex flex-wrap gap-1.5">
			<StageBadge stage={row.inclusionStage} />
			<DevnetBadges row={row} />
		</div>
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 text-xs dark:text-slate-400">
			<div className="flex items-center gap-1">
				<span>Test:</span>
				<ComplexityBadge row={row} />
			</div>
			<div className="flex items-center gap-1">
				<span>Support:</span>
				<SupportBadge row={row} />
				<StanceCount row={row} />
			</div>
		</div>
	</div>
);

const DevnetTableRow = ({ row }: { row: DevnetInclusionRow }) => (
	<tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
		<td className="px-4 py-3">
			<div className="flex items-center gap-2">
				<a
					href={row.href}
					className="whitespace-nowrap font-mono text-purple-600 text-sm hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
				>
					{row.displayId}
				</a>
				<MetaBadges row={row} />
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
			<StageBadge stage={row.inclusionStage} />
		</td>
		<td className="px-4 py-3">
			<DevnetBadges row={row} />
		</td>
		<td className="px-4 py-3 text-right">
			<ComplexityBadge row={row} />
		</td>
		<td className="px-4 py-3 text-right">
			<SupportBadge row={row} />
		</td>
		<td className="px-4 py-3 text-center">
			<StanceCount row={row} />
		</td>
	</tr>
);

const MetaBadges = ({ row }: { row: DevnetInclusionRow }) => (
	<>
		{row.layer && (
			<span
				className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${layerBadgeClass(row.layer)}`}
			>
				{row.layer}
			</span>
		)}
		{row.isGasRepricing && (
			<span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
				repricing
			</span>
		)}
	</>
);

const StageBadge = ({ stage }: { stage: InclusionStage }) => (
	<span
		className={`inline-block rounded px-2 py-0.5 text-xs ${stageBadgeClass(stage)}`}
	>
		{stageLabel(stage)}
	</span>
);

const DevnetBadges = ({ row }: { row: DevnetInclusionRow }) => {
	if (row.devnets.length === 0) {
		return (
			<span className="text-slate-400 text-xs dark:text-slate-400">-</span>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{[...row.devnets]
				.sort((a, b) => a.version - b.version || a.id.localeCompare(b.id))
				.map((devnet) => (
					<span
						key={`${devnet.id}-${devnet.optional ? "optional" : "required"}`}
						className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[10px] ${devnetBadgeClass(
							devnet.headliner,
						)}`}
						title={[
							devnet.optional ? `${devnet.id} (optional)` : devnet.id,
							devnet.updated ? "updated" : null,
							devnet.isTarget ? "target" : null,
						]
							.filter(Boolean)
							.join(", ")}
					>
						{devnetLabel(devnet)}
					</span>
				))}
		</div>
	);
};

const ComplexityBadge = ({ row }: { row: DevnetInclusionRow }) => {
	if (!row.complexity) {
		return (
			<span className="text-slate-400 text-xs dark:text-slate-400">-</span>
		);
	}

	return (
		<a
			href={row.complexity.assessmentUrl}
			target="_blank"
			rel="noreferrer"
			className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium text-xs ${scoreToneClass(
				row.complexity.totalScore,
			)}`}
			title={`${row.complexity.tier} complexity`}
		>
			{row.complexity.totalScore}
			<ExternalLink className="h-3 w-3" aria-hidden="true" />
		</a>
	);
};

const SupportBadge = ({ row }: { row: DevnetInclusionRow }) => {
	if (row.averageSupport === null) {
		return (
			<span className="text-slate-400 text-xs dark:text-slate-400">-</span>
		);
	}

	return (
		<span
			className={`inline-block rounded px-2 py-0.5 font-medium text-xs ${scoreClass(
				Math.round(row.averageSupport),
			)}`}
		>
			{row.averageSupport.toFixed(1)}
		</span>
	);
};

const StanceCount = ({ row }: { row: DevnetInclusionRow }) => (
	<span className="text-slate-600 text-xs dark:text-slate-400">
		{row.stanceCount}
	</span>
);

interface FiltersDialogProps {
	stageFilter: DevnetInclusionStageFilter;
	layerFilter: DevnetInclusionLayerFilter;
	activeFilterCount: number;
	resultCount: number;
	onStageChange: (filter: DevnetInclusionStageFilter) => void;
	onLayerChange: (filter: DevnetInclusionLayerFilter) => void;
	onClear: () => void;
	onClose: () => void;
}

const FiltersDialog = ({
	stageFilter,
	layerFilter,
	activeFilterCount,
	resultCount,
	onStageChange,
	onLayerChange,
	onClear,
	onClose,
}: FiltersDialogProps) => (
	<div className="fixed inset-0 z-50 animate-fadeIn">
		<button
			type="button"
			className="absolute inset-0 bg-black/50"
			onClick={onClose}
			aria-label="Close filters"
		/>
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
						<FilterGroup title="Inclusion Stage">
							<FilterChip
								label="All Stages"
								selected={stageFilter === "all"}
								onClick={() => onStageChange("all")}
							/>
							{stageOptions.map((stage) => (
								<FilterChip
									key={stage}
									label={stageLabel(stage)}
									selected={stageFilter === stage}
									onClick={() => onStageChange(stage)}
								/>
							))}
						</FilterGroup>
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
									onClick={() =>
										onLayerChange(item.value as "all" | ProtocolLayer)
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
	onClick,
}: {
	label: string;
	selected: boolean;
	onClick: () => void;
}) => (
	<button
		type="button"
		onClick={onClick}
		className={`rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
			selected
				? "bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-1 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-offset-slate-800"
				: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
		}`}
	>
		{label}
	</button>
);

const EmptyState = () => (
	<div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
		No EIPs found
	</div>
);

import * as React from 'react'
import { Input } from './input'
import { useTranslation } from 'react-i18next'
import { cn } from '#app/utils/misc.tsx'

export type Column<T> = {
	key: keyof T
	label: string
	render?: (row: T) => React.ReactNode
	align?: 'left' | 'center' | 'right'
}

type TableProps<T> = {
	data: T[]
	columns: Column<T>[]
	actions?: (row: T) => React.ReactNode
	searchPlaceholder?: string
	onRowClick?: (row: T) => void
	emptyMessage?: React.ReactNode
}

export function GenericTable<T>({
	data,
	columns,
	actions,
	searchPlaceholder = 'Search...',
	onRowClick,
	emptyMessage = 'No data available',
}: TableProps<T>) {
	const { t } = useTranslation()
	const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
	const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
	const [searchQuery, setSearchQuery] = React.useState('')

	const filteredData = data.filter((row) =>
		columns.some((col) => {
			const value = row[col.key]
			return value
				?.toString()
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
		}),
	)

	const sortedData = [...filteredData].sort((a, b) => {
		if (!sortColumn) return 0
		const valA = a[sortColumn]
		const valB = b[sortColumn]

		if (typeof valA === 'string' && typeof valB === 'string') {
			return sortOrder === 'asc'
				? valA.localeCompare(valB)
				: valB.localeCompare(valA)
		}

		if (typeof valA === 'number' && typeof valB === 'number') {
			return sortOrder === 'asc' ? valA - valB : valB - valA
		}

		return 0
	})

	const handleSort = (key: keyof T) => {
		if (sortColumn === key) {
			setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortColumn(key)
			setSortOrder('asc')
		}
	}

	return (
		<div className="rounded-2xl border bg-card shadow-sm p-4 space-y-4">
			<div className="flex flex-col sm:flex-row justify-between gap-3">
				<Input
					placeholder={searchPlaceholder ?? t('table.search')}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="sm:max-w-sm"
				/>
			</div>

			<div className="overflow-auto">
				<table className="w-full table-auto text-sm text-left border border-border rounded-md overflow-hidden">
	<thead className="bg-muted text-muted-foreground">
		<tr>
			{columns.map((col) => (
				<th
					key={col.key as string}
					onClick={() => handleSort(col.key)}
					className={cn(
						'px-4 py-3 font-semibold cursor-pointer whitespace-nowrap',
						col.align === 'right' ? 'text-right' :
						col.align === 'center' ? 'text-center' :
						'text-left'
					)}
				>
					<div className="flex items-center gap-1">
						{col.label}
						{sortColumn === col.key && (
							<span className="text-xs">
								{sortOrder === 'asc' ? '▲' : '▼'}
							</span>
						)}
					</div>
				</th>
			))}
			{actions && (
				<th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
					{t('table.actions')}
				</th>
			)}
		</tr>
	</thead>
	<tbody>
		{sortedData.length > 0 ? (
			sortedData.map((row, idx) => (
				<tr
					key={(row as any).id ?? idx}
					onClick={() => onRowClick?.(row)}
					className={cn(
						'border-t transition-colors',
						onRowClick ? 'cursor-pointer hover:bg-accent' : ''
					)}
				>
					{columns.map((col) => (
						<td
							key={col.key as string}
							className={cn(
								'px-4 py-3',
								col.align === 'right' ? 'text-right' :
								col.align === 'center' ? 'text-center' :
								'text-left'
							)}
						>
							{col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
						</td>
					))}
					{actions && (
						<td className="px-4 py-3 text-center">{actions(row)}</td>
					)}
				</tr>
			))
		) : (
			<tr>
				<td
					colSpan={columns.length + (actions ? 1 : 0)}
					className="text-center py-6 text-muted-foreground"
				>
					{emptyMessage ?? t('table.empty')}
				</td>
			</tr>
		)}
	</tbody>
</table>

			</div>
		</div>
	)
}

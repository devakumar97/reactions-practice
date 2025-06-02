// app/components/ui/modal.tsx
import * as Dialog from '@radix-ui/react-dialog'
import { Icon } from './icon'
import { useEffect } from 'react'

export function Modal({
	children,
	onClose,
}: {
	children: React.ReactNode
	onClose: () => void
}) {
	useEffect(() => {
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = ''
		}
	}, [])

	return (
		<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
				<Dialog.Content
					className="fixed left-1/2 top-1/2 z-[100] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2
					rounded-2xl bg-background text-foreground p-6 shadow-2xl border border-border focus:outline-none"
				>
					<Dialog.Close asChild>
						<button
							className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
							aria-label="Close"
						>
							<Icon name="cross-1" className="h-5 w-5 bg-red-700 rounded " />
						</button>
					</Dialog.Close>
					<div>{children}</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

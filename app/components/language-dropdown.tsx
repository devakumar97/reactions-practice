import { useFetcher } from "@remix-run/react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useTranslation } from "react-i18next"

export function LanguageDropDown() {
	const { t, i18n } = useTranslation()
	const fetcher = useFetcher()

	const onValueChange = (lang: string) => {
		i18n.changeLanguage(lang)
		fetcher.submit(null, {
			method: 'POST',
			action: `/settings/change-language/${lang}`,
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary"> {t('root.language')} </Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={i18n.language}
					onValueChange={onValueChange}
				>
					<DropdownMenuRadioItem value="en">
						{t('root.english')}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="fr">
						{t('root.french')}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="es">
						{t('root.spanish')}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
import { Form, Link, useSubmit } from "@remix-run/react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { getUserImgSrc } from "#app/utils/misc.tsx"
import { Icon } from "./ui/icon"
import { useTranslation } from "react-i18next"
import { useRef } from "react"
import { useUser } from "#app/utils/user.ts"

export function UserDropdown() {
    const user = useUser()
    const submit = useSubmit()
    const formRef = useRef<HTMLFormElement>(null)
    const { t } = useTranslation()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button asChild variant="secondary">
                    <Link
                        to={`/users/${user.username}`}
                        // this is for progressive enhancement
                        onClick={(e) => e.preventDefault()}
                        className="flex items-center gap-2"
                    >
                        <img
                            className="h-8 w-8 rounded-full object-cover"
                            alt={user.name ?? user.username}
                            src={getUserImgSrc(user.image?.id)}
                        />
                        <span className="text-body-sm font-bold">
                            {user.name ?? user.username}
                        </span>
                    </Link>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent sideOffset={8} align="start">
                    <DropdownMenuItem asChild>
                        <Link prefetch="intent" to={`/users/${user.username}`}>
                            <Icon className="text-body-md" name="avatar">
                                {t('userDropdown.root.profile')}
                            </Icon>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link prefetch="intent" to={`/users/${user.username}/courses`}>
                            <Icon className="text-body-md" name="pencil-2">
                                {t('userDropdown.root.courses')}
                            </Icon>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        asChild
                        // this prevents the menu from closing before the form submission is completed
                        onSelect={(event) => {
                            event.preventDefault()
                            submit(formRef.current)
                        }}
                    >
                        <Form action="/logout" method="POST" ref={formRef}>
                            <Icon className="text-body-md" name="exit">
                                <button type="submit">{t('userDropdown.root.logout')}</button>
                            </Icon>
                        </Form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    )
}
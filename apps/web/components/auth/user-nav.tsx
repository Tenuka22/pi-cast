"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"

export function UserNav() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" onClick={() => router.push("/login")}>
        Sign In
      </Button>
    )
  }

  const userInitial =
    session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Avatar className="h-9 w-9 cursor-pointer rounded-full ring-1 ring-border hover:bg-accent">
            <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
          </Avatar>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">
                {session.user.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/security")}>
            Security
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/organizations")}
          >
            Organizations
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleSignOut()}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

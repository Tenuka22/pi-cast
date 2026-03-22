"use client"

import { UserNav } from "@/components/auth/user-nav"

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-bold">Security Settings</h1>
        <UserNav />
      </div>
    </header>
  )
}

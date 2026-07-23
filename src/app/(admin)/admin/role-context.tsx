"use client"

import { createContext, useContext, type ReactNode } from "react"

interface AdminRoleContextValue {
  isSuperAdmin: boolean
  role: string | undefined
}

const AdminRoleContext = createContext<AdminRoleContextValue>({
  isSuperAdmin: false,
  role: undefined,
})

export function AdminRoleProvider({
  children,
  role,
}: {
  children: ReactNode
  role: string | undefined
}) {
  return (
    <AdminRoleContext.Provider value={{ isSuperAdmin: role === "SUPER_ADMIN", role }}>
      {children}
    </AdminRoleContext.Provider>
  )
}

export function useAdminRole(): AdminRoleContextValue {
  return useContext(AdminRoleContext)
}

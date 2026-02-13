"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/I18nProvider"
import { AdminUser, UsersPageFilters } from "@/lib/server/adminStats"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toggleUserDisabledAction } from "./actions"
import { toast } from "sonner"

interface AdminUsersTableProps {
  users: AdminUser[]
  total: number
  currentPage: number
  filters: UsersPageFilters
}

export function AdminUsersTable({ users, total, currentPage, filters }: AdminUsersTableProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const pageSize = 25
  const totalPages = Math.ceil(total / pageSize)

  function handlePlanChange(plan: string) {
    router.push(`/admin?page=1&plan=${plan}`)
  }

  function handlePageChange(page: number) {
    router.push(`/admin?page=${page}&plan=${filters.plan}`)
  }

  async function handleToggleDisabled(userId: string, currentlyDisabled: boolean) {
    const confirmed = confirm(
      currentlyDisabled ? t("admin.enableConfirm") : t("admin.disableConfirm")
    )
    
    if (!confirmed) return

    setLoading(userId)
    try {
      const result = await toggleUserDisabledAction(userId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(currentlyDisabled ? t("admin.userEnabled") : t("admin.userDisabled"))
        router.refresh()
      }
    } catch (error) {
      toast.error(t("admin.actionFailed"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">{t("admin.plan")}:</label>
          <Select value={filters.plan} onChange={(e) => handlePlanChange(e.target.value)}>
            <option value="All">{t("admin.planAll")}</option>
            <option value="Free">{t("admin.planFree")}</option>
            <option value="Traveler">{t("admin.planTraveler")}</option>
            <option value="PRO">{t("admin.planPro")}</option>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {t("admin.page")} {currentPage} {t("admin.of")} {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t("admin.email")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t("admin.plan")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t("admin.joined")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t("admin.lastLogin")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t("admin.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className={user.isDisabled ? "bg-slate-50 opacity-60" : "hover:bg-slate-50"}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  <div className="flex items-center gap-2">
                    {user.displayName || "—"}
                    {user.isDisabled && (
                      <span className="text-xs text-red-600 font-medium">
                        ({t("admin.disabled")})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {user.fullName || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {user.email || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                    {t(`admin.plan${user.plan}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {new Date(user.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString(locale)
                    : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleDisabled(user.id, user.isDisabled)}
                    disabled={loading === user.id}
                    className={user.isDisabled ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                  >
                    {loading === user.id
                      ? "..."
                      : user.isDisabled
                      ? t("admin.enable")
                      : t("admin.disable")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}


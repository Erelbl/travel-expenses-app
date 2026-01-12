"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/currency"
import { COUNTRIES } from "@/lib/utils/countries"

interface UserData {
  id: string
  email: string | null
  name: string | null
  nickname: string | null
  image: string | null
  baseCurrency: string
  language: string
}

interface Stats {
  totalTrips: number
  totalExpenses: number
  totalSpentBase: number
  uniqueCountries: number
  topCountries: Array<{
    countryCode: string
    expensesCount: number
    totalSpentBase: number
  }>
}

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [stats, setStats] = useState<{ my: Stats; trips: Stats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    image: "",
    baseCurrency: "USD",
    language: "en",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/me")
      if (!res.ok) throw new Error("Failed to fetch profile")
      const data = await res.json()
      setUser(data.user)
      setStats(data.stats)
      setFormData({
        name: data.user.name || "",
        nickname: data.user.nickname || "",
        image: data.user.image || "",
        baseCurrency: data.user.baseCurrency,
        language: data.user.language,
      })
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      const data = await res.json()
      setUser(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500">Loading...</p>
        </div>
      </PageContainer>
    )
  }

  if (!user || !stats) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500">Failed to load profile</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Manage your account and view statistics" />

      <div className="space-y-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user.email || ""} disabled className="bg-slate-50" />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Display name"
              />
            </div>

            <div>
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <Select
                id="baseCurrency"
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              >
                {["USD", "EUR", "GBP", "ILS", "JPY", "AUD", "CAD", "CHF"].map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="he">עברית</option>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Statistics</h2>
          <Tabs defaultValue="my" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my">שלי</TabsTrigger>
              <TabsTrigger value="trips">כל הטיולים שלי</TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.my.totalTrips}</div>
                    <p className="text-sm text-slate-600">Total Trips</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.my.totalExpenses}</div>
                    <p className="text-sm text-slate-600">Total Expenses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.my.totalSpentBase, user.baseCurrency)}
                    </div>
                    <p className="text-sm text-slate-600">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.my.uniqueCountries}</div>
                    <p className="text-sm text-slate-600">Countries</p>
                  </CardContent>
                </Card>
              </div>

              {stats.my.topCountries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.my.topCountries.map((country) => {
                        const countryData = COUNTRIES.find((c) => c.code === country.countryCode)
                        return (
                          <div key={country.countryCode} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{countryData?.flag || "🏳️"}</span>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {countryData?.name || country.countryCode}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {country.expensesCount} expense{country.expensesCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(country.totalSpentBase, user.baseCurrency)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trips" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.trips.totalTrips}</div>
                    <p className="text-sm text-slate-600">Total Trips</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.trips.totalExpenses}</div>
                    <p className="text-sm text-slate-600">Total Expenses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.trips.totalSpentBase, user.baseCurrency)}
                    </div>
                    <p className="text-sm text-slate-600">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.trips.uniqueCountries}</div>
                    <p className="text-sm text-slate-600">Countries</p>
                  </CardContent>
                </Card>
              </div>

              {stats.trips.topCountries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.trips.topCountries.map((country) => {
                        const countryData = COUNTRIES.find((c) => c.code === country.countryCode)
                        return (
                          <div key={country.countryCode} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{countryData?.flag || "🏳️"}</span>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {countryData?.name || country.countryCode}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {country.expensesCount} expense{country.expensesCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(country.totalSpentBase, user.baseCurrency)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  )
}


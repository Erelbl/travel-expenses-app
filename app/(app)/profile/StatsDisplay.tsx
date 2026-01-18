"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/currency"
import { COUNTRIES } from "@/lib/utils/countries"

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

interface StatsDisplayProps {
  stats: {
    my: Stats
    trips: Stats
  }
  baseCurrency: string
}

export function StatsDisplay({ stats, baseCurrency }: StatsDisplayProps) {
  return (
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
                  {formatCurrency(stats.my.totalSpentBase, baseCurrency)}
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
                          {formatCurrency(country.totalSpentBase, baseCurrency)}
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
                  {formatCurrency(stats.trips.totalSpentBase, baseCurrency)}
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
                          {formatCurrency(country.totalSpentBase, baseCurrency)}
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
  )
}


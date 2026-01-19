import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TripAccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <XCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Not Allowed
          </h2>
          <div className="space-y-3 text-left text-slate-600 mb-6">
            <p>
              You don't have permission to view this trip.
            </p>
            <p>
              This trip may have been shared with a different email address. Please check your email for an invitation link, or contact the trip owner.
            </p>
          </div>
          <Link href="/app">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}


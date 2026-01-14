import { redirect } from "next/navigation"
import { verifyEmailAction } from "../actions"
import { PageContainer } from "@/components/ui/page-container"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <PageContainer>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Invalid Link</h1>
              <p className="text-slate-600">This verification link is invalid.</p>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  const result = await verifyEmailAction(token)

  if (result.error) {
    return (
      <PageContainer>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
              <p className="text-slate-600">{result.error}</p>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  redirect("/profile?verified=true")
}


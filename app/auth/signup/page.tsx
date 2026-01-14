import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignupForm } from "./SignupForm"
import { PageContainer } from "@/components/ui/page-container"

export default async function SignupPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/trips")
  }

  return (
    <PageContainer>
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
            <p className="text-slate-600">Start tracking your travel expenses</p>
          </div>

          <SignupForm />

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/auth/login" className="font-medium text-sky-600 hover:text-sky-700">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}


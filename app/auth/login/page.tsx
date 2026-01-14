import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "./LoginForm"
import { PageContainer } from "@/components/ui/page-container"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/trips")
  }

  return (
    <PageContainer>
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <a href="/auth/signup" className="font-medium text-sky-600 hover:text-sky-700">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}


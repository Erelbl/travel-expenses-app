import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: January 19, 2026</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              TravelWise helps you track your travel expenses. This privacy policy explains what data we collect,
              how we use it, and your rights regarding your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">What data we collect</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              When you use TravelWise, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Your email address (when you sign in with Google)</li>
              <li>Your name and profile information from Google</li>
              <li>Trip information you create (names, dates, budgets, destinations)</li>
              <li>Expense records you add (amounts, categories, descriptions, dates)</li>
              <li>Trip sharing preferences (who you invite to collaborate)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">How we use your data</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Provide the TravelWise service (storing and displaying your trips and expenses)</li>
              <li>Allow you to share trips with other users</li>
              <li>Send you essential service updates and notifications</li>
              <li>Improve the app based on how it's used</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              <strong>We do not sell your data to third parties.</strong> Your travel information is personal,
              and we treat it that way.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Data security</h2>
            <p className="text-slate-700 leading-relaxed">
              We take reasonable measures to protect your data using industry-standard security practices.
              Your data is stored securely and transmitted over encrypted connections. However, no system is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Your rights</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              You have control over your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>You can view and edit your trips and expenses at any time</li>
              <li>You can delete individual expenses or entire trips</li>
              <li>You can delete your account and all associated data</li>
              <li>You can request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Third-party services</h2>
            <p className="text-slate-700 leading-relaxed">
              TravelWise uses Google for authentication. When you sign in with Google, you're subject to
              Google's privacy policy as well. We also use exchange rate data from external providers to
              convert currencies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Changes to this policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this privacy policy from time to time. When we make significant changes, we'll
              notify you through the app or by email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Contact us</h2>
            <p className="text-slate-700 leading-relaxed">
              If you have questions about this privacy policy or how we handle your data, please contact us at{" "}
              <a href="mailto:support@travelwise.app" className="text-sky-600 hover:text-sky-700 font-medium">
                support@travelwise.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


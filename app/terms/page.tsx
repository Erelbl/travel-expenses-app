import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: January 19, 2026</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              Welcome to TravelWise. By using our service, you agree to these terms. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">What TravelWise does</h2>
            <p className="text-slate-700 leading-relaxed">
              TravelWise is a personal travel expense tracking tool. It helps you organize trips, record expenses,
              convert currencies, and understand your travel spending. You can also share trips with others to
              collaborate on expense tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Your account</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              You can sign up using Google authentication. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Keeping your account secure</li>
              <li>All activity that happens under your account</li>
              <li>The accuracy of the information you enter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Your data and content</h2>
            <p className="text-slate-700 leading-relaxed">
              You own the trips and expenses you create. You're responsible for the data you enter into TravelWise.
              You can edit or delete your trips and expenses at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Service provided "as-is"</h2>
            <p className="text-slate-700 leading-relaxed">
              TravelWise is provided as-is, without warranties of any kind. We strive to keep the service running
              smoothly, but we don't guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Uninterrupted or error-free operation</li>
              <li>100% accurate exchange rates or calculations</li>
              <li>That the service will meet all your specific needs</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              <strong>Important:</strong> TravelWise is not financial software or accounting software. It's a
              personal tracking tool. Always verify important financial information independently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No financial transactions</h2>
            <p className="text-slate-700 leading-relaxed">
              TravelWise does not process payments, store credit card information, or handle any financial
              transactions. We only track expenses you manually enter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Changes to the service</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update, modify, or discontinue features of TravelWise at any time. We'll try to notify
              you of significant changes, but we're not obligated to do so.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Acceptable use</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              When using TravelWise, you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to access other users' private data</li>
              <li>Abuse, harass, or harm other users</li>
              <li>Attempt to disrupt or overload the service</li>
              <li>Reverse engineer or copy the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Termination</h2>
            <p className="text-slate-700 leading-relaxed">
              You can stop using TravelWise at any time and delete your account through the app settings.
              We may suspend or terminate your account if you violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Limitation of liability</h2>
            <p className="text-slate-700 leading-relaxed">
              To the maximum extent permitted by law, TravelWise and its creators are not liable for any
              indirect, incidental, or consequential damages arising from your use of the service. This includes
              lost data, lost profits, or any other losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Changes to these terms</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update these terms from time to time. Continued use of TravelWise after changes means
              you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              Questions about these terms? Contact us at{" "}
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


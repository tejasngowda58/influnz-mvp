import Link from "next/link";
import { Logo } from "../_components/ui/logo";

export const metadata = {
  title: "Privacy Policy — Influnz",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-strong">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: August 3, 2026</p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-6 text-strong">
          <section>
            <h2 className="text-lg font-semibold text-strong">1. Who we are</h2>
            <p className="mt-2">
              Influnz (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a platform connecting Instagram content creators with
              brand managers for paid collaborations. This policy explains what information we
              collect, how we use it, and how you can control it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">2. Information we collect</h2>
            <p className="mt-2">When you create an account, we collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Name, email address, phone number, city, and a hashed password.</li>
              <li>
                For creators: content category, an optional bio, and (if you connect your
                Instagram account) your Instagram username, follower count, account type, and
                profile photo.
              </li>
              <li>For brand managers: company name, work email, company website, and industry.</li>
              <li>Campaign, application, and negotiation details you submit while using the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">3. Instagram data specifically</h2>
            <p className="mt-2">
              If you choose to connect your Instagram account, we use Meta&apos;s official Instagram
              API (with Instagram Login) to read your basic professional profile — username,
              account type, follower count, and profile photo — for the sole purpose of verifying
              your identity and displaying accurate stats to brands on your public profile. We do
              not post to your Instagram account, read your direct messages, or access your
              followers&apos; or following lists.
            </p>
            <p className="mt-2">
              Your Instagram access token is encrypted before storage and is only used to refresh
              this profile data. You can disconnect at any time from your dashboard, which deletes
              the stored token and Instagram-sourced data immediately. If you instead revoke
              access from within Instagram/Facebook&apos;s own settings, we receive an automated
              deauthorization request and delete the same data without any action needed on your
              part.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">4. How we use your information</h2>
            <p className="mt-2">
              We use the information above to operate the marketplace: matching creators with
              brand campaigns, displaying profiles, processing applications and negotiations, and
              maintaining account security. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">5. Data retention and deletion</h2>
            <p className="mt-2">
              You can disconnect your Instagram account at any time from your creator dashboard.
              To request deletion of your account or any personal data, email us at the address
              below, or submit a data deletion request through Instagram&apos;s own app settings if
              you connected via Instagram Login.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">6. Security</h2>
            <p className="mt-2">
              Passwords are hashed with bcrypt and never stored in plain text. Instagram access
              tokens are encrypted at rest. Access to your data is limited to what&apos;s needed to
              operate the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-strong">7. Contact us</h2>
            <p className="mt-2">
              Questions about this policy or a request to delete your data can be sent to{" "}
              <a
                href="mailto:tejasngowda58@gmail.com"
                className="font-medium text-ember hover:text-ember-dark"
              >
                tejasngowda58@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

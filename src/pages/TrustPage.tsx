import { Card } from "@/components/ui/card";
import { ShieldCheck, Lock, Database, Mail, Cookie, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="p-5 space-y-2 bg-card/60 backdrop-blur border-border/60">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </Card>
);

const TrustPage = () => {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-2xl mx-auto space-y-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Trust & Privacy</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          This page is maintained by the Slipstream team to answer common security and privacy
          questions about the Slipstream app. It is editable project content, not an independent
          certification.
        </p>
      </header>

      <Section icon={UserCheck} title="Accounts & Authentication">
        <p>
          Sign-in is handled by our backend provider using industry-standard email + password and
          Google sign-in. Passwords are never stored or visible to us in plain text.
        </p>
        <p>You can delete your account from the Profile screen at any time.</p>
      </Section>

      <Section icon={Database} title="Data We Collect">
        <p>
          We store the information you provide in the app: your display name, saved routes,
          journeys you complete, preferences (such as step-free routing), gamification progress,
          and optional safety contacts.
        </p>
        <p>
          Live bus position lookups use your device location only while you have the live or
          journey screens open. Location is not stored on our servers.
        </p>
      </Section>

      <Section icon={Lock} title="How Your Data Is Protected">
        <p>
          Your personal records are scoped to your account using row-level security. Other users
          cannot read or modify your trips, saved routes, preferences, or safety contacts.
        </p>
        <p>
          Gamification points and streaks are awarded server-side from a fixed schedule of
          challenges, so they cannot be tampered with from a browser.
        </p>
      </Section>

      <Section icon={Cookie} title="Cookies & Analytics">
        <p>
          We use a small number of first-party cookies and local storage entries to keep you
          signed in and remember preferences like the step-free filter. We do not sell your data.
        </p>
      </Section>

      <Section icon={Mail} title="Privacy Requests & Security Contact">
        <p>
          To request a copy or deletion of your data, or to report a security concern, contact
          the Slipstream team at <span className="font-medium text-foreground">privacy@slipstreamgo.live</span>.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="Shared Responsibility">
        <p>
          Slipstream runs on managed cloud infrastructure that provides the underlying database,
          authentication, and serverless function platform. The Slipstream team is responsible for
          the app's data model, access rules, and product behaviour.
        </p>
        <p>
          This page describes current practices and is not a regulatory certification (such as
          SOC 2, ISO 27001, GDPR, or HIPAA compliance).
        </p>
      </Section>

      <div className="text-center pt-2">
        <Link to="/" className="text-sm text-primary underline">
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default TrustPage;

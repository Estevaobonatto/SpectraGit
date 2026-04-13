import * as React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageLayout, type LegalSection } from './LegalPageLayout';

const SECTIONS: LegalSection[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'controller', title: 'Data Controller' },
  { id: 'data-collected', title: 'Data We Process' },
  { id: 'purposes', title: 'Purposes of Processing' },
  { id: 'legal-basis', title: 'Legal Basis (GDPR)' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'security', title: 'Security' },
  { id: 'cookies', title: 'Cookies & Storage' },
  { id: 'no-telemetry', title: 'No Telemetry' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Policy Changes' },
  { id: 'contact', title: 'Contact' },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 pt-10 first:pt-0 border-t border-border first:border-t-0">
      <h2 className="text-base font-semibold text-text-primary mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 pl-1">{children}</ul>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[6px] h-1 w-1 rounded-full bg-primary-400 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-primary-50 border border-primary-100 px-4 py-3 text-sm text-primary-800">
      {children}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="This policy explains what personal data is processed by a SpectraGit instance, how it is used, and what rights you have as a data subject. SpectraGit is self-hosted software — your data never leaves your own infrastructure."
      lastUpdated="April 13, 2026"
      badge="MIT Open Source — No Subscriptions"
      sections={SECTIONS}
    >
      <Section id="overview" title="Overview">
        <Callout>
          <strong className="font-semibold">SpectraGit is self-hosted, open source software.</strong> The SpectraGit
          project has no access to data on any running instance. All data you submit is stored exclusively on the
          infrastructure controlled by the operator of your instance — not by the SpectraGit project.
        </Callout>
        <p>
          SpectraGit is distributed under the{' '}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors"
          >
            MIT License
          </a>
          . It is free software with no subscription plans, no payment processing, and no premium tiers. You may
          inspect, modify, and redistribute the source code.
        </p>
        <p>
          This Privacy Policy describes the categories of personal data that a standard SpectraGit instance is designed
          to process. The operator of the instance you are using may have their own supplementary privacy notice that
          applies in addition to this document.
        </p>
        <p>
          This policy is intended to comply with the{' '}
          <strong className="font-medium text-text-primary">
            General Data Protection Regulation (GDPR, EU 2016/679)
          </strong>
          , the{' '}
          <strong className="font-medium text-text-primary">
            California Consumer Privacy Act / CPRA (CCPA)
          </strong>
          , and the{' '}
          <strong className="font-medium text-text-primary">
            Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018, Brazil)
          </strong>
          .
        </p>
      </Section>

      <Section id="controller" title="Data Controller">
        <p>
          Under GDPR, CCPA, and LGPD, the entity responsible for personal data processed by this SpectraGit
          installation is the <strong className="font-medium text-text-primary">operator of this instance</strong> —
          the individual or organization that deployed and operates this installation.
        </p>
        <p>
          The SpectraGit open source project is a software provider (akin to a data processor or tool author) and is
          not a data controller for any instance except those operated directly by the project contributors.
        </p>
        <p>
          To identify the data controller for this specific installation, contact the system administrator or refer to
          the instance footer or documentation.
        </p>
      </Section>

      <Section id="data-collected" title="Data We Process">
        <p>A standard SpectraGit instance processes the following categories of personal data:</p>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Account Information</h3>
        <Ul>
          <Li>Username and display name</Li>
          <Li>Email address (used for authentication, notifications, and Gravatar-style avatars)</Li>
          <Li>Profile picture / avatar (optionally sourced from OAuth providers)</Li>
          <Li>Biography and profile customization data you choose to provide</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Authentication & Access</h3>
        <Ul>
          <Li>OAuth authentication tokens from third-party providers (GitHub, Google) — stored encrypted</Li>
          <Li>SSH public keys uploaded for Git authentication over SSH</Li>
          <Li>API access tokens (hashed; plaintext is never stored after creation)</Li>
          <Li>Active session identifiers</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Platform Activity</h3>
        <Ul>
          <Li>Repository content: code, commits, branches, tags, and release assets you create or contribute</Li>
          <Li>Issues, pull requests, comments, and review feedback</Li>
          <Li>Organization membership and team assignments</Li>
          <Li>Notification preferences and read/unread state</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Technical & Security Data</h3>
        <Ul>
          <Li>IP addresses associated with authentication events (for security and audit purposes)</Li>
          <Li>Browser and operating system metadata included in session records</Li>
          <Li>Audit log entries recording significant actions (account changes, permission modifications, deletions)</Li>
          <Li>Server-side error logs may incidentally capture request metadata</Li>
        </Ul>
      </Section>

      <Section id="purposes" title="Purposes of Processing">
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">Service delivery:</strong> Providing Git hosting,
            repository management, issue tracking, pull request workflows, and team collaboration features.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Authentication & authorization:</strong> Verifying your
            identity and enforcing access controls on repositories and organizations.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Notifications:</strong> Sending in-app and email
            notifications about activity in repositories you follow or collaborate on.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Security & audit:</strong> Detecting unauthorized access,
            maintaining audit trails, and protecting the integrity of the platform.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Platform improvement:</strong> Understanding feature usage
            to guide development — only via logs on the operator's own infrastructure; no external analytics.
          </Li>
        </Ul>
        <p>
          Data is <strong className="font-medium text-text-primary">never sold</strong> or shared with advertisers.
          Data is not used for profiling, targeted advertising, or any purpose beyond those listed above.
        </p>
      </Section>

      <Section id="legal-basis" title="Legal Basis for Processing (GDPR Art. 6)">
        <p>
          Under the General Data Protection Regulation, each processing activity requires a lawful basis. The following
          applies to a standard SpectraGit deployment:
        </p>
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">Contract performance (Art. 6(1)(b)):</strong>{' '}
            Processing your account information, repository content, and authentication data is necessary to provide the
            platform services you have signed up for.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Legitimate interests (Art. 6(1)(f)):</strong> Security
            monitoring, audit logging, and fraud prevention are carried out under the legitimate interest of maintaining
            platform integrity. This interest does not override your rights where you have grounds to object.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Consent (Art. 6(1)(a)):</strong> Optional features such
            as email notification subscriptions rely on your freely given, specific, and withdrawable consent.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Legal obligation (Art. 6(1)(c)):</strong> Certain data
            may be retained where required by applicable law (e.g., tax records if the operator invoices services).
          </Li>
        </Ul>
      </Section>

      <Section id="retention" title="Data Retention">
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">Account data</strong> is retained for as long as your
            account is active. Upon account deletion, personal identifiers (name, email, avatar) are removed within
            <strong className="font-medium text-text-primary"> 30 days</strong>.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Repository content</strong> you created remains on the
            platform until explicitly deleted by you or the repository owner. Deletions are permanent.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Audit logs</strong> are retained for up to
            <strong className="font-medium text-text-primary"> 90 days</strong> by default for security purposes. The
            operator may configure a different period.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Authentication logs and session data</strong> are
            retained for up to 30 days after a session ends.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">API tokens and SSH keys</strong> are retained until you
            revoke them.
          </Li>
        </Ul>
        <p>
          After the applicable retention period, data is deleted or anonymized such that it can no longer be linked to
          an individual.
        </p>
      </Section>

      <Section id="your-rights" title="Your Rights">
        <p>
          Depending on your location, you are entitled to specific rights regarding your personal data. To exercise any
          of these rights, contact the operator of this SpectraGit instance. Requests will be acknowledged within{' '}
          <strong className="font-medium text-text-primary">72 hours</strong> and fulfilled within the statutory
          timeframe (generally 30 days under GDPR).
        </p>

        <h3 className="text-sm font-semibold text-text-primary mt-6 mb-2">
          European Union — General Data Protection Regulation (GDPR)
        </h3>
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">Right of access (Art. 15):</strong> Obtain confirmation
            that your data is processed and receive a copy of it.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to rectification (Art. 16):</strong> Correct
            inaccurate or incomplete personal data.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to erasure (Art. 17):</strong> Request deletion of
            your personal data where there is no compelling reason for continued processing.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to restriction (Art. 18):</strong> Request that
            processing of your data be restricted in certain circumstances.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to data portability (Art. 20):</strong> Receive
            your data in a structured, machine-readable format (e.g., repository archives, profile export).
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to object (Art. 21):</strong> Object to processing
            based on legitimate interests.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Rights on automated decisions (Art. 22):</strong>{' '}
            SpectraGit does not make solely automated decisions with legal or similarly significant effects on users.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">Right to lodge a complaint:</strong> You may contact
            your national data protection authority (e.g., CNIL in France, BfDI in Germany, ICO in the UK) if you
            believe your rights have been infringed.
          </Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-6 mb-2">
          California, USA — CCPA / CPRA
        </h3>
        <Ul>
          <Li>Right to know the categories and specific pieces of personal information collected about you.</Li>
          <Li>Right to delete personal information, subject to certain exceptions.</Li>
          <Li>
            Right to opt out of the sale or sharing of personal information.{' '}
            <strong className="font-medium text-text-primary">
              SpectraGit does not sell or share personal information for cross-context behavioral advertising.
            </strong>
          </Li>
          <Li>Right to correct inaccurate personal information.</Li>
          <Li>Right to limit the use and disclosure of sensitive personal information.</Li>
          <Li>Right to non-discrimination for exercising any of the above rights.</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-6 mb-2">
          Brazil — LGPD (Lei 13.709/2018)
        </h3>
        <Ul>
          <Li>Confirmação da existência de tratamento e acesso aos dados (Art. 18, I e II).</Li>
          <Li>Correção de dados incompletos, inexatos ou desatualizados (Art. 18, III).</Li>
          <Li>
            Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com
            a LGPD (Art. 18, IV).
          </Li>
          <Li>Portabilidade dos dados a outro fornecedor de serviço (Art. 18, V).</Li>
          <Li>Eliminação dos dados pessoais tratados com o consentimento do titular (Art. 18, VI).</Li>
          <Li>
            Informação sobre entidades públicas e privadas com as quais o controlador realizou uso compartilhado de
            dados (Art. 18, VII).
          </Li>
          <Li>Revogação do consentimento (Art. 18, IX).</Li>
          <Li>
            Você pode encaminhar petição à Autoridade Nacional de Proteção de Dados (ANPD) se considerar que seus
            direitos foram violados.
          </Li>
        </Ul>
      </Section>

      <Section id="security" title="Security">
        <p>
          The SpectraGit software implements the following security measures as defaults. The actual security of a
          deployment depends on the infrastructure configuration maintained by the operator.
        </p>
        <Ul>
          <Li>All HTTP traffic is expected to be served over TLS (HTTPS); unencrypted connections are not recommended.</Li>
          <Li>Passwords are hashed using a modern, salted algorithm; plaintext passwords are never stored.</Li>
          <Li>OAuth tokens are stored in encrypted form in the database.</Li>
          <Li>API tokens are hashed and displayed only once at creation time.</Li>
          <Li>SSH authentication uses public-key cryptography; private keys are never transmitted or stored.</Li>
          <Li>
            Session tokens are cryptographically random and are invalidated on sign-out and when a security event is
            detected.
          </Li>
        </Ul>
        <p>
          If you discover a security vulnerability in the SpectraGit software, please report it responsibly through the
          project's GitHub repository issue tracker or security contact.
        </p>
      </Section>

      <Section id="cookies" title="Cookies & Local Storage">
        <p>
          SpectraGit uses only the minimum cookies and browser storage required for the platform to function. No
          third-party tracking cookies, analytics cookies, or advertising pixels are set.
        </p>
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">Session cookie:</strong> A secure, HttpOnly cookie that
            identifies your authenticated session. Expires when you sign out or the session lapses.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">CSRF token:</strong> A cookie used to prevent cross-site
            request forgery attacks.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">localStorage / sessionStorage:</strong> The frontend may
            store non-sensitive UI preferences (e.g., theme, collapsed panels) locally in your browser. This data is
            never transmitted to the server.
          </Li>
        </Ul>
        <p>
          Because only strictly necessary cookies are used, no consent banner is required under the EU ePrivacy
          Directive for these cookies. You may clear cookies at any time via your browser settings; doing so will sign
          you out.
        </p>
      </Section>

      <Section id="no-telemetry" title="No Telemetry">
        <Callout>
          <strong className="font-semibold">SpectraGit contains no telemetry.</strong> No usage statistics, error
          reports, analytics events, or identifying data are transmitted from your instance to the SpectraGit project
          or any third party. This is verifiable by inspecting the source code.
        </Callout>
        <p>
          The source code is publicly available at the project repository under the MIT License. You may audit every
          network request the software makes. Self-hosted means truly self-hosted: your data stays on your servers,
          visible only to you and your team.
        </p>
        <p>
          There is no CDN-loaded analytics script, no crash reporting SDK, no feature-flag service, and no licensing
          check that phones home. The software functions fully offline on an air-gapped network.
        </p>
      </Section>

      <Section id="children" title="Children's Privacy">
        <p>
          SpectraGit is not directed at children. Under GDPR, the minimum age for processing personal data based on
          consent is{' '}
          <strong className="font-medium text-text-primary">16 years</strong> (or lower where member states permit, but
          not below 13). Under COPPA (USA), persons under 13 may not use the service without verifiable parental
          consent. LGPD requires particular care for data belonging to children under 12.
        </p>
        <p>
          Operators are responsible for implementing age verification measures appropriate to their jurisdiction and
          ensuring minors are not processed without the required legal basis.
        </p>
      </Section>

      <Section id="changes" title="Policy Changes">
        <p>
          This Privacy Policy may be updated to reflect changes in the SpectraGit software features or applicable
          legal requirements. Material changes will be communicated via:
        </p>
        <Ul>
          <Li>A notice displayed on the platform for active users;</Li>
          <Li>An in-app notification via the notifications system;</Li>
          <Li>An announcement in the project's public repository.</Li>
        </Ul>
        <p>
          Updated policies will include a revised "Last updated" date at the top of this page. Continued use of the
          platform after the effective date of changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          For questions or requests related to the personal data processed by{' '}
          <strong className="font-medium text-text-primary">this instance</strong>, contact the{' '}
          <strong className="font-medium text-text-primary">system administrator</strong> of this installation.
          Instance contact details should be available in the platform footer or administration documentation.
        </p>
        <p>
          For questions about the SpectraGit <em>software</em> itself (not a specific deployment), open an issue or
          discussion in the project's public repository on GitHub.
        </p>
        <p>
          See also:{' '}
          <Link to="/terms" className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
            Terms of Service
          </Link>
        </p>
      </Section>
    </LegalPageLayout>
  );
}

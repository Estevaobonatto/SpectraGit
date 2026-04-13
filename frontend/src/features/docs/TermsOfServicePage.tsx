import * as React from 'react';
import { Link } from 'react-router-dom';
import { LegalPageLayout, type LegalSection } from './LegalPageLayout';

const SECTIONS: LegalSection[] = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'about', title: 'About SpectraGit' },
  { id: 'license', title: 'MIT Open Source License' },
  { id: 'no-payment', title: 'No Payment or Subscription' },
  { id: 'account', title: 'Your Account' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'content-ip', title: 'Content & Intellectual Property' },
  { id: 'disclaimer', title: 'Disclaimer of Warranties' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'changes', title: 'Changes to These Terms' },
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

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These terms govern your use of any SpectraGit installation. SpectraGit is free, open source software with no subscription plans or payment requirements of any kind."
      lastUpdated="April 13, 2026"
      badge="MIT Open Source — No Subscriptions"
      sections={SECTIONS}
    >
      <Section id="acceptance" title="Acceptance of Terms">
        <p>
          By accessing or using a SpectraGit installation, you agree to be bound by these Terms of Service and our{' '}
          <Link to="/privacy" className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
            Privacy Policy
          </Link>
          . If you do not agree to these terms, do not use the platform.
        </p>
        <p>
          These terms apply to all users of a SpectraGit instance, including registered users, guests browsing public
          repositories, and system administrators.
        </p>
        <p>
          The operator of this SpectraGit instance may impose additional terms or restrictions that supplement these
          baseline terms. Where a conflict exists, the operator's additional terms take precedence within their
          deployment.
        </p>
      </Section>

      <Section id="about" title="About SpectraGit">
        <Callout>
          <strong className="font-semibold">SpectraGit is self-hosted Git platform software.</strong> It is not a
          cloud service or SaaS product. Each installation is independently operated on infrastructure owned or
          controlled by the instance operator. The SpectraGit project provides the software; the operator provides and
          controls the deployment.
        </Callout>
        <p>
          SpectraGit provides Git repository hosting, issue tracking, pull request workflows, team management,
          organization support, release management, and a REST API. It implements the standard Git HTTP and SSH
          protocols.
        </p>
        <p>
          Because SpectraGit is self-hosted, the availability, performance, backup policy, and uptime of any given
          instance are the sole responsibility of the operator. The SpectraGit project makes no guarantees regarding
          installations it does not directly operate.
        </p>
      </Section>

      <Section id="license" title="MIT Open Source License">
        <p>
          The SpectraGit software is distributed under the{' '}
          <strong className="font-medium text-text-primary">MIT License</strong>. The full text of the license is
          available in the project repository and reproduced in part here:
        </p>
        <div className="rounded-[var(--radius-md)] border border-border bg-background font-mono text-xs leading-relaxed px-4 py-3 text-text-secondary">
          <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
          associated documentation files (the "Software"), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
          following conditions:</p>
          <p className="mt-2">The above copyright notice and this permission notice shall be included in all copies or
          substantial portions of the Software.</p>
        </div>
        <p>
          In plain terms: you are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies
          of SpectraGit. You may deploy it commercially. You may fork it. You must preserve the copyright notice and
          MIT license text in all distributions.
        </p>
      </Section>

      <Section id="no-payment" title="No Payment or Subscription">
        <Callout>
          <strong className="font-semibold">SpectraGit is and will remain free software.</strong> There are no
          subscription plans, no premium tiers, no payment portals, no licensing fees, and no feature gates behind
          a paywall. You will never be asked to pay to use SpectraGit.
        </Callout>
        <p>
          SpectraGit does not process financial transactions of any kind. If a website or service claims to sell
          "SpectraGit licenses" or subscription access to SpectraGit features, that entity is not affiliated with the
          SpectraGit project.
        </p>
        <p>
          All features described in the software documentation are available to all users of any instance at no cost.
          Operators running the software may choose to operate it as a paid hosting service under their own commercial
          terms, but the software itself carries no cost obligations.
        </p>
      </Section>

      <Section id="account" title="Your Account">
        <Ul>
          <Li>
            You are responsible for maintaining the confidentiality of your account credentials, including your
            password, SSH private keys, and API tokens.
          </Li>
          <Li>
            You must notify the instance administrator immediately if you suspect unauthorized access to your account.
          </Li>
          <Li>
            You are responsible for all activity that occurs under your account, whether or not you authorized it.
          </Li>
          <Li>
            You must not create accounts for automated abuse, impersonate other users, or register with false
            identifying information.
          </Li>
          <Li>
            One person may maintain multiple accounts only for legitimate purposes (e.g., personal vs. work); operating
            multiple accounts to circumvent restrictions is prohibited.
          </Li>
        </Ul>
        <p>
          Account deletion is available at any time from your account settings. Upon deletion, your personal
          information is removed as described in the{' '}
          <Link to="/privacy" className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section id="acceptable-use" title="Acceptable Use">
        <p>
          You agree not to use SpectraGit to engage in any of the following activities:
        </p>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Prohibited Content</h3>
        <Ul>
          <Li>Content that is illegal in the operator's jurisdiction or the user's jurisdiction.</Li>
          <Li>Child sexual abuse material (CSAM) or any content that sexually exploits minors.</Li>
          <Li>Content that promotes or facilitates real-world violence, terrorism, or hate crimes.</Li>
          <Li>Malware, ransomware, spyware, or other malicious code intended to harm systems or users.</Li>
          <Li>Private personal information published without the subject's explicit consent (doxxing).</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Prohibited Actions</h3>
        <Ul>
          <Li>Unauthorized access to or probing of other users' private repositories.</Li>
          <Li>Circumventing authentication, authorization, or rate-limiting mechanisms.</Li>
          <Li>Automated scraping, crawling, or bulk data extraction beyond normal API use.</Li>
          <Li>Sending unsolicited communications (spam) to other users via the platform's notification system.</Li>
          <Li>Attempting to destabilize the platform or conduct denial-of-service attacks.</Li>
          <Li>Using the platform to violate intellectual property rights of third parties.</Li>
        </Ul>

        <h3 className="text-sm font-semibold text-text-primary mt-5 mb-2">Enforcement</h3>
        <p>
          Instance operators have the authority to suspend or terminate accounts, remove repositories, and take any
          other action necessary to enforce these terms. The operator's decisions regarding enforcement on their
          instance are final.
        </p>
      </Section>

      <Section id="content-ip" title="Content & Intellectual Property">
        <p>
          <strong className="font-medium text-text-primary">Your content belongs to you.</strong> By using SpectraGit,
          you do not grant the SpectraGit project any license to your code, issues, comments, or other content. Your
          repositories, their contents, and all intellectual property rights therein remain yours or belong to your
          organization.
        </p>
        <p>
          By posting content on a SpectraGit instance, you grant the <em>operator</em> a limited, non-exclusive,
          royalty-free license to store, display, and serve that content for the purposes of providing the platform
          service. This license terminates when you delete the content or your account.
        </p>
        <p>
          You are responsible for ensuring that content you upload does not infringe the intellectual property rights
          of others. The operator will respond to valid takedown requests in accordance with applicable law (e.g.,
          DMCA in the USA, Articles 8–9 of the EU Copyright Directive).
        </p>
        <p>
          The SpectraGit name, logo, and project identity are the property of their respective contributors. The MIT
          License does not grant trademark rights; you may not use the SpectraGit name to imply endorsement of a fork
          or derivative without permission.
        </p>
      </Section>

      <Section id="disclaimer" title="Disclaimer of Warranties">
        <p>
          THE SOFTWARE IS PROVIDED{' '}
          <strong className="font-medium text-text-primary">"AS IS"</strong>, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          AND NONINFRINGEMENT.
        </p>
        <p>
          The SpectraGit project does not warrant that:
        </p>
        <Ul>
          <Li>The software will meet your specific requirements;</Li>
          <Li>The software will be error-free, uninterrupted, or available at all times;</Li>
          <Li>Any errors in the software will be corrected within any specific timeframe;</Li>
          <Li>Data stored in any SpectraGit instance will not be lost.</Li>
        </Ul>
        <p>
          You are solely responsible for maintaining backups of any data stored on a SpectraGit instance. Always keep
          an independent copy of any critical repositories and data.
        </p>
      </Section>

      <Section id="liability" title="Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE SPECTRAGIT PROJECT CONTRIBUTORS,
          COPYRIGHT HOLDERS, OR INSTANCE OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
          CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF
          USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
          CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE), ARISING IN ANY WAY OUT OF THE USE
          OF THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of implied warranties or limitation of liability for incidental
          or consequential damages, so the above exclusions and limitations may not apply to you in full. In such
          jurisdictions, liability is limited to the greatest extent permitted by law.
        </p>
        <p>
          Because SpectraGit involves no financial transactions and no subscription fees, there is no monetary
          consideration paid that could form a basis for financial compensation claims against the project.
        </p>
      </Section>

      <Section id="indemnification" title="Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless the SpectraGit contributors, the operator of this
          instance, and their respective officers, employees, and agents from and against any claims, liabilities,
          damages, losses, and expenses (including legal fees) arising out of or in connection with:
        </p>
        <Ul>
          <Li>Your use of the platform in violation of these Terms;</Li>
          <Li>Content you upload, publish, or transmit via the platform;</Li>
          <Li>Your violation of any third-party intellectual property, privacy, or other rights;</Li>
          <Li>Your violation of any applicable law or regulation.</Li>
        </Ul>
      </Section>

      <Section id="governing-law" title="Governing Law & Jurisdiction">
        <p>
          Because SpectraGit is self-hosted software deployed in many jurisdictions, the applicable governing law
          depends on the location and legal entity of the instance operator.
        </p>
        <Ul>
          <Li>
            <strong className="font-medium text-text-primary">For the software itself</strong> (open source project
            disputes, MIT license interpretation): The laws of the jurisdiction where the project's primary
            contributors are domiciled, or alternatively the laws of a mutually agreed neutral jurisdiction.
          </Li>
          <Li>
            <strong className="font-medium text-text-primary">For a specific deployment</strong>: the governing law is
            that of the jurisdiction in which the operator is established. The operator should disclose their
            applicable law in their supplemental terms.
          </Li>
          <Li>
            Users in the European Union retain all rights provided by EU consumer protection law regardless of any
            governing law clause that would result in a lower level of protection.
          </Li>
          <Li>
            Users in Brazil retain all rights under the LGPD and the Brazilian Consumer Defense Code (CDC) regardless
            of any conflicting governing law clause.
          </Li>
        </Ul>
      </Section>

      <Section id="changes" title="Changes to These Terms">
        <p>
          The SpectraGit project may update these baseline Terms of Service to reflect changes in the software or
          applicable law. Changes will be communicated via:
        </p>
        <Ul>
          <Li>An announcement commit in the project's public repository with a clear description of changes;</Li>
          <Li>A notification via the platform's in-app notification system for active users;</Li>
          <Li>An updated "Last updated" date at the top of this page.</Li>
        </Ul>
        <p>
          Continued use of the platform following the effective date of any changes constitutes your acceptance of the
          revised terms. If you do not agree to updated terms, you may delete your account at any time from Account
          Settings.
        </p>
        <p>
          For changes that materially restrict your rights, we will provide at least{' '}
          <strong className="font-medium text-text-primary">30 days' advance notice</strong> before the new terms take
          effect.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          For questions about these Terms of Service as they apply to{' '}
          <strong className="font-medium text-text-primary">this specific instance</strong>, contact the system
          administrator of this installation.
        </p>
        <p>
          For questions or contributions regarding the SpectraGit project's terms and policies, open an issue or
          discussion in the public project repository.
        </p>
        <p>
          See also:{' '}
          <Link to="/privacy" className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </Section>
    </LegalPageLayout>
  );
}

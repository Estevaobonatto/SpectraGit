import { CodeBlock } from './shared';

export function ArchitectureDiagram() {
  return (
    <div className="relative p-6 rounded-xl border border-border bg-surface overflow-x-auto">
      <svg viewBox="0 0 900 520" className="w-full max-w-3xl mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Client */}
        <rect x="340" y="10" width="220" height="56" rx="14" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2" />
        <text x="450" y="38" textAnchor="middle" className="fill-primary-700 text-sm font-semibold" fontSize="14" fontWeight="600">Cliente (Browser / App)</text>
        <text x="450" y="54" textAnchor="middle" className="fill-primary-400 text-xs" fontSize="11">React SPA — Porta 5174</text>

        {/* Arrow Client → API */}
        <line x1="450" y1="66" x2="450" y2="110" stroke="#c4b5fd" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="465" y="92" className="fill-text-tertiary" fontSize="10">HTTPS / REST</text>

        {/* API Gateway */}
        <rect x="280" y="110" width="340" height="56" rx="14" fill="#ede9fe" stroke="#a78bfa" strokeWidth="2" />
        <text x="450" y="138" textAnchor="middle" className="fill-primary-800 text-sm font-semibold" fontSize="14" fontWeight="600">NestJS API — /api/v1</text>
        <text x="450" y="154" textAnchor="middle" className="fill-primary-500 text-xs" fontSize="11">Porta 3000 — JWT Auth, Validation, Swagger</text>

        {/* Arrows from API */}
        <line x1="350" y1="166" x2="160" y2="220" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="450" y1="166" x2="450" y2="220" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="550" y1="166" x2="740" y2="220" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* PostgreSQL */}
        <rect x="60" y="220" width="200" height="56" rx="14" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
        <text x="160" y="248" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-emerald-700">PostgreSQL</text>
        <text x="160" y="264" textAnchor="middle" fontSize="11" className="fill-emerald-500">Prisma ORM — Dados</text>

        {/* Modules Box */}
        <rect x="310" y="220" width="280" height="180" rx="14" fill="#faf5ff" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="6 3" />
        <text x="450" y="244" textAnchor="middle" fontSize="12" fontWeight="600" className="fill-primary-600">Módulos do Backend</text>

        {/* Module items */}
        <rect x="325" y="256" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="385" y="274" textAnchor="middle" fontSize="10" className="fill-text-secondary">Auth / Users</text>
        <rect x="455" y="256" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="515" y="274" textAnchor="middle" fontSize="10" className="fill-text-secondary">Repositories</text>
        <rect x="325" y="292" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="385" y="310" textAnchor="middle" fontSize="10" className="fill-text-secondary">Issues / PRs</text>
        <rect x="455" y="292" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="515" y="310" textAnchor="middle" fontSize="10" className="fill-text-secondary">Branches / Tags</text>
        <rect x="325" y="328" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="385" y="346" textAnchor="middle" fontSize="10" className="fill-text-secondary">Orgs / Collabs</text>
        <rect x="455" y="328" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="515" y="346" textAnchor="middle" fontSize="10" className="fill-text-secondary">Notifications</text>
        <rect x="325" y="364" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="385" y="382" textAnchor="middle" fontSize="10" className="fill-text-secondary">Reviews / Releases</text>
        <rect x="455" y="364" width="120" height="28" rx="8" fill="#f5f3ff" stroke="#e7e2f3" strokeWidth="1" />
        <text x="515" y="382" textAnchor="middle" fontSize="10" className="fill-text-secondary">Admin / Audit</text>

        {/* Redis + BullMQ */}
        <rect x="640" y="220" width="200" height="56" rx="14" fill="#fef3c7" stroke="#fbbf24" strokeWidth="2" />
        <text x="740" y="248" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-amber-700">Redis</text>
        <text x="740" y="264" textAnchor="middle" fontSize="11" className="fill-amber-500">BullMQ — Filas / Cache</text>

        {/* Git Storage */}
        <rect x="640" y="300" width="200" height="56" rx="14" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="2" />
        <text x="740" y="328" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-sky-700">Git Storage</text>
        <text x="740" y="344" textAnchor="middle" fontSize="11" className="fill-sky-500">Filesystem — Bare Repos</text>

        <line x1="590" y1="350" x2="640" y2="330" stroke="#7dd3fc" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* GitHub API */}
        <rect x="640" y="380" width="200" height="56" rx="14" fill="#f5f5f5" stroke="#d4d4d4" strokeWidth="2" />
        <text x="740" y="408" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-gray-700">GitHub API</text>
        <text x="740" y="424" textAnchor="middle" fontSize="11" className="fill-gray-500">Sync / Import (Opcional)</text>

        <line x1="590" y1="385" x2="640" y2="406" stroke="#d4d4d4" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Data Flow */}
        <rect x="100" y="430" width="700" height="70" rx="14" fill="#fefce8" stroke="#fde68a" strokeWidth="1.5" />
        <text x="450" y="455" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-amber-800">Fluxo de Dados</text>
        <text x="450" y="475" textAnchor="middle" fontSize="11" className="fill-amber-600">
          Cliente → REST API → Validação → Guards → Controller → Service → Prisma/Git → Response Wrapper
        </text>
        <text x="450" y="490" textAnchor="middle" fontSize="10" className="fill-amber-500">
          Jobs assíncronos: GitHub Sync, Git Reconciliation via BullMQ queues
        </text>

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#a78bfa" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export function AuthFlowDiagram() {
  return (
    <div className="relative p-6 rounded-xl border border-border bg-surface overflow-x-auto">
      <svg viewBox="0 0 800 300" className="w-full max-w-2xl mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* User */}
        <rect x="20" y="120" width="120" height="50" rx="12" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2" />
        <text x="80" y="150" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-primary-700">Usuário</text>

        {/* Step 1 */}
        <line x1="140" y1="145" x2="210" y2="145" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arr2)" />
        <text x="175" y="138" textAnchor="middle" fontSize="9" className="fill-text-tertiary">1. Login</text>

        {/* SpectraGit */}
        <rect x="210" y="110" width="150" height="70" rx="12" fill="#ede9fe" stroke="#a78bfa" strokeWidth="2" />
        <text x="285" y="140" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-primary-800">SpectraGit</text>
        <text x="285" y="158" textAnchor="middle" fontSize="10" className="fill-primary-500">/api/v1/auth</text>

        {/* Step 2 */}
        <line x1="360" y1="130" x2="440" y2="80" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arr2)" />
        <text x="410" y="95" textAnchor="middle" fontSize="9" className="fill-text-tertiary">2. Redirect</text>

        {/* OAuth Provider */}
        <rect x="440" y="50" width="160" height="60" rx="12" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
        <text x="520" y="76" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-emerald-700">Google / GitHub</text>
        <text x="520" y="96" textAnchor="middle" fontSize="10" className="fill-emerald-500">OAuth Provider</text>

        {/* Step 3 */}
        <line x1="520" y1="110" x2="520" y2="170" stroke="#6ee7b7" strokeWidth="2" markerEnd="url(#arr2)" />
        <text x="545" y="145" textAnchor="middle" fontSize="9" className="fill-text-tertiary">3. Callback</text>

        {/* Token Generation */}
        <rect x="440" y="170" width="160" height="60" rx="12" fill="#faf5ff" stroke="#ddd6fe" strokeWidth="2" />
        <text x="520" y="196" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-primary-700">JWT Token</text>
        <text x="520" y="214" textAnchor="middle" fontSize="10" className="fill-primary-400">Access + Refresh</text>

        {/* Step 4 */}
        <line x1="440" y1="200" x2="360" y2="165" stroke="#ddd6fe" strokeWidth="2" markerEnd="url(#arr2)" />
        <text x="390" y="175" textAnchor="middle" fontSize="9" className="fill-text-tertiary">4. Tokens</text>

        {/* Step 5 */}
        <rect x="210" y="220" width="390" height="50" rx="12" fill="#fefce8" stroke="#fde68a" strokeWidth="1.5" />
        <text x="405" y="244" textAnchor="middle" fontSize="11" fontWeight="500" className="fill-amber-700">
          5. Requests autenticados: Authorization: Bearer &lt;accessToken&gt;
        </text>
        <text x="405" y="260" textAnchor="middle" fontSize="10" className="fill-amber-500">
          Token expirado? POST /api/v1/auth/refresh para renovar
        </text>

        <defs>
          <marker id="arr2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#a78bfa" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export function ResponseFormatDiagram() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-success mb-2 uppercase tracking-wider">✓ Resposta de Sucesso</p>
        <CodeBlock code={`{
  "data": {
    "id": "uuid-aqui",
    "name": "meu-repo",
    "visibility": "PUBLIC",
    "createdAt": "2026-04-11T00:00:00.000Z"
  },
  "meta": {
    "requestId": "req-uuid",
    "timestamp": "2026-04-11T12:00:00.000Z"
  },
  "error": null
}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-error mb-2 uppercase tracking-wider">✕ Resposta de Erro</p>
        <CodeBlock code={`{
  "data": null,
  "meta": {
    "requestId": "req-uuid",
    "timestamp": "2026-04-11T12:00:00.000Z"
  },
  "error": {
    "statusCode": 404,
    "message": "Repository not found",
    "error": "Not Found"
  }
}`} />
      </div>
    </div>
  );
}

export function WorkflowDiagram() {
  return (
    <div className="relative p-5 rounded-xl border border-border bg-surface overflow-x-auto">
      <svg viewBox="0 0 700 120" className="w-full max-w-2xl mx-auto" fill="none">
        {/* Step boxes */}
        {[
          { x: 0, label: 'POST /repos', sub: 'Criar repo' },
          { x: 150, label: 'POST /branches', sub: 'Criar branch' },
          { x: 300, label: 'POST /pulls', sub: 'Criar PR' },
          { x: 450, label: 'POST /reviews', sub: 'Review ✓' },
          { x: 580, label: 'POST /merge', sub: 'Merge!' },
        ].map((step, i) => (
          <g key={i}>
            <rect x={step.x} y="30" width="120" height="56" rx="12" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1.5" />
            <text x={step.x + 60} y="54" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-primary-700">{step.label}</text>
            <text x={step.x + 60} y="72" textAnchor="middle" fontSize="9" className="fill-primary-400">{step.sub}</text>
            {i < 4 && <line x1={step.x + 120} y1="58" x2={step.x + 150} y2="58" stroke="#c4b5fd" strokeWidth="1.5" markerEnd="url(#arr3)" />}
          </g>
        ))}
        <defs>
          <marker id="arr3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#c4b5fd" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

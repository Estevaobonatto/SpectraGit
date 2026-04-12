import { Shield, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AuthFlowDiagram } from '../components/diagrams';
import { CodeBlock } from '../components/shared';
import { SectionEndpoints } from '../components/SectionEndpoints';
import { AUTH_ENDPOINTS } from '../data/endpoints';

export default function AuthenticationSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary-100">
          <Shield className="h-5 w-5 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Autenticação</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <p className="text-text-secondary leading-relaxed">
            O SpectraGit usa <strong className="text-text-primary">OAuth 2.0</strong> com Google e GitHub como provedores.
            Após autenticação, o sistema retorna tokens JWT (<strong>accessToken</strong> + <strong>refreshToken</strong>).
          </p>

          <h3 className="text-sm font-semibold text-text-primary">Fluxo de Autenticação OAuth</h3>
          <AuthFlowDiagram />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Como usar o token</h3>
            <p className="text-sm text-text-secondary">Inclua o token no header <code className="text-primary-600">Authorization</code> de todas as requisições protegidas:</p>
            <CodeBlock language="http" code={`GET /api/v1/me HTTP/1.1
Host: your-spectragit-instance.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json`} />

            <h3 className="text-sm font-semibold text-text-primary">Renovação de Token</h3>
            <p className="text-sm text-text-secondary">Quando o accessToken expirar, use o refreshToken para obter um novo par:</p>
            <CodeBlock code={`POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "seu-refresh-token-aqui"
}

// Resposta:
{
  "data": {
    "accessToken": "novo-access-token",
    "refreshToken": "novo-refresh-token",
    "expiresIn": "15m"
  }
}`} language="http" />
          </div>
        </CardContent>
      </Card>

      <SectionEndpoints title="Endpoints de Autenticação" icon={Key} endpoints={AUTH_ENDPOINTS} />
    </div>
  );
}

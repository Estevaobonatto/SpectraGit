import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit state-changing operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user) return next.handle();

    const path = request.route?.path || request.url;
    const action = `${method} ${path}`;

    return next.handle().pipe(
      tap((response) => {
        const resourceId = response?.id || request.params?.id || 'unknown';
        const resource = this.extractEntityType(path);

        this.auditService
          .log({
            userId: user.sub,
            action,
            resource,
            resourceId: String(resourceId),
            metadata: { params: request.params, body: this.sanitizeBody(request.body) },
            ipAddress: request.ip,
          })
          .catch(() => {
            // Audit logging should not block requests
          });
      }),
    );
  }

  private extractEntityType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    // Find the main resource segment (skip 'api', 'v1', params like ':id')
    for (const seg of segments) {
      if (!seg.startsWith(':') && !['api', 'v1'].includes(seg)) {
        return seg;
      }
    }
    return 'unknown';
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'accessToken', 'refreshToken'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
  }
}

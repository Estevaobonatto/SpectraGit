import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.systemRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException('System administrator access required');
    }

    return true;
  }
}

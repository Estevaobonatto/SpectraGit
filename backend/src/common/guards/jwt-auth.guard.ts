import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Always attempt JWT authentication so request.user is populated even on
    // public routes (enables per-user flags like isPulsed/isWatched on @Public GET endpoints)
    return super.canActivate(context);
  }

  handleRequest<TUser extends object>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser | null {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // On public routes authentication is optional: populate user when token is
    // valid but do NOT throw when it is absent or invalid
    if (isPublic) {
      return user || null;
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

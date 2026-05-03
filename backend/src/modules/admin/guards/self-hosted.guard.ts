import { CanActivate, ExecutionContext, NotFoundException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SelfHostedGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    const mode = this.configService.get<string>('deployment.mode', 'self-hosted');
    if (mode !== 'self-hosted') {
      throw new NotFoundException();
    }
    return true;
  }
}

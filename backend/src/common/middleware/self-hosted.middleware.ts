import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SelfHostedMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const mode = this.configService.get<string>('deployment.mode', 'self-hosted');
    if (mode !== 'self-hosted') {
      const url = req.originalUrl || req.url || req.path;
      if (url.includes('/admin') || url.includes('/setup')) {
        res.status(404).json({
          statusCode: 404,
          message: 'Not Found',
        });
        return;
      }
    }
    next();
  }
}

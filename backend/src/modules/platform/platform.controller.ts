import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getStats() {
    return this.platformService.getStats();
  }

  @Public()
  @Get('activity')
  @ApiOperation({ summary: 'Get recent global public activity' })
  async getGlobalActivity(@Query('limit') limit?: string) {
    return this.platformService.getGlobalActivity(Math.min(Number(limit) || 20, 50));
  }

  @Public()
  @Get('topics')
  @ApiOperation({ summary: 'Get popular repository topics' })
  async getPopularTopics(@Query('limit') limit?: string) {
    return this.platformService.getPopularTopics(Math.min(Number(limit) || 20, 50));
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured repositories' })
  async getFeatured(@Query('limit') limit?: string) {
    return this.platformService.getFeaturedRepositories(Math.min(Number(limit) || 6, 20));
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending repositories' })
  async getTrending(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month',
    @Query('limit') limit?: string,
  ) {
    return this.platformService.getTrendingRepositories(
      timeframe || 'week',
      Math.min(Number(limit) || 10, 20),
    );
  }
}

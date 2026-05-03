import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SelfHostedGuard } from '../admin/guards/self-hosted.guard';
import { InitializeSetupDto } from './dto/initialize-setup.dto';
import { SetupService } from './setup.service';

@ApiTags('setup')
@UseGuards(SelfHostedGuard)
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Get setup status of this instance' })
  async getStatus() {
    return this.setupService.getStatus();
  }

  @Public()
  @Get('branding')
  @ApiOperation({ summary: 'Get public branding settings (name, logo, primary color)' })
  async getBranding() {
    return this.setupService.getBranding();
  }

  @Public()
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize a new self-hosted instance (one-time only)' })
  async initialize(@Body() dto: InitializeSetupDto) {
    return this.setupService.initialize(dto);
  }
}

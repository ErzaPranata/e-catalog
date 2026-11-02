import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public store settings' })
  @ApiResponse({ status: 200, description: 'Public store settings' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
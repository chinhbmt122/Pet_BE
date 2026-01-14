import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { SeedService } from './services/seed.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly seedService: SeedService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('api/admin/seed')
  @HttpCode(200)
  async forceSeed(): Promise<{ success: boolean; message: string }> {
    try {
      await this.seedService.forceSeed();
      return { success: true, message: 'Database seeded successfully' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }
}

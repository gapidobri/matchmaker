import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser, JwtAuthGuard } from '@zenonfs/nest-oidc';

@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@CurrentUser() user: any): string {
    return this.appService.getHello(user.name);
  }
}

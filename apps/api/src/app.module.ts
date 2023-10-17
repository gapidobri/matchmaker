import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@zenonfs/nest-oidc';

@Module({
  imports: [
    AuthModule.forRoot({
      oidcAuthority:
        'http://server.matchmaker.orb.local/application/o/matchmaker',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

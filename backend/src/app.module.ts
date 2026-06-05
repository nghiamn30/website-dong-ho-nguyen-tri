import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { BranchScopeModule } from './branch-scope/branch-scope.module';
import { CalendarModule } from './calendar/calendar.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { ContentModule } from './content/content.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { GenealogyModule } from './genealogy/genealogy.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule.forRoot(),
    UsersModule,
    AuditLogModule,
    AuthModule,
    GenealogyModule,
    BranchScopeModule,
    ChangeRequestsModule,
    CalendarModule,
    ContentModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}

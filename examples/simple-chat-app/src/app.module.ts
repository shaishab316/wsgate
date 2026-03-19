import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { WsgateExplorer } from 'nestjs-wsgate';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [DiscoveryModule, ChatModule, AdminModule],
  providers: [WsgateExplorer],
})
export class AppModule {}

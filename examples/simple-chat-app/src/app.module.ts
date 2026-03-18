import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { WsgateExplorer } from 'nestjs-wsgate';

@Module({
  imports: [DiscoveryModule, ChatModule],
  providers: [WsgateExplorer],
})
export class AppModule {}

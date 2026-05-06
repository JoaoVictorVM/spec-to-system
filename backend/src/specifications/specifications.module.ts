import { Module } from '@nestjs/common';
import { SpecificationsService } from './specifications.service';

@Module({
  providers: [SpecificationsService],
  exports: [SpecificationsService],
})
export class SpecificationsModule {}

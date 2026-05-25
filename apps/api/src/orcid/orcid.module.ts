import { Module } from '@nestjs/common';
import { OrcidController } from './orcid.controller';
import { OrcidService } from './orcid.service';

@Module({
  controllers: [OrcidController],
  providers: [OrcidService],
  exports: [OrcidService],
})
export class OrcidModule {}

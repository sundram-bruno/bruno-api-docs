import { Module } from '@nestjs/common';
import { ApiDocsModule } from '@usebruno/api-docs-nestjs';

@Module({
  imports: [ApiDocsModule.forRoot({ collectionUrl: '../../api-collection' })]
})
export class AppModule {}

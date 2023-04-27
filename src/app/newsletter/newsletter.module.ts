import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Newsletter, NewsletterSchema } from './newsletter.model';
import { NewsletterResolver } from './newsletter.resolver';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Newsletter.name, schema: NewsletterSchema }])],
  providers: [NewsletterService, NewsletterResolver],
})
export class NewsletterModule {}

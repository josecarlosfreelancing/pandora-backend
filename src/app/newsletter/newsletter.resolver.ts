import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { AddEmailNewsletterArg } from './dto/add-email.input.dto';
import { Newsletter } from './newsletter.model';
import { NewsletterService } from './newsletter.service';

@Resolver(() => Newsletter)
export class NewsletterResolver {
  constructor(private logger: AppLogger, private service: NewsletterService) {
    this.logger.setContext(this.constructor.name);
  }

  @Public()
  @Mutation(() => Boolean)
  async addToNewsletter(@Args() input: AddEmailNewsletterArg): Promise<boolean> {
    this.logger.verbose('addToNewsletter');
    await this.service.create(input.email);
    return true;
  }
}

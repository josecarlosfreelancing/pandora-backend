import { Controller, Post, Redirect } from '@nestjs/common';
import Stripe from 'stripe';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { ConfigService } from '../config/config.service';
import { BadInputError } from '../helpers/errors/BadInputError';
import { AppLogger } from '../logging/logging.service';
import { UserId } from '../user/model/user.model';
import { UserService } from '../user/user.service';

@Controller('billing')
export class BillingController {
  private stripeClient: Stripe;
  constructor(
    private logger: AppLogger,
    private conf: ConfigService,
    private userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
    this.stripeClient = new Stripe(this.conf.stripe.secret, {
      // https://github.com/stripe/stripe-node#configuration
      apiVersion: '2022-08-01',
    });
  }

  @Roles(Role.User)
  @Post('/management-url')
  @Redirect()
  async createcustomerPortail(@CurrentUserId() userId: UserId): Promise<{ url: string }> {
    const user = await this.userService.getByEmailOrThrow(userId);
    const customers = await this.stripeClient.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length !== 1) {
      throw new BadInputError(`Customer not found with email : ${user.email}`);
    }

    const session = await this.stripeClient.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: 'https://www.pandora.fr',
    });

    return { url: session.url };
  }
}

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { AppLogger } from '../logging/logging.service';
import { UserId } from '../user/model/user.model';
import { CouponInputArg } from './dto/coupon-input.dto';
import { CouponOutputDto } from './dto/coupon-output.dto';
import { Transaction } from './model/transaction.model';
import { StripePaymentService } from './stripe-payment.service';

@Resolver(() => Transaction)
export class TransactionResolver {
  constructor(private logger: AppLogger, private readonly service: StripePaymentService) {
    this.logger.setContext(this.constructor.name);
  }

  @Roles(Role.User)
  @Query(() => CouponOutputDto)
  async validateCoupon(@Args('coupon') coupon: string): Promise<CouponOutputDto> {
    this.logger.verbose('validateCoupon');
    return await this.service.validateCoupon(coupon);
  }

  /* region ==================== Mutation ==================== */

  @Roles(Role.User)
  @Mutation(() => String)
  async processPayment(
    @Args() args: CouponInputArg,
    @CurrentUserId() userId: UserId,
  ): Promise<string | null> {
    this.logger.verbose('processPayment');
    return await this.service.processPayment(args, userId);
  }
}

import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { Deal } from '../deal/deal.model';
import { DealService } from '../deal/deal.service';
import { AppLogger } from '../logging/logging.service';
import { UserId } from '../user/model/user.model';
import { OrderOutputDto } from './dto/order-output.dto';
import { RedeemOrderInput } from './dto/redeem-order-input.dto';
import { Order } from './order.model';
import { OrderService } from './order.service';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private logger: AppLogger,
    private orderService: OrderService,
    private dealService: DealService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Roles(Role.User)
  @Query(() => [Order])
  async getMyOrders(@CurrentUserId() currentUserId: UserId): Promise<Order[]> {
    this.logger.verbose('getMyOrders');
    return await this.orderService.getOrdersByUserId(currentUserId);
  }

  /* ================= MUTATION =============== */
  @Roles(Role.User)
  @Mutation(() => OrderOutputDto)
  async redeemOffer(
    @Args() form: RedeemOrderInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<OrderOutputDto> {
    this.logger.verbose('redeemOffer');
    return await this.orderService.redeemOffer(form, currentUserId);
  }
  /* endregion */

  /* region ==================== RESOLVE FIELD ==================== */
  @ResolveField(() => [Deal])
  async deal(@Parent() order: Order): Promise<Deal> {
    return await this.dealService.getByIdOrThrow(order.dealId);
  }

  /* endregion */
}

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListDealType } from '../deal/deal-type';
import { DealService } from '../deal/deal.service';
import { AppLogger } from '../logging/logging.service';
import { UserId } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { OrderOutputDto } from './dto/order-output.dto';
import { RedeemOrderInput } from './dto/redeem-order-input.dto';
import { Order } from './order.model';

export class OrderService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Order.name) private model: Model<Order>,
    private readonly dealService: DealService,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async getOrdersByUserId(buyerId: UserId): Promise<Order[]> {
    return await this.model.find({ buyerId }).lean().exec();
  }

  async redeemOffer(form: RedeemOrderInput, currentUserId: UserId): Promise<OrderOutputDto> {
    const deal = await this.dealService.getByIdOrThrow(form.dealId);
    await this.dealService.increaseRedeemAmunt(form.dealId);

    // const currentUser = await this.userService.getByIdOrThrow(currentUserId);
    // if (!currentUser.transactionId) {
    //   throw new ForbiddenError('User does not have any paid plan !');
    // }

    const doc = (
      await this.model.create({
        ...form,
        buyerId: currentUserId,
        type: deal.type,
      })
    ).toObject();

    if (deal.type.kind == ListDealType.PromoCode) {
      return {
        promoCode: deal.type.promoCode,
      };
    }
    // todo : to make intro
    return {};
  }
}

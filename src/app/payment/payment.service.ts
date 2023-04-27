import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticService } from '../analytic/analytic.service';
import { ListEventsPossible } from '../analytic/types';
import { AppLogger } from '../logging/logging.service';
import { StripeFailureEvent } from './payment-events';

@Injectable()
export class PaymentService {
  constructor(
    private readonly logger: AppLogger,
    private readonly analyticService: AnalyticService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @OnEvent(StripeFailureEvent.symbol)
  async storeChargeFailure(payload: StripeFailureEvent): Promise<void> {
    await this.analyticService.create(
      {
        key: ListEventsPossible.PurchaseError,
        extra: `stripeSessionId=${payload.sessionId}, paymentIntentId=${payload.paymentIntentId}, amount=${payload.paidPrice}`,
      },
      payload.buyerId,
    );
  }
}

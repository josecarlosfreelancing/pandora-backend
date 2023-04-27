import { Injectable } from '@nestjs/common';
import { AnalyticService } from '../analytic/analytic.service';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';
import { StripePaymentService } from './stripe-payment.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentEventService {
  constructor(
    private readonly logger: AppLogger,
    private readonly transactionService: TransactionService,
    private readonly analyticService: AnalyticService,
    private readonly stripePaymentService: StripePaymentService,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  // @OnEvent(StripePaymentCompletedEvent.symbol)
  // async handleSessionCompleted(payload: StripePaymentCompletedEvent): Promise<void> {
  //   this.logger.verbose('handleSessionCompleted');
  //   try {
  //     await this._handleSessionCompleted(payload);
  //   } catch (error) {
  //     await this.handleFailure(payload, error);
  //   }
  // }

  // private async _handleSessionCompleted(payload: StripePaymentCompletedEvent): Promise<void> {
  //   const { buyerId, paidPrice, sessionId } = payload;

  //   const user = await this.userService.getById(buyerId);
  //   if (!user) {
  //     throw new BadInputError(`User ${user} does not exist`);
  //   }

  //   const transactionId = TransactionService.createTransactionId();

  //   await this.analyticService.create(
  //     {
  //       key: ListEventsPossible.PurchaseSuccess,
  //       extra: `stripeSessionId=${payload.sessionId}, paymentIntentId=${payload.paymentIntentId}, amount=${payload.paidPrice}, transactionId=${transactionId}`,
  //     },
  //     buyerId,
  //   );

  //   await this.transactionService.create({
  //     _id: transactionId,
  //     buyerId,
  //     price: paidPrice,
  //     stripeSessionId: sessionId,
  //   });

  //   await this.userService.updatePaymentInfo(buyerId, transactionId);
  // }

  // private async handleFailure(payload: StripePaymentCompletedEvent, error: Error): Promise<void> {
  //   this.logger.verbose('handleFailure');
  //   // Somehow we failed to handle the payment, so we refund it.
  //   console.warn(`Primary-market transaction failed: ${error.message}`);

  //   let wasRefundSuccessful: boolean | undefined;
  //   let refundFailedError: Error | undefined;
  //   let refundStatus: string | null | undefined;
  //   try {
  //     const { status } = await this.stripePaymentService.refund(payload.paymentIntentId);
  //     refundStatus = status;
  //     wasRefundSuccessful = refundStatus === 'succeeded';
  //   } catch (error) {
  //     refundFailedError = error;
  //     wasRefundSuccessful = false;
  //   }

  //   if (wasRefundSuccessful) {
  //     console.warn('Transaction was refunded');
  //   } else {
  //     console.warn(
  //       `Transaction was NOT refunded: ${
  //         refundFailedError?.message || `Status was ${refundStatus}`
  //       }`,
  //     );
  //     await this.analyticService.create(
  //       {
  //         key: ListEventsPossible.PurchaseRefundFailed,
  //         extra:
  //           `stripeSessionId=${payload.sessionId},` +
  //           `paymentIntentId=${payload.paymentIntentId},` +
  //           `amount=${payload.paidPrice},` +
  //           `errorMessage=${error.message}`,
  //       },
  //       payload.buyerId,
  //     );
  //     // TODO Sentry Log
  //     return; // Nothing to do here anymore. Refund failed. This is probably a bug.
  //   }

  //   await this.analyticService.create(
  //     {
  //       key: ListEventsPossible.PurchaseRefunded,
  //       extra:
  //         `stripeSessionId=${payload.sessionId},` +
  //         `paymentIntentId=${payload.paymentIntentId},` +
  //         `amount=${payload.paidPrice}`,
  //     },
  //     payload.buyerId,
  //   );
  // }
}

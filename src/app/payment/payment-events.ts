import { UserId } from '../user/model/user.model';
import { StripePaymentIntentId, StripeSessionId } from './model/transaction.model';

export class StripePaymentCompletedEvent {
  static symbol = Symbol(StripePaymentCompletedEvent.name);
  sessionId: StripeSessionId;
  paymentIntentId: StripePaymentIntentId;
  buyerId: UserId;
  paidPrice: number;
}

export class StripeFailureEvent {
  static symbol = Symbol(StripeFailureEvent.name);
  sessionId: StripeSessionId;
  paymentIntentId: StripePaymentIntentId;
  buyerId: UserId;
  cause: string;
  paidPrice: number;
}

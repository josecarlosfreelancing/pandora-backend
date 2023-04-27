import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isString } from 'lodash';
import Stripe from 'stripe';
import { z } from 'zod';
import { AnalyticService } from '../analytic/analytic.service';
import { ListEventsPossible } from '../analytic/types';
import { ConfigService } from '../config/config.service';
import { BadInputError } from '../helpers/errors/BadInputError';
import { AppLogger } from '../logging/logging.service';
import { UserService } from '../user/user.service';
import { CouponInputArg } from './dto/coupon-input.dto';
import { CouponOutputDto } from './dto/coupon-output.dto';
import { StripeFailureEvent, StripePaymentCompletedEvent } from './payment-events';
import { TransactionService } from './transaction.service';

const CURRENCY = 'eur';

// todo how to handle end of subscription
@Injectable()
export class StripePaymentService {
  private stripeClient: Stripe;

  private DISCOUNTED_PRICE_ID = 'price_1MDEAFIWC4265vKAiqsg6iDW';
  private NORMAL_PRICE_ID = 'price_1M6HkXIWC4265vKA3PCEdT6h';

  constructor(
    private logger: AppLogger,
    private readonly conf: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly analyticService: AnalyticService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
  ) {
    this.logger.setContext(this.constructor.name);
    this.stripeClient = new Stripe(this.conf.stripe.secret, {
      // https://github.com/stripe/stripe-node#configuration
      apiVersion: '2022-08-01',
    });
  }

  async validateCoupon(coupon: string): Promise<CouponOutputDto> {
    const userFound = await this.userService.getByReferral(coupon);
    if (!userFound) {
      throw new Error('Coupon does not exist');
    }
    const price = await this.stripeClient.prices.retrieve(this.NORMAL_PRICE_ID);
    if (!userFound) {
      return {
        newPrice: price.unit_amount || 19900,
      };
    }
    const priceDiscounted = await this.stripeClient.prices.retrieve(this.DISCOUNTED_PRICE_ID);
    if (!priceDiscounted) {
      throw new Error('Discount cannot be apply');
    }
    return {
      newPrice: priceDiscounted.unit_amount || price.unit_amount || 19900,
    };
  }

  async getPriceId(coupon?: string): Promise<string> {
    if (!coupon) return this.NORMAL_PRICE_ID;
    const userFound = await this.userService.getByReferral(coupon);
    if (!userFound) {
      throw new Error('Coupon does not exist');
    }
    if (!userFound) {
      return this.NORMAL_PRICE_ID;
    }
    return this.DISCOUNTED_PRICE_ID;
  }

  async processPayment(
    { paymentMethodId, coupon }: CouponInputArg,
    userId: string,
  ): Promise<string | null> {
    await this.analyticService.create(
      {
        key: ListEventsPossible.CheckoutPageShown,
      },
      userId,
    );

    const user = await this.userService.getByIdOrThrow(userId);
    if (user.transactionId) {
      throw Error('User already have an active subscription');
    }

    const customer = await this.stripeClient.customers.create({
      email: user.email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const price = await this.stripeClient.prices.retrieve(await this.getPriceId(coupon));
    if (!price) {
      throw new Error('Not price found');
    }
    // Create a subscription
    const subscription = await this.stripeClient.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: price.id,
        },
      ],
      expand: ['latest_invoice.payment_intent'],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    });
    const transaction = await this.transactionService.create({
      price: price.unit_amount || 0,
      stripePriceId: price.id,
      stripeSubscriptionId: subscription.id,
      buyerId: userId,
      couponUsed: coupon,
    });
    await this.userService.updatePaymentInfo(userId, transaction._id);
    return subscription.id;
  }

  async handleStripeWebhookEvent(signature: string, rawBody: Buffer): Promise<void> {
    const webhookSecret = this.conf.stripe.webhookSecret;
    let event: Stripe.Event | undefined;
    try {
      event = await this.stripeClient.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException(error);
    }

    if (event.type === 'checkout.session.completed') {
      await this.handleSessionCompleted(event.data.object as Stripe.Checkout.Session);
    }
    if (event.type === 'checkout.session.async_payment_failed') {
      this.handleSessionFailure(event.data.object as Stripe.Checkout.Session, event.type);
    }
    // Ignore every other event.
  }

  private handleSessionFailure(session_: Stripe.Checkout.Session, cause: string): void {
    const session: CheckoutSession = checkoutSessionZod.parse(session_);

    const isPrimaryMarketCheck = paymentMetadataZod.safeParse(session.metadata);
    if (isPrimaryMarketCheck.success) {
      const metadata = isPrimaryMarketCheck.data;
      const buyerId = metadata.userId;
      const payload: StripeFailureEvent = {
        paidPrice: session.amount_total,
        paymentIntentId: session.payment_intent,
        sessionId: session.id,
        cause,
        buyerId,
      };
      this.eventEmitter.emit(StripeFailureEvent.symbol, payload);
    }
  }

  private async handleSessionCompleted(session: Stripe.Checkout.Session) {
    try {
      return this._handleSessionCompleted(session);
    } catch (error) {
      // Somehow we failed to handle the payment, so we refund it.
      try {
        const paymentIntent = session.payment_intent;
        if (!isString(paymentIntent)) {
          throw Error('payment intent is not a string');
        }
        const { status: refundStatus } = await this.refund(paymentIntent);
        if (refundStatus !== 'succeeded') {
          throw Error(`Refund returned status ${refundStatus}`);
        }
        console.error(`${error.message}\nAmount has been refunded`);
      } catch (refundError) {
        console.error(`${error.message}\nAmount has NOT been refunded: ${refundError.message}`);
      } finally {
        // This is an webhook endpoint. There is nothing more we can do.
        // TODO Add Sentry logs
      }
    }
  }

  private _handleSessionCompleted(session_: Stripe.Checkout.Session) {
    // This can be tested with Stripe CLI
    // stripe trigger checkout.session.completed --override price:currency=eur --override checkout_session:currency=eur
    const session: CheckoutSession = checkoutSessionZod.parse(session_);

    const metadataContainer = paymentMetadataZod.safeParse(session.metadata);
    if (metadataContainer.success) {
      // primary market payload

      const metadata = metadataContainer.data;
      const paymentIntentId = session.payment_intent;

      const payloadPrimaryMarket: StripePaymentCompletedEvent = {
        buyerId: metadata.userId,
        paidPrice: session.amount_total,
        paymentIntentId,
        sessionId: session.id,
      };
      this.eventEmitter.emit(StripePaymentCompletedEvent.symbol, payloadPrimaryMarket);
      return;
    }
    throw new BadInputError(`Unrecognized payment metadata: ${JSON.stringify(session.metadata)}`);
  }

  async refund(paymentIntentId: string): Promise<{ status: 'succeeded' | string | null }> {
    const refund = await this.stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer', // Here the reason can vary, but Stripe's API does not offer many choices.
    });
    return { status: refund.status };
  }
}

const paymentMetadataZod = z.object({
  userId: z.string(),
});

const checkoutSessionZod = z.object({
  id: z.string().min(1),
  amount_total: z.number().nonnegative(),
  currency: z.literal(CURRENCY),
  payment_intent: z.string().min(1),
  metadata: z.set(paymentMetadataZod),
});

type CheckoutSession = z.infer<typeof checkoutSessionZod>;

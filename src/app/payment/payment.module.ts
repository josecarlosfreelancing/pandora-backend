import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticModule } from '../analytic/analytic.module';
import { Transaction, TransactionSchema } from '../payment/model/transaction.model';
import { UserModule } from '../user/user.module';
import { PaymentEventService } from './payment-event.service';
import { PaymentService } from './payment.service';
import { StripePaymentService } from './stripe-payment.service';
import { TransactionResolver } from './transaction.resolver';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AnalyticModule),
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
  ],
  providers: [
    PaymentService,
    PaymentEventService,
    StripePaymentService,
    TransactionService,
    TransactionResolver,
  ],
  exports: [TransactionService, StripePaymentService],
})
export class PaymentModule {}

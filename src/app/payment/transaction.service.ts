import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { AppLogger } from '../logging/logging.service';
import { Transaction, TransactionCreatePayload, TransactionId } from './model/transaction.model';

// todo handle canel paid plan
@Injectable()
export class TransactionService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Transaction.name) private model: Model<Transaction>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  static createTransactionId(): TransactionId {
    return v4();
  }

  async create({
    price,
    stripePriceId,
    stripeSubscriptionId,
    buyerId,
    refund,
  }: TransactionCreatePayload): Promise<Transaction> {
    const transactionDoc = await this.model.create({
      price,
      stripePriceId,
      stripeSubscriptionId,
      buyerId,
      refund,
    });
    return transactionDoc.toObject();
  }
}

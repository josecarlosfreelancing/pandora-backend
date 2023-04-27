import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { defaultSubDocSchemaOption } from '../../helpers/default-schema-option.tools';

export enum TransactionRefundReason {
  Manual = 'Manual',
  DealNotAvailable = 'DealNotAvailable',
  InvalidAmount = 'InvalidAmount',
  InternalError = 'InternalError',
}

registerEnumType(TransactionRefundReason, { name: 'TransactionRefundReason' });

@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class TransactionRefund {
  @Prop({ required: true })
  @Field()
  date: Date;

  @Prop({ required: true })
  @Field(() => TransactionRefundReason)
  reason: TransactionRefundReason;

  @Prop()
  @Field({ nullable: true })
  errorMessage?: string;

  @Prop({ required: true, index: true })
  @Field()
  stripeSessionId: string;
}

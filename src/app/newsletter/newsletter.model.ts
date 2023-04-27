import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Newsletter extends DefaultModel {
  @Prop({ required: true, unique: true })
  @Field(() => String)
  email: string;
}

export const NewsletterSchema = SchemaFactory.createForClass(Newsletter);

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { IsEmail } from 'class-validator';
import { AuthZ } from '../../auth/authz/authz.decorator';
import { DefaultModel } from '../../helpers/default.model';

@ObjectType({ isAbstract: true })
@AuthZ({ rules: ['CommonUserDocProtectedFields'] })
export class CommonUser extends DefaultModel {
  @Prop({ required: true, unique: true, sparse: true })
  @Field({ nullable: false })
  @IsEmail()
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ select: false })
  refreshJwtHash?: string;

  @Prop()
  @Field({ nullable: true })
  lastLoginDate: Date;
}

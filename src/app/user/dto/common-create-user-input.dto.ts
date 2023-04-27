import { ArgsType, Field, InputType, PickType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';
import { CommonUserInput } from '../model/user.model';

const commonCreateUserInputDtoKeys: (keyof CommonUserInput)[] = ['email'];

@ArgsType()
@InputType()
export class CommonCreateUserInputDto extends PickType(
  CommonUserInput,
  commonCreateUserInputDtoKeys,
) {
  @MinLength(6)
  @Field(() => String)
  password: string;
}

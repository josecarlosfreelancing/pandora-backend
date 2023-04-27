import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserInputError } from 'apollo-server-express';
import { setAsAuthorizedDocument } from '../auth/authz/rule-builders/can-read-authorized-documents';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { AppLogger } from '../logging/logging.service';
import { CreateUserInputDto } from './dto/create-user-input.dto';
import { UpdateUserInputDto } from './dto/update-user-input.dto';
import { UserOutputDto } from './dto/user-output.dto';
import { User, UserId } from './model/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private logger: AppLogger, private userService: UserService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Roles(Role.User)
  @Query(() => User)
  async me(@CurrentUserId() id: UserId): Promise<User> {
    this.logger.verbose('me');
    const user = await this.userService.getById(id);
    if (!user) {
      throw new UserInputError('User does not exist');
    }
    return user;
  }

  @Public()
  @Query(() => Boolean)
  async isEmailTaken(@Args('email') email: string): Promise<boolean> {
    this.logger.verbose('isEmailTaken');
    return await this.userService.isEmailTaken(email);
  }

  /* ================= MUTATION =============== */
  @Public()
  @Mutation(() => User)
  async createUser(@Args() user: CreateUserInputDto, @Context() context: object): Promise<User> {
    this.logger.verbose('createUser');
    const newUser = await this.userService.create(user);
    setAsAuthorizedDocument(newUser._id, context);
    return newUser;
  }

  @Roles(Role.User)
  @Mutation(() => UserOutputDto)
  async updateMe(
    @Args('form') form: UpdateUserInputDto,
    @CurrentUserId() id: UserId,
  ): Promise<UserOutputDto | null> {
    this.logger.verbose('updateMe');
    return await this.userService.updateUser(id, form);
  }
}

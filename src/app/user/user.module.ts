import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticModule } from '../analytic/analytic.module';
import { AllUserService } from './all-user.service';
import { Admin, AdminSchema } from './model/admin.model';
import { User, UserSchema } from './model/user.model';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [
    forwardRef(() => AnalyticModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  providers: [AllUserService, UserService, UserResolver],
  exports: [AllUserService, UserService],
})
export class UserModule {}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ForbiddenError } from 'apollo-server-express';
import { FilterQuery, Model } from 'mongoose';
import { v4 } from 'uuid';
import { AnalyticService } from '../analytic/analytic.service';
import { ListEventsPossible } from '../analytic/types';
import { createAlphanumericId } from '../helpers/helper';
import { hash } from '../helpers/strings.tools';
import { AppLogger } from '../logging/logging.service';
import { TransactionId } from '../payment/model/transaction.model';
import { CommonCreateUserInputDto } from './dto/common-create-user-input.dto';
import { UpdateUserInputDto } from './dto/update-user-input.dto';
import { UserOutputDto } from './dto/user-output.dto';
import { User, UserId } from './model/user.model';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: AppLogger,
    @InjectModel(User.name) private readonly model: Model<User>,
    private readonly analyticService: AnalyticService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async getById(id: UserId): Promise<User | null> {
    return await this.model.findOne({ _id: id }).lean().exec();
  }

  async getByReferral(referralCode: string): Promise<User | null> {
    return await this.model.findOne({ referralCode }).lean().exec();
  }

  async getByIdOrThrow(id: UserId): Promise<User> {
    const doc = await this.getById(id);
    if (!doc) {
      throw Error(`UserId not found with id ${id}`);
    }
    return doc;
  }

  async getByEmail(email: string): Promise<User | null> {
    return await this.model.findOne({ email }).lean().exec();
  }

  async getByEmailOrThrow(email: string): Promise<User> {
    const doc = await this.getByEmail(email);
    if (!doc) {
      throw Error(`UserId not found with email ${email}`);
    }
    return doc;
  }

  static createUserId(): UserId {
    return v4();
  }

  async count(filter?: UserFilter): Promise<number> {
    this.logger.verbose('count');
    return await this.model.count(filterToMongoFilter(filter || {})).exec();
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const exists = await this.model.exists({ email });
    return exists ? !!exists._id : false;
  }

  async create({ ...form }: CommonCreateUserInputDto): Promise<User> {
    const createdUser = await this.model.create({
      ...form,
      referralCode: createAlphanumericId(10),
      password: hash(form.password),
    });
    return createdUser.toObject();
  }

  async createWithDetail(email: string, pwd: string, userId: string): Promise<User> {
    const createdUser = await this.model.create({
      _id: userId,
      email,
      referralCode: createAlphanumericId(10),
      password: hash(pwd),
    });
    await this.analyticService.create(
      {
        key: ListEventsPossible.RegisterCompleted,
      },
      userId,
    );
    return createdUser.toObject();
  }

  async updateUser(
    userId: UserId,
    { newPassword, currentPassword, ...form }: UpdateUserInputDto,
  ): Promise<UserOutputDto | null> {
    const passwordIsProvided = Boolean(currentPassword);
    if (passwordIsProvided) {
      const userCount = await this.model
        .count({ _id: userId, password: hash(currentPassword!) })
        .exec();
      if (userCount !== 1) {
        throw new ForbiddenError('Incorrect password');
      }
    }
    if (newPassword && !passwordIsProvided) {
      throw new ForbiddenError('The current password is required to change it');
    }
    const result = await this.model.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          ...form,
          ...(newPassword ? { password: hash(newPassword) } : {}),
        },
      },
      { new: true },
    );
    return result;
  }

  async updatePaymentInfo(userId: UserId, transactionId: TransactionId): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $set: { transactionId } }, { new: true }).exec();
  }

  private createUserId(): UserId {
    return v4();
  }
}

export interface UserFilter {
  ids?: UserId[];
  email?: string;
  createdMinDate?: Date;
  createdMaxDate?: Date;
}

const filterToMongoFilter = (filter: UserFilter): FilterQuery<User> => {
  const { ids, email, createdMinDate, createdMaxDate } = filter;
  const query: FilterQuery<User> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  if (email) {
    query.email = { $regex: email, $options: 'i' };
  }
  if (createdMinDate || createdMaxDate) {
    query.createdAt = {
      ...(createdMinDate ? { $gte: createdMinDate } : {}),
      ...(createdMaxDate ? { $lte: createdMaxDate } : {}),
    };
  }
  return query;
};

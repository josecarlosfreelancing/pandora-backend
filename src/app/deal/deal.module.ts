import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticModule } from '../analytic/analytic.module';
import { CategoryModule } from '../category/category.module';
import { Deal, DealSchema } from './deal.model';
import { DealResolver } from './deal.resolver';
import { DealService } from './deal.service';

@Module({
  imports: [
    forwardRef(() => AnalyticModule),
    forwardRef(() => CategoryModule),
    MongooseModule.forFeature([{ name: Deal.name, schema: DealSchema }]),
  ],
  providers: [DealService, DealResolver],
  exports: [DealService],
})
export class DealModule {}

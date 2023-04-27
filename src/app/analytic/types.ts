import { registerEnumType } from '@nestjs/graphql';

export enum ListEventsPossible {
  DealPageShown = 'DealPageShown',
  DealLinkClicked = 'DealLinkClicked',
  CheckoutPageShown = 'CheckoutPageShown',
  PurchaseSuccess = 'PurchaseSuccess',
  PurchaseError = 'PurchaseError',
  PurchaseRefundFailed = 'PurchaseRefundFailed',
  PurchaseRefunded = 'PurchaseRefunded',
  RegisterPageShown = 'RegisterPageShown',
  RegisterCompleted = 'RegisterCompleted',
}

registerEnumType(ListEventsPossible, {
  name: 'ListEventsPossible',
});

import type { LandlordStatement, RentPayment, RentReceipt, RentSchedule } from '../types';

export interface RentPaymentsState {
  schedules: RentSchedule[];
  payments: RentPayment[];
  receipts: RentReceipt[];
  statements: LandlordStatement[];
}

export const initialRentPaymentsState: RentPaymentsState = {
  schedules: [],
  payments: [],
  receipts: [],
  statements: [],
};

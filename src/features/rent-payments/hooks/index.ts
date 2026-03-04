import { useMemo } from 'react';
import { rentPaymentsApi } from '../api';

export function useRentPaymentsFeature() {
  return useMemo(() => ({
    getSchedule: rentPaymentsApi.getSchedule,
    updateSchedule: rentPaymentsApi.updateSchedule,
    toggleAutopay: rentPaymentsApi.toggleAutopay,
    createPayment: rentPaymentsApi.createPayment,
    listPayments: rentPaymentsApi.listPayments,
    listReceipts: rentPaymentsApi.listReceipts,
    getLandlordStatements: rentPaymentsApi.getLandlordStatements,
  }), []);
}

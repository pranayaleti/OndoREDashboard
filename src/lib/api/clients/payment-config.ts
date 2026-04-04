import { apiGet, apiPut } from "../http";

export interface PaymentMethodConfig {
  id: string;
  propertyId: string;
  applePay: boolean;
  googlePay: boolean;
  stripeLink: boolean;
  klarna: boolean;
  cards: boolean;
}

export const paymentConfigApi = {
  async getConfig(propertyId: string): Promise<PaymentMethodConfig> {
    const res = await apiGet<{ data: PaymentMethodConfig }>(`/payment-config/${propertyId}`);
    return res.data;
  },
  async updateConfig(propertyId: string, updates: Partial<PaymentMethodConfig>): Promise<PaymentMethodConfig> {
    const res = await apiPut<{ data: PaymentMethodConfig }>(`/payment-config/${propertyId}`, updates);
    return res.data;
  },
  async getStripeTypes(propertyId: string): Promise<string[]> {
    const res = await apiGet<{ data: { paymentMethodTypes: string[] } }>(`/payment-config/${propertyId}/stripe-types`);
    return res.data.paymentMethodTypes;
  },
};

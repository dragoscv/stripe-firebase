/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FirebaseApp } from "firebase/app";
import {
  getStripePayments,
  StripePayments
} from "./init";
import {
  createCheckoutSession,
  SessionCreateParams,
  SessionConfig
} from "./session";

/**
 * Initializes Stripe payments with the given Firebase app and collections.
 *
 * @param firebaseApp - The Firebase app instance.
 * @param productsCollection - The name of the products collection (default is "products").
 * @param customersCollection - The name of the customers collection (default is "/customers").
 * @returns An instance of StripePayments.
 */
export const stripePayments = (firebaseApp: FirebaseApp, productsCollection: string = "products", customersCollection: string = "/customers"): StripePayments => getStripePayments(firebaseApp, {
  productsCollection: productsCollection,
  customersCollection: customersCollection,
});

/**
 * Creates a new Stripe checkout session and redirects the user to the session URL.
 *
 * @param sessionConfig - Configuration object for the checkout session.
 * @param sessionConfig.firebaseApp - The Firebase app instance.
 * @param sessionConfig.priceId - The ID of the price to be used in the session.
 * @param sessionConfig.promoCode - (Optional) The promotion code to apply to the session.
 * @param sessionConfig.metadata - (Optional) Metadata to attach to the session.
 * @param sessionConfig.trial_period_days - (Optional) Number of trial period days for the subscription.
 * @param sessionConfig.payment_mode - (Optional) The payment mode for the session (e.g., subscription or payment).
 * @param sessionConfig.currency - The currency for the payment.
 * @param sessionConfig.priceValue - The value of the price.
 * @param sessionConfig.subscriptionName - The name of the subscription.
 *
 * @returns A promise that resolves when the session is created and the user is redirected.
 */
export const newCheckoutSession = async (sessionConfig: SessionConfig) => {

  const { firebaseApp, priceId, promoCode, metadata, trial_period_days, payment_mode } = sessionConfig;

  const payments = stripePayments(firebaseApp);
  const paymentConfig: SessionCreateParams = {
    price: priceId,
    allow_promotion_codes: true,
    success_url: `${window.location.href}?paymentStatus=success&currency=${sessionConfig.currency}&priceValue=${sessionConfig.priceValue}&subscriptionName=${sessionConfig.subscriptionName}&priceId=${priceId}`,
    cancel_url: `${window.location.href}?paymentStatus=canceled`,
  }
  if (payment_mode) {
    paymentConfig["mode"] = payment_mode;
    paymentConfig["invoice_creation"] = true;
  }

  if (trial_period_days) {
    paymentConfig["trial_period_days"] = trial_period_days;
  }
  if (promoCode) {
    paymentConfig["promotion_code"] = promoCode;
  }
  if (metadata) {
    paymentConfig["metadata"] = metadata as { [key: string]: string | number | boolean };
  }
  const session = await createCheckoutSession(payments, paymentConfig);
  window.location.assign(session.url);
}

export function checkNonEmptyString(arg: unknown, message?: string): void {
  if (typeof arg !== "string" || arg === "") {
    throw new Error(message ?? "arg must be a non-empty string.");
  }
}

export function checkPositiveNumber(arg: unknown, message?: string): void {
  if (typeof arg !== "number" || isNaN(arg) || arg <= 0) {
    throw new Error(message ?? "arg must be positive number.");
  }
}

export function checkNonEmptyArray(arg: unknown, message?: string): void {
  if (!Array.isArray(arg) || arg.length === 0) {
    throw new Error(message ?? "arg must be a non-empty array.");
  }
}

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
import { Functions, getFunctions, httpsCallable } from "firebase/functions";
import { StripePayments, StripePaymentsError } from "./init";
import { getCurrentUser } from "./user";
import { checkNonEmptyString } from "./utils";
import { firebaseApp } from "../firebase";
import { functionsRegion } from "../firebase/utils";

/**
 * Parameters for creating a billing portal session.
 */
export interface CreatePortalLinkParams {
  /**
   * The URL to which the customer will be redirected when they are done managing
   * their billing with the portal. Required.
   */
  returnUrl: string;

  /**
   * The IETF language tag of the locale Stripe should display the portal in.
   * Defaults to 'auto' (Stripe detects the user's locale).
   */
  locale?: string;

  /**
   * The ID of an existing portal configuration to use for this session.
   */
  configuration?: string;

  /**
   * Information about a specific flow for the customer to go through.
   */
  flow_data?: {
    /**
     * Type of flow that the customer will go through.
     */
    type: 'payment_method_update' | 'subscription_cancel' | 'subscription_update' | 'subscription_update_confirm';

    /**
     * Behavior after the flow is completed.
     */
    after_completion?: {
      /**
       * The type of behavior after completion.
       */
      type: 'hosted_confirmation' | 'portal_homepage' | 'redirect';

      /**
       * Configuration when type is 'hosted_confirmation'.
       */
      hosted_confirmation?: {
        /**
         * A custom message to display to the customer after the flow is completed.
         */
        custom_message?: string;
      };

      /**
       * Configuration when type is 'redirect'.
       */
      redirect?: {
        /**
         * The URL the customer will be redirected to after the flow is completed.
         */
        return_url: string;
      };
    };

    /**
     * Configuration when flow type is 'subscription_cancel'.
     */
    subscription_cancel?: {
      /**
       * The ID of the subscription to be canceled.
       */
      subscription: string;

      /**
       * Specify a retention strategy to be used in the cancellation flow.
       */
      retention?: {
        /**
         * Type of retention strategy.
         */
        type: 'coupon_offer';

        /**
         * Configuration for the retention strategy.
         */
        coupon_offer?: {
          /**
           * The ID of the coupon to offer.
           */
          coupon: string;
        };
      };
    };

    /**
     * Configuration when flow type is 'subscription_update' or 'subscription_update_confirm'.
     */
    subscription_update?: {
      /**
       * The ID of the subscription to be updated.
       */
      subscription: string;
    };

    /**
     * Configuration when flow type is 'subscription_update_confirm'.
     */
    subscription_update_confirm?: {
      /**
       * The ID of the subscription to be updated.
       */
      subscription: string;

      /**
       * The discounts being applied to the subscription update.
       */
      discounts?: Array<{
        /**
         * The ID of the coupon to apply.
         */
        coupon?: string;

        /**
         * The ID of the promotion code to apply.
         */
        promotion_code?: string;
      }>;

      /**
       * The subscription items to be updated.
       */
      items: Array<{
        /**
         * The ID of the subscription item to update.
         */
        id: string;

        /**
         * The price the subscription item will be changed to.
         */
        price?: string;

        /**
         * The quantity of the subscription item.
         */
        quantity?: number;
      }>;
    };
  };
}

/**
 * Response from creating a billing portal session.
 */
export interface PortalLink {
  /**
   * Unique identifier for the portal session.
   */
  id: string;

  /**
   * String representing the object's type. Always 'billing_portal.session'.
   */
  object: string;

  /**
   * The configuration used for this session.
   */
  configuration?: string;

  /**
   * Time at which the object was created. Measured in seconds since the Unix epoch.
   */
  created: number;

  /**
   * The ID of the customer for this session.
   */
  customer: string;

  /**
   * Information about a specific flow for the customer to go through.
   */
  flow?: {
    after_completion?: {
      type: string;
      hosted_confirmation?: {
        custom_message?: string;
      };
      redirect?: {
        return_url: string;
      };
    };
    subscription_cancel?: {
      retention?: any;
      subscription: string;
    };
    subscription_update?: {
      subscription: string;
    };
    subscription_update_confirm?: {
      discounts?: Array<any>;
      items: Array<any>;
      subscription: string;
    };
    type: string;
  };

  /**
   * Has the value true if the object exists in live mode or the value false if the object exists in test mode.
   */
  livemode: boolean;

  /**
   * The IETF language tag of the locale Customer Portal is displayed in.
   */
  locale?: string;

  /**
   * The account for which the session was created on behalf of. When specified, only subscriptions
   * and invoices with this on_behalf_of account appear in the portal.
   */
  on_behalf_of?: string;

  /**
   * The URL to which Stripe should send customers when they click on the link to return to your website.
   */
  return_url: string;

  /**
   * The short-lived URL of the session that gives customers access to the customer portal.
   */
  url: string;
}

export const CREATE_PORTAL_LINK_TIMEOUT_MILLIS = 10 * 1000;

/**
 * Optional settings for the {@link createPortalLink} function.
 */
export interface CreatePortalLinkOptions {
  /**
   * Time to wait (in milliseconds) for the portal link to be created.
   * If not specified, defaults to {@link CREATE_PORTAL_LINK_TIMEOUT_MILLIS}.
   */
  timeoutMillis?: number;
}

/**
 * Creates a new Stripe billing portal session. This allows customers to manage their
 * subscription and billing information. Returns a portal session with a URL that can be
 * used to redirect the customer to the Stripe billing portal.
 *
 * User must be currently signed in with Firebase Auth to call this API.
 *
 * @param payments - A valid {@link StripePayments} object.
 * @param params - Parameters for creating the portal session.
 * @param options - Optional settings to customize the behavior.
 * @returns Resolves with the created portal session containing the portal URL.
 */
export async function createPortalLink(
  payments: StripePayments,
  params: CreatePortalLinkParams,
  options?: CreatePortalLinkOptions
): Promise<PortalLink> {
  checkNonEmptyString(
    params.returnUrl,
    "returnUrl must be a non-empty string."
  );

  const uid = await getCurrentUser(payments);
  if (!uid) {
    throw new StripePaymentsError(
      "unauthenticated",
      "User must be authenticated to create a portal link."
    );
  }

  const functions: Functions = getFunctions(firebaseApp, functionsRegion);
  
  // Extension functions are prefixed with "ext-{extension-name}-"
  // Try both the direct name and the extension-prefixed name
  const functionName = "ext-firebase-stripe-payments-createPortalLink";
  
  const createPortalLinkFn = httpsCallable<CreatePortalLinkParams, PortalLink>(
    functions,
    functionName
  );

  try {
    const result = await createPortalLinkFn(params);
    return result.data;
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error occurred";
    throw new StripePaymentsError(
      "internal",
      `Failed to create portal link: ${errorMessage}`,
      error
    );
  }
}

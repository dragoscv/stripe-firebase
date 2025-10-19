/*
 * Copyright 2023 Dragos Catalin
 *
 * Licensed under the ISC License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/ISC
 */

import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { BTPPayments, BTPPaymentsError } from "./init";

/**
 * Get the current authenticated user.
 * 
 * @param payments - The BTPPayments instance.
 * @returns A promise that resolves with the current user.
 * @throws BTPPaymentsError if no user is authenticated.
 */
export async function getCurrentUser(payments: BTPPayments): Promise<User> {
    const auth = getAuth(payments.getApp());
    const user = auth.currentUser;

    if (user) {
        return user;
    }

    // If no current user, wait for auth state to initialize
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                reject(
                    new BTPPaymentsError(
                        "unauthenticated",
                        "User must be logged in to use BTPay payments services."
                    )
                );
            }
        });
    });
}
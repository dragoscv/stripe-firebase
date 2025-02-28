import React, { createContext, useMemo, useReducer, useEffect, useCallback } from 'react';
import { getProducts, getCurrentUserSubscriptions, onCurrentUserSubscriptionUpdate, Product, Subscription, stripePayments } from ".";
import { firebaseApp } from "firewand";

export interface StripeFirebaseProviderProps {
    children: React.ReactNode;
    app: string;
}

export interface StripeFirebaseContextProps {
    products: Product[];
    subscriptions: Subscription[];
}

export const StripeFirebaseContext = createContext<StripeFirebaseContextProps | undefined>(undefined);

export function StripeFirebaseProvider({ children, app }: StripeFirebaseProviderProps) {

    const initialState = {
        products: [],
        subscriptions: []
    }

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'SET_PRODUCTS':
                return { ...state, products: action.payload };
            case 'SET_SUBSCRIPTIONS':
                return { ...state, subscriptions: action.payload };
            default:
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, initialState);


    useEffect(() => {
        if (state.products && state.products.length) return;

        // console.log('Getting products')
        const getProductsF = async () => {
            const payments = stripePayments(firebaseApp);

            const products = await getProducts(payments, {
                includePrices: true,
                activeOnly: true,
            });
            // console.log(products);
            const productsArray: any[] = []
            products.forEach((product: any) => {
                if (product.metadata.app === app) {
                    productsArray.push(product);
                }
            })
            console.log(productsArray)
            dispatch({ type: 'SET_PRODUCTS', payload: productsArray });
        }

        getProductsF();

    }, []);

    return <StripeFirebaseContext.Provider
        value={{
            products: state.products,
            subscriptions: state.subscriptions
        }}
    >
        {children}
    </StripeFirebaseContext.Provider>;
}
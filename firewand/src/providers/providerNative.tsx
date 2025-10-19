import React, { createContext, useReducer, useEffect, useCallback, useState } from 'react';
import { getProducts } from "../stripe/product";
import { getCurrentUserSubscriptions, onCurrentUserSubscriptionUpdate } from "../stripe/subscription";
import { stripePayments } from "../stripe/utils";
import { useUserSession } from "../hooks/useAuth";
import { firebaseApp } from "../firebase/app";
import { firestoreDB } from "../firebase";
import { collection, doc, getDocs, query as queryFirestore, where, onSnapshot, orderBy, limit, QuerySnapshot, DocumentSnapshot, getDoc } from "firebase/firestore";
import { fetchAndActivate, getRemoteConfig, getValue } from "firebase/remote-config";

import { Profile } from '../types';

// Define the interfaces specifically for the native provider
export interface FirewandContextNativeProps {
    user: any | null;
    userDetails: any | null;
    users: any[] | null;
    fetchUsers: () => void;
    products: any[] | null;
    userSubscriptions: any[] | null;
    userPayments: any[] | null;
    userInvoices: any[] | null;
    userProfiles: Profile[] | null;
    platformPayments: any[] | null;
    isSubscribed: boolean;
    userActiveSubscriptions: any[] | null;
    remoteConfig: any | null;
}

export interface FirewandProviderNativeProps {
    children: React.ReactNode;
    app: string;
    logs?: boolean;
}

export interface FirewandStateNativeProps {
    user: any | null;
    userDetails: any | null;
    users: any[] | null;
    products: any[] | null;
    userSubscriptions: any[] | null;
    userPayments: any[] | null;
    userInvoices: any[] | null;
    userProfiles: Profile[] | null;
    platformPayments: any[] | null;
    isSubscribed: boolean;
    userActiveSubscriptions: any[] | null;
    remoteConfig: any | null;
}

export interface FirewandActionNativeProps {
    type: string;
    payload: any;
}

export const FirewandContextNative = createContext<FirewandContextNativeProps | undefined>(undefined);

export function FirewandProviderNative({ children, app, logs }: FirewandProviderNativeProps) {
    if (!app) {
        throw new Error('App name is required in the FirewandProviderNative component');
    }

    if (logs) console.log('FirewandProviderNative initializing with app:', app);

    const { user, userDetails } = useUserSession();
    const [loading, setLoading] = useState({
        profiles: false,
        subscriptions: false,
        payments: false,
    });

    const initialState: FirewandStateNativeProps = {
        products: [],
        userSubscriptions: [],
        user: null,
        userDetails: null,
        users: [],
        userPayments: [],
        userInvoices: [],
        userProfiles: [],
        platformPayments: [],
        isSubscribed: false,
        userActiveSubscriptions: [],
        remoteConfig: null,
    }

    const reducer = (state: FirewandStateNativeProps, action: FirewandActionNativeProps) => {
        if (logs) console.log('FirewandProviderNative reducer:', action.type, action.payload);

        switch (action.type) {
            case 'SET_PRODUCTS':
                return { ...state, products: action.payload };
            case 'SET_USER_SUBSCRIPTIONS':
                return { ...state, userSubscriptions: action.payload };
            case 'SET_USERS':
                return { ...state, users: action.payload };
            case 'SET_USER_DETAILS':
                return { ...state, userDetails: action.payload };
            case 'SET_USER_PROFILES':
                return { ...state, userProfiles: action.payload };
            case 'SET_USER_PAYMENTS':
                return { ...state, userPayments: action.payload };
            case 'SET_USER_INVOICES':
                return { ...state, userInvoices: action.payload };
            case 'SET_PLATFORM_PAYMENTS':
                return { ...state, platformPayments: action.payload };
            case 'SET_IS_SUBSCRIBED':
                return { ...state, isSubscribed: action.payload };
            case 'SET_USER_ACTIVE_SUBSCRIPTIONS':
                return { ...state, userActiveSubscriptions: action.payload };
            case 'SET_REMOTE_CONFIG':
                return { ...state, remoteConfig: action.payload };
            default:
                console.warn(`Unhandled action type: ${action.type}`);
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, initialState);

    // Fetch users from Firestore
    const fetchUsers = useCallback(async () => {
        if (state.users && state.users.length > 0) return;
        const q = queryFirestore(collection(firestoreDB, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users: any = [];
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id;
                users.push(docData);
            });
            dispatch({ type: 'SET_USERS', payload: users });
        });

        return () => unsubscribe();
    }, []);

    // Fetch user details from Firestore
    useEffect(() => {
        if (!user) return;
        const getUserDetails = async () => {
            const userDoc = doc(firestoreDB, 'users', user.uid);
            const userDocSnap = await getDoc(userDoc);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                dispatch({ type: 'SET_USER_DETAILS', payload: userData });
            }
        }

        getUserDetails();
    }, [user]);

    // Fetch products from Stripe
    useEffect(() => {
        if (state.products && state.products.length) return;

        const getProductsF = async () => {
            const payments = stripePayments(firebaseApp);

            const products = await getProducts(payments, {
                includePrices: true,
                activeOnly: true,
            });
            const productsArray: any[] = []
            products.forEach((product: any) => {
                if (product.metadata.app === app) {
                    productsArray.push(product);
                }
            })
            dispatch({ type: 'SET_PRODUCTS', payload: productsArray });
        }

        getProductsF();
    }, []);

    // Fetch remote config
    useEffect(() => {
        const firebaseRemoteConfig = getRemoteConfig(firebaseApp);
        firebaseRemoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 10000 : 3600000;
        firebaseRemoteConfig.settings.fetchTimeoutMillis = 60000;
        firebaseRemoteConfig.defaultConfig = {
            "maintanace": false
        };
        fetchAndActivate(firebaseRemoteConfig).then(() => {
            const remoteConfig = getValue(firebaseRemoteConfig, "settings");
            dispatch({ type: 'SET_REMOTE_CONFIG', payload: JSON.parse(remoteConfig.asString()) });
        }).catch((error) => {
            console.log(error);
        });
    }, []);

    // Fetch user subscriptions from Firestore
    useEffect(() => {
        if (!user || !user.uid) {
            dispatch({ type: 'SET_IS_SUBSCRIBED', payload: false });
            return;
        }

        const payments = stripePayments(firebaseApp)
        const getSubscriptions = async () => {
            const subscriptions = await getCurrentUserSubscriptions(payments);
            const subscriptionsWithInvoices: any[] = []
            subscriptions.forEach((subscription: any) => {
                const invoiceRef = collection(firestoreDB, `customers/${user?.uid}/subscriptions/${subscription.id}/invoices`);
                const q = queryFirestore(invoiceRef, orderBy('created', 'desc'));
                const querySnapshot = getDocs(q);
                const invoices: any[] = [];
                querySnapshot.then((snapshot: QuerySnapshot) => {
                    snapshot.forEach((doc: DocumentSnapshot) => {
                        invoices.push(doc.data());
                    });
                })
                subscription.invoices = invoices;
                subscriptionsWithInvoices.push(subscription);
            })

            dispatch({ type: 'SET_USER_SUBSCRIPTIONS', payload: subscriptionsWithInvoices });

            const activeSubscriptions: any[] = [];
            subscriptionsWithInvoices.forEach((subscription: any) => {
                if (subscription.status === 'active' || subscription.status === 'trialing') {
                    const subscriptionProductId = subscription.product
                    const product = state.products?.find((product: any) => product.id === subscriptionProductId)
                    if (product?.stripe_metadata_app === app) {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: true });
                        activeSubscriptions.push(subscription);
                    }
                }
            })
            dispatch({ type: 'SET_USER_ACTIVE_SUBSCRIPTIONS', payload: activeSubscriptions });
        }

        if (user) getSubscriptions();

        if (user) onCurrentUserSubscriptionUpdate(payments, (subscriptions) => {
            for (const change of subscriptions.changes) {
                if (change.type === 'added') {
                    if (change.subscription.status === 'active') {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: true });
                    }
                }
                if (change.type === 'removed') {
                    if (change.subscription.status !== 'active') {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: false });
                    }
                }
                if (change.type === 'modified') {
                    if (change.subscription.status === 'active') {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: true });
                    } else {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: false });
                    }
                }
            }
        })
    }, [user, state.products]);

    // Fetch user payments from Firestore
    useEffect(() => {
        if (!user) return;

        const getPayments = async () => {
            const paymentsArray: any[] = []
            const paymentsQuery = queryFirestore(
                collection(firestoreDB, `customers/${user?.uid}/payments`),
                limit(100)
            );

            const querySnapshot = await getDocs(paymentsQuery);

            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id
                if (doc.data().id) paymentsArray.push(docData);
            });

            dispatch({ type: 'SET_USER_PAYMENTS', payload: paymentsArray });
        }

        getPayments();
    }, [user]);

    // Fetch user profiles from Firestore
    useEffect(() => {
        if (!user) return;

        const q = queryFirestore(collection(firestoreDB, `profiles`), where('uid', '==', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const profiles: Profile[] = [];
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id;
                profiles.push(docData as Profile);
            });
            dispatch({ type: 'SET_USER_PROFILES', payload: profiles });
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch user invoices from Firestore
    useEffect(() => {
        if (!user) return;

        const getInvoices = async () => {
            const invoicesArray: any[] = []
            const invoicesQuery = queryFirestore(
                collection(firestoreDB, `customers/${user?.uid}/invoices`),
                limit(100)
            );

            const querySnapshot = await getDocs(invoicesQuery);

            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id
                if (doc.data().id) invoicesArray.push(docData);
            });

            if (state.userSubscriptions) {
                state.userSubscriptions.forEach((subscription: any) => {
                    subscription.invoices?.forEach((invoice: any) => {
                        invoicesArray.push(invoice);
                    })
                });
            }

            //sort invoices by created date
            invoicesArray.sort((a, b) => {
                return new Date(b.created).getTime() - new Date(a.created).getTime();
            });

            dispatch({ type: 'SET_USER_INVOICES', payload: invoicesArray });
        }

        getInvoices();
    }, [user, state.userSubscriptions]);

    return (
        <FirewandContextNative.Provider
            value={{
                user,
                userDetails,
                users: state.users,
                fetchUsers,
                products: state.products,
                userSubscriptions: state.userSubscriptions,
                userPayments: state.userPayments,
                userInvoices: state.userInvoices,
                userProfiles: state.userProfiles,
                platformPayments: state.platformPayments,
                isSubscribed: state.isSubscribed,
                userActiveSubscriptions: state.userActiveSubscriptions,
                remoteConfig: state.remoteConfig
            }}
        >
            {children}
        </FirewandContextNative.Provider>
    );
}
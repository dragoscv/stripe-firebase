import React, { createContext, useMemo, useReducer, useEffect, useCallback, useState } from 'react';
import { getProducts } from "../stripe/product";
import { getCurrentUserSubscriptions, onCurrentUserSubscriptionUpdate } from "../stripe/subscription";
import { stripePayments } from "../stripe/utils";
import { useUserSession } from "../hooks/useAuth";
import { firebaseApp } from "../firebase/app";
import { firestoreDB, firebaseMessaging } from "../firebase";
import { collection, doc, setDoc, getDocs, query as queryFirestore, where, onSnapshot, collectionGroup, orderBy, limit, QuerySnapshot, DocumentSnapshot, deleteDoc, startAfter, getDoc, Timestamp } from "firebase/firestore";
import { fetchAndActivate, getRemoteConfig, getValue } from "firebase/remote-config";
import { getToken, Messaging } from "firebase/messaging";
import { v4 as uuidv4 } from 'uuid';

import {
    FirewandContextProps,
    FirewandProviderProps,
    FirewandStateProps,
    FirewandActionProps,
    Profile
} from '../types';

export const FirewandContext = createContext<FirewandContextProps | undefined>(undefined);

export function FirewandProvider({ children, app, logs }: FirewandProviderProps) {
    if (!app) {
        throw new Error('App name is required in the FirewandProvider component');
    }

    if (logs) console.log('FirewandProvider initializing with app:', app);

    const { user, userDetails } = useUserSession();
    const [loading, setLoading] = useState({
        profiles: false,
        subscriptions: false,
        payments: false,
        // other resources
    });

    const initialState: FirewandStateProps = {
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
        currentProfile: '',
        currentProfileDetails: null,
        remoteConfig: null,
        profiles: [],
        publicProfiles: [],
    }

    const reducer = (state: FirewandStateProps, action: FirewandActionProps) => {
        if (logs) console.log('FirewandProvider reducer:', action.type, action.payload);

        switch (action.type) {
            case 'SET_PRODUCTS':
                return { ...state, products: action.payload };
            case 'SET_SUBSCRIPTIONS':
                return { ...state, subscriptions: action.payload };
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
            case 'SET_USER_SUBSCRIPTIONS':
                return { ...state, userSubscriptions: action.payload };
            case 'SET_USER_ACTIVE_SUBSCRIPTIONS':
                return { ...state, userActiveSubscriptions: action.payload };
            case 'SET_CURRENT_PROFILE':
                return { ...state, currentProfile: action.payload };
            case 'SET_REMOTE_CONFIG':
                return { ...state, remoteConfig: action.payload };
            case 'SET_LOADING_STEPS':
                return { ...state, loadingSteps: action.payload };
            case 'SET_CREDITS_TOTAL':
                return { ...state, creditsTotal: action.payload };
            default:
                console.warn(`Unhandled action type: ${action.type}`);
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, initialState);


    const fetchUsers = useCallback(async () => {
        if (state.users && state.users.length > 0) return;
        if (logs) console.log('Fetching users from Firestore');

        const q = queryFirestore(collection(firestoreDB, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users: any = [];
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id;
                users.push(docData);
            });
            if (logs) console.log('Users fetched:', users.length);
            dispatch({ type: 'SET_USERS', payload: users });
        });

        return () => unsubscribe();
    }, [logs]);

    const fetchPlatformPayments = useCallback(async () => {
        if (!user) return;
        if (logs) console.log('Fetching platform payments');

        const getPlatformPayments = async () => {
            const paymentsArray: any[] = []
            // Query the 'payments' subcollection from all 'customers'
            const paymentsQuery = queryFirestore(
                collectionGroup(firestoreDB, "payments"),
                orderBy("created", "desc"),
                limit(100)
            );

            // Get the query results
            const querySnapshot = await getDocs(paymentsQuery);

            // Process the documents
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id
                paymentsArray.push(docData);
            });

            if (logs) console.log('Platform payments fetched:', paymentsArray.length);
            dispatch({ type: 'SET_PLATFORM_PAYMENTS', payload: paymentsArray });
        }

        getPlatformPayments();
    }, [user, logs]);

    const switchCurrentProfile = useCallback((profile: string) => {
        //add to session storage
        console.log('Switching profile to', profile);
        sessionStorage.setItem('currentProfile', profile);
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile });
    }, []);

    //fetch a public profile from firestore
    const fetchPublicProfile = useCallback(async (profileId: string) => {
        console.log('Fetching public profile', profileId);

        const found: string[] = []

        // const q = queryFirestore(collection(firestoreDB, "publicProfiles"), where("id", "==", profileId));

        return found;

    }, []);


    //================================================================================================

    //fetch user details from firestore
    useEffect(() => {
        if (!user) return;
        // console.log('Getting user details')
        const getUserDetails = async () => {
            const userDoc = doc(firestoreDB, 'users', user.uid);
            const userDocSnap = await getDoc(userDoc);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                // console.log(userData);
                dispatch({ type: 'SET_USER_DETAILS', payload: userData });
            }
        }

        getUserDetails();
    }, [user]);

    //fetch products from stripe-firebase
    useEffect(() => {
        if (state.products && state.products.length) return;

        if (logs) console.log('Fetching products from Stripe');

        const getProductsF = async () => {
            const payments = stripePayments(firebaseApp);

            const products = await getProducts(payments, {
                includePrices: true,
                activeOnly: true,
            });

            if (logs) console.log('Raw products from Stripe:', products.length);

            const productsArray: any[] = []
            products.forEach((product: any) => {
                if (product.metadata.app === app) {
                    productsArray.push(product);
                }
            })

            if (logs) console.log('Filtered products for app:', productsArray.length);
            dispatch({ type: 'SET_PRODUCTS', payload: productsArray });
        }

        getProductsF();
    }, [logs, app]);

    //This code gets the remote config from the db
    useEffect(() => {
        // console.log('Getting remote config')
        const firebaseRemoteConfig = getRemoteConfig(firebaseApp);
        firebaseRemoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 10000 : 3600000;
        firebaseRemoteConfig.settings.fetchTimeoutMillis = 60000;
        firebaseRemoteConfig.defaultConfig = {
            "maintanace": false
        };
        fetchAndActivate(firebaseRemoteConfig).then(() => {
            const remoteConfig = getValue(firebaseRemoteConfig, "settings");
            // console.log(JSON.parse(remoteConfig.asString()));
            dispatch({ type: 'SET_REMOTE_CONFIG', payload: JSON.parse(remoteConfig.asString()) });
        }).catch((error) => {
            console.log(error);
        });

    }, []);

    //register FCM token
    useEffect(() => {
        if (!user) return;

        let tries = 0;
        const deviceId = uuidv4(); // Generate a unique device ID

        const getFCMToken = async () => {
            console.log('Getting FCM token');
            if (tries > 3) return;
            tries++;

            const messaging: Messaging | null = await firebaseMessaging;
            const userDocRef = doc(firestoreDB, 'users', user.uid);

            // Get the user document to check for existing tokens
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            const existingTokens = userData.fcmTokens || {};
            const currentToken = existingTokens[deviceId];

            console.log('Current token for device', currentToken);

            // Only proceed with getting a new token if we need one
            const status = await Notification.requestPermission();
            if (status === 'granted') {
                if (messaging) {
                    try {
                        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
                        if (token && token !== currentToken) {
                            console.log('New token generated:', token);

                            // Create updated tokens object with all existing tokens preserved
                            const updatedTokens = {
                                ...existingTokens,
                                [deviceId]: token
                            };

                            await setDoc(userDocRef, {
                                fcmTokens: updatedTokens
                            }, { merge: true });
                            return token;
                        } else {
                            console.log('Using existing token');
                            return currentToken;
                        }
                    } catch (error) {
                        console.log('Error retrieving token:', error);
                        // Don't recursively call - use setTimeout instead
                        setTimeout(() => {
                            if (tries < 3) {
                                getFCMToken();
                            }
                        }, 1000);
                    }
                } else {
                    console.log('No messaging instance available.');
                    return null;
                }
            }
        };

        let userInteracted = false;
        const handleUserInteracted = async () => {
            if (userInteracted) return;
            userInteracted = true;
            await getFCMToken();
            console.log('User interacted');
        };

        window.addEventListener('click', handleUserInteracted);
        window.addEventListener('touchstart', handleUserInteracted);
        window.addEventListener('keydown', handleUserInteracted);

        // Clean up event listeners
        return () => {
            window.removeEventListener('click', handleUserInteracted);
            window.removeEventListener('touchstart', handleUserInteracted);
            window.removeEventListener('keydown', handleUserInteracted);
        };
    }, [user]);

    //set currentProfile from session storage
    useEffect(() => {
        // console.log('Setting currentProfile from session storage')
        const currentProfile = sessionStorage.getItem('currentProfile');
        if (currentProfile) {
            dispatch({ type: 'SET_CURRENT_PROFILE', payload: currentProfile });
        }
    }, []);

    //fetch user subscriptions from firestore
    useEffect(() => {
        if (!user || !user.uid) {
            dispatch({ type: 'SET_IS_SUBSCRIBED', payload: false });
            return;
        }
        // console.log('Getting subscriptions')
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
            // console.log(subscriptionsWithInvoices);
            subscriptionsWithInvoices.forEach((subscription: any) => {
                if (subscription.status === 'active' || subscription.status === 'trialing') {

                    // console.log(state.products)
                    // console.log(subscription);

                    const subscriptionProductId = subscription.product
                    const product = state.products?.find((product: any) => product.id === subscriptionProductId)
                    // console.log(product);
                    if (product?.stripe_metadata_app === app) {
                        dispatch({ type: 'SET_IS_SUBSCRIBED', payload: true });
                        activeSubscriptions.push(subscription);
                        dispatch({ type: 'SET_LOADING_STEPS', payload: 'isSubscribed' })
                    }
                }
            })
            // console.log(activeSubscriptions);
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

    //fetch user payments from firestore
    useEffect(() => {
        if (!user) return;
        // console.log('Getting user payments')
        const getPayments = async () => {
            const paymentsArray: any[] = []
            // Query the 'payments' subcollection from the current user
            const paymentsQuery = queryFirestore(
                collection(firestoreDB, `customers/${user?.uid}/payments`),
                limit(100) // Adjust the limit as needed to get the most recent payments
            );

            // Get the query results
            const querySnapshot = await getDocs(paymentsQuery);

            // Process the documents
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id
                // console.log(doc.id, " => ", doc.data());
                if (doc.data().id) paymentsArray.push(docData);
            });

            // console.log(paymentsArray);
            dispatch({ type: 'SET_USER_PAYMENTS', payload: paymentsArray });
        }

        getPayments();
    }, [user]);

    //fetch user profiles from firestore
    useEffect(() => {
        if (!user) return;
        // console.log('Getting user profiles')
        const q = queryFirestore(collection(firestoreDB, `profiles`), where('uid', '==', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const profiles: Profile[] = [];
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id;
                profiles.push(docData as Profile);
            });
            // console.log(profiles);
            dispatch({ type: 'SET_USER_PROFILES', payload: profiles });
        });


        return () => unsubscribe();

    }, [user]);

    //fetch user invoices from firestore
    useEffect(() => {
        if (!user) return;
        // console.log('Getting user invoices')
        const getInvoices = async () => {
            const invoicesArray: any[] = []
            // Query the 'invoices' subcollection from the current user
            const invoicesQuery = queryFirestore(
                collection(firestoreDB, `customers/${user?.uid}/invoices`),
                limit(100) // Adjust the limit as needed to get the most recent invoices
            );

            // Get the query results
            const querySnapshot = await getDocs(invoicesQuery);

            // Process the documents
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                docData.id = doc.id
                // console.log(doc.id, " => ", doc.data());
                if (doc.data().id) invoicesArray.push(docData);
            });

            // console.log(invoicesArray);

            if (state.userSubscriptions) {
                state.userSubscriptions.forEach((subscription: any) => {
                    subscription.invoices.forEach((invoice: any) => {
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
    }, [user]);

    //set current user details
    useEffect(() => {
        if (!user) return;
        // console.log('Setting current user details')
        const creditsTotal = {
            profiles: 0,
            services: 0,
            offers: 0
        }
        if (state.userSubscriptions && state.userSubscriptions.length > 0) {
            // console.log(state.userSubscriptions);
            state.userSubscriptions.forEach((subscription: any) => {
                // const subscriptionPrice = state.products?.find((product: any) => product.id === subscription.product)?.prices.find((price: any) => price.id === subscription.price);
                // console.log(subscriptionPrice);

                const subscriptionProduct = state.products?.find((product: any) => product.id === subscription.product);
                // console.log(subscriptionProduct);

                if (subscription.status === 'active' || subscription.status === 'trialing') {

                    creditsTotal.profiles = Number(subscriptionProduct?.stripe_metadata_credits_profiles);
                    creditsTotal.services = Number(subscriptionProduct?.stripe_metadata_credits_services);
                    creditsTotal.offers = subscriptionProduct?.stripe_metadata_credits_offers === 'unlimited' ? 9999 : Number(subscriptionProduct?.stripe_metadata_credits_offers);
                } else if (subscription.status === 'canceled') {
                    const today = new Date();
                    const cancelDate = new Date(subscription.canceled_at);

                    // Convert both dates to timestamps
                    const todayTimestamp = today.setHours(0, 0, 0, 0);
                    const cancelDateTimestamp = cancelDate.setHours(0, 0, 0, 0);

                    // console.log(todayTimestamp, cancelDateTimestamp);

                    if (todayTimestamp > cancelDateTimestamp) {
                        // console.log('Subscription is canceled but not yet expired');
                        creditsTotal.profiles = Number(subscriptionProduct?.stripe_metadata_credits_profiles);
                        creditsTotal.services = Number(subscriptionProduct?.stripe_metadata_credits_services);
                        creditsTotal.offers = subscriptionProduct?.stripe_metadata_credits_offers === 'unlimited' ? 9999 : Number(subscriptionProduct?.stripe_metadata_credits_offers);
                    } else {
                        // console.log('Subscription is canceled and expired');
                        creditsTotal.profiles = 0;
                        creditsTotal.services = 0;
                        creditsTotal.offers = 0;
                    }
                }
                else {
                    creditsTotal.profiles = 0;
                    creditsTotal.services = 0;
                    creditsTotal.offers = 0;
                }

            })
        }
        dispatch({ type: 'SET_CREDITS_TOTAL', payload: creditsTotal });
    }, [user, state.userSubscriptions, state.products]);

    return <FirewandContext.Provider
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
            fetchPlatformPayments,
            isSubscribed: state.isSubscribed,
            userActiveSubscriptions: state.userActiveSubscriptions,
            currentProfile: state.currentProfile,
            switchCurrentProfile,
            remoteConfig: state.remoteConfig,
            profiles: state.profiles,
            publicProfiles: state.publicProfiles,
            fetchPublicProfile,
        }}
    >
        {children}
    </FirewandContext.Provider>;
}
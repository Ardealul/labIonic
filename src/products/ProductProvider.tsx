import React, {useCallback, useContext, useEffect, useReducer} from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { ProductProps } from './ProductProps';
import { createProduct, getProducts, newWebSocket, updateProduct, eraseProduct, getProduct } from './ProductApi';
import { AuthContext } from "../auth";

import { Plugins } from "@capacitor/core";
const { Storage } = Plugins;

const log = getLogger('ProductProvider');

type SaveProductFn = (product: ProductProps, connected: boolean) => Promise<any>;
type DeleteProductFn = (product: ProductProps, connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;

export interface ProductsState {
    products?: ProductProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    deleting: boolean,
    savingError?: Error | null,
    deletingError?: Error | null,
    saveProduct?: SaveProductFn,
    deleteProduct?: DeleteProductFn;
    updateServer?: UpdateServerFn,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ProductsState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_PRODUCTS_STARTED = 'FETCH_PRODUCTS_STARTED';
const FETCH_PRODUCTS_SUCCEEDED = 'FETCH_PRODUCTS_SUCCEEDED';
const FETCH_PRODUCTS_FAILED = 'FETCH_PRODUCTS_FAILED';

const SAVE_PRODUCT_STARTED = 'SAVE_PRODUCT_STARTED';
const SAVE_PRODUCT_SUCCEEDED = 'SAVE_PRODUCT_SUCCEEDED';
const SAVE_PRODUCT_SUCCEEDED_OFFLINE = "SAVE_PRODUCT_SUCCEEDED_OFFLINE";
const SAVE_PRODUCT_FAILED = 'SAVE_PRODUCT_FAILED';

const DELETE_PRODUCT_STARTED = "DELETE_PRODUCT_STARTED";
const DELETE_PRODUCT_SUCCEEDED = "DELETE_PRODUCT_SUCCEEDED";
const DELETE_PRODUCT_FAILED = "DELETE_PRODUCT_FAILED";

const reducer: (state: ProductsState, action: ActionProps) => ProductsState =
    (state, { type, payload }) => {
        switch (type) {
            //fetching
            case FETCH_PRODUCTS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_PRODUCTS_SUCCEEDED:
                return { ...state, products: payload.products, fetching: false };
            case FETCH_PRODUCTS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };

            //saving
            case SAVE_PRODUCT_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_PRODUCT_SUCCEEDED:
                const products = [...(state.products || [])];
                const product = payload.product;
                if (product._id !== undefined) {
                    log("PRODUCT in ProductProvider: " + JSON.stringify(product));
                    const index = products.findIndex((it) => it._id === product._id);
                    if (index === -1) {
                        products.splice(0, 0, product);
                    } else {
                        products[index] = product;
                    }
                    return { ...state, products, saving: false };
                }
                return { ...state, products};
            case SAVE_PRODUCT_SUCCEEDED_OFFLINE: {
                const products = [...(state.products || [])];
                const product = payload.product;
                const index = products.findIndex((it) => it._id === product._id);
                if (index === -1) {
                    products.splice(0, 0, product);
                } else {
                    products[index] = product;
                }
                return { ...state, products, saving: false };
            }
            case SAVE_PRODUCT_FAILED:
                return { ...state, savingError: payload.error, saving: false };

            //deleting
            case DELETE_PRODUCT_STARTED:
                return { ...state, deletingError: null, deleting: true };
            case DELETE_PRODUCT_SUCCEEDED: {
                const products = [...(state.products || [])];
                const product = payload.product;
                const index = products.findIndex((it) => it._id === product._id);
                products.splice(index, 1);
                return { ...state, products, deleting: false };
            }
            case DELETE_PRODUCT_FAILED:
                return { ...state, deletingError: payload.error, deleting: false };

            default:
                return state;
        }
    };

export const ProductContext = React.createContext<ProductsState>(initialState);

interface ProductProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { products, fetching, fetchingError, saving, savingError, deleting } = state;

    useEffect(getProductsEffect, [token]);
    useEffect(wsEffect, [token]);

    const saveProduct = useCallback<SaveProductFn>(saveProductCallback, [token]);
    const deleteProduct = useCallback<DeleteProductFn>(deleteProductCallback, [token]);
    const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [token]);

    const value = {
        products,
        fetching,
        fetchingError,
        saving,
        savingError,
        saveProduct,
        deleting,
        deleteProduct,
        updateServer,
    };

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;

    function getProductsEffect() {
        let canceled = false;
        fetchProducts();
        return () => {
            canceled = true;
        }

        async function fetchProducts() {
            if (!token?.trim()) {
                return;
            }
            try {
                log('fetchProducts started');
                dispatch({ type: FETCH_PRODUCTS_STARTED });
                const products = await getProducts(token);
                log('fetchProducts succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_PRODUCTS_SUCCEEDED, payload: { products } });
                }
            }
            catch (error) {
                //if there's no network, grab products from local storage
                const allKeys = Storage.keys();
                console.log(allKeys);
                let promisedProducts;
                var i;

                promisedProducts = await allKeys.then(function (allKeys) {
                    // local storage also contains the login token, therefore we must get only product objects
                    const promises = [];
                    for (i = 0; i < allKeys.keys.length; i++) {
                        const promiseProduct = Storage.get({ key: allKeys.keys[i] });
                        promises.push(promiseProduct);
                    }
                    return promises;
                });

                const allProducts = [];
                for (i = 0; i < promisedProducts.length; i++) {
                    const promise = promisedProducts[i];
                    const prod = await promise.then(function (it) {
                        var object;
                        try {
                            object = JSON.parse(it.value!);
                        } catch (e) {
                            return null;
                        }
                        console.log(typeof object);
                        console.log(object);
                        if (object.status !== 2) {
                            return object;
                        }
                        return null;
                    });
                    if (prod != null) {
                        allProducts.push(prod);
                    }
                }

                const products = allProducts;
                dispatch({ type: FETCH_PRODUCTS_SUCCEEDED, payload: { products: products } });
            }
        }
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if(token?.trim()) {
            closeWebSocket = newWebSocket(token,(message) => {
                if (canceled) {
                    return;
                }
                const { type, payload: product } = message;
                log(`ws message, product ${type} ${product._id}`);
                if (type === 'created' || type === 'updated') {
                    //dispatch({type: SAVE_PRODUCT_SUCCEEDED, payload: {product} });
                }
            });
            return () => {
                log('wsEffect - disconnecting');
                canceled = true;
                closeWebSocket?.();
            }
        }
    }

    async function saveProductCallback(product: ProductProps, connected: boolean) {
        try {
            console.log("E conectat? ")
            console.log(connected)
            if (!connected) {
                throw new Error();
            }
            log('saveProduct started');
            dispatch({ type: SAVE_PRODUCT_STARTED });
            const savedProduct = await (product._id ? updateProduct(token, product) : createProduct(token, product));
            log('saveProduct succeeded');
            dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: savedProduct } });
        }
        catch (error) {
            log('saveProduct failed with error: ', error);

            if (product._id === undefined) {
                product._id = generateRandomID()
                product.status = 1;
                alert("Product saved locally!!!");
            } else {
                product.status = 2;
                alert("Product updated locally!!!");
            }
            await Storage.set({
                key: product._id,
                value: JSON.stringify(product),
            });

            dispatch({ type: SAVE_PRODUCT_SUCCEEDED_OFFLINE, payload: { product: product } });
        }
    }

    async function deleteProductCallback(product: ProductProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            dispatch({ type: DELETE_PRODUCT_STARTED });
            const deletedProduct = await eraseProduct(token, product);
            console.log(deletedProduct);
            await Storage.remove({ key: product._id! });
            dispatch({ type: DELETE_PRODUCT_SUCCEEDED, payload: { product: product } });
        }
        catch (error) {
            product.status = 3;
            await Storage.set({
                key: JSON.stringify(product._id),
                value: JSON.stringify(product),
            });
            alert("Product deleted locally!!!");
            dispatch({ type: DELETE_PRODUCT_SUCCEEDED, payload: { product: product } });
        }
    }

    async function updateServerCallback() {
        //grab products from local storage
        const allKeys = Storage.keys();
        let promisedProducts;
        var i;

        promisedProducts = await allKeys.then(function (allKeys) {
            const promises = [];
            for (i = 0; i < allKeys.keys.length; i++) {
                const promiseProduct = Storage.get({ key: allKeys.keys[i] });
                promises.push(promiseProduct);
            }
            return promises;
        });

        for (i = 0; i < promisedProducts.length; i++) {
            const promise = promisedProducts[i];
            const product = await promise.then(function (it) {
                var object;
                try {
                    object = JSON.parse(it.value!);
                } catch (e) {
                    return null;
                }
                return object;
            });
            if (product !== null) {
                //product has to be added
                if (product.status === 1) {
                    dispatch({ type: DELETE_PRODUCT_SUCCEEDED, payload: { product: product } });
                    await Storage.remove({ key: product._id });
                    const oldProduct = product;
                    delete oldProduct._id;
                    oldProduct.status = 0;
                    const newProduct = await createProduct(token, oldProduct);
                    dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: newProduct } });
                    await Storage.set({
                        key: JSON.stringify(newProduct._id),
                        value: JSON.stringify(newProduct),
                    });
                }
                //product has to be updated
                else if (product.status === 2) {
                    product.status = 0;
                    const newProduct = await updateProduct(token, product);
                    dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: newProduct } });
                    await Storage.set({
                        key: JSON.stringify(newProduct._id),
                        value: JSON.stringify(newProduct),
                    });
                }
                //product has to be deleted
                else if (product.status === 3) {
                    product.status = 0;
                    await eraseProduct(token, product);
                    await Storage.remove({ key: product._id });
                }
            }
        }
    }

    //generates random id for storing product locally
    function generateRandomID() {
        return "_" + Math.random().toString(36).substr(2, 9);
    }
};

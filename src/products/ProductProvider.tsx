import React, {useCallback, useContext, useEffect, useReducer} from 'react';
import PropTypes from 'prop-types';
import {getLogger, withLogs} from '../core';
import { ProductProps } from './ProductProps';
import { createProduct, getProducts, newWebSocket, updateProduct } from './ProductApi';
import {AuthContext} from "../auth";

import { Plugins } from "@capacitor/core";
import Product from "./Product";
import {key} from "ionicons/icons"; //capacitor plugin
const { Storage } = Plugins;

const log = getLogger('ProductProvider');

type SaveProductFn = (product: ProductProps) => Promise<any>;

export interface ProductsState {
    products?: ProductProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveProduct?: SaveProductFn,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ProductsState = {
    fetching: false,
    saving: false,
};

const FETCH_PRODUCTS_STARTED = 'FETCH_PRODUCTS_STARTED';
const FETCH_PRODUCTS_SUCCEEDED = 'FETCH_PRODUCTS_SUCCEEDED';
const FETCH_PRODUCTS_FAILED = 'FETCH_PRODUCTS_FAILED';
const SAVE_PRODUCT_STARTED = 'SAVE_PRODUCT_STARTED';
const SAVE_PRODUCT_SUCCEEDED = 'SAVE_PRODUCT_SUCCEEDED';
const SAVE_PRODUCT_FAILED = 'SAVE_PRODUCT_FAILED';

const reducer: (state: ProductsState, action: ActionProps) => ProductsState =
    (state, { type, payload }) => {
        switch (type) {
            case FETCH_PRODUCTS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_PRODUCTS_SUCCEEDED:
                return { ...state, products: payload.products, fetching: false };
            case FETCH_PRODUCTS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_PRODUCT_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_PRODUCT_SUCCEEDED:
                const products = [...(state.products || [])];
                const product = payload.product;
                log("produsul este: ")
                log(product)
                if (product._id !== undefined) {
                    const index = products.findIndex(prod => prod._id === product._id);
                    if (index === -1) {
                        products.splice(0, 0, product);
                    } else {
                        products[index] = product;
                    }
                    return { ...state, products, saving: false };
                }
            case SAVE_PRODUCT_FAILED:
                return { ...state, savingError: payload.error, saving: false };
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
    const { products, fetching, fetchingError, saving, savingError } = state;
    useEffect(getProductsEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveProduct = useCallback<SaveProductFn>(saveProductCallback, [token]);
    const value = { products, fetching, fetchingError, saving, savingError, saveProduct };
    log('returns');
    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );

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
                log(products);
                log('fetchProducts succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_PRODUCTS_SUCCEEDED, payload: { products } });
                }
            } catch (error) {
                log('fetchProducts failed');
                //dispatch({ type: FETCH_PRODUCTS_FAILED, payload: { error } });

                let realKeys: string[] = [];
                await Storage.keys().then((keys) => {
                   return keys.keys.forEach(function (value){
                       if(value != "user")
                        realKeys.push(value);
                   });
                });
                //console.log(realKeys);

                let values: string[] = [];
                for (const key1 of realKeys) {
                    await Storage.get({key: key1}).then((value)=>{
                        // @ts-ignore
                        values.push(value.value);
                    })
                }
                //console.log(values);

                const products: ProductProps[] = [];
                for(const value of values){
                    var product = JSON.parse(value);
                    //console.log(product);
                    products.push(product);
                }

                console.log(products);

                if (!canceled) {
                    dispatch({ type: FETCH_PRODUCTS_SUCCEEDED, payload: { products } });
                }
            }
        }
    }

    async function saveProductCallback(product: ProductProps) {
        try {
            log('saveProduct started');
            dispatch({ type: SAVE_PRODUCT_STARTED });
            const savedProduct = await (product._id ? updateProduct(token, product) : createProduct(token, product));
            log('saveProduct succeeded');
            dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: savedProduct } });
        } catch (error) {
            log('saveProduct failed');
            dispatch({ type: SAVE_PRODUCT_FAILED, payload: { error } });
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
                log(`ws message, product ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({type: SAVE_PRODUCT_SUCCEEDED, payload: {product} });
                }
            });
            return () => {
                log('wsEffect - disconnecting');
                canceled = true;
                closeWebSocket?.();
            }
        }
    }
};

import axios from 'axios'
import { getLogger, withLogs, authConfig, baseUrl } from '../core';
import {ProductProps} from "./ProductProps";

import { Plugins } from "@capacitor/core"; //capacitor plugin
const { Storage } = Plugins;

const productUrl = `http://${baseUrl}/api/product`;

export const getProducts: (token: string) => Promise<ProductProps[]> = (token) => {
    //return withLogs(axios.get(productUrl, authConfig(token)), 'getProducts');

    var result = axios.get(productUrl, authConfig(token));
    result.then(function (result){
        result.data.forEach(async (product: ProductProps) => {
            await Storage.set({
                key: product._id!,
                value: JSON.stringify(product),
            });
        });
    });
    return withLogs(result, "getProducts");
}

export const getProduct: (token: string, id: string) => Promise<ProductProps> = (token,id) => {
    var result = axios.get(`${productUrl}/${id}`, authConfig(token))
    return withLogs(result, "getProduct");
}

export const createProduct: (token: string, product: ProductProps) => Promise<ProductProps> = (token, product) => {
    //return withLogs(axios.post(productUrl, product, authConfig(token)), 'createProduct');

    var result = axios.post(productUrl, product, authConfig(token));
    result.then(async function (result) {
        var product = result.data;
        await Storage.set({
            key: product._id!,
            value: JSON.stringify(product),
        });
    });
    return withLogs(result, "createProduct");
}

export const updateProduct: (token: string, product: ProductProps) => Promise<ProductProps> = (token, product) => {
    //return withLogs(axios.put(`${productUrl}/${product._id}`, product, authConfig(token)), 'updateProduct');

    console.log("TOKEN: "+token);
    var result = axios.put(`${productUrl}/${product._id}`, product, authConfig(token));
    result
        .then(async function (result){
        var product = result.data;
        await Storage.set({
            key: product._id!,
            value: JSON.stringify(product),
        });
    })
        .catch((error) => {
            console.log(error);
    });
    return withLogs(result, "updateProduct");
}

export const eraseProduct: (token: string, product: ProductProps) => Promise<ProductProps[]> = (token, product) => {
    var result = axios.delete(`${productUrl}/${product._id}`, authConfig(token));
    result.then(async function (r) {
        await Storage.remove({ key: product._id! });
    });
    return withLogs(result, "deleteProduct");
};

interface MessageData{
    type: string;
    payload: ProductProps;
}

const log = getLogger('ws')

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from "react-router";
import { Redirect } from "react-router-dom";
import {
    IonButton, IonContent, IonFab, IonFabButton, IonHeader, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonLoading, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar, createAnimation
} from '@ionic/react';
import Product from './Product';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';
import { AuthContext } from "../auth";
import './Style.css'
import {ProductProps} from "./ProductProps";
import { useNetwork } from "../utils/useNetwork";

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError, updateServer } = useContext(ProductContext);

    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);

    const { networkStatus } = useNetwork();

    const [filter, setFilter] = useState<string | undefined>("any price");
    const [searchText, setSearchText] = useState<string>("");
    const [pos, setPos] = useState(5);
    const selectOptions = ["< 10 RON", ">= 10 RON", "any price"];

    const [productsShow, setProductsShow] = useState<ProductProps[]>([]);

    const { logout } = useContext(AuthContext);
    const handleLogout = () => {
        logout?.();
        return <Redirect to={{ pathname: "/login" }} />;
    };

    log('render');

    async function searchNext($event: CustomEvent<void>) {
        if (products && pos < products.length) {
            setProductsShow([...products.slice(0, 5 + pos)]); //
            setPos(pos + 5);
        } else {
            setDisableInfiniteScroll(true);
        }
        log('products from ' + 0 + " to " + pos)
        log(productsShow)
        await ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    //update server when network status is back online
    useEffect(() => {
        if (networkStatus.connected === true) {
            updateServer && updateServer();
        }
    }, [networkStatus.connected]);

    //pagination
    useEffect(() => {
        if (products?.length) {
            setProductsShow(products.slice(0, pos));
        }
    }, [products]);

    //filter
    useEffect(() => {
        if (filter && products) {
            if(filter === ">= 10 RON") {
                setProductsShow(products.filter((product) => parseInt(product.price) >= 10));
            }
            else if(filter === "< 10 RON"){
                setProductsShow(products.filter((product) => parseInt(product.price) < 10));
            }
            else if(filter === "any price"){
                setProductsShow(products);
            }
        }
    }, [filter]); //it can depend also on products

    //search
    useEffect(() => {
        if(searchText === "" && products){
            setProductsShow(products);
        }
        if (searchText && products) {
            setProductsShow(products.filter((product) => product.name.startsWith(searchText)));
        }
    }, [searchText]);

    useEffect(simpleAnimation, []);
    useEffect(groupAnimations, []);

    //simple animation
    function simpleAnimation() {
        const el = document.querySelector(".fabAdd");
        if (el) {
            const animation = createAnimation()
                .addElement(el)
                .duration(1000)
                .direction("alternate")
                .iterations(Infinity)
                .keyframes([
                    {offset: 0, transform: "scale(1)", opacity: "1"},
                    {offset: 1, transform: "scale(0.5)", opacity: "0.5"},
                ]);
            animation.play();
        }
    }

    //group animations
    function groupAnimations() {
        const elA = document.querySelector('.networkDiv');
        const elB = document.querySelector('.searchBar');
        const elC = document.querySelector('.filterBar');
        if (elA && elB && elC) {
            const animationA = createAnimation()
                .addElement(elA)
                .fromTo('transform', 'scale(1)','scale(0.75)');

            const animationB = createAnimation()
                .addElement(elB)
                .fromTo('transform', 'scale(1)', 'scale(0.75)');

            const animationC = createAnimation()
                .addElement(elC)
                .fromTo('transform', 'scale(1)', 'scale(0.75)');

            const parentAnimation = createAnimation()
                .duration(5000)
                .addAnimation([animationA, animationB, animationC]);

            parentAnimation.play();
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButton className={"logoutButton"} shape="round" slot="end" onClick={handleLogout}>
                        LOGOUT
                    </IonButton>
                    <IonTitle className={"title"}>PRODUCT LIST</IonTitle>
                </IonToolbar>
                <div className={"networkDiv"}>
                    Network is: <b>{networkStatus.connected ? "online" : "offline"}</b>
                </div>
                <IonSearchbar className={"searchBar"} color="dark" value={searchText} debounce={500} onIonChange={(e) => setSearchText(e.detail.value!)}/>
                <IonItem className="ionItem filterBar" color="dark">
                    <IonLabel>Filter products by price</IonLabel>
                    <IonSelect value={filter} onIonChange={(e) => setFilter(e.detail.value)}>
                        {selectOptions.map((option) => (
                            <IonSelectOption key={option} value={option}>
                                {option}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>
            </IonHeader>
            <IonContent className={"content"}>
                <IonLoading isOpen={fetching} message="Fetching products" />

                {productsShow &&
                    productsShow.map((product: ProductProps) => {
                        return (
                            <IonList lines={"none"} className={"list"}>
                                <Product
                                    key={product._id}
                                    _id={product._id}
                                    name={product.name}
                                    description={product.description}
                                    price={product.price}
                                    status={product.status}
                                    version={product.version}
                                    photoPath={product.photoPath}
                                    latitude={product.latitude}
                                    longitude={product.longitude}
                                    onEdit={(id) => history.push(`/product/${id}`)} />
                            </IonList>
                        );
                    })
                }

                <IonInfiniteScroll threshold="75px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading for more products..."/>
                </IonInfiniteScroll>

                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch products'}</div>
                )}
                <IonFab className={"fabAdd"} vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/product')}>
                        {/*<IonIcon icon={add} />*/}
                        <IonImg src={require('../icons/add-to-basket.png')}/>
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default ProductList;
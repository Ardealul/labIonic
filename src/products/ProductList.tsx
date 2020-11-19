import React, {useContext, useEffect, useState} from 'react';
import {Redirect, RouteComponentProps} from 'react-router';
import {
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel,
    IonList, IonLoading,
    IonPage, IonSearchbar, IonSelect, IonSelectOption,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import Product from './Product';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';
import { AuthContext } from "../auth";
import './Style.css'
import {ProductProps} from "./ProductProps";

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError } = useContext(ProductContext);

    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
    const [pos, setPos] = useState(5);

    const [filter, setFilter] = useState<string | undefined>("any price");
    const selectOptions = ["< 10 RON", ">= 10 RON", "any price"];
    const [searchText, setSearchText] = useState<string>("");

    const [productsShow, setProductsShow] = useState<ProductProps[]>([]);

    const { logout } = useContext(AuthContext);
    const handleLogout = () => {
        logout?.();
        return <Redirect to={{ pathname: "/login" }} />;
    };

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

    log('render');

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
    }, [filter]);

    //search
    useEffect(() => {
        if(searchText === "" && products){
            setProductsShow(products);
        }
        if (searchText && products) {
            setProductsShow(products.filter((product) => product.name.startsWith(searchText)));
        }
    }, [searchText]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButton shape="round" slot="end" onClick={handleLogout}>LOGOUT</IonButton>
                    <IonTitle className={"title"}>PRODUCT LIST</IonTitle>
                </IonToolbar>
                <IonSearchbar className="searchBar" color="dark" value={searchText} debounce={500} onIonChange={(e) => setSearchText(e.detail.value!)}/>
                <IonItem className="ionItem" color="dark">
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
                {/*{products && (*/}
                {/*    <IonList lines={"none"} className={"list"}>*/}
                {/*        {products.map(({ _id, name, description, price}) =>*/}
                {/*            <Product key={_id} _id={_id} name={name} description={description} price={price} onEdit={id => history.push(`/product/${id}`)} />*/}
                {/*            )}*/}
                {/*    </IonList>*/}
                {/*)}*/}

                {productsShow &&
                productsShow.map((product: ProductProps) => {
                    return (
                        <IonList lines={"none"} className={"list"}>
                            <Product key={product.name} _id={product._id} name={product.name} description={product.description} price={product.price} onEdit={id => history.push(`/product/${id}`)} />
                        </IonList>
                    );
                })}

                <IonInfiniteScroll threshold="75px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading for more products..."/>
                </IonInfiniteScroll>

                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch products'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
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
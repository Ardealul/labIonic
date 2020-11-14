import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonImg,
    IonList, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import Product from './Product';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';
import './Style.css'

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError } = useContext(ProductContext);
    log('render');
    return (
        <IonPage className={"page"}>
            <IonHeader className={"header"}>
                <IonToolbar>
                    <IonTitle className={"title"}>PRODUCT LIST</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className={"content"}>
                <IonLoading isOpen={fetching} message="Fetching products" />
                {products && (
                    <IonList lines={"none"} className={"list"}>
                        {products.map(({ id, name, description, price}) =>
                            <Product key={id} id={id} name={name} description={description} price={price} onEdit={id => history.push(`/product/${id}`)} />)}
                    </IonList>
                )}
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
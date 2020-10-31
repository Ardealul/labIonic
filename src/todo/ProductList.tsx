import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Product from './Product';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError } = useContext(ProductContext);
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Product list</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching products" />
                {products && (
                    <IonList>
                        {products.map(({ id, name}) =>
                            <Product key={id} id={id} name={name} onEdit={id => history.push(`/product/${id}`)} />)}
                    </IonList>
                )}
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch products'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/product')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default ProductList;
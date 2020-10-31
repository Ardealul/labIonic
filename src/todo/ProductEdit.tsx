import React, { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';
import { RouteComponentProps } from 'react-router';
import { ProductProps } from './ProductProps';

const log = getLogger('ProductEdit');

interface ProductEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const ProductEdit: React.FC<ProductEditProps> = ({ history, match }) => {
    const { products, saving, savingError, saveProduct } = useContext(ProductContext);
    const [name, setName] = useState('');
    const [product, setProduct] = useState<ProductProps>();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const product = products?.find(prod => prod.id === routeId);
        setProduct(product);
        if (product) {
            setName(product.name);
        }
    }, [match.params.id, products]);
    const handleSave = () => {
        const editedProduct = product ? { ...product, name } : { name };
        saveProduct && saveProduct(editedProduct).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit product</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save product
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput value={name} onIonChange={e => setName(e.detail.value || '')} />
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save product'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ProductEdit;

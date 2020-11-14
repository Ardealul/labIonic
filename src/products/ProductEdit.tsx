import React, { useContext, useEffect, useState } from 'react';
import {
    IonLabel,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader, IonImg,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { getLogger } from '../core';
import { ProductContext } from './ProductProvider';
import { RouteComponentProps } from 'react-router';
import { ProductProps } from './ProductProps';
import './Style.css'

const log = getLogger('ProductEdit');

interface ProductEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const ProductEdit: React.FC<ProductEditProps> = ({ history, match }) => {
    const { products, saving, savingError, saveProduct } = useContext(ProductContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [product, setProduct] = useState<ProductProps>();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const product = products?.find(prod => prod.id === routeId);
        setProduct(product);
        if (product) {
            setName(product.name);
            setDescription(product.description)
            setPrice(product.price)
        }
    }, [match.params.id, products]);
    const handleSave = () => {
        const editedProduct = product ? { ...product, name, description, price} : { name, description, price };
        saveProduct && saveProduct(editedProduct).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage className={"page"}>
            <IonHeader className={"header"}>
                <IonToolbar>
                    <IonTitle>EDIT</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            <IonImg className={"saveButton"} src={require('../icons/save-file.png')}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className={"content"}>
                <IonGrid>
                    <IonRow>
                        <IonCol><IonLabel>Name: </IonLabel></IonCol>
                        <IonCol><IonInput value={name} placeholder={"ex: Pepsi"} onIonChange={e => setName(e.detail.value || '')} /></IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol><IonLabel>Description: </IonLabel></IonCol>
                        <IonCol><IonInput value={description} placeholder={"ex: suc"} onIonChange={e => setDescription(e.detail.value || '')} /></IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol><IonLabel>Price: </IonLabel></IonCol>
                        <IonCol><IonInput value={price} placeholder={"ex: 10"} onIonChange={e => setPrice(e.detail.value || '')} /></IonCol>
                    </IonRow>
                </IonGrid>
                {/*<IonLabel>Name: </IonLabel>*/}
                {/*<IonInput value={name} placeholder={"ex: Pepsi"} onIonChange={e => setName(e.detail.value || '')} />*/}
                {/*<IonLabel>Description: </IonLabel>*/}
                {/*<IonInput value={description} placeholder={"ex: suc"} onIonChange={e => setDescription(e.detail.value || '')} />*/}
                {/*<IonLabel>Price: </IonLabel>*/}
                {/*<IonInput value={price} placeholder={"ex: 10"} onIonChange={e => setPrice(e.detail.value || '')} />*/}
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save product'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ProductEdit;

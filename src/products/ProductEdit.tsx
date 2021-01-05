import React, { useContext, useEffect, useState } from 'react';
import {
    IonLabel, IonButton, IonButtons, IonContent, IonHeader, IonImg, IonInput, IonLoading, IonPage,
    IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonItem, IonFab, IonFabButton, IonIcon, IonActionSheet, createAnimation
} from '@ionic/react';
import { getLogger } from '../core';
import { useNetwork } from "../utils/useNetwork";
import { ProductContext } from './ProductProvider';
import { RouteComponentProps } from 'react-router';
import { ProductProps } from './ProductProps';
import './Style.css'

import { camera, trash, close } from "ionicons/icons";
import { Photo, usePhotoGallery } from "../utils/usePhotoGallery";
import { MyMap } from "../utils/MyMap";

const log = getLogger('ProductEdit');

interface ProductEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const ProductEdit: React.FC<ProductEditProps> = ({ history, match }) => {
    const {
        products,
        saving,
        savingError,
        saveProduct,
        deleteProduct,
    } = useContext(ProductContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [photoPath, setPhotoPath] = useState('');
    const [latitude, setLatitude] = useState(46.7533824);
    const [longitude, setLongitude] = useState(23.5831296);
    const [product, setProduct] = useState<ProductProps>();
    const { networkStatus } = useNetwork();

    const { photos, takePhoto, deletePhoto } = usePhotoGallery();
    const [photoToDelete, setPhotoToDelete] = useState<Photo>();

    useEffect(() => {
        const routeId = match.params.id || '';
        const product = products?.find((it) => it._id === routeId);
        setProduct(product);
        if (product) {
            setName(product.name);
            setDescription(product.description);
            setPrice(product.price);
            setPhotoPath(product.photoPath);
            if (product.latitude) setLatitude(product.latitude);
            if (product.longitude) setLongitude(product.longitude);
        }
    }, [match.params.id, products]);

    //save button
    const handleSave = () => {
        const editedProduct = product ? {
            ...product,
            name,
            description,
            price,
            status: 0,
            version: product.version ? product.version + 1 : 1,
            photoPath,
            latitude,
            longitude
        }
        : {
            name,
            description,
            price,
            status: 0,
            version: 1,
            photoPath,
            latitude,
            longitude
        };
        saveProduct &&
        saveProduct(editedProduct, networkStatus.connected).then(() => history.goBack());
    };

    //delete button
    const handleDelete = () => {
        const editedProduct = product ? {
            ...product,
            name,
            description,
            price,
            status: 0,
            version: 0,
            photoPath,
            latitude,
            longitude
        }
        : {
            name,
            description,
            price,
            status: 0,
            version: 0,
            photoPath,
            latitude,
            longitude
        };
        deleteProduct &&
            deleteProduct(editedProduct, networkStatus.connected).then(() =>
                history.goBack()
            );
    };

    useEffect(chainAnimations, []);

    //chain animations
    function chainAnimations() {
        const elA = document.querySelector('.nameRow');
        const elB = document.querySelector('.descriptionRow');
        const elC = document.querySelector('.priceRow');
        if (elA && elB && elC) {
            const animationA = createAnimation()
                .addElement(elA)
                .duration(2000)
                .fromTo('transform', 'scale(1)', 'scale(0.75)')
                .afterStyles({
                    background: 'rgba(88, 88, 88, 1)'
                });

            const animationB = createAnimation()
                .addElement(elB)
                .duration(2000)
                .fromTo('transform', 'scale(1)', 'scale(0.75)')
                .afterStyles({
                    background: 'rgba(80, 80, 80, 1)'
                });

            const animationC = createAnimation()
                .addElement(elC)
                .duration(2000)
                .fromTo('transform', 'scale(1)', 'scale(0.75)')
                .afterStyles({
                    background: 'rgba(72, 72, 72, 1)'
                });

            (async () => {
                await animationA.play();
                await animationB.play();
                await animationC.play();
            })();
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className={"title"}>EDIT</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            <IonImg className={"saveButton"} src={require('../icons/save-file.png')}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className={"content"}>
                <IonGrid>
                    <IonRow className={"nameRow"}>
                        <IonCol><IonLabel>Name: </IonLabel></IonCol>
                        <IonCol><IonInput value={name} placeholder={"ex: Pepsi"} onIonChange={e => setName(e.detail.value || '')} /></IonCol>
                    </IonRow>
                    <IonRow className={"descriptionRow"}>
                        <IonCol><IonLabel>Description: </IonLabel></IonCol>
                        <IonCol><IonInput value={description} placeholder={"ex: suc"} onIonChange={e => setDescription(e.detail.value || '')} /></IonCol>
                    </IonRow>
                    <IonRow className={"priceRow"}>
                        <IonCol><IonLabel>Price: </IonLabel></IonCol>
                        <IonCol><IonInput value={price} placeholder={"ex: 10"} onIonChange={e => setPrice(e.detail.value || '')} /></IonCol>
                    </IonRow>
                </IonGrid>

                <IonImg
                    style={{width: "600px", height: "600px", margin: "0 auto"}}
                    alt={"No photo"}
                    src={photoPath}
                    // onClick = {() => {setPhotoToDelete(photos?.find(vd => vd.webviewPath=== photoPath))}}
                />
                <MyMap
                    lat={latitude}
                    lng={longitude}
                    onMapClick={(location: any) => {
                        setLatitude(location.latLng.lat());
                        setLongitude(location.latLng.lng());
                    }}
                />

                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save product'}</div>
                )}

                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton
                        onClick={() => {
                            const photoTaken = takePhoto();
                            photoTaken.then((data) => {
                                setPhotoPath(data.webviewPath!);
                            });
                        }}
                    >
                        <IonIcon icon={camera} />
                    </IonFabButton>
                </IonFab>

                <IonActionSheet
                    isOpen={!!photoToDelete}
                    buttons={[
                        {
                            text: "Delete",
                            role: "destructive",
                            icon: trash,
                            handler: () => {
                                if (photoToDelete) {
                                    deletePhoto(photoToDelete);
                                    setPhotoToDelete(undefined);
                                    setPhotoPath("")
                                }
                            },
                        },
                        {
                            text: "Cancel",
                            icon: close,
                            role: "cancel",
                        },
                    ]}
                    onDidDismiss={() => setPhotoToDelete(undefined)}
                />

            </IonContent>
        </IonPage>
    );
};

export default ProductEdit;

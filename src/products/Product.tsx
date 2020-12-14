import React from 'react';
import {ProductProps} from "./ProductProps";
import './Style.css'
import {
    IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonItem, IonLabel
} from "@ionic/react";

interface ProductPropsExt extends ProductProps{
    onEdit: (_id?: string) => void;
}

const Product: React.FC<ProductPropsExt> = ({_id, name, description, price, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonCard className="card">
                <IonCardHeader>
                    <IonItem>
                        <IonCardSubtitle className="productName">
                            <IonLabel>{name}</IonLabel>
                        </IonCardSubtitle>
                        <IonButton className="productPrice" fill="outline" slot="end">{price} RON</IonButton>
                    </IonItem>
                    <IonCardTitle className="productDescription">
                        <IonLabel>Description: {description}</IonLabel>
                    </IonCardTitle>
                </IonCardHeader>
            </IonCard>
        </IonItem>
    );
};

export default Product;
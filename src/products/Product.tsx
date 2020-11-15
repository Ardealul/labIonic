import React from 'react';
import {ProductProps} from "./ProductProps";
import {IonItem, IonLabel} from "@ionic/react";

interface ProductPropsExt extends ProductProps{
    onEdit: (_id?: string) => void;
}

const Product: React.FC<ProductPropsExt> = ({_id, name, description, price, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(_id)}>
            <IonLabel>{name}</IonLabel>
        </IonItem>
    );
};

export default Product;
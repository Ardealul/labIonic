import React, {useState} from 'react';
import {ProductProps} from "./ProductProps";
import './Style.css'
import {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonImg,
    IonItem,
    IonLabel,
    createAnimation,
    IonModal
} from "@ionic/react";

interface ProductPropsExt extends ProductProps{
    onEdit: (_id?: string) => void;
}

const Product: React.FC<ProductPropsExt> = ({_id, name, description, price, onEdit, photoPath}) => {
    const [showModal, setShowModal] = useState(false);

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector("ion-backdrop")!)
            .fromTo("opacity", "0.01", "var(--backdrop-opacity)");

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector(".modal-wrapper")!)
            .keyframes([
                { offset: 0, opacity: "0", transform: "scale(0)" },
                { offset: 1, opacity: "0.99", transform: "scale(1)" },
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing("ease-out")
            .duration(750)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    };

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction("reverse");
    };

    return (
        <IonItem>
            <IonCard className="card" onClick={() => onEdit(_id)}>
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
            <IonImg
                src={photoPath}
                alt={"No photo"}
                style={{ height: 100, width: 100 }}
                onClick={() => {
                    setShowModal(true);
                }}
            />
            <IonModal
                isOpen={showModal}
                enterAnimation={enterAnimation}
                leaveAnimation={leaveAnimation}
            >
                <img src={photoPath} />
                <IonButton onClick={() => setShowModal(false)}>Close Modal</IonButton>
            </IonModal>
        </IonItem>
    );
};

export default Product;
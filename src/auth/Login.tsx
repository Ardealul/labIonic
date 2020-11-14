import React, { useContext, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import {
    IonButton, IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonInput, IonLabel,
    IonLoading,
    IonPage, IonRow,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { AuthContext } from './AuthProvider';
import { getLogger } from '../core';
import './Style.css'

const log = getLogger('Login');

interface LoginState {
    username?: string;
    password?: string;
}

export const Login: React.FC<RouteComponentProps> = ({ history }) => {
    const { isAuthenticated, isAuthenticating, login, authenticationError } = useContext(AuthContext);
    const [state, setState] = useState<LoginState>({});
    const { username, password } = state;
    const handleLogin = () => {
        log('handleLogin...');
        login?.(username, password);
    };
    log('render');
    if (isAuthenticated) {
        return <Redirect to={{ pathname: '/' }} />
    }
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className={"title"}>LOGIN</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol><IonLabel>Username: </IonLabel></IonCol>
                        <IonCol>
                            <IonInput placeholder="ex: myUsername123" value={username}
                                      onIonChange={e => setState({...state, username: e.detail.value || ''})}/>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol><IonLabel>Password: </IonLabel></IonCol>
                        <IonCol>
                            <IonInput placeholder="ex: myPassword123" value={password}
                                      onIonChange={e => setState({...state, password: e.detail.value || ''})}/>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonLoading isOpen={isAuthenticating}/>
                {authenticationError && (
                    <div>{authenticationError.message || 'Failed to authenticate'}</div>
                )}
                <IonButton onClick={handleLogin}>Login</IonButton>
            </IonContent>
        </IonPage>
    );
};

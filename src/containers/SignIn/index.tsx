import { Button } from 'antd';

import config from '@beda.software/emr-config';

import { getAuthorizeUrl, OAuthState } from '@beda.software/emr/dist/services/auth';

import { AppFooter } from '@beda.software/emr/dist/components/BaseLayout/Footer/index';
import {S} from './SignIn.styles'


function authorize(state?: OAuthState) {
    window.location.href = getAuthorizeUrl({
        authPath: 'auth/authorize',
        params: new URLSearchParams({ client_id: config.clientId, response_type: 'token' }),
        state,
    });
}

interface SignInProps {
    originPathName?: string;
}

export function SignIn(props: SignInProps) {
    return (
        <S.Container>
            <S.Form>
                <S.Header>
                    <S.Text>Welcome to Beda EMR</S.Text>
                </S.Header>
                <S.Message>
                    <b> It is a customized version of Beda EMR for FHIR® Lab project</b>
                </S.Message>
                <Button
                    type="primary"
                    onClick={() => authorize({ nextUrl: props.originPathName })}
                    size="large"
                >
                    Log in with aidbox.fhirlab.net
                </Button>
            </S.Form>
            <AppFooter type="light" />
        </S.Container>
    );
}

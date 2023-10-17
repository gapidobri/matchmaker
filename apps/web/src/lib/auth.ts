import { UserManager } from 'oidc-client-ts';
import {
	PUBLIC_OAUTH_CLIENT_ID,
	PUBLIC_OAUTH_ISSUER,
	PUBLIC_OAUTH_REDIRECT_URI,
} from '$env/static/public';

export const auth = new UserManager({
	authority: PUBLIC_OAUTH_ISSUER,
	client_id: PUBLIC_OAUTH_CLIENT_ID,
	redirect_uri: PUBLIC_OAUTH_REDIRECT_URI,
});

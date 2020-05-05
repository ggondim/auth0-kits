const querystring = require('querystring');
const fetch = require('node-fetch');

const TOKEN_URL = '/oauth/token';
const MANAGEMENT_API_AUDIENCE = '/api/v2/';
const USER_URL = '/api/v2/users/';

class Auth0Service {
  constructor({ auth0TenantUrl, oauthRedirectUri, clientId, clientSecret }) {
    this.auth0TenantUrl = auth0TenantUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.oauthRedirectUri = oauthRedirectUri;
  }

  /**
   * Gets an Auth0 Management API token, used for managing your enterprise account in Auth0
   * @param {Object?} [options={}] { clientId, clientSecret }
   * @param {String?} [options.clientId] Client ID of your Auth0 tenant. If not specified, defaults to class  `clientId` property.
   * @returns {Promise<String|null>} async/Promise resolved with the access token or null if the API not emitted a token.
   * @async
   * @memberof Auth0Service
   */
  async getManagementApiToken({ clientId, clientSecret } = {}) {
    const client_id = clientId || this.clientId;
    const client_secret = clientSecret || this.clientSecret;

    const body = querystring.stringify({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
        audience: `${this.auth0TenantUrl}${MANAGEMENT_API_AUDIENCE}`,
    });

    const response = await fetch(`${this.auth0TenantUrl}${TOKEN_URL}`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const resToken = await response.json();

    return (!resToken || !resToken.access_token) ? null : resToken.access_token;
  }

  /**
   * Gets user identity info in Auth0 Management API.
   * @param {String} userId User ID (usually it comes from `sub` property inside access_token JWT).
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async getUserInfo(userId) {
    const managementToken = await this.getManagementApiToken();
    const url = `${this.auth0TenantUrl}${USER_URL}${userId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
      },
    });
    return response.json();
  }

  /**
   * Exchanges an authorization code by an access token in Auth0.
   * @param {String} authorizationCode Authorization code granted to user during login flow.
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async getUserAccessTokenByCode(authorizationCode) {
    const body = querystring.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.oauthRedirectUri,
        code: authorizationCode
    });
    const response = await fetch(`${this.auth0TenantUrl}${TOKEN_URL}`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.json();
  }

  /**
   * Exchanges a refresh token by a new acess token in Auth0.
   * @param {String} refreshToken Refresh token (opaque) granted for user.
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async renewToken(refreshToken) {
    const body = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirect_uri,
        refresh_token: refreshToken
    });
    const response = await fetch(`${this.auth0TenantUrl}${TOKEN_URL}`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.json();
  }
}

module.exports = Auth0Service;

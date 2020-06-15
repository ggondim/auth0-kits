/* eslint-disable no-use-before-define */
import SimpleCrypto from 'simple-crypto-js';
import utils from 'jwtiny';
import {
  addMinutes, fromUnixTime, subMinutes, differenceInMilliseconds, formatDistance,
} from 'date-fns';

import STORAGE_KEYS from './storage-keys';
import DEFAULT_SCOPES from './scopes';


async function _getTokenByAuthCode(code, authCodeUrl) {
  const response = await fetch(authCodeUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    throw response;
  }
  return response.json();
}

async function _getTokenByRefreshToken(refreshToken, refreshTokenUrl) {
  const response = await fetch(refreshTokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    throw response;
  }
  return response.json();
}

async function debug(flag, thing, {
  method = 'log',
  debuggger = console,
} = {}) {
  if (flag) {
    debuggger[method](thing);
  }
}

class Auth0Service {
  /**
   *Cria uma instância da Auth0Service.
   * @param {Storage?} storage Storage a ser utilizado nas operações desse serviço (caso nulo, será usado o localStorage como padrão).
   * @param {Object?} opcoes {
   *     authCodeUrl,
   *     refreshTokenUrl,
   *     clientId,
   *     auth0url,
   *   }
   * @param {string?} opcoes.authCodeUrl URL da API de login (NOALVO) para obter um access_token através de um authorization_code. Caso nulo, será utilizada a variável de ambiente "VUE_APP_AUTH_CODE_URL".
   * @param {string?} opcoes.refreshTokenUrl URL da API de login (NOALVO) para obter um access_token através de um refresh_token. Caso nulo, será utilizada a variável de ambiente "VUE_APP_AUTH_REFRESH_URL".
   * @param {string?} opcoes.clientId ClientID da aplicação no Auth0. Caso nulo, será utilizada a variável de ambiente "VUE_APP_AUTH0_CLIENT_ID".
   * @param {string?} opcoes.auth0url URL da API do tenant da NOALVO no Auth0. Caso nulo, será utilizada a variável de ambiente "VUE_APP_AUTH0_URL".
   * @memberof Auth0Service
   */
  constructor({
    storage = window.localStorage,
    authCodeUrl,
    refreshTokenUrl,
    clientId,
    auth0url,
    afterLoginUrl,
    afterLogoutUrl,
    audience,
    renewTimer = 5000,
    storageKeys = STORAGE_KEYS,
    debug,
  } = {}) {
    this.storage = storage;
    this.authCodeUrl = authCodeUrl;
    this.refreshTokenUrl = refreshTokenUrl;
    this.clientId = clientId;
    this.auth0url = auth0url;
    this.afterLoginUrl = afterLoginUrl;
    this.afterLogoutUrl = afterLogoutUrl;
    this.audience = audience;
    this.debug = debug;
    this.renewTimer = renewTimer;
    this.storageKeys = storageKeys;
  }

  //#region STORAGE PROPERTIES
  /**
   * Access token gravado no storage.
   * @readonly
   * @memberof Auth0Service
   */
  get accessToken() {
    return this.storage[this.storageKeys.ACCESS_TOKEN];
  }

  /**
   * Payload do access token (JWT) gravado no storage.
   * @readonly
   * @memberof Auth0Service
   */
  get accessTokenPayload() {
    return JSON.parse(this.storage[this.storageKeys.ACCESS_TOKEN_PAYLOAD]);
  }

  /**
   * Informações de identidade do usuário gravadas no storage.
   * @readonly
   * @memberof Auth0Service
   */
  get user() {
    return JSON.parse(this.storage[this.storageKeys.USER]);
  }

  /**
   * Refresh token gravado no storage.
   * @readonly
   * @memberof Auth0Service
   */
  get refreshToken() {
    return this.storage[this.storageKeys.REFRESH_TOKEN];
  }

  /**
   * Chave criptográfica para o objeto de state, gravada no storage ou uma nova caso não tenha sido gravada.
   * @readonly
   * @memberof Auth0Service
   */
  get stateKey() {
    // mantive o getItem e o setItem uma vez que essa propriedade foi criaada para ser usada
    // apenas para o storage que inicializa o fluxo de carregamento do Auth0
    let stateKey = this.storage.getItem(this.storageKeys.STATE_KEY);
    if (!stateKey) {
      stateKey = btoa(Date.now());
      this.storage.setItem(this.storageKeys.STATE_KEY, stateKey);
    }
    return stateKey;
  }

  /**
   * Último provider (IDP) que o usuãrio usou para se autenticar.
   * @readonly
   * @memberof Auth0Service
   */
  get lastProviderConnection() {
    return this.storage[this.storageKeys.LAST_CONNECTION];
  }
  //#endregion

  //#region STORAGE METHODS
  /**
   * Limpa as chaves relacionadas a esse serviço no storage configurado.
   * @returns {void}
   * @memberof Auth0Service
   */
  clearStorage() {
    this.storage.removeItem(this.storageKeys.ACCESS_TOKEN);
    this.storage.removeItem(this.storageKeys.ACCESS_TOKEN_PAYLOAD);
    this.storage.removeItem(this.storageKeys.USER);
    this.storage.removeItem(this.storageKeys.LAST_CONNECTION);
    return null;
  }

  /**
   * Salva as informações após um logon no storage configurado.
   *
   * @param {Object} infos {
   *     accessToken,
   *     usuario,
   *     refreshToken,
   *   }
   * @param {String} infos.accessToken Access token emitido para o usuário logado no protocolo JWT.
   * @param {Object} infos.usuario Objeto com as informações de identidade do usuário logado retornadas pela API.
   * @param {String} infos.refreshToken Refresh token emitido para o usuário logado (opaque).
   * @memberof Auth0Service
   */
  saveStorage({
    accessToken,
    user,
    refreshToken,
  }) {
    this.clearStorage();

    if (accessToken) {
      this.storage.setItem(this.storageKeys.ACCESS_TOKEN, accessToken);
      this.storage.setItem(
        this.storageKeys.ACCESS_TOKEN_PAYLOAD,
        JSON.stringify(utils.parseJwt(accessToken)),
      );
    }

    if (user) {
      this.storage.setItem(this.storageKeys.USER, JSON.stringify(user));
      this.storage.setItem(this.storageKeys.LAST_CONNECTION, user.provider);
    }

    if (refreshToken) {
      this.storage.setItem(this.storageKeys.REFRESH_TOKEN, refreshToken);
    }
  }
  //#endregion

  //#region TOKEN METHODS
  /**
   * Obtém um novo token na API de login (NOALVO), através de um authorization_code ou um refresh_token.
   *
   * @async
   * @param {Object} opcoes { code, refreshToken }
   * @param {String?} opcoes.code Authorization Code emitido para o usuário.
   * @param {String?} opcoes.refreshToken Refresh Token (opaque) emitido para o usuário.
   * @returns {Promise<{
   *  accessToken: String,
   *  expiracao: Number,
   *  refreshToken: String,
   *  usuario: {
   *    nome: String,
   *    email: String,
   *    imagem: String?,
   *    provider: String
   *  }?
   * }>} Novo access_token emitido para o usuário, juntamente com suas informações de identidade.
   * @throws {Response} Objeto de resposta HTTP caso o access_token não tenha sido emitido.
   * @memberof Auth0Service
   */
  async getNewToken({ code, refreshToken }) {
    if (code) {
      return _getTokenByAuthCode(code, this.authCodeUrl);
    }
    if (refreshToken) {
      return _getTokenByRefreshToken(refreshToken, this.refreshTokenUrl);
    }
  }

  /**
   * Renova o access_token do usuário através do refresh_token gravado no storage.
   *
   * @async
   * @returns {Boolean} Booleano indicando se foi emitido um novo token com sucesso.
   * @memberof Auth0Service
   */
  async renewToken() {
    let worked = false;
    const refreshToken = this.refreshToken;
    if (refreshToken) {
      try {
        const result = await this.getNewToken({ refreshToken });
        if (result && result.accessToken) {
          this.saveStorage(result);
          worked = true;
        }
      } catch (e) {
        //
      }
    }
    return worked;
  }
  //#endregion

  //#region STATE METHODS
  /**
   * Gera um parâmetro de state criptografado para uso na URL de autorização do Auth0, utilizando como chave criptográfica a propriedade `stateKey`.
   *
   * @param {Object} objeto Objeto a ser criptografado.
   * @returns {String} Objeto criptografado.
   * @memberof Auth0Service
   */
  generateState(objeto) {
    const simpleCrypto = new SimpleCrypto(this.stateKey);
    return simpleCrypto.encrypt(objeto);
  }

  /**
   * Decripta um objeto de state utilizado no fluxo de autorização do Auth0, utilizando como chave criptográfica a propriedade `stateKey`.
   *
   * @param {String} encrypted Objeto criptografado por esse serviço.
   * @returns {Object} Objeto de state decriptado.
   * @memberof Auth0Service
   */
  parseState(encrypted) {
    const simpleCrypto = new SimpleCrypto(this.stateKey);
    const state = simpleCrypto.decrypt(encrypted, true);
    return state;
  }
  //#endregion

  /**
   * Gera um link de login no endpoint /authorize do Auth0, baseado em alguns parâmetros.
   *
   * @param {Object} opcoes [{
   *     redirect,
   *     provider,
   *     audience = 'noalvo:api',
   *     scopes = SCOPES_PADRAO,
   *     accessType = 'offline',
   *   }={}]
   * @param {String?} opcoes.redirect URL de redirecionamento após o fluxo de login.
   * @param {String?} opcoes.provider Provider (IDP) a ser utilizado para autenticação. Caso não especificado, será utiizado o útlimo provider usado pelo usuário que está gravado no storage.
   * @param {String?='noalvo:api'} opcoes.audience Audience a ser autenticada no Auth0.
   * @param {String[]?} opcoes.scopes Scopes padrão a autenticar para o usuário. Caso não especificado, será utilizada a constante `scopes` do pacote `@noalvo-libs/auth0-core`.
   * @param {String?='offline'} opcoes.accessType Access type a ser passado para o Auth0.
   * @returns {String} Link de login do endpoint /authorize do Auth0.
   * @memberof Auth0Service
   */
  getLoginLink({
    redirect,
    provider,
    audience,
    scopes = DEFAULT_SCOPES,
    accessType = 'offline',
  } = {}) {
    const { clientId, auth0url } = this;

    if (!audience) audience = this.audience;

    const redirectUri = `${window.location.protocol}//${window.location.host}/login`;
    const codeUrl = '/authorize?response_type=code';

    debugger;
    const state = this.generateState(redirect ? { redirect } : { ts: btoa(Date.now()) });
    const connection = provider || this.lastProviderConnection;

    const linkParams = `&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    let link = `${auth0url}${codeUrl}${linkParams}`;

    if (scopes) {
      link += `&scope=${Array.isArray(scopes) ? scopes.join('%20') : scopes}`;
    }

    if (connection) {
      link += `&connection=${connection}`;
    }

    if (audience) {
      link += `&audience=${audience}`;
    }

    if (accessType) {
      link += `&access_type=${accessType}&approval_prompt=force`;
    }

    return link;
  }

  /**
   * Configura e inicializa um timer de renovação de token.
   *
   * @param {Function} cbProgress Callback de progresso durante a renovação do token.
   * @param {Function} cbSuccess Callback de sucesso após o token renovado.
   * @param {Function} cbError Callback de erro caso o token não tenha sido renovado.
   * @returns {Number} Ponteiro de timeout
   * @memberof Auth0Service
   */
  setRenewTimer(cbProgress, cbSuccess, cbError) {
    const fiveMin = addMinutes(new Date(), 5);
    const exp = fromUnixTime(this.accessTokenPayload.exp);

    debug(this.debug, `exp: ${exp}`);

    const now = new Date();
    let delay;

    if (exp < now) {
      debug(this.debug, 'Delay = agora');
      delay = now;
    } else if (exp < fiveMin) {
      debug(this.debug, 'Delay = exp - 1 min');
      delay = subMinutes(exp, 1);
      if (delay <= now) {
        debug(this.debug, 'Exp-1 min < agora, delay = agora');
        delay = now;
      }
    } else {
      debug(this.debug, 'Delay = 5 min');
      delay = fiveMin;
    }

    debug(this.debug, `Timer de refresh setado para ${delay} (${formatDistance(delay, now)})`);
    const timer = setTimeout(async () => {
      debug(this.debug, 'Tentando renovar o token');
      await (async () => cbProgress());
      const worked = await this.renewToken();
      if (worked) {
        debug(this.debug, 'Chamando callback de sucesso');
        await (async () => cbSuccess())();
      } else {
        debug(this.debug, 'Chamando callback de erro');
        await (async () => cbError())();
      }
      clearInterval(timer);
    }, differenceInMilliseconds(delay, now));
    return timer;
  }

  /**
   * Inicia o fluxo de renovação automática de token.
   *
   * @param {Function} cbProgress Callback de progresso durante a renovação do token.
   * @param {Function} cbSuccess Callback de sucesso após o token renovado.
   * @param {Function} cbError Callback de erro caso o token não tenha sido renovado.
   * @returns {Boolean} Boolean indicando se houve sucesso ou falha ao autenticar o usuário.
   * @memberof Auth0Service
   */
  async loadingFlow(cbProgress, cbSuccess, cbError) {
    // se tem token
    if (this.accessTokenPayload) {
      debug(this.debug, 'Usuario logado, tem token');
      // se o token estiver expirado, tenta renovar
      if (utils.isExpired(this.accessTokenPayload)) {
        debug(this.debug, 'token expirado, tentando renovar');
        const newToken = await this.renewToken();
        // se conseguiu renovar, aplica o fluxo temporizado de refresh
        if (newToken) {
          debug(this.debug, 'token renovado, iniciando timer');
          this.setRenewTimer(cbProgress, cbSuccess, cbError);
          return true;
        }
        // se não conseguiu renovar, notifica erro
        debug(this.debug, 'não conseguiu renovar, notificar erro');
        return false;
      }
      // se não estiver expirado, aplica o fluxo temporizado de refresh
      debug(this.debug, 'não expirou, iniciando timer');
      this.setRenewTimer(cbProgress, cbSuccess, cbError);
      return true;
    }
    // se não tem token
    debug(this.debug, 'não tem token');
    return false;
  }
}

export default Auth0Service;

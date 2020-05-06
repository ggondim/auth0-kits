import CrossStorage from 'cross-storage-plus';
import { Defaults } from '@auth0-kits/client';
import Auth0StorageProvider from './Auth0StorageProvider';

const { Events, StorageKeys } = Defaults;

export class XAuthService {
  constructor({
    loginAppUrl,
    onAuthSuccess,
    onAuthProgress,
    onAuthError,
    xauthRoute = '/xauth',
    injectWindow = true,
    isInitialized = false,
    initializedStorage = null,
    copyToStorage = window.localStorage,
    storageKeys = StorageKeys,
  } = {}) {
    if (isInitialized) {
      this.storage = initializedStorage || window.xauth;
    }

    this.xauthUrl = `${loginAppUrl}${xauthRoute}`;
    this.storage = null;
    this.injectWindow = injectWindow;
    this.storageKeys = storageKeys;
    this.copyToStorage = copyToStorage;

    this.onAuthSuccess = onAuthSuccess;
    this.onAuthProgress = onAuthProgress;
    this.onAuthError = onAuthError;
  }

  async initialize() {
    this.storage = await CrossStorage.initializeClient(this.xauthUrl, {
      iframeId: 'xauth-iframe',
      initialProvider: Auth0StorageProvider,
    });

    if (this.injectWindow) window.xauth = this.storage;

    window.addEventListener('message', (event) => {
      if (Object.keys(Events).includes(event)) {
        this.copyAllToStorage().then(() => {
          switch(event.data.event) {
            case Events.ACCESS_RENEWED:
              return this.onAuthSuccess();
            case Events.ACCESS_RENEWING:
              return this.onAuthProgress();
            case Events.ACCESS_DENIED:
              return this.onAuthError(event.data.data);
          }
        })
      }
    });

    return this;
  }

  async copyAllToStorage() {
    const promises = [ Promise.resolve() ];
    if (this.copyToStorage) {
      promises = Object.keys(this.storageKeys).map((key) => {
        return this.copyToStorage[key] = this.storage[key];
      });
    }
    return Promise.all(promises);
  }
}

/**
 *
 * @param {object} options Opções de inicialização
 * @param {string} opcoes.loginAppUrl URL da aplicação de login a ser conectada
 * @param {string?} opcoes.xauthRoute Rota de cross login da aplicação de login
 * @param {function} opcoes.onAcessoRenovado Callback a ser chamado quando o acesso for renovado com sucesso
 * @param {function} opcoes.onAcessoNegado Callback a ser chamado quando o acesso for negado
 * @param {function} opcoes.onRenovandoAcesso Callback a ser chamado quando o acesso estiver sendo renovado
 * @returns {Promise<XAuthService>} Instância da classe de serviço NoalvoAuth
 */
export async function initializeXAuth(options) {
  const intance = new XAuthService(options);
  return intance.initialize();
}

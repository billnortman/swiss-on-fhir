/*
 * // Copyright 2021 Omar Hoblos
 * //
 * // Licensed under the Apache License, Version 2.0 (the "License");
 * // you may not use this file except in compliance with the License.
 * // You may obtain a copy of the License at
 * //
 * //     http://www.apache.org/licenses/LICENSE-2.0
 * //
 * // Unless required by applicable law or agreed to in writing, software
 * // distributed under the License is distributed on an "AS IS" BASIS,
 * // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * // See the License for the specific language governing permissions and
 * // limitations under the License.
 */

import { Component } from '@angular/core';
import { HttpService, } from '@service/http.service'
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc'
import { environment } from '@env/environment';
import { UtilService } from '@service/util.service'
import { errorObject } from '@interface/models'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  errorObject: errorObject = {
    flag: false,
    severity: '',
    msg: ''
  }

  tokenObjectForDisplay = {
    accessToken: 'No Token Found',
    idToken: 'No Token Found',
    claims: {},
    decodedAccessToken: null,
    expirationDate: null
  };

  navLinks = [
    { name: 'Home', code: 'home', active: true },
    { name: 'FHIR Data', code: 'bundle', active: false },
    { name: 'Logout', code: 'logout', active: false }
  ];

  constructor(
    private httpService: HttpService,
    private oauthService: OAuthService,
    private utilService: UtilService
  ) {
    this.initOAuth();
  }

  private checkIfTokenIsInSession() {
    if (this.oauthService.getAccessToken()?.length > 0) {
      this.tokenObjectForDisplay['accessToken'] = this.oauthService.getAccessToken();
      this.tokenObjectForDisplay['idToken'] = this.oauthService.getIdToken();
      this.tokenObjectForDisplay['refreshToken'] = this.oauthService.getRefreshToken();
      this.tokenObjectForDisplay['claims'] = this.oauthService.getIdentityClaims();
      this.tokenObjectForDisplay['claimsKeys'] = this.utilService.returnObjectKeys(this.oauthService.getIdentityClaims());
      this.tokenObjectForDisplay['decodedAccessTokenKeys'] = this.utilService.returnObjectKeys(this.utilService.decodeToken(this.oauthService.getAccessToken()));
      this.tokenObjectForDisplay['decodedAccessToken'] = this.utilService.decodeToken(this.oauthService.getAccessToken());
      this.tokenObjectForDisplay['expirationDate'] = new Date(this.oauthService.getAccessTokenExpiration());
    }
  }

  private initOAuth() {
    if (environment?.clientSecret?.length > 0) {
      authCodeFlowConfig.dummyClientSecret = environment?.clientSecret;
    }
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(
      data => {
        if (data) {
          this.checkIfTokenIsInSession();
        }
      }
    ).catch(
      error => {
        this.errorObject.flag = true;
        this.errorObject.severity = 'warning';
        this.errorObject.msg = 'Cannot find discovery document. This is likely an issue with not being able to connect your IDP. Check your IDP configuration settings, or your application settings. If a discovery document was found, then there is likely an issue with the token exchange.';
        console.error(error)
      }
    );
  }

  queryString(resource?: string, modifier?: string) {
    return `/${resource}${modifier}`;
  }

  toggleClass(item: Object) {
    this.resetErrorObject();
    if (item['code'] === 'logout') {
      this.logout();
    } 
    for (const itemFound of this.navLinks) {
      if (itemFound['name'] !== item['name']) {
        itemFound['active'] = false;
      }
    }
    item['active'] = true;
    this.returnCurrentViewSelection();
  }

  copyToClipboard(value: string) {
    this.utilService.copyToClipboard(value);
  }

  returnCurrentViewSelection() {
    return this.navLinks.find(item => item.active).code;
  }

  login() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    this.resetErrorObject();
    this.httpService.logout();
  }

  resetErrorObject() {
    this.errorObject.flag = false;
    this.errorObject.severity = '';
    this.errorObject.msg = '';
  }

  returnTokenStatus() {
    return this.oauthService.hasValidAccessToken();
  }

}

export const authCodeFlowConfig: AuthConfig = {
  issuer: environment.issuer,
  scope: environment.scopes,
  clientId: environment.clientId,
  redirectUri: environment.redirectUri,
  requireHttps: environment.requireHttps,
  showDebugInformation: true,
  oidc: true,
  responseType: 'code',
  skipIssuerCheck: environment.skipIssuerCheck,
  strictDiscoveryDocumentValidation: environment.strictDiscoveryDocumentValidation
}
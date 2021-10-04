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

import { Component, OnInit } from '@angular/core';
import { HttpService, } from '@service/http.service'
import { HttpHeaders } from '@angular/common/http'
import { OAuthService } from 'angular-oauth2-oidc'
import { UtilService } from '@service/util.service'
import { errorObject } from '@interface/models'
import { environment } from '@env/environment';

@Component({
  selector: 'app-fhirdata',
  templateUrl: './fhirdata.component.html',
  styleUrls: ['./fhirdata.component.css']
})
export class FhirdataComponent implements OnInit {

  errorObject: errorObject = {
    flag: false,
    severity: '',
    msg: ''
  }

  patientId: string;

  bundleFound: {};

  showLoadingBar = false;

  searchTypeHeader: string

  constructor(
    private httpService: HttpService,
    private oauthService: OAuthService,
    private utilService: UtilService
  ) { }

  ngOnInit() {
    // this.fetchPatientDataInSession();
  }

  fetchPatientDataInSession(typeOfQueryFlag?: string) {
    this.showLoadingBar = true;

    let query = this.utilService.queryString('Patient', `?_id=${this.returnPatientId()}&_revinclude=*`);
    
    if (typeOfQueryFlag === "everything") {
      query =this.utilService.queryString('Patient', `/${this.returnPatientId()}/$everything`);
    }
    
    this.searchTypeHeader = `${environment.fhirEndpointUri}${query}`;

    this.httpService.getFhirQueries(query, this.headers()).subscribe(
      recordsFound => {
        this.setupDataInView(recordsFound);
      },
      error => {
        this.setupErrorView(error);
      }
    )
  }

  private setupErrorView(error: any) {
    if (error) {
      setTimeout(() => {
        this.showLoadingBar = false;
      }, 500);
      const issue = this.utilService.parseErrorMessage(error);
      this.errorObject.flag = true;
      this.errorObject.severity = issue?.['severity'];
      this.errorObject.msg = issue?.['diagnostics'];
    }
  }

  private setupDataInView(recordsFound: Object) {
    if (!recordsFound?.['entry']) {
      this.errorObject.flag = true;
      this.errorObject.severity = 'warning';
      this.errorObject.msg = 'Resource Not Found';
    } else {
      this.bundleFound = recordsFound;
    }

    setTimeout(() => {
      this.showLoadingBar = false;
    }, 500);
  }

  fetchDataUsingEverythingOperation() {

  }

  returnPatientId() {
    return this.utilService.decodeToken(this.oauthService.getAccessToken())['patient'];
  }

  headers(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/fhir+json',
      Authorization: 'Bearer ' + this.oauthService.getAccessToken()
    });
    return headers;
  }

}

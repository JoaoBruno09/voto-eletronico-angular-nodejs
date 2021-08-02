import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  server: string = "http://localhost:3000";

  constructor(private http: HttpClient) {

  }

  buscarApi(dados: any, api: string): Observable<any> {
    let url = this.server + api;
    return this.http.post<any>(url, dados);
  }
}

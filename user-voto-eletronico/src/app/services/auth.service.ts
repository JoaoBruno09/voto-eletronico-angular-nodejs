import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  server: string = "http://localhost:3000";
  user_id: string = "";
  user_name: string = "";
  encryptInfo: string = "";
  constructor(private http: HttpClient, private route: Router) { }

  doLogin(dados: any, api: string): Observable<any> {
    let url = this.server + api;
    return this.http.post<any>(url, dados);
  }

  setUserSession(key: any) {
    sessionStorage.setItem('webk', key);
  }

  doLogout() {
    sessionStorage.clear();
    this.route.navigate(['login']);
  }

}

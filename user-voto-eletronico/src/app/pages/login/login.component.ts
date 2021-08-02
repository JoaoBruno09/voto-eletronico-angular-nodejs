import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  faSignInAlt,
  faArrowCircleRight,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  //icones
  faSignInAlt = faSignInAlt;
  faArrowCircleRight = faArrowCircleRight;

  //variável para guardar os documentos
  documentos: any = [];
  //variável que verifica se o utilizador existe
  user_verified: boolean = false;
  //variável que verifica se já clicaram no botão seguinte
  user_verified_clicked: boolean = false;
  //variável que verifica se o utilizador enganou-se na key
  user_key_wrong: boolean = false;
  //variável que verifica se já clicaram no botão de esquecer a password
  user_lost_password: boolean = false;
  //variável que verifica se o email inserido está errado ou certo
  user_email_wrong: boolean = false;
  //variável que verifica se o email foi ou não enviado
  user_email_sended: boolean = false;

  login_recoverpw_email: string = '';

  verifyFormUser = new FormGroup({
    login_user_nmri: new FormControl('', Validators.required),
    login_user_password: new FormControl('', Validators.required),
    login_user_doc: new FormControl('0'),
  });

  loginFormUser = new FormGroup({
    login_user_key: new FormControl('', Validators.required),
  });

  constructor(
    private api_service: ApiService,
    private route: Router,
    private auth_service: AuthService
  ) {}

  ngOnInit(): void {
    if (sessionStorage.length > 0) {
      this.route.navigate(['home']);
    } else {
      this.getDocs();
    }
  }

  getDocs() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_docs',
      };
      this.api_service.buscarApi(data, '/get_docs').subscribe(
        (res) => {
          this.documentos = res.obj;
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  only_numbers(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    } else {
      return true;
    }
  }

  user_verify() {
    let submit = true;
    let login_user_doc = this.verifyFormUser.get('login_user_doc')?.value;
    let login_user_nmri = this.verifyFormUser.get('login_user_nmri')?.value;
    let login_user_password = this.verifyFormUser.get(
      'login_user_password'
    )?.value;

    if (login_user_doc == 0) {
      submit = false;
    } else if (login_user_nmri == '') {
      submit = false;
    } else if (login_user_password == '') {
      submit = false;
    } else {
      submit = true;
      let data = {
        request: 'user_verify',
        doc_id: login_user_doc,
        user_nmri: login_user_nmri,
        user_password: login_user_password,
      };
      this.api_service.buscarApi(data, '/user_verify').subscribe(
        (res) => {
          this.user_verified = res.exist;
          if (this.user_verified == false) {
            this.user_verified_clicked = true;
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }
  }

  user_login() {
    let submit = true;
    let login_user_doc = this.verifyFormUser.get('login_user_doc')?.value;
    let login_user_nmri = this.verifyFormUser.get('login_user_nmri')?.value;
    let login_user_password = this.verifyFormUser.get(
      'login_user_password'
    )?.value;
    let login_user_key = this.loginFormUser.get('login_user_key')?.value;

    if (login_user_key == '') {
      submit = false;
    } else {
      submit = true;
      let data = {
        request: 'user_login',
        doc_id: login_user_doc,
        user_nmri: login_user_nmri,
        user_password: login_user_password,
        user_key: login_user_key,
      };
      this.auth_service.doLogin(data, '/user_login').subscribe(
        (res) => {
          if (res.exist == false) {
            this.user_key_wrong = true;
          } else {
            this.user_key_wrong = false;
            this.auth_service.setUserSession(res.obj.user[0].user_key);
            Swal.fire({
              icon: 'info',
              title: 'Está a entrar na conta!',
              html: 'Irá ser redirecionado para a página de votação.',
              timer: 2000,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                this.route.navigate(['/home']);
              }
            });
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }
  }

  lostPassword() {
    this.user_lost_password = true;
  }

  generate_linkto_recover_password() {
    let submit = true;
    if (this.login_recoverpw_email == '') {
      submit = false;
    } else {
      submit = true;
    }

    if (submit) {
      let data = {
        request: 'user_check_email_pw_recover',
        user_email: this.login_recoverpw_email,
      };
      this.api_service
        .buscarApi(data, '/user_check_email_pw_recover')
        .subscribe(
          (res) => {
            if (res.obj.length > 0) {
              this.user_email_wrong = false;
              this.api_service
                .buscarApi(data, '/user_pw_generate_link_recover')
                .subscribe(
                  (res) => {
                    this.user_email_sended = true;
                  },
                  (err) => {
                    console.log(err);
                  }
                );
            } else {
              this.user_email_sended = false;
              this.user_email_wrong = true;
            }
          },
          (err) => {
            console.log(err);
          }
        );
    }
  }
}

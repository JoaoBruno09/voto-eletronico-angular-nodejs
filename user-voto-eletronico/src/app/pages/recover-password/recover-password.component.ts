import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.css'],
})
export class RecoverPasswordComponent implements OnInit {
  //icones
  faKey = faKey;

  myDate = new Date();
  check_date_ok: boolean = false;
  user_new_recover_password: string = '';
  user_new_recover_password_strength: number = 0;
  user_confirm_new_recover_password: string = '';
  widthVal: number = 0;

  constructor(
    private ativatedroute: ActivatedRoute,
    private datepipe: DatePipe,
    private api_service: ApiService,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.getUserDetails();
  }

  getUserDetails() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_user_details_recover_pw',
        user_email: this.ativatedroute.snapshot.params.email,
        user_key: this.ativatedroute.snapshot.params.key,
      };
      this.api_service
        .buscarApi(data, '/get_user_details_recover_pw')
        .subscribe(
          (res) => {
            let date_atual: any = this.datepipe.transform(
              this.myDate,
              'yyyy-MM-dd HH:mm:ss'
            );
            let date_exp: any = this.datepipe.transform(
              res.obj[0].user_exp_pw_date,
              'yyyy-MM-dd HH:mm:ss'
            );
            if (date_atual < date_exp) {
              this.check_date_ok = true;
            } else {
              this.check_date_ok = false;
            }
          },
          (err) => {
            console.log(err);
          }
        );
    });
  }

  step_progress_bar_change_user_pw() {
    this.user_new_recover_password_strength = 0;
    let arr = [
      /.{8,}/,
      /[a-z]+/,
      /[0-9]+/,
      /[!@#$%^&*(),.?":{}|<>]+/,
      /[A-Z]+/,
    ];
    for (let index = 0; index < arr.length; index++) {
      if (this.user_new_recover_password.match(arr[index]))
        this.user_new_recover_password_strength++;
    }

    let element: HTMLElement = document.getElementById(
      'progress-pw'
    ) as HTMLElement;
    if (this.user_new_recover_password_strength == 1) {
      this.widthVal = 20;
      element.innerHTML = '20%';
    } else if (this.user_new_recover_password_strength == 2) {
      this.widthVal = 40;
      element.innerHTML = '40%';
    } else if (this.user_new_recover_password_strength == 3) {
      this.widthVal = 60;
      element.innerHTML = '60%';
    } else if (this.user_new_recover_password_strength == 4) {
      this.widthVal = 80;
      element.innerHTML = '80%';
    } else if (this.user_new_recover_password_strength == 5) {
      this.widthVal = 100;
      element.innerHTML = '100%';
    } else {
      this.widthVal = 0;
      this.user_new_recover_password_strength = 0;
      element.innerHTML = '0%';
    }
  }

  recover_password() {
    let submit = true;

    if (this.user_new_recover_password == '') {
      submit = false;
    } else if (this.user_new_recover_password.length < 8) {
      submit = false;
    } else if (
      this.user_confirm_new_recover_password != this.user_new_recover_password
    ) {
      submit = false;
    } else if (this.user_new_recover_password_strength < 3) {
      submit = false;
    } else {
      submit = true;
    }

    if (submit) {
      let data = {
        request: 'recover_user_pw',
        user_email: this.ativatedroute.snapshot.params.email,
        user_key: this.ativatedroute.snapshot.params.key,
        user_password: this.user_new_recover_password,
      };
      this.api_service.buscarApi(data, '/recover_user_pw').subscribe(
        (res) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'A password foi alterada com sucesso!',
              html: 'Irá ser redirecionado para a página de login.',
              timer: 2000,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                this.route.navigate(['/login']);
              }
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Não foi possivel alterar a password!',
              html: 'Irá ser redirecionado para a página de login.',
              timer: 2000,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                this.route.navigate(['/login']);
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
}

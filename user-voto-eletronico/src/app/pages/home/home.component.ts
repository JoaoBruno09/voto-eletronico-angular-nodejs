import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import {
  faUser,
  faPowerOff,
  faCalendarCheck,
  faCalendarMinus,
  faCalendarTimes,
  faVoteYea,
  faCheckCircle,
  faUserEdit,
  faTimesCircle,
  faCheckSquare,
  faPoll,
  faSearch,
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  //icones
  faUser = faUser;
  faPowerOff = faPowerOff;
  faCalendarCheck = faCalendarCheck;
  faCalendarMinus = faCalendarMinus;
  faCalendarTimes = faCalendarTimes;
  faVoteYea = faVoteYea;
  faCheckCircle = faCheckCircle;
  faUserEdit = faUserEdit;
  faTimesCircle = faTimesCircle;
  faCheckSquare = faCheckSquare;
  faPoll = faPoll;
  faSearch = faSearch;
  faKey = faKey;

  user: any = [];
  eventos: any = [];
  next_eventos: any = [];
  past_eventos: any = [];
  votes: any = [];
  candidates: any = [];
  results: any = [];
  event_id_openned: number = 0;
  null_votes: number = 0;
  candidate_voted: any;
  user_password: string = '';
  user_new_password: string = '';
  user_new_password_strength: number = 0;
  user_confirm_new_password: string = '';
  user_password_verified: boolean = false;
  widthVal: number = 0;
  availableEventSearch: string = '';
  nextEventSearch: string = '';
  pastEventSearch: string = '';
  event_searched_exist: boolean = false;

  constructor(
    private api_service: ApiService,
    private route: Router,
    private auth_service: AuthService
  ) {}

  ngOnInit(): void {
    if (sessionStorage.length <= 0) {
      this.route.navigate(['login']);
    } else {
      this.getUserDetails();
    }
  }

  simpleAlertBox() {
    Swal.fire('Hello, Admin');
  }
  logout() {
    this.user = [];
    this.auth_service.doLogout();
  }

  getUserDetails() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_user_details',
        key_session: sessionStorage.getItem('webk'),
      };
      this.api_service.buscarApi(data, '/get_user_details').subscribe(
        (res) => {
          this.user = res.obj[0];
          //depois de encontrado o user já é possivel ir buscar os eventos associados ao user
          this.getEventsAvailable();
          this.getNextEvents();
          this.getPastEvents();
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  getEventsAvailable() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_events_available',
        doc_id: this.user.doc_id,
      };
      this.api_service.buscarApi(data, '/get_events_available').subscribe(
        (res) => {
          this.eventos = res.obj;
          this.getVotes();
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  getNextEvents() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_next_events',
        doc_id: this.user.doc_id,
      };
      this.api_service.buscarApi(data, '/get_next_events').subscribe(
        (res) => {
          this.next_eventos = res.obj;
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  getPastEvents() {
    return new Promise((resolve) => {
      let data = {
        request: 'get_past_events',
        doc_id: this.user.doc_id,
      };
      this.api_service.buscarApi(data, '/get_past_events').subscribe(
        (res) => {
          this.past_eventos = res.obj;
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  getVotes() {
    let data = {
      request: 'get_votes_user',
      user_id: this.user.user_id,
    };
    this.api_service.buscarApi(data, '/get_votes_user').subscribe(
      (res) => {
        this.votes = res.obj;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  verifyVotes(event: number) {
    for (var j = 0; j < this.votes.length; j++) {
      if (event == this.votes[j].event_id) {
        return true;
      }
    }
    return false;
  }

  getCandidatesEvent(event_id: number) {
    this.event_id_openned = event_id;
    return new Promise((resolve) => {
      let data = {
        request: 'get_candidates_event',
        event_id: event_id,
      };
      this.api_service.buscarApi(data, '/get_candidates_event').subscribe(
        (res) => {
          this.candidates = res.obj;
        },
        (err) => {
          console.log(err);
        }
      );
    });
  }

  saveVote(event: any) {
    let submit = false;
    if (this.candidate_voted != null) {
      submit = true;
    }

    if (submit) {
      console.log(faTimesCircle);
      Swal.fire({
        title: 'Deseja confirmar o voto?',
        text: 'Não irá ser possivel reverter esta ação mais tarde.   Caso confirme o seu voto, irá receber um email com os dados do seu voto!',
        icon: 'warning',
        position: 'top',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#b02a37',
        cancelButtonText:
          '<i class="fas fa-times-circle"></i>&nbsp;&nbsp;Cancelar',
        confirmButtonText:
          '<i class="fas fa-vote-yea"></i>&nbsp;&nbsp;Sim, confirmar voto!',
      }).then((result) => {
        if (result.isConfirmed) {
          let data = {
            request: 'save_user_vote',
            user_id: this.user.user_id,
            user_email: this.user.user_email,
            event_id: this.event_id_openned,
            candidate_id: this.candidate_voted,
          };
          this.api_service.buscarApi(data, '/save_user_vote').subscribe(
            (res) => {
              this.candidate_voted = '';
              let element: HTMLElement = document.getElementById(
                'close_modal'
              ) as HTMLElement;
              element.click();
              const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-right',
                iconColor: 'white',
                customClass: {
                  popup: 'colored-toast',
                },
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
              });
              Toast.fire({
                icon: 'success',
                title: 'Voto efetuado com sucesso',
              });
              this.getVotes();
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
    }
  }

  see_results_event(event: number) {
    let data = {
      request: 'get_results_event',
      doc_id: this.user.doc_id,
      event_id: event,
    };
    this.api_service.buscarApi(data, '/get_results_event').subscribe(
      (res) => {
        this.results = res.obj;
        this.null_votes = res.nullvotes;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  verify_user_password() {
    let submit = true;
    let elementerror: HTMLElement = document.getElementById(
      'helper-error-change-user-password'
    ) as HTMLElement;
    let elementsuccess: HTMLElement = document.getElementById(
      'helper-success-change-user-password'
    ) as HTMLElement;

    if (this.user_password == '') {
      submit = false;
    }
    if (submit) {
      let data = {
        request: 'check_user_pw',
        user_id: this.user.user_id,
        user_password: this.user_password,
      };
      this.api_service.buscarApi(data, '/check_user_pw').subscribe(
        (res) => {
          if (res.success) {
            this.user_password_verified = true;
            elementerror.innerHTML = '';
            elementsuccess.innerHTML =
              '*A password inserida corresponde à sua password atual';
          } else {
            elementerror.innerHTML =
              '*A password inserida não corresponde à sua password atual';
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }
  }

  step_progress_bar_change_user_pw() {
    this.user_new_password_strength = 0;
    let arr = [
      /.{8,}/,
      /[a-z]+/,
      /[0-9]+/,
      /[!@#$%^&*(),.?":{}|<>]+/,
      /[A-Z]+/,
    ];
    for (let index = 0; index < arr.length; index++) {
      if (this.user_new_password.match(arr[index]))
        this.user_new_password_strength++;
    }

    let element: HTMLElement = document.getElementById(
      'progress-pw'
    ) as HTMLElement;
    if (this.user_new_password_strength == 1) {
      this.widthVal = 20;
      element.innerHTML = '20%';
    } else if (this.user_new_password_strength == 2) {
      this.widthVal = 40;
      element.innerHTML = '40%';
    } else if (this.user_new_password_strength == 3) {
      this.widthVal = 60;
      element.innerHTML = '60%';
    } else if (this.user_new_password_strength == 4) {
      this.widthVal = 80;
      element.innerHTML = '80%';
    } else if (this.user_new_password_strength == 5) {
      this.widthVal = 100;
      element.innerHTML = '100%';
    } else {
      this.widthVal = 0;
      this.user_new_password_strength = 0;
      element.innerHTML = '0%';
    }
  }

  change_password() {
    let submit = true;

    if (this.user_new_password == '') {
      submit = false;
    } else if (this.user_new_password.length < 8) {
      submit = false;
    } else if (this.user_confirm_new_password != this.user_new_password) {
      submit = false;
    } else if (this.user_new_password_strength < 3) {
      submit = false;
    } else {
      submit = true;
    }

    if (submit) {
      let data = {
        request: 'change_user_pw',
        user_id: this.user.user_id,
        user_password: this.user_new_password,
      };
      this.api_service.buscarApi(data, '/change_user_pw').subscribe(
        (res) => {
          if (res.success) {
            this.user_password_verified = false;
            this.user_password = '';
            this.user_new_password = '';
            this.user_confirm_new_password = '';
            this.widthVal = 0;
            let elementerror: HTMLElement = document.getElementById(
              'helper-error-change-user-password'
            ) as HTMLElement;
            let elementsuccess: HTMLElement = document.getElementById(
              'helper-success-change-user-password'
            ) as HTMLElement;
            elementerror.innerHTML = '';
            elementsuccess.innerHTML = '';
            let element: HTMLElement = document.getElementById(
              'modal_change_password'
            ) as HTMLElement;
            element.click();
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom-right',
              iconColor: 'white',
              customClass: {
                popup: 'colored-toast',
              },
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            });
            Toast.fire({
              icon: 'success',
              title: 'A sua password foi alterada com sucesso',
            });
          } else {
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom-right',
              iconColor: 'white',
              customClass: {
                popup: 'colored-toast',
              },
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            });
            Toast.fire({
              icon: 'error',
              title: 'Não foi possivel alterar a password',
            });
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }
  }

  searchBarChange(EventSearch: string) {
    var EventSearch = EventSearch.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    for (let i = 0; i < this.eventos.length; i++) {
      if (
        this.eventos[i].event_title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(EventSearch)
      ) {
        this.event_searched_exist = true;
        break;
      } else {
        this.event_searched_exist = false;
      }
    }
  }

  searchBarNextChange(EventSearch: string) {
    var EventSearch = EventSearch.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    for (let i = 0; i < this.next_eventos.length; i++) {
      if (
        this.next_eventos[i].event_title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(EventSearch)
      ) {
        this.event_searched_exist = true;
        break;
      } else {
        this.event_searched_exist = false;
      }
    }
  }

  searchBarPastChange(EventSearch: string) {
    var EventSearch = EventSearch.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    for (let i = 0; i < this.past_eventos.length; i++) {
      if (
        this.past_eventos[i].event_title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(EventSearch)
      ) {
        this.event_searched_exist = true;
        break;
      } else {
        this.event_searched_exist = false;
      }
    }
  }

  doSearchBar(event_title: string, EventSearch: string) {
    var event_title = event_title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    var EventSearch = EventSearch.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (event_title.includes(EventSearch)) {
      return true;
    } else {
      return false;
    }
  }
}

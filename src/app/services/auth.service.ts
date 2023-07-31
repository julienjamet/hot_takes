import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isAuth$ = new BehaviorSubject<boolean>(false);
  private authToken = '';
  private email = '';

  constructor(private http: HttpClient,
    private router: Router) { }

  createUser(email: string, password: string) {
    return this.http.post<{ message: string }>('https://julienjamet-hottakes.onrender.com/api/auth/signup', { email: email, password: password });
  }

  getToken() {
    return this.authToken;
  }

  getEmail() {
    return this.email;
  }

  loginUser(email: string, password: string) {
    return this.http.post<{ message: string, token: string }>('https://julienjamet-hottakes.onrender.com/api/auth/login', { email: email, password: password }).pipe(
      tap(({ message, token }) => {
        this.email = message.split("'")[1].split("'")[0];
        this.authToken = token;
        this.isAuth$.next(true);
      })
    );
  }

  logout() {
    this.authToken = '';
    this.email = '';
    this.isAuth$.next(false);
    this.router.navigate(['login']);
  }

}

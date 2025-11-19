import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserAccount } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserAccount> {
    return this.http.get<UserAccount>(`${this.API_URL}/profile`);
  }

  updateProfile(data: any): Observable<UserAccount> {
    return this.http.post<UserAccount>(`${this.API_URL}/profile/update`, data);
  }

  updateAvatar(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.API_URL}/profile/update-avatar`, formData);
  }

  updatePassword(current_password: string, new_password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/profile/update-password`, {
      current_password,
      new_password
    });
  }
}

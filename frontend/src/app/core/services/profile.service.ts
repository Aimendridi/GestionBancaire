import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './auth.service';
import { FinancialProfile, Profile } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  get() { return this.http.get<Profile>(`${API_URL}/profile`); }
  update(body: Partial<Pick<Profile, 'nom' | 'prenom' | 'email' | 'telephone'>>) { return this.http.put<Profile>(`${API_URL}/profile`, body); }
  financial() { return this.http.get<FinancialProfile>(`${API_URL}/profile/financial`); }
  updateFinancial(body: Partial<Pick<FinancialProfile, 'revenuMensuel' | 'situationProfessionnelle'>>) { return this.http.put<FinancialProfile>(`${API_URL}/profile/financial`, body); }
  changePassword(body: { ancienMotDePasse: string; nouveauMotDePasse: string }) { return this.http.put<void>(`${API_URL}/profile/password`, body); }
}

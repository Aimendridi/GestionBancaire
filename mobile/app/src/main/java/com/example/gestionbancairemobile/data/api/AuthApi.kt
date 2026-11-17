package com.example.gestionbancairemobile.data.api

import com.example.gestionbancairemobile.data.model.LoginRequest
import com.example.gestionbancairemobile.data.model.LoginResponse
import com.example.gestionbancairemobile.data.model.RefreshRequest
import com.example.gestionbancairemobile.data.model.RefreshResponse
import com.example.gestionbancairemobile.data.model.RegisterRequest
import com.example.gestionbancairemobile.data.model.RegisterResponse
import com.example.gestionbancairemobile.data.model.User

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApi {

    // Connexion
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    // Inscription
    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<RegisterResponse>

    // Renouvellement des tokens
    @POST("auth/refresh")
    suspend fun refresh(
        @Body request: RefreshRequest
    ): Response<RefreshResponse>

    // Déconnexion
    @POST("auth/logout")
    suspend fun logout(
        @Body request: RefreshRequest
    ): Response<Unit>

    // Récupération des informations utilisateur
    @GET("auth/me")
    suspend fun getMe(
        @Header("Authorization") authorization: String
    ): Response<User>

}
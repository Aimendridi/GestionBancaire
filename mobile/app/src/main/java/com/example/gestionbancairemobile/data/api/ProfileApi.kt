package com.example.gestionbancairemobile.data.api

import com.example.gestionbancairemobile.data.model.FinancialProfile
import com.example.gestionbancairemobile.data.model.ProfileResponse
import com.example.gestionbancairemobile.data.model.UpdateFinancialRequest
import com.example.gestionbancairemobile.data.model.UpdateProfileRequest
import com.example.gestionbancairemobile.data.model.User

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT

interface ProfileApi {

    // Récupérer le profil complet (infos personnelles + profil financier)
    @GET("profile")
    suspend fun getProfile(
        @Header("Authorization") authorization: String
    ): Response<ProfileResponse>

    // Modifier les informations personnelles
    @PUT("profile")
    suspend fun updateProfile(
        @Header("Authorization") authorization: String,
        @Body request: UpdateProfileRequest
    ): Response<User>

    // Récupérer le profil financier
    @GET("profile/financial")
    suspend fun getFinancialProfile(
        @Header("Authorization") authorization: String
    ): Response<FinancialProfile>

    // Modifier le profil financier
    @PUT("profile/financial")
    suspend fun updateFinancialProfile(
        @Header("Authorization") authorization: String,
        @Body request: UpdateFinancialRequest
    ): Response<FinancialProfile>
}

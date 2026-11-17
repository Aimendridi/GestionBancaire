package com.example.gestionbancairemobile.data.repository

import com.example.gestionbancairemobile.data.api.AuthApi
import com.example.gestionbancairemobile.data.model.LoginRequest
import com.example.gestionbancairemobile.data.model.RegisterRequest
import com.example.gestionbancairemobile.data.model.RefreshRequest

class AuthRepository(
    private val authApi: AuthApi
) {

    // Connexion
    suspend fun login(
        email: String,
        motDePasse: String
    ) = authApi.login(
        LoginRequest(
            email = email,
            motDePasse = motDePasse
        )
    )

    // Inscription
    suspend fun register(
        nom: String,
        prenom: String,
        email: String,
        motDePasse: String
    ) = authApi.register(
        RegisterRequest(
            nom = nom,
            prenom = prenom,
            email = email,
            motDePasse = motDePasse
        )
    )

    // Renouvellement des tokens
    suspend fun refreshToken(
        refreshToken: String
    ) = authApi.refresh(
        RefreshRequest(refreshToken)
    )

    // Déconnexion
    suspend fun logout(
        refreshToken: String
    ) = authApi.logout(
        RefreshRequest(refreshToken)
    )

    // Informations utilisateur connecté
    suspend fun getMe(
        accessToken: String
    ) = authApi.getMe(
        "Bearer $accessToken"
    )
}
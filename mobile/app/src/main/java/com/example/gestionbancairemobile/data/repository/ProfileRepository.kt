package com.example.gestionbancairemobile.data.repository

import com.example.gestionbancairemobile.data.api.ProfileApi
import com.example.gestionbancairemobile.data.model.UpdateFinancialRequest
import com.example.gestionbancairemobile.data.model.UpdateProfileRequest

class ProfileRepository(
    private val profileApi: ProfileApi
) {

    // Récupérer le profil complet
    suspend fun getProfile(
        accessToken: String
    ) = profileApi.getProfile(
        "Bearer $accessToken"
    )

    // Modifier les informations personnelles
    suspend fun updateProfile(
        accessToken: String,
        request: UpdateProfileRequest
    ) = profileApi.updateProfile(
        "Bearer $accessToken",
        request
    )

    // Récupérer le profil financier
    suspend fun getFinancialProfile(
        accessToken: String
    ) = profileApi.getFinancialProfile(
        "Bearer $accessToken"
    )

    // Modifier le profil financier
    suspend fun updateFinancialProfile(
        accessToken: String,
        request: UpdateFinancialRequest
    ) = profileApi.updateFinancialProfile(
        "Bearer $accessToken",
        request
    )
}

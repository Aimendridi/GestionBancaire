package com.example.gestionbancairemobile.utils

import android.content.Context

class SessionManager(context: Context) {

    private val preferences = context.getSharedPreferences(
        "gestion_bancaire_session",
        Context.MODE_PRIVATE
    )

    // Sauvegarder les tokens
    fun saveSession(
        accessToken: String,
        refreshToken: String
    ) {
        preferences.edit()
            .putString("accessToken", accessToken)
            .putString("refreshToken", refreshToken)
            .apply()
    }

    // Récupérer Access Token
    fun getAccessToken(): String? {
        return preferences.getString("accessToken", null)
    }

    // Récupérer Refresh Token
    fun getRefreshToken(): String? {
        return preferences.getString("refreshToken", null)
    }

    // Supprimer la session
    fun clearSession() {
        preferences.edit()
            .clear()
            .apply()
    }
}
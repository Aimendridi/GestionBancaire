package com.example.gestionbancairemobile.data.model

data class ProfileResponse(
    val id: Int,
    val nom: String,
    val prenom: String,
    val email: String,
    val telephone: String?,
    val dateCreation: String?,
    val role: String,
    val profilFinancier: FinancialProfile?
)

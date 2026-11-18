package com.example.gestionbancairemobile.data.model

data class RegisterRequest(
    val nom: String,
    val prenom: String,
    val email: String,
    val motDePasse: String
)
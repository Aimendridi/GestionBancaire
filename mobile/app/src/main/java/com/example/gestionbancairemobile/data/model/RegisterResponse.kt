package com.example.gestionbancairemobile.data.model

data class RegisterResponse(
    val id: Int,
    val nom: String,
    val prenom: String,
    val email: String,
    val role: String
)
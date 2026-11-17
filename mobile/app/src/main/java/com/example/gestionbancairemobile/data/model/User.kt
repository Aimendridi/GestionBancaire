package com.example.gestionbancairemobile.data.model

data class User(
    val id: Int,
    val nom: String,
    val prenom: String,
    val email: String,
    val role: String,
    val telephone: String? = null
)
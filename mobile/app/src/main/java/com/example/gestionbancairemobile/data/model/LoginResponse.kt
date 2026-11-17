package com.example.gestionbancairemobile.data.model

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User
)
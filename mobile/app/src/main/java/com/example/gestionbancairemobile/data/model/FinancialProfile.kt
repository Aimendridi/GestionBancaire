package com.example.gestionbancairemobile.data.model

data class FinancialProfile(
    val revenuMensuel: Double?,
    val situationProfessionnelle: String?,
    val dateMaj: String?,
    val objectifs: List<Objective>
)

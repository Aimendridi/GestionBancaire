package com.example.gestionbancairemobile.data.repository

import com.example.gestionbancairemobile.data.api.ObjectivesApi
import com.example.gestionbancairemobile.data.model.UpdateObjectivesRequest

class ObjectivesRepository(
    private val objectivesApi: ObjectivesApi
) {

    // Récupérer tous les objectifs disponibles
    suspend fun getAllObjectives(
        accessToken: String
    ) = objectivesApi.getAllObjectives(
        "Bearer $accessToken"
    )

    // Récupérer les objectifs de l'utilisateur
    suspend fun getMyObjectives(
        accessToken: String
    ) = objectivesApi.getMyObjectives(
        "Bearer $accessToken"
    )

    // Mettre à jour les objectifs sélectionnés
    suspend fun updateMyObjectives(
        accessToken: String,
        objectifIds: List<Int>
    ) = objectivesApi.updateMyObjectives(
        "Bearer $accessToken",
        UpdateObjectivesRequest(objectifIds)
    )
}

package com.example.gestionbancairemobile.data.api

import com.example.gestionbancairemobile.data.model.Objective
import com.example.gestionbancairemobile.data.model.UpdateObjectivesRequest

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT

interface ObjectivesApi {

    // Récupérer la liste de tous les objectifs prédéfinis
    @GET("objectives")
    suspend fun getAllObjectives(
        @Header("Authorization") authorization: String
    ): Response<List<Objective>>

    // Récupérer les objectifs sélectionnés par l'utilisateur
    @GET("objectives/me")
    suspend fun getMyObjectives(
        @Header("Authorization") authorization: String
    ): Response<List<Objective>>

    // Mettre à jour les objectifs sélectionnés
    @PUT("objectives/me")
    suspend fun updateMyObjectives(
        @Header("Authorization") authorization: String,
        @Body request: UpdateObjectivesRequest
    ): Response<List<Objective>>
}

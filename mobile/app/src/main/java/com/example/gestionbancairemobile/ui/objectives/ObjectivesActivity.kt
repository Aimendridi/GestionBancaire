package com.example.gestionbancairemobile.ui.objectives

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.gestionbancairemobile.data.api.RetrofitClient
import com.example.gestionbancairemobile.data.model.Objective
import com.example.gestionbancairemobile.data.repository.ObjectivesRepository
import com.example.gestionbancairemobile.databinding.ActivityObjectivesBinding
import com.example.gestionbancairemobile.utils.SessionManager
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

class ObjectivesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityObjectivesBinding
    private lateinit var objectivesRepository: ObjectivesRepository
    private lateinit var sessionManager: SessionManager

    private var adapter: ObjectivesAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityObjectivesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        objectivesRepository = ObjectivesRepository(RetrofitClient.objectivesApi)
        sessionManager = SessionManager(this)

        // Configurer le RecyclerView
        binding.recyclerObjectives.layoutManager = LinearLayoutManager(this)
        binding.recyclerObjectives.addItemDecoration(
            DividerItemDecoration(this, DividerItemDecoration.VERTICAL)
        )

        // Charger les objectifs au démarrage
        loadObjectives()

        // Enregistrer la sélection
        binding.btnSaveObjectives.setOnClickListener {

            saveObjectives()
        }

        // Retour vers HomeActivity
        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun loadObjectives() {

        val accessToken = sessionManager.getAccessToken()

        if (accessToken == null) {

            Toast.makeText(
                this,
                "Session expirée. Veuillez vous reconnecter.",
                Toast.LENGTH_LONG
            ).show()

            finish()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSaveObjectives.isEnabled = false

        lifecycleScope.launch {

            try {

                // Charger en parallèle tous les objectifs et ceux de l'utilisateur
                val allDeferred = async { objectivesRepository.getAllObjectives(accessToken) }
                val myDeferred = async { objectivesRepository.getMyObjectives(accessToken) }

                val allResponse = allDeferred.await()
                val myResponse = myDeferred.await()

                if (allResponse.isSuccessful && allResponse.body() != null) {

                    val allObjectives: List<Objective> = allResponse.body()!!

                    val selectedIds: MutableSet<Int> = if (myResponse.isSuccessful && myResponse.body() != null) {
                        myResponse.body()!!.map { it.id }.toMutableSet()
                    } else {
                        mutableSetOf()
                    }

                    adapter = ObjectivesAdapter(allObjectives, selectedIds)
                    binding.recyclerObjectives.adapter = adapter

                } else {

                    Toast.makeText(
                        this@ObjectivesActivity,
                        "Impossible de charger les objectifs",
                        Toast.LENGTH_LONG
                    ).show()
                }

            } catch (e: Exception) {

                Toast.makeText(
                    this@ObjectivesActivity,
                    "Erreur réseau : ${e.message}",
                    Toast.LENGTH_LONG
                ).show()

            } finally {

                binding.progressBar.visibility = View.GONE
                binding.btnSaveObjectives.isEnabled = true
            }
        }
    }

    private fun saveObjectives() {

        val accessToken = sessionManager.getAccessToken() ?: return
        val currentAdapter = adapter ?: return

        val selectedIds = currentAdapter.getSelectedIds()

        if (selectedIds.isEmpty()) {

            Toast.makeText(
                this,
                "Veuillez sélectionner au moins un objectif",
                Toast.LENGTH_SHORT
            ).show()

            return
        }

        binding.btnSaveObjectives.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {

            try {

                val response = objectivesRepository.updateMyObjectives(
                    accessToken,
                    selectedIds
                )

                if (response.isSuccessful && response.body() != null) {

                    val saved = response.body()!!

                    Toast.makeText(
                        this@ObjectivesActivity,
                        "${saved.size} objectif(s) enregistré(s) !",
                        Toast.LENGTH_SHORT
                    ).show()

                } else {

                    Toast.makeText(
                        this@ObjectivesActivity,
                        "Impossible d'enregistrer les objectifs",
                        Toast.LENGTH_LONG
                    ).show()
                }

            } catch (e: Exception) {

                Toast.makeText(
                    this@ObjectivesActivity,
                    "Erreur réseau : ${e.message}",
                    Toast.LENGTH_LONG
                ).show()

            } finally {

                binding.btnSaveObjectives.isEnabled = true
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}

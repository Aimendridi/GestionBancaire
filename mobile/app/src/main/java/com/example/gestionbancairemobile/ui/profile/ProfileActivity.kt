package com.example.gestionbancairemobile.ui.profile

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.gestionbancairemobile.data.api.RetrofitClient
import com.example.gestionbancairemobile.data.model.UpdateFinancialRequest
import com.example.gestionbancairemobile.data.model.UpdateProfileRequest
import com.example.gestionbancairemobile.data.repository.ProfileRepository
import com.example.gestionbancairemobile.databinding.ActivityProfileBinding
import com.example.gestionbancairemobile.utils.SessionManager
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var profileRepository: ProfileRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        profileRepository = ProfileRepository(RetrofitClient.profileApi)
        sessionManager = SessionManager(this)

        // Charger le profil au démarrage
        loadProfile()

        // Enregistrer les informations personnelles
        binding.btnSavePersonal.setOnClickListener {

            val nom = binding.etNom.text.toString().trim()
            val prenom = binding.etPrenom.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val telephone = binding.etTelephone.text.toString().trim()

            if (nom.isEmpty() || prenom.isEmpty() || email.isEmpty()) {

                Toast.makeText(
                    this,
                    "Le nom, le prénom et l'e-mail sont obligatoires",
                    Toast.LENGTH_SHORT
                ).show()

            } else {

                savePersonalInfo(nom, prenom, email, telephone.ifEmpty { null })
            }
        }

        // Enregistrer les informations financières
        binding.btnSaveFinancial.setOnClickListener {

            val revenuText = binding.etRevenuMensuel.text.toString().trim()
            val situationPro = binding.etSituationPro.text.toString().trim()

            val revenu = if (revenuText.isEmpty()) {
                null
            } else {
                revenuText.toDoubleOrNull().also { v ->
                    if (v == null) {
                        Toast.makeText(
                            this,
                            "Le revenu mensuel doit être un nombre valide",
                            Toast.LENGTH_SHORT
                        ).show()
                        return@setOnClickListener
                    }
                }
            }

            saveFinancialInfo(revenu, situationPro.ifEmpty { null })
        }

        // Retour vers HomeActivity
        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun loadProfile() {

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
        binding.btnSavePersonal.isEnabled = false
        binding.btnSaveFinancial.isEnabled = false

        lifecycleScope.launch {

            try {

                val response = profileRepository.getProfile(accessToken)

                if (response.isSuccessful && response.body() != null) {

                    val profile = response.body()!!

                    // Remplir les champs personnels
                    binding.etNom.setText(profile.nom)
                    binding.etPrenom.setText(profile.prenom)
                    binding.etEmail.setText(profile.email)
                    binding.etTelephone.setText(profile.telephone ?: "")

                    // Remplir les champs financiers
                    profile.profilFinancier?.let { pf ->
                        binding.etRevenuMensuel.setText(
                            pf.revenuMensuel?.toString() ?: ""
                        )
                        binding.etSituationPro.setText(
                            pf.situationProfessionnelle ?: ""
                        )
                    }

                } else {

                    Toast.makeText(
                        this@ProfileActivity,
                        "Impossible de charger le profil",
                        Toast.LENGTH_LONG
                    ).show()
                }

            } catch (e: Exception) {

                Toast.makeText(
                    this@ProfileActivity,
                    "Erreur réseau : ${e.message}",
                    Toast.LENGTH_LONG
                ).show()

            } finally {

                binding.progressBar.visibility = View.GONE
                binding.btnSavePersonal.isEnabled = true
                binding.btnSaveFinancial.isEnabled = true
            }
        }
    }

    private fun savePersonalInfo(
        nom: String,
        prenom: String,
        email: String,
        telephone: String?
    ) {

        val accessToken = sessionManager.getAccessToken() ?: return

        binding.btnSavePersonal.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {

            try {

                val request = UpdateProfileRequest(
                    nom = nom,
                    prenom = prenom,
                    email = email,
                    telephone = telephone
                )

                val response = profileRepository.updateProfile(accessToken, request)

                if (response.isSuccessful && response.body() != null) {

                    val updated = response.body()!!

                    // Mettre à jour les champs avec les données retournées
                    binding.etNom.setText(updated.nom)
                    binding.etPrenom.setText(updated.prenom)
                    binding.etEmail.setText(updated.email)
                    binding.etTelephone.setText(updated.telephone ?: "")

                    Toast.makeText(
                        this@ProfileActivity,
                        "Informations personnelles mises à jour !",
                        Toast.LENGTH_SHORT
                    ).show()

                } else {

                    Toast.makeText(
                        this@ProfileActivity,
                        "Impossible de modifier les informations",
                        Toast.LENGTH_LONG
                    ).show()
                }

            } catch (e: Exception) {

                Toast.makeText(
                    this@ProfileActivity,
                    "Erreur réseau : ${e.message}",
                    Toast.LENGTH_LONG
                ).show()

            } finally {

                binding.btnSavePersonal.isEnabled = true
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun saveFinancialInfo(
        revenuMensuel: Double?,
        situationProfessionnelle: String?
    ) {

        val accessToken = sessionManager.getAccessToken() ?: return

        if (revenuMensuel == null && situationProfessionnelle == null) {

            Toast.makeText(
                this,
                "Veuillez renseigner au moins une information financière",
                Toast.LENGTH_SHORT
            ).show()

            return
        }

        binding.btnSaveFinancial.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {

            try {

                val request = UpdateFinancialRequest(
                    revenuMensuel = revenuMensuel,
                    situationProfessionnelle = situationProfessionnelle
                )

                val response = profileRepository.updateFinancialProfile(accessToken, request)

                if (response.isSuccessful && response.body() != null) {

                    val updated = response.body()!!

                    // Mettre à jour les champs avec les données retournées
                    binding.etRevenuMensuel.setText(
                        updated.revenuMensuel?.toString() ?: ""
                    )
                    binding.etSituationPro.setText(
                        updated.situationProfessionnelle ?: ""
                    )

                    Toast.makeText(
                        this@ProfileActivity,
                        "Informations financières mises à jour !",
                        Toast.LENGTH_SHORT
                    ).show()

                } else {

                    Toast.makeText(
                        this@ProfileActivity,
                        "Impossible de modifier les informations financières",
                        Toast.LENGTH_LONG
                    ).show()
                }

            } catch (e: Exception) {

                Toast.makeText(
                    this@ProfileActivity,
                    "Erreur réseau : ${e.message}",
                    Toast.LENGTH_LONG
                ).show()

            } finally {

                binding.btnSaveFinancial.isEnabled = true
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}

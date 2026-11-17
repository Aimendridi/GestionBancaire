package com.example.gestionbancairemobile.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.gestionbancairemobile.data.api.RetrofitClient
import com.example.gestionbancairemobile.data.repository.AuthRepository
import com.example.gestionbancairemobile.databinding.ActivityRegisterBinding
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(RetrofitClient.authApi)

        binding.btnRegister.setOnClickListener {
            val nom = binding.etNom.text.toString().trim()
            val prenom = binding.etPrenom.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val motDePasse = binding.etPassword.text.toString()

            when {
                nom.isEmpty() || prenom.isEmpty() || email.isEmpty() || motDePasse.isEmpty() ->
                    showError("Veuillez remplir tous les champs")
                motDePasse.length < 8 ||
                        !motDePasse.any { it.isUpperCase() } ||
                        !motDePasse.any { it.isLowerCase() } ||
                        !motDePasse.any { it.isDigit() } ->
                    showError("Le mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule et un chiffre")
                else -> register(nom, prenom, email, motDePasse)
            }
        }

        binding.tvGoLogin.setOnClickListener { finish() }
    }

    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = View.VISIBLE
    }

    private fun hideError() {
        binding.tvError.visibility = View.GONE
    }

    private fun register(nom: String, prenom: String, email: String, motDePasse: String) {
        hideError()
        binding.btnRegister.isEnabled = false
        lifecycleScope.launch {
            try {
                val response = authRepository.register(nom, prenom, email, motDePasse)
                if (response.isSuccessful && response.body() != null) {
                    val result = response.body()!!
                    Toast.makeText(this@RegisterActivity, "Compte créé avec succès !", Toast.LENGTH_LONG).show()
                    val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                    intent.putExtra("email", result.email)
                    startActivity(intent)
                    finish()
                } else {
                    showError("Inscription impossible. Vérifiez vos informations ou votre email.")
                }
            } catch (e: Exception) {
                showError("Erreur : ${e.message}")
            } finally {
                binding.btnRegister.isEnabled = true
            }
        }
    }
}

package com.example.gestionbancairemobile.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.gestionbancairemobile.data.api.RetrofitClient
import com.example.gestionbancairemobile.data.repository.AuthRepository
import com.example.gestionbancairemobile.databinding.ActivityLoginBinding
import com.example.gestionbancairemobile.ui.home.HomeActivity
import com.example.gestionbancairemobile.utils.SessionManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(RetrofitClient.authApi)
        sessionManager = SessionManager(this)

        // Pre-fill email after registration
        binding.etEmail.setText(intent.getStringExtra("email") ?: "")

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val motDePasse = binding.etPassword.text.toString()
            if (email.isEmpty() || motDePasse.isEmpty()) {
                showError("Veuillez remplir tous les champs")
            } else {
                login(email, motDePasse)
            }
        }

        binding.tvGoRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = View.VISIBLE
    }

    private fun hideError() {
        binding.tvError.visibility = View.GONE
    }

    private fun login(email: String, motDePasse: String) {
        hideError()
        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = authRepository.login(email, motDePasse)
                if (response.isSuccessful && response.body() != null) {
                    val result = response.body()!!
                    sessionManager.saveSession(result.accessToken, result.refreshToken)
                    val intent = Intent(this@LoginActivity, HomeActivity::class.java)
                    intent.putExtra("userName", result.user.prenom)
                    startActivity(intent)
                    finish()
                } else {
                    showError("Email ou mot de passe incorrect")
                }
            } catch (e: Exception) {
                showError("Erreur de connexion : ${e.message}")
            } finally {
                binding.btnLogin.isEnabled = true
            }
        }
    }
}

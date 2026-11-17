package com.example.gestionbancairemobile.ui.home

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.gestionbancairemobile.R
import com.example.gestionbancairemobile.data.api.RetrofitClient
import com.example.gestionbancairemobile.data.repository.AuthRepository
import com.example.gestionbancairemobile.databinding.ActivityHomeBinding
import com.example.gestionbancairemobile.ui.auth.LoginActivity
import com.example.gestionbancairemobile.ui.objectives.ObjectivesActivity
import com.example.gestionbancairemobile.ui.profile.ProfileActivity
import com.example.gestionbancairemobile.utils.SessionManager
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(RetrofitClient.authApi)
        sessionManager = SessionManager(this)

        val userName = intent.getStringExtra("userName") ?: "Client"

        // Welcome heading
        binding.tvWelcome.text = "Bienvenue $userName !"

        // Avatar initials (first letter of name)
        binding.tvAvatar.text = userName.take(1).uppercase()

        // Balance placeholder
        binding.tvBalance.text = "0.000 TND"

        // Bottom navigation – highlight Dashboard item
        binding.bottomNav.selectedItemId = R.id.nav_dashboard
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> true
                R.id.nav_accounts -> {
                    binding.btnAccounts.performClick()
                    true
                }
                R.id.nav_objectives -> {
                    startActivity(Intent(this, ObjectivesActivity::class.java))
                    true
                }
                R.id.nav_profile -> {
                    startActivity(Intent(this, ProfileActivity::class.java))
                    true
                }
                else -> false
            }
        }

        // Card buttons
        binding.btnProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        binding.btnObjectives.setOnClickListener {
            startActivity(Intent(this, ObjectivesActivity::class.java))
        }

        binding.btnAccounts.setOnClickListener {
            Toast.makeText(this, "Page comptes bientôt disponible", Toast.LENGTH_SHORT).show()
        }

        binding.btnLogout.setOnClickListener {
            logout()
        }
    }

    private fun logout() {
        binding.btnLogout.isEnabled = false
        lifecycleScope.launch {
            try {
                val refreshToken = sessionManager.getRefreshToken()
                if (refreshToken != null) {
                    authRepository.logout(refreshToken)
                }
            } catch (_: Exception) {
            } finally {
                sessionManager.clearSession()
                Toast.makeText(this@HomeActivity, "Déconnexion réussie", Toast.LENGTH_SHORT).show()
                val intent = Intent(this@HomeActivity, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
        }
    }
}

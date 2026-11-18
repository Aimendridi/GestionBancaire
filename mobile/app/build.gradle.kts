plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.gestionbancairemobile"

    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.example.gestionbancairemobile"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        viewBinding = true
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.core.ktx)
    implementation(libs.material)

    // RecyclerView: liste des objectifs financiers
    implementation("androidx.recyclerview:recyclerview:1.3.2")

    // Retrofit: communication avec le Backend
    implementation("com.squareup.retrofit2:retrofit:2.11.0")

    // Gson: conversion JSON
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")

    // OkHttp: gestion des requêtes HTTP
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Lifecycle: utilisation de lifecycleScope dans les Activities
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.4")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
}
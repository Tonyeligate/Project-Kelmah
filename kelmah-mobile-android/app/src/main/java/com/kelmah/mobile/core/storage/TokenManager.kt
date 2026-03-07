package com.kelmah.mobile.core.storage

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    private val prefs = EncryptedSharedPreferences.create(
        context,
        FILE_NAME,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private val _sessionFlow = MutableStateFlow(loadSession())
    val sessionFlow: StateFlow<StoredSession?> = _sessionFlow.asStateFlow()

    fun saveSession(accessToken: String, refreshToken: String?, user: SessionUser? = _sessionFlow.value?.user) {
        val session = StoredSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = user,
        )
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putString(KEY_SESSION_PAYLOAD, json.encodeToString(session))
            .apply()
        _sessionFlow.value = session
    }

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun getStoredSession(): StoredSession? = _sessionFlow.value

    fun updateUser(user: SessionUser?) {
        val current = _sessionFlow.value ?: return
        val updated = current.copy(user = user)
        prefs.edit()
            .putString(KEY_SESSION_PAYLOAD, json.encodeToString(updated))
            .apply()
        _sessionFlow.value = updated
    }

    fun clearSession() {
        prefs.edit().clear().apply()
        _sessionFlow.value = null
    }

    fun isAuthenticated(): Boolean = !getAccessToken().isNullOrBlank()

    private fun loadSession(): StoredSession? {
        val encoded = prefs.getString(KEY_SESSION_PAYLOAD, null)
        if (!encoded.isNullOrBlank()) {
            runCatching { json.decodeFromString<StoredSession>(encoded) }
                .getOrNull()
                ?.let { return it }
        }

        val accessToken = getAccessToken() ?: return null
        return StoredSession(
            accessToken = accessToken,
            refreshToken = getRefreshToken(),
        )
    }

    companion object {
        private const val FILE_NAME = "secure_session"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_SESSION_PAYLOAD = "session_payload"
    }
}

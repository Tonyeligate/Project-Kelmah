package com.kelmah.mobile.core.session

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.storage.TokenManager
import com.kelmah.mobile.features.auth.data.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

@Singleton
class SessionCoordinator @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager,
) {
    private val invalidSessionCodes = setOf(401, 403)
    private val refreshMutex = Mutex()
    private var didBootstrap = false

    private val _sessionState = MutableStateFlow<SessionState>(
        if (tokenManager.isAuthenticated()) SessionState.Loading else SessionState.Unauthenticated,
    )
    val sessionState: StateFlow<SessionState> = _sessionState.asStateFlow()

    private val _biometricUnlockRequired = MutableStateFlow(false)
    val biometricUnlockRequired: StateFlow<Boolean> = _biometricUnlockRequired.asStateFlow()

    fun markBiometricUnlockRequired() {
        _biometricUnlockRequired.value = true
    }

    fun clearBiometricUnlockRequired() {
        _biometricUnlockRequired.value = false
    }

    suspend fun bootstrapSession(force: Boolean = false) {
        refreshMutex.withLock {
            if (didBootstrap && !force) return
            didBootstrap = true
        }

        val storedSession = tokenManager.getStoredSession()
        if (storedSession == null) {
            _sessionState.value = SessionState.Unauthenticated
            return
        }

        _sessionState.value = SessionState.Loading

        when (val currentUserResult = authRepository.fetchCurrentUser()) {
            is ApiResult.Success -> {
                tokenManager.updateUser(currentUserResult.data)
                _sessionState.value = SessionState.Authenticated(currentUserResult.data)
            }
            is ApiResult.Error -> {
                val refreshed = refreshSessionInternal()
                if (refreshed) {
                    when (val retriedUserResult = authRepository.fetchCurrentUser()) {
                        is ApiResult.Success -> {
                            tokenManager.updateUser(retriedUserResult.data)
                            _sessionState.value = SessionState.Authenticated(retriedUserResult.data)
                        }
                        is ApiResult.Error -> {
                            recoverOrClear(retriedUserResult.message)
                        }
                    }
                } else {
                    recoverOrClear(currentUserResult.message)
                }
            }
        }
    }

    suspend fun onLoginCompleted() {
        bootstrapSession(force = true)
        // Once bootstrap resolves the authenticated session, require biometric unlock on next resume.
        clearBiometricUnlockRequired()
        markBiometricUnlockRequired()
    }

    suspend fun refreshSession(): Boolean = refreshSessionInternal()

    suspend fun logout(logoutAll: Boolean = false) {
        val cachedRefreshToken = tokenManager.getRefreshToken()
        try {
            authRepository.logout(logoutAll = logoutAll, refreshTokenOverride = cachedRefreshToken)
        } catch (_: Exception) {
            // server-side revocation best-effort
        } finally {
            _biometricUnlockRequired.value = false
            tokenManager.clearSession()
            _sessionState.value = SessionState.Unauthenticated
            didBootstrap = false
        }
    }

    private suspend fun refreshSessionInternal(): Boolean = refreshMutex.withLock {
        val currentRefreshToken = tokenManager.getRefreshToken() ?: return@withLock false
        when (val refreshResult = authRepository.refreshSession(currentRefreshToken)) {
            is ApiResult.Success -> {
                val resolvedUser = refreshResult.data.user ?: tokenManager.getStoredSession()?.user
                _sessionState.value = SessionState.Authenticated(resolvedUser)
                true
            }
            is ApiResult.Error -> {
                if (refreshResult.code in invalidSessionCodes) {
                    tokenManager.clearSession()
                    _sessionState.value = SessionState.Unauthenticated
                } else {
                    recoverOrClear(refreshResult.message)
                }
                false
            }
        }
    }

    private fun recoverOrClear(message: String) {
        val cachedUser = tokenManager.getStoredSession()?.user
        if (cachedUser != null) {
            _sessionState.value = SessionState.RecoveryRequired(
                user = cachedUser,
                message = message,
            )
        } else {
            tokenManager.clearSession()
            _sessionState.value = SessionState.Unauthenticated
        }
    }
}

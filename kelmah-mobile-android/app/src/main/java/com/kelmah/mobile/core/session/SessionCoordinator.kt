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
    private val refreshMutex = Mutex()
    private var didBootstrap = false

    private val _sessionState = MutableStateFlow<SessionState>(
        if (tokenManager.isAuthenticated()) SessionState.Loading else SessionState.Unauthenticated,
    )
    val sessionState: StateFlow<SessionState> = _sessionState.asStateFlow()

    suspend fun bootstrapSession(force: Boolean = false) {
        if (didBootstrap && !force) return
        didBootstrap = true

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
    }

    suspend fun refreshSession(): Boolean = refreshSessionInternal()

    suspend fun logout(logoutAll: Boolean = false) {
        authRepository.logout(logoutAll)
        tokenManager.clearSession()
        _sessionState.value = SessionState.Unauthenticated
    }

    private suspend fun refreshSessionInternal(): Boolean = refreshMutex.withLock {
        val currentRefreshToken = tokenManager.getRefreshToken() ?: return@withLock false
        when (val refreshResult = authRepository.refreshSession(currentRefreshToken)) {
            is ApiResult.Success -> {
                _sessionState.value = SessionState.Authenticated(refreshResult.data.user)
                true
            }
            is ApiResult.Error -> {
                tokenManager.clearSession()
                _sessionState.value = SessionState.Unauthenticated
                false
            }
        }
    }

    private fun recoverOrClear(message: String) {
        val cachedUser = tokenManager.getStoredSession()?.user
        if (cachedUser != null) {
            _sessionState.value = SessionState.Error(
                message = message,
                cachedUser = cachedUser,
            )
        } else {
            tokenManager.clearSession()
            _sessionState.value = SessionState.Unauthenticated
        }
    }
}

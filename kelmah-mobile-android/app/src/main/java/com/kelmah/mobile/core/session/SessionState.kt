package com.kelmah.mobile.core.session

import com.kelmah.mobile.core.storage.SessionUser

sealed interface SessionState {
    data object Loading : SessionState
    data object Unauthenticated : SessionState
    data class Authenticated(
        val user: SessionUser?,
    ) : SessionState
    data class RecoveryRequired(
        val user: SessionUser?,
        val message: String,
    ) : SessionState
    data class Error(
        val message: String,
        val cachedUser: SessionUser? = null,
    ) : SessionState
}

package com.kelmah.mobile.core.storage

import kotlinx.serialization.Serializable

@Serializable
data class SessionUser(
    val id: String? = null,
    val mongoId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val role: String? = null,
    val isEmailVerified: Boolean? = null,
) {
    val resolvedId: String?
        get() = id ?: mongoId

    val displayName: String
        get() = listOfNotNull(firstName, lastName)
            .joinToString(" ")
            .ifBlank { email ?: "Kelmah User" }
}

@Serializable
data class StoredSession(
    val accessToken: String,
    val refreshToken: String? = null,
    val user: SessionUser? = null,
)

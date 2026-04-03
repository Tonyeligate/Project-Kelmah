package com.kelmah.mobile.core.session

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.storage.TokenManager
import com.kelmah.mobile.features.auth.data.AuthRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SessionCoordinatorTest {
    private val authRepository: AuthRepository = mockk()
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private lateinit var coordinator: SessionCoordinator

    @Before
    fun setup() {
        every { tokenManager.isAuthenticated() } returns true
        coordinator = SessionCoordinator(authRepository, tokenManager)
    }

    @Test
    fun logoutAll_usesCachedRefreshTokenBeforeClearingSession() = runTest {
        every { tokenManager.getRefreshToken() } returns "refresh-token"
        coEvery {
            authRepository.logout(logoutAll = true, refreshTokenOverride = "refresh-token")
        } returns ApiResult.Success(Unit)

        coordinator.logout(logoutAll = true)

        coVerify(exactly = 1) {
            authRepository.logout(logoutAll = true, refreshTokenOverride = "refresh-token")
        }
        verify(exactly = 1) { tokenManager.clearSession() }
        assertTrue(coordinator.sessionState.value is SessionState.Unauthenticated)
    }

    @Test
    fun logout_clearsSessionWhenServerRevocationFails() = runTest {
        every { tokenManager.getRefreshToken() } returns null
        coEvery {
            authRepository.logout(logoutAll = false, refreshTokenOverride = null)
        } throws IllegalStateException("network down")

        coordinator.logout(logoutAll = false)

        coVerify(exactly = 1) {
            authRepository.logout(logoutAll = false, refreshTokenOverride = null)
        }
        verify(exactly = 1) { tokenManager.clearSession() }
        assertTrue(coordinator.sessionState.value is SessionState.Unauthenticated)
    }
}

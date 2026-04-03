package com.kelmah.mobile.features.auth

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kelmah.mobile.core.security.PasswordPolicy
import com.kelmah.mobile.features.auth.presentation.AuthMode
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthCriticalPathInstrumentationTest {

    @Test
    fun authModes_exposeStablePrimaryActions() {
        val labels = AuthMode.entries.map { it.label }

        assertTrue(labels.contains("Sign in"))
        assertTrue(labels.contains("Register"))
        assertTrue(labels.contains("Forgot"))
        assertTrue(labels.contains("Reset"))
        assertTrue(labels.contains("Verify"))
    }

    @Test
    fun passwordPolicy_blocksWeakCredentials() {
        assertTrue(PasswordPolicy.isStrong("Kelmah2026!"))
        assertFalse(PasswordPolicy.isStrong("kelmah"))
    }
}

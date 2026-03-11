package com.kelmah.mobile

import com.kelmah.mobile.core.security.PasswordPolicy
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TokenManagerTest {
    @Test
    fun passwordPolicy_accepts_expected_strong_password() {
        assertTrue(PasswordPolicy.isStrong("Kelmah2026!"))
    }

    @Test
    fun passwordPolicy_rejects_password_without_uppercase() {
        assertFalse(PasswordPolicy.isStrong("kelmah2026!"))
    }

    @Test
    fun passwordPolicy_rejects_password_without_lowercase() {
        assertFalse(PasswordPolicy.isStrong("KELMAH2026!"))
    }

    @Test
    fun passwordPolicy_rejects_password_without_special_character() {
        assertFalse(PasswordPolicy.isStrong("Kelmah2026"))
    }

    @Test
    fun passwordPolicy_rejects_password_longer_than_maximum_length() {
        val tooLongPassword = "Aa1!" + "b".repeat(125)

        assertFalse(PasswordPolicy.isStrong(tooLongPassword))
    }

    @Test
    fun sessionUser_defaults_unknown_role_to_worker() {
        val user = SessionUser(role = "unknown")

        assertEquals(KelmahUserRole.WORKER, user.kelmahUserRole)
    }

    @Test
    fun sessionUser_resolves_hirer_role_case_insensitively() {
        val user = SessionUser(role = "HIRER")

        assertEquals(KelmahUserRole.HIRER, user.kelmahUserRole)
    }
}

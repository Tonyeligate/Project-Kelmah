package com.kelmah.mobile.core.security

object PasswordPolicy {
    const val minimumLength: Int = 8
    const val maximumLength: Int = 128
    const val requirementMessage: String = "Password must be 8-128 characters and include one uppercase letter, one lowercase letter, one number, and one special character"

    fun isStrong(value: String): Boolean =
        value.length in minimumLength..maximumLength &&
            value.any(Char::isUpperCase) &&
            value.any(Char::isLowerCase) &&
            value.any(Char::isDigit) &&
            value.any { !it.isLetterOrDigit() }
}
package com.kelmah.mobile.core.security

object PasswordPolicy {
    const val minimumLength: Int = 8
    const val requirementMessage: String = "Password must be at least 8 characters and include one uppercase letter and one number"

    fun isStrong(value: String): Boolean =
        value.length >= minimumLength && value.any(Char::isUpperCase) && value.any(Char::isDigit)
}
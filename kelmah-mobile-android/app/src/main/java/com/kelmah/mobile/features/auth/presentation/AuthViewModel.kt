package com.kelmah.mobile.features.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.security.PasswordPolicy
import com.kelmah.mobile.features.auth.data.AuthRepository
import com.kelmah.mobile.features.auth.data.RegisterRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthMode(val label: String) {
    LOGIN("Sign in"),
    REGISTER("Register"),
    FORGOT_PASSWORD("Forgot"),
    RESET_PASSWORD("Reset"),
    VERIFY_EMAIL("Verify"),
}

data class AuthUiState(
    val mode: AuthMode = AuthMode.LOGIN,
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phone: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val role: String = "worker",
    val token: String = "",
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
) {
    // Redact passwords from toString() to prevent log/crash-report leakage
    override fun toString(): String =
        "AuthUiState(mode=$mode, email=$email, role=$role, isLoading=$isLoading, isAuthenticated=$isAuthenticated)"
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun switchMode(mode: AuthMode) {
        _uiState.update {
            it.copy(
                mode = mode,
                isLoading = false,
                password = "",
                confirmPassword = "",
                token = "",
                errorMessage = null,
                infoMessage = null,
            )
        }
    }

    fun onFirstNameChanged(value: String) {
        _uiState.update { it.copy(firstName = value, errorMessage = null, infoMessage = null) }
    }

    fun onLastNameChanged(value: String) {
        _uiState.update { it.copy(lastName = value, errorMessage = null, infoMessage = null) }
    }

    fun onEmailChanged(value: String) {
        _uiState.update { it.copy(email = value, errorMessage = null, infoMessage = null) }
    }

    fun onPhoneChanged(value: String) {
        _uiState.update { it.copy(phone = value, errorMessage = null, infoMessage = null) }
    }

    fun onPasswordChanged(value: String) {
        _uiState.update { it.copy(password = value, errorMessage = null, infoMessage = null) }
    }

    fun onConfirmPasswordChanged(value: String) {
        _uiState.update { it.copy(confirmPassword = value, errorMessage = null, infoMessage = null) }
    }

    fun onRoleChanged(value: String) {
        _uiState.update { it.copy(role = value, errorMessage = null, infoMessage = null) }
    }

    fun onTokenChanged(value: String) {
        _uiState.update { it.copy(token = value, errorMessage = null, infoMessage = null) }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun submitPrimaryAction() {
        // Prevent duplicate submissions while loading
        if (_uiState.value.isLoading) return
        when (_uiState.value.mode) {
            AuthMode.LOGIN -> login()
            AuthMode.REGISTER -> register()
            AuthMode.FORGOT_PASSWORD -> forgotPassword()
            AuthMode.RESET_PASSWORD -> resetPassword()
            AuthMode.VERIFY_EMAIL -> verifyEmail()
        }
    }

    fun resendVerificationEmail() {
        val email = _uiState.value.email.trim()
        if (email.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email is required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.resendVerificationEmail(email)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isLoading = false, infoMessage = result.data, errorMessage = null) }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun login() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email and password are required") }
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches()) {
            _uiState.update { it.copy(errorMessage = "Please enter a valid email address") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.login(state.email.trim(), state.password)) {
                is ApiResult.Success -> {
                    // Clear password from memory after successful login
                    _uiState.update { it.copy(isLoading = false, isAuthenticated = true, password = "", errorMessage = null) }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun register() {
        val state = _uiState.value
        when {
            state.firstName.isBlank() || state.lastName.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "First name and last name are required") }
                return
            }
            state.email.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Email is required") }
                return
            }
            !android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches() -> {
                _uiState.update { it.copy(errorMessage = "Please enter a valid email address") }
                return
            }
            !PasswordPolicy.isStrong(state.password) -> {
                _uiState.update { it.copy(errorMessage = PasswordPolicy.requirementMessage) }
                return
            }
            state.password != state.confirmPassword -> {
                _uiState.update { it.copy(errorMessage = "Passwords do not match") }
                return
            }
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (
                val result = authRepository.register(
                    RegisterRequest(
                        firstName = state.firstName.trim(),
                        lastName = state.lastName.trim(),
                        email = state.email.trim(),
                        phone = state.phone.trim().takeIf { it.isNotBlank() },
                        password = state.password,
                        role = state.role,
                    ),
                )
            ) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            mode = AuthMode.LOGIN,
                            password = "",
                            confirmPassword = "",
                            infoMessage = result.data,
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun forgotPassword() {
        val email = _uiState.value.email.trim()
        if (email.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email is required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.forgotPassword(email)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isLoading = false, infoMessage = result.data, errorMessage = null) }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun resetPassword() {
        val state = _uiState.value
        when {
            state.token.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Reset token is required") }
                return
            }
            !PasswordPolicy.isStrong(state.password) -> {
                _uiState.update { it.copy(errorMessage = PasswordPolicy.requirementMessage) }
                return
            }
            state.password != state.confirmPassword -> {
                _uiState.update { it.copy(errorMessage = "Passwords do not match") }
                return
            }
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.resetPassword(state.token.trim(), state.password)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            mode = AuthMode.LOGIN,
                            token = "",
                            password = "",
                            confirmPassword = "",
                            infoMessage = result.data,
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun verifyEmail() {
        val token = _uiState.value.token.trim()
        if (token.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Verification token is required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.verifyEmail(token)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isAuthenticated = result.data.didAuthenticate,
                            infoMessage = result.data.message,
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }
}

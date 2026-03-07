package com.kelmah.mobile.features.profile.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.core.storage.TokenManager
import com.kelmah.mobile.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val currentUser: SessionUser? = null,
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
    val shouldLogout: Boolean = false,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    tokenManager: TokenManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.sessionFlow.collect { session ->
                _uiState.update { it.copy(currentUser = session?.user) }
            }
        }
    }

    fun onCurrentPasswordChanged(value: String) {
        _uiState.update { it.copy(currentPassword = value, errorMessage = null, infoMessage = null) }
    }

    fun onNewPasswordChanged(value: String) {
        _uiState.update { it.copy(newPassword = value, errorMessage = null, infoMessage = null) }
    }

    fun onConfirmPasswordChanged(value: String) {
        _uiState.update { it.copy(confirmPassword = value, errorMessage = null, infoMessage = null) }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun consumeLogoutSignal() {
        _uiState.update { it.copy(shouldLogout = false) }
    }

    fun changePassword() {
        val state = _uiState.value
        when {
            state.currentPassword.isBlank() || state.newPassword.isBlank() || state.confirmPassword.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Complete all password fields") }
                return
            }
            !isStrongPassword(state.newPassword) -> {
                _uiState.update { it.copy(errorMessage = "New password must be at least 8 characters and include one uppercase letter and one number") }
                return
            }
            state.newPassword != state.confirmPassword -> {
                _uiState.update { it.copy(errorMessage = "New passwords do not match") }
                return
            }
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, errorMessage = null, infoMessage = null) }
            when (val result = authRepository.changePassword(state.currentPassword, state.newPassword)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            currentPassword = "",
                            newPassword = "",
                            confirmPassword = "",
                            infoMessage = result.data,
                            shouldLogout = true,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isSaving = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun isStrongPassword(password: String): Boolean =
        password.length >= 8 && password.any(Char::isUpperCase) && password.any(Char::isDigit)
}

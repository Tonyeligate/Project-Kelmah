package com.kelmah.mobile.features.profile.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.security.PasswordPolicy
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.core.storage.TokenManager
import com.kelmah.mobile.features.auth.data.AuthRepository
import com.kelmah.mobile.features.profile.data.ProfileRepository
import com.kelmah.mobile.features.profile.data.WorkerProfileSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val currentUser: SessionUser? = null,
    val isLoadingProfileSignals: Boolean = false,
    val profileSnapshot: WorkerProfileSnapshot? = null,
    val profileErrorMessage: String? = null,
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
    val shouldLogout: Boolean = false,
) {
    // Redact passwords from toString() to prevent log/crash-report leakage
    override fun toString(): String =
        "ProfileUiState(currentUser=$currentUser, isLoadingProfileSignals=$isLoadingProfileSignals, isSaving=$isSaving, shouldLogout=$shouldLogout)"
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profileRepository: ProfileRepository,
    tokenManager: TokenManager,
) : ViewModel() {
    private var loadedWorkerId: String? = null

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.sessionFlow.collect { session ->
                val currentUser = session?.user
                _uiState.update { it.copy(currentUser = currentUser) }

                val workerId = currentUser?.resolvedId
                val isWorker = currentUser?.role.equals("worker", ignoreCase = true)
                when {
                    !isWorker || workerId.isNullOrBlank() -> {
                        loadedWorkerId = null
                        _uiState.update {
                            it.copy(
                                isLoadingProfileSignals = false,
                                profileSnapshot = null,
                                profileErrorMessage = null,
                            )
                        }
                    }
                    loadedWorkerId != workerId -> {
                        loadedWorkerId = workerId
                        refreshWorkerProfileSignals()
                    }
                }
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
        _uiState.update { it.copy(errorMessage = null, infoMessage = null, profileErrorMessage = null) }
    }

    fun consumeLogoutSignal() {
        _uiState.update { it.copy(shouldLogout = false) }
    }

    fun refreshWorkerProfileSignals() {
        val workerId = _uiState.value.currentUser?.resolvedId ?: return
        if (!_uiState.value.currentUser?.role.equals("worker", ignoreCase = true)) {
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingProfileSignals = true, profileErrorMessage = null) }
            when (val result = profileRepository.getWorkerProfileSnapshot(workerId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoadingProfileSignals = false,
                            profileSnapshot = result.data,
                            profileErrorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoadingProfileSignals = false,
                            profileSnapshot = null,
                            profileErrorMessage = result.message,
                        )
                    }
                }
            }
        }
    }

    fun changePassword() {
        val state = _uiState.value
        when {
            state.currentPassword.isBlank() || state.newPassword.isBlank() || state.confirmPassword.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Complete all password fields") }
                return
            }
            !PasswordPolicy.isStrong(state.newPassword) -> {
                _uiState.update { it.copy(errorMessage = "New ${PasswordPolicy.requirementMessage.lowercase()}") }
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
}

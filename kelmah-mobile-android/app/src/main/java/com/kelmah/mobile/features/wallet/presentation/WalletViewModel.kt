package com.kelmah.mobile.features.wallet.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.features.wallet.data.WalletRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WalletUiState(
    val depositAmount: Int = 0,
    val depositStatus: DepositStatus = DepositStatus.IDLE,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
)

enum class DepositStatus { IDLE, LOADING, SUCCESS, ERROR }

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val repository: WalletRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(WalletUiState())
    val uiState: StateFlow<WalletUiState> = _uiState.asStateFlow()

    fun setDepositAmount(amountMicro: Int) {
        _uiState.update { it.copy(depositAmount = amountMicro, errorMessage = null) }
    }

    fun deposit() {
        viewModelScope.launch {
            _uiState.update { it.copy(depositStatus = DepositStatus.LOADING, errorMessage = null) }
            when (val result = repository.deposit(_uiState.value.depositAmount)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(depositStatus = DepositStatus.SUCCESS, infoMessage = "Deposit successful.")
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(depositStatus = DepositStatus.ERROR, errorMessage = result.message)
                    }
                }
            }
        }
    }

    fun resetDeposit() {
        _uiState.update { it.copy(depositStatus = DepositStatus.IDLE) }
    }
}
package com.kelmah.mobile.features.wallet.data

import androidx.annotation.NonNull
import com.kelmah.mobile.core.network.ApiResult
import javax.inject.Inject
import kotlinx.coroutines.delay

class WalletRepository @Inject constructor() {
    suspend fun deposit(amountMicro: Int): ApiResult<Unit> {
        delay(1200)
        if (amountMicro < 500) {
            return ApiResult.Error(message = "Deposit amount too low. Minimum GH₵ 5.00 required.")
        }
        return ApiResult.Success(Unit)
    }
}
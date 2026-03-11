package com.kelmah.mobile.core.network

import com.kelmah.mobile.core.session.SessionCoordinator
import dagger.Lazy
import retrofit2.HttpException

suspend fun <T> executeAuthorizedApiCall(
    sessionCoordinator: Lazy<SessionCoordinator>,
    block: suspend () -> ApiResult<T>,
): ApiResult<T> {
    return try {
        block()
    } catch (error: HttpException) {
        if (error.code() == 401 && sessionCoordinator.get().refreshSession()) {
            try {
                block()
            } catch (retryError: Exception) {
                ApiResult.Error(message = retryError.message ?: "Request failed after session refresh")
            }
        } else {
            ApiResult.Error(message = error.message ?: "Request failed", code = error.code())
        }
    } catch (error: Exception) {
        ApiResult.Error(message = error.message ?: "Request failed")
    }
}
package com.kelmah.mobile.core.security

import android.content.Context
import android.os.Bundle
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object BiometricUnlock {
    enum class Status {
        Unavailable,
        Ready,
        Required,
    }

    var isUnlockRequired: Boolean = false
        private set

    private var authenticating by mutableStateOf(false)

    fun markUnlockRequired() {
        isUnlockRequired = true
    }

    fun clearUnlockRequired() {
        isUnlockRequired = false
    }

    fun canAuthenticate(context: Context): Status {
        return when (BiometricManager.from(context).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        )) {
            BiometricManager.BIOMETRIC_SUCCESS -> Status.Ready
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE,
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED,
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> Status.Unavailable
            else -> Status.Unavailable
        }
    }

    fun isStrongBiometricAvailable(context: Context): Boolean {
        return canAuthenticate(context) == Status.Ready
    }

    suspend fun authenticate(
        activity: FragmentActivity,
        title: String = "Unlock Kelmah",
        subtitle: String = "Confirm your identity",
        negativeButtonText: String = "Cancel",
    ): Boolean = suspendCancellableCoroutine { continuation ->
        if (authenticating) {
            continuation.resume(false)
            return@suspendCancellableCoroutine
        }

        authenticating = true
        BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    authenticating = false
                    if (continuation.isActive) continuation.resume(true)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    authenticating = false
                    if (continuation.isActive) continuation.resume(false)
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    // allow retry
                }
            }
        ).also { prompt ->
            prompt.authenticate(
                BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle)
                    .setNegativeButtonText(negativeButtonText)
                    .build()
            )

            continuation.invokeOnCancellation {
                authenticating = false
                runCatching { prompt.cancelAuthentication() }
            }
        }
    }

    @Composable
    fun BiometricGate(
        visible: Boolean,
        onUnlocked: () -> Unit,
        title: String = "Unlock Kelmah",
        subtitle: String = "Confirm your identity to continue",
        negativeButtonText: String = "Cancel",
        fallbackContent: @Composable () -> Unit = {
            androidx.compose.material3.Text(text = "Authentication required")
        },
    ) {
        val context = LocalContext.current
        val activity = remember(context) { context as? FragmentActivity }
        var status by remember { mutableStateOf<Status?>(null) }

        LaunchedEffect(visible, context) {
            status = if (!visible) {
                null
            } else {
                canAuthenticate(context)
            }
        }

        LaunchedEffect(visible, status, activity) {
            if (!visible || status == null || activity == null) return@LaunchedEffect
            if (status == Status.Ready) {
                val succeeded = authenticate(
                    activity,
                    title = title,
                    subtitle = subtitle,
                    negativeButtonText = negativeButtonText,
                )
                status = if (succeeded) Status.Unavailable else Status.Unavailable
                onUnlocked()
            } else {
                onUnlocked()
            }
        }

        if (status != Status.Unavailable) {
            fallbackContent()
        }
    }
}

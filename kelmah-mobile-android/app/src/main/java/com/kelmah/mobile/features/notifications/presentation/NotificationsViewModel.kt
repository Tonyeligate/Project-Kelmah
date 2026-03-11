package com.kelmah.mobile.features.notifications.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.NotificationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val isLoading: Boolean = false,
    val isMutating: Boolean = false,
    val unreadOnly: Boolean = false,
    val notifications: List<NotificationItem> = emptyList(),
    val unreadCount: Int = 0,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationsRepository: NotificationsRepository,
    private val realtimeSocketManager: RealtimeSocketManager,
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    private var hasBootstrapped = false
    private var signalDebounceJob: Job? = null

    init {
        observeRealtimeSignals()
        bootstrap()
    }

    fun bootstrap() {
        if (hasBootstrapped) return
        hasBootstrapped = true
        realtimeSocketManager.start()
        refresh()
    }

    fun startRealtimeSync() {
        realtimeSocketManager.start()
    }

    fun stopRealtimeSync() {
        realtimeSocketManager.stop()
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun setUnreadOnly(enabled: Boolean) {
        _uiState.update { it.copy(unreadOnly = enabled) }
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val unreadOnly = _uiState.value.unreadOnly
            val notificationsResult = notificationsRepository.getNotifications(unreadOnly = unreadOnly)
            val unreadCountResult = notificationsRepository.getUnreadCount()

            when (notificationsResult) {
                is ApiResult.Success -> {
                    val unreadCount = when (unreadCountResult) {
                        is ApiResult.Success -> unreadCountResult.data
                        is ApiResult.Error -> notificationsResult.data.count { notification -> notification.isRead.not() }
                    }
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            notifications = notificationsResult.data,
                            unreadCount = unreadCount,
                            errorMessage = (unreadCountResult as? ApiResult.Error)?.message,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = notificationsResult.message) }
                }
            }
        }
    }

    fun markAsRead(notificationId: String) {
        mutateNotification(
            action = { notificationsRepository.markAsRead(notificationId) },
            success = "Marked as read",
        ) {
            val updated = notifications.map { notification ->
                if (notification.id == notificationId) {
                    notification.copy(isRead = true)
                } else {
                    notification
                }
            }
            copy(
                notifications = if (unreadOnly) updated.filter { it.isRead.not() } else updated,
                unreadCount = updated.count { it.isRead.not() },
            )
        }
    }

    fun markAllAsRead() {
        mutateNotification(
            action = { notificationsRepository.markAllAsRead() },
            success = "Marked all as read",
        ) {
            val updated = notifications.map { it.copy(isRead = true) }
            copy(
                notifications = if (unreadOnly) emptyList() else updated,
                unreadCount = 0,
            )
        }
    }

    fun deleteNotification(notificationId: String) {
        mutateNotification(
            action = { notificationsRepository.deleteNotification(notificationId) },
            success = "Alert removed",
        ) {
            val updated = notifications.filterNot { it.id == notificationId }
            copy(
                notifications = updated,
                unreadCount = updated.count { it.isRead.not() },
            )
        }
    }

    private fun mutateNotification(
        action: suspend () -> ApiResult<Unit>,
        success: String,
        onSuccess: NotificationsUiState.() -> NotificationsUiState,
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isMutating = true, errorMessage = null, infoMessage = null) }
            when (val result = action()) {
                is ApiResult.Success -> {
                    val updatedState = _uiState.value.onSuccess()
                    val authoritativeUnreadCount = when (val unreadCountResult = notificationsRepository.getUnreadCount()) {
                        is ApiResult.Success -> unreadCountResult.data
                        is ApiResult.Error -> updatedState.unreadCount
                    }
                    _uiState.update {
                        updatedState.copy(
                            isMutating = false,
                            unreadCount = authoritativeUnreadCount,
                            infoMessage = success,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isMutating = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun observeRealtimeSignals() {
        viewModelScope.launch {
            realtimeSocketManager.signals.collect { signal ->
                when (signal) {
                    RealtimeSignal.NotificationReceived -> {
                        // Debounce rapid bursts of notification signals
                        signalDebounceJob?.cancel()
                        signalDebounceJob = viewModelScope.launch {
                            delay(300)
                            refresh()
                        }
                    }
                    is RealtimeSignal.ConnectionChanged,
                    is RealtimeSignal.MessageReceived,
                    is RealtimeSignal.MessagesRead -> Unit
                }
            }
        }
    }
}

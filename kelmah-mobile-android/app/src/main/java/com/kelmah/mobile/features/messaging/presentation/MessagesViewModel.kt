package com.kelmah.mobile.features.messaging.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.data.MessagingRepository
import com.kelmah.mobile.features.messaging.data.ThreadMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MessagesUiState(
    val isLoadingConversations: Boolean = false,
    val isLoadingMessages: Boolean = false,
    val isSending: Boolean = false,
    val conversations: List<ConversationSummary> = emptyList(),
    val selectedConversation: ConversationSummary? = null,
    val messages: List<ThreadMessage> = emptyList(),
    val searchQuery: String = "",
    val draftMessage: String = "",
    val currentUserId: String? = null,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
)

@HiltViewModel
class MessagesViewModel @Inject constructor(
    private val messagingRepository: MessagingRepository,
    private val realtimeSocketManager: RealtimeSocketManager,
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        MessagesUiState(currentUserId = messagingRepository.currentUserId()),
    )
    val uiState: StateFlow<MessagesUiState> = _uiState.asStateFlow()

    val totalUnreadCount: Int
        get() = _uiState.value.conversations.sumOf { it.unreadCount }

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
        refreshConversations()
    }

    fun startRealtimeSync() {
        realtimeSocketManager.start()
    }

    fun stopRealtimeSync() {
        realtimeSocketManager.stop()
    }

    fun updateSearchQuery(value: String) {
        _uiState.update { it.copy(searchQuery = value) }
    }

    fun updateDraft(value: String) {
        _uiState.update { it.copy(draftMessage = value) }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun openConversation(conversation: ConversationSummary) {
        _uiState.update {
            it.copy(
                selectedConversation = conversation,
                messages = emptyList(),
                errorMessage = null,
                infoMessage = null,
                draftMessage = "",
            )
        }
        loadMessages(conversation.id)
    }

    fun openConversationById(conversationId: String) {
        val existing = _uiState.value.conversations.firstOrNull { it.id == conversationId }
        if (existing != null) {
            openConversation(existing)
            return
        }

        viewModelScope.launch {
            when (val result = messagingRepository.getConversations()) {
                is ApiResult.Success -> {
                    val conversation = result.data.firstOrNull { it.id == conversationId }
                    _uiState.update {
                        it.copy(
                            conversations = result.data,
                            selectedConversation = conversation ?: it.selectedConversation,
                            errorMessage = if (conversation == null) "Chat not found" else null,
                        )
                    }
                    conversation?.let(::openConversation)
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(errorMessage = result.message) }
                }
            }
        }
    }

    fun closeConversation() {
        _uiState.update {
            it.copy(
                selectedConversation = null,
                messages = emptyList(),
                draftMessage = "",
                errorMessage = null,
            )
        }
    }

    fun refreshConversations() {
        viewModelScope.launch {
            val selectedId = _uiState.value.selectedConversation?.id
            _uiState.update { it.copy(isLoadingConversations = true, errorMessage = null, currentUserId = messagingRepository.currentUserId()) }
            when (val result = messagingRepository.getConversations()) {
                is ApiResult.Success -> {
                    val refreshedSelection = result.data.firstOrNull { it.id == selectedId }
                    _uiState.update {
                        it.copy(
                            isLoadingConversations = false,
                            conversations = result.data,
                            selectedConversation = refreshedSelection ?: it.selectedConversation,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoadingConversations = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun refreshSelectedConversation() {
        val selected = _uiState.value.selectedConversation
        if (selected == null) {
            refreshConversations()
        } else {
            refreshConversations()
            loadMessages(selected.id)
        }
    }

    fun loadMessages(conversationId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingMessages = true, errorMessage = null) }
            when (val result = messagingRepository.getMessages(conversationId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoadingMessages = false,
                            messages = result.data,
                            conversations = it.conversations.map { conversation ->
                                if (conversation.id == conversationId) conversation.copy(unreadCount = 0) else conversation
                            },
                            selectedConversation = it.selectedConversation?.let { selected ->
                                if (selected.id == conversationId) selected.copy(unreadCount = 0) else selected
                            },
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoadingMessages = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun sendMessage() {
        val state = _uiState.value
        val conversation = state.selectedConversation ?: return
        val content = state.draftMessage.trim()
        if (content.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Write a message first") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, errorMessage = null, infoMessage = null) }
            when (val result = messagingRepository.sendMessage(conversation.id, content)) {
                is ApiResult.Success -> {
                    val sentMessage = result.data
                    _uiState.update {
                        val updatedConversation = conversation.copy(
                            lastMessagePreview = sentMessage.content,
                            lastMessageAt = sentMessage.createdAt,
                            unreadCount = 0,
                        )
                        it.copy(
                            isSending = false,
                            draftMessage = "",
                            messages = (it.messages + sentMessage).distinctBy(ThreadMessage::id),
                            selectedConversation = updatedConversation,
                            conversations = (it.conversations.map { existing ->
                                if (existing.id == conversation.id) updatedConversation else existing
                            }).sortedByDescending { item -> item.lastMessageAt ?: "" },
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isSending = false, errorMessage = result.message) }
                }
            }
        }
    }

    private fun observeRealtimeSignals() {
        viewModelScope.launch {
            realtimeSocketManager.signals.collect { signal ->
                when (signal) {
                    is RealtimeSignal.MessageReceived -> {
                        // Debounce rapid bursts of signals to avoid N+1 API call storms
                        signalDebounceJob?.cancel()
                        signalDebounceJob = viewModelScope.launch {
                            delay(300)
                            refreshConversations()
                            if (signal.conversationId != null && signal.conversationId == _uiState.value.selectedConversation?.id) {
                                loadMessages(signal.conversationId)
                            }
                        }
                    }
                    is RealtimeSignal.MessagesRead -> {
                        signalDebounceJob?.cancel()
                        signalDebounceJob = viewModelScope.launch {
                            delay(300)
                            refreshConversations()
                            if (signal.conversationId != null && signal.conversationId == _uiState.value.selectedConversation?.id) {
                                loadMessages(signal.conversationId)
                            }
                        }
                    }
                    RealtimeSignal.NotificationReceived,
                    is RealtimeSignal.ConnectionChanged -> Unit
                }
            }
        }
    }
}

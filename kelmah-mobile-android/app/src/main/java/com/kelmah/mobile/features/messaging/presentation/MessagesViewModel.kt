package com.kelmah.mobile.features.messaging.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.data.ConversationDetailPayload
import com.kelmah.mobile.features.messaging.data.MessageAttachment
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

enum class MessageComposerMode(
    val apiMessageType: String,
) {
    TEXT("text"),
    PHOTO("image"),
    FILE("file"),
}

data class MessagesUiState(
    val isLoadingConversations: Boolean = false,
    val isLoadingMessages: Boolean = false,
    val isSending: Boolean = false,
    val isCreatingConversation: Boolean = false,
    val conversations: List<ConversationSummary> = emptyList(),
    val selectedConversation: ConversationSummary? = null,
    val messages: List<ThreadMessage> = emptyList(),
    val searchQuery: String = "",
    val draftMessage: String = "",
    val composerMode: MessageComposerMode = MessageComposerMode.TEXT,
    val attachmentName: String = "",
    val attachmentUrl: String = "",
    val attachmentMimeType: String = "",
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

    fun updateComposerMode(value: MessageComposerMode) {
        _uiState.update {
            it.copy(
                composerMode = value,
                errorMessage = null,
                infoMessage = null,
            )
        }
    }

    fun updateAttachmentName(value: String) {
        _uiState.update { it.copy(attachmentName = value) }
    }

    fun updateAttachmentUrl(value: String) {
        _uiState.update { it.copy(attachmentUrl = value) }
    }

    fun updateAttachmentMimeType(value: String) {
        _uiState.update { it.copy(attachmentMimeType = value) }
    }

    fun clearAttachmentDraft() {
        _uiState.update {
            it.copy(
                attachmentName = "",
                attachmentUrl = "",
                attachmentMimeType = "",
            )
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun reset() {
        hasBootstrapped = false
        _uiState.value = MessagesUiState(currentUserId = messagingRepository.currentUserId())
    }

    fun openConversation(conversation: ConversationSummary) {
        _uiState.update {
            it.copy(
                selectedConversation = conversation,
                messages = emptyList(),
                errorMessage = null,
                infoMessage = null,
                draftMessage = "",
                composerMode = MessageComposerMode.TEXT,
                attachmentName = "",
                attachmentUrl = "",
                attachmentMimeType = "",
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
            _uiState.update {
                it.copy(
                    isLoadingConversations = true,
                    isLoadingMessages = true,
                    errorMessage = null,
                )
            }
            when (val result = messagingRepository.getConversationById(conversationId)) {
                is ApiResult.Success -> {
                    applyConversationDetail(result.data)
                }
                is ApiResult.Error -> {
                    val resolvedMessage = if (result.code == 404) "Chat not found" else result.message
                    _uiState.update {
                        it.copy(
                            isLoadingConversations = false,
                            isLoadingMessages = false,
                            errorMessage = resolvedMessage,
                        )
                    }
                }
            }
        }
    }

    private fun applyConversationDetail(detail: ConversationDetailPayload) {
        _uiState.update { state ->
            val selectedConversation = detail.conversation.copy(unreadCount = 0)
            val mergedConversations = buildList {
                add(selectedConversation)
                addAll(state.conversations.filterNot { it.id == selectedConversation.id })
            }
            state.copy(
                isLoadingConversations = false,
                isLoadingMessages = false,
                selectedConversation = selectedConversation,
                messages = detail.messages,
                conversations = mergedConversations,
                errorMessage = null,
            )
        }
    }

    fun closeConversation() {
        _uiState.update {
            it.copy(
                selectedConversation = null,
                messages = emptyList(),
                draftMessage = "",
                composerMode = MessageComposerMode.TEXT,
                attachmentName = "",
                attachmentUrl = "",
                attachmentMimeType = "",
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
        val attachmentUrl = state.attachmentUrl.trim()
        val hasAttachment = attachmentUrl.isNotBlank()

        if (content.isBlank() && !hasAttachment) {
            _uiState.update { it.copy(errorMessage = "Write a message or add an attachment link first") }
            return
        }

        if (hasAttachment && !isValidAttachmentUrl(attachmentUrl)) {
            _uiState.update { it.copy(errorMessage = "Attachment link must start with http:// or https://") }
            return
        }

        val messageType = if (hasAttachment) state.composerMode.apiMessageType else MessageComposerMode.TEXT.apiMessageType
        val attachments = if (hasAttachment) {
            listOf(
                MessageAttachment(
                    name = state.attachmentName.trim().ifBlank {
                        if (state.composerMode == MessageComposerMode.PHOTO) {
                            "Photo attachment"
                        } else {
                            "File attachment"
                        }
                    },
                    fileUrl = attachmentUrl,
                    fileType = state.attachmentMimeType.trim().ifBlank {
                        if (state.composerMode == MessageComposerMode.PHOTO) {
                            "image/jpeg"
                        } else {
                            "application/octet-stream"
                        }
                    },
                ),
            )
        } else {
            emptyList()
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, errorMessage = null, infoMessage = null) }
            when (
                val result = messagingRepository.sendMessage(
                    conversationId = conversation.id,
                    content = content,
                    messageType = messageType,
                    attachments = attachments,
                )
            ) {
                is ApiResult.Success -> {
                    val sentMessage = result.data
                    _uiState.update {
                        val updatedConversation = conversation.copy(
                            lastMessagePreview = lastMessagePreviewFor(sentMessage),
                            lastMessageAt = sentMessage.createdAt,
                            unreadCount = 0,
                        )
                        it.copy(
                            isSending = false,
                            draftMessage = "",
                            composerMode = MessageComposerMode.TEXT,
                            attachmentName = "",
                            attachmentUrl = "",
                            attachmentMimeType = "",
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

    private fun lastMessagePreviewFor(message: ThreadMessage): String = when {
        message.messageType == "image" -> "Photo"
        message.messageType == "file" || message.messageType == "mixed" -> "Attachment"
        message.content.isBlank() && message.attachments.isNotEmpty() -> "Attachment"
        else -> message.content
    }

    private fun isValidAttachmentUrl(value: String): Boolean {
        val normalized = value.lowercase()
        return normalized.startsWith("https://") || normalized.startsWith("http://")
    }

    suspend fun createConversation(
        participantId: String,
        jobId: String? = null,
    ): String? {
        _uiState.update { it.copy(isCreatingConversation = true, errorMessage = null, infoMessage = null) }
        return when (val result = messagingRepository.createConversation(participantId, jobId)) {
            is ApiResult.Success -> {
                refreshConversations()
                _uiState.update { it.copy(isCreatingConversation = false) }
                result.data
            }
            is ApiResult.Error -> {
                _uiState.update { it.copy(isCreatingConversation = false, errorMessage = result.message) }
                null
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

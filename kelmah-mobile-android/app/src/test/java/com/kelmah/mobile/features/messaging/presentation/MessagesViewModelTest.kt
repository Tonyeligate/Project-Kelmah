package com.kelmah.mobile.features.messaging.presentation

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.messaging.data.ConversationDetailPayload
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.data.MessageAttachment
import com.kelmah.mobile.features.messaging.data.MessagingParticipant
import com.kelmah.mobile.features.messaging.data.MessagingRepository
import com.kelmah.mobile.features.messaging.data.ThreadMessage
import com.kelmah.mobile.testutils.MainDispatcherRule
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MessagesViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val messagingRepository: MessagingRepository = mockk()
    private val realtimeSocketManager: RealtimeSocketManager = mockk()

    @Test
    fun openConversationById_fetchesConversationDirectlyAndLoadsMessages() = runTest {
        val participant = MessagingParticipant(id = "worker-2", name = "Ama Worker")
        val conversation = ConversationSummary(
            id = "conversation-42",
            participants = listOf(participant),
            otherParticipant = participant,
            unreadCount = 3,
            lastMessagePreview = "Morning",
        )
        val messages = listOf(
            ThreadMessage(
                id = "message-1",
                conversationId = "conversation-42",
                senderId = "worker-2",
                senderName = "Ama Worker",
                content = "Morning",
                messageType = "text",
                createdAt = "2026-04-03T09:00:00Z",
            ),
        )

        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery {
            messagingRepository.getConversationById("conversation-42")
        } returns ApiResult.Success(
            ConversationDetailPayload(
                conversation = conversation,
                messages = messages,
            ),
        )

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversationById("conversation-42")
        advanceUntilIdle()

        val uiState = viewModel.uiState.value
        assertEquals("conversation-42", uiState.selectedConversation?.id)
        assertEquals(1, uiState.messages.size)
        assertEquals("message-1", uiState.messages.first().id)
        assertFalse(uiState.isLoadingConversations)
        assertFalse(uiState.isLoadingMessages)
        assertNull(uiState.errorMessage)

        coVerify(exactly = 1) { messagingRepository.getConversationById("conversation-42") }
    }

    @Test
    fun openConversationById_returnsChatNotFoundMessageOn404() = runTest {
        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery {
            messagingRepository.getConversationById("missing-conversation")
        } returns ApiResult.Error(message = "HTTP 404 Not Found", code = 404)

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversationById("missing-conversation")
        advanceUntilIdle()

        val uiState = viewModel.uiState.value
        assertTrue(uiState.selectedConversation == null)
        assertEquals("Chat not found", uiState.errorMessage)
        assertFalse(uiState.isLoadingConversations)
        assertFalse(uiState.isLoadingMessages)

        coVerify(exactly = 1) { messagingRepository.getConversationById("missing-conversation") }
    }

    @Test
    fun sendMessage_withUploadedFileAttachment_sendsAttachmentPayloadAndClearsComposer() = runTest {
        val participant = MessagingParticipant(id = "worker-2", name = "Ama Worker")
        val conversation = ConversationSummary(
            id = "conversation-42",
            participants = listOf(participant),
            otherParticipant = participant,
            unreadCount = 0,
            lastMessagePreview = "Morning",
        )
        val uploadedAttachment = MessageAttachment(
            name = "scope.pdf",
            fileUrl = "https://files.kelmah.test/scope.pdf",
            fileType = "application/pdf",
        )
        val sentMessage = ThreadMessage(
            id = "message-2",
            conversationId = "conversation-42",
            senderId = "hirer-1",
            senderName = "You",
            content = "[Attachment]",
            messageType = "file",
            attachments = listOf(uploadedAttachment),
            createdAt = "2026-04-03T09:05:00Z",
        )

        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { messagingRepository.getMessages("conversation-42") } returns ApiResult.Success(emptyList())
        coEvery {
            messagingRepository.uploadAttachment(
                conversationId = "conversation-42",
                fileName = "scope.pdf",
                mimeType = "application/pdf",
                fileBytes = any(),
                onProgress = any(),
            )
        } returns ApiResult.Success(uploadedAttachment)
        coEvery {
            messagingRepository.sendMessage(
                conversationId = "conversation-42",
                content = "",
                messageType = "file",
                attachments = match { list ->
                    list.size == 1 &&
                        list.first().name == "scope.pdf" &&
                        list.first().fileUrl == "https://files.kelmah.test/scope.pdf"
                },
            )
        } returns ApiResult.Success(sentMessage)

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversation(conversation)
        viewModel.uploadAttachment(
            fileName = "scope.pdf",
            mimeType = "application/pdf",
            fileBytes = "mock-file".toByteArray(),
        )
        advanceUntilIdle()

        viewModel.sendMessage()
        advanceUntilIdle()

        val uiState = viewModel.uiState.value
        assertEquals("", uiState.draftMessage)
        assertNull(uiState.pendingAttachment)
        assertEquals(MessageComposerMode.TEXT, uiState.composerMode)
        assertEquals("Attachment", uiState.selectedConversation?.lastMessagePreview)
        assertEquals(1, uiState.messages.size)
        assertFalse(uiState.canRetryAttachmentUpload)

        coVerify(exactly = 1) {
            messagingRepository.uploadAttachment(
                conversationId = "conversation-42",
                fileName = "scope.pdf",
                mimeType = "application/pdf",
                fileBytes = any(),
                onProgress = any(),
            )
        }

        coVerify(exactly = 1) {
            messagingRepository.sendMessage(
                conversationId = "conversation-42",
                content = "",
                messageType = "file",
                attachments = any(),
            )
        }
    }

    @Test
    fun uploadAttachment_failureEnablesRetryState() = runTest {
        val participant = MessagingParticipant(id = "worker-2", name = "Ama Worker")
        val conversation = ConversationSummary(
            id = "conversation-42",
            participants = listOf(participant),
            otherParticipant = participant,
        )

        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { messagingRepository.getMessages("conversation-42") } returns ApiResult.Success(emptyList())
        coEvery {
            messagingRepository.uploadAttachment(
                conversationId = "conversation-42",
                fileName = "scope.pdf",
                mimeType = "application/pdf",
                fileBytes = any(),
                onProgress = any(),
            )
        } returns ApiResult.Error("Upload failed")

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversation(conversation)
        viewModel.uploadAttachment(
            fileName = "scope.pdf",
            mimeType = "application/pdf",
            fileBytes = "mock-file".toByteArray(),
        )
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isUploadingAttachment)
        assertTrue(viewModel.uiState.value.canRetryAttachmentUpload)
        assertEquals("Upload failed", viewModel.uiState.value.errorMessage)
    }

    @Test
    fun retryAttachmentUpload_reusesPendingSelectionAndClearsRetryStateOnSuccess() = runTest {
        val participant = MessagingParticipant(id = "worker-2", name = "Ama Worker")
        val conversation = ConversationSummary(
            id = "conversation-42",
            participants = listOf(participant),
            otherParticipant = participant,
        )
        val uploadedAttachment = MessageAttachment(
            name = "scope.pdf",
            fileUrl = "https://files.kelmah.test/scope.pdf",
            fileType = "application/pdf",
        )

        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { messagingRepository.getMessages("conversation-42") } returns ApiResult.Success(emptyList())
        coEvery {
            messagingRepository.uploadAttachment(
                conversationId = "conversation-42",
                fileName = "scope.pdf",
                mimeType = "application/pdf",
                fileBytes = any(),
                onProgress = any(),
            )
        } returnsMany listOf(
            ApiResult.Error("Upload failed"),
            ApiResult.Success(uploadedAttachment),
        )

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversation(conversation)
        viewModel.uploadAttachment(
            fileName = "scope.pdf",
            mimeType = "application/pdf",
            fileBytes = "mock-file".toByteArray(),
        )
        advanceUntilIdle()

        viewModel.retryAttachmentUpload()
        advanceUntilIdle()

        val uiState = viewModel.uiState.value
        assertFalse(uiState.canRetryAttachmentUpload)
        assertEquals(100, uiState.attachmentUploadProgress)
        assertEquals("scope.pdf", uiState.pendingAttachment?.name)

        coVerify(exactly = 2) {
            messagingRepository.uploadAttachment(
                conversationId = "conversation-42",
                fileName = "scope.pdf",
                mimeType = "application/pdf",
                fileBytes = any(),
                onProgress = any(),
            )
        }
    }

    @Test
    fun sendMessage_withoutDraftOrAttachment_setsValidationError() = runTest {
        val participant = MessagingParticipant(id = "worker-2", name = "Ama Worker")
        val conversation = ConversationSummary(
            id = "conversation-42",
            participants = listOf(participant),
            otherParticipant = participant,
        )

        every { messagingRepository.currentUserId() } returns "hirer-1"
        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { messagingRepository.getMessages("conversation-42") } returns ApiResult.Success(emptyList())

        val viewModel = MessagesViewModel(
            messagingRepository = messagingRepository,
            realtimeSocketManager = realtimeSocketManager,
        )

        viewModel.openConversation(conversation)
        viewModel.sendMessage()
        advanceUntilIdle()

        assertEquals(
            "Write a message or attach a file first",
            viewModel.uiState.value.errorMessage,
        )
        coVerify(exactly = 0) {
            messagingRepository.sendMessage(
                conversationId = any(),
                content = any(),
                messageType = any(),
                attachments = any(),
            )
        }
    }
}

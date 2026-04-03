package com.kelmah.mobile.features.messaging.presentation

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.messaging.data.ConversationDetailPayload
import com.kelmah.mobile.features.messaging.data.ConversationSummary
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
}

package com.kelmah.mobile.features.notifications.presentation

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.realtime.RealtimeSignal
import com.kelmah.mobile.core.realtime.RealtimeSocketManager
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.NotificationsRepository
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
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NotificationsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val notificationsRepository: NotificationsRepository = mockk()
    private val realtimeSocketManager: RealtimeSocketManager = mockk()

    @Test
    fun markAllAsRead_updatesUnreadStateAndKeepsList() = runTest {
        val notifications = listOf(
            NotificationItem(
                id = "n1",
                type = "message_received",
                title = "New message",
                content = "You have a message",
                isRead = false,
            ),
            NotificationItem(
                id = "n2",
                type = "job_offer",
                title = "Job offer",
                content = "New offer",
                isRead = true,
            ),
        )

        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { notificationsRepository.getNotifications(unreadOnly = false) } returns ApiResult.Success(notifications)
        coEvery { notificationsRepository.getUnreadCount() } returnsMany listOf(
            ApiResult.Success(1),
            ApiResult.Success(0),
        )
        coEvery { notificationsRepository.markAllAsRead() } returns ApiResult.Success(Unit)

        val viewModel = NotificationsViewModel(notificationsRepository, realtimeSocketManager)

        viewModel.refresh()
        advanceUntilIdle()
        viewModel.markAllAsRead()
        advanceUntilIdle()

        val uiState = viewModel.uiState.value
        assertEquals(0, uiState.unreadCount)
        assertTrue(uiState.notifications.all { it.isRead })
        assertEquals("Marked all as read", uiState.infoMessage)
        assertFalse(uiState.isMutating)

        coVerify(exactly = 1) { notificationsRepository.markAllAsRead() }
    }

    @Test
    fun setUnreadOnly_filtersOutReadNotificationsAfterMarkAsRead() = runTest {
        val notifications = listOf(
            NotificationItem(
                id = "n1",
                type = "message_received",
                title = "New message",
                content = "You have a message",
                isRead = false,
            ),
        )

        every { realtimeSocketManager.signals } returns MutableSharedFlow<RealtimeSignal>()
        coEvery { notificationsRepository.getNotifications(unreadOnly = true) } returns ApiResult.Success(notifications)
        coEvery { notificationsRepository.getUnreadCount() } returnsMany listOf(
            ApiResult.Success(1),
            ApiResult.Success(0),
        )
        coEvery { notificationsRepository.markAsRead("n1") } returns ApiResult.Success(Unit)

        val viewModel = NotificationsViewModel(notificationsRepository, realtimeSocketManager)

        viewModel.setUnreadOnly(true)
        advanceUntilIdle()
        viewModel.markAsRead("n1")
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value.notifications.isEmpty())
        assertEquals(0, viewModel.uiState.value.unreadCount)
        coVerify(exactly = 1) { notificationsRepository.markAsRead("n1") }
    }
}

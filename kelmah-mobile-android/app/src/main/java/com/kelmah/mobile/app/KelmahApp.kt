package com.kelmah.mobile.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.kelmah.mobile.app.navigation.KelmahDestination
import com.kelmah.mobile.app.navigation.KelmahNavHost
import com.kelmah.mobile.app.navigation.mainDestinations
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.design.theme.KelmahTheme
import com.kelmah.mobile.core.session.SessionCoordinator
import com.kelmah.mobile.core.session.SessionState
import com.kelmah.mobile.core.storage.TokenManager
import com.kelmah.mobile.features.auth.presentation.LoginScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch
import com.kelmah.mobile.features.jobs.presentation.JobsViewModel
import com.kelmah.mobile.features.messaging.presentation.MessagesViewModel
import com.kelmah.mobile.features.notifications.presentation.NotificationsViewModel

@Composable
fun KelmahApp(
    tokenManager: TokenManager,
    sessionCoordinator: SessionCoordinator,
    pendingDeepLinkUrl: String?,
    onDeepLinkConsumed: (String) -> Unit,
) {
    KelmahTheme(darkTheme = isSystemInDarkTheme()) {
        val sessionState by sessionCoordinator.sessionState.collectAsStateWithLifecycle()
        val appScope = rememberCoroutineScope()
        val jobsViewModel: JobsViewModel = hiltViewModel()
        val messagesViewModel: MessagesViewModel = hiltViewModel()
        val notificationsViewModel: NotificationsViewModel = hiltViewModel()
        val messagesState by messagesViewModel.uiState.collectAsStateWithLifecycle()
        val notificationsState by notificationsViewModel.uiState.collectAsStateWithLifecycle()

        // Use session flow reactively instead of reading EncryptedSharedPreferences during
        // composition, which blocks the main thread with AES decryption.
        val currentSession by tokenManager.sessionFlow.collectAsStateWithLifecycle()

        LaunchedEffect(currentSession?.accessToken) {
            sessionCoordinator.bootstrapSession()
        }

        LaunchedEffect(sessionState) {
            when (sessionState) {
                is SessionState.Authenticated -> {
                    val role = (sessionState as SessionState.Authenticated).user?.kelmahUserRole ?: KelmahUserRole.WORKER
                    jobsViewModel.bootstrap(role)
                    messagesViewModel.bootstrap()
                    notificationsViewModel.bootstrap()
                    messagesViewModel.startRealtimeSync()
                    notificationsViewModel.startRealtimeSync()
                }
                SessionState.Loading -> Unit
                is SessionState.RecoveryRequired,
                is SessionState.Error,
                SessionState.Unauthenticated -> {
                    messagesViewModel.stopRealtimeSync()
                    notificationsViewModel.stopRealtimeSync()
                    jobsViewModel.reset()
                    messagesViewModel.reset()
                    notificationsViewModel.reset()
                }
            }
        }

        when (val state = sessionState) {
            SessionState.Loading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    CircularProgressIndicator()
                    Text(
                        text = "Securing your Kelmah session...",
                        modifier = Modifier.padding(top = 16.dp),
                    )
                }
                return@KelmahTheme
            }

            is SessionState.Unauthenticated -> {
                LoginScreen(
                    onLoginSuccess = {
                        appScope.launch { sessionCoordinator.onLoginCompleted() }
                    },
                )
                return@KelmahTheme
            }

            is SessionState.Error -> {
                LoginScreen(
                    onLoginSuccess = {
                        appScope.launch { sessionCoordinator.onLoginCompleted() }
                    },
                    sessionMessage = state.message,
                )
                return@KelmahTheme
            }

            is SessionState.RecoveryRequired -> {
                SessionRecoveryScreen(
                    userName = state.user?.displayName,
                    message = state.message,
                    onRetry = {
                        appScope.launch { sessionCoordinator.bootstrapSession(force = true) }
                    },
                    onSignInAgain = {
                        appScope.launch { sessionCoordinator.logout() }
                    },
                )
                return@KelmahTheme
            }

            is SessionState.Authenticated -> Unit
        }

        val currentUser = (sessionState as? SessionState.Authenticated)?.user
        val destinations = mainDestinations(currentUser?.kelmahUserRole ?: KelmahUserRole.WORKER)
        val navController = rememberNavController()
        val backStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = backStackEntry?.destination?.route

        Scaffold(
            bottomBar = {
                NavigationBar {
                    destinations.forEach { item ->
                        val destination = item.destination
                        val isSelected = when (destination) {
                            KelmahDestination.Jobs -> currentRoute?.startsWith("jobs") == true
                            KelmahDestination.Messages -> currentRoute?.startsWith(KelmahDestination.Messages.route) == true
                            else -> currentRoute == destination.route
                        }
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                if (!isSelected) {
                                    navController.navigate(destination.route) {
                                        launchSingleTop = true
                                        restoreState = true
                                        popUpTo(navController.graph.startDestinationId) {
                                            saveState = true
                                        }
                                    }
                                }
                            },
                            icon = {
                                val badgeCount = when (destination) {
                                    KelmahDestination.Messages -> messagesState.conversations.sumOf { it.unreadCount }
                                    KelmahDestination.Notifications -> notificationsState.unreadCount
                                    else -> 0
                                }
                                BadgedBox(
                                    badge = {
                                        if (badgeCount > 0) {
                                            Badge { Text(badgeCount.toString()) }
                                        }
                                    },
                                ) {
                                    androidx.compose.material3.Icon(destination.icon, contentDescription = destination.label)
                                }
                            },
                            label = { Text(item.label) },
                        )
                    }
                }
            },
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues)) {
                KelmahNavHost(
                    navController = navController,
                    currentUser = currentUser,
                    pendingDeepLinkUrl = pendingDeepLinkUrl,
                    onDeepLinkConsumed = onDeepLinkConsumed,
                    jobsViewModel = jobsViewModel,
                    messagesViewModel = messagesViewModel,
                    notificationsViewModel = notificationsViewModel,
                    onLogout = { logoutAll ->
                        appScope.launch {
                            sessionCoordinator.logout(logoutAll = logoutAll)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun SessionRecoveryScreen(
    userName: String?,
    message: String,
    onRetry: () -> Unit,
    onSignInAgain: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Session check needed", style = androidx.compose.material3.MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                userName?.takeIf { it.isNotBlank() }?.let {
                    Text("Saved account: $it", style = androidx.compose.material3.MaterialTheme.typography.bodyMedium)
                }
                Text(
                    text = message,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = "Sign in again before opening jobs, chats, alerts, or profile actions.",
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                )
                Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
                    Text("Retry session check")
                }
                Button(onClick = onSignInAgain, modifier = Modifier.fillMaxWidth()) {
                    Text("Sign in again")
                }
            }
        }
    }
}

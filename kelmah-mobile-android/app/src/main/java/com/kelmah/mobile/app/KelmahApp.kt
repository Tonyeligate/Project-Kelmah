package com.kelmah.mobile.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.kelmah.mobile.app.navigation.KelmahDestination
import com.kelmah.mobile.app.navigation.KelmahNavHost
import com.kelmah.mobile.app.navigation.mainDestinations
import com.kelmah.mobile.R
import com.kelmah.mobile.core.design.components.KelmahCommandDeck
import com.kelmah.mobile.core.design.components.KelmahCommandMetric
import com.kelmah.mobile.core.design.components.KelmahCommandSignal
import com.kelmah.mobile.core.design.components.KelmahGlassPanel
import com.kelmah.mobile.core.design.components.KelmahPrimaryActionMinHeight
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
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
        val jobsState by jobsViewModel.uiState.collectAsStateWithLifecycle()
        val messagesState by messagesViewModel.uiState.collectAsStateWithLifecycle()
        val notificationsState by notificationsViewModel.uiState.collectAsStateWithLifecycle()
        val isNetworkAvailable = rememberNetworkAvailability()

        val sessionStateMessage = when (val state = sessionState) {
            is SessionState.Error -> state.message
            is SessionState.RecoveryRequired -> state.message
            else -> null
        }
        val hasTimeoutSignal = listOf(
            jobsState.errorMessage,
            jobsState.homeErrorMessage,
            messagesState.errorMessage,
            notificationsState.errorMessage,
            sessionStateMessage,
        ).any(::isTimeoutOrNetworkFailure)
        val shellBannerMessage = when {
            !isNetworkAvailable -> stringResource(id = R.string.app_shell_offline_banner)
            hasTimeoutSignal -> stringResource(id = R.string.app_shell_timeout_banner)
            else -> null
        }

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
                KelmahScreenBackground {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp, vertical = 24.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(14.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            CircularProgressIndicator()
                            KelmahCommandDeck(
                                title = "Securing Session",
                                subtitle = stringResource(id = R.string.app_shell_securing_session),
                                eyebrow = "App Shell",
                                metrics = listOf(
                                    KelmahCommandMetric(label = "Auth", value = "Checking"),
                                    KelmahCommandMetric(label = "Network", value = if (isNetworkAvailable) "Online" else "Offline"),
                                    KelmahCommandMetric(label = "State", value = "Loading"),
                                ),
                                signals = listOf(
                                    KelmahCommandSignal(label = "Secure"),
                                    KelmahCommandSignal(label = "Encrypted"),
                                ),
                            )
                        }
                    }
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
            containerColor = Color.Transparent,
            topBar = {
                shellBannerMessage?.let { message ->
                    AppShellStatusBanner(
                        message = message,
                        isCritical = !isNetworkAvailable,
                    )
                }
            },
            bottomBar = {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = if (isSystemInDarkTheme()) 0.94f else 0.98f),
                    shape = RoundedCornerShape(28.dp),
                    tonalElevation = 0.dp,
                    shadowElevation = 14.dp,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.58f)),
                ) {
                    NavigationBar(
                        modifier = Modifier
                            .heightIn(min = 74.dp)
                            .padding(horizontal = 2.dp),
                        containerColor = Color.Transparent,
                        tonalElevation = 0.dp,
                    ) {
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
                                                val compactCount = if (badgeCount > 99) "99+" else badgeCount.toString()
                                                Badge(
                                                    containerColor = MaterialTheme.colorScheme.secondary,
                                                    contentColor = MaterialTheme.colorScheme.onSecondary,
                                                ) {
                                                    Text(compactCount)
                                                }
                                            }
                                        },
                                    ) {
                                        androidx.compose.material3.Icon(
                                            destination.icon,
                                            contentDescription = destination.label,
                                        )
                                    }
                                },
                                label = {
                                    Text(
                                        text = item.label,
                                        style = MaterialTheme.typography.labelMedium,
                                        maxLines = 1,
                                    )
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = MaterialTheme.colorScheme.onSecondary,
                                    selectedTextColor = MaterialTheme.colorScheme.onBackground,
                                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    indicatorColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.9f),
                                ),
                            )
                        }
                    }
                }
            },
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues).animateContentSize()) {
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
    KelmahScreenBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            KelmahCommandDeck(
                title = stringResource(id = R.string.app_shell_session_check_needed),
                subtitle = message,
                eyebrow = "Session Recovery",
                metrics = listOf(
                    KelmahCommandMetric(label = "Account", value = userName?.takeIf { it.isNotBlank() } ?: "Saved"),
                    KelmahCommandMetric(label = "Action", value = "Retry"),
                    KelmahCommandMetric(label = "State", value = "Recovery"),
                ),
                signals = listOf(
                    KelmahCommandSignal(label = "Secure"),
                    KelmahCommandSignal(label = "Keep Signed In"),
                ),
            )
            KelmahGlassPanel {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = stringResource(id = R.string.app_shell_recovery_hint),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Button(
                        onClick = onRetry,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = KelmahPrimaryActionMinHeight),
                    ) {
                        Text(stringResource(id = R.string.app_shell_retry_session_check))
                    }
                    Button(
                        onClick = onSignInAgain,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = KelmahPrimaryActionMinHeight),
                    ) {
                        Text(stringResource(id = R.string.app_shell_sign_in_again))
                    }
                }
            }
        }
    }
}

@Composable
private fun AppShellStatusBanner(
    message: String,
    isCritical: Boolean,
) {
    val containerColor = if (isCritical) {
        MaterialTheme.colorScheme.errorContainer.copy(alpha = if (isSystemInDarkTheme()) 0.92f else 1f)
    } else {
        MaterialTheme.colorScheme.secondaryContainer.copy(alpha = if (isSystemInDarkTheme()) 0.85f else 1f)
    }
    val contentColor = if (isCritical) {
        MaterialTheme.colorScheme.onErrorContainer
    } else {
        MaterialTheme.colorScheme.onSecondaryContainer
    }

    Surface(
        color = containerColor,
        contentColor = contentColor,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f)),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun rememberNetworkAvailability(): Boolean {
    val context = androidx.compose.ui.platform.LocalContext.current
    val connectivityManager = remember(context) {
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    }
    var isNetworkAvailable by remember(connectivityManager) {
        mutableStateOf(connectivityManager.hasValidatedNetwork())
    }

    DisposableEffect(connectivityManager) {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                isNetworkAvailable = connectivityManager.hasValidatedNetwork()
            }

            override fun onLost(network: Network) {
                isNetworkAvailable = connectivityManager.hasValidatedNetwork()
            }

            override fun onUnavailable() {
                isNetworkAvailable = false
            }
        }

        connectivityManager.registerDefaultNetworkCallback(callback)
        onDispose {
            runCatching { connectivityManager.unregisterNetworkCallback(callback) }
        }
    }

    return isNetworkAvailable
}

private fun ConnectivityManager.hasValidatedNetwork(): Boolean {
    val active = activeNetwork ?: return false
    val capabilities = getNetworkCapabilities(active) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
        capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
}

private fun isTimeoutOrNetworkFailure(message: String?): Boolean {
    val normalized = message?.lowercase()?.trim().orEmpty()
    if (normalized.isBlank()) return false

    return normalized.contains("timeout") ||
        normalized.contains("timed out") ||
        normalized.contains("temporarily unavailable") ||
        normalized.contains("service unavailable") ||
        normalized.contains("failed to connect") ||
        normalized.contains("network")
}

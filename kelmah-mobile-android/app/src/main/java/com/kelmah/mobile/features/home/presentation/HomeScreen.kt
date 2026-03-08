package com.kelmah.mobile.features.home.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kelmah.mobile.core.network.NetworkConfig
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser

@Composable
fun HomeScreen(
    currentUser: SessionUser?,
    onBrowseJobs: () -> Unit,
) {
    val role = currentUser.kelmahUserRole
    val displayName = currentUser?.displayName ?: "Kelmah ${role.title}"
    val overviewTitle = if (role == KelmahUserRole.HIRER) "Hirer workspace ready" else "Worker marketplace ready"
    val overviewBody = if (role == KelmahUserRole.HIRER) {
        "Review live demand, benchmark rates, and keep your hiring conversations, alerts, and profile activity aligned through one gateway-backed mobile shell."
    } else {
        "Browse live jobs, save high-value opportunities, and submit applications through the Kelmah API gateway."
    }
    val primaryAction = if (role == KelmahUserRole.HIRER) "Open Hiring Market" else "Browse Jobs"
    val highlights = if (role == KelmahUserRole.HIRER) {
        listOf(
            "Single endpoint architecture: Android derives all API and realtime routes from one gateway origin: ${NetworkConfig.gatewayOrigin}.",
            "Hirer journey: review market demand, coordinate with workers in messages, and monitor alerts without switching apps.",
            "Future split ready: the signed-in shell now resolves role-specific copy and flows from a shared role abstraction instead of hard-coded worker text.",
        )
    } else {
        listOf(
            "Single endpoint architecture: Android derives all API and realtime routes from one gateway origin: ${NetworkConfig.gatewayOrigin}.",
            "Professional worker journey: discover, review, save, and apply with resilient session refresh.",
            "Production-focused shell: Compose navigation, secure storage, and hardened API recovery already wired.",
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = displayName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = if (role == KelmahUserRole.HIRER) {
                        "Lead hiring operations with a dedicated hirer experience inside the same secure Kelmah Android app."
                    } else {
                        "Fast national job discovery, secure session recovery, and a single API gateway contract for Android."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        }

        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(
                        text = overviewTitle,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(overviewBody)
                    Button(onClick = onBrowseJobs, modifier = Modifier.fillMaxWidth()) {
                        Text(primaryAction)
                    }
                }
            }
        }

        items(highlights.size) { index ->
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Text(
                    text = highlights[index],
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

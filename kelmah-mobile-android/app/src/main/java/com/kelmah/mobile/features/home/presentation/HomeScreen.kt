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

@Composable
fun HomeScreen(
    onBrowseJobs: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Kelmah Mobile",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Fast national job discovery, secure session recovery, and a single API gateway contract for Android.",
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
                        text = "Jobs Marketplace Ready",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text("Browse live jobs, save high-value opportunities, and submit applications through the Kelmah API gateway.")
                    Button(onClick = onBrowseJobs, modifier = Modifier.fillMaxWidth()) {
                        Text("Browse Jobs")
                    }
                }
            }
        }

        items(3) { index ->
            val highlights = listOf(
                "Single endpoint architecture: Android derives all API and realtime routes from one gateway origin: ${NetworkConfig.gatewayOrigin}.",
                "Professional worker journey: discover, review, save, and apply with resilient session refresh.",
                "Production-focused shell: Compose navigation, secure storage, and hardened API recovery already wired.",
            )
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

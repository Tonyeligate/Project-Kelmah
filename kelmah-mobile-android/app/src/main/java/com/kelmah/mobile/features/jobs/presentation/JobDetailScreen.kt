package com.kelmah.mobile.features.jobs.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Send
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun JobDetailScreen(
    jobId: String,
    onBack: () -> Unit,
    onApply: (String) -> Unit,
    viewModel: JobsViewModel = hiltViewModel(),
) {
    val uiState = viewModel.uiState.collectAsStateWithLifecycle().value
    val snackbars = remember { SnackbarHostState() }

    LaunchedEffect(jobId) {
        viewModel.loadJobDetail(jobId)
    }

    LaunchedEffect(uiState.errorMessage, uiState.infoMessage) {
        uiState.errorMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
        uiState.infoMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Job Details") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbars) },
    ) { padding ->
        if (uiState.isDetailLoading || uiState.selectedJob?.summary?.id != jobId) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                verticalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator(modifier = Modifier.padding(horizontal = 24.dp))
            }
            return@Scaffold
        }

        val job = uiState.selectedJob ?: return@Scaffold
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(text = job.summary.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(text = job.summary.employerName, style = MaterialTheme.typography.titleMedium)
                    Text(text = job.summary.locationLabel, style = MaterialTheme.typography.bodyMedium)
                    Text(text = job.summary.budgetLabel, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                    Text(text = job.fullDescription.ifBlank { job.summary.description }, style = MaterialTheme.typography.bodyLarge)
                }
            }

            Card {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text = "Requirements", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
                    if (job.requirements.isEmpty()) {
                        Text(text = "No specific requirements were provided.")
                    } else {
                        job.requirements.forEach { requirement ->
                            Text(text = "• $requirement")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Applications: ${job.proposalCount}")
                    Text(text = "Views: ${job.viewCount}")
                    job.deadline?.let { Text(text = "Deadline: $it") }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedButton(
                    onClick = { viewModel.toggleSaved(job.summary.id, !job.summary.isSaved) },
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(
                        if (job.summary.isSaved) Icons.Outlined.Bookmark else Icons.Outlined.BookmarkBorder,
                        contentDescription = null,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (job.summary.isSaved) "Saved" else "Save")
                }
                Button(
                    onClick = { onApply(job.summary.id) },
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(Icons.Outlined.Send, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Apply")
                }
            }
        }
    }
}

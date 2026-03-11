package com.kelmah.mobile.features.jobs.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.core.session.KelmahUserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobApplicationScreen(
    jobId: String,
    userRole: KelmahUserRole,
    onBack: () -> Unit,
    onSubmitted: () -> Unit,
    viewModel: JobsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    var proposedRate by rememberSaveable { mutableStateOf("") }
    var estimatedDuration by rememberSaveable { mutableStateOf("") }
    var coverLetter by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(jobId) {
        viewModel.loadJobDetail(jobId)
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
    }
    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Apply Now") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbars) },
    ) { padding ->
        val jobTitle = uiState.selectedJob?.summary?.takeIf { it.id == jobId }?.title ?: "Kelmah Job"

        if (userRole == KelmahUserRole.HIRER) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(text = "Worker-only flow", style = MaterialTheme.typography.headlineSmall)
                        Text(
                            text = "Only worker accounts can apply. Hirer accounts use this app to review the market and manage hiring.",
                            style = MaterialTheme.typography.bodyLarge,
                        )
                        Button(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                            Text("Back to Market")
                        }
                    }
                }
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(text = jobTitle, style = MaterialTheme.typography.headlineSmall)
            Text(text = "Add your price, time, and short message.")
            Text(
                text = "Write simple words about the work you can do.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            OutlinedTextField(
                value = proposedRate,
                onValueChange = { proposedRate = it },
                label = { Text("Your price (GHS)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = estimatedDuration,
                onValueChange = { estimatedDuration = it },
                label = { Text("How long it will take") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = coverLetter,
                onValueChange = { coverLetter = it },
                label = { Text("Short message") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                minLines = 8,
                maxLines = 10,
            )

            Button(
                onClick = {
                    viewModel.submitApplication(
                        jobId = jobId,
                        proposedRate = proposedRate,
                        coverLetter = coverLetter,
                        estimatedDuration = estimatedDuration,
                        onSuccess = onSubmitted,
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isSubmittingApplication,
            ) {
                if (uiState.isSubmittingApplication) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sending")
                } else {
                    Text("Send Application")
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

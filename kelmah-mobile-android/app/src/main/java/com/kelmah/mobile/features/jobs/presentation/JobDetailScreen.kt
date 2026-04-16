package com.kelmah.mobile.features.jobs.presentation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.R
import com.kelmah.mobile.core.design.components.KelmahCommandDeck
import com.kelmah.mobile.core.design.components.KelmahCommandMetric
import com.kelmah.mobile.core.design.components.KelmahCommandSignal
import com.kelmah.mobile.core.design.components.KelmahGlassPanel
import com.kelmah.mobile.core.design.components.KelmahPrimaryActionMinHeight
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.components.KelmahSecondaryActionMinHeight
import com.kelmah.mobile.core.design.components.kelmahTopAppBarColors
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.core.session.KelmahUserRole
import java.util.concurrent.CancellationException
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobDetailScreen(
    jobId: String,
    userRole: KelmahUserRole,
    onBack: () -> Unit,
    onApply: (String) -> Unit,
    onMessageHirer: suspend (String, String?) -> Unit,
    viewModel: JobsViewModel = hiltViewModel(),
) {
    val uiState = viewModel.uiState.collectAsStateWithLifecycle().value
    val snackbars = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var isStartingConversation by remember { mutableStateOf(false) }

    LaunchedEffect(jobId) {
        viewModel.loadJobDetail(jobId)
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
    }
    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let { snackbars.showSnackbar(it); viewModel.clearMessages() }
    }

    KelmahScreenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Job Details") },
                    colors = kelmahTopAppBarColors(),
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                        }
                    },
                )
            },
            snackbarHost = { SnackbarHost(hostState = snackbars) },
        ) { padding ->
            val job = uiState.selectedJob?.takeIf { selected -> selected.summary.id == jobId }

            if (uiState.isDetailLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        CircularProgressIndicator()
                        Text(text = "Opening job...")
                    }
                }
                return@Scaffold
            }

            if (job == null) {
                JobDetailLoadErrorState(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 20.dp),
                    message = uiState.errorMessage,
                    onRetry = { viewModel.loadJobDetail(jobId) },
                    onBack = onBack,
                )
                return@Scaffold
            }

            val commandSignals = buildList {
                add(KelmahCommandSignal(label = "Location", value = job.summary.locationLabel))
                RelativeTimeFormatter.relativeOrFallback(job.summary.postedAt)?.let { posted ->
                    add(KelmahCommandSignal(label = "Posted", value = posted))
                }
                if (job.summary.isUrgent) {
                    add(KelmahCommandSignal(label = "Urgent", value = "Yes"))
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                KelmahCommandDeck(
                    title = job.summary.title,
                    subtitle = "${job.summary.employerName} • ${job.summary.category}",
                    eyebrow = if (userRole == KelmahUserRole.WORKER) "Worker Job Intel" else "Hirer Job Intel",
                    metrics = listOf(
                        KelmahCommandMetric(label = "Budget", value = job.summary.budgetLabel),
                        KelmahCommandMetric(label = "Proposals", value = job.proposalCount.toString()),
                        KelmahCommandMetric(label = "Views", value = job.viewCount.toString()),
                    ),
                    signals = commandSignals,
                )

                KelmahGlassPanel {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text(
                            text = "Job Scope",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = job.fullDescription.ifBlank { job.summary.description },
                            style = MaterialTheme.typography.bodyLarge,
                        )
                        Text(
                            text = "Budget: ${job.summary.budgetLabel}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }

                KelmahGlassPanel(muted = true) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text(
                            text = "Requirements",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                        if (job.requirements.isEmpty()) {
                            Text(text = "No extra requirements listed.")
                        } else {
                            job.requirements.forEach { requirement ->
                                Text(text = "• $requirement")
                            }
                        }
                        job.deadline?.let {
                            Text(
                                text = "Apply by: ${RelativeTimeFormatter.deadlineLabel(it) ?: it}",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }

                KelmahGlassPanel {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.toggleSaved(job.summary.id, !job.summary.isSaved) },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(52.dp),
                            ) {
                                Icon(
                                    if (job.summary.isSaved) Icons.Outlined.Bookmark else Icons.Outlined.BookmarkBorder,
                                    contentDescription = if (job.summary.isSaved) "Remove from saved" else "Save job",
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(if (job.summary.isSaved) "Saved Job" else "Save Job")
                            }
                            if (userRole == KelmahUserRole.WORKER) {
                                Button(
                                    onClick = { onApply(job.summary.id) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(KelmahPrimaryActionMinHeight),
                                ) {
                                    Icon(Icons.AutoMirrored.Outlined.Send, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Apply Now")
                                }
                            }
                        }
                        if (userRole == KelmahUserRole.WORKER && !job.hirerId.isNullOrBlank()) {
                            Button(
                                onClick = {
                                    scope.launch {
                                        isStartingConversation = true
                                        try {
                                            onMessageHirer(job.summary.id, job.hirerId)
                                        } catch (cancelled: CancellationException) {
                                            throw cancelled
                                        } catch (_: Exception) {
                                            snackbars.showSnackbar("Unable to open chat right now. Please try again.")
                                        } finally {
                                            isStartingConversation = false
                                        }
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(KelmahPrimaryActionMinHeight),
                                enabled = !isStartingConversation,
                            ) {
                                if (isStartingConversation) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                } else {
                                    Icon(Icons.AutoMirrored.Outlined.Send, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                }
                                Text(if (isStartingConversation) "Opening chat" else "Message Hirer")
                            }
                        }
                        Text(
                            text = if (userRole == KelmahUserRole.WORKER) {
                                "Read the requirements and respond with a clear, honest offer."
                            } else {
                                "This is your post view. Workers can apply and message from their side."
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
internal fun JobDetailLoadErrorState(
    modifier: Modifier = Modifier,
    message: String?,
    onRetry: () -> Unit,
    onBack: () -> Unit,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(id = R.string.jobs_detail_load_error_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message ?: stringResource(id = R.string.jobs_detail_load_error_message),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(18.dp))
        Button(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(id = R.string.common_try_again))
        }
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(id = R.string.common_back))
        }
    }
}

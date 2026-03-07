package com.kelmah.mobile.features.jobs.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Send
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.features.jobs.data.JobSummary
import com.kelmah.mobile.features.jobs.data.JobsFeed

@Composable
fun JobsScreen(
    onOpenJob: (String) -> Unit,
    onApplyToJob: (String) -> Unit,
    viewModel: JobsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    val jobs = if (uiState.activeFeed == JobsFeed.DISCOVER) uiState.discoverJobs else uiState.savedJobs

    LaunchedEffect(uiState.errorMessage, uiState.infoMessage) {
        uiState.errorMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
        uiState.infoMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Jobs") },
                actions = {
                    IconButton(onClick = {
                        if (uiState.activeFeed == JobsFeed.SAVED) viewModel.loadSavedJobs() else viewModel.refreshJobs()
                    }) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "Refresh")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbars) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                FilterChip(
                    selected = uiState.activeFeed == JobsFeed.DISCOVER,
                    onClick = { viewModel.switchFeed(JobsFeed.DISCOVER) },
                    label = { Text("Discover") },
                )
                FilterChip(
                    selected = uiState.activeFeed == JobsFeed.SAVED,
                    onClick = { viewModel.switchFeed(JobsFeed.SAVED) },
                    label = { Text("Saved") },
                )
            }

            if (uiState.activeFeed == JobsFeed.DISCOVER) {
                OutlinedTextField(
                    value = uiState.filters.search,
                    onValueChange = viewModel::updateSearch,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Search jobs") },
                    leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
                    trailingIcon = {
                        TextButton(onClick = viewModel::applyFilters) {
                            Text("Go")
                        }
                    },
                    singleLine = true,
                )
                OutlinedTextField(
                    value = uiState.filters.location,
                    onValueChange = viewModel::updateLocation,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Location") },
                    leadingIcon = { Icon(Icons.Outlined.LocationOn, contentDescription = null) },
                    singleLine = true,
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(uiState.categories, key = { it.id }) { category ->
                        FilterChip(
                            selected = uiState.filters.category == category.name,
                            onClick = { viewModel.updateCategory(category.name) },
                            label = { Text(category.name) },
                        )
                    }
                }
            }

            HorizontalDivider()

            if (uiState.isLoading && jobs.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (jobs.isEmpty()) {
                EmptyJobsState(
                    title = if (uiState.activeFeed == JobsFeed.SAVED) "No saved jobs yet" else "No jobs found",
                    description = if (uiState.activeFeed == JobsFeed.SAVED) {
                        "Jobs you save will appear here for quick access."
                    } else {
                        "Try broadening your filters or refreshing the marketplace feed."
                    },
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(jobs, key = { it.id }) { job ->
                        JobCard(
                            job = job,
                            onOpen = { onOpenJob(job.id) },
                            onSaveToggle = { viewModel.toggleSaved(job.id, !job.isSaved) },
                            onApply = { onApplyToJob(job.id) },
                        )
                    }
                    if (uiState.activeFeed == JobsFeed.DISCOVER && uiState.currentPage < uiState.totalPages) {
                        item {
                            OutlinedButton(
                                onClick = viewModel::loadMoreJobs,
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !uiState.isLoadingMore,
                            ) {
                                if (uiState.isLoadingMore) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                } else {
                                    Text("Load More Jobs")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun JobCard(
    job: JobSummary,
    onOpen: () -> Unit,
    onSaveToggle: () -> Unit,
    onApply: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(job.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(job.employerName, style = MaterialTheme.typography.titleSmall)
                }
                IconButton(onClick = onSaveToggle) {
                    Icon(
                        if (job.isSaved) Icons.Outlined.Bookmark else Icons.Outlined.BookmarkBorder,
                        contentDescription = null,
                    )
                }
            }
            Text(job.description, maxLines = 3, overflow = TextOverflow.Ellipsis)
            AssistChip(onClick = {}, label = { Text(job.category) })
            Text(job.locationLabel, style = MaterialTheme.typography.bodyMedium)
            Text(job.budgetLabel, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onOpen, modifier = Modifier.weight(1f)) {
                    Text("View")
                }
                OutlinedButton(onClick = onApply, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Outlined.Send, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Apply")
                }
            }
        }
    }
}

@Composable
private fun EmptyJobsState(
    title: String,
    description: String,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 60.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(description, style = MaterialTheme.typography.bodyMedium)
    }
}

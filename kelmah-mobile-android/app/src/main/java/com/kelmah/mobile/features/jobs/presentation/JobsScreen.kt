package com.kelmah.mobile.features.jobs.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.material3.ExperimentalMaterial3Api
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
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.features.jobs.data.JobSummary
import com.kelmah.mobile.features.jobs.data.JobsFeed
import com.kelmah.mobile.features.jobs.data.JobSortOption

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobsScreen(
    userRole: KelmahUserRole,
    onOpenJob: (String) -> Unit,
    onApplyToJob: (String) -> Unit,
    viewModel: JobsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    val isWorker = userRole == KelmahUserRole.WORKER
    val jobs = when {
        uiState.activeFeed == JobsFeed.SAVED -> uiState.savedJobs
        isWorker -> uiState.discoverJobs
        else -> uiState.hirerJobs
    }
    val screenTitle = if (isWorker) "Find Work" else "Your Jobs"
    val discoverLabel = if (isWorker) "Find" else "Jobs"
    val savedLabel = if (isWorker) "Saved" else "Saved"
    val emptySavedDescription = if (isWorker) {
        "Jobs you save will stay here."
    } else {
        "Saved jobs stay here so you can reopen them fast."
    }
    val emptyDiscoverDescription = if (isWorker) {
        "Try fewer filters or tap refresh."
    } else {
        "Your newest hiring posts will show here."
    }
    val urgentCount = jobs.count { it.isUrgent }
    val highFitCount = if (isWorker) uiState.discoverJobs.count { (it.matchScore ?: 0.0) >= 80.0 } else 0

    LaunchedEffect(userRole) {
        viewModel.bootstrap(userRole)
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }
    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(screenTitle) },
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
                    label = { Text(discoverLabel) },
                )
                FilterChip(
                    selected = uiState.activeFeed == JobsFeed.SAVED,
                    onClick = { viewModel.switchFeed(JobsFeed.SAVED) },
                    label = { Text(savedLabel) },
                )
            }

            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    JobsMetricTile(
                        modifier = Modifier.weight(1f),
                        label = if (uiState.activeFeed == JobsFeed.SAVED) "Saved" else "Jobs",
                        value = jobs.size,
                    )
                    JobsMetricTile(
                        modifier = Modifier.weight(1f),
                        label = "Urgent",
                        value = urgentCount,
                    )
                    JobsMetricTile(
                        modifier = Modifier.weight(1f),
                        label = if (isWorker) "80%+ fit" else "Bookmarked",
                        value = if (isWorker) highFitCount else uiState.savedJobs.size,
                    )
                }
            }

            if (isWorker) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Text(
                        text = "Find work. Open a job. Save it, or tap Apply Now.",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            } else {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Text(
                        text = "Open your jobs. Review details. Save important ones.",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            if (isWorker && uiState.activeFeed == JobsFeed.DISCOVER) {
                OutlinedTextField(
                    value = uiState.filters.search,
                    onValueChange = viewModel::updateSearch,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(if (isWorker) "Type job name" else "Search jobs") },
                    leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
                    trailingIcon = {
                        TextButton(onClick = viewModel::applyFilters) {
                            Text(if (isWorker) "Show" else "Go")
                        }
                    },
                    singleLine = true,
                )
                OutlinedTextField(
                    value = uiState.filters.location,
                    onValueChange = viewModel::updateLocation,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(if (isWorker) "Town or area" else "Location") },
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
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(JobSortOption.entries, key = { it.name }) { sort ->
                        FilterChip(
                            selected = uiState.filters.sort == sort,
                            onClick = { viewModel.updateSort(sort) },
                            label = { Text(sort.label) },
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
                    title = if (uiState.activeFeed == JobsFeed.SAVED) {
                        if (isWorker) "No saved jobs" else "No saved jobs yet"
                    } else {
                        if (isWorker) "No jobs found" else "No jobs yet"
                    },
                    description = if (uiState.activeFeed == JobsFeed.SAVED) {
                        emptySavedDescription
                    } else {
                        emptyDiscoverDescription
                    },
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(jobs, key = { it.id }) { job ->
                        JobCard(
                            userRole = userRole,
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
                                    Text(if (isWorker) "Show More Jobs" else "Show More")
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
    userRole: KelmahUserRole,
    job: JobSummary,
    onOpen: () -> Unit,
    onSaveToggle: () -> Unit,
    onApply: () -> Unit,
) {
    val isWorker = userRole == KelmahUserRole.WORKER

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
                OutlinedButton(onClick = onSaveToggle) {
                    Icon(
                        if (job.isSaved) Icons.Outlined.Bookmark else Icons.Outlined.BookmarkBorder,
                        contentDescription = if (job.isSaved) "Remove from saved" else "Save job",
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (job.isSaved) "Saved" else "Save")
                }
            }
            Text(job.description, maxLines = 3, overflow = TextOverflow.Ellipsis)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = {}, label = { Text(job.category) })
                if (job.isUrgent) {
                    AssistChip(onClick = {}, label = { Text("Urgent") })
                }
            }
            Text(job.locationLabel, style = MaterialTheme.typography.bodyMedium)
            Text(job.budgetLabel, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            val activityMeta = listOfNotNull(
                RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                if (job.isUrgent) "Urgent" else null,
            )
            if (activityMeta.isNotEmpty()) {
                Text(
                    text = activityMeta.joinToString(" • "),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onOpen, modifier = Modifier.weight(1f)) {
                    Text(if (isWorker) "Open Job" else "Open Job")
                }
                if (isWorker) {
                    OutlinedButton(onClick = onApply, modifier = Modifier.weight(1f)) {
                        Icon(Icons.AutoMirrored.Outlined.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Apply Now")
                    }
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

@Composable
private fun JobsMetricTile(
    modifier: Modifier = Modifier,
    label: String,
    value: Int,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = value.toString(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

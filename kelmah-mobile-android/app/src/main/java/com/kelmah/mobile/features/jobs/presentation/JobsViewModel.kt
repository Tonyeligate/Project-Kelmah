package com.kelmah.mobile.features.jobs.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.features.jobs.data.ApplyToJobRequest
import com.kelmah.mobile.features.jobs.data.JobCategory
import com.kelmah.mobile.features.jobs.data.JobDetail
import com.kelmah.mobile.features.jobs.data.JobSortOption
import com.kelmah.mobile.features.jobs.data.JobSummary
import com.kelmah.mobile.features.jobs.data.JobsFeed
import com.kelmah.mobile.features.jobs.data.JobsFilterState
import com.kelmah.mobile.features.jobs.data.JobsRepository
import com.kelmah.mobile.features.jobs.data.RecommendationFeedState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class JobsUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isLoadingHomeFeed: Boolean = false,
    val discoverJobs: List<JobSummary> = emptyList(),
    val savedJobs: List<JobSummary> = emptyList(),
    val recommendedJobs: List<JobSummary> = emptyList(),
    val hirerJobs: List<JobSummary> = emptyList(),
    val categories: List<JobCategory> = emptyList(),
    val filters: JobsFilterState = JobsFilterState(),
    val activeFeed: JobsFeed = JobsFeed.DISCOVER,
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val totalItems: Int = 0,
    val selectedJob: JobDetail? = null,
    val isDetailLoading: Boolean = false,
    val isSubmittingApplication: Boolean = false,
    val recommendationState: RecommendationFeedState = RecommendationFeedState.IDLE,
    val recommendationContextMessage: String? = null,
    val homeErrorMessage: String? = null,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
)

@HiltViewModel
class JobsViewModel @Inject constructor(
    private val jobsRepository: JobsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(JobsUiState())
    val uiState: StateFlow<JobsUiState> = _uiState.asStateFlow()

    init {
        bootstrap()
    }

    fun bootstrap() {
        loadCategories()
        refreshJobs()
    }

    fun refreshHome(role: KelmahUserRole) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingHomeFeed = true, homeErrorMessage = null) }

            when (role) {
                KelmahUserRole.WORKER -> {
                    val recommendationsResult = jobsRepository.getRecommendedJobs(limit = 6)
                    var recommendationState = RecommendationFeedState.FAILED
                    var recommendationContextMessage: String? = null
                    val recommendations = when (recommendationsResult) {
                        is ApiResult.Success -> {
                            recommendationState = recommendationsResult.data.state
                            recommendationContextMessage = recommendationsResult.data.contextMessage
                            recommendationsResult.data.jobs
                        }
                        is ApiResult.Error -> {
                            when (val fallback = jobsRepository.getJobs(JobsFilterState(sort = JobSortOption.URGENT), limit = 6)) {
                                is ApiResult.Success -> {
                                    recommendationState = RecommendationFeedState.FALLBACK
                                    recommendationContextMessage = "Showing urgent jobs while personalized matching recovers."
                                    fallback.data.jobs
                                }
                                is ApiResult.Error -> {
                                    recommendationState = RecommendationFeedState.FAILED
                                    recommendationContextMessage = "Personalized matching is unavailable right now. Browse jobs while it recovers."
                                    emptyList()
                                }
                            }
                        }
                    }

                    val savedResult = if (_uiState.value.savedJobs.isEmpty()) {
                        jobsRepository.getSavedJobs(limit = 6)
                    } else {
                        null
                    }

                    _uiState.update { current ->
                        current.copy(
                            isLoadingHomeFeed = false,
                            recommendedJobs = recommendations,
                            recommendationState = recommendationState,
                            recommendationContextMessage = recommendationContextMessage,
                            savedJobs = when (savedResult) {
                                is ApiResult.Success -> savedResult.data.jobs
                                else -> current.savedJobs
                            },
                            homeErrorMessage = when {
                                recommendationState == RecommendationFeedState.FAILED -> recommendationContextMessage
                                current.savedJobs.isEmpty() && savedResult is ApiResult.Error -> savedResult.message
                                else -> null
                            },
                        )
                    }
                }

                KelmahUserRole.HIRER -> {
                    when (val result = jobsRepository.getMyJobs(limit = 6)) {
                        is ApiResult.Success -> {
                            _uiState.update {
                                it.copy(
                                    isLoadingHomeFeed = false,
                                    hirerJobs = result.data,
                                    homeErrorMessage = null,
                                    recommendationState = RecommendationFeedState.IDLE,
                                    recommendationContextMessage = null,
                                )
                            }
                        }

                        is ApiResult.Error -> {
                            _uiState.update {
                                it.copy(
                                    isLoadingHomeFeed = false,
                                    hirerJobs = emptyList(),
                                    homeErrorMessage = result.message,
                                    recommendationState = RecommendationFeedState.IDLE,
                                    recommendationContextMessage = null,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    fun updateSearch(value: String) {
        _uiState.update { it.copy(filters = it.filters.copy(search = value), errorMessage = null) }
    }

    fun updateCategory(value: String) {
        _uiState.update { it.copy(filters = it.filters.copy(category = value), errorMessage = null) }
        refreshJobs()
    }

    fun updateLocation(value: String) {
        _uiState.update { it.copy(filters = it.filters.copy(location = value), errorMessage = null) }
    }

    fun updateSort(sort: JobSortOption) {
        _uiState.update { it.copy(filters = it.filters.copy(sort = sort), errorMessage = null) }
        refreshJobs()
    }

    fun applyFilters() {
        refreshJobs()
    }

    fun switchFeed(feed: JobsFeed) {
        _uiState.update { it.copy(activeFeed = feed, infoMessage = null, errorMessage = null) }
        if (feed == JobsFeed.SAVED && _uiState.value.savedJobs.isEmpty()) {
            loadSavedJobs()
        }
    }

    fun refreshJobs() {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = it.discoverJobs.isEmpty(),
                    isRefreshing = it.discoverJobs.isNotEmpty(),
                    errorMessage = null,
                    infoMessage = null,
                    currentPage = 1,
                )
            }
            when (val result = jobsRepository.getJobs(_uiState.value.filters, page = 1)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            discoverJobs = result.data.jobs,
                            currentPage = result.data.page,
                            totalPages = result.data.totalPages,
                            totalItems = result.data.totalItems,
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            errorMessage = result.message,
                        )
                    }
                }
            }
        }
    }

    fun loadMoreJobs() {
        val state = _uiState.value
        if (state.activeFeed != JobsFeed.DISCOVER || state.isLoadingMore || state.currentPage >= state.totalPages) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingMore = true, errorMessage = null) }
            when (val result = jobsRepository.getJobs(state.filters, page = state.currentPage + 1)) {
                is ApiResult.Success -> {
                    val mergedJobs = LinkedHashMap<String, JobSummary>()
                    (state.discoverJobs + result.data.jobs).forEach { job ->
                        mergedJobs[job.id] = job
                    }
                    _uiState.update {
                        it.copy(
                            isLoadingMore = false,
                            discoverJobs = mergedJobs.values.toList(),
                            currentPage = result.data.page,
                            totalPages = result.data.totalPages,
                            totalItems = result.data.totalItems,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoadingMore = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun loadSavedJobs() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = it.savedJobs.isEmpty(), errorMessage = null) }
            when (val result = jobsRepository.getSavedJobs()) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            savedJobs = result.data.jobs,
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun loadJobDetail(jobId: String) {
        val existing = _uiState.value.selectedJob
        if (existing?.summary?.id == jobId) return

        viewModelScope.launch {
            _uiState.update { it.copy(isDetailLoading = true, errorMessage = null, infoMessage = null) }
            when (val result = jobsRepository.getJobDetail(jobId)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isDetailLoading = false, selectedJob = result.data) }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isDetailLoading = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun toggleSaved(jobId: String, shouldSave: Boolean) {
        viewModelScope.launch {
            when (val result = jobsRepository.toggleSaved(jobId, shouldSave)) {
                is ApiResult.Success -> {
                    val updatedDiscover = _uiState.value.discoverJobs.map { job ->
                        if (job.id == jobId) job.copy(isSaved = shouldSave) else job
                    }
                    val currentDetail = _uiState.value.selectedJob?.let { detail ->
                        if (detail.summary.id == jobId) detail.copy(summary = detail.summary.copy(isSaved = shouldSave)) else detail
                    }
                    _uiState.update {
                        it.copy(
                            discoverJobs = updatedDiscover,
                            savedJobs = if (shouldSave) {
                                val added = updatedDiscover.firstOrNull { job -> job.id == jobId }
                                (it.savedJobs + listOfNotNull(added)).distinctBy(JobSummary::id)
                            } else {
                                it.savedJobs.filterNot { job -> job.id == jobId }
                            },
                            selectedJob = currentDetail,
                            infoMessage = if (shouldSave) "Job saved" else "Job removed from saved jobs",
                            errorMessage = null,
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(errorMessage = result.message) }
                }
            }
        }
    }

    fun submitApplication(
        jobId: String,
        proposedRate: String,
        coverLetter: String,
        estimatedDuration: String,
        onSuccess: () -> Unit,
    ) {
        viewModelScope.launch {
            val rate = proposedRate.toDoubleOrNull()
            val selectedBudget = _uiState.value.selectedJob
                ?.takeIf { it.summary.id == jobId }
                ?.summary
                ?.budgetAmount
            if (rate == null || rate <= 0.0) {
                _uiState.update { it.copy(errorMessage = "Enter a valid proposed rate") }
                return@launch
            }
            if (selectedBudget != null && selectedBudget > 0.0 && rate > selectedBudget * 2) {
                _uiState.update {
                    it.copy(errorMessage = "Proposed rate is too far above the listed budget of ${selectedBudget.toInt()} ${_uiState.value.selectedJob?.summary?.currency ?: "GHS"}")
                }
                return@launch
            }
            if (coverLetter.trim().isBlank()) {
                _uiState.update { it.copy(errorMessage = "Cover letter is required") }
                return@launch
            }

            _uiState.update { it.copy(isSubmittingApplication = true, errorMessage = null, infoMessage = null) }
            when (
                val result = jobsRepository.applyToJob(
                    jobId = jobId,
                    request = ApplyToJobRequest(
                        proposedRate = rate,
                        coverLetter = coverLetter.trim(),
                        estimatedDuration = estimatedDuration.takeIf { it.isNotBlank() },
                    ),
                )
            ) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isSubmittingApplication = false,
                            infoMessage = result.data.message,
                            errorMessage = null,
                        )
                    }
                    onSuccess()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isSubmittingApplication = false,
                            errorMessage = result.message,
                        )
                    }
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            when (val result = jobsRepository.getCategories()) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(categories = listOf(JobCategory(id = "all", name = "All")) + result.data)
                    }
                }
                is ApiResult.Error -> {
                    if (_uiState.value.categories.isEmpty()) {
                        _uiState.update {
                            it.copy(categories = listOf(JobCategory(id = "all", name = "All")))
                        }
                    }
                }
            }
        }
    }
}

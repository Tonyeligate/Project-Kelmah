package com.kelmah.mobile.features.jobs.data

import kotlinx.serialization.Serializable

data class JobsFilterState(
    val search: String = "",
    val category: String = "All",
    val location: String = "",
    val sort: JobSortOption = JobSortOption.NEWEST,
)

enum class JobSortOption(
    val label: String,
    val queryValue: String,
) {
    NEWEST("Newest", "newest"),
    OLDEST("Oldest", "oldest"),
    BUDGET_HIGH("Top Budget", "budget_desc"),
    BUDGET_LOW("Low Budget", "budget_asc"),
    DEADLINE_SOON("Deadline Soon", "deadline_asc"),
    URGENT("Urgent", "urgent"),
}

enum class JobsFeed {
    DISCOVER,
    SAVED,
}

enum class RecommendationFeedState {
    IDLE,
    PERSONALIZED,
    FALLBACK,
    FAILED,
}

data class JobsPage(
    val jobs: List<JobSummary>,
    val page: Int,
    val totalPages: Int,
    val totalItems: Int,
)

data class JobCategory(
    val id: String,
    val name: String,
    val description: String = "",
)

data class JobSummary(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val locationLabel: String,
    val budgetLabel: String,
    val budgetAmount: Double,
    val currency: String,
    val paymentType: String,
    val employerName: String,
    val employerAvatar: String? = null,
    val skills: List<String> = emptyList(),
    val postedAt: String? = null,
    val status: String? = null,
    val proposalCount: Int = 0,
    val matchScore: Double? = null,
    val aiReasoning: String? = null,
    val isVerified: Boolean = false,
    val isUrgent: Boolean = false,
    val isSaved: Boolean = false,
)

data class JobDetail(
    val summary: JobSummary,
    val fullDescription: String,
    val requirements: List<String> = emptyList(),
    val proposalCount: Int = 0,
    val viewCount: Int = 0,
    val deadline: String? = null,
    val hirerId: String? = null,
)

@Serializable
data class ApplyToJobRequest(
    val proposedRate: Double,
    val coverLetter: String,
    val estimatedDuration: String? = null,
)

data class JobApplicationResult(
    val success: Boolean,
    val message: String,
)

package com.kelmah.mobile.features.jobs.data

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.session.SessionCoordinator
import dagger.Lazy
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import retrofit2.HttpException

@Singleton
class JobsRepository @Inject constructor(
    private val jobsApiService: JobsApiService,
    private val sessionCoordinator: Lazy<SessionCoordinator>,
) {

    suspend fun getJobs(
        filters: JobsFilterState,
        page: Int = 1,
        limit: Int = 20,
    ): ApiResult<JobsPage> = executeAuthorized {
        val response = jobsApiService.getJobs(
            buildMap {
                put("page", page.toString())
                put("limit", limit.toString())
                put("sort", filters.sort.queryValue)
                if (filters.search.isNotBlank()) put("search", filters.search.trim())
                if (filters.category.isNotBlank() && filters.category != "All") put("category", filters.category)
                if (filters.location.isNotBlank()) put("location", filters.location.trim())
            },
        )
        ApiResult.Success(parseJobsPage(response))
    }

    suspend fun getRecommendedJobs(limit: Int = 6): ApiResult<RecommendationFeed> = executeAuthorized {
        val response = jobsApiService.getRecommendedJobs(
            mapOf(
                "page" to "1",
                "limit" to limit.toString(),
            ),
        )
        val personalizedJobs = parseJobsPage(response, strictJobQuality = true).jobs
        val recommendationSource = response.nestedObject("meta")?.string("recommendationSource")
        val isProfileIncomplete = recommendationSource.equals("profile-incomplete", ignoreCase = true) ||
            (response.nestedObject("data")?.bool("isNewUser") == true && personalizedJobs.isEmpty())

        if (isProfileIncomplete) {
            val generalRecommendations = fetchGeneralRecommendations(limit)
            ApiResult.Success(
                RecommendationFeed(
                    jobs = generalRecommendations,
                    state = RecommendationFeedState.PROFILE_INCOMPLETE,
                    contextMessage = buildProfileIncompleteMessage(
                        serverMessage = response.string("message"),
                        hasGeneralRecommendations = generalRecommendations.isNotEmpty(),
                    ),
                ),
            )
        } else {
            ApiResult.Success(
                RecommendationFeed(
                    jobs = personalizedJobs,
                    state = RecommendationFeedState.PERSONALIZED,
                ),
            )
        }
    }

    suspend fun getMyJobs(limit: Int = 6): ApiResult<List<JobSummary>> = executeAuthorized {
        val response = jobsApiService.getMyJobs(
            mapOf(
                "page" to "1",
                "limit" to limit.toString(),
                "sort" to "-updatedAt",
            ),
        )
        ApiResult.Success(parseJobsPage(response).jobs)
    }

    suspend fun getSavedJobs(
        page: Int = 1,
        limit: Int = 20,
    ): ApiResult<JobsPage> = executeAuthorized {
        val response = jobsApiService.getSavedJobs(
            mapOf(
                "page" to page.toString(),
                "limit" to limit.toString(),
            ),
        )
        ApiResult.Success(parseJobsPage(response, forcedSaved = true))
    }

    suspend fun getCategories(): ApiResult<List<JobCategory>> = executeAuthorized {
        val response = jobsApiService.getCategories()
        ApiResult.Success(parseCategories(response))
    }

    suspend fun getJobDetail(jobId: String): ApiResult<JobDetail> = executeAuthorized {
        val response = jobsApiService.getJobById(jobId)
        ApiResult.Success(parseJobDetail(response))
    }

    suspend fun toggleSaved(jobId: String, shouldSave: Boolean): ApiResult<Boolean> = executeAuthorized {
        if (shouldSave) {
            jobsApiService.saveJob(jobId)
        } else {
            jobsApiService.unsaveJob(jobId)
        }
        ApiResult.Success(shouldSave)
    }

    suspend fun applyToJob(jobId: String, request: ApplyToJobRequest): ApiResult<JobApplicationResult> = executeAuthorized {
        val response = jobsApiService.applyToJob(jobId, request)
        ApiResult.Success(
            JobApplicationResult(
                success = response.string("success")?.toBooleanStrictOrNull() ?: true,
                message = response.string("message") ?: response.nestedObject("data")?.string("message") ?: "Application submitted successfully",
            ),
        )
    }

    private suspend fun <T> executeAuthorized(block: suspend () -> ApiResult<T>): ApiResult<T> {
        return try {
            block()
        } catch (error: HttpException) {
            if (error.code() == 401 && sessionCoordinator.get().refreshSession()) {
                try {
                    block()
                } catch (retryError: Exception) {
                    ApiResult.Error(message = retryError.message ?: "Request failed after session refresh")
                }
            } else {
                ApiResult.Error(message = error.message ?: "Request failed", code = error.code())
            }
        } catch (error: Exception) {
            ApiResult.Error(message = error.message ?: "Request failed")
        }
    }

    private fun parseJobsPage(
        response: JsonObject,
        forcedSaved: Boolean = false,
        strictJobQuality: Boolean = false,
    ): JobsPage {
        val dataNode = response["data"]
        val dataObject = dataNode as? JsonObject
        val items = when (dataNode) {
            is JsonArray -> dataNode
            is JsonObject -> dataNode.nestedArray("items")
                ?: dataNode.nestedArray("jobs")
                ?: JsonArray(emptyList())
            else -> response.nestedArray("items")
                ?: response.nestedArray("jobs")
                ?: JsonArray(emptyList())
        }

        val pagination = dataObject?.nestedObject("pagination")
        val metaPagination = response.nestedObject("meta")?.nestedObject("pagination")
        val page = pagination?.int("page")
            ?: metaPagination?.int("page")
            ?: response.int("page")
            ?: 1
        val totalPages = pagination?.int("totalPages")
            ?: metaPagination?.int("totalPages")
            ?: response.int("totalPages")
            ?: 1
        val totalItems = pagination?.int("total")
            ?: metaPagination?.int("total")
            ?: response.int("total")
            ?: items.size

        return JobsPage(
            jobs = items.mapNotNull { parseJobSummary(it, forcedSaved, strictJobQuality) },
            page = page,
            totalPages = totalPages,
            totalItems = totalItems,
        )
    }

    private fun parseCategories(response: JsonObject): List<JobCategory> {
        val dataNode = response["data"]
        val items = when (dataNode) {
            is JsonArray -> dataNode
            is JsonObject -> dataNode["items"] as? JsonArray ?: JsonArray(emptyList())
            else -> JsonArray(emptyList())
        }

        return items.mapIndexedNotNull { index, item ->
            val obj = item as? JsonObject ?: return@mapIndexedNotNull null
            val name = obj.string("name") ?: return@mapIndexedNotNull null
            JobCategory(
                id = obj.string("_id") ?: obj.string("id") ?: "category-$index",
                name = name,
                description = obj.string("description") ?: "",
            )
        }
    }

    private fun parseJobDetail(response: JsonObject): JobDetail {
        val raw = response.nestedObject("data") ?: response
        val summary = parseJobSummary(raw, forcedSaved = raw.bool("isSaved") ?: false, strictJobQuality = false)
            ?: throw IllegalStateException("Job detail payload was invalid")

        val fullDescription = raw.string("description") ?: summary.description
        val requirements = buildList {
            val primarySkills = raw.nestedObject("requirements")?.nestedArray("primarySkills")
                ?.mapNotNull { it.primitiveContentOrNull() }
                ?: emptyList()
            val secondarySkills = raw.nestedObject("requirements")?.nestedArray("secondarySkills")
                ?.mapNotNull { it.primitiveContentOrNull() }
                ?: emptyList()
            addAll(primarySkills)
            addAll(secondarySkills)
        }.distinct()

        return JobDetail(
            summary = summary,
            fullDescription = fullDescription,
            requirements = requirements.ifEmpty { summary.skills },
            proposalCount = raw.int("proposalCount") ?: 0,
            viewCount = raw.int("viewCount") ?: 0,
            deadline = raw.string("deadline") ?: raw.string("endDate"),
            hirerId = raw.nestedObject("hirer")?.string("_id")
                ?: raw.nestedObject("hirer")?.string("id")
                ?: raw.string("hirerId"),
        )
    }

    private fun parseJobSummary(
        element: JsonElement,
        forcedSaved: Boolean = false,
        strictJobQuality: Boolean = false,
    ): JobSummary? {
        val job = element as? JsonObject ?: return null
        val id = job.string("_id") ?: job.string("id") ?: return null
        val title = job.string("title")?.trim().orEmpty()
        val description = (job.string("description") ?: "").trim()
        val budgetValue = job.double("budget")
            ?: job.nestedObject("budget")?.double("amount")
            ?: job.nestedObject("budget")?.double("max")
            ?: 0.0
        val currency = job.string("currency")
            ?: job.nestedObject("budget")?.string("currency")
            ?: "GHS"
        val employer = job.nestedObject("hirer")
        val employerName = employer?.string("name")
            ?: job.string("hirer_name")
            ?: listOfNotNull(employer?.string("firstName"), employer?.string("lastName")).joinToString(" ").ifBlank { null }
            ?: job.string("company")

        if (strictJobQuality && (title.isBlank() || description.isBlank() || employerName.isNullOrBlank())) {
            return null
        }

        return JobSummary(
            id = id,
            title = title.ifBlank { "Untitled Job" },
            description = description,
            category = job.string("category") ?: "General",
            locationLabel = parseLocationLabel(job),
            budgetLabel = formatBudgetLabel(
                amount = budgetValue,
                currency = currency,
                paymentType = job.string("paymentType") ?: job.nestedObject("budget")?.string("type") ?: "fixed",
            ),
            budgetAmount = budgetValue,
            currency = currency,
            paymentType = job.string("paymentType") ?: job.nestedObject("budget")?.string("type") ?: "fixed",
            employerName = employerName ?: "Employer Name Pending",
            employerAvatar = employer?.string("avatar") ?: employer?.string("profileImage"),
            skills = parseSkills(job),
            postedAt = job.string("createdAt") ?: job.string("created_at") ?: job.string("postedDate"),
            status = job.string("status"),
            proposalCount = job.int("proposalCount") ?: job.int("applicationsCount") ?: 0,
            matchScore = job.double("matchScore") ?: job.int("matchScore")?.toDouble(),
            aiReasoning = parseAiReasoning(job),
            isVerified = employer?.bool("verified") ?: employer?.bool("isVerified") ?: false,
            isUrgent = job.bool("urgent") ?: false,
            isSaved = forcedSaved || job.bool("isSaved") ?: job.bool("saved") ?: false,
        )
    }

    private fun parseLocationLabel(job: JsonObject): String {
        job.string("location")?.takeIf { it.isNotBlank() }?.let { return it }
        val location = job["location"] as? JsonObject
        val locationDetails = job["locationDetails"] as? JsonObject
        val composed = listOfNotNull(
            location?.string("city"),
            location?.string("region") ?: locationDetails?.string("region"),
            location?.string("country"),
        ).filter { it.isNotBlank() }
        if (composed.isNotEmpty()) return composed.joinToString(", ")
        return location?.string("address")
            ?: locationDetails?.string("district")
            ?: location?.string("type")?.replaceFirstChar { it.uppercase() }
            ?: "Location not specified"
    }

    private fun parseSkills(job: JsonObject): List<String> {
        return job.nestedArray("skills")
            ?.mapNotNull { skill ->
                when (skill) {
                    is JsonPrimitive -> skill.contentOrNull()
                    is JsonObject -> skill.string("name") ?: skill.string("label") ?: skill.string("type")
                    else -> null
                }
            }
            ?.filter { it.isNotBlank() }
            ?: emptyList()
    }

    private fun formatBudgetLabel(amount: Double, currency: String, paymentType: String): String {
        val normalizedAmount = if (amount % 1.0 == 0.0) amount.toInt().toString() else String.format("%.2f", amount)
        val suffix = if (paymentType.equals("hourly", ignoreCase = true)) "/hr" else ""
        return "$currency $normalizedAmount$suffix"
    }

    private fun parseAiReasoning(job: JsonObject): String? {
        val inlineReasoning = job.string("aiReasoning")?.trim()
        if (inlineReasoning.isNullOrBlank().not()) {
            return inlineReasoning
        }

        val reasons = job.nestedArray("aiReasons")
            ?.mapNotNull { it.primitiveContentOrNull()?.trim() }
            ?.filter { it.isNotBlank() }
            .orEmpty()

        return reasons.firstOrNull()
    }

    private suspend fun fetchGeneralRecommendations(limit: Int): List<JobSummary> {
        return try {
            val response = jobsApiService.getGeneralRecommendations(
                mapOf(
                    "page" to "1",
                    "limit" to limit.toString(),
                ),
            )
            parseJobsPage(response, strictJobQuality = true).jobs
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun buildProfileIncompleteMessage(serverMessage: String?, hasGeneralRecommendations: Boolean): String {
        val baseMessage = serverMessage?.takeIf { it.isNotBlank() }
            ?: "Complete your profile to unlock personalized job matches."
        return if (hasGeneralRecommendations) {
            "$baseMessage Showing general recommendations while you complete your profile."
        } else {
            baseMessage
        }
    }
}

private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)?.contentOrNull()

private fun JsonObject.int(key: String): Int? = (this[key] as? JsonPrimitive)?.intOrNull()

private fun JsonObject.double(key: String): Double? = (this[key] as? JsonPrimitive)?.doubleOrNull()

private fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.booleanOrNull()

private fun JsonObject.nestedObject(key: String): JsonObject? = this[key] as? JsonObject

private fun JsonObject.nestedArray(key: String): JsonArray? = this[key] as? JsonArray

private fun JsonPrimitive.contentOrNull(): String? = if (this == JsonNull) null else content

private fun JsonPrimitive.intOrNull(): Int? = content.toIntOrNull()

private fun JsonPrimitive.doubleOrNull(): Double? = content.toDoubleOrNull()

private fun JsonPrimitive.booleanOrNull(): Boolean? = content.toBooleanStrictOrNull()

private fun JsonElement.primitiveContentOrNull(): String? = (this as? JsonPrimitive)?.contentOrNull()

package com.kelmah.mobile.features.profile.data

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.network.executeAuthorizedApiCall
import com.kelmah.mobile.core.session.SessionCoordinator
import dagger.Lazy
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import retrofit2.HttpException

@Singleton
class ProfileRepository @Inject constructor(
    private val profileApiService: ProfileApiService,
    private val sessionCoordinator: Lazy<SessionCoordinator>,
) {
    suspend fun getWorkerProfileSnapshot(workerId: String): ApiResult<WorkerProfileSnapshot> = executeAuthorizedApiCall(sessionCoordinator) {
        try {
            val response = profileApiService.getMyProfileSignals()
            return@executeAuthorizedApiCall ApiResult.Success(parseProfileSignalsSnapshot(response))
        } catch (error: HttpException) {
            if (error.code() != 404) {
                throw error
            }
        }

        loadLegacyWorkerProfileSnapshot(workerId)
    }

    private suspend fun loadLegacyWorkerProfileSnapshot(workerId: String): ApiResult<WorkerProfileSnapshot> =
        coroutineScope {
            val credentialsDeferred = async { fetchOptional { profileApiService.getMyCredentials() } }
            val availabilityDeferred = async { fetchOptional { profileApiService.getWorkerAvailability(workerId) } }
            val completenessDeferred = async { fetchOptional { profileApiService.getWorkerCompleteness(workerId) } }
            val portfolioDeferred = async {
                fetchOptional {
                    profileApiService.getWorkerPortfolio(
                        workerId = workerId,
                        query = mapOf("limit" to "6"),
                    )
                }
            }

            val profileResponse = profileApiService.getProfile()
            val credentialsResponse = credentialsDeferred.await()
            val availabilityResponse = availabilityDeferred.await()
            val completenessResponse = completenessDeferred.await()
            val portfolioResponse = portfolioDeferred.await()
            ApiResult.Success(
                WorkerProfileSnapshot(
                    profile = parseProfile(profileResponse),
                    credentials = parseCredentials(credentialsResponse),
                    availability = parseAvailability(availabilityResponse),
                    completeness = parseCompleteness(completenessResponse),
                    portfolio = parsePortfolio(portfolioResponse),
                    partialWarnings = buildList {
                        if (credentialsResponse == null) add("Your certificates could not load. Job matches may be less accurate.")
                        if (availabilityResponse == null) add("Your work time could not load. Job matches may be less up to date.")
                        if (completenessResponse == null) add("Your profile check could not load.")
                        if (portfolioResponse == null) add("Your past work could not load. Hirers may see less proof.")
                    },
                ),
            )
        }

    private fun parseProfileSignalsSnapshot(response: JsonObject): WorkerProfileSnapshot {
        val raw = response.nestedObject("data") ?: response
        return WorkerProfileSnapshot(
            profile = parseProfileObject(raw.nestedObject("profile") ?: JsonObject(emptyMap())),
            credentials = parseCredentials(raw.nestedObject("credentials")),
            availability = parseAvailability(raw.nestedObject("availability")),
            completeness = parseCompleteness(raw.nestedObject("completeness")),
            portfolio = parsePortfolio(raw.nestedObject("portfolio")),
        )
    }

    private suspend fun fetchOptional(block: suspend () -> JsonObject): JsonObject? =
        runCatching { block() }.getOrNull()

    private fun parseProfile(response: JsonObject): WorkerRecommendationProfile {
        val raw = response.nestedObject("data") ?: response
        return parseProfileObject(raw)
    }

    private fun parseProfileObject(raw: JsonObject): WorkerRecommendationProfile {
        return WorkerRecommendationProfile(
            id = raw.string("id") ?: raw.string("_id"),
            firstName = raw.string("firstName") ?: "",
            lastName = raw.string("lastName") ?: "",
            email = raw.string("email") ?: "",
            phone = raw.string("phone") ?: "",
            bio = raw.string("bio") ?: "",
            location = raw.string("location")
                ?: listOfNotNull(raw.string("city"), raw.string("state"), raw.string("country"))
                    .filter { it.isNotBlank() }
                    .joinToString(", "),
            profession = raw.string("profession") ?: "",
            hourlyRate = raw.double("hourlyRate"),
            currency = raw.string("currency") ?: "GHS",
            experienceLevel = raw.string("experienceLevel"),
            yearsOfExperience = raw.int("yearsOfExperience"),
            skills = raw.nestedArray("skills").toStringList(),
            isEmailVerified = raw.bool("isEmailVerified") ?: false,
            isPhoneVerified = raw.bool("isPhoneVerified") ?: false,
        )
    }

    private fun parseCredentials(response: JsonObject?): WorkerCredentials {
        val raw = response?.nestedObject("data") ?: response ?: return WorkerCredentials()
        return WorkerCredentials(
            skills = raw.nestedArray("skills")?.mapIndexedNotNull { index, value ->
                val obj = value as? JsonObject
                val name = when {
                    obj != null -> obj.string("name") ?: obj.string("label")
                    value is JsonPrimitive -> value.content.takeIf { it.isNotBlank() }
                    else -> null
                } ?: return@mapIndexedNotNull null
                CredentialSkill(
                    id = obj?.string("id") ?: obj?.string("_id") ?: "skill-$index-$name",
                    name = name,
                    category = obj?.string("category") ?: "general",
                    proficiencyLevel = obj?.string("proficiencyLevel") ?: obj?.string("level") ?: "intermediate",
                    yearsOfExperience = obj?.int("yearsOfExperience") ?: 0,
                    isVerified = obj?.bool("isVerified") ?: false,
                )
            } ?: emptyList(),
            licenses = parseCredentialItems(raw.nestedArray("licenses")),
            certifications = parseCredentialItems(raw.nestedArray("certifications")),
        )
    }

    private fun parseCredentialItems(items: JsonArray?): List<CredentialItem> =
        items?.mapIndexedNotNull { index, value ->
            val obj = value as? JsonObject ?: return@mapIndexedNotNull null
            val name = obj.string("name") ?: return@mapIndexedNotNull null
            CredentialItem(
                id = obj.string("id") ?: obj.string("_id") ?: "credential-$index-$name",
                name = name,
                issuingOrganization = obj.string("issuingOrganization") ?: obj.string("issuer") ?: "",
                issueDate = obj.string("issueDate") ?: obj.string("issuedAt"),
                expiryDate = obj.string("expiryDate") ?: obj.string("expiresAt"),
                status = obj.string("status") ?: if (obj.bool("isVerified") == true) "verified" else "pending",
                isVerified = obj.bool("isVerified") ?: false,
            )
        } ?: emptyList()

    private fun parseAvailability(response: JsonObject?): WorkerAvailability {
        val raw = response?.nestedObject("data") ?: response ?: return WorkerAvailability()
        val schedule = (raw.nestedArray("schedule") ?: raw.nestedArray("daySlots"))
            ?.mapNotNull dayEntry@{ value ->
                val obj = value as? JsonObject ?: return@dayEntry null
                val day = obj.string("day") ?: return@dayEntry null
                AvailabilityDay(
                    day = day,
                    available = obj.bool("available") ?: obj.nestedArray("slots")?.isNotEmpty() == true,
                    slots = obj.nestedArray("slots")?.mapNotNull slotEntry@{ slotValue ->
                        val slot = slotValue as? JsonObject ?: return@slotEntry null
                        val start = slot.string("start") ?: return@slotEntry null
                        val end = slot.string("end") ?: return@slotEntry null
                        AvailabilitySlot(start = start, end = end)
                    } ?: emptyList(),
                )
            }
            ?: emptyList()

        return WorkerAvailability(
            status = raw.string("status") ?: "not_set",
            isAvailable = raw.bool("isAvailable") ?: (raw.string("status") == "available"),
            timezone = raw.string("timezone") ?: "Africa/Accra",
            schedule = schedule,
            nextAvailable = raw.string("nextAvailable"),
            lastUpdated = raw.string("lastUpdated"),
            message = raw.string("message"),
        )
    }

    private fun parseCompleteness(response: JsonObject?): WorkerCompleteness {
        val raw = response?.nestedObject("data") ?: response ?: return WorkerCompleteness()
        return WorkerCompleteness(
            completionPercentage = raw.int("completionPercentage") ?: raw.int("percentage") ?: 0,
            requiredCompletion = raw.int("requiredCompletion") ?: 0,
            optionalCompletion = raw.int("optionalCompletion") ?: 0,
            missingRequired = raw.nestedArray("missingRequired").toStringList(),
            missingOptional = raw.nestedArray("missingOptional").toStringList(),
            recommendations = raw.nestedArray("recommendations").toStringList(),
        )
    }

    private fun parsePortfolio(response: JsonObject?): WorkerPortfolio {
        val raw = response?.nestedObject("data") ?: response ?: return WorkerPortfolio()
        val items = raw.nestedArray("portfolioItems")?.mapNotNull { value ->
            val obj = value as? JsonObject ?: return@mapNotNull null
            val id = obj.string("id") ?: obj.string("_id") ?: return@mapNotNull null
            PortfolioProject(
                id = id,
                title = obj.string("title") ?: "Untitled project",
                description = obj.string("description") ?: "",
                projectType = obj.string("projectType") ?: "professional",
                skillsUsed = obj.nestedArray("skillsUsed").toStringList(),
                location = obj.string("location"),
                clientRating = obj.double("clientRating"),
                status = obj.string("status") ?: "draft",
                isFeatured = obj.bool("isFeatured") ?: false,
                createdAt = obj.string("createdAt"),
            )
        } ?: emptyList()
        val stats = raw.nestedObject("stats")
        return WorkerPortfolio(
            items = items,
            totalCount = stats?.int("total") ?: items.size,
            publishedCount = stats?.int("published") ?: items.count { it.status.equals("published", ignoreCase = true) },
        )
    }
}

private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)
    ?.takeIf { it != JsonNull }
    ?.content
    ?.takeIf { it.isNotBlank() }

private fun JsonObject.int(key: String): Int? = (this[key] as? JsonPrimitive)?.content?.toIntOrNull()

private fun JsonObject.double(key: String): Double? = (this[key] as? JsonPrimitive)?.content?.toDoubleOrNull()

private fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.content?.toBooleanStrictOrNull()

private fun JsonObject.nestedObject(key: String): JsonObject? = this[key] as? JsonObject

private fun JsonObject.nestedArray(key: String): JsonArray? = this[key] as? JsonArray

private fun JsonArray?.toStringList(): List<String> =
    this?.mapNotNull { value ->
        when (value) {
            is JsonPrimitive -> value.content.takeIf { it.isNotBlank() }
            is JsonObject -> value.string("name") ?: value.string("label") ?: value.string("type")
            JsonNull -> null
            else -> null
        }
    }?.filter { it.isNotBlank() }?.distinct() ?: emptyList()
package com.kelmah.mobile.features.profile.data

data class WorkerProfileSnapshot(
    val profile: WorkerRecommendationProfile = WorkerRecommendationProfile(),
    val credentials: WorkerCredentials = WorkerCredentials(),
    val availability: WorkerAvailability = WorkerAvailability(),
    val completeness: WorkerCompleteness = WorkerCompleteness(),
    val portfolio: WorkerPortfolio = WorkerPortfolio(),
) {
    val visibleSkills: List<String>
        get() = credentials.skills.map { it.name }.ifEmpty { profile.skills }
}

data class WorkerRecommendationProfile(
    val id: String? = null,
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phone: String = "",
    val bio: String = "",
    val location: String = "",
    val profession: String = "",
    val hourlyRate: Double? = null,
    val currency: String = "GHS",
    val experienceLevel: String? = null,
    val yearsOfExperience: Int? = null,
    val skills: List<String> = emptyList(),
    val isEmailVerified: Boolean = false,
    val isPhoneVerified: Boolean = false,
) {
    val displayName: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { email.ifBlank { "Kelmah Worker" } }
}

data class WorkerCredentials(
    val skills: List<CredentialSkill> = emptyList(),
    val licenses: List<CredentialItem> = emptyList(),
    val certifications: List<CredentialItem> = emptyList(),
)

data class CredentialSkill(
    val id: String,
    val name: String,
    val category: String = "general",
    val proficiencyLevel: String = "intermediate",
    val yearsOfExperience: Int = 0,
    val isVerified: Boolean = false,
)

data class CredentialItem(
    val id: String,
    val name: String,
    val issuingOrganization: String = "",
    val issueDate: String? = null,
    val expiryDate: String? = null,
    val status: String = "pending",
    val isVerified: Boolean = false,
)

data class WorkerAvailability(
    val status: String = "not_set",
    val isAvailable: Boolean = true,
    val timezone: String = "Africa/Accra",
    val schedule: List<AvailabilityDay> = emptyList(),
    val nextAvailable: String? = null,
    val lastUpdated: String? = null,
    val message: String? = null,
)

data class AvailabilityDay(
    val day: String,
    val available: Boolean,
    val slots: List<AvailabilitySlot> = emptyList(),
)

data class AvailabilitySlot(
    val start: String,
    val end: String,
)

data class WorkerCompleteness(
    val completionPercentage: Int = 0,
    val requiredCompletion: Int = 0,
    val optionalCompletion: Int = 0,
    val missingRequired: List<String> = emptyList(),
    val missingOptional: List<String> = emptyList(),
    val recommendations: List<String> = emptyList(),
)

data class WorkerPortfolio(
    val items: List<PortfolioProject> = emptyList(),
    val totalCount: Int = 0,
    val publishedCount: Int = 0,
)

data class PortfolioProject(
    val id: String,
    val title: String,
    val description: String = "",
    val projectType: String = "professional",
    val skillsUsed: List<String> = emptyList(),
    val location: String? = null,
    val clientRating: Double? = null,
    val status: String = "draft",
    val isFeatured: Boolean = false,
    val createdAt: String? = null,
)
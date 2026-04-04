package com.kelmah.mobile.app.navigation

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

/** Only allow kelmah:// and https:// schemes for deep links */
private val ALLOWED_SCHEMES = setOf("kelmah", "https")
private val ALLOWED_PATH_PREFIXES = listOf("/messages/", "/jobs/", "/jobs/detail/")

/** MongoDB ObjectId: exactly 24 hex characters */
private val OBJECT_ID_REGEX = Regex("^[0-9a-fA-F]{24}$")

private fun isValidObjectId(value: String): Boolean = OBJECT_ID_REGEX.matches(value)

internal fun resolveKelmahDeepLink(rawUrl: String): String? {
    val trimmedUrl = rawUrl.trim()
    if (trimmedUrl.isEmpty()) return null

    val normalizedUrl = if (trimmedUrl.startsWith("/")) {
        "https://placeholder.local$trimmedUrl"
    } else {
        trimmedUrl
    }

    val uri = runCatching { URI(normalizedUrl) }.getOrNull() ?: return null

    // Validate scheme: only allow kelmah:// and https://
    val scheme = uri.scheme?.lowercase()
    if (scheme != null && scheme !in ALLOWED_SCHEMES) return null

    val path = normalizedDeepLinkPath(uri)
    if (ALLOWED_PATH_PREFIXES.none { prefix -> path.startsWith(prefix) } && queryParameter(uri.rawQuery, "conversation").isNullOrBlank()) {
        return null
    }

    val conversationId = queryParameter(uri.rawQuery, "conversation")

    return when {
        !conversationId.isNullOrBlank() -> conversationId.takeIf(::isValidObjectId)?.let(KelmahDestination::messages)
        path.startsWith("/messages/") -> path.substringAfterLast('/').takeIf { it.isNotBlank() && isValidObjectId(it) }?.let(KelmahDestination::messages)
        path.startsWith("/jobs/detail/") -> path.substringAfterLast('/').takeIf { it.isNotBlank() && isValidObjectId(it) }?.let(KelmahDestination::jobDetail)
        path.startsWith("/jobs/") -> path.substringAfterLast('/').takeIf { it.isNotBlank() && isValidObjectId(it) }?.let(KelmahDestination::jobDetail)
        else -> null
    }
}

private fun normalizedDeepLinkPath(uri: URI): String {
    val rawPath = uri.path.orEmpty()
    if (uri.scheme?.lowercase() != "kelmah") {
        return rawPath
    }

    val host = uri.host.orEmpty()
    if (host.isBlank()) {
        return rawPath
    }

    val pathTail = rawPath.takeIf { it != "/" }.orEmpty()
    return "/$host$pathTail"
}

private fun queryParameter(rawQuery: String?, key: String): String? {
    if (rawQuery.isNullOrBlank()) return null

    return rawQuery
        .split('&')
        .asSequence()
        .mapNotNull { part ->
            val name = part.substringBefore('=', missingDelimiterValue = "")
            if (name != key) return@mapNotNull null
            val value = part.substringAfter('=', missingDelimiterValue = "")
            URLDecoder.decode(value, StandardCharsets.UTF_8.name()).takeIf { it.isNotBlank() }
        }
        .firstOrNull()
}
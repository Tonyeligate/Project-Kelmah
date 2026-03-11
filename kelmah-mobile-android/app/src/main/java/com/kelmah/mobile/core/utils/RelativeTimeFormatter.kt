package com.kelmah.mobile.core.utils

import java.time.Duration
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

object RelativeTimeFormatter {
    private val fallbackFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")

    fun relativeOrFallback(raw: String?): String? {
        val instant = parseInstant(raw) ?: return raw
        val duration = Duration.between(instant, Instant.now())
        val seconds = duration.seconds
        return if (seconds >= 0) {
            when {
                seconds < 60 -> "Just now"
                seconds < 3600 -> "${seconds / 60}m ago"
                seconds < 86_400 -> "${seconds / 3600}h ago"
                seconds < 604_800 -> "${seconds / 86_400}d ago"
                else -> fallbackFormatter.format(instant.atZone(ZoneId.systemDefault()))
            }
        } else {
            val futureSeconds = -seconds
            when {
                futureSeconds < 60 -> "Any moment now"
                futureSeconds < 3600 -> "In ${futureSeconds / 60}m"
                futureSeconds < 86_400 -> "In ${futureSeconds / 3600}h"
                futureSeconds < 604_800 -> "In ${futureSeconds / 86_400}d"
                else -> fallbackFormatter.format(instant.atZone(ZoneId.systemDefault()))
            }
        }
    }

    fun deadlineLabel(raw: String?): String? {
        val instant = parseInstant(raw) ?: return raw
        val seconds = Duration.between(Instant.now(), instant).seconds
        return when {
            seconds < 0 -> {
                val elapsed = -seconds
                when {
                    elapsed < 60 -> "Just expired"
                    elapsed < 3600 -> "Expired ${elapsed / 60}m ago"
                    elapsed < 86_400 -> "Expired ${elapsed / 3600}h ago"
                    else -> "Expired ${elapsed / 86_400}d ago"
                }
            }
            seconds < 3600 -> "Due in ${seconds / 60}m"
            seconds < 86_400 -> "Due in ${seconds / 3600}h"
            seconds < 604_800 -> "Due in ${seconds / 86_400}d"
            else -> "Due ${fallbackFormatter.format(instant.atZone(ZoneId.systemDefault()))}"
        }
    }

    private fun parseInstant(raw: String?): Instant? {
        if (raw.isNullOrBlank()) return null
        return runCatching { Instant.parse(raw) }
            .recoverCatching { OffsetDateTime.parse(raw).toInstant() }
            .getOrNull()
    }
}
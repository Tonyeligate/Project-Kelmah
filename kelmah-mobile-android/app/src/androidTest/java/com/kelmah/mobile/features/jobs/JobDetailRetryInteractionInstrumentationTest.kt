package com.kelmah.mobile.features.jobs

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kelmah.mobile.features.jobs.presentation.JobDetailLoadErrorState
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class JobDetailRetryInteractionInstrumentationTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun jobDetailLoadError_retryAndBackActionsTriggerCallbacks() {
        var retryCount = 0
        var backCount = 0

        composeRule.setContent {
            JobDetailLoadErrorState(
                message = "Connection timeout",
                onRetry = { retryCount += 1 },
                onBack = { backCount += 1 },
            )
        }

        composeRule.waitForIdle()

        composeRule.onNodeWithText("Try again").performClick()
        composeRule.onNodeWithText("Back").performClick()

        assertEquals(1, retryCount)
        assertEquals(1, backCount)
    }
}

package com.kelmah.mobile.features.messaging.presentation

import androidx.compose.material3.Surface
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.kelmah.mobile.core.design.theme.KelmahTheme
import com.kelmah.mobile.features.messaging.data.MessageAttachment
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class MessageAttachmentPreviewInstrumentationTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun messageAttachmentCard_previewFailureShowsRetryAndOpenAffordances() {
        var openCount = 0

        composeRule.setContent {
            KelmahTheme {
                Surface {
                    MessageAttachmentCard(
                        attachment = MessageAttachment(
                            name = "sample-photo.jpg",
                            fileUrl = "https://files.kelmah.test/sample-photo.jpg",
                            fileType = "image/jpeg",
                        ),
                        onOpenExternal = { openCount += 1 },
                        onOpenFullscreen = {},
                        previewStateOverride = AttachmentPreviewRenderState.Error,
                    )
                }
            }
        }

        composeRule.onNodeWithText("Preview unavailable. Open file directly.").assertIsDisplayed()
        composeRule.onNodeWithText("Try again").assertIsDisplayed()
        composeRule.onNodeWithText("Open").assertIsDisplayed()

        composeRule.onNodeWithText("Open").performClick()

        assertEquals(1, openCount)
    }
}

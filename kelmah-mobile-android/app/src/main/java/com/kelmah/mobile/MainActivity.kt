package com.kelmah.mobile

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.kelmah.mobile.app.KelmahApp
import com.kelmah.mobile.core.session.SessionCoordinator
import com.kelmah.mobile.core.storage.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private var pendingDeepLinkUrl by mutableStateOf<String?>(null)

    @Inject
    lateinit var tokenManager: TokenManager

    @Inject
    lateinit var sessionCoordinator: SessionCoordinator

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingDeepLinkUrl = intent?.dataString
        setContent {
            KelmahApp(
                tokenManager = tokenManager,
                sessionCoordinator = sessionCoordinator,
                pendingDeepLinkUrl = pendingDeepLinkUrl,
                onDeepLinkConsumed = { consumedUrl ->
                    if (pendingDeepLinkUrl == consumedUrl) {
                        pendingDeepLinkUrl = null
                    }
                },
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLinkUrl = intent.dataString
    }
}

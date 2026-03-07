package com.kelmah.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.kelmah.mobile.app.KelmahApp
import com.kelmah.mobile.core.session.SessionCoordinator
import com.kelmah.mobile.core.storage.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var tokenManager: TokenManager

    @Inject
    lateinit var sessionCoordinator: SessionCoordinator

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KelmahApp(
                tokenManager = tokenManager,
                sessionCoordinator = sessionCoordinator,
            )
        }
    }
}

package com.kelmah.mobile

import android.app.Application
import com.kelmah.mobile.core.utils.AppLogger
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class KelmahApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AppLogger.init(BuildConfig.ENABLE_VERBOSE_LOGGING)
        Timber.i("Kelmah Android application started")
    }
}

package com.kelmah.mobile.core.utils

import timber.log.Timber

object AppLogger {
    fun init(verbose: Boolean) {
        if (verbose) {
            Timber.plant(Timber.DebugTree())
        }
    }
}

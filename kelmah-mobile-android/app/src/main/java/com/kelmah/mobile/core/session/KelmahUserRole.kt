package com.kelmah.mobile.core.session

import com.kelmah.mobile.core.storage.SessionUser

enum class KelmahUserRole {
    WORKER,
    HIRER;

    val title: String
        get() = if (this == HIRER) "Hirer" else "Worker"

    companion object {
        fun from(role: String?): KelmahUserRole =
            if (role.equals("hirer", ignoreCase = true)) HIRER else WORKER
    }
}

val SessionUser?.kelmahUserRole: KelmahUserRole
    get() = KelmahUserRole.from(this?.role)
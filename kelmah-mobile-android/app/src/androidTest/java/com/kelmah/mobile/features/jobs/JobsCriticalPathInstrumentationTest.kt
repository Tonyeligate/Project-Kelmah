package com.kelmah.mobile.features.jobs

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kelmah.mobile.app.navigation.KelmahDestination
import com.kelmah.mobile.features.jobs.data.JobSortOption
import com.kelmah.mobile.features.jobs.data.JobsFilterState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class JobsCriticalPathInstrumentationTest {

    @Test
    fun jobsFilter_defaults_supportDiscoverFlow() {
        val filters = JobsFilterState()

        assertEquals("All", filters.category)
        assertEquals(JobSortOption.NEWEST, filters.sort)
    }

    @Test
    fun jobsRoutes_buildStableDetailAndApplyPaths() {
        val jobId = "69a73f7c2ea54264fff6275e"

        assertEquals("jobs/detail/$jobId", KelmahDestination.jobDetail(jobId))
        assertEquals("jobs/apply/$jobId", KelmahDestination.jobApply(jobId))
        assertTrue(JobSortOption.URGENT.queryValue.isNotBlank())
    }
}

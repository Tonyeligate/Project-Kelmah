package com.kelmah.mobile.features.jobs.presentation

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.features.jobs.data.ApplyToJobRequest
import com.kelmah.mobile.features.jobs.data.JobApplicationResult
import com.kelmah.mobile.features.jobs.data.JobsRepository
import com.kelmah.mobile.testutils.MainDispatcherRule
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class JobsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val jobsRepository: JobsRepository = mockk()

    @Test
    fun submitApplication_rejectsMissingRate() = runTest {
        val viewModel = JobsViewModel(jobsRepository)

        viewModel.submitApplication(
            jobId = "job-1",
            proposedRate = "",
            coverLetter = "I can do this job",
            estimatedDuration = "3 days",
            onSuccess = {},
        )
        advanceUntilIdle()

        assertEquals("Enter your price", viewModel.uiState.value.errorMessage)
        assertFalse(viewModel.uiState.value.isSubmittingApplication)
        coVerify(exactly = 0) { jobsRepository.applyToJob(any(), any()) }
    }

    @Test
    fun submitApplication_rejectsBlankCoverLetter() = runTest {
        val viewModel = JobsViewModel(jobsRepository)

        viewModel.submitApplication(
            jobId = "job-1",
            proposedRate = "120",
            coverLetter = "   ",
            estimatedDuration = "3 days",
            onSuccess = {},
        )
        advanceUntilIdle()

        assertEquals("Write a short message to the hirer", viewModel.uiState.value.errorMessage)
        coVerify(exactly = 0) { jobsRepository.applyToJob(any(), any()) }
    }

    @Test
    fun submitApplication_success_updatesInfoAndInvokesCallback() = runTest {
        val viewModel = JobsViewModel(jobsRepository)
        var successCalled = false

        coEvery {
            jobsRepository.applyToJob(
                "job-1",
                ApplyToJobRequest(
                    proposedRate = 120.0,
                    coverLetter = "Ready to start immediately",
                    estimatedDuration = "3 days",
                ),
            )
        } returns ApiResult.Success(
            JobApplicationResult(
                success = true,
                message = "Application submitted successfully",
            ),
        )

        viewModel.submitApplication(
            jobId = "job-1",
            proposedRate = "120",
            coverLetter = "Ready to start immediately",
            estimatedDuration = "3 days",
            onSuccess = { successCalled = true },
        )
        advanceUntilIdle()

        assertTrue(successCalled)
        assertEquals("Application submitted successfully", viewModel.uiState.value.infoMessage)
        assertFalse(viewModel.uiState.value.isSubmittingApplication)
        coVerify(exactly = 1) { jobsRepository.applyToJob(any(), any()) }
    }

    @Test
    fun loadJobDetail_failure_clearsLoadingAndKeepsSelectionEmpty() = runTest {
        val viewModel = JobsViewModel(jobsRepository)

        coEvery { jobsRepository.getJobDetail("job-404") } returns ApiResult.Error("Unable to open this job")

        viewModel.loadJobDetail("job-404")
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isDetailLoading)
        assertEquals("Unable to open this job", viewModel.uiState.value.errorMessage)
        assertNull(viewModel.uiState.value.selectedJob)
        coVerify(exactly = 1) { jobsRepository.getJobDetail("job-404") }
    }
}

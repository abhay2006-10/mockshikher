import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Mock Test Submission Concurrency, Idempotency & Timeout Regression Tests', () => {
  test('Two simultaneous submissions of the same attempt are deduplicated via early in-flight mutex', async () => {
    const inFlightSubmissions = new Map();
    let writeTransactionCount = 0;
    const attemptId = 'test-attempt-concurrent-1';

    // Mock handler simulating the submit route logic with early entry mutex
    async function submitAttemptHandler(reqCorrelationId, targetAttemptId) {
      // Early in-flight mutex check at entry
      const existingFlight = inFlightSubmissions.get(targetAttemptId);
      if (existingFlight) {
        const joinedResult = await existingFlight;
        return {
          ...joinedResult,
          joinedInFlight: true,
          correlationId: reqCorrelationId,
        };
      }

      let resolveFlight;
      let rejectFlight;
      const flightPromise = new Promise((resolve, reject) => {
        resolveFlight = resolve;
        rejectFlight = reject;
      });
      inFlightSubmissions.set(targetAttemptId, flightPromise);

      try {
        // Simulate database transaction delay (e.g. 50ms)
        await new Promise((resolve) => setTimeout(resolve, 50));
        writeTransactionCount++;

        const responsePayload = {
          success: true,
          attemptId: targetAttemptId,
          status: 'SUBMITTED',
          score: 85.5,
          alreadySubmitted: false,
        };

        resolveFlight(responsePayload);
        return {
          ...responsePayload,
          joinedInFlight: false,
          correlationId: reqCorrelationId,
        };
      } catch (err) {
        rejectFlight(err);
        throw err;
      } finally {
        inFlightSubmissions.delete(targetAttemptId);
      }
    }

    // Launch 2 concurrent submissions simultaneously
    const [res1, res2] = await Promise.all([
      submitAttemptHandler('req-1', attemptId),
      submitAttemptHandler('req-2', attemptId),
    ]);

    // Assertions
    assert.strictEqual(res1.success, true, 'First submission succeeded');
    assert.strictEqual(res2.success, true, 'Second submission succeeded');
    assert.strictEqual(res1.attemptId, attemptId);
    assert.strictEqual(res2.attemptId, attemptId);
    assert.strictEqual(res1.score, res2.score, 'Both submissions return identical score');

    // Exactly one executed the write transaction
    assert.strictEqual(writeTransactionCount, 1, 'Exactly one transaction was executed for concurrent requests');

    // One executed and the other joined in-flight
    const executionFlags = [res1.joinedInFlight, res2.joinedInFlight];
    assert.ok(executionFlags.includes(false), 'One request was the primary execution');
    assert.ok(executionFlags.includes(true), 'The other request joined the in-flight promise');
    assert.strictEqual(inFlightSubmissions.size, 0, 'In-flight map is completely cleared');
  });

  test('Skip deleteMany round-trip when attempt has zero existing answers', async () => {
    let deleteManyExecuted = false;
    let createManyExecuted = false;

    async function simulatePersistAnswers(hasExistingAnswers, answersData) {
      if (hasExistingAnswers) {
        deleteManyExecuted = true;
      }
      createManyExecuted = true;
      return { count: answersData.length };
    }

    // Attempt with 0 existing answers
    await simulatePersistAnswers(false, [{ questionId: 'q1' }, { questionId: 'q2' }]);
    assert.strictEqual(deleteManyExecuted, false, 'deleteMany skipped when answers count is 0');
    assert.strictEqual(createManyExecuted, true, 'createMany executed directly');

    // Attempt with draft answers previously saved
    deleteManyExecuted = false;
    createManyExecuted = false;
    await simulatePersistAnswers(true, [{ questionId: 'q1' }]);
    assert.strictEqual(deleteManyExecuted, true, 'deleteMany executed when existing answers were present');
    assert.strictEqual(createManyExecuted, true);
  });

  test('Error or timeout properly cleans in-flight mutex and does not deadlock subsequent requests', async () => {
    const inFlightSubmissions = new Map();
    const attemptId = 'test-attempt-timeout-err';
    let callCount = 0;

    async function flakySubmissionHandler(failOnFirst) {
      callCount++;
      const existingFlight = inFlightSubmissions.get(attemptId);
      if (existingFlight) {
        return await existingFlight;
      }

      let resolveFlight;
      let rejectFlight;
      const flightPromise = new Promise((resolve, reject) => {
        resolveFlight = resolve;
        rejectFlight = reject;
      });
      flightPromise.catch(() => {});
      inFlightSubmissions.set(attemptId, flightPromise);

      try {
        if (failOnFirst) {
          throw new Error('Transaction timeout (simulated)');
        }
        const successResult = { success: true, attemptId };
        resolveFlight(successResult);
        return successResult;
      } catch (err) {
        rejectFlight(err);
        throw err;
      } finally {
        inFlightSubmissions.delete(attemptId);
      }
    }

    // Call 1 fails
    await assert.rejects(
      () => flakySubmissionHandler(true),
      /Transaction timeout/
    );

    // Mutex map must be completely clean
    assert.strictEqual(inFlightSubmissions.has(attemptId), false, 'Mutex key was cleaned up after failure');

    // Call 2 retry succeeds without being blocked by prior failed in-flight promise
    const retryResult = await flakySubmissionHandler(false);
    assert.strictEqual(retryResult.success, true, 'Retry succeeded after previous failure');
    assert.strictEqual(callCount, 2);
  });

  test('Repeat submission on already-submitted attempt hits idempotency guard with zero writes', async () => {
    let databaseWriteCount = 0;
    const attemptRecord = {
      id: 'test-attempt-idempotent-2',
      status: 'SUBMITTED',
      score: 72.0,
      correctCount: 75,
      wrongCount: 12,
      submittedAt: new Date().toISOString(),
    };

    async function submitWithIdempotencyGuard(attempt) {
      // Step 3 Idempotency Guard
      if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
        return {
          success: true,
          attemptId: attempt.id,
          alreadySubmitted: true,
          score: attempt.score,
        };
      }

      // If not submitted, would perform writes
      databaseWriteCount++;
      return {
        success: true,
        attemptId: attempt.id,
        alreadySubmitted: false,
        score: 100,
      };
    }

    const result = await submitWithIdempotencyGuard(attemptRecord);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.alreadySubmitted, true, 'Correctly flagged as alreadySubmitted');
    assert.strictEqual(result.score, 72.0, 'Preserved original submitted score');
    assert.strictEqual(databaseWriteCount, 0, 'Zero writes performed for repeat submission');
  });

  test('Multi-instance race collision is caught by atomic status transition without overwriting', async () => {
    // Simulating two separate Node.js server processes racing at the database layer
    let attemptState = {
      id: 'test-attempt-race-3',
      status: 'IN_PROGRESS',
      score: null,
    };

    let userAnswersTable = [];

    // Mock database transaction simulating updateMany({ where: { id, status: 'IN_PROGRESS' } })
    async function executeDbTransaction(workerId, payload) {
      // Simulate atomic conditional update
      if (attemptState.id === payload.attemptId && attemptState.status === 'IN_PROGRESS') {
        attemptState.status = 'SUBMITTED';
        attemptState.score = payload.score;

        // Atomically replace answers
        userAnswersTable = payload.answers;
        return { count: 1, workerId };
      }

      // If status is no longer IN_PROGRESS, 0 rows match
      return { count: 0, workerId };
    }

    // Two workers attempt to execute the transaction concurrently
    const [tx1, tx2] = await Promise.all([
      executeDbTransaction('worker-A', {
        attemptId: 'test-attempt-race-3',
        score: 90,
        answers: [{ questionId: 'q1', selectedOption: 'A' }],
      }),
      executeDbTransaction('worker-B', {
        attemptId: 'test-attempt-race-3',
        score: 40,
        answers: [{ questionId: 'q1', selectedOption: 'B' }],
      }),
    ]);

    // Exactly one worker won the atomic transition
    const counts = [tx1.count, tx2.count];
    assert.ok(counts.includes(1), 'One worker succeeded in atomic transition');
    assert.ok(counts.includes(0), 'The second worker received count 0 and was detected as duplicate');

    // Data integrity is preserved: only the winning worker wrote answers
    assert.strictEqual(attemptState.status, 'SUBMITTED');
    assert.strictEqual(userAnswersTable.length, 1);
  });

  // =========================================================================
  // UNIT SIMULATIONS VS. PRODUCTION HANDLER:
  // The tests below are isolated unit simulations testing the asynchronous
  // state machine, per-request closure scoping, and error-telemetry capture.
  // They do NOT execute against a live Next.js HTTP server or real PostgreSQL
  // instance. Production behavior must be verified via deployment server logs.
  // =========================================================================

  test('Transaction error correctly captures lastActiveStep and diagnostic timing telemetry (Simulation)', async () => {
    async function simulateInstrumentedTransaction(failStep, options = {}) {
      const reqStart = performance.now();
      let currentTxStep = 'pre_transaction';
      let stepStartMs = reqStart;
      let tTxStart = 0;
      let tUpdateMs = 0;
      let tDeleteAnswersMs = 0;
      let deletedAnswersCount = 0;
      let tCreateAnswersMs = 0;
      let createdAnswersCount = 0;
      let tMistakesMs = 0;
      let mistakesInsertedCount = 0;
      let tBookmarksMs = 0;
      let bookmarksInsertedCount = 0;
      let capturedDiagnostic = null;

      try {
        // Acquisition phase
        tTxStart = performance.now();
        currentTxStep = 'tx_acquisition';
        stepStartMs = tTxStart;

        if (failStep === 'tx_acquisition') {
          await new Promise((r) => setTimeout(r, 15));
          throw new Error('Connection pool timeout (maxWait reached)');
        }

        // Simulated prisma.$transaction wrapper: executes callback, then executes commit
        async function simulatePrismaTransaction(callback) {
          const result = await callback();
          // After callback resolves successfully, Prisma attempts to COMMIT the transaction on Postgres
          if (failStep === 'commit_duplicate') {
            await new Promise((r) => setTimeout(r, 10));
            throw new Error('Prisma transaction commit failed on duplicate attempt branch');
          }
          if (failStep === 'commit_normal') {
            await new Promise((r) => setTimeout(r, 10));
            throw new Error('Prisma transaction commit failed on normal submission branch');
          }
          return result;
        }

        const txResult = await simulatePrismaTransaction(async () => {
          // Inside callback
          currentTxStep = 'tx_entered';
          stepStartMs = performance.now();

          // Step 1: update_attempt_status
          currentTxStep = 'update_attempt_status';
          stepStartMs = performance.now();
          if (failStep === 'update_attempt_status') {
            await new Promise((r) => setTimeout(r, 15));
            throw new Error('Lock timeout during updateMany');
          }
          await new Promise((r) => setTimeout(r, 10));
          tUpdateMs = parseFloat((performance.now() - stepStartMs).toFixed(2));

          // Step 2: Concurrency collision check
          if (options.isDuplicate) {
            currentTxStep = 'find_committed_attempt';
            stepStartMs = performance.now();
            if (failStep === 'find_committed_attempt') {
              await new Promise((r) => setTimeout(r, 10));
              throw new Error('Error querying committed attempt');
            }
            await new Promise((r) => setTimeout(r, 10));

            // Immediately before returning duplicate result
            currentTxStep = 'tx_committing';
            stepStartMs = performance.now();
            return { isDuplicate: true };
          }

          // Step 3: Delete existing answers
          if (options.hasExistingAnswers) {
            currentTxStep = 'delete_existing_answers';
            stepStartMs = performance.now();
            if (failStep === 'delete_existing_answers') {
              throw new Error('Lock timeout during deleteMany');
            }
            await new Promise((r) => setTimeout(r, 10));
            tDeleteAnswersMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
            deletedAnswersCount = 5;
          }

          // Step 4: Create user answers
          currentTxStep = 'create_user_answers';
          stepStartMs = performance.now();
          if (failStep === 'create_user_answers') {
            throw new Error('Transaction expired at createMany');
          }
          await new Promise((r) => setTimeout(r, 10));
          tCreateAnswersMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
          createdAnswersCount = 10;

          // Commit phase setup for normal submission branch
          currentTxStep = 'tx_committing';
          stepStartMs = performance.now();
          return { isDuplicate: false };
        });

        currentTxStep = 'tx_committed';
        return txResult;
      } catch (err) {
        const activeStepElapsedMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
        const txElapsedMs = tTxStart > 0 ? parseFloat((performance.now() - tTxStart).toFixed(2)) : 0;
        capturedDiagnostic = {
          lastActiveStep: currentTxStep,
          activeStepElapsedMs,
          txElapsedMs,
          operationTimings: {
            tUpdateMs,
            tDeleteAnswersMs,
            tCreateAnswersMs,
            tMistakesMs,
            tBookmarksMs,
          },
          operationCounts: {
            deletedAnswersCount,
            createdAnswersCount,
            mistakesInsertedCount,
            bookmarksInsertedCount,
          },
        };
        throw Object.assign(err, { diagnostic: capturedDiagnostic });
      }
    }

    // 1. Failure during tx_acquisition (executes once)
    let diagAcq = null;
    let acqError = null;
    try {
      await simulateInstrumentedTransaction('tx_acquisition');
    } catch (e) {
      acqError = e;
      diagAcq = e.diagnostic;
    }
    assert.ok(acqError, 'Acquisition error was thrown');
    assert.match(acqError.message, /Connection pool timeout/);
    assert.ok(diagAcq, 'Acquisition diagnostic was captured');
    assert.strictEqual(diagAcq.lastActiveStep, 'tx_acquisition');
    assert.ok(diagAcq.activeStepElapsedMs >= 10);
    assert.ok(diagAcq.txElapsedMs >= 10);
    // Asserts exact default production timing shapes
    assert.strictEqual(diagAcq.operationTimings.tUpdateMs, 0);
    assert.strictEqual(diagAcq.operationTimings.tDeleteAnswersMs, 0);
    assert.strictEqual(diagAcq.operationTimings.tCreateAnswersMs, 0);
    assert.strictEqual(diagAcq.operationTimings.tMistakesMs, 0);
    assert.strictEqual(diagAcq.operationTimings.tBookmarksMs, 0);
    assert.strictEqual(diagAcq.operationCounts.deletedAnswersCount, 0);
    assert.strictEqual(diagAcq.operationCounts.createdAnswersCount, 0);
    assert.strictEqual(diagAcq.operationCounts.mistakesInsertedCount, 0);
    assert.strictEqual(diagAcq.operationCounts.bookmarksInsertedCount, 0);

    // 2. Failure at create_user_answers (executes once)
    let diagCreate = null;
    let createError = null;
    try {
      await simulateInstrumentedTransaction('create_user_answers');
    } catch (e) {
      createError = e;
      diagCreate = e.diagnostic;
    }
    assert.ok(createError, 'Create answers error was thrown');
    assert.match(createError.message, /Transaction expired at createMany/);
    assert.ok(diagCreate, 'Create answers diagnostic was captured');
    assert.strictEqual(diagCreate.lastActiveStep, 'create_user_answers');
    assert.ok(diagCreate.activeStepElapsedMs >= 0);
    assert.ok(diagCreate.operationTimings.tUpdateMs >= 5);
    assert.strictEqual(diagCreate.operationTimings.tCreateAnswersMs, 0); // Not completed
    assert.strictEqual(diagCreate.operationCounts.createdAnswersCount, 0);

    // 3. Commit failure on duplicate attempt path (simulates post-callback commit rejection)
    let diagDupCommit = null;
    let dupCommitError = null;
    try {
      await simulateInstrumentedTransaction('commit_duplicate', { isDuplicate: true });
    } catch (e) {
      dupCommitError = e;
      diagDupCommit = e.diagnostic;
    }
    assert.ok(dupCommitError, 'Duplicate commit error was thrown');
    assert.match(dupCommitError.message, /commit failed on duplicate attempt branch/i);
    assert.ok(diagDupCommit, 'Duplicate commit diagnostic was captured');
    assert.strictEqual(diagDupCommit.lastActiveStep, 'tx_committing');
    assert.ok(diagDupCommit.activeStepElapsedMs >= 5);
    assert.ok(diagDupCommit.operationTimings.tUpdateMs >= 5);
    assert.strictEqual(diagDupCommit.operationTimings.tCreateAnswersMs, 0);
    assert.strictEqual(diagDupCommit.operationCounts.createdAnswersCount, 0);
  });

  test('Diagnostic state is isolated across concurrent simulated submissions (Simulation)', async () => {
    // Handler simulating request scope in route.ts
    async function simulateSubmissionRequest(requestId, failStep) {
      const reqStart = performance.now();
      let currentTxStep = 'pre_transaction';
      let stepStartMs = reqStart;
      let tTxStart = 0;
      let tUpdateMs = 0;
      let tDeleteAnswersMs = 0;
      let deletedAnswersCount = 0;
      let tCreateAnswersMs = 0;
      let createdAnswersCount = 0;
      let tMistakesMs = 0;
      let mistakesInsertedCount = 0;
      let tBookmarksMs = 0;
      let bookmarksInsertedCount = 0;

      try {
        tTxStart = performance.now();
        currentTxStep = 'tx_acquisition';
        stepStartMs = tTxStart;

        if (failStep === 'tx_acquisition') {
          await new Promise((r) => setTimeout(r, 20));
          throw new Error(`[${requestId}] Acquisition timeout`);
        }

        currentTxStep = 'tx_entered';
        stepStartMs = performance.now();

        currentTxStep = 'update_attempt_status';
        stepStartMs = performance.now();
        if (failStep === 'update_attempt_status') {
          await new Promise((r) => setTimeout(r, 25));
          throw new Error(`[${requestId}] Failed at update`);
        }
        await new Promise((r) => setTimeout(r, 25));
        tUpdateMs = parseFloat((performance.now() - stepStartMs).toFixed(2));

        currentTxStep = 'create_user_answers';
        stepStartMs = performance.now();
        await new Promise((r) => setTimeout(r, 15));
        if (failStep === 'create_user_answers') {
          throw new Error(`[${requestId}] Failed at createMany`);
        }
        tCreateAnswersMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
        createdAnswersCount = 100;

        currentTxStep = 'tx_committing';
        stepStartMs = performance.now();
        return { success: true };
      } catch (err) {
        const activeStepElapsedMs = parseFloat((performance.now() - stepStartMs).toFixed(2));
        const txElapsedMs = tTxStart > 0 ? parseFloat((performance.now() - tTxStart).toFixed(2)) : 0;
        return {
          requestId,
          lastActiveStep: currentTxStep,
          activeStepElapsedMs,
          txElapsedMs,
          operationTimings: {
            tUpdateMs,
            tDeleteAnswersMs,
            tCreateAnswersMs,
            tMistakesMs,
            tBookmarksMs,
          },
          operationCounts: {
            deletedAnswersCount,
            createdAnswersCount,
            mistakesInsertedCount,
            bookmarksInsertedCount,
          },
          error: err.message,
        };
      }
    }

    // Launch 3 distinct submissions concurrently with staggered failure points
    const [result1, result2, result3] = await Promise.all([
      simulateSubmissionRequest('req-1', 'tx_acquisition'),
      simulateSubmissionRequest('req-2', 'update_attempt_status'),
      simulateSubmissionRequest('req-3', 'create_user_answers'),
    ]);

    // Verify req-1 diagnostic isolation & default timing shapes
    assert.strictEqual(result1.requestId, 'req-1');
    assert.strictEqual(result1.lastActiveStep, 'tx_acquisition');
    assert.ok(result1.activeStepElapsedMs >= 15);
    assert.strictEqual(result1.operationTimings.tUpdateMs, 0);
    assert.strictEqual(result1.operationTimings.tCreateAnswersMs, 0);
    assert.strictEqual(result1.operationCounts.createdAnswersCount, 0);

    // Verify req-2 diagnostic isolation & default timing shapes
    assert.strictEqual(result2.requestId, 'req-2');
    assert.strictEqual(result2.lastActiveStep, 'update_attempt_status');
    assert.ok(result2.activeStepElapsedMs >= 20);
    assert.strictEqual(result2.operationTimings.tUpdateMs, 0); // Failed during update
    assert.strictEqual(result2.operationTimings.tCreateAnswersMs, 0);
    assert.strictEqual(result2.operationCounts.createdAnswersCount, 0);

    // Verify req-3 diagnostic isolation & default timing shapes
    assert.strictEqual(result3.requestId, 'req-3');
    assert.strictEqual(result3.lastActiveStep, 'create_user_answers');
    assert.ok(result3.activeStepElapsedMs >= 10);
    assert.ok(result3.operationTimings.tUpdateMs >= 20); // Completed update before failing at create
    assert.strictEqual(result3.operationTimings.tCreateAnswersMs, 0);
    assert.strictEqual(result3.operationCounts.createdAnswersCount, 0);
  });
});

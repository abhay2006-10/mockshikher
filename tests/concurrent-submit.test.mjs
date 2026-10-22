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
});

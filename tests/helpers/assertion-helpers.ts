/**
 * Assertion Helpers for Standardized Error Testing
 *
 * Provides consistent error assertion patterns across all tests.
 * Ensures all tests verify error type, message, and i18n keys consistently.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

// ===== Types =====

interface ExpectedError {
    /** Expected HTTP status code */
    status?: HttpStatus;
    /** Expected i18n key in response */
    i18nKey?: string;
    /** Expected message substring */
    messageContains?: string;
    /** Expected exact message */
    message?: string;
}

interface I18nErrorResponse {
    i18nKey?: string;
    message?: string;
    [key: string]: unknown;
}

// ===== Standard Error Assertions =====

/**
 * Assert that an async function throws an HttpException with expected properties
 *
 * @example
 * await expectHttpError(
 *   () => service.processPayment(dto),
 *   { status: HttpStatus.NOT_FOUND, i18nKey: 'errors.notFound.invoice' }
 * );
 */
export async function expectHttpError(
    fn: () => Promise<unknown>,
    expected: ExpectedError,
): Promise<void> {
    try {
        await fn();
        throw new Error('Expected function to throw, but it did not');
    } catch (error) {
        assertHttpException(error, expected);
    }
}

/**
 * Assert that an HttpException matches expected properties
 */
export function assertHttpException(error: unknown, expected: ExpectedError): void {
    expect(error).toBeInstanceOf(HttpException);

    const httpError = error as HttpException;

    if (expected.status !== undefined) {
        expect(httpError.getStatus()).toBe(expected.status);
    }

    const response = httpError.getResponse() as I18nErrorResponse;

    if (expected.i18nKey !== undefined) {
        expect(response).toHaveProperty('i18nKey', expected.i18nKey);
    }

    if (expected.message !== undefined) {
        if (typeof response === 'string') {
            expect(response).toBe(expected.message);
        } else {
            expect(response.message).toBe(expected.message);
        }
    }

    if (expected.messageContains !== undefined) {
        if (typeof response === 'string') {
            expect(response).toContain(expected.messageContains);
        } else {
            expect(response.message).toContain(expected.messageContains);
        }
    }
}

// ===== Common Error Assertions =====

/**
 * Assert 404 Not Found error
 */
export async function expectNotFoundError(
    fn: () => Promise<unknown>,
    resourceType: 'invoice' | 'payment' | 'appointment' | 'pet' | 'petOwner' | 'employee' | 'service',
): Promise<void> {
    await expectHttpError(fn, {
        status: HttpStatus.NOT_FOUND,
        i18nKey: `errors.notFound.${resourceType}`,
    });
}

/**
 * Assert 400 Bad Request error
 */
export async function expectBadRequestError(
    fn: () => Promise<unknown>,
    i18nKey: string,
): Promise<void> {
    await expectHttpError(fn, {
        status: HttpStatus.BAD_REQUEST,
        i18nKey,
    });
}

/**
 * Assert 401 Unauthorized error
 */
export async function expectUnauthorizedError(
    fn: () => Promise<unknown>,
): Promise<void> {
    await expectHttpError(fn, {
        status: HttpStatus.UNAUTHORIZED,
    });
}

/**
 * Assert 403 Forbidden error
 */
export async function expectForbiddenError(
    fn: () => Promise<unknown>,
): Promise<void> {
    await expectHttpError(fn, {
        status: HttpStatus.FORBIDDEN,
    });
}

/**
 * Assert 409 Conflict error
 */
export async function expectConflictError(
    fn: () => Promise<unknown>,
    i18nKey?: string,
): Promise<void> {
    await expectHttpError(fn, {
        status: HttpStatus.CONFLICT,
        i18nKey,
    });
}

// ===== Entity Business Logic Assertions =====

/**
 * Assert that an entity method throws a domain error
 */
export function expectDomainError(
    fn: () => void,
    expectedMessage?: string,
): void {
    expect(fn).toThrow(Error);

    if (expectedMessage) {
        expect(fn).toThrow(expectedMessage);
    }
}

/**
 * Assert state transition is valid
 */
export function assertStateTransition<T extends { status: string }>(
    entity: T,
    action: () => void,
    expectedStatus: string,
): void {
    action();
    expect(entity.status).toBe(expectedStatus);
}

/**
 * Assert state transition is blocked
 */
export function assertStateTransitionBlocked(
    action: () => void,
    expectedError: string | RegExp,
): void {
    expect(action).toThrow(expectedError);
}

// ===== Jest Matchers Extensions =====

/**
 * Custom matcher for checking i18n error responses
 * Usage: expect(error).toHaveI18nKey('errors.notFound.invoice')
 */
export function setupCustomMatchers(): void {
    expect.extend({
        toHaveI18nKey(received: HttpException, expectedKey: string) {
            const response = received.getResponse() as I18nErrorResponse;
            const pass = response?.i18nKey === expectedKey;

            return {
                pass,
                message: () =>
                    pass
                        ? `Expected error not to have i18nKey "${expectedKey}"`
                        : `Expected error to have i18nKey "${expectedKey}", but got "${response?.i18nKey}"`,
            };
        },
    });
}

// ===== Export Types for Custom Matchers =====

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toHaveI18nKey(expectedKey: string): R;
        }
    }
}

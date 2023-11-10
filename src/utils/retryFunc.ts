export const retryFunc = async (n: number, callback: () => void, onRetryCallback: (err: Error) => void, onLastFailCallback: (err: Error) => void) => {
    for (let i = 0; i < n; i++) {
        try {
            console.log("attempt :", i);
            return callback();
        } catch (err : unknown) {
            console.log("retrying :", i);
            onRetryCallback(err as Error);
            const isLastAttempt = i + 1 === n;
            if (isLastAttempt) {
                onLastFailCallback(err as Error);
            }
        }
    }
};

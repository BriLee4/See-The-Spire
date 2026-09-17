export const useRunFile = () => {
    return useState<{name: string, data: any} |null>('runFile', () => null)
}
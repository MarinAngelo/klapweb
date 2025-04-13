export const convertNumber = (n: number): number => {
    return parseFloat((0.1 + ((n - 1) / 98) * 0.89).toFixed(2));
};
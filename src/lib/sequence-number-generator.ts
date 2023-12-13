// counter.ts
let count: number = 0;
let accountNumber: number = 0;

const counterGeneratorFunction = function*() {
    while (true) {
        yield {
            sequence: count++,
            accountNumber,
        };
    }
}

let counterGenerator = counterGeneratorFunction();

export const getNextSequenceNumber = (): {
    sequence: number,
    accountNumber: number,
} => {
    return counterGenerator.next().value;
}

export const resetSequenceNumber = (resetValue: number, acctNum: number): void => {
    count = resetValue ;
    accountNumber = acctNum;
    counterGenerator = counterGeneratorFunction();
}

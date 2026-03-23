import input from "sync-input";

interface ItemPrice {
    name: string;
    price: number;
}

const itemPrices: ItemPrice[] = [
    { name: "Bubblegum", price: 202 },
    { name: "Toffee", price: 118 },
    { name: "Ice Cream", price: 2250 },
    { name: "Milk Chocolate", price: 1680 },
    { name: "Doughnut", price: 1075 },
    { name: "Pancake", price: 80 },
];

function logItemPrices(items: readonly ItemPrice[]): void {
    items.forEach((item) => {
        console.log(`${item.name}: $${item.price}`);
    });
}

function calculateIncome(items: readonly ItemPrice[]): number {
    return items.reduce((total, item) => total + item.price, 0);
}

function calculateNetIncome(items: readonly ItemPrice[], staffExpenses: number, otherExpenses: number): number {
    return calculateIncome(items) - staffExpenses - otherExpenses;
}

console.log("Earned amount:");

logItemPrices(itemPrices);

console.log("\n");
console.log(`Income: $${calculateIncome(itemPrices)}`);

const staffExpenses = Number(input("Staff expenses:"));
const otherExpenses = Number(input("Other expenses:"));

console.log(`Net income: $${calculateNetIncome(itemPrices, staffExpenses, otherExpenses)}`);

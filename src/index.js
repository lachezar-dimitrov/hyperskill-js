const input = require("sync-input");

const itemPrices = [
    { name: "Bubblegum", price: 202 },
    { name: "Toffee", price: 118 },
    { name: "Ice Cream", price: 2250 },
    { name: "Milk Chocolate", price: 1680 },
    { name: "Doughnut", price: 1075 },
    { name: "Pancake", price: 80 },
];

function logItemPrices(itemPrices) {
    itemPrices.forEach((item) => {
        console.log(`${item.name}: $${item.price}`);
    });
}

function calculateIncome(itemPrices) {
    return itemPrices.reduce((total, item) => total + item.price, 0);
}

function calculateNetIncome(itemPrices, staffExpenses, otherExpenses) {
    return calculateIncome(itemPrices) - staffExpenses - otherExpenses;
}

console.log("Earned amount:");

logItemPrices(itemPrices);

console.log("\n");
console.log(`Income: $${calculateIncome(itemPrices)}`);

const staffExpenses = Number(input("Staff expenses:"));
const otherExpenses = Number(input("Other expenses:"));

console.log(
    `Net income: $${calculateNetIncome(itemPrices, staffExpenses, otherExpenses)}`,
);
